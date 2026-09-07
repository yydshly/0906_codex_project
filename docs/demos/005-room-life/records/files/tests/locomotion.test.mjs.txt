import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {LifeWorld,angleDiff} from '../src/simulation.js';
import {OriginalCharacter} from '../src/character.js';
import {groundHeight,GROUND} from '../src/ground.js';

function scenario(fps,seconds,input,yaw=0){
  const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();
  Object.assign(world.character,{x:1.7,z:-1,yaw});model.update(world,0,cup);
  let moving=0;
  for(let i=0;i<fps*seconds;i++){
    world.tick(1/fps,input(i/fps,i,world));model.update(world,1/fps,cup);
    if(world.character.mode==='walking')moving++;
    // Include the very first frame, all pauses and all transition frames.
    assert.ok(model.bones.hips.position.y>=.85999,`${fps} fps, frame ${i}: 骨盆下陷 ${model.bones.hips.position.y}`);
    for(const side of ['r','l']){
      const bone=model.bones['foot'+side],foot=bone.getWorldPosition(new THREE.Vector3()),contact=model.footContacts[side];
      assert.ok(foot.toArray().every(Number.isFinite));
      if(contact)assert.ok(foot.distanceTo(new THREE.Vector3(...contact.target))<.002,'骨盆抬高不能以脚悬离目标为代价');
      for(const z of [-.0825,.065,.2125]){
        const sole=bone.localToWorld(new THREE.Vector3(0,-.106,z));
        assert.ok(sole.y>=groundHeight(sole.x,sole.z)-.002,'过渡期间鞋底穿入实际地面');
      }
    }
  }
  assert.ok(moving>fps/4,'场景必须实际发生移动');
  return {world,model};
}

test('八个方向的步行和跑步起步均无骨盆塌陷，检查从第一帧开始',()=>{
  for(const fps of [20,30,60])for(const run of [false,true])for(let direction=0;direction<8;direction++){
    const a=direction*Math.PI/4;
    scenario(fps,1,()=>({dx:Math.sin(a),dz:Math.cos(a),run}));
  }
});

test('木地板、地毯和驾驶区使用实际表面高度，站姿鞋底落在相应表面',()=>{
  for(const [x,z,height] of [[0,0,.0475],[-4,0,.0775],[3,0,.076]]){
    assert.equal(groundHeight(x,z),height);
    const world=new LifeWorld(),model=new OriginalCharacter();Object.assign(world.character,{x,z});model.update(world,0,new THREE.Group());
    assert.equal(model.bones.hips.position.y,.94);
    for(const side of ['r','l']){
      const sole=model.bones['foot'+side].localToWorld(new THREE.Vector3(0,-.106,.065));
      assert.ok(Math.abs(sole.y-height)<.002);
    }
  }
  assert.ok(GROUND.rug.top>GROUND.wood.top&&GROUND.lane.top>GROUND.wood.top);
});

test('短停反向起步、连续折返和走跑切换不复用不可达落脚点',()=>{
  for(const fps of [20,30,60])for(const run of [false,true]){
    for(const pause of [.05,.15,.3,.6])scenario(fps,1.5+pause,t=>t<.55?{dx:0,dz:1,run}:t<.55+pause?{}:{dx:0,dz:-1,run});
    scenario(fps,3,t=>({dx:Math.sin(Math.floor(t/.2)*Math.PI/2),dz:Math.cos(Math.floor(t/.2)*Math.PI/2),run}));
    scenario(fps,2,t=>({dx:0,dz:1,run:t<.4?run:!run}));
  }
});

test('可复现的连续输入压力检查覆盖停走、急转与速度变化',()=>{
  for(const fps of [20,30,60]){
    let seed=9721,remaining=0,control={};
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    scenario(fps,30,()=>{
      if(remaining--<=0){
        const a=Math.floor(random()*8)*Math.PI/4;
        control=random()<.2?{}:{dx:Math.sin(a),dz:Math.cos(a),run:random()<.5};
        remaining=Math.floor((.08+random()*.7)*fps);
      }
      return control;
    });
  }
});

