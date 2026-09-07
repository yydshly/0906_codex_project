"""Bounded real OSM road import after the upstream graph query failed."""
import json,time
from pathlib import Path
import geopandas as gp
from shapely.geometry import LineString,box
from prepare_shaanxi import bounded_overpass_request,DATA,ox

if __name__=='__main__':
 start=time.perf_counter()
 perimeter=gp.read_file(DATA/'perimeter.geojson')
 x0,y0,x1,y1=perimeter.to_crs(4326).total_bounds
 query=f'[out:json][timeout:60];way["highway"]["area"!="yes"]["highway"!~"motorway|motorway_link|proposed|construction"]({y0},{x0},{y1},{x1});(._;>;);out body;'
 raw=bounded_overpass_request({'data':query})
 nodes={e['id']:(e['lon'],e['lat']) for e in raw['elements'] if e['type']=='node'}
 rows=[]
 for e in raw['elements']:
  if e['type']!='way':continue
  coords=[nodes[n] for n in e['nodes'] if n in nodes]
  if len(coords)<2:continue
  tags=e.get('tags',{})
  rows.append({'osmid':e['id'],'name':tags.get('name'),'highway':tags.get('highway'),'bicycle':tags.get('bicycle'),'access':tags.get('access'),'geometry':LineString(coords)})
 roads=gp.GeoDataFrame(rows,crs=4326)
 roads.geometry=roads.geometry.intersection(perimeter.geometry.iloc[0])
 roads=roads[~roads.geometry.is_empty]
 roads.to_file(DATA/'streets.geojson',driver='GeoJSON')
 # Retain original way/node references for a traceable illustrative route.
 (DATA/'roads-raw.json').write_text(json.dumps(raw,ensure_ascii=False),encoding='utf-8')
 counts={p.stem:len(gp.read_file(p)) for p in DATA.glob('*.geojson')}
 assert counts['streets']>0 and counts['building']>0
 manifest={'place':'陕西 · 西安城内','center':[34.260,108.944],'radius_m':1800,'shape':'square','counts':counts,'road_count_unit':'OSM ways, not unique streets or directed graph edges','source':'OpenStreetMap contributors','endpoint':ox.settings.overpass_url+'/interpreter','fetched_at':time.strftime('%Y-%m-%dT%H:%M:%S%z'),'osm_base_timestamp':raw.get('osm3s',{}).get('timestamp_osm_base'),'upstream_commit':'02f85870ced807b7d24ce1764764ff877f9edffd','transport':'bounded GET; streets imported from OSM ways after original graph query failed','roads_import_seconds':round(time.perf_counter()-start,2)}
 (DATA/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(manifest,ensure_ascii=False),flush=True)
