const assets = '../../assets/projects/006-prettymaps/';
const styles = {
  default: ['tour-01-heerhugowaard.png', '让城市轮廓成为画面', '用多种颜色区分画面中的地理要素，观察道路、水域与建筑共同形成的图案。', '荷兰 Heerhugowaard 的官方默认风格地图'],
  minimal: ['tour-02-minimal-preset.png', '用更克制的样式看同一地点', '切换到 minimal 预设，比较相同地点的色彩和视觉层次。预设可以同时改变图层参数与样式，不只是给图片套滤镜。', '荷兰 Heerhugowaard 的官方简约风格地图'],
};
const capabilities = {
  layers: ['tour-03-macau-custom.png', '澳门 / MACAU', '决定哪些东西被画出来', '把水域、绿地、道路、建筑分成不同图层，分别设置颜色、描边和纹理。可以按需要保留或关闭图层。', '家乡海报、街区插画、旅行明信片。', '浅蓝水域、暖色建筑与道路轮廓。这里的颜色是艺术样式，不代表统计数值。'],
  buildings: ['tour-05-mosaic.png', '阿雷格里港 / PORTO ALEGRE', '把建筑轮廓单独拿出来', '返回结果中保留建筑的地理数据。官方示例继续用绘图代码，把各个建筑轮廓排成一张拼贴。', '建筑形态观察、城市图案设计、地理教学。', '这是一组独立建筑轮廓的排版，不代表它们在城市里的实际相邻位置。拼贴需要额外代码。'],
  plotter: ['tour-06-barcelona-plotter.png', '巴塞罗那 / BARCELONA', '把地图变成笔可以画的线稿', '使用 plotter 模式与 vsketch，把地理形状转换成适用于笔式绘图仪的 SVG。', '绘图仪创作、线稿作品、实体地图艺术。', '关注建筑边界和道路留白。这是作者的绘图仪模式示例，不是本项目的实物打印照片。'],
  multiplot: ['tour-08-multiplot.png', '阿雷格里港 / PORTO ALEGRE', '让多个区域出现在同一画布', '使用 multiplot 为多个区域设置各自的参数，在一张画布里呈现不同区域和配色。', '社区地图、分区表达、城市主题拼图。', '不同区域使用不同配色。它展示区域组合能力，不表示自动生成统计分区。'],
  hillshade: ['tour-09-honolulu-hillshade.png', '檀香山 / HONOLULU', '让地形的起伏浮现出来', '额外获取高程数据，根据模拟光照生成地形阴影，再与地图叠加。', '山地城市展示、户外主题地图、地形教学。', '明暗表现地形起伏。这是平面阴影效果，不能旋转成三维场景。'],
  keypoints: ['tour-10-garopaba-keypoints.png', '加罗帕巴 / GAROPABA', '让值得关注的地点有名字', '按地理标签查找地点，也可按名称匹配特定地点，将地点名称标注到地图上。', '景点介绍、旅行配图、地点故事地图。', '标签来自地理数据。正式导览仍需核实地点信息，并检查文字是否重叠。'],
};
function select(button, selector) {
  document.querySelectorAll(selector).forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}
document.querySelectorAll('[data-style]').forEach(button => button.addEventListener('click', () => {
  const [file, title, description, alt] = styles[button.dataset.style];
  select(button, '[data-style]');
  const img = document.getElementById('style-image');
  img.src = assets + file; img.alt = alt;
  document.getElementById('style-title').textContent = title;
  document.getElementById('style-description').textContent = description;
  document.getElementById('style-original').href = assets + file;
}));
document.querySelectorAll('[data-cap]').forEach(button => button.addEventListener('click', () => {
  const [file, place, title, description, use, look] = capabilities[button.dataset.cap];
  select(button, '[data-cap]');
  const img = document.getElementById('cap-image');
  img.src = assets + file; img.alt = place + '：' + title + '（作者真实示例）';
  Object.entries({ place, title, description, use, look }).forEach(([key, value]) => document.getElementById('cap-' + key).textContent = value);
  document.getElementById('cap-original').href = assets + file;
}));
