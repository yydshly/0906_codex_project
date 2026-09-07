"""Render real cached OSM layers with prettymaps; no fabricated map geometry."""
import hashlib
import json
import os
import time
from pathlib import Path

os.environ.setdefault('MPLBACKEND', 'Agg')
import geopandas as gp
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt, font_manager
import numpy as np
import prettymaps.draw as draw

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
OUT = ROOT.parents[1] / 'docs' / 'assets' / 'projects' / '006-prettymaps' / 'generated'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts/msyh.ttc')
if FONT.exists():
    font_manager.fontManager.addfont(str(FONT))
    plt.rcParams['font.family'] = font_manager.FontProperties(fname=str(FONT)).get_name()
plt.rcParams['axes.unicode_minus'] = False

THEMES = {
    'warm': {'paper':'#f6edda','water':'#94c6cc','green':'#b7c899','road':'#fffaf0','edge':'#645c48','buildings':['#dca578','#bf7960','#e9c99f'],'ink':'#324d43'},
    'ink': {'paper':'#faf9f5','water':'#e2e8e7','green':'#edf0e7','road':'#ffffff','edge':'#3d4b49','buildings':['#c1cbc6','#dde1db','#a8b7af'],'ink':'#243c33'},
    'night': {'paper':'#152e3a','water':'#244d5d','green':'#38544e','road':'#cfbc8d','edge':'#b7c4ba','buildings':['#c9ac73','#e0ca98','#9e936f'],'ink':'#e7dbc0'},
}
SCENES = {'poster': ('西湖边的日常', 'CITY MEMORY / HANGZHOU'),
          'guide': ('沿着湖岸，认识杭州', 'NEIGHBOURHOOD / PLACES'),
          'structure': ('看见城市的纹理', 'URBAN TEXTURE / REAL GEOMETRY')}
_LAYERS = None

def get_layers():
    global _LAYERS
    if _LAYERS is None:
        _LAYERS = {p.stem:gp.read_file(p).to_crs(32651) for p in DATA.glob('*.geojson') if p.stem in {'perimeter','water','green','building','streets'}}
    return _LAYERS

