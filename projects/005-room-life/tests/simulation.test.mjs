import test from 'node:test';
import assert from 'node:assert/strict';
import {LifeWorld,findPath,segmentClear,pointBlocked,SEAT,CUP_DEST,ROOM,WALK_BRAKING} from '../src/simulation.js';

function until(world,predicate,seconds=60,input={}){
  for(let i=0;i<seconds*60;i++){world.tick(1/60,input);if(predicate())return;}
  assert.fail(`状态未在 ${seconds} 秒内到达：${JSON.stringify(world.snapshot())}`);
}
function finish(world){until(world,()=>!world.action);}

test('移动途中切换走跑保留目的地和后续交互，重新开始恢复步行',()=>{
  const w=new LifeWorld();w.command('pickup');const action=w.action,path=w.path;
  w.setPace(true);w.tick(1/60);assert.ok(w.character.speed<2.8);
  until(w,()=>w.character.speed>2.75,2);
  assert.equal(w.action,action);assert.equal(w.path,path);assert.equal(action.next.kind,'pickup');
  const runningSpeed=w.character.speed;w.setPace(false);w.tick(1/60);
  assert.ok(w.character.speed<runningSpeed&&w.character.speed>1.65,'跑步切回步行需要经过减速');
  until(w,()=>w.character.speed<=1.65001,1);
  finish(w);assert.equal(w.holding,true);
  w.setPace(true);w.command('place');assert.equal(w.action.run,true);finish(w);
  assert.equal(w.cup.owner,'side');w.reset();assert.equal(w.runPreferred,false);
});

test('反向起步先转身并逐渐加速，撞墙时不虚报移动速度',()=>{
  const w=new LifeWorld(),start={...w.character};
  w.tick(1/60,{dx:0,dz:-1,run:true});
  assert.equal(w.character.x,start.x);assert.equal(w.character.z,start.z);
  let previous=0;
  for(let i=0;i<50;i++){
    w.tick(1/60,{dx:0,dz:-1,run:true});
    assert.ok(w.character.speed<=previous+.10001);previous=w.character.speed;
  }
  assert.ok(w.character.z<start.z);
  w.reset();Object.assign(w.character,{x:ROOM.maxX-.27,z:0,yaw:Math.PI/2});
  for(let i=0;i<30;i++)w.tick(1/60,{dx:1,dz:0,run:true});
  assert.equal(w.character.speed,0);assert.equal(w.character.mode,'idle');assert.equal(w.completed.has('move'),false);
});

test('松键按有限距离减速，帧率变化不改变停车距离，停止按钮仍立即响应',()=>{
  for(const fps of [20,30,60])for(const run of [false,true]){
    const w=new LifeWorld();Object.assign(w.character,{x:1.7,z:-3});
    for(let i=0;i<fps;i++)w.tick(1/fps,{dx:0,dz:1,run});
    const start=w.character.z,speed=w.character.speed,expected=speed*speed/(2*WALK_BRAKING);
    let previous=speed,frames=0;
    while(w.character.mode==='walking'&&frames<fps){
      w.tick(1/fps);assert.ok(w.character.speed<=previous+1e-8);
      assert.ok(previous-w.character.speed<=WALK_BRAKING/fps+1e-8,'无遮挡直线松键不能突然丢失速度');
      previous=w.character.speed;frames++;
    }
    assert.ok(frames>1&&frames<fps*.6,'停车应有短暂减速，而非持续滑行');
    assert.ok(Math.abs(w.character.z-start-expected)<1e-6,`${fps} fps 停车距离偏离积分结果`);
    assert.equal(w.character.speed,0);assert.equal(w.character.mode,'idle');
    for(let i=0;i<fps;i++)w.tick(1/fps,{dx:0,dz:1,run});
    w.cancel();const stopped={...w.character};w.tick(1/fps);
    assert.equal(w.character.z,stopped.z);assert.equal(w.character.speed,0);
  }
});

test('接近目的地提前减速，短末段也不冲过目标，靠墙松键不穿越边界',()=>{
  for(const fps of [20,30,60])for(const run of [false,true])for(const shortLast of [false,true]){
    const w=new LifeWorld();Object.assign(w.character,{x:1.7,z:-3});w.setPace(run);w.walkTo({x:1.7,z:0});
    if(shortLast)w.path=[{x:1.7,z:-.08},{x:1.7,z:0}];
    let maximum=0,arrivalSpeed=10;
    for(let i=0;i<fps*8&&w.action;i++){
      const before=w.character.speed;w.tick(1/fps);maximum=Math.max(maximum,w.character.speed);
      assert.ok(w.character.z<=1e-8,'不得越过目的地');
      if(!w.action)arrivalSpeed=before;
    }
    assert.equal(w.action,null);assert.ok(maximum>(run?2.7:1.5));
    assert.ok(arrivalSpeed<.06,'进入交互前应已完成减速');
    assert.ok(Math.abs(w.character.z)<.0081);
    Object.assign(w.character,{x:ROOM.maxX-.28,z:0,yaw:Math.PI/2,speed:2.8,mode:'walking'});
    w.coastDirection={x:1,z:0};
    for(let i=0;i<fps;i++){w.tick(1/fps);assert.equal(pointBlocked(w.character.x,w.character.z,.27,w.car),false);}
    assert.equal(w.character.speed,0);
  }
});

