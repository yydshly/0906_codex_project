"""Generate the original research guide as editable SVG (not a screenshot)."""
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parents[2] / 'docs/assets/projects/006-prettymaps/architecture.svg'
parts = ['''<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1230" viewBox="0 0 1440 1230" role="img" aria-labelledby="title desc">
<title id="title">Prettymaps：源库能力与产品扩展基座</title><desc id="desc">从真实 OSM 数据到程序绘图；已完成地图作品验证。未来增加分析、编辑和自然语言入口，支撑内容、旅行、策划与设计。虚线框表示待建设能力。</desc>
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="none" stroke="#667f78" stroke-width="1.5"/></marker></defs>
<rect width="1440" height="1230" fill="#f6f4ed"/><g font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif">''']

def text(x, y, value, size=21, fill='#29453f', weight='400'):
    parts.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}">{escape(value)}</text>')

def box(x, y, w, h, title, lines, fill='#ffffff', dashed=False):
    dash='stroke-dasharray="8 6"' if dashed else ''
    parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{fill}" stroke="#becdc5" stroke-width="2" {dash}/>')
    text(x+24,y+40,title,24,weight='600')
    for i,line in enumerate(lines): text(x+24,y+78+i*31,line,19)

def arrow(x1,y1,x2,y2):
    parts.append(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="#667f78" stroke-width="2" fill="none" marker-end="url(#arrow)"/>')

text(50,48,'006 / PRETTYMAPS · 研究引导',18,'#7a8579')
text(50,102,'真实空间数据，如何成为一系列产品的基础？',39,weight='600')
text(50,144,'源库负责地图绘制；我们通过实测理解它，再逐步增加分析、编辑和产品能力。',22)
text(50,196,'01  源库能力 · 已有基础',23,weight='600')
box(50,218,365,206,'OSM 真实地理数据',['道路与建筑轮廓','水域、公园、地标名称与标签','是结构化数据，不只是一张图片','覆盖程度随地区与标签而变化'])
box(462,218,465,206,'prettymaps 获取、处理与绘制',['OSMnx：按区域、图层和标签获取','Shapely 等：几何处理、裁剪与缓冲','Matplotlib：颜色、线宽、纹理、构图','按明确参数绘图；不原生理解用户意图'],'#e3ece4')
box(975,218,415,206,'地图作品输出',['地图图层可选择、样式可定制','保存 PNG / SVG 等格式','支持 GPX/KML 轨迹输入','不是导航或完整规划设计系统'])
arrow(419,321,454,321);arrow(932,321,967,321)
text(50,477,'02  本项目验证 · 真实成品与补充工程',23,weight='600')
box(50,500,1340,150,'西湖 13 张 + 西安 5 张 = 18 张本地成品与效果对照',[
'已完成：街区介绍、纪念版式、文章配图、图层与样式对照；西湖支持本地修改参数重新出图。',
'我们补充：数据快照、中文排版、地标编号、网页和生成记录。骑行 GPX 为策划示例，非实骑记录。'],'#fff7e7')
arrow(720,657,720,686)
text(50,717,'03  后续共享基座 · 虚线框均为待建设方向',23,weight='600')
box(50,740,420,155,'数据与空间分析',['数据质量、业务数据接入','过滤、距离、路线与覆盖计算'],dashed=True)
box(510,740,420,155,'内容编辑与方案管理',['点位、轨迹、照片、区域编辑','模板保存、撤销、方案比较'],dashed=True)
box(970,740,420,155,'大模型操作入口',['理解需求 → 配置 → 校验执行','预览修改；计算与绘图交给工具'],dashed=True)
arrow(720,905,720,937)
text(50,970,'04  产品价值 · 共享基础能力，各自补充业务规则与数据',23,weight='600')
for x,title,lines in [
    (50,'内容创作',['城市文章、主题配图']),
    (392,'个人记忆',['旅行档案、骑行纪念']),
    (734,'活动与探索',['研学、任务、游览策划']),
    (1076,'分析与设计',['覆盖比较、空间概念、游戏'])]:
    box(x,991,314,112,title,lines,dashed=True)
text(50,1152,'推进：主题地图编辑 → 第二场景复用 → 自然语言操作 → 按需加入分析与方案比较',23,weight='600')
text(50,1193,'原创研究架构图 · 2026-09-07 · 扩展非源库承诺，非市场收益验证；源库版本、许可证与数据来源见研究记录。',17,'#6d7972')
parts.append('</g></svg>')
OUT.write_text(''.join(parts),encoding='utf-8')
print(OUT)
