import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {OriginalCharacter} from '../src/character.js';
import {OriginalCharacter as FirstCharacter} from '../src/character-v1.js';
import {LifeWorld} from '../src/simulation.js';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('新旧人物均能完成完整流程，骨骼变换和杯子位置保持有效',()=>{
  for(const Model of [FirstCharacter,OriginalCharacter]){
    const model=new Model(),world=new LifeWorld(),cup=new THREE.Group();world.command('tour');
    for(let i=0;i<60*45;i++){
      world.tick(1/60);model.update(world,1/60,cup);
      if(i%30===0){model.root.updateMatrixWorld(true);for(const bone of Object.values(model.bones))assert.ok(bone.matrixWorld.elements.every(Number.isFinite),bone.name);assert.ok(cup.position.toArray().every(Number.isFinite));}
      if(!world.auto)break;
    }
    assert.equal(world.completed.size,8);assert.equal(world.auto,false);assert.equal(world.cup.owner,'side');
  }
});

test('躯干及四肢蒙皮权重归一化，顶点与表面法线有效',()=>{
  const model=new OriginalCharacter();let skinned=0;
  model.root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(const attribute of Object.values(mesh.geometry.attributes))assert.ok([...attribute.array].every(Number.isFinite),mesh.name);
    if(!mesh.isSkinnedMesh)return;skinned++;
    const weights=mesh.geometry.getAttribute('skinWeight');
    for(let i=0;i<weights.count;i++){const n=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);assert.ok(Math.abs(n-1)<1e-6);}
  });
  assert.ok(skinned>=6);assert.equal(model.fingers.r.length,5);assert.equal(model.fingers.l.length,5);
});

test('行走在不同帧率下保持落脚固定，支撑腿能伸展而非持续半蹲',()=>{
  for(const fps of [20,30,60]){
    const model=new OriginalCharacter(),world=new LifeWorld(),cup=new THREE.Group(),previous={};
    const angles=[],heights=[];let contacts=0,maxError=0;
    // Two seconds of unobstructed travel include multiple left/right cycles.
    world.character.x=1.7;world.character.z=-3;model.update(world,0,cup);
    for(let i=0;i<fps*2;i++){
      world.tick(1/fps,{dx:0,dz:1});model.update(world,1/fps,cup);
      assert.equal(world.character.mode,'walking');
      if(i>=fps/3)heights.push(model.bones.hips.position.y);
      for(const side of ['r','l']){
        const contact=model.footContacts[side],old=previous[side];
        if(contact?.stance&&old?.stance){assert.ok(new THREE.Vector3(...contact.anchor).distanceTo(new THREE.Vector3(...old.anchor))<1e-8);contacts++;}
        if(contact?.stance){
          const hip=model.bones['upperleg'+side].getWorldPosition(new THREE.Vector3());
          const knee=model.bones['lowerleg'+side].getWorldPosition(new THREE.Vector3());
          const foot=model.bones['foot'+side].getWorldPosition(new THREE.Vector3());
          maxError=Math.max(maxError,foot.distanceTo(new THREE.Vector3(...contact.target)));
          const pivot=new THREE.Vector3(0,-.106,contact.pitch<0?-.0825:.2125);
          const planted=pivot.clone().applyAxisAngle(new THREE.Vector3(0,1,0),contact.yaw).add(new THREE.Vector3(...contact.anchor));
          assert.ok(model.bones['foot'+side].localToWorld(pivot).distanceTo(planted)<.002,'滚动脚掌时实际鞋跟或前掌接触点保持固定');
          // Once weight transfers to the other leg, toe release is allowed to flex.
          if(i>=fps/3&&contact.step<.5)angles.push(knee.clone().sub(hip).angleTo(foot.clone().sub(knee))*180/Math.PI);
        }
        previous[side]=contact;
      }
    }
    const mean=angles.reduce((sum,a)=>sum+a,0)/angles.length,label=`${fps} fps`;
    assert.ok(contacts>fps,`${label} 支撑样本不足`);
    assert.ok(maxError<.002,`${label} 足部接触偏差 ${maxError.toFixed(4)} m`);
    assert.ok(mean<18,`${label} 承重支撑期平均屈膝 ${mean.toFixed(1)}°`);
    assert.ok(Math.max(...angles)<40,`${label} 支撑期屈膝过大`);
    assert.ok(Math.max(...heights)>.925,`${label} 中间支撑期未恢复直立高度`);
    assert.ok(Math.min(...heights)>.875,`${label} 跨步时骨盆过低`);
  }
});

