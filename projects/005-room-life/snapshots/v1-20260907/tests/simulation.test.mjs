import test from 'node:test';
import assert from 'node:assert/strict';
import {LifeWorld,findPath,segmentClear,pointBlocked,SEAT,CUP_DEST} from '../src/simulation.js';

function until(world,predicate,seconds=60,input={}){
  for(let i=0;i<seconds*60;i++){world.tick(1/60,input);if(predicate())return;}
  assert.fail(`状态未在 ${seconds} 秒内到达：${JSON.stringify(world.snapshot())}`);
}
function finish(world){until(world,()=>!world.action);}

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