def render(options, stem=None):
    start = time.perf_counter()
    scene = options.get('scene','poster')
    theme = options.get('theme','warm')
    if scene not in SCENES or theme not in THEMES:
        raise ValueError('请选择页面提供的场景与风格。')
    title = options.get('title','').strip() or SCENES[scene][0]
    if len(title)>24 or any(ord(c)<32 for c in title):
        raise ValueError('标题请使用 24 字以内的单行文字。')
    visible = options.get('layers',['water','green','streets','building'])
    if not isinstance(visible,list) or not visible or any(v not in ['water','green','streets','building'] for v in visible):
        raise ValueError('请至少选择一个有效图层。')
    visible = sorted(set(visible))
    normalized = {'scene':scene,'theme':theme,'title':title,'layers':visible}
    name = stem or ('custom-' + hashlib.sha256(json.dumps(normalized,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16])
    colors = THEMES[theme]
    source = get_layers()
    fig = plt.figure(figsize=(8,10),dpi=160,facecolor=colors['paper'])
    ax = fig.add_axes([.065,.17,.87,.70],aspect='equal',facecolor=colors['paper'])
    try:
        style = {
            'perimeter': {'fc':colors['paper'],'ec':'none','zorder':0},
            'water': {'fc':colors['water'],'ec':'none','zorder':1},
            'green': {'fc':colors['green'],'ec':'none','zorder':2},
            'streets': {'fc':colors['road'],'ec':colors['edge'],'lw':.13,'zorder':3},
            'building': {'palette':colors['buildings'],'ec':colors['edge'],'lw':.20,'zorder':4},
        }
        np.random.seed(12)
        for layer in ['perimeter','water','green','streets','building']:
            if layer != 'perimeter' and layer not in visible:
                continue
            gdf = source.get(layer)
            if gdf is not None and not gdf.empty:
                draw.plot_gdf(layer,gdf.copy(),ax,mode='matplotlib',width=2.2,**style[layer])
        x0,y0,x1,y1=source['perimeter'].total_bounds
        ax.set_xlim(x0,x1); ax.set_ylim(y0,y1); ax.axis('off')
        places = []
        if scene == 'guide':
            # Names and marker positions come only from the saved OSM snapshot.
            selected = json.loads((DATA/'places.json').read_text(encoding='utf-8'))
            for n,p in enumerate(selected,1):
                point = gp.GeoSeries.from_xy([p['lon']],[p['lat']],crs=4326).to_crs(32651).iloc[0]
                ax.scatter([point.x],[point.y],s=185,c=colors['ink'],edgecolors=colors['paper'],linewidths=1.3,zorder=10)
                ax.text(point.x,point.y,str(n),color=colors['paper'],fontsize=8,ha='center',va='center',zorder=11)
                places.append(p)
        ax.annotate('N',xy=(.96,.98),xytext=(.96,.89),xycoords='axes fraction',ha='center',color=colors['ink'],fontsize=9,arrowprops={'arrowstyle':'->','color':colors['ink'],'lw':1})
        # Scale in the map's metre-based projected coordinates.
        sx,sy=x0+100,y0+100
        ax.plot([sx,sx+500],[sy,sy],color=colors['ink'],lw=2,zorder=12)
        ax.text(sx+250,sy+30,'500 m',ha='center',color=colors['ink'],fontsize=7,zorder=12)
        fig.text(.5,.945,title,ha='center',fontsize=22,color=colors['ink'],weight='medium')
        fig.text(.5,.906,SCENES[scene][1],ha='center',fontsize=8,color=colors['ink'])
        if places:
            for n,p in enumerate(places,1):
                fig.text(.09 + ((n-1)%2)*.44,.138-((n-1)//2)*.025,f"{n:02d}  {p['name'][:18]}",fontsize=8,color=colors['ink'])
        else:
            fig.text(.5,.125,'杭州 · 西湖东北岸   /   30.253° N, 120.153° E',ha='center',fontsize=9,color=colors['ink'])
            fig.text(.5,.095,'真实地理数据 · 本地生成作品',ha='center',fontsize=8,color=colors['ink'])
        fig.text(.5,.038,'data © OpenStreetMap contributors | github.com/marceloprates/prettymaps',ha='center',fontsize=6,color=colors['ink'])
        fig.text(.5,.023,'Research Lab · 006 / 基于固定数据快照，非实时导航',ha='center',fontsize=6,color=colors['ink'])
        fig.savefig(OUT/f'{name}.png',dpi=160,facecolor=colors['paper'])
        fig.savefig(OUT/f'{name}.svg',facecolor=colors['paper'])
        receipt = {'options':normalized,'engine':'prettymaps.draw.plot_gdf + Matplotlib layout',
                   'generated_at':time.strftime('%Y-%m-%dT%H:%M:%S%z'),
                   'seconds':round(time.perf_counter()-start,2),
                   'image':f'../../assets/projects/006-prettymaps/generated/{name}.png',
                   'svg':f'../../assets/projects/006-prettymaps/generated/{name}.svg',
                   'counts':{k:len(v) for k,v in source.items() if k in visible},'places':places}
        (OUT/f'{name}.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf-8')
        return receipt
    finally:
        plt.close(fig)

if __name__ == '__main__':
    manifest=json.loads((DATA/'manifest.json').read_text(encoding='utf-8'))
    cases=[]
    for scene,theme,layers in [('poster','warm',['water','green','streets','building']),('poster','ink',['water','green','streets','building']),('poster','night',['water','green','streets','building']),('guide','warm',['water','green','streets','building']),('structure','ink',['streets','building']),('structure','ink',['streets']),('structure','ink',['building'])]:
        stem = f"{scene}-{theme}" + ('-'+layers[0] if len(layers)==1 else '')
        item=render({'scene':scene,'theme':theme,'layers':layers},stem)
        cases.append(item)
        print(stem,item['seconds'],flush=True)
    (OUT/'cases.json').write_text(json.dumps({'data':manifest,'cases':cases},ensure_ascii=False,indent=2),encoding='utf-8')