test('步行每条腿重复伸展、屈膝回收、落地前伸展，避免双膝持续弯曲',()=>{
  for(const fps of [20,30,60]){
    const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();
    Object.assign(world.character,{x:1.7,z:-3});model.update(world,0,cup);
    const phases={r:{support:[],swing:[],landing:[]},l:{support:[],swing:[],landing:[]}};
    let bothBent=0,samples=0;
    for(let i=0;i<fps*4;i++){
      world.tick(1/fps,{dx:0,dz:1});model.update(world,1/fps,cup);
      if(i<fps*.65)continue;
      const bends=[];
      for(const side of ['r','l']){
        const position=name=>model.bones[name+side].getWorldPosition(new THREE.Vector3());
        const hip=position('upperleg'),knee=position('lowerleg'),foot=position('foot');
        const bend=knee.clone().sub(hip).angleTo(foot.clone().sub(knee))*180/Math.PI;
        const step=model.footContacts[side].step;
        if(step>=.18&&step<=.40)phases[side].support.push(bend);
        if(step>=.65&&step<=.85)phases[side].swing.push(bend);
        if(step>=.96||step<=.035)phases[side].landing.push(bend);
        bends.push(bend);
      }
      if(Math.min(...bends)>20)bothBent++;samples++;
    }
    for(const side of ['r','l']){
      const {support,swing,landing}=phases[side];
      assert.ok(support.length>=4&&swing.length>=4&&landing.length>=2,`${fps} fps ${side} 各动作阶段需要实际样本`);
      assert.ok(Math.min(...support)<9&&Math.max(...support)<18,'支撑中期应接近伸直，不能仅提高骨盆最低限值');
      assert.ok(Math.max(...swing)>50&&Math.max(...swing)<75,'摆腿应明确屈膝回收');
      assert.ok(Math.max(...landing)<22,'落地前后恢复伸展，不能保持回收时的屈膝');
    }
    assert.ok(bothBent/samples<.05,'稳定行走不能长时间双膝同时弯曲超过 20 度');
  }
});

test('跑步具有真实双脚离地、后腿折叠回收和前掌蹬地，鞋底不穿地',()=>{
  for(const fps of [20,30,60]){
    const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group(),previous={};
    world.character.x=1.7;world.character.z=-3;model.update(world,0,cup);
    let airborne=0,samples=0,clearance=0,fold=0,heelRise=0,extension=180,maxHip=0,minHip=2;
    for(let i=0;i<fps*2;i++){
      world.tick(1/fps,{dx:0,dz:1,run:true});model.update(world,1/fps,cup);
      if(i<fps*.5)continue;samples++;
      minHip=Math.min(minHip,model.bones.hips.position.y);maxHip=Math.max(maxHip,model.bones.hips.position.y);
      const lowest=[];
      for(const side of ['r','l']){
        const contact=model.footContacts[side],ankle=model.bones['foot'+side];
        const a=model.bones['upperleg'+side].getWorldPosition(new THREE.Vector3());
        const b=model.bones['lowerleg'+side].getWorldPosition(new THREE.Vector3());
        const foot=ankle.getWorldPosition(new THREE.Vector3());
        const bend=b.clone().sub(a).angleTo(foot.clone().sub(b))*180/Math.PI;
        const sole=Math.min(...[-.0825,.2125].map(z=>ankle.localToWorld(new THREE.Vector3(0,-.106,z)).y-.044));
        lowest.push(sole);assert.ok(sole>-.002,`${fps} fps 鞋底穿地`);
        assert.ok(foot.distanceTo(new THREE.Vector3(...contact.target))<.002);
        if(contact.stance){
          extension=Math.min(extension,bend);heelRise=Math.max(heelRise,contact.pitch);
          if(previous[side]?.stance)assert.ok(new THREE.Vector3(...contact.anchor).distanceTo(new THREE.Vector3(...previous[side].anchor))<1e-8);
          const toe=new THREE.Vector3(0,-.106,contact.pitch<0?-.0825:.2125);
          const planted=toe.clone().applyAxisAngle(new THREE.Vector3(0,1,0),contact.yaw).add(new THREE.Vector3(...contact.anchor));
          assert.ok(ankle.localToWorld(toe).distanceTo(planted)<.002,'前掌蹬地时接触点不能滑动');
        }else fold=Math.max(fold,bend);
        previous[side]=contact;
      }
      if(!model.footContacts.r.stance&&!model.footContacts.l.stance){airborne++;clearance=Math.max(clearance,Math.min(...lowest));}
    }
    assert.ok(airborne/samples>.20&&airborne/samples<.45,`${fps} fps 缺少合理的腾空阶段`);
    assert.ok(clearance>.05,'双脚必须实际离开地面，不能只修改接触标记');
    assert.ok(fold>105,'后腿应明显折叠回收');assert.ok(heelRise>.6,'离地前需要抬跟蹬地');
    assert.ok(extension<35,'支撑腿需要恢复伸展');assert.ok(minHip>.85&&maxHip>.97,'重心应由支撑进入上升腾空');
  }
});

