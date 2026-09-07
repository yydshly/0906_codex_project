# 图片来源清单

所有 PNG 均为 prettymaps 作者 Marcelo Prates 在官方教程中发布的真实示例，非本项目运行结果。下载后未编辑。地图数据 © OpenStreetMap contributors。

固定提交：`02f85870ced807b7d24ce1764764ff877f9edffd`

上游目录：https://github.com/marceloprates/prettymaps/tree/02f85870ced807b7d24ce1764764ff877f9edffd/docs/img

文件原始地址规则：`https://raw.githubusercontent.com/marceloprates/prettymaps/02f85870ced807b7d24ce1764764ff877f9edffd/docs/img/<文件名>`

| 文件 | 展示内容 |
| --- | --- |
| tour-01-heerhugowaard.png | 荷兰 Heerhugowaard，默认预设 |
| tour-02-minimal-preset.png | 同一地点，minimal 预设 |
| tour-03-macau-custom.png | 澳门，自定义图层和配色；用作项目封面 |
| tour-05-mosaic.png | 阿雷格里港，建筑轮廓拼贴 |
| tour-06-barcelona-plotter.png | 巴塞罗那，绘图仪模式 |
| tour-08-multiplot.png | 阿雷格里港，多区域组合 |
| tour-09-honolulu-hillshade.png | 檀香山，地形阴影 |
| tour-10-garopaba-keypoints.png | 加罗帕巴，地点标注 |

上游 LICENSE 为 AGPL-3.0，副本保存在 projects/006-prettymaps/UPSTREAM-LICENSE。地理数据署名说明：https://www.openstreetmap.org/copyright 。原图总计约 18 MB；除首屏风格图外使用延迟加载，并按需切换文件。

## 第二阶段 · 本地真实生成

`generated/` 中的西湖地图由本项目在 2026-09-07 实际运行固定版本 prettymaps 生成。GeoJSON 数据来源为 OpenStreetMap contributors，经 VK Maps Overpass 公共镜像获取，保存于 projects/006-prettymaps/data/。

- poster-warm / poster-ink / poster-night：同一范围三种配色的纪念海报。
- guide-warm：标出六公园、三公园、一公园、涌金公园；编号与中文排版为本项目补充。
- structure-ink / structure-ink-streets / structure-ink-building：道路建筑组合、道路单层、建筑单层。
- custom-*：页面调用本地服务实际生成的作品；对应 JSON 保存输入和耗时。
- 每张 PNG 配有 SVG；cases.json 记录七张预生成作品与数据清单。

地图真实几何由 prettymaps 处理绘制，标题、比例尺与导览编号由本项目扩展排版。所有输出保留 OSM 与上游库署名。地图数据遵循 ODbL：https://www.openstreetmap.org/copyright 。

## 第三阶段 · 能力对照图

新增 ability-base、ability-texture、ability-outline、ability-roads、ability-circle、ability-rotate，均由 render_capabilities.py 在同一份西湖 GeoJSON 快照上实际生成，时间与方法记录在 generated/abilities.json。

分别展示基准、原生纹理填充、轮廓线稿、道路缓冲加粗、圆形裁剪后绘制、原生几何旋转。圆形裁剪由本项目使用 Shapely 完成；旋转调用 prettymaps.draw.transform_gdfs；线稿不是绘图仪模式。每张均有 PNG 与 SVG，保留数据和代码来源署名。


## 陕西五张场景成品（2026-09-07）

`shaanxi/city`、`travel`、`ride`、`article`、`web` 的 PNG/SVG 均由本项目 `render_shaanxi.py` 在真实西安 OSM 地物上运行 prettymaps 生成。标题、图例及排版为项目补充。`ride` 是真实道路计算的策划线，经 GPX 读取绘制，不是实骑截图或轨迹记录。生成时间和地标原始对象见 `shaanxi/scenarios.json`，路线方法见 `shaanxi/route-source.json`。所有图片保留数据 © OpenStreetMap contributors 与库来源署名；不是第三方作品或虚构截图。


## 引导架构图

`architecture.svg` 为本项目原创研究示意图，由 `render_architecture.py` 生成，可编辑和复现；不是软件截图。实线框表示源库能力与本地实测，虚线框表示待建设的共享能力及产品方向。依据见 `research-summary.md` 和 `capabilities.md`，不代表上游具有规划、游戏或大模型能力。
