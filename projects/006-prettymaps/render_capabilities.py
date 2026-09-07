"""Controlled visual comparisons on the same real OSM snapshot."""
import json
import time
from copy import deepcopy
import numpy as np
from matplotlib import pyplot as plt
from shapely.geometry import Point
import prettymaps.draw as draw
from render_scene import get_layers, OUT, DATA

BASE={
 'perimeter':{'fc':'#f6edda','ec':'none','zorder':0},
 'water':{'fc':'#94c6cc','ec':'none','zorder':1},
 'green':{'fc':'#b7c899','ec':'none','zorder':2},
 'streets':{'fc':'#fffaf0','ec':'#645c48','lw':.13,'zorder':3},
 'building':{'palette':['#dca578','#bf7960','#e9c99f'],'ec':'#645c48','lw':.20,'zorder':4},
}
SPECS=[
 ('base','原始对照','相同范围、相同数据，作为后面五张图的比较基准。','保留水域、公园、道路、建筑；固定随机种子与图层顺序。'),
 ('texture','纹理填充','观察湖面斜线与公园点纹，地理轮廓保持不变。','使用原生 hatch 与 hatch_c，为图层添加不同填充纹理。'),
 ('outline','轮廓线稿','去掉彩色填充，保留建筑与地物边界。','使用原生 fill=False、ec 和 lw；这是 Matplotlib 线稿，不是绘图仪模式。'),
 ('roads','道路强调','观察道路明显变粗，路网在画面中更突出。','道路 buffer 参数由 2.2 m 改为 7 m，边框保持一致；这是艺术宽度，不是真实路宽。'),
 ('circle','圆形构图','同一个中心裁成圆形，得到适合徽章或纪念画的构图。','对真实 GeoDataFrame 做圆形裁剪后用 prettymaps 绘制；原生 plot 也提供 circle/radius。'),
 ('rotate','旋转构图','将同一批地物整体旋转 25°，比较构图变化。','实际调用 prettymaps.draw.transform_gdfs(rotation=25)，统一几何变换，画面按原窗口裁切。'),
]

def main():
 records=[]
 source=get_layers()
 bounds=source['perimeter'].total_bounds
 x0,y0,x1,y1=bounds
 for key,title,look,method in SPECS:
  start=time.perf_counter()
  layers={k:v.copy() for k,v in source.items()}
  style=deepcopy(BASE)
  if key=='texture':
   style['water'].update(hatch='///',hatch_c='#629aab')
   style['green'].update(hatch='...',hatch_c='#638057')
  if key=='outline':
   for layer in ['water','green','building']:
    style[layer]={'fill':False,'ec':'#354c43','lw':.45,'zorder':BASE[layer]['zorder']}
  if key=='circle':
   boundary=Point((x0+x1)/2,(y0+y1)/2).buffer(1150)
   for layer in layers:
    layers[layer].geometry=layers[layer].geometry.intersection(boundary)
    layers[layer]=layers[layer][~layers[layer].geometry.is_empty].copy()
  if key=='rotate':
   layers=draw.transform_gdfs(layers,rotation=25)
  fig,ax=plt.subplots(figsize=(8,8),dpi=140)
  fig.patch.set_facecolor('#f6edda')
  ax.set_position([.04,.10,.92,.80])
  np.random.seed(12)
  for layer in BASE:
   draw.plot_gdf(layer,layers[layer],ax,mode='matplotlib',width=7 if key=='roads' else 2.2,**style[layer])
  ax.set_xlim(x0,x1);ax.set_ylim(y0,y1);ax.set_aspect('equal');ax.axis('off')
  fig.text(.5,.955,title+' · 西湖',ha='center',fontsize=20,color='#324d43')
  fig.text(.5,.061,'同一份真实 OSM 快照 / 本项目实际生成',ha='center',fontsize=8,color='#324d43')
  fig.text(.5,.029,'data © OpenStreetMap contributors | github.com/marceloprates/prettymaps',ha='center',fontsize=6,color='#324d43')
  stem='ability-'+key
  fig.savefig(OUT/(stem+'.png'),dpi=140)
  fig.savefig(OUT/(stem+'.svg'))
  plt.close(fig)
  record={'key':key,'title':title,'look':look,'method':method,'image':stem+'.png','svg':stem+'.svg','seconds':round(time.perf_counter()-start,2),'generated_at':time.strftime('%Y-%m-%dT%H:%M:%S%z')}
  records.append(record)
  print(record,flush=True)
 (OUT/'abilities.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':main()
