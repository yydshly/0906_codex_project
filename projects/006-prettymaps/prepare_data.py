"""Fetch one real West Lake study area through the pinned prettymaps library."""
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
DATA = ROOT / 'data'
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
        'building': {'tags': {'building': True}},
        'streets': {'width': 2.2, 'custom_filter': '["highway"]["area"!="yes"]["highway"!~"motorway|motorway_link|proposed|construction"]'},
    }
    result = prettymaps.plot(
        (30.253, 120.153), radius=1200, circle=False,
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
        keep = [c for c in ['name', 'name:zh', 'name:en', 'highway', 'building', 'leisure', 'natural', 'geometry'] if c in gdf.columns]
        export = gdf[keep].copy()
        for c in export.columns:
            if c != 'geometry':
                export[c] = export[c].map(lambda v: str(v) if isinstance(v, (list, dict)) else v)
        export.to_file(DATA / f'{name}.geojson', driver='GeoJSON')
    if counts.get('streets', 0) == 0 or counts.get('water', 0) == 0 or counts.get('building', 0) == 0:
        raise RuntimeError(f'Required real layers missing: {counts}')
    result.fig.savefig(DATA / 'first-run.png', dpi=130)
    manifest = {'place':'杭州 · 西湖东北岸', 'center':[30.253,120.153], 'radius_m':1200,
                'shape':'square', 'source':'OpenStreetMap contributors',
                'upstream_commit':'02f85870ced807b7d24ce1764764ff877f9edffd',
                'fetched_at':time.strftime('%Y-%m-%dT%H:%M:%S%z'),
                'endpoint':ox.settings.overpass_url+'/interpreter',
                'transport':'bounded GET adapter for OSMnx; original Overpass JSON',
                'fetch_and_first_plot_seconds':round(time.perf_counter()-start,2),
                'counts':counts}
    (DATA / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False),flush=True)
