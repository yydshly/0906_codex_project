# 能力清单与效果证据

[返回项目](README.md) · [意义与扩展](value-and-roadmap.md)

研究固定提交：`02f85870ced807b7d24ce1764764ff877f9edffd`。依据已安装的该版本源码和官方教程。这里按能力维度整理，不把几个预设当成效果上限。

## 验证标记

- **本地实测**：实际执行绘图并保存结果。
- **上游示例**：作者教程中有真实示例，本项目未独立复现该接口。
- **源码核查**：固定版本存在对应代码，尚未实测。
- **项目扩展**：由我们在库之外补充的操作或排版。

## 六类能力矩阵

| 维度 | 具体能力 | 参数或接口 | 证据与边界 |
| --- | --- | --- | --- |
| 地理输入 | 经纬度定位、范围控制 | plot(query, radius) | 本地实测：西湖，中心 30.253/120.153，半范围1200米 |
| 地理输入 | 地址、OSM ID、自定义区域 | parse_query / get_perimeter | 源码核查；地址依赖地理编码服务；自定义边界为 GeoDataFrame |
| 图层 | 建筑、道路、水域、公园等标签筛选 | layers / tags / custom_filter | 本地实测四类；其他地物取决于当地 OSM 内容，不能保证覆盖完整 |
| 图层 | 隐藏、单独绘制与叠放 | layers、style.zorder | 本地实测道路与建筑单层；本地控件控制离线绘制层 |
| 样式 | 填色与调色板 | fc / palette | 本地实测暖色、墨色、夜色；palette 随机选色本身没有统计含义 |
| 样式 | 描边、透明度、纹理 | ec / lw / alpha / hatch / hatch_c | 填充纹理、轮廓线稿已实测；alpha 接口已核查，未单独生成对照图 |
| 样式 | 道路宽度与类型宽度表 | width / graph_to_shapely | 实测 buffer 2.2m→7m；为中心线两侧的缓冲距离，不能称为道路实测全宽；类型字典在原生预设中存在 |
| 构图 | 方形、圆形与区域边界 | circle / radius / dilate | 方形原生 plot 实测；圆形效果通过快照圆裁剪后绘制，原生 circle 接口仅源码核查 |
| 构图 | 平移、缩放、旋转 | x / y / scale_x / scale_y / rotation | 原生 transform_gdfs 旋转25°实测；其他变换仅源码核查。变换后地图不应直接当作原坐标底图叠加 |
| 构图 | 同画布多区域组合 | multiplot / Subplot | 上游阿雷格里港示例；不保证任意投影区域都可直接拼接 |
| 信息叠加 | 原生地点检索与名称标注 | keypoints / draw_keypoints | 上游加罗帕巴示例；我们的四公园编号图用 Matplotlib 自行排版，不能算原生标注接口复现 |
| 信息叠加 | GPX/KML 轨迹读取与自动范围 | gpx / gpx_style / read_track | 陕西阶段已实测策划 GPX 读取与绘制；真实设备轨迹、KML 和自动范围待验证；不是路径规划器 |
| 信息叠加 | 高程阴影 | hillshade / obtain_elevation | 上游檀香山示例；需额外高程数据和环境依赖，属于二维阴影 |
| 结果 | PNG / SVG | Matplotlib Figure.savefig | 本地实测；本项目补充下载按钮、标题和生成记录 |
| 结果 | 绘图仪 SVG | mode='plotter' / vsketch | 上游巴塞罗那示例；与 Matplotlib SVG 不同，未验证实物绘图仪 |
| 复用 | 返回地理图层与绘图对象 | Plot.geodataframes / fig / ax | 本地保存 GeoJSON 并离线绘制；建筑拼贴是基于返回数据另写绘图代码 |
| 复用 | JSON 预设读取、覆盖和保存 | presets / preset / create_preset | 源码核查；当前本地三主题由我们配置，不是上游预设名称 |
| 复用 | 数据后处理 | postprocessing | 源码核查：接收并返回分层 GeoDataFrame，具体业务处理仍需自己开发 |

## 本地效果目录

页面保留两套互补展示：场景回答“做什么用”，对照图回答“具体改变了什么”。

| 组别 | 图片 | 看什么 |
| --- | --- | --- |
| 纪念海报 | poster-warm / poster-ink / poster-night | 相同数据的三套配色，中文排版 |
| 地点导览 | guide-warm | 四个真实公园的编号、名称与对应位置 |
| 图层选择 | structure-ink / structure-ink-streets / structure-ink-building | 道路与建筑组合及各自单层 |
| 基准图 | ability-base | 后续效果共同的真实数据与构图基准 |
| 纹理 | ability-texture | 水域斜线、公园点纹 |
| 线稿 | ability-outline | 去掉水域、公园、建筑填色后保留边界 |
| 道路 | ability-roads | 道路缓冲距离2.2米改为7米；非真实路宽 |
| 圆形 | ability-circle | 中心1150米圆形裁剪，按原窗口展示 |
| 旋转 | ability-rotate | 统一旋转25°，按原窗口裁切 |

文件位于 [生成作品目录](../../docs/assets/projects/006-prettymaps/generated/)，每张均有 PNG/SVG。[场景记录](../../docs/assets/projects/006-prettymaps/generated/cases.json)、[能力记录](../../docs/assets/projects/006-prettymaps/generated/abilities.json)。

重现新增效果：

```powershell
$env:PYTHONUTF8='1'
projects/006-prettymaps/.venv/Scripts/python.exe projects/006-prettymaps/render_capabilities.py
```

程序固定数据和随机种子。圆形裁剪可能改变保留要素和调色板分配顺序，旋转会改变画面覆盖；这些是构图实验，不是仅改颜色的实验。

## 预设不是能力上限

当前固定提交包含10个 JSON 文件：abraca-redencao、barcelona-plotter、barcelona、cb-bf-f、default、heerhugowaard、macao、minimal、plotter、tijuca。

预设组合了图层、颜色、线条、边界等参数。自定义样式可以产生更多组合，但“任意艺术风格”不等于都能由该库实现。原生二维几何绘制不能直接产生逼真卫星图、真实水彩笔触或三维城市。

## 核心原理与适用边界

地点 → OSMnx 查询 → GeoPandas 分层 → 投影到米制坐标 → Shapely 缓冲/裁剪/变换 → Matplotlib 或 vsketch 绘制。

地图布局来自真实地物。道路中心线经 buffer 扩成可填充的面，建筑轮廓应用配色与描边。样式改变不创造缺失地物。渲染质量受数据完整性、坐标一致性、查询服务、字体与依赖环境影响。

## 固定版本来源

- [draw.py](https://github.com/marceloprates/prettymaps/blob/02f85870ced807b7d24ce1764764ff877f9edffd/prettymaps/draw.py)：绘制、样式、变换、预设、输出。
- [fetch.py](https://github.com/marceloprates/prettymaps/blob/02f85870ced807b7d24ce1764764ff877f9edffd/prettymaps/fetch.py)：范围、标签与地理数据。
- [gpx.py](https://github.com/marceloprates/prettymaps/blob/02f85870ced807b7d24ce1764764ff877f9edffd/prettymaps/gpx.py)：轨迹。
- [教程](https://github.com/marceloprates/prettymaps/blob/02f85870ced807b7d24ce1764764ff877f9edffd/docs/tutorial.md)：上游效果证据。
