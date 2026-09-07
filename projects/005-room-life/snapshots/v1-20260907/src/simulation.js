// Deterministic world state. Rendering never decides ownership or completion.
export const ROOM = {minX:-7.5,maxX:7.5,minZ:-4.8,maxZ:4.8};
export const FIXTURES = [
  {id:'desk',x:-5.15,z:-2.3,w:2.2,d:1.1},
  {id:'side',x:-1.7,z:-2.8,w:1.1,d:1.05},
  {id:'chair',x:-4.7,z:1.65,w:1.4,d:1.3},
  {id:'shelf',x:-7.1,z:-2.4,w:.65,d:3.3},
  {id:'plant',x:-1.4,z:3.6,w:.8,d:.8},
  {id:'stool',x:-3.17,z:2.2,w:.76,d:.76},
  {id:'lamp',x:-6.45,z:1.3,w:.64,d:.64},
  {id:'largeplant',x:-6.8,z:3.65,w:.9,d:.9},
  {id:'divider',x:.45,z:-3.5,w:.35,d:1.8}
];
export const CUP_HOME = {x:-5.15,y:.925,z:-1.94};
export const CUP_DEST = {x:-1.7,y:.94,z:-2.50};
export const SEAT = {x:-4.7,z:1.95,y:.57,yaw:0};
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function carLocal(car,x,z){return {x:car.x+Math.cos(car.yaw)*x+Math.sin(car.yaw)*z,z:car.z-Math.sin(car.yaw)*x+Math.cos(car.yaw)*z};}
export function pointBlocked(x,z,r=.27,car=null,ignore=''){
  if(x<ROOM.minX+r||x>ROOM.maxX-r||z<ROOM.minZ+r||z>ROOM.maxZ-r)return true;
  for(const o of FIXTURES) if(o.id!==ignore && Math.abs(x-o.x)<o.w/2+r && Math.abs(z-o.z)<o.d/2+r)return true;
  if(car){const dx=x-car.x,dz=z-car.z; const lx=Math.cos(car.yaw)*dx-Math.sin(car.yaw)*dz,lz=Math.sin(car.yaw)*dx+Math.cos(car.yaw)*dz;if(Math.abs(lx)<.68+r&&Math.abs(lz)<1.07+r)return true;}
  return false;
}
export function segmentClear(a,b,car=null,ignore=''){
  const n=Math.ceil(distance(a,b)/.12); for(let i=1;i<=n;i++)if(pointBlocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,.27,car,ignore))return false;return true;
}
export function findPath(start,end,car=null){
  if(pointBlocked(end.x,end.z,.28,car))return null;
  if(segmentClear(start,end,car))return [{...end}];
  const step=.3,nx=49,nz=31,origin={x:-7.2,z:-4.5};
  const cell=p=>[clamp(Math.round((p.x-origin.x)/step),0,nx-1),clamp(Math.round((p.z-origin.z)/step),0,nz-1)];
  const pos=(x,z)=>({x:origin.x+x*step,z:origin.z+z*step});
  const [sx,sz]=cell(start),[ex,ez]=cell(end),key=(x,z)=>z*nx+x;
  const root=key(sx,sz),target=key(ex,ez),open=[root],came=new Map(),g=new Map([[root,0]]),closed=new Set();
  while(open.length){open.sort((a,b)=>(g.get(a)+Math.hypot(a%nx-ex,Math.floor(a/nx)-ez))-(g.get(b)+Math.hypot(b%nx-ex,Math.floor(b/nx)-ez)));const cur=open.shift();if(cur===target){let k=cur,raw=[end];while(k!==root){raw.push(pos(k%nx,Math.floor(k/nx)));k=came.get(k);}raw.reverse();const smooth=[];let from=start;for(let i=0;i<raw.length;){let j=raw.length-1;while(j>i&&!segmentClear(from,raw[j],car))j--;smooth.push(raw[j]);from=raw[j];i=j+1;}return smooth;}closed.add(cur);const x=cur%nx,z=Math.floor(cur/nx);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const k=key(xx,zz),p=pos(xx,zz);if(closed.has(k)||pointBlocked(p.x,p.z,.29,car)||!segmentClear(pos(x,z),p,car))continue;const cost=g.get(cur)+Math.hypot(dx,dz);if(cost<(g.get(k)??Infinity)){came.set(k,cur);g.set(k,cost);if(!open.includes(k))open.push(k);}}}
  return null;
}
export class LifeWorld {
  constructor(){this.reset();}
  reset(){
    this.time=0;this.character={x:-3.1,z:.1,yaw:0,mode:'idle',speed:0};
    this.car={x:4.4,z:2.1,yaw:Math.PI,speed:0,steer:0,distance:0,occupied:false};
    this.cup={...CUP_HOME,owner:'desk'};this.seatOwner=null;this.holding=false;this.action=null;this.path=[];this.queue=[];this.auto=false;this.driveRoute=null;this.driveStart=0;
    this.completed=new Set();this.energy=72;this.events=[];this.message='点击地面走动，或选择右侧的一项生活任务。';this.log('房间准备好了，阿岚等你一起体验。');
  }
  log(message){this.message=message;this.events.unshift({time:this.time,message});this.events=this.events.slice(0,8);}
  mark(id){this.completed.add(id);}
  cancel(){
    this.auto=false;this.queue=[];this.driveRoute=null;this.path=[];
    if(this.action){
      const a=this.action;
      if(a.kind==='sit'||a.next?.kind==='sit'){this.seatOwner=null;if(a.kind==='sit'){this.character.x=SEAT.x;this.character.z=SEAT.z+.98;}}
      if(a.kind==='enter'){this.car.occupied=false;this.character.x=a.start.x;this.character.z=a.start.z;}
      if(a.kind==='stand'||a.kind==='rest'){this.character.mode='seated';this.character.x=SEAT.x;this.character.z=SEAT.z;}
      if(a.kind==='exit'||a.kind==='brake'){this.character.mode='driving';this.character.x=this.car.x;this.character.z=this.car.z;}
      this.action=null;
    }
    if(this.character.mode==='walking'||!['seated','driving'].includes(this.character.mode))this.character.mode='idle';
    this.character.speed=0;this.log('已停止任务，已拿取的物品和座位状态保留。');
  }
  navigate(target,next=null,run=false){const path=findPath(this.character,target,this.car);if(!path){this.log('那里暂时无法到达，请选择空地。');return false;}this.path=path;this.action={kind:'navigate',next,run};this.character.mode='walking';return true;}
  walkTo(target){if(['seated','driving'].includes(this.character.mode)){this.log(this.character.mode==='seated'?'请先起身。':'请先停车下车。');return false;}this.cancel();if(['seated','driving'].includes(this.character.mode))return false;return this.navigate(target);}
  animate(kind,duration,yaw,extra={}){this.character.mode=kind;this.character.speed=0;this.action={kind,duration,elapsed:0,yaw,committed:false,...extra};}
  command(cmd,internal=false){
    if(!internal && this.auto){this.cancel();}
    if(this.action){this.log('正在完成当前动作，可先点击停止。');return false;}
    const c=this.character;
    if(cmd==='stand'){if(c.mode!=='seated'){this.log('现在已经站着。');return false;}this.animate('stand',1.3,SEAT.yaw,{start:{x:c.x,z:c.z}});return true;}
    if(cmd==='rest'&&c.mode==='seated'){this.animate('rest',2.5,SEAT.yaw);return true;}
    if(cmd==='exit'){if(c.mode!=='driving'){this.log('请先进入小车。');return false;}this.animate('brake',.5,this.car.yaw);return true;}
    if(cmd==='drive'){
      if(c.mode!=='driving'){this.log('请先进入小车。');return false;}
      let target=null;this.driveDirection=1;
      for(const direction of [1,-1]){for(let length=3.2;length>=1.5;length-=.3){const p=carLocal(this.car,0,length*direction);const proposed={...p,yaw:this.car.yaw};if(this.carFits(proposed)){target=p;this.driveDirection=direction;break;}}if(target)break;}
      if(!target){this.log('前后空间不足，请用方向键调整小车位置。');return false;}
      this.driveRoute=[target];this.driveStart=this.car.distance;this.log('开始短程驾驶体验；也可以用方向键自己驾驶。');return true;
    }
    if(c.mode==='seated'||c.mode==='driving'){this.log('请先起身或停车下车，再进行其他操作。');return false;}
    if(cmd==='pickup'){
      if(this.holding){this.log('杯子已经拿在手里。');return false;}
      const target={x:this.cup.x,z:this.cup.z+.58};this.log('去拿杯子：走近后伸手抓握。');return this.navigate(target,{kind:'pickup',duration:1.4,yaw:Math.PI});
    }
    if(cmd==='place'){
      if(!this.holding){this.log('手里还没有杯子，请先拿取。');return false;}
      this.log('把杯子放到圆形边桌。');return this.navigate({x:CUP_DEST.x,z:CUP_DEST.z+.58},{kind:'place',duration:1.4,yaw:Math.PI});
    }
    if(cmd==='sit'){
      if(this.holding){this.log('请先把杯子放好，再坐下休息。');return false;}
      if(this.seatOwner){this.log('座位正在使用中。');return false;}
      this.seatOwner='character';this.log('走向休息椅，准备坐下。');const ok=this.navigate({x:SEAT.x,z:SEAT.z+.98},{kind:'sit',duration:1.8,yaw:SEAT.yaw});if(!ok)this.seatOwner=null;return ok;
    }
    if(cmd==='enter'){
      if(this.holding){this.log('驾驶前请先放下杯子。');return false;}
      const p=carLocal(this.car,-1.15,0);this.log('走到小车旁，进入驾驶座。');return this.navigate(p,{kind:'enter',duration:1.6,yaw:this.car.yaw});
    }
    if(cmd==='tour'){this.auto=true;this.queue=['pickup','place','sit','rest','stand','enter','drive','exit'];this.log('完整体验开始：搬运 → 休息 → 驾驶。');return true;}
    return false;
  }
  manualMove(dx,dz,dt,run=false){
    if(this.character.mode==='seated'){return;}
    if(this.character.mode==='driving')return;
    if(!dx&&!dz)return;
    if(this.action||this.auto)this.cancel();
    if(['seated','driving'].includes(this.character.mode))return;
    const len=Math.hypot(dx,dz),speed=run?2.8:1.5,c=this.character;
    const nx=c.x+dx/len*speed*dt,nz=c.z+dz/len*speed*dt;
    let moved=false;if(!pointBlocked(nx,c.z,.27,this.car)){c.x=nx;moved=true;}if(!pointBlocked(c.x,nz,.27,this.car)){c.z=nz;moved=true;}
    c.yaw+=angleDiff(Math.atan2(dx,dz),c.yaw)*Math.min(1,dt*12);c.speed=moved?speed:0;c.mode=moved?'walking':'idle';if(moved)this.mark('move');
  }
  tick(dt,input={}){
    dt=clamp(dt,0,.05);this.time+=dt;const c=this.character;
    if(input.dx||input.dz){if(c.mode!=='driving')this.manualMove(input.dx,input.dz,dt,input.run);}
    else if(!this.action&&c.mode==='walking'){c.mode='idle';c.speed=0;}
    if(c.mode==='driving'||this.action?.kind==='brake')this.tickCar(dt,input);
    if(c.mode==='seated'||this.action?.kind==='rest')this.energy=Math.min(100,this.energy+dt*2);
    if(this.action?.kind==='navigate'){
      const t=this.path[0],speed=this.action.run?2.8:1.65,d=t?distance(c,t):0;
      if(!t||d<.06){this.path.shift();if(!this.path.length){const next=this.action.next;this.action=null;c.speed=0;c.mode='idle';if(next)this.animate(next.kind,next.duration,next.yaw,{start:{x:c.x,z:c.z}});}}
      else{const step=Math.min(speed*dt,d);c.x+=(t.x-c.x)/d*step;c.z+=(t.z-c.z)/d*step;c.yaw+=angleDiff(Math.atan2(t.x-c.x,t.z-c.z),c.yaw)*Math.min(1,dt*10);c.speed=speed;this.mark('move');this.energy=Math.max(0,this.energy-dt*.08);}
    }else if(this.action){
      const a=this.action;a.elapsed+=dt;c.yaw+=angleDiff(a.yaw,c.yaw)*Math.min(1,dt*10);
      const p=clamp(a.elapsed/a.duration,0,1),smooth=p*p*(3-2*p);
      if(a.kind==='sit'){c.x=a.start.x+(SEAT.x-a.start.x)*smooth;c.z=a.start.z+(SEAT.z-a.start.z)*smooth;}
      if(a.kind==='stand'){c.x=SEAT.x;c.z=SEAT.z+.98*smooth;}
      if(a.kind==='enter'){c.x=a.start.x+(this.car.x-a.start.x)*smooth;c.z=a.start.z+(this.car.z-a.start.z)*smooth;}
      if(a.kind==='exit'&&a.end){c.x=a.start.x+(a.end.x-a.start.x)*smooth;c.z=a.start.z+(a.end.z-a.start.z)*smooth;}
      if(!a.committed&&p>=.58){a.committed=true;if(a.kind==='pickup'){this.holding=true;this.cup.owner='hand';this.mark('pickup');this.log('杯子已拿到手里，可以带着它走动。');}if(a.kind==='place'){this.holding=false;this.cup={...CUP_DEST,owner:'side'};this.mark('place');this.log('杯子已放到边桌，手已松开。');}}
      if(p>=1){
        if(a.kind==='brake'){
          if(Math.abs(this.car.speed)>.08)return;
          const exits=[carLocal(this.car,-1.3,0),carLocal(this.car,1.3,0),carLocal(this.car,0,-1.7)];const end=exits.find(p=>!pointBlocked(p.x,p.z,.27,this.car));
          if(!end){this.action=null;c.mode='driving';this.log('车旁没有安全下车位置，请移到空地。');return;}
          this.car.speed=0;this.animate('exit',1.4,this.car.yaw,{start:{x:c.x,z:c.z},end});return;
        }
        this.action=null;
        if(a.kind==='sit'||a.kind==='rest'){c.mode='seated';this.mark('sit');this.log('坐下休息，体力正在恢复。');}
        else if(a.kind==='enter'){this.car.occupied=true;c.mode='driving';c.yaw=this.car.yaw;this.mark('enter');this.log('已坐进驾驶位。方向键驾驶，刹停后可下车。');}
        else if(a.kind==='stand'){this.seatOwner=null;c.mode='idle';c.z=SEAT.z+.98;this.mark('stand');this.log('已经起身，座位恢复空闲。');}
        else if(a.kind==='exit'){this.car.occupied=false;c.mode='idle';this.mark('exit');this.log('已停车下车，重新控制人物。');}
        else{c.mode='idle';}
      }
    }
    if(this.auto&&!this.action&&!this.driveRoute){if(this.queue.length){const cmd=this.queue.shift();if(!this.command(cmd,true)){this.auto=false;this.queue=[];}}else{this.auto=false;this.log('完整体验完成。现在可以自由走动和重复操作。');}}
  }
  tickCar(dt,input){
    const car=this.car;let throttle=input.throttle??0,steer=input.steer??0,brake=this.action?.kind==='brake';
    if((throttle||steer)&&this.driveRoute){this.driveRoute=null;this.auto=false;this.queue=[];}
    if(this.driveRoute){
      const t=this.driveRoute[0],d=distance(car,t),diff=angleDiff(Math.atan2(t.x-car.x,t.z-car.z),car.yaw+(this.driveDirection<0?Math.PI:0));
      if(d<.45){this.driveRoute=null;this.log('短程驾驶完成，可以停车下车。');}
      if(this.driveRoute){steer=clamp(diff*1.8*this.driveDirection,-1,1);throttle=this.driveDirection;const targetSpeed=d<1?.65:1.5;if(Math.abs(car.speed)>targetSpeed)throttle=0;}
      if(car.distance-this.driveStart>28){this.driveRoute=null;this.log('已完成驾驶距离，可以停车下车。');}
    }
    if(brake){car.speed*=Math.exp(-dt*7);steer=0;}else {car.speed+=throttle*dt*2.0;car.speed*=Math.exp(-dt*(throttle?.55:1.7));}
    car.speed=clamp(car.speed,-1.3,2.4);car.steer+=(steer*.68-car.steer)*Math.min(1,dt*6);
    const yaw=car.yaw+car.speed/1.35*Math.tan(car.steer)*dt,x=car.x+Math.sin(yaw)*car.speed*dt,z=car.z+Math.cos(yaw)*car.speed*dt;
    const proposed={x,z,yaw};
    const blocked=!this.carFits(proposed);
    if(blocked){car.speed=0;if(this.driveRoute){this.driveRoute=null;this.auto=false;this.queue=[];this.log('小车碰到边界，已停车。可以倒车调整。');}}
    else{car.distance+=Math.hypot(x-car.x,z-car.z);car.x=x;car.z=z;car.yaw=yaw;if(car.distance>2)this.mark('drive');}
    this.character.x=car.x;this.character.z=car.z;this.character.yaw=car.yaw;
  }
  carFits(car){return [[-.66,-1.04],[.66,-1.04],[-.66,1.04],[.66,1.04]].every(([cx,cz])=>{const p=carLocal(car,cx,cz);return p.x>=1.05&&p.x<=7.35&&p.z>=-4.6&&p.z<=4.6;});}
  snapshot(){return {mode:this.character.mode,holding:this.holding,cupOwner:this.cup.owner,seatOccupied:!!this.seatOwner,carOccupied:this.car.occupied,carDistance:Math.round(this.car.distance*100)/100,completed:[...this.completed],auto:this.auto,action:this.action?.kind??null};}
}
