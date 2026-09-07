# 陕西场景：地图能帮我们完成什么

[打开五张成品的交互展示](../../docs/demos/006-prettymaps/shaanxi.html) · [返回项目](README.md)

本次选取西安钟楼、鼓楼、含光门、永宁门及周边真实街区，完成三类用途、五张 PNG/SVG 成品。其价值在于把地理位置转成可阅读、可收藏、可出版的视觉内容。当前成果是静态成品浏览；没有接入任意地点在线生成。

## 三类使用场景

| 使用任务 | 真实需求与本次效果 | 对我们的意义 | 使用条件与衡量方式 |
| --- | --- | --- | --- |
| 介绍城市或街区 | 第一次读西安介绍的人，需要知道几个地标怎么分布。[街区介绍图](../../docs/assets/projects/006-prettymaps/shaanxi/city.png)淡化建筑，突出四个编号地标和城墙。 | 给城市介绍页、街区卡片提供空间参照；正文说到的位置能在一张图上找到。 | 编辑仍需选择地标、核对图注；看读者能否对应名称与位置。该范围只是西安城内局部，不代表全市。 |
| 旅行纪念 | 旅行结束后，把去过的地方和自己的标题做成可分享或打印的作品。[旅行纪念卡](../../docs/assets/projects/006-prettymaps/shaanxi/travel.png)展示“长安印记”的版式。 | 可以成为游记封面、纪念卡、个人旅行档案的输出模板。 | 本例没有用户行程，不声明这些地方均已到访。实际作品需替换为真实地点和文字。 |
| 骑行纪念 | 将设备轨迹叠加在真实街区上，让路线成为作品主角。[骑行纪念版式](../../docs/assets/projects/006-prettymaps/shaanxi/ride.png)已运行 GPX 读取和绘制。 | 为真实 GPX 提供可复用的纪念作品模板，后续可以加入经核对的日期、距离。 | 本例使用路网计算的策划线，非实骑记录、非推荐线路。约 4.84 km 仅为示意线长度。真实作品需用户轨迹。 |
| 网站或文章配图 | 文章介绍钟鼓楼到城门一带，地图与文字并排，编号对应地标。[浅色文章图](../../docs/assets/projects/006-prettymaps/shaanxi/article.png)、[深色网站图](../../docs/assets/projects/006-prettymaps/shaanxi/web.png)。 | 形成尺寸、色彩、标题区统一的内容配图模板，后续多篇城市文章可复用。 | 主题必须涉及空间关系；只为填满版面加入地图，价值有限。看配图能否帮助读者理解正文。 |

## 对我们优先做什么

最容易落地的是把文章配图用于一篇具体的西安街区介绍，并把四个编号与正文地标说明对应起来。我们已经得到可以直接插入网页的 PNG，以及可继续排版的 SVG。

下一步可将“范围、地标、标题、配色、画幅”保存成模板，复用到陕西其他城市或街区。换地点仍需要重新获取并核查数据，本次没有展示未运行过的延安、汉中等地点效果。

旅行和骑行作品需要个人经历作为输入。获得真实 GPX 后可以沿用绘制模板，但仍需检查轨迹、隐私范围及距离，才能形成有个人意义的作品。库不会替用户记录骑行，也不会自动生成旅行故事。

因此，该库可以承担内容生产中的地图绘制环节；选题、地标取舍、正文、排版和个人记录由我们补充。本次没有测量转化率、商业收益或实际设计工时节省，不能把这些当作已验证成果。

## 实际运行与原理

研究版本沿用固定提交 `02f85870ced807b7d24ce1764764ff877f9edffd`，安装元数据版本 1.4.2，代码许可见 [UPSTREAM-LICENSE](UPSTREAM-LICENSE)。

1. 通过 prettymaps / OSMnx 获取真实建筑、水域、公园、历史地物，保存 GeoJSON。原生道路图请求未成功返回道路，因此另以有时间限制的 Overpass GET 获取真实 highway ways 和节点；这是本项目的数据适配，不是一次完整成功的原生西安道路绘图。
2. 在西安适用的 UTM 49N（EPSG:32649）投影中裁剪图层，省略面积小于 60 平方米的建筑以改善阅读。使用 `prettymaps.draw.plot_gdf()` 绘制，使用 Matplotlib 补充中文标题、编号、图例及画幅布局。
3. 四个地标的名称、原始 OSM 对象编号与坐标来自历史地物层。标注取代表点，不能当作入口或骑行抵达点。
4. 骑行版从原始道路节点构建无向图，排除部分明显不适用道路，按四个地标附近节点计算最短连接，写入无时间、高程的策划 GPX，再实际调用 `prettymaps.gpx.read_track()` 读取绘制。未处理单行、转向限制和现时通行条件，因此不能用于导航。

数据抓取日期：2026-09-07，中心 `(34.260, 108.944)`、半范围 1800 米，约 3.6 × 3.6 km；成品按四地标范围再次裁剪。保存 20270 个建筑、1361 条 OSM 道路要素、25 个公园、16 个水域、23 个历史地物。这是快照要素数量，非现实总量；道路是 OSM ways，不能与西湖实验的有向道路图边直接比较。

数据见 [data-shaanxi/manifest.json](data-shaanxi/manifest.json)，成品时间、地标链接与绘制耗时见 [scenarios.json](../../docs/assets/projects/006-prettymaps/shaanxi/scenarios.json)，策划来源见 [route-source.json](../../docs/assets/projects/006-prettymaps/shaanxi/route-source.json)。图像保留 OSM 与 prettymaps 署名。

## 复现方式

在仓库根目录、已有项目虚拟环境与数据快照时运行：

```powershell
$env:PYTHONUTF8='1'
projects/006-prettymaps/.venv/Scripts/python.exe projects/006-prettymaps/render_shaanxi.py
```

确实需要更新数据时先运行 `prepare_shaanxi.py`，它会自动调用 `prepare_shaanxi_roads.py` 保存原始道路与节点，再运行上述绘图脚本。公共服务可能限流或不可用；已有快照出图无需联网。环境安装方法见项目 README。

运行已有 `server.py` 后打开 `http://127.0.0.1:8767/demos/006-prettymaps/shaanxi.html`。本专题只切换已生成的成品，普通静态服务器也能展示，支持放大与 PNG/SVG 下载。

## 地理与背景来源

- [OpenStreetMap：本次西安区域](https://www.openstreetmap.org/#map=15/34.2600/108.9440)，地图数据 © OpenStreetMap contributors，[ODbL 署名与许可](https://www.openstreetmap.org/copyright)。各地标原始对象链接保存在成品清单及页面中。
- [陕西地方志：西安市志·城市基础设施](https://dfz.shaanxi.gov.cn/zslm/fzzlk/xbsxsxz/xbsxz/xas_16198/201405/P020240923626369225675.pdf)，作为钟鼓楼与城市道路关系的背景核对来源。
- [关中书院官方简介](https://gzsy.xawl.edu.cn/sygk/syjj.htm)，作为永宁门一带相关街区背景；本次未将书院位置另行手工添加到地图。
- [prettymaps 上游](https://github.com/marceloprates/prettymaps)：库能力与实现来源。本文的成品是本项目运行输出，不是上游截图。
