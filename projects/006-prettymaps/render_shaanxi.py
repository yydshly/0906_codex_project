"""Real Xi'an data, four distinct communication scenarios and a web variant."""
import ast,json,time,math
from pathlib import Path
import xml.etree.ElementTree as ET
import geopandas as gp
import networkx as nx
import numpy as np
from shapely.geometry import LineString,Point,box
from matplotlib import pyplot as plt
import prettymaps.draw as draw
from prettymaps.gpx import read_track
from render_scene import ROOT  # Uses the verified Chinese font and Agg backend.

DATA=ROOT/'data-shaanxi'
OUT=ROOT.parents[1]/'docs/assets/projects/006-prettymaps/shaanxi'
OUT.mkdir(parents=True,exist_ok=True)
CRS=32649
LAYERS={p.stem:gp.read_file(p).to_crs(CRS) for p in DATA.glob('*.geojson')}
PLACES=[]
for name in ['钟楼','鼓楼','含光门','永宁门']:
 row=LAYERS['heritage'].loc[LAYERS['heritage']['name']==name].iloc[0]
 point=row.geometry.representative_point()
 lonlat=gp.GeoSeries([point],crs=CRS).to_crs(4326).iloc[0]
 kind,osm_id=ast.literal_eval(row['index'])
 PLACES.append({'name':name,'x':point.x,'y':point.y,'lon':lonlat.x,'lat':lonlat.y,'url':f'https://www.openstreetmap.org/{kind}/{osm_id}'})

