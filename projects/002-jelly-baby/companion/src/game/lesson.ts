import type { SoftBody } from '../physics/soft-body.js';

/** Height is a visual observation, not strain or a material measurement. */
export class ElasticityLesson {
  private abort=new AbortController();
  private state='idle';
  private elapsed=0;
  private stable=0;
  private baseline=1;
  private peak=1;
  private lastSent=0;
  private ratio=1;
  readonly body:SoftBody;
  readonly reset:()=>void;
  constructor(body:SoftBody,canvas:HTMLCanvasElement,reset:()=>void){
    this.body=body;this.reset=reset;
    const signal=this.abort.signal;
    window.addEventListener('message',event=>{
      if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='jelly-lesson'||event.data.event!=='start')return;
      this.reset();this.state='settling';this.elapsed=0;this.peak=1;this.stable=0;
    },{signal});
    canvas.addEventListener('companion-release',()=>{
      if(this.state==='stretch'&&this.peak>=1.10){this.state='recover';this.elapsed=0;this.stable=0;}
    },{signal});
  }
  sample(dt:number){
    if(this.state==='idle'||this.state==='done'||this.state==='retry')return;
    this.elapsed+=dt;
    const x=this.body.x;let low=Infinity,high=-Infinity;
    for(let i=1;i<x.length;i+=3){low=Math.min(low,x[i]);high=Math.max(high,x[i]);}
    const height=high-low;
    if(this.state==='settling'){
      if(this.elapsed>.9){this.baseline=height;this.ratio=1;this.state='stretch';this.elapsed=0;}
      return;
    }
    this.ratio=height/this.baseline;
    if(this.state==='stretch'&&this.body.grab)this.peak=Math.max(this.peak,this.ratio);
    if(this.state==='recover'){
      if(this.body.grab){this.state='stretch';this.stable=0;return;}
      this.stable=Math.abs(this.ratio-1)<.12?this.stable+dt:0;
      if(this.stable>.65){this.state='done';return;}
      if(this.elapsed>12)this.state='retry';
    }
  }
  update(time:number){
    if(time-this.lastSent<100)return;this.lastSent=time;
    parent.postMessage({type:'jelly-lesson-progress',state:this.state,ratio:this.ratio,peak:this.peak},location.origin);
  }
  dispose(){this.abort.abort();}
}
