import {clamp,angleDiff} from './simulation.js';

// Small authored reactions to speed and heading changes. These are visual pose
// offsets, not a simulation of mass, balance, friction or muscular forces.
export class BodyMotion {
  constructor(){this.reset(0,0);}
  reset(speed,yaw){
    this.speed=speed;this.yaw=yaw;
    this.pitch=0;this.roll=0;this.hipX=0;this.hipZ=0;this.hipYaw=0;this.chestYaw=0;this.lookYaw=0;
  }
  update(speed,yaw,dt,{reset=false,enabled=true,holding=false}={}){
    if(reset||!enabled){this.reset(speed,yaw);return this;}
    if(dt<=0)return this;
    const acceleration=clamp((speed-this.speed)/dt,-7.5,6);
    const turning=clamp(angleDiff(yaw,this.yaw)/dt,-4.8,4.8);
    this.speed=speed;this.yaw=yaw;
    const strength=holding?.45:1,lateral=speed*turning;
    const targets={
      pitch:clamp(acceleration*.013,-.085,.065),
      roll:clamp(-lateral*.022,-.11,.11),
      hipX:clamp(lateral*.003,-.016,.016),
      hipZ:clamp(acceleration*.0015,-.011,.009),
      hipYaw:clamp(-turning*.012,-.045,.045),
      chestYaw:clamp(turning*.034,-.12,.12),
      lookYaw:clamp(turning*.04,-.14,.14)
    };
    const weight=1-Math.exp(-dt*9);
    for(const key of Object.keys(targets))this[key]+=(targets[key]*strength-this[key])*weight;
    return this;
  }
}
