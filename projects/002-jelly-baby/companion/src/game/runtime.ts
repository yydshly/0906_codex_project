import * as THREE from 'three/webgpu';
import { reshapeCharacter } from '../physics/character-shape.ts';
import { SoftBody } from '../physics/soft-body.js';
import { PHYS } from '../physics/constants.js';
import { loadBabyCage } from '../physics/baby-cage.ts';
import { RefractiveLightField } from '../graphics/refractive-light.js';
import { Baby, ABSORPTION } from '../graphics/baby.ts';
import { loadEnvironment } from '../graphics/environment.ts';
import { makeTable } from '../graphics/table.ts';
import { Locomotion } from './locomotion.ts';
import { Input } from './input.ts';
import { JellySound } from './sound.ts';
import { createRenderer, resizeView } from '../graphics/renderer.ts';
import { OpticalTransport } from '../graphics/transport.ts';
import { createComposite } from '../graphics/composite.ts';
import { ElasticityLesson } from './lesson.ts';
import { Companion } from './companion.ts';
import { FixedStepper } from './fixed-step.ts';

export async function startGame(stage:(s:string)=>void,fail:(e:unknown)=>void) {
  stage('Starting WebGPU');
  const renderer=await createRenderer(fail);
  document.querySelector('#viewport')!.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#e8d9c3');scene.fog=new THREE.Fog('#e8d9c3',2,12);
  const camera=new THREE.PerspectiveCamera(36,1,.001,40);
  camera.position.set(.012,.096,.245);
  stage('Reading the light');
  const environment=await loadEnvironment(renderer,scene);
  stage('Making a little jelly');
  const body=new SoftBody(reshapeCharacter(await loadBabyCage()));
  const baby=new Baby(body);scene.add(baby.group);
  const optics=new RefractiveLightField(body.cage.opticalSurface,environment.incoming,ABSORPTION);
  const table=await makeTable(optics,environment);scene.add(table.mesh);
  const composite=createComposite(renderer,scene,camera);
  const sound=new JellySound(),rig=new Locomotion(body);
  rig.onContact=(speed,foot)=>sound.contact(speed,foot);
  const physicsClock=new FixedStepper(PHYS.step);
  let lastTime=0,disposed=false;
  const reset=()=>{input.recenter();body.reset();physicsClock.reset();};
  const input=new Input(camera,renderer.domElement,body,baby.mesh,rig,sound,reset);
  const companion=new Companion(baby,rig,camera,renderer.domElement);
  const guideMode=new URLSearchParams(location.search).has('guide');
  let guideActive=true;
  const originalAttenuation=(baby.mesh.material as THREE.MeshPhysicalNodeMaterial).attenuationColor.clone();
  const guideAbort=new AbortController();
  if(guideMode)sound.toggle();
  window.addEventListener('message',event=>{
    if(!guideMode||event.origin!==location.origin||event.source!==window.parent||event.source===window||event.data?.type!=='jelly-guide')return;
    const data=event.data;
    if(data.event==='active'&&typeof data.active==='boolean'){
      guideActive=data.active;document.documentElement.dataset.paused=String(!guideActive);
      if(!guideActive){input.clear();companion.pause();}
    }
    if(data.event==='configure'){
      if(typeof data.quiet==='boolean'){companion.quiet=data.quiet;if(companion.quiet)companion.pause();}
      if(typeof data.muted==='boolean'&&data.muted!==sound.muted)sound.toggle();
      if(data.color==='lime'||data.color==='peach'){
        const mat=baby.mesh.material as THREE.MeshPhysicalNodeMaterial;
        mat.color.set(data.color==='peach'?'#ffc0a8':'#d8ef92');
        if(data.color==='peach')mat.attenuationColor.set('#f1a290');else mat.attenuationColor.copy(originalAttenuation);
        document.documentElement.dataset.palette=data.color;
      }
      document.documentElement.dataset.quiet=String(companion.quiet);
      document.documentElement.dataset.muted=String(sound.muted);
    }
  },{signal:guideAbort.signal});
  const lesson=new URLSearchParams(location.search).has('lesson')?new ElasticityLesson(body,renderer.domElement,reset):null;
  const transport=new OpticalTransport(optics,body,camera,environment.incoming,fail);
  const resize=()=>resizeView(renderer,camera,input.controls);
  let resizeFrame=0;
  const resizeObserver=new ResizeObserver(()=>{
    cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);
  });
  resizeObserver.observe(document.querySelector('#viewport')!);resize();
  document.querySelector('#reset')!.addEventListener('click',event=>{
    reset();if((event as MouseEvent).detail>0)(event.currentTarget as HTMLButtonElement).blur();
  });
  document.querySelector('#sound')!.addEventListener('click',event=>{
    const muted=sound.toggle(),button=document.querySelector('#sound')!;
    button.setAttribute('aria-pressed',String(muted));button.setAttribute('aria-label',muted?'Enable sound':'Mute sound');
    button.classList.toggle('muted',muted);void sound.unlock().catch(()=>{});
    if((event as MouseEvent).detail>0)(event.currentTarget as HTMLButtonElement).blur();
  });
  stage('Settling in');
  // Let contact establish itself before displaying the first frame.
  for(let i=0;i<80;i++){rig.step(PHYS.step);body.step(PHYS.step);}
  body.updateSurface();baby.update();input.update(1);
  optics.update(renderer,body,true);
  await transport.update();
  stage('Compiling the material');
  await renderer.compileAsync(scene,camera);
  stage('Drawing the first frame');
  composite.render();
  // Fence first-frame GPU work so validation/OOM cannot masquerade as a successful boot.
  const backend=renderer.backend as unknown as {device:GPUDevice};
  await backend.device.queue.onSubmittedWorkDone();
  lastTime=performance.now();
  const frame=(time:number)=>{
    if(disposed)return;
    try {
      const dt=Math.min(.05,Math.max(0,(time-lastTime)/1000));lastTime=time;
      if(document.hidden||!guideActive){physicsClock.reset();return;}
      companion.update(time,dt);
      const steps=physicsClock.advance(dt,()=>{
        input.step(PHYS.step);rig.step(PHYS.step);body.step(PHYS.step);input.afterPhysicsStep();rig.afterStep();lesson?.sample(PHYS.step);
      });
      if(steps&&body.surfaceDirty) {
        if(!body.isFinite())throw new Error('The soft-body simulation produced an invalid state');
        body.updateSurface();
      }
      baby.update(dt);lesson?.update(time);
      input.update(dt);
      transport.follow();
      optics.update(renderer,body);
      table.mesh.position.x=body.center.x;table.mesh.position.z=body.center.z;
      void transport.update().catch(fail);
      composite.render();
    }catch(error){fail(error);}
  };
  await renderer.setAnimationLoop(frame);
  if(window.parent!==window)window.parent.postMessage({type:'jelly-ready'},location.origin);
  const dispose=()=>{
    if(disposed)return;disposed=true;
    void renderer.setAnimationLoop(null);input.dispose();sound.dispose();transport.dispose();resizeObserver.disconnect();cancelAnimationFrame(resizeFrame);
    lesson?.dispose();guideAbort.abort();companion.dispose();composite.dispose();baby.dispose();table.dispose();environment.dispose();optics.dispose();renderer.dispose();
  };
  window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();});
  if(import.meta.hot)import.meta.hot.dispose(dispose);
  return {stop:()=>{disposed=true;input.clear();transport.dispose();void renderer.setAnimationLoop(null);}};
}
