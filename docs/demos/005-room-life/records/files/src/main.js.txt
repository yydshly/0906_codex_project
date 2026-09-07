import {LifeWorld} from './simulation.js';
import {RoomView} from './view.js';
import {OPTIONS,DEFAULT_APPEARANCE,PALETTES,SKINS,HAIR_COLORS,readAppearance,saveAppearance} from './appearance.js';
const $=s=>document.querySelector(s),world=new LifeWorld(),canvas=$('#scene');
let view,ready=false,last=performance.now(),uiAt=0;
const keys=new Set();
let appearance={...DEFAULT_APPEARANCE},savedAppearance=null;
const labels={face:'脸型',hair:'发型',hairColor:'发色',skin:'肤色',top:'上装',bottom:'裤装',shoes:'鞋子',palette:'穿搭配色'};
for(const key of ['face','skin','hair','hairColor','top','bottom','shoes','palette']){
  const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=labels[key];field.append(legend);
  const row=document.createElement('div');row.className='wardrobe-choices';
  for(const [id,label] of OPTIONS[key]){
    const button=document.createElement('button');button.type='button';button.dataset.appearance=key;button.dataset.choice=id;button.textContent=label;
    const color=key==='skin'?SKINS[id]:key==='hairColor'?HAIR_COLORS[id]:key==='palette'?PALETTES[id].top:null;
    if(color){button.classList.add('tone-choice');button.style.setProperty('--tone',color);}
    button.onclick=()=>{if(!ready||view.characterVersion==='v1')return;appearance={...appearance,[key]:id};view.setAppearance(appearance);appearanceUI();};
    row.append(button);
  }
  field.append(row);$('#wardrobeOptions').append(field);
}
function appearanceUI(message){
  const old=view?.characterVersion==='v1';
  document.querySelectorAll('button[data-appearance]').forEach(b=>{b.disabled=old||!ready;b.setAttribute('aria-pressed',String(appearance[b.dataset.appearance]===b.dataset.choice));});
  for(const id of ['appearanceSave','appearanceRestore','appearanceDefault'])$('#'+id).disabled=old||!ready||(id==='appearanceRestore'&&!savedAppearance);
  const dirty=JSON.stringify(appearance)!==JSON.stringify(savedAppearance);
  $('#appearanceStatus').textContent=message??(old?'当前查看初版；切回 V2 继续打扮。':savedAppearance?(dirty?'试穿中 · 有未保存的修改':'已保存 · 下次打开自动恢复'):'试穿中 · 点击保存留住这套形象');
  canvas.dataset.appearance=JSON.stringify(appearance);
}
$('#wardrobePreview').onclick=()=>{view?.portrait('front');revealScene();};
$('#wardrobeOpen').onclick=()=>{view?.portrait('front');$('.wardrobe').scrollIntoView({behavior:'instant',block:'start'});};
$('#appearanceSave').onclick=()=>{
  try{saveAppearance(localStorage,appearance);savedAppearance={...appearance};appearanceUI('已保存 · 下次打开自动恢复');}
  catch{appearanceUI('当前浏览器无法保存；本次试穿仍然有效。');}
};
$('#appearanceRestore').onclick=()=>{if(savedAppearance){appearance={...savedAppearance};view.setAppearance(appearance);appearanceUI();}};
$('#appearanceDefault').onclick=()=>{appearance={...DEFAULT_APPEARANCE};view.setAppearance(appearance);appearanceUI('已试穿默认搭配 · 保存后替换原搭配');};
const names={idle:'自由活动',walking:'正在走动',pickup:'伸手拿取',place:'轻轻放下',sit:'准备坐下',seated:'坐着休息',rest:'坐着休息',stand:'正在起身',enter:'正在上车',driving:'驾驶小车',brake:'正在停车',exit:'正在下车'};
function ui(){
  document.querySelectorAll('[data-pace]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.pace==='run')===world.runPreferred)));
  $('#message').textContent=world.message;$('#state').textContent=world.character.mode==='walking'&&world.character.speed>2?'正在跑步':(names[world.character.mode]??'自由活动');$('#energy').textContent=Math.round(world.energy)+'%';$('#energyBar').style.width=world.energy+'%';$('#progress').textContent=world.completed.size+' / 8';
  for(const b of document.querySelectorAll('[data-check]')){const done=world.completed.has(b.dataset.check);b.classList.toggle('done',done);b.querySelector('i').textContent=done?'✓':'↗';}
  const driving=['driving','brake'].includes(world.character.mode);$('#drivePanel').hidden=!driving;$('#speed').textContent=(Math.abs(world.car.speed)*3.6).toFixed(1);$('#inputHint').textContent=driving?'驾驶小车':'移动';$('#tour').classList.toggle('active',world.auto);canvas.dataset.state=JSON.stringify(world.snapshot());canvas.dataset.avatar=view?.characterVersion??'v2';
}
function revealScene(){if(canvas.getBoundingClientRect().bottom<innerHeight*.65)canvas.parentElement.scrollIntoView({behavior:'instant',block:'center'});}
function runCommand(cmd){if(!ready)return;if(cmd==='move'){world.walkTo({x:-1.4,z:.7});}else world.command(cmd);ui();revealScene();}
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>runCommand(b.dataset.command)));
document.querySelectorAll('[data-pace]').forEach(b=>b.onclick=()=>{world.setPace(b.dataset.pace==='run');ui();});
$('#tour').onclick=()=>{if(!ready)return;world.reset();world.command('tour');view.home();ui();};
$('#stop').onclick=()=>{world.cancel();ui();};$('#reset').onclick=()=>{keys.clear();world.reset();view.home();ui();};
$('#home').onclick=()=>view?.home();$('#close').onclick=()=>view?.close();$('#labels').onclick=()=>{if(view)for(const l of view.labels)l.visible=!l.visible;};
$('#aboutOpen').onclick=()=>$('#about').showModal();$('#aboutClose').onclick=()=>$('#about').close();
document.querySelectorAll('[data-avatar]').forEach(button=>button.onclick=()=>{
  if(!ready)return;view.setCharacter(button.dataset.avatar);
  document.querySelectorAll('[data-avatar]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.avatar===button.dataset.avatar)));
  document.querySelectorAll('[data-expression]').forEach(b=>b.disabled=button.dataset.avatar==='v1');
  $('#appearanceNote').textContent=button.dataset.avatar==='v1'?'初版形象已完整保存，可随时切回。':'原创发型与衣橱，搭配属于你的阿岚。';appearanceUI();ui();revealScene();
});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view?.portrait(b.dataset.view);revealScene();});
document.querySelectorAll('[data-expression]').forEach(button=>button.onclick=()=>{
  view?.setExpression(button.dataset.expression);
  document.querySelectorAll('[data-expression]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));revealScene();
});
let pointerStart=null;canvas.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,button:e.button};canvas.focus({preventScroll:true});});
canvas.addEventListener('pointerup',e=>{if(!ready||!pointerStart||pointerStart.button!==0||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;const p=view.floorPoint(e.clientX,e.clientY);if(p)world.walkTo(p);ui();});
window.addEventListener('keydown',e=>{if($('#about').open||e.target.matches('input,textarea,select')||e.target.closest('.wardrobe'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key==='Escape'&&ready){world.cancel();ui();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();last=performance.now();});
for(const b of document.querySelectorAll('[data-key]')){const key=b.dataset.key.toLowerCase();b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(key));}
function input(){const up=keys.has('w')||keys.has('arrowup'),down=keys.has('s')||keys.has('arrowdown'),left=keys.has('a')||keys.has('arrowleft'),right=keys.has('d')||keys.has('arrowright');return {dx:Number(right)-Number(left),dz:Number(down)-Number(up),run:keys.has('shift')||world.runPreferred,throttle:Number(up)-Number(down),steer:Number(left)-Number(right)};}
function loop(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden){if(ready)world.tick(dt,input());view?.update(dt);if(now-uiAt>120){ui();uiAt=now;}}requestAnimationFrame(loop);}
try{
  view=new RoomView(canvas,world);requestAnimationFrame(loop);const info=await view.loadCharacter();ready=true;$('#loading').remove();document.querySelectorAll('button[disabled]').forEach(b=>b.disabled=false);
  let restored;try{restored=readAppearance(localStorage);}catch{restored={value:{...DEFAULT_APPEARANCE},status:'unavailable'};}
  appearance=restored.value;savedAppearance=restored.status==='saved'?{...appearance}:null;view.setAppearance(appearance);
  appearanceUI(restored.status==='unavailable'?'未能读取已保存形象，已使用默认搭配。':undefined);
  world.log('你好，我是阿岚。为我搭配今天的形象，再一起在房间里走走吧。');ui();
  // Read-only diagnostics support reproducible verification; all actions use visible controls.
  window.roomLife={snapshot:()=>world.snapshot(),assets:info,renderInfo:()=>({calls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles}),inspect:()=>({character:{...world.character},car:{...world.car},cup:{...world.cup},clip:view.currentClip,hand:view.bones.handr?.getWorldPosition({setFromMatrixPosition(m){this.x=m.elements[12];this.y=m.elements[13];this.z=m.elements[14];return this;}}),cupPosition:view.cupGroup.position.toArray()})};
}catch(error){console.error(error);$('#loading').innerHTML='<strong>房间暂时未能加载</strong><span>请刷新重试，并确认浏览器启用了 WebGL。</span>';$('#message').textContent='加载失败：'+error.message;}
