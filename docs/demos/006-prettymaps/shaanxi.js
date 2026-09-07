const sxRoot='../../assets/projects/006-prettymaps/shaanxi/';
const sxGroups={city:['city'],memory:['travel','ride'],editorial:['article','web']};
const sxNames={city:'街区介绍图',travel:'旅行纪念卡',ride:'骑行纪念版式（策划线）',article:'文章配图 · 浅色',web:'网站横幅 · 深色'};
const sxInstructions={city:['做一张自己的街区介绍图','确定介绍范围 → 选择少量地标 → 核对名称与位置 → 导出图片，放进介绍页面。'],travel:['做一张真实旅行纪念作品','选择真实到访地点 → 添加自己的标题和日期 → 根据需要放入获准使用的照片 → 导出或打印。当前示例没有声称任何人到访过。'],ride:['把自己的骑行记录做成作品','从设备导出实际 GPX/KML → 检查轨迹与隐私范围 → 叠加地图 → 核对里程与原记录 → 添加标题导出。prettymaps 不负责记录骑行或规划可通行路线。'],article:['让一篇文章拥有合适的地图配图','明确文章要解释的位置关系 → 只突出相关地物 → 设置与网站相同的色彩与尺寸 → 插入正文并写清图注。'],web:['让地图适应网站的深色视觉','使用同一数据与构图，替换为深色底与浅色强调。地图是静态配图；若要点位点击、缩放与导航，需要另外开发。']};
let sxData=null;
const sx=id=>document.getElementById(id);
function showSx(key){
 const item=sxData.cases.find(c=>c.key===key);if(!item)return;
 sx('sx-image').src=sxRoot+item.image;sx('sx-image').alt='陕西西安真实场景作品：'+item.title;
 sx('sx-png').href=sxRoot+item.image;sx('sx-download').href=sxRoot+item.image;sx('sx-svg').href=sxRoot+item.svg;
 sx('sx-question').textContent=item.question;sx('sx-value').textContent=item.value;sx('sx-use').textContent=item.use;
 sx('sx-next-title').textContent=sxInstructions[key][0];sx('sx-next').textContent=sxInstructions[key][1];
 sx('sx-route-note').hidden=key!=='ride';
 sx('sx-receipt').textContent=`本项目实际生成 · ${item.seconds} 秒 · ${item.generated_at.replace('T',' ')} · 当前切换为成品预览`;
}
function setSxGroup(group){if(!sxData)return;document.querySelectorAll('[data-sx-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sxScene===group)));sx('sx-variant').replaceChildren();sxGroups[group].forEach(key=>{const o=document.createElement('option');o.value=key;o.textContent=sxNames[key];sx('sx-variant').append(o);});showSx(sxGroups[group][0]);}
document.querySelectorAll('[data-sx-scene]').forEach(b=>b.addEventListener('click',()=>setSxGroup(b.dataset.sxScene)));
sx('sx-variant').addEventListener('change',()=>showSx(sx('sx-variant').value));
(async()=>{try{const response=await fetch(sxRoot+'scenarios.json');if(!response.ok)throw new Error('生成记录加载失败');sxData=await response.json();const m=sxData.manifest;sx('sx-data').textContent=`数据获取于 ${m.fetched_at.slice(0,10)}，范围为西安城内约 3.6 × 3.6 km。本次保存 ${m.counts.building} 个建筑要素、${m.counts.streets} 条 OSM 道路要素；成品按主题再次裁剪。数量不等于现实中地物总数。`;sxData.landmarks.forEach(p=>{const li=document.createElement('li');const a=document.createElement('a');a.textContent=p.name+' · 原始 OSM 对象';a.href=p.url;a.target='_blank';a.rel='noopener';li.append(a);sx('sx-landmarks').append(li);});setSxGroup('city');}catch(error){sx('sx-receipt').textContent=error.message;}})();
