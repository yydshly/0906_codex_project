const liveAssets = '../../assets/projects/006-prettymaps/generated/';
const descriptions = {
  poster: ['想把一次西湖旅行做成纪念海报','输入西湖东北岸的位置与范围，保留水域、公园、道路和建筑，选择配色，添加自己的标题，再导出图片。','查询真实地物、处理几何形状、按样式绘制地图。标题排版和网页操作由本项目补充。'],
  guide: ['想做一张介绍湖岸周边的配图','在这片真实湖岸地图上标出几个有名字的地点，用编号对应说明，读者就能知道它们的大致位置。','prettymaps 绘制真实底图。本项目从返回的地物数据选择地点，并额外排版编号与名称；没有生成步行路线。'],
  structure: ['想看清道路与建筑怎样组成街区','保留道路与建筑，或者只看其中一层。观察相同范围内街道的走向、街区的大小和建筑的轮廓。','按需要绘制地理图层，让水域、公园和装饰颜色退场。这里是形态观察，没有计算城市优劣或规划指标。'],
};
const themeNames={warm:'暖色纪念',ink:'清淡墨色',night:'深夜金色'};
let currentScene='poster', dataset=null, currentResult=null, available=false, busy=false;
const $=id=>document.getElementById(id);
function exampleName(item){
  const layers=item.options.layers;
  return layers.length===1 ? (layers[0]==='streets'?'只看道路':'只看建筑') : themeNames[item.options.theme];
}
function showResult(item, updateForm=true){
  currentResult=item;
  $('real-image').src=item.image;
  $('real-image').alt=`杭州西湖东北岸：${item.options.title}，本地 prettymaps 实际生成作品`;
  $('result-full').href=item.image;$('result-png').href=item.image;$('result-svg').href=item.svg;
  $('result-label').textContent=item.options.title+' / '+themeNames[item.options.theme];
  $('render-receipt').textContent=`实际绘制 ${item.seconds} 秒 · ${item.generated_at.replace('T',' ')} · prettymaps 地图 + 本项目排版`;
  if(updateForm){
    $('map-title').value=item.options.title;$('map-theme').value=item.options.theme;
    document.querySelectorAll('[name="layer"]').forEach(input=>input.checked=item.options.layers.includes(input.value));
  }
  $('real-places').hidden=!item.places.length;
  $('place-items').replaceChildren();
  item.places.forEach(p=>{const li=document.createElement('li');const a=document.createElement('a');a.textContent=p.name;a.href=p.url;a.target='_blank';a.rel='noopener';li.append(a);$('place-items').append(li);});
}
function chooseScene(scene){
  if(busy||!dataset)return;
  currentScene=scene;
  document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===scene)));
  const [heading,story,gain]=descriptions[scene];
  $('scene-heading').textContent=heading;$('scene-story').textContent=story;$('scene-gain').textContent=gain;
  const cases=dataset.cases.filter(c=>c.options.scene===scene);
  $('result-example').replaceChildren();
  cases.forEach((c,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=exampleName(c);$('result-example').append(option);});
  showResult(cases[0]);
  $('generate-status').textContent=available?'可修改标题、风格和图层，再点击生成。':'当前为成品浏览模式；启动本地生成服务后可调整参数出图。';
}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>chooseScene(b.dataset.scene)));
$('result-example').addEventListener('change',()=>{
  const cases=dataset.cases.filter(c=>c.options.scene===currentScene);
  showResult(cases[Number($('result-example').value)]);
  $('generate-status').textContent='正在展示本次实际生成的成品。';
});
$('render-form').addEventListener('input',()=>{$('generate-status').textContent='参数已修改，点击「生成我的地图」后更新左侧作品。';});
$('render-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!available||busy)return;
  const layers=[...document.querySelectorAll('[name="layer"]:checked')].map(i=>i.value);
  if(!layers.length){$('generate-status').textContent='请至少保留一个图层。';return;}
  busy=true;$('render-fields').disabled=true;$('result-example').disabled=true;
  document.querySelectorAll('[data-scene]').forEach(b=>b.disabled=true);
  $('generate-status').textContent='正在用真实地理数据绘制，请稍候…';$('generate-button').textContent='正在生成…';
  try{
    const response=await fetch('/api/prettymaps/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scene:currentScene,theme:$('map-theme').value,title:$('map-title').value,layers}),signal:AbortSignal.timeout(90000)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'生成失败');
    showResult(result);$('result-example').selectedIndex=-1;
    $('generate-status').textContent=`生成完成，用时 ${result.seconds} 秒。可以放大查看或下载作品。`;
  }catch(error){$('generate-status').textContent=`未生成新作品：${error.message}。上一张作品仍保留。`;}
  finally{busy=false;$('render-fields').disabled=false;$('result-example').disabled=false;document.querySelectorAll('[data-scene]').forEach(b=>b.disabled=false);$('generate-button').textContent='生成我的地图 →';}
});
async function initReal(){
  try{
    const response=await fetch(liveAssets+'cases.json');if(!response.ok)throw new Error('生成记录暂时不可用');
    dataset=await response.json();const c=dataset.data.counts;
    $('real-counts').textContent=`${c.building} 个建筑要素 · ${c.streets} 条道路边`;
    $('real-fetched').textContent=`另有 ${c.water} 个水域要素、${c.green} 个公园要素。获取于 ${dataset.data.fetched_at.slice(0,10)}。数量只描述当前 OSM 快照；道路边不是独立道路条数。`;
    try{const health=await fetch('/api/prettymaps/health',{signal:AbortSignal.timeout(3000)});if(health.ok)available=(await health.json()).available===true;}catch{}
    $('live-connection').textContent=available?'● 本地生成服务已连接':'○ 成品浏览模式';
    $('render-fields').disabled=!available;chooseScene('poster');
  }catch(error){$('render-receipt').textContent=error.message;$('live-connection').textContent='生成记录加载失败';$('result-example').disabled=true;}
}
initReal();