test('完整体验完成八项任务，最终释放座位和车辆且杯子只有一个归属',()=>{
  const w=new LifeWorld();assert.equal(w.command('tour'),true);
  until(w,()=>!w.auto,60);
  assert.deepEqual([...w.completed].sort(),['move','pickup','place','sit','stand','enter','drive','exit'].sort());
  assert.equal(w.character.mode,'idle');assert.equal(w.holding,false);
  assert.deepEqual(w.cup,{...CUP_DEST,owner:'side'});
  assert.equal(w.seatOwner,null);assert.equal(w.car.occupied,false);
  assert.ok(w.car.distance>2);assert.ok(w.carFits(w.car));
});

test('空手不能放置，持物时不能坐下或开车，放置后仍可再次拿取',()=>{
  const w=new LifeWorld();assert.equal(w.command('place'),false);
  assert.equal(w.command('pickup'),true);finish(w);
  assert.equal(w.cup.owner,'hand');assert.equal(w.command('pickup'),false);
  assert.equal(w.command('sit'),false);assert.equal(w.command('enter'),false);
  w.walkTo({x:-2.5,z:.6});finish(w);assert.equal(w.holding,true);
  assert.equal(w.command('place'),true);finish(w);
  assert.equal(w.holding,false);assert.equal(w.cup.owner,'side');
  assert.equal(w.command('pickup'),true);finish(w);assert.equal(w.holding,true);
});

test('前往座位和坐下中途取消均释放预占，起身中途取消则保留占用',()=>{
  const w=new LifeWorld();w.command('sit');w.cancel();assert.equal(w.seatOwner,null);
  w.command('sit');until(w,()=>w.action?.kind==='sit');w.tick(.05);w.cancel();
  assert.equal(w.seatOwner,null);assert.equal(pointBlocked(w.character.x,w.character.z,.27,w.car),false);
  w.command('sit');finish(w);const energy=w.energy;w.tick(.05);assert.ok(w.energy>energy);
  w.command('stand');w.tick(.05);w.cancel();
  assert.equal(w.character.mode,'seated');assert.equal(w.seatOwner,'character');
  assert.equal(w.character.x,SEAT.x);assert.equal(w.character.z,SEAT.z);
  w.command('stand');w.tick(.05);w.tick(1/60,{dx:1,dz:0});
  assert.equal(w.character.mode,'seated');assert.equal(w.character.x,SEAT.x);
  w.command('stand');w.tick(.05);assert.equal(w.walkTo({x:-2,z:0}),false);
  assert.equal(w.character.mode,'seated');assert.equal(w.seatOwner,'character');
  w.command('stand');finish(w);assert.equal(w.seatOwner,null);
});

test('抓握交接时刻前后取消保持正确物品归属',()=>{
  const w=new LifeWorld();w.command('pickup');until(w,()=>w.action?.kind==='pickup');
  w.cancel();assert.equal(w.holding,false);assert.equal(w.cup.owner,'desk');
  w.command('pickup');until(w,()=>w.holding);w.cancel();
  assert.equal(w.holding,true);assert.equal(w.cup.owner,'hand');
  w.command('place');until(w,()=>w.action?.kind==='place');w.cancel();
  assert.equal(w.holding,true);assert.equal(w.cup.owner,'hand');
  w.command('place');until(w,()=>!w.holding);w.cancel();assert.equal(w.cup.owner,'side');
});

test('手动转向改变航向，边界挡住整车，下车前先减速',()=>{
  const w=new LifeWorld();w.command('enter');finish(w);
  const yaw=w.car.yaw;
  for(let i=0;i<60;i++)w.tick(1/60,{throttle:1,steer:.3});
  assert.ok(Math.abs(w.car.yaw-yaw)>.05);assert.ok(w.car.distance>.4);
  for(let i=0;i<600;i++){w.tick(1/60,{throttle:1,steer:0});assert.ok(w.carFits(w.car));}
  for(let i=0;i<60;i++)w.tick(1/60,{throttle:-1,steer:0});
  assert.equal(w.command('exit'),true);assert.equal(w.car.occupied,true);
  until(w,()=>w.action?.kind==='exit');assert.ok(Math.abs(w.car.speed)<.08);
  finish(w);assert.equal(w.car.occupied,false);assert.equal(w.character.mode,'idle');
  assert.equal(pointBlocked(w.character.x,w.character.z,.27,w.car),false);
});

test('路径绕过桌子，目标在家具内被拒绝',()=>{
  const w=new LifeWorld(),start={x:-5.15,z:-4},end={x:-5.15,z:0};
  assert.equal(findPath(w.character,{x:-5.15,z:-2.3},w.car),null);
  const path=findPath(start,end,w.car);assert.ok(path?.length>1);
  let prev=start;for(const next of path){assert.ok(segmentClear(prev,next,w.car));prev=next;}
});
