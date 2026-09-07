import * as THREE from 'three';

// Finish one placement before releasing the other foot. Targets are captured at
// lift-off, so changing heading cannot drag a planted foot or redirect it midair.
export class RestFootwork {
  constructor(feet,rotations){
    this.feet=Object.fromEntries(['r','l'].map(s=>[s,feet[s].clone()]));
    this.rotations=Object.fromEntries(['r','l'].map(s=>[s,rotations[s].clone()]));
    this.step=null;this.lastSide=null;this.active=true;
  }
  update(targets,rotation,dt){
    if(!this.step){
      const errors=Object.fromEntries(['r','l'].map(s=>[s,this.feet[s].distanceTo(targets[s])+this.rotations[s].angleTo(rotation)*.10]));
      const needed=['r','l'].filter(s=>errors[s]>.008);
      if(needed.length){
        const other=this.lastSide==='r'?'l':'r';
        const score=s=>errors[s]+Math.max(0,this.feet[s].y-targets[s].y)*2;
        const side=this.lastSide&&needed.includes(other)?other:needed.sort((a,b)=>score(b)-score(a))[0];
        this.step={side,time:0,duration:.24,from:this.feet[side].clone(),to:targets[side].clone(),rotation:this.rotations[side].clone(),endRotation:rotation.clone()};
      }
    }
    this.movingSide=this.step?.side??null;this.active=!!this.step;
    if(this.step){
      const s=this.step;s.time=Math.min(s.duration,s.time+dt);
      const t=s.time/s.duration,ease=t*t*(3-2*t);
      this.feet[s.side].copy(s.from).lerp(s.to,ease);
      this.feet[s.side].y+=.055*Math.sin(Math.PI*t);
      this.rotations[s.side].copy(s.rotation).slerp(s.endRotation,ease);
      if(t===1){this.lastSide=s.side;this.step=null;}
    }
    return this;
  }
}
