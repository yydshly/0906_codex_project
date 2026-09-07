import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OriginalCharacter} from '../src/character.js';
import {LifeWorld} from '../src/simulation.js';
import {APPEARANCE_KEY,OPTIONS,DEFAULT_APPEARANCE,normalizeAppearance,readAppearance,saveAppearance} from '../src/appearance.js';

test('形象保存可恢复，损坏、旧版本和不可用存储有明确回退',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  assert.equal(readAppearance(storage).status,'empty');
  const choice={...DEFAULT_APPEARANCE,hair:'bob',top:'knit',skin:'umber'};
  saveAppearance(storage,choice);assert.deepEqual(readAppearance(storage),{value:choice,status:'saved'});
  data.set(APPEARANCE_KEY,'{broken');assert.equal(readAppearance(storage).status,'unavailable');
  data.set(APPEARANCE_KEY,JSON.stringify({version:99,appearance:choice}));assert.deepEqual(readAppearance(storage).value,DEFAULT_APPEARANCE);
  assert.deepEqual(normalizeAppearance({hair:'missing',top:'knit',extra:'bad'}),{...DEFAULT_APPEARANCE,top:'knit'});
  assert.equal(readAppearance({getItem(){throw Error('denied');}}).status,'unavailable');
  assert.throws(()=>saveAppearance({setItem(){throw Error('quota');}},choice));
});

test('反复换装复用骨架与资源，持杯时不改变动作、物品或世界状态',()=>{
  const model=new OriginalCharacter(),world=new LifeWorld(),cup=new THREE.Group();
  world.command('pickup');for(let i=0;i<1200&&!world.holding;i++){world.tick(1/60);model.update(world,1/60,cup);}
  assert.equal(world.cup.owner,'hand');
  const snapshot=world.snapshot(),bones=model.boneList.slice(),pose=bones.map(b=>b.matrixWorld.clone()),cupPos=cup.position.clone();
  const resources=()=>{const geometries=new Set(),materials=new Set();let nodes=0;model.root.traverse(o=>{nodes++;if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});return {nodes,geometries,materials};};
  const before=resources();
  for(let i=0;i<60;i++){
    const a=Object.fromEntries(Object.entries(OPTIONS).map(([key,values])=>[key,values[i%values.length][0]]));
    model.setAppearance(a);assert.deepEqual(model.appearance,a);assert.deepEqual(world.snapshot(),snapshot);
    assert.ok(cup.position.equals(cupPos));assert.deepEqual(model.boneList,bones);
    bones.forEach((b,n)=>assert.ok(b.matrixWorld.equals(pose[n])));
    assert.equal(Object.values(model.hairStyles).filter(g=>g.visible).length,1);
    assert.ok(model.pants[a.bottom].every(m=>m.visible));assert.ok(model.shoeParts[a.shoes].every(m=>m.visible));
  }
  const after=resources();assert.equal(after.nodes,before.nodes);assert.deepEqual(after.geometries,before.geometries);assert.deepEqual(after.materials,before.materials);
});

test('六组形象覆盖全部部件并完成八项生活行为，蒙皮与鞋底边界有效',()=>{
  for(let n=0;n<6;n++){
    const model=new OriginalCharacter(),world=new LifeWorld(),cup=new THREE.Group();
    model.setAppearance(Object.fromEntries(Object.entries(OPTIONS).map(([k,values])=>[k,values[n%values.length][0]])));
    model.root.traverse(o=>{if(o.geometry)for(const attribute of Object.values(o.geometry.attributes))assert.ok([...attribute.array].every(Number.isFinite),o.name);});
    world.command('tour');
    for(let i=0;i<3000;i++){world.tick(1/60);model.update(world,1/60,cup);if(i%30===0){for(const b of model.boneList)assert.ok(b.matrixWorld.elements.every(Number.isFinite));}if(!world.auto)break;}
    assert.equal(world.completed.size,8);assert.equal(world.cup.owner,'side');assert.equal(world.snapshot().seatOccupied,false);assert.equal(world.car.occupied,false);
    for(const side of ['r','l']){
      // Both footwear variants keep the same sole plane and contact pivots.
      for(const mesh of model.shoeParts.boots){mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.min.y+mesh.position.y>-.106);}
    }
  }
});
