import {LifeWorld} from './simulation.js';
import {RoomView} from './view.js';
const $=s=>document.querySelector(s),world=new LifeWorld(),canvas=$('#scene');
let view,ready=false,last=performance.now(),uiAt=0;
const keys=new Set();
const names={idle:'自由活动',walking:'正在走动',pickup:'伸手拿取',place:'轻轻放下',sit:'准备坐下',seated:'坐着休息',rest:'坐着休息',stand:'正在起身',enter:'正在上车',driving:'驾驶小车',brake:'正在停车',exit:'正在下车'};
function ui(){
  $('#message').textContent=world.message;$('#state').textContent=names[world.character.mode]??'自由活动';$('#energy').textContent=Math.round(world.energy)+'%';$('#energyBar').style.width=world.energy+'%';$('#progress').textContent=world.completed.size+' / 8';
  for(const b of document.querySelectorAll('[data-check]')){const done=world.completed.has(b.dataset.check);b.classList.toggle('done',done);b.querySelector('i').textContent=done?'✓':'↗';}
  const driving=['driving','brake'].includes(world.character.mode);$('#drivePanel').hidden=!driving;$('#speed').textContent=(Math.abs(world.car.speed)*3.6).toFixed(1);$('#inputHint').textContent=driving?'驾驶小车':'移动';$('#tour').classList.toggle('active',world.auto);canvas.dataset.state=JSON.stringify(world.snapshot());
}
function runCommand(cmd){if(!ready)return;if(cmd==='move'){world.walkTo({x:-1.4,z:.7});}else world.command(cmd);ui();}
document.querySelectorAll('[data-command]').forEach(b=>b.addEventListener('click',()=>runCommand(b.dataset.command)));
$('#tour').onclick=()=>{if(!ready)return;world.reset();world.command('tour');view.home();ui();};
$('#stop').onclick=()=>{world.cancel();ui();};$('#reset').onclick=()=>{keys.clear();world.reset();view.home();ui();};
$('#home').onclick=()=>view?.home();$('#close').onclick=()=>view?.close();$('#labels').onclick=()=>{if(view)for(const l of view.labels)l.visible=!l.visible;};
$('#aboutOpen').onclick=()=>$('#about').showModal();$('#aboutClose').onclick=()=>$('#about').close();
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>view?.setOutfit(b.dataset.color));
let pointerStart=null;canvas.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,button:e.button};canvas.focus({preventScroll:true});});
canvas.addEventListener('pointerup',e=>{if(!ready||!pointerStart||pointerStart.button!==0||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;const p=view.floorPoint(e.clientX,e.clientY);if(p)world.walkTo(p);ui();});
window.addEventListener('keydown',e=>{if($('#about').open||e.target.matches('input,textarea'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key==='Escape'&&ready){world.cancel();ui();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();last=performance.now();});
for(const b of document.querySelectorAll('[data-key]')){const key=b.dataset.key.toLowerCase();b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>keys.delete(key));}
function input(){const up=keys.has('w')||keys.has('arrowup'),down=keys.has('s')||keys.has('arrowdown'),left=keys.has('a')||keys.has('arrowleft'),right=keys.has('d')||keys.has('arrowright');return {dx:Number(right)-Number(left),dz:Number(down)-Number(up),run:keys.has('shift'),throttle:Number(up)-Number(down),steer:Number(left)-Number(right)};}
function loop(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden){if(ready)world.tick(dt,input());view?.update(dt);if(now-uiAt>120){ui();uiAt=now;}}requestAnimationFrame(loop);}
try{
  view=new RoomView(canvas,world);requestAnimationFrame(loop);const info=await view.loadCharacter();ready=true;$('#loading').remove();document.querySelectorAll('button[disabled]').forEach(b=>b.disabled=false);world.log('你好，我是阿岚。点一下地面，我们先走走吧。');ui();
  // Read-only diagnostics support reproducible verification; all actions use visible controls.
  window.roomLife={snapshot:()=>world.snapshot(),assets:info,renderInfo:()=>({calls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles}),inspect:()=>({character:{...world.character},car:{...world.car},cup:{...world.cup},clip:view.currentClip,hand:view.bones.handr?.getWorldPosition({setFromMatrixPosition(m){this.x=m.elements[12];this.y=m.elements[13];this.z=m.elements[14];return this;}}),cupPosition:view.cupGroup.position.toArray()})};
}catch(error){console.error(error);$('#loading').innerHTML='<strong>房间暂时未能加载</strong><span>请刷新重试，并确认浏览器启用了 WebGL。</span>';$('#message').textContent='加载失败：'+error.message;}
