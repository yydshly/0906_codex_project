"""Fetch the real Xi'an study area; preserve raw road nodes for the GPX example."""
import json
import hashlib
import os
import time
from pathlib import Path

os.environ.setdefault('MPLBACKEND', 'Agg')
import matplotlib
matplotlib.use('Agg')
import osmnx as ox
import prettymaps
import requests
from osmnx import _overpass

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data-shaanxi'
DATA.mkdir(exist_ok=True)
ox.settings.use_cache = True
ox.settings.cache_folder = str(ROOT / '.cache' / 'osmnx')
ox.settings.requests_timeout = 60
ox.settings.overpass_url = 'https://maps.mail.ru/osm/tools/overpass/api'
ox.settings.log_console = True
ox.settings.http_user_agent = 'PrettymapsResearchLab/1.0 (local educational map experiment)'

# The standard OSMnx transport gets stuck polling the public instance's status
# endpoint in this environment. Use bounded GET requests to the same documented
# Overpass interpreter. OSMnx still parses the original responses; prettymaps
# still runs the complete plot pipeline. No geometry is replaced or fabricated.
def bounded_overpass_request(data):
    query = data['data']
    cache = ROOT / '.cache' / 'overpass-get'
    cache.mkdir(parents=True,exist_ok=True)
    file = cache / (hashlib.sha256(query.encode()).hexdigest()+'.json')
    if file.exists():
        return json.loads(file.read_text(encoding='utf-8'))
    response = requests.get(ox.settings.overpass_url+'/interpreter',params=data,
                            headers={'User-Agent':ox.settings.http_user_agent},timeout=90)
    response.raise_for_status()
    result=response.json()
    if 'remark' in result:raise RuntimeError(result['remark'])
    file.write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
    print('Real OSM response:',len(result.get('elements',[])),'elements',flush=True)
    return result

_overpass._overpass_request = bounded_overpass_request

if __name__ == '__main__':
    start = time.perf_counter()
    layers = {
        'perimeter': {},
        'water': {'tags': {'natural': 'water'}},
        'green': {'tags': {'leisure': 'park'}},
        'heritage': {'tags': {'historic': True}},
        'building': {'tags': {'building': True}},
        'streets': {'width': 2.2, 'custom_filter': '["highway"]["area"!="yes"]["highway"!~"motorway|motorway_link|proposed|construction"]'},
    }
    result = prettymaps.plot(
        (34.260, 108.944), radius=1800, circle=False,
        use_preset=False, layers=layers,
        style={
            'background': {'fc':'#f7f3e8','ec':'none','pad':1.03},
            'perimeter': {'fc':'#f7f3e8','ec':'none','zorder':0},
            'water': {'fc':'#9ecbd0','ec':'none','zorder':1},
            'green': {'fc':'#bdcba2','ec':'none','zorder':2},
            'streets': {'fc':'#fffaf0','ec':'#667667','lw':0.2,'zorder':3},
            'building': {'palette':['#d8a884','#bf7963','#ead5ae'],'ec':'#745c4b','lw':0.3,'zorder':4},
        }, show=False, figsize=(8,8), logging=True,
    )
    counts = {}
    for name, gdf in result.geodataframes.items():
        counts[name] = len(gdf)
        if gdf.empty:
            continue
        # Keep identity/name columns and real geometry; avoid list-valued attributes.
        keep = [c for c in ['name', 'name:zh', 'name:en', 'highway', 'building', 'leisure', 'natural', 'historic', 'geometry'] if c in gdf.columns]
        export = gdf[keep].copy()
        for c in export.columns:
            if c != 'geometry':
                export[c] = export[c].map(lambda v: str(v) if isinstance(v, (list, dict)) else v)
        export.to_file(DATA / f'{name}.geojson', driver='GeoJSON')
    if counts.get('building', 0) == 0:
        raise RuntimeError(f'Required real layers missing: {counts}')
    # Import raw ways even when the graph query works: the route example needs
    # traceable node IDs, and this keeps the saved road format consistent.
    import subprocess
    import sys
    subprocess.run([sys.executable, str(ROOT / 'prepare_shaanxi_roads.py')], check=True)
    if counts.get('streets', 0) == 0:
        print('Native road query was empty; real OSM ways imported by fallback.', flush=True)
        sys.exit(0)
    result.fig.savefig(DATA / 'first-run.png', dpi=130)
    manifest = {'place':'陕西 · 西安城内', 'center':[34.260,108.944], 'radius_m':1800,
                'shape':'square', 'source':'OpenStreetMap contributors',
                'upstream_commit':'02f85870ced807b7d24ce1764764ff877f9edffd',
                'fetched_at':time.strftime('%Y-%m-%dT%H:%M:%S%z'),
                'endpoint':ox.settings.overpass_url+'/interpreter',
                'transport':'bounded GET adapter for OSMnx; original Overpass JSON',
                'fetch_and_first_plot_seconds':round(time.perf_counter()-start,2),
                'counts':counts}
    # The road importer writes the combined manifest with actual exported counts.
    print(json.dumps(manifest,ensure_ascii=False),flush=True)