test('不同迈步阶段停下时逐脚收步，固定另一只脚，并回到站姿',()=>{
  for(const fps of [20,30,60])for(const run of [false,true])for(const duration of [.6,.8,1,1.2]){
    const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();
    Object.assign(world.character,{x:1.7,z:-3});model.update(world,0,cup);
    const position=s=>model.bones['foot'+s].getWorldPosition(new THREE.Vector3());
    for(let i=0;i<fps*duration;i++){world.tick(1/fps,{dx:0,dz:1,run});model.update(world,1/fps,cup);}
    world.cancel(); // Explicit task stop remains immediate; key release brakes first.
    const needed=['r','l'].filter(s=>Math.abs(model.root.worldToLocal(position(s)).z)>.01);
    let held=0,lift=0;const sides=new Set();
    for(let i=0;i<fps;i++){
      const previous={r:position('r'),l:position('l')};
      const rotations=Object.fromEntries(['r','l'].map(s=>[s,model.bones['foot'+s].getWorldQuaternion(new THREE.Quaternion())]));
      world.tick(1/fps);model.update(world,1/fps,cup);
      const moving=model.restFootwork?.movingSide;
      if(moving){
        sides.add(moving);const support=moving==='r'?'l':'r';
        assert.ok(position(support).distanceTo(previous[support])<.002,'停步不能把两只脚一起滑向站姿');held++;
        assert.ok(model.bones['foot'+support].getWorldQuaternion(new THREE.Quaternion()).angleTo(rotations[support])<1e-6,'固定脚不能在地面上原地拧转');
        const sole=model.bones['foot'+moving].localToWorld(new THREE.Vector3(0,-.106,.065));
        lift=Math.max(lift,sole.y-groundHeight(sole.x,sole.z));
      }
      assert.ok(model.gaitHeight>=.86-1e-6);
    }
    assert.ok(held>fps*.15&&needed.every(s=>sides.has(s)),'偏离站姿的脚必须实际完成收步，已在站位的脚无需重复抬起');
    assert.ok(lift>.025,'收步应抬脚而非贴地滑行');
    for(const side of ['r','l']){
      const local=model.root.worldToLocal(position(side));
      assert.ok(Math.abs(local.z)<.009&&Math.abs(local.x-(side==='r'?-.137:.137))<.009,'最终双脚回到站姿');
    }
  }
});

test('转弯限制旋转速度，连续移动保留步态周期而非反复重启',()=>{
  for(const fps of [20,30,60]){
    const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();
    Object.assign(world.character,{x:1.7,z:-3});model.update(world,0,cup);
    let previousYaw=0,previousPhase=0,previousWalking=false,continuations=0;
    for(let i=0;i<fps*3;i++){
      const t=i/fps,heading=t<.6?0:(t-.6)*1.1;
      world.tick(1/fps,{dx:Math.sin(heading),dz:Math.cos(heading)});model.update(world,1/fps,cup);
      assert.ok(Math.abs(angleDiff(world.character.yaw,previousYaw))<=4.8/fps+1e-8);
      const walking=world.character.mode==='walking'&&world.character.speed>.05;
      if(walking&&previousWalking){assert.ok(model.phase>=previousPhase,'持续转弯不能重置步态相位');continuations++;}
      previousPhase=model.phase;previousYaw=world.character.yaw;previousWalking=walking;
    }
    assert.ok(continuations>fps);
    world.tick(1/fps,{dx:-1,dz:0});
    assert.ok(Math.abs(angleDiff(world.character.yaw,previousYaw))<=4.8/fps+1e-8,'急转也必须限速');
  }
});

test('松键后减速、缩步、逐脚收步连续完成，最终恢复站姿和放松手臂',()=>{
  for(const fps of [20,30,60])for(const run of [false,true]){
    const {world,model}=scenario(fps,2.5,t=>t<1?{dx:0,dz:1,run}:{});
    assert.equal(world.character.mode,'idle');assert.equal(world.character.speed,0);
    assert.equal(model.restFootwork.active,false);
    for(const side of ['r','l']){
      const local=model.root.worldToLocal(model.bones['foot'+side].getWorldPosition(new THREE.Vector3()));
      assert.ok(Math.abs(local.z)<.009,'减速后必须完成收步');
      assert.ok(Math.abs(model.bones['upperarm'+side].rotation.x+.07)<.005,'手臂应回到放松姿态');
    }
  }
});
