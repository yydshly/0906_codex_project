import * as THREE from 'three/webgpu';
import { Baby, type Mood } from '../graphics/baby.ts';
import type { Locomotion } from './locomotion.ts';

/** A small deterministic event controller, independent of the soft-body solver. */
export class Companion {
  quiet=false;
  private guide=new URLSearchParams(location.search).has('guide');
  private abort=new AbortController();
  private lastActivity=performance.now();
  private until=0;
  private grabbing=false;
  private grabbedAt=0;
  private nextBlink=performance.now()+2500;
  private blinkStart=-1000;
  private pointer=new THREE.Vector2();
  private inside=false;
  private action='';
  private actionAt=0;
  private actionDuration=0;
  private pendingJump=0;
  private grabHeight=0;
  private grabStart=new THREE.Vector2();
  private grabDistance=0;
  private label='';
  private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  readonly baby:Baby;
  readonly rig:Locomotion;
  readonly camera:THREE.PerspectiveCamera;
  readonly canvas:HTMLCanvasElement;
  constructor(baby:Baby,rig:Locomotion,camera:THREE.PerspectiveCamera,canvas:HTMLCanvasElement){
    this.baby=baby;this.rig=rig;this.camera=camera;this.canvas=canvas;
    const signal=this.abort.signal;
    document.addEventListener('pointermove',e=>{
      if(e.target!==canvas&&!this.grabbing)return;
      this.pointer.set(e.clientX,e.clientY);if(this.grabbing)this.grabDistance=Math.max(this.grabDistance,this.pointer.distanceTo(this.grabStart));this.inside=true;this.lastActivity=performance.now();
    },{capture:true,passive:true,signal});
    canvas.addEventListener('pointerleave',()=>{if(!this.grabbing)this.inside=false;},{signal});
    canvas.addEventListener('companion-grab',event=>{
      this.grabHeight=(event as CustomEvent).detail.height;this.grabStart.copy(this.pointer);this.grabDistance=0;this.action='';this.pendingJump=0;
      this.grabbing=true;this.grabbedAt=performance.now();this.lastActivity=this.grabbedAt;
      this.set('surprised',0);
    },{signal});
    canvas.addEventListener('companion-release',()=>{
      const held=performance.now()-this.grabbedAt;
      this.grabbing=false;this.perform(held<450&&this.grabDistance<12?(this.grabHeight>.015?'pet':'poke'):'recover');
    },{signal});
    document.addEventListener('keydown',()=>{this.lastActivity=performance.now();},{signal});
    for(const button of document.querySelectorAll<HTMLButtonElement>('[data-mood]'))
      button.addEventListener('click',()=>{
        const mood=button.dataset.mood as Mood;this.action='';this.pendingJump=0;this.set(mood,5000);
        if(mood==='happy')this.perform('celebrate');
      },{signal});
    for(const button of document.querySelectorAll<HTMLButtonElement>('[data-action]'))
      button.addEventListener('click',()=>this.perform(button.dataset.action!),{signal});
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin||event.source!==window.parent||event.source===window)return;
      if(event.data?.type==='jelly-brand'&&['welcome','complete','waiting','selected'].includes(event.data.event))
        this.perform(({welcome:'greet',complete:'celebrate',waiting:'wait',selected:'notice'} as Record<string,string>)[event.data.event]);
    },{signal});
    document.querySelector('#companion-auto')!.addEventListener('click',()=>{this.action='';this.pendingJump=0;this.set('curious',0);},{signal});
    document.querySelector('#reset')!.addEventListener('click',()=>{this.grabbing=false;this.action='';this.pendingJump=0;this.set('curious',0);},{signal});
    window.addEventListener('blur',()=>{this.inside=false;this.baby.gaze.set(0,0);},{signal});
  }
  private perform(action:string){
    if(this.grabbing)return;
    this.action=action;this.actionAt=performance.now();this.actionDuration=action==='greet'?3200:action==='wait'?5000:2400;
    this.set(action==='wait'?'curious':'happy',this.actionDuration);
    this.pendingJump=action==='celebrate'&&!this.quiet?this.actionAt+350:0;
  }
  private set(mood:Mood,duration:number){
    this.baby.mood=mood;this.lastActivity=performance.now();this.until=this.lastActivity+duration;
  }
  update(time:number,dt:number){
    if(!this.grabbing&&time>this.until)this.baby.mood=time-this.lastActivity>12000?'sleepy':'curious';
    if(this.grabbing)this.baby.mood='surprised';
    if(!this.actionAt&&time>0&&!this.guide)this.perform('greet');
    const t=(time-this.actionAt)/1000;
    if(time-this.actionAt>this.actionDuration)this.action='';
    if(this.pendingJump&&time>=this.pendingJump){this.rig.jump();this.pendingJump=0;}
    const desired={tilt:0,bow:0,wave:0,crouch:0,breath:0};
    if(!this.grabbing&&!this.reduced&&!this.quiet){
      desired.breath=Math.sin(time/1400)*.45;
      desired.tilt=this.baby.mood==='curious'?this.baby.gaze.x*.25:0;
      desired.bow=this.baby.mood==='sleepy'?.65:0;
      const envelope=Math.sin(Math.PI*Math.min(1,t/(this.actionDuration/1000)));
      if(this.action==='greet'){desired.tilt=-.5*envelope;desired.wave=t>.45?(.65+.3*Math.sin(t*13))*envelope:0;}
      if(this.action==='pet'){desired.tilt=.75*envelope;desired.bow=.5*envelope;this.baby.blink=.25;}
      if(this.action==='poke'){desired.crouch=Math.exp(-t*3);desired.bow=-.6*Math.exp(-t*3);}
      if(this.action==='recover')desired.tilt=Math.sin(t*11)*Math.exp(-t*1.5);
      if(this.action==='celebrate'){desired.crouch=t<.35?Math.sin(t/.35*Math.PI):0;desired.wave=t>.65?.7*envelope:0;}
    }
    for(const key of Object.keys(desired) as (keyof typeof desired)[])this.rig.pose[key]+=(desired[key]-this.rig.pose[key])*(1-Math.exp(-9*dt));
    document.documentElement.dataset.action=this.grabbing?'grab':this.action||this.baby.mood;
    if(time>this.nextBlink){this.blinkStart=time;this.nextBlink=time+2600+Math.random()*2300;}
    const blinkTime=(time-this.blinkStart)/180;
    this.baby.blink=this.reduced?1:blinkTime>=0&&blinkTime<1?1-Math.sin(blinkTime*Math.PI)*.95:1;
    if(this.action==='pet')this.baby.blink=.35;
    const target=new THREE.Vector2();
    if(this.inside&&this.baby.mood!=='sleepy'){
      const center=new THREE.Vector3(this.baby.body.center.x,this.baby.body.center.y+.016,this.baby.body.center.z).project(this.camera);
      const rect=this.canvas.getBoundingClientRect();
      target.set(THREE.MathUtils.clamp((this.pointer.x-rect.left-(center.x+1)*rect.width/2)/150,-1,1),THREE.MathUtils.clamp(-(this.pointer.y-rect.top-(1-center.y)*rect.height/2)/120,-1,1));
    }
    this.baby.gaze.lerp(target,1-Math.exp(-8*dt));
    const texts:Record<Mood,string>={curious:'好奇 · 我在看你，来碰一下吧。',happy:'开心 · 嘿嘿，再玩一次！',surprised:this.grabbing?'惊讶 · 哇，我变长啦！':'惊讶 · 哇，有点意外！',sleepy:'困了 · 让我眯一小会儿。'};
    const actions:Record<string,string>={notice:'选好方向啦 · 一起看看这些项目吧。',greet:'欢迎 · 你好呀，很高兴见到你！',pet:'摸摸头 · 嗯，再摸一下嘛。',poke:'戳肚子 · 有点痒！',recover:'恢复中 · 晃一晃，又站稳啦。',celebrate:'完成啦 · 为你开心！',wait:'等待中 · 我会安静陪着你。'};
    const label=this.grabbing?texts.surprised:actions[this.action]||texts[this.baby.mood];
    if(label!==this.label){
      this.label=label;document.querySelector('#companion-state')!.textContent=label;
      document.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mood===this.baby.mood)));
    }
  }
  pause(){this.action='';this.pendingJump=0;this.actionAt=performance.now();this.actionDuration=0;this.inside=false;this.baby.gaze.set(0,0);}
  dispose(){this.abort.abort();}
}
