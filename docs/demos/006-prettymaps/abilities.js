const effectRoot='../../assets/projects/006-prettymaps/generated/';
let effects=null;
async function selectEffect(key){
  try{
    if(!effects){const response=await fetch(effectRoot+'abilities.json');if(!response.ok)throw new Error('效果记录加载失败');effects=await response.json();}
    const item=effects.find(e=>e.key===key);if(!item)return;
    document.querySelectorAll('[data-effect]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.effect===key)));
    document.getElementById('effect-label').textContent=item.title+' / 本项目实际生成';
    document.getElementById('effect-title').textContent=item.title;
    document.getElementById('effect-look').textContent=item.look;
    document.getElementById('effect-method').textContent=item.method;
    const img=document.getElementById('effect-image');img.src=effectRoot+item.image;img.alt='西湖真实数据效果对照：'+item.title;
    document.getElementById('effect-png').href=effectRoot+item.image;
    document.getElementById('effect-svg').href=effectRoot+item.svg;
    document.getElementById('effect-time').textContent=`实际绘制 ${item.seconds} 秒 · 当前切换已生成成品`;
  }catch(error){document.getElementById('effect-time').textContent=error.message;}
}
document.querySelectorAll('[data-effect]').forEach(b=>b.addEventListener('click',()=>selectEffect(b.dataset.effect)));
selectEffect('texture');
