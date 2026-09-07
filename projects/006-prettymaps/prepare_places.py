"""Choose actual named park features from the same saved OSM snapshot."""
import ast
import json
from pathlib import Path
import geopandas as gp

root=Path(__file__).resolve().parent
parks=gp.read_file(root/'data/green.geojson').to_crs(32651)
places=[]
for name in ['六公园','三公园','一公园','涌金公园']:
    feature=parks.loc[parks['name']==name].iloc[0]
    point=gp.GeoSeries([feature.geometry.representative_point()],crs=32651).to_crs(4326).iloc[0]
    identity=ast.literal_eval(feature['index'])
    places.append({'name':name,'lon':point.x,'lat':point.y,'osm_type':identity[0],'osm_id':int(identity[1]),'url':f'https://www.openstreetmap.org/{identity[0]}/{identity[1]}','position':'representative point inside the clipped feature, not an entrance'})
(root/'data/places.json').write_text(json.dumps(places,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(places,ensure_ascii=False,indent=2))
