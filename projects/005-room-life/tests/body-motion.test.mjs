import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {LifeWorld} from '../src/simulation.js';
import {OriginalCharacter} from '../src/character.js';

function setup(holding=false){
  const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();
  Object.assign(world.character,{x:1.7,z:-3});world.holding=holding;
  if(holding)world.cup.owner='hand';model.update(world,0,cup);return {world,model,cup};
}

test('加速与减速时躯干前后响应，停止和重置后恢复，不影响骨盆支撑',()=>{
  for(const fps of [20,30,60]){
    const {world,model,cup}=setup();let forward=0,back=0,jump=0,previous=0;
    for(let i=0;i<fps*3;i++){
      world.tick(1/fps,i<fps?{dx:0,dz:1}:{});model.update(world,1/fps,cup);
      const pitch=model.bones.spine.rotation.x;
      if(i<fps)forward=Math.max(forward,pitch);else back=Math.min(back,pitch);
      jump=Math.max(jump,Math.abs(pitch-previous));previous=pitch;
      assert.ok(model.gaitHeight>=.86-1e-6);
    }
    assert.ok(forward>.035&&forward<.066,'加速应有可见而有限的前倾');
    assert.ok(back<-.035&&back>-.086,'制动应有短暂回正后的后向反应');
    assert.ok(jump<.035,'不能在速度变化时突然折腰');
    assert.ok(Math.abs(model.bones.spine.rotation.x)<.001,'停止后不保留制动倾斜');
    world.tick(1/fps,{dx:1,dz:0,run:true});model.update(world,1/fps,cup);
    world.reset();model.update(world,0,cup);
    assert.equal(model.bones.spine.rotation.x,0);assert.equal(model.bones.hips.rotation.y,0);
  }
});

test('左右转弯的躯干倾斜与肩胯转动相互对应，停止后消退',()=>{
  for(const fps of [20,30,60])for(const direction of [-1,1]){
    const {world,model,cup}=setup();let lean=0,hip=0,chest=0,n=0;
    for(let i=0;i<fps*3.5;i++){
      const t=i/fps,a=direction*Math.max(0,t-.6)*1.2;
      world.tick(1/fps,t<2?{dx:Math.sin(a),dz:Math.cos(a)}:{});model.update(world,1/fps,cup);
      if(t>1&&t<1.9){lean+=model.bones.spine.rotation.z;hip+=model.bones.hips.rotation.y;chest+=model.bones.chest.rotation.y;n++;}
      assert.ok(Math.abs(model.bones.spine.rotation.z)<.15,'转弯不能大幅侧倒');
    }
    assert.ok(lean/n*direction<-.02,'应向弯道内侧倾斜');
    assert.ok(hip/n*direction<-.008&&chest/n*direction>.02,'肩部与胯部应形成小幅转动差');
    assert.ok(Math.abs(model.bones.hips.rotation.y)<.001);
  }
});

test('持杯转弯减小身体反应，杯把仍贴合手腕且交互姿态优先',()=>{
  const empty=setup(),held=setup(true);let emptyLean=0,heldLean=0;
  for(let i=0;i<120;i++){
    const a=Math.max(0,i/60-.5)*1.3,input={dx:Math.sin(a),dz:Math.cos(a),run:true};
    for(const {world,model,cup} of [empty,held]){
      world.tick(1/60,input);model.update(world,1/60,cup);
      if(world.holding){
        const wrist=model.bones.handr.getWorldPosition(new THREE.Vector3());
        assert.ok(cup.localToWorld(new THREE.Vector3(.124,.17,0)).distanceTo(wrist)<1e-6);
        assert.equal(cup.rotation.x,0);assert.equal(cup.rotation.z,0);
      }
    }
    if(i>60){emptyLean+=Math.abs(empty.model.bones.hips.rotation.y);heldLean+=Math.abs(held.model.bones.hips.rotation.y);}
  }
  assert.ok(heldLean<emptyLean*.55&&heldLean>emptyLean*.35,'持物时应减弱身体反应');
  held.world.cancel();held.world.animate('place',1.4,Math.PI);held.model.update(held.world,1/60,held.cup);
  assert.equal(held.model.bones.hips.rotation.y,0,'放置等交互应接管身体姿态');
});