def planned_route():
 raw=json.loads((DATA/'roads-raw.json').read_text(encoding='utf-8'))
 coords={e['id']:(e['lon'],e['lat']) for e in raw['elements'] if e['type']=='node'}
 ids=list(coords)
 projected=gp.GeoSeries.from_xy([coords[i][0] for i in ids],[coords[i][1] for i in ids],crs=4326).to_crs(CRS)
 xy={i:(p.x,p.y) for i,p in zip(ids,projected)}
 graph=nx.Graph()
 for way in raw['elements']:
  if way['type']!='way':continue
  tags=way.get('tags',{})
  if tags.get('highway') in ['steps','motorway','motorway_link','trunk','trunk_link','footway'] or tags.get('bicycle')=='no' or tags.get('access') in ['no','private']:continue
  for u,v in zip(way['nodes'],way['nodes'][1:]):
   if u in xy and v in xy:
    graph.add_edge(u,v,weight=math.dist(xy[u],xy[v]),osmid=way['id'])
 graph=graph.subgraph(max(nx.connected_components(graph),key=len)).copy()
 targets=[min(graph.nodes,key=lambda n:math.dist(xy[n],(p['x'],p['y']))) for p in PLACES]
 path=[]
 for a,b in zip(targets,targets[1:]+targets[:1]):
  segment=nx.shortest_path(graph,a,b,weight='weight')
  path.extend(segment if not path else segment[1:])
 gpx=ET.Element('gpx',version='1.1',creator='Prettymaps Research Lab - PLANNED EXAMPLE',xmlns='http://www.topografix.com/GPX/1/1')
 trk=ET.SubElement(gpx,'trk');ET.SubElement(trk,'name').text='西安路网策划示例：非实骑记录，非导航'
 seg=ET.SubElement(trk,'trkseg')
 for node in path:ET.SubElement(seg,'trkpt',lat=str(coords[node][1]),lon=str(coords[node][0]))
 ET.ElementTree(gpx).write(OUT/'xian-planned-example.gpx',encoding='utf-8',xml_declaration=True)
 # Demonstrate the library's real GPX reader; the input is explicitly planned.
 track=read_track(str(OUT/'xian-planned-example.gpx'))
 gdf=gp.GeoDataFrame(geometry=[track],crs=4326).to_crs(CRS)
 info={'kind':'OSM-road-network planned illustration, not a recorded ride','sequence':[p['name'] for p in PLACES]+[PLACES[0]['name']],'length_km':round(gdf.geometry.length.sum()/1000,2),'points':len(path),'limitations':'Undirected road graph; turn restrictions, one-way cycling rules and current access are not validated; landmark snaps are not entrances.'}
 (OUT/'route-source.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
 return gdf,info

TRACK,ROUTE=planned_route()

def map_base(ax,bounds,mode='city'):
 dark=mode=='web'
 colors={'paper':'#18332f' if dark else '#f7f1e5','water':'#3d605c' if dark else '#cadbdd','green':'#425e4a' if dark else '#dde1cf','road':'#708577' if dark else '#fffdf7','building':'#36534a' if dark else '#ded6c8','ink':'#f0dcc0' if dark else '#5c6354','accent':'#e4bb80' if dark else '#a95337'}
 style={'water':{'fc':colors['water'],'ec':'none','zorder':1},'green':{'fc':colors['green'],'ec':'none','zorder':2},'streets':{'fc':colors['road'],'ec':colors['ink'],'lw':.06,'zorder':3},'building':{'fc':colors['building'],'ec':'none','zorder':2.5}}
 clip=box(*bounds)
 for layer in ['water','green','building','streets']:
  gdf=LAYERS[layer].copy()
  gdf=gdf[gdf.geometry.intersects(clip)].copy()
  # Tiny footprints are omitted for legibility, never replaced with invented ones.
  if layer=='building':gdf=gdf[gdf.geometry.area>=60].copy()
  gdf.geometry=gdf.geometry.intersection(clip)
  gdf=gdf[~gdf.geometry.is_empty].copy()
  if not gdf.empty:draw.plot_gdf(layer,gdf,ax,mode='matplotlib',width=3.3,**style[layer])
 # Highlight actual heritage geometries, including the southern city wall.
 h=LAYERS['heritage'].copy()
 h=h[h['name'].isin([p['name'] for p in PLACES]+['西安城墙'])].copy()
 h.geometry=h.geometry.intersection(clip);h=h[~h.geometry.is_empty]
 heritage_color='#929480' if mode=='ride' else colors['accent']
 draw.plot_gdf('heritage',h,ax,mode='matplotlib',fc=heritage_color,ec=heritage_color,lw=.8,zorder=5,dilate_points=7,dilate_lines=5)
 ax.set_xlim(bounds[0],bounds[2]);ax.set_ylim(bounds[1],bounds[3]);ax.set_aspect('equal');ax.axis('off')
 return colors

def marks(ax,places,colors,label=True):
 offsets={'钟楼':(18,24),'鼓楼':(-65,26),'含光门':(-25,-28),'永宁门':(18,-27)}
 for n,p in enumerate(places,1):
  ax.scatter(p['x'],p['y'],s=110,c=colors['accent'],edgecolors=colors['paper'],linewidths=1.2,zorder=10)
  ax.text(p['x'],p['y'],str(n),ha='center',va='center',fontsize=7,color=colors['paper'],zorder=11)
  if label:ax.annotate(p['name'],(p['x'],p['y']),xytext=offsets[p['name']],textcoords='offset points',fontsize=10,color=colors['ink'],bbox={'fc':colors['paper'],'ec':'none','pad':3},arrowprops={'arrowstyle':'-','color':colors['accent']},zorder=12)

def save(fig,key,meta,start):
 for ext in ['png','svg']:fig.savefig(OUT/f'{key}.{ext}',dpi=160,facecolor=fig.get_facecolor())
 plt.close(fig)
 meta.update(key=key,image=f'{key}.png',svg=f'{key}.svg',generated_at=time.strftime('%Y-%m-%dT%H:%M:%S%z'),seconds=round(time.perf_counter()-start,2))
 print(key,meta['seconds'],flush=True)
 return meta

def footer(fig,color,route=False):
 fig.text(.5,.038,'data © OpenStreetMap contributors | github.com/marceloprates/prettymaps',ha='center',fontsize=6,color=color)
 fig.text(.5,.021,'陕西西安 · 本项目实际生成 | '+('策划路线，非实骑记录、非导航' if route else '真实地物快照，地标点不是入口'),ha='center',fontsize=6,color=color)

def main():
 records=[]
 coords=np.array([(p['x'],p['y']) for p in PLACES]);mn=coords.min(0)-450;mx=coords.max(0)+450
 cx,cy=(mn+mx)/2;half=max(mx-mn)/2
 bounds=(cx-half,cy-half,cx+half,cy+half)
 for kind in ['city','travel','ride','article','web']:
  start=time.perf_counter();wide=kind in ['article','web'];paper='#18332f' if kind=='web' else '#f7f1e5'
  fig=plt.figure(figsize=(12,6.5) if wide else (8,10),dpi=160,facecolor=paper)
  if kind=='city':
   ax=fig.add_axes([.06,.22,.88,.64]);c=map_base(ax,bounds);marks(ax,PLACES,c)
   fig.text(.08,.944,'用四个地标，认识西安城内',fontsize=22,color=c['ink'])
   fig.text(.08,.905,'陕西 / 西安   ·   钟鼓楼与南城门的空间关系',fontsize=10,color=c['accent'])
   for i,p in enumerate(PLACES):fig.text(.09+(i%2)*.45,.175-(i//2)*.033,f"0{i+1}  {p['name']}",fontsize=12,color=c['ink'])
   fig.text(.09,.083,'看位置与街区关系；不用于识别入口或规划通行路线。',fontsize=8,color=c['ink'])
   meta={'title':'城市 / 街区介绍','question':'第一次了解西安，钟楼、鼓楼和南城门分别在哪里？','value':'保留道路与地标，淡化建筑，让读者先建立位置关系。','use':'城市介绍页、街区导览卡、展览说明板。'}
  elif kind=='travel':
   ax=fig.add_axes([.08,.22,.84,.61]);c=map_base(ax,bounds);marks(ax,PLACES,c,label=False)
   fig.text(.5,.947,'长 安 印 记',ha='center',fontsize=34,color=c['accent'])
   fig.text(.5,.903,'XI’AN / A PLACE TO REMEMBER',ha='center',fontsize=9,color=c['ink'])
   fig.text(.5,.865,'旅行纪念版式示例 · 日期与个人记录待填写',ha='center',fontsize=9,color=c['ink'])
   fig.text(.5,.17,'钟楼 · 鼓楼 · 含光门 · 永宁门',ha='center',fontsize=13,color=c['accent'])
   fig.text(.5,.13,'把地点的真实轮廓，留在一张可以收藏的作品里。',ha='center',fontsize=9,color=c['ink'])
   meta={'title':'旅行纪念作品','question':'旅行结束后，除了照片，还能怎样保留对一个地方的记忆？','value':'真实街区轮廓成为作品主体，地点与标题组成纪念卡。','use':'旅行手账、纪念海报、明信片；没有虚构到访日期或个人经历。'}
  elif kind=='ride':
   ax=fig.add_axes([.06,.23,.88,.62]);c=map_base(ax,bounds,mode='ride')
   draw.plot_gdf('gpx',TRACK.copy(),ax,mode='matplotlib',ec='#b7432f',lw=2.6,zorder=9)
   marks(ax,PLACES,c,label=False)
   fig.text(.5,.947,'古城慢行 · 路线纪念',ha='center',fontsize=25,color=c['accent'])
   fig.text(.5,.907,'骑行纪念版式预演 / 非实骑记录',ha='center',fontsize=12,color=c['ink'])
   fig.text(.5,.873,'示意线来自 OSM 路网计算；未核验骑行通行条件',ha='center',fontsize=8,color=c['accent'])
   fig.text(.5,.185,f"{ROUTE['length_km']:.2f} km",ha='center',fontsize=29,color=c['accent'])
   fig.text(.5,.149,'策划示意线长度，不是实际骑行里程',ha='center',fontsize=9,color=c['ink'])
   fig.text(.5,.113,'钟楼 → 鼓楼 → 含光门 → 永宁门 → 钟楼',ha='center',fontsize=9,color=c['ink'])
   fig.text(.5,.079,'真实纪念作品应替换为骑行设备导出的 GPX/KML。',ha='center',fontsize=8,color=c['ink'])
   meta={'title':'骑行纪念版式','question':'怎样把设备导出的轨迹做成一张纪念图？','value':'用地图承托轨迹，用标题和里程形成作品的重点。','use':'本例以真实道路计算的策划线演示 GPX 读取与绘制；不是用户实骑，不是推荐路线。'}
  else:
   ax=fig.add_axes([.42,.12,.55,.77]);c=map_base(ax,bounds,mode=kind);marks(ax,PLACES,c,label=False)
   fig.text(.055,.855,'长安街区观察',fontsize=11,color=c['accent'])
   fig.text(.055,.715,'从钟鼓楼，\n读懂一片街区。',fontsize=26,color=c['ink'],linespacing=1.5)
   fig.text(.055,.43,'钟楼与鼓楼的位置关系，\n向南延伸到城门一带。\n地图为文字提供空间参照。',fontsize=11,color=c['ink'],linespacing=1.9)
   fig.text(.055,.245,'01 钟楼     02 鼓楼',fontsize=10,color=c['accent'])
   fig.text(.055,.205,'03 含光门   04 永宁门',fontsize=10,color=c['accent'])
   fig.text(.055,.12,'陕西 · 西安 / 网站与文章配图示例',fontsize=9,color=c['accent'])
   meta={'title':'网站深色横幅' if kind=='web' else '文章浅色配图','question':'文章谈论位置关系，读者怎样不用切到地图软件也能看懂？','value':'用低干扰底图与有限地标辅助正文；预留标题区域，并适配网站浅深色主题。','use':'城市专题文章、网站横幅、地点介绍页；地图是内容配图，不是导航控件。'}
  footer(fig,c['ink'],kind=='ride')
  records.append(save(fig,kind,meta,start))
 result={'place':'陕西 · 西安城内','manifest':json.loads((DATA/'manifest.json').read_text(encoding='utf-8')),'landmarks':PLACES,'route':ROUTE,'cases':records,'render_note':'prettymaps draws true geodata; page/typography/markers/route planning are project extensions; buildings under 60 square metres omitted for readability.'}
 (OUT/'scenarios.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':main()