test('摆臂与同侧脚反向，跑步比行走明显屈肘并增大摆幅',()=>{
  const correlation=(a,b)=>{
    const average=v=>v.reduce((s,n)=>s+n,0)/v.length,x=average(a),y=average(b);
    return a.reduce((s,n,i)=>s+(n-x)*(b[i]-y),0)/Math.sqrt(
      a.reduce((s,n)=>s+(n-x)**2,0)*b.reduce((s,n)=>s+(n-y)**2,0));
  };
  const samples=[];
  for(const run of [false,true]){
    const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();
    world.character.x=1.7;world.character.z=-3;model.update(world,0,cup);
    const foot=[],right=[],left=[],elbows=[],shoulders=[];
    const position=name=>model.bones[name].getWorldPosition(new THREE.Vector3());
    for(let i=0;i<120;i++){
      world.tick(1/60,{dx:0,dz:1,run});model.update(world,1/60,cup);if(i<30||(run&&model.runMix<.95))continue;
      foot.push(run?(position('lowerlegr').z-position('upperlegr').z)-(position('lowerlegl').z-position('upperlegl').z):position('footr').z-world.character.z);
      right.push(position('handr').z-position('upperarmr').z);
      left.push(position('handl').z-position('upperarml').z);
      elbows.push(position('lowerarmr').sub(position('upperarmr')).angleTo(position('handr').sub(position('lowerarmr'))));
      shoulders.push(model.bones.upperarmr.rotation.x);
    }
    assert.ok(foot.length>=30,'需要足够的稳定步态样本；起步另做全帧检查');
    assert.ok(correlation(foot,right)<-.85,'手臂应与同侧腿反向、对侧腿同向');
    assert.ok(correlation(right,left)<-.80,'左右手应交替前后摆动');
    samples.push({minElbow:Math.min(...elbows),maxElbow:Math.max(...elbows),swing:Math.max(...shoulders)-Math.min(...shoulders)});
  }
  assert.ok(samples[0].maxElbow<.6,'步行肘部保持放松');
  assert.ok(samples[1].minElbow>1.1,'跑步时应明显屈肘');
  assert.ok(samples[1].swing>samples[0].swing*1.4,'跑步需要更大的摆臂幅度');
});

test('步行双手越过髋部前后摆动，轻微屈肘且手掌朝内',()=>{
  for(const yaw of [0,Math.PI/2]){
    const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group(),paths={r:[],l:[]};
    world.character.x=1.7;world.character.z=-3;world.character.yaw=yaw;model.update(world,0,cup);
    for(let i=0;i<120;i++){
      world.tick(1/60,{dx:Math.sin(yaw),dz:Math.cos(yaw)});model.update(world,1/60,cup);if(i<30)continue;
      for(const side of ['r','l']){
        const shoulder=model.bones['upperarm'+side].getWorldPosition(new THREE.Vector3());
        const elbow=model.bones['lowerarm'+side].getWorldPosition(new THREE.Vector3());
        const hand=model.bones['hand'+side],wrist=hand.getWorldPosition(new THREE.Vector3());
        assert.ok(elbow.clone().sub(shoulder).angleTo(wrist.clone().sub(elbow))<.20,'步行不能维持端手式屈肘');
        const palm=new THREE.Vector3(0,0,1).applyQuaternion(hand.getWorldQuaternion(new THREE.Quaternion())).applyAxisAngle(new THREE.Vector3(0,1,0),-yaw);
        assert.ok(palm.x*(side==='r'?1:-1)>.85,'手掌应朝向身体两侧');
        paths[side].push(model.root.worldToLocal(wrist));
      }
    }
    for(const path of Object.values(paths)){
      const x=path.map(p=>p.x),z=path.map(p=>p.z),lateral=Math.max(...x)-Math.min(...x),foreAft=Math.max(...z)-Math.min(...z);
      assert.ok(Math.min(...z)<-.17&&Math.max(...z)>.17,'手需要摆到髋部前方和后方');
      assert.ok(lateral<.09&&foreAft>lateral*4,'主要运动应为前后甩摆而非左右摆动');
    }
  }
});

test('走跑切换和停步时手臂连续过渡，并回到放松姿态',()=>{
  const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();
  world.character.x=1.7;world.character.z=-3;model.update(world,0,cup);
  const arms=['upperarmr','upperarml','lowerarmr','lowerarml'];let maxJump=0;
  for(let i=0;i<150;i++){
    const previous=arms.map(name=>model.bones[name].quaternion.clone());
    world.tick(1/60,i<90?{dx:0,dz:1,run:i>=30&&i<60}:{});model.update(world,1/60,cup);
    arms.forEach((name,j)=>maxJump=Math.max(maxJump,previous[j].angleTo(model.bones[name].quaternion)));
  }
  assert.ok(maxJump<.25,`手臂单帧突变 ${maxJump.toFixed(3)} rad`);
  for(const side of ['r','l']){
    assert.ok(Math.abs(model.bones['upperarm'+side].rotation.x+.07)<.005);
    assert.ok(Math.abs(model.bones['lowerarm'+side].rotation.x+.12)<.005);
  }
});

test('持杯走跑时杯子保持直立并贴合把手，空闲手仍然摆动',()=>{
  for(const run of [false,true]){
    const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group(),free=[];
    world.character.x=1.7;world.character.z=-3;world.holding=true;world.cup.owner='hand';
    model.update(world,0,cup);
    for(let i=0;i<120;i++){
      world.tick(1/60,{dx:0,dz:1,run});model.update(world,1/60,cup);
      const wrist=model.bones.handr.getWorldPosition(new THREE.Vector3());
      assert.ok(cup.localToWorld(new THREE.Vector3(.124,.17,0)).distanceTo(wrist)<1e-6);
      assert.ok(Math.abs(cup.rotation.x)<1e-6&&Math.abs(cup.rotation.z)<1e-6);
      assert.ok(Math.abs(wrist.y-model.root.position.y-1.14)<.002,'持杯手不能随摆臂上下甩动');
      if(i>=30)free.push(model.bones.handl.getWorldPosition(new THREE.Vector3()).z-world.character.z);
    }
    assert.ok(Math.max(...free)-Math.min(...free)>.2,'空闲手应保留自然摆动');
  }
});

test('持物后把手与手腕维持固定关系，换外观不修改世界状态',()=>{
  const world=new LifeWorld(),model=new OriginalCharacter(),cup=new THREE.Group();world.command('pickup');
  for(let i=0;i<900;i++){world.tick(1/60);model.update(world,1/60,cup);if(!world.action)break;}
  assert.equal(world.holding,true);
  const hand=model.bones.handr.getWorldPosition(new THREE.Vector3());
  const handle=cup.localToWorld(new THREE.Vector3(.124,.17,0));
  assert.ok(hand.distanceTo(handle)<1e-6);
  const state=world.snapshot();model.setExpression('happy');model.setOutfit('#527c69');model.update(world,0,cup);
  assert.deepEqual(world.snapshot(),state);
});

test('优化前留档的源码、截图及完整演示保持原始散列',async()=>{
  const root=new URL('../../../',import.meta.url);
  const archive=new URL('../snapshots/v1-20260907/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',archive),'utf8'));
  for(const [name,digest] of Object.entries(manifest)){
    const actual=createHash('sha256').update(await readFile(new URL(name,root))).digest('hex');
    assert.equal(actual,digest,name);
  }
  assert.deepEqual(await readFile(new URL('../src/character-v1.js',import.meta.url)),await readFile(new URL('src/character.js',archive)));
});

test('后脑发面覆盖头皮，不出现背面可见的皮肤缺口',()=>{
  const model=new OriginalCharacter(),world=new LifeWorld();model.update(world,0,new THREE.Group());
  const head=model.bones.head,rotation=head.getWorldQuaternion(new THREE.Quaternion());
  for(const hair of ['sweep','crop','bob'])for(const face of ['defined','soft'])for(const y of [.19,.20,.21,.22,.23,.24,.25]){
    model.setAppearance({hair,face});model.root.updateMatrixWorld(true);
    const origin=head.localToWorld(new THREE.Vector3(.007,y,-1));
    const ray=new THREE.Raycaster(origin,new THREE.Vector3(0,0,1).applyQuaternion(rotation));
    const hit=ray.intersectObject(head,true).find(hit=>{for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;return true;});
    assert.ok(hit);assert.notEqual(hit.object.material,model.faceSkin,hair+'/'+face+'/'+y+' 后脑露出头皮');
  }
});
