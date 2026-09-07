import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {clamp,CUP_DEST} from './simulation.js';
import {surface,profileGeometry,profileAt,weightGeometry,ribbonGeometry} from './character-geometry.js';
import {RUN_STANCE,RUN_STRIDE,recovery,runningHeight} from './running-gait.js';
import {groundHeight} from './ground.js';
import {WALK_STANCE,walkingPitch,walkingBend,walkingSwing} from './walking-gait.js';
import {RestFootwork} from './rest-footwork.js';
import {BodyMotion} from './body-motion.js';
import {normalizeAppearance,PALETTES,SKINS,HAIR_COLORS} from './appearance.js';

const Y=new THREE.Vector3(0,1,0),DOWN=new THREE.Vector3(0,-1,0);
const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a),0,1);return x*x*(3-2*x);};
const gaussian=(x,y,sx,sy)=>Math.exp(-.5*(x*x/(sx*sx)+y*y/(sy*sy)));
const BODY=[[.861,.001,.001],[.865,.215,.137],[.9,.222,.143],[1.02,.204,.133],[1.15,.207,.137],[1.30,.242,.153],[1.38,.248,.145],[1.43,.215,.123],[1.49,.103,.080],[1.50,.085,.071]];

// 阿岚 V2: original sculpted surfaces, layered clothing and articulated hands.
export class OriginalCharacter {
  constructor(){
    this.version='v2';this.root=new THREE.Group();this.root.name='Alan_V2_Original';
    this.bones={};this.boneList=[];this.fingers={r:[],l:[]};this.eyeGroups=[];this.gait=null;
    this.phase=0;this.motion=0;this.lastPosition=null;this.look=new THREE.Vector2();this.expression='natural';
    this.jacketParts=[];this.knitParts=[];this.pants={taper:[],straight:[]};this.shoeParts={sneakers:[],boots:[]};
    this.skin=this.material('#ddb39a',.77);this.faceSkin=this.material('#ffffff',.82,{vertexColors:true});
    this.shirt=this.material('#63877a',.9);this.trousers=this.material('#a18f76',.95);
    this.hair=this.material('#49332c',.68,{side:THREE.DoubleSide});this.hairLight=this.material('#604338',.64,{side:THREE.DoubleSide});
    this.cream=this.material('#f2e7d5',.9);this.sole=this.material('#c6b9a3',.86);this.iris=this.material('#566f5e',.4);
    this.shoe=this.material('#f2e7d5',.75);this.shoeAccent=this.material('#779588',.8);this.eyeWhite=this.material('#f8f3ea',.32);
    this.dark=this.material('#342c2a',.68);this.lip=this.material('#9d685a',.82);
    const hips=this.bone('hips',this.root,0,.94,0),spine=this.bone('spine',hips,0,.18,0),chest=this.bone('chest',spine,0,.23,0);
    const neck=this.bone('neck',chest,0,.14,0);this.bone('head',neck,0,.22,0);
    for(const side of ['r','l']){
      const sign=side==='r'?-1:1;
      const shoulder=this.bone('clavicle'+side,chest,sign*.19,.025,0);
      const upper=this.bone('upperarm'+side,shoulder,sign*.068,-.006,0);
      const lower=this.bone('lowerarm'+side,upper,0,-.32,0),hand=this.bone('hand'+side,lower,0,-.31,0);
      const thigh=this.bone('upperleg'+side,hips,sign*.137,-.02,0),shin=this.bone('lowerleg'+side,thigh,0,-.39,0);
      this.bone('foot'+side,shin,0,-.38,0);
      for(let i=0;i<4;i++){
        const lengths=[.033,.039,.037,.029],finger=this.bone('finger'+side+i,hand,(i-1.5)*.023,-.089,.002);
        const tip=this.bone('fingerTip'+side+i,finger,0,-lengths[i],0);
        this.fingers[side].push({finger,tip,length:lengths[i],end:[.026,.029,.027,.023][i]});
      }
      const thumb=this.bone('thumb'+side,hand,-sign*.043,-.035,.014);
      const thumbTip=this.bone('thumbTip'+side,thumb,0,-.033,0);
      this.fingers[side].push({finger:thumb,tip:thumbTip,length:.033,end:.026,thumb:true});
    }
    this.root.updateMatrixWorld(true);this.skeleton=new THREE.Skeleton(this.boneList);
    this.buildBody();this.buildHead();this.buildWardrobe();this.setAppearance({});
    this.root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  }

  material(color,roughness,extra={}){return new THREE.MeshStandardMaterial({color,roughness,...extra});}
  bone(name,parent,x,y,z){const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);this.bones[name]=b;this.boneList.push(b);return b;}
  mesh(geometry,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
  ellipsoid(rx,ry,rz,material,parent,x=0,y=0,z=0){const m=this.mesh(new THREE.SphereGeometry(1,32,24),material,parent,x,y,z);m.scale.set(rx,ry,rz);return m;}
  box(w,h,d,material,parent,x=0,y=0,z=0,r=.02){return this.mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),material,parent,x,y,z);}
  curve(points,radius,material,parent){return this.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,radius,8,false),material,parent);}
  skinMesh(geometry,material,weight,name){
    weightGeometry(geometry,this.boneList,weight);
    const m=new THREE.SkinnedMesh(geometry,material);m.name=name;this.root.add(m);m.bind(this.skeleton);m.frustumCulled=false;return m;
  }
  torsoWeights(p){
    const b=this.bones;
    if(p.y<1.13){const t=smooth(.95,1.13,p.y);return [[b.hips,1-t],[b.spine,t]];}
    const t=smooth(1.13,1.37,p.y);return [[b.spine,1-t],[b.chest,t]];
  }
  limb(upperName,lowerName,lenA,lenB,radii,material){
    const upper=this.bones[upperName],lower=this.bones[lowerName],origin=upper.getWorldPosition(new THREE.Vector3()),length=lenA+lenB;
    const g=surface(40,24,(u,v)=>{
      const cap=upperName.startsWith('upperarm')?.067:0,t=((1-u)*(length+cap)-cap)/length;
      const ri=Math.max(0,t)*(radii.length-1),i=Math.floor(ri);
      const r=t<0?radii[0]*Math.sqrt(Math.max(.00001,1-(t*length/cap)**2)):THREE.MathUtils.lerp(radii[i],radii[Math.min(i+1,radii.length-1)],ri-i),a=v*Math.PI*2;
      const fold=.0007*Math.sin(t*length*78)*Math.exp(-(((t-.53)/.07)**2));
      return {x:origin.x+Math.sin(a)*(r+fold),y:origin.y-t*length,z:origin.z+Math.cos(a)*(r*.88+fold)};
    });
    return this.skinMesh(g,material,p=>{const t=smooth(lenA-.07,lenA+.07,origin.y-p.y);return [[upper,1-t],[lower,t]];},upperName+'_skin');
  }

  buildBody(){
    const b=this.bones;
    this.jacketParts.push(this.skinMesh(profileGeometry(BODY),this.shirt,p=>this.torsoWeights(p),'tailored_overshirt'));
    const detailStart=new Set();this.root.traverse(o=>detailStart.add(o));
    // The undershirt uses the same skin weights as the jacket, so it bends with it.
    const panel=surface(28,12,(u,v)=>{
      const y=THREE.MathUtils.lerp(.881,1.492,u),[rx,rz]=profileAt(BODY,y),width=THREE.MathUtils.lerp(.046,.079,smooth(1.31,1.49,y));
      const x=(v*2-1)*width;return {x,y,z:rz*Math.sqrt(Math.max(0,1-x*x/(rx*rx)))+.004};
    });
    this.skinMesh(panel,this.cream,p=>this.torsoWeights(p),'undershirt');
    const hipsProfile=[[-.095,.165,.110],[-.07,.195,.121],[.005,.195,.123],[.028,.185,.119]];
    this.mesh(profileGeometry(hipsProfile,{rows:16}),this.trousers,b.hips);
    this.mesh(new THREE.CylinderGeometry(.065,.084,.18,32),this.skin,b.neck,0,.0,0);
    // Small, folded collar instead of the oversized rigid triangles of V1.
    for(const sign of [-1,1]){
      const collar=this.box(.069,.10,.033,this.shirt,b.chest,sign*.088,.096,.091,.012);collar.rotation.z=-sign*.28;
      this.curve([[sign*.072,.148,.080],[sign*.105,.105,.127],[sign*.064,.046,.145]],.004,this.cream,b.chest);
    }
    for(const y of [.915,1.055,1.205]){
      const [rx,rz]=profileAt(BODY,y);const g=new THREE.SphereGeometry(.008,12,8);g.translate(-.076,y,rz*Math.sqrt(1-(.076/rx)**2)+.008);
      this.skinMesh(g,this.sole,p=>this.torsoWeights(p),'jacket_button');
    }
    this.box(.079,.069,.014,this.shirt,b.chest,.148,-.059,.139,.012);
    this.curve([[.108,-.035,.154],[.148,-.04,.158],[.187,-.035,.15]],.002,this.cream,b.chest);
    this.root.traverse(o=>{if(o.isMesh&&!detailStart.has(o)&&o.material!==this.skin&&o.material!==this.trousers)this.jacketParts.push(o);});
    for(const side of ['r','l']){
      this.limb('upperarm'+side,'lowerarm'+side,.32,.31,[.083,.089,.080,.069,.069,.067,.057,.055],this.shirt);
      this.pants.taper.push(this.limb('upperleg'+side,'lowerleg'+side,.39,.38,[.076,.102,.106,.088,.078,.087,.072,.061],this.trousers));
      this.box(.128,.058,.116,this.shirt,b['lowerarm'+side],0,-.291,0,.014);
      this.curve([[-.054,-.303,.049],[0,-.309,.057],[.054,-.303,.049]],.002,this.cream,b['lowerarm'+side]);
      const hand=b['hand'+side];this.ellipsoid(.052,.061,.027,this.skin,hand,0,-.044,0);
      for(const f of this.fingers[side]){
        this.ellipsoid(f.thumb?.014:.0105,f.length*.59,.0105,this.skin,f.finger,0,-f.length*.45,0);
        this.ellipsoid(f.thumb?.012:.0095,f.end*.61,.0095,this.skin,f.tip,0,-f.end*.42,0);
        this.ellipsoid(.006,.009,.0015,this.cream,f.tip,0,-f.end*.58,-.0093);
      }
      const foot=b['foot'+side];
      this.box(.155,.115,.282,this.shoe,foot,0,-.035,.062,.037);
      this.box(.165,.032,.295,this.sole,foot,0,-.090,.065,.012);
      this.shoeParts.sneakers.push(this.box(.106,.042,.143,this.shoeAccent,foot,0,.013,.062,.012));
      for(let i=0;i<3;i++)this.shoeParts.sneakers.push(this.curve([[-.043,.037,.06+i*.033],[0,.043,.067+i*.033],[.043,.037,.06+i*.033]],.003,this.cream,foot));
      this.box(.075,.057,.014,this.shoeAccent,foot,0,-.005,-.069,.007);
    }
  }

  buildHead(){
    const head=new THREE.Group();this.faceGroup=head;this.bones.head.add(head);
    const base=new THREE.Color('#dfb59e'),blush=new THREE.Color('#c78472');
    const faceProfile=[[-.232,.016,.037,0],[-.205,.071,.072,.009],[-.16,.130,.109,.003],[-.085,.176,.139,0],[-.015,.194,.154,-.005],[.07,.188,.15,-.004],[.16,.179,.153,-.009],[.23,.128,.122,-.012],[.273,.003,.004,-.012]];
    const g=profileGeometry(faceProfile,{rows:64,columns:64,deform:(p,a)=>{
      const front=Math.max(0,Math.cos(a));
      p.z+=front**12*(.041*gaussian(p.x,p.y+.006,.028,.055)+.011*gaussian(p.x,p.y+.103,.06,.022));
      const cheeks=gaussian(Math.abs(p.x)-.117,p.y+.056,.047,.037);
      p.z+=front**3*(.009*cheeks-.008*gaussian(Math.abs(p.x)-.077,p.y-.053,.045,.025));
      p.color=base.clone().lerp(blush,Math.min(.36,cheeks*.30*front));return p;
    }});
    this.mesh(g,this.faceSkin,head);
    for(const sign of [-1,1]){
      this.ellipsoid(.026,.043,.021,this.skin,head,sign*.189,-.025,-.014);
      this.ellipsoid(.012,.027,.005,this.lip,head,sign*.206,-.025,.005);
      const eye=new THREE.Group();eye.position.set(sign*.077,.053,.124);head.add(eye);this.eyeGroups.push(eye);
      this.ellipsoid(.040,.021,.016,this.eyeWhite,eye);
      const iris=this.ellipsoid(.0148,.0165,.005,this.iris,eye,0,0,.015);
      this.ellipsoid(.0075,.0105,.0025,this.dark,eye,0,0,.020);
      // Iris is scaled geometry; highlights remain in the eye's coordinate space.
      this.ellipsoid(.0037,.0037,.0016,this.cream,eye,-.004,.005,.022);
      this.curve([[-.042,0,.001],[-.023,.019,.014],[.005,.023,.017],[.03,.013,.011],[.042,0,.001]],.0035,this.lip,eye);
      this.curve([[-.041,-.001,.001],[-.022,-.016,.012],[.008,-.019,.016],[.031,-.01,.009],[.041,0,.001]],.003,this.skin,eye);
      const brow=new THREE.Group();brow.position.set(sign*.077,.107,.128);head.add(brow);
      this.curve([[-.036,-.001,-.006],[-.016,.01,.004],[.011,.012,.005],[.033,.004,-.005]],.006,this.hair,brow);eye.userData.brow=brow;
      this.ellipsoid(.004,.0025,.002,this.lip,head,sign*.014,-.035,.181);
    }
    this.mouth=new THREE.Group();head.add(this.mouth);
    this.curve([[-.044,-.113,.144],[-.025,-.121,.158],[0,-.124,.164],[.025,-.121,.158],[.044,-.113,.144]],.0032,this.lip,this.mouth);
    this.curve([[-.025,-.128,.151],[0,-.132,.158],[.025,-.128,.151]],.0025,this.skin,this.mouth);
    this.mouth.traverse(o=>{if(o.isMesh)o.userData.restPositions=o.geometry.getAttribute('position').array.slice();});
    // A shaped cap and broad, swept ribbons form one readable side-part silhouette.
    const cap=surface(32,64,(u,v)=>{
      const a=v*Math.PI*2,front=(Math.cos(a)+1)/2;
      const edge=2.24-1.12*front+.035*Math.sin(a),theta=.005+u*edge;
      return {x:Math.sin(theta)*Math.sin(a)*.215,y:.046+Math.cos(theta)*.258,z:-.005+Math.sin(theta)*Math.cos(a)*.204};
    });
    const hairRoot=new THREE.Group();this.bones.head.add(hairRoot);this.hairStyles={sweep:hairRoot};
    this.mesh(cap,this.hair,hairRoot);
    for(let i=0;i<11;i++){
      const a=1.0+i*.43,edge=2.24-1.12*(Math.cos(a)+1)/2+.035*Math.sin(a),points=[];
      for(let j=0;j<6;j++){const theta=.50+(edge-.56)*j/5,phi=a+.13*Math.sin(theta);points.push([Math.sin(theta)*Math.sin(phi)*.216,.046+Math.cos(theta)*.259,-.005+Math.sin(theta)*Math.cos(phi)*.205]);}
      this.curve(points,.0012,this.hairLight,hairRoot);
    }
    const locks=[
      {p:[[.075,.286,-.014],[-.035,.275,.061],[-.134,.213,.128],[-.176,.092,.124]],w:.067,d:.018},
      {p:[[.105,.278,.014],[.015,.265,.111],[-.078,.179,.169],[-.128,.102,.158]],w:.065,d:.016},
      {p:[[.132,.255,.035],[.07,.222,.143],[.015,.162,.180],[-.026,.128,.171]],w:.057,d:.015},
      {p:[[.132,.27,.004],[.176,.209,.074],[.191,.087,.063],[.182,.021,.045]],w:.04,d:.012}
    ];
    for(const lock of locks)this.mesh(ribbonGeometry(lock.p,lock.w,lock.d),this.hair,hairRoot);
    for(const [i,lock] of locks.entries()){
      const pts=lock.p.map(([x,y,z],k)=>[x+(i%2?.008:-.008),y+.004,z+(k===0?.003:.014)]);
      this.curve(pts,.0017,this.hairLight,hairRoot);
    }
  }

  buildWardrobe(){
    const b=this.bones;
    const knitProfile=BODY.map(([y,rx,rz])=>[y,rx*(y<1.30?1.018:1),rz*1.018]);
    this.knitParts.push(this.skinMesh(profileGeometry(knitProfile),this.shirt,p=>this.torsoWeights(p),'crewneck_knit'));
    const collar=this.mesh(new THREE.TorusGeometry(.081,.013,10,40),this.shirt,b.neck,0,-.025,0);
    collar.rotation.x=Math.PI/2;this.knitParts.push(collar);
    // One continuous ribbed band avoids dozens of tiny seams and draw calls.
    const band=surface(8,96,(u,v)=>{const y=.892+u*.033,a=v*Math.PI*2,[rx,rz]=profileAt(knitProfile,y),rib=.002+.0006*Math.cos(a*48);return {x:Math.sin(a)*(rx+rib),y,z:Math.cos(a)*(rz+rib)};});
    this.knitParts.push(this.skinMesh(band,this.shirt,p=>this.torsoWeights(p),'knit_hem'));
    for(const side of ['r','l']){
      this.pants.straight.push(this.limb('upperleg'+side,'lowerleg'+side,.39,.38,[.076,.102,.106,.098,.094,.093,.089,.081],this.trousers));
      const foot=b['foot'+side];
      this.shoeParts.boots.push(this.box(.144,.17,.142,this.shoe,foot,0,.040,-.005,.028));
      this.shoeParts.boots.push(this.box(.03,.045,.014,this.shoeAccent,foot,0,.128,-.075,.006));
    }
    for(const style of ['crop','bob']){
      const root=new THREE.Group();root.name='hair_'+style;this.bones.head.add(root);this.hairStyles[style]=root;
      const shape=(u,a,offset=0)=>{
        const front=(Math.cos(a)+1)/2;
        // A shorter fringe in front, continuous volume over the crown and back.
        const edge=style==='crop'?2.22-1.03*front:2.72-1.56*Math.pow(front,1.8);
        const theta=.005+u*edge;
        const ripple=style==='bob'?.002*Math.sin(a*13)*u*u:0;
        return new THREE.Vector3(Math.sin(theta)*Math.sin(a)*((style==='crop'?.207:.217)+offset+ripple),
          .046+Math.cos(theta)*(style==='bob'?.278:.257),
          -.011+Math.sin(theta)*Math.cos(a)*((style==='crop'?.193:.207)+offset+ripple));
      };
      this.mesh(surface(42,64,(u,v)=>shape(u,v*Math.PI*2)),this.hair,root);
      for(let i=0;i<18;i++){
        const a=i*Math.PI*2/18;
        this.curve(Array.from({length:7},(_,j)=>shape(.25+j*.115,a+.08*Math.sin(j*.35),.0018).toArray()),.001,this.hairLight,root);
      }
      if(style==='bob'){
        for(const sign of [-1,1])this.mesh(ribbonGeometry([[sign*.06,.302,.007],[sign*.169,.239,.122],[sign*.210,.045,.10],[sign*.159,-.155,.025]],.042,.014),this.hair,root);
      }
    }
  }
  setAppearance(value){
    this.appearance=normalizeAppearance(value);const a=this.appearance,p=PALETTES[a.palette];
    for(const [name,root] of Object.entries(this.hairStyles))root.visible=name===a.hair;
    for(const mesh of this.jacketParts)mesh.visible=a.top==='jacket';
    for(const mesh of this.knitParts)mesh.visible=a.top==='knit';
    for(const [name,parts] of Object.entries(this.pants))for(const mesh of parts)mesh.visible=name===a.bottom;
    for(const [name,parts] of Object.entries(this.shoeParts))for(const mesh of parts)mesh.visible=name===a.shoes;
    this.shirt.color.set(p.top);this.trousers.color.set(p.bottom);this.shoe.color.set(a.shoes==='boots'?'#665145':p.shoe);this.shoeAccent.color.set(p.accent);
    this.shirt.roughness=a.top==='knit'?.98:.88;this.shoe.roughness=a.shoes==='boots'?.62:.8;
    this.skin.color.set(SKINS[a.skin]);
    const tone=new THREE.Color(SKINS[a.skin]),base=new THREE.Color(SKINS.peach);
    this.faceSkin.color.setRGB(tone.r/base.r,tone.g/base.g,tone.b/base.b);
    this.hair.color.set(HAIR_COLORS[a.hairColor]);this.hairLight.color.copy(this.hair.color).multiplyScalar(1.22);
    const scale=a.face==='soft'?[1.045,.98,1.015]:[1,1,1];
    this.faceGroup.scale.set(...scale);
    for(const root of Object.values(this.hairStyles))root.scale.set(...scale);
    this.root.userData.appearance={...a};
    return {...a};
  }

  // Analytic two-bone solver; explicit bend direction avoids arbitrary elbow flips.
  solve(upper,lower,effector,target,pole,lenA,lenB,weight=1){
    if(weight<=0)return;
    this.root.updateMatrixWorld(true);
    const root=upper.getWorldPosition(new THREE.Vector3()),current=effector.getWorldPosition(new THREE.Vector3());
    const desired=current.lerp(target,clamp(weight,0,1)),direction=desired.clone().sub(root),raw=direction.length();
    if(raw<1e-6)return;direction.divideScalar(raw);
    const d=clamp(raw,Math.abs(lenA-lenB)+.001,lenA+lenB-.001);
    const along=(lenA*lenA-lenB*lenB+d*d)/(2*d),height=Math.sqrt(Math.max(0,lenA*lenA-along*along));
    const bend=pole.clone().addScaledVector(direction,-pole.dot(direction));
    if(bend.lengthSq()<1e-8)bend.set(1,0,0).addScaledVector(direction,-direction.x);
    const elbow=root.clone().addScaledVector(direction,along).addScaledVector(bend.normalize(),height);
    const aim=(bone,vector)=>{const pq=bone.parent.getWorldQuaternion(new THREE.Quaternion());bone.quaternion.copy(pq.invert().multiply(new THREE.Quaternion().setFromUnitVectors(DOWN,vector.normalize())));};
    aim(upper,elbow.clone().sub(root));this.root.updateMatrixWorld(true);
    aim(lower,root.clone().addScaledVector(direction,d).sub(elbow));this.root.updateMatrixWorld(true);
  }
  reach(side,target,weight=1){
    const sign=side==='r'?-1:1,pole=new THREE.Vector3(sign*.7,-.3,-.65).applyAxisAngle(Y,this.root.rotation.y);
    this.solve(this.bones['upperarm'+side],this.bones['lowerarm'+side],this.bones['hand'+side],target,pole,.32,.31,weight);
  }
  orientHand(side,yaw,pitch=0){
    const hand=this.bones['hand'+side],q=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
    hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));this.root.updateMatrixWorld(true);
  }
  curl(side,amount){
    const sign=side==='r'?-1:1;
    for(const f of this.fingers[side]){
      if(f.thumb){f.finger.rotation.set(-.28-amount*.5,sign*(.25+amount*.6),sign*.7);f.tip.rotation.x=-amount*.7;}
      else{f.finger.rotation.x=-amount*1.15;f.tip.rotation.x=-amount*1.35;f.finger.rotation.z=-f.finger.position.x*.8*(1-amount);}
    }
  }
  setExpression(name){this.expression=name;}
  setOutfit(color){this.shirt.color.set(color);}

  update(world,dt,cup){
    const c=world.character,a=world.action,b=this.bones,mode=c.mode;
    const position=new THREE.Vector3(c.x,0,c.z),travel=this.lastPosition?position.distanceTo(this.lastPosition):0;
    const reset=!this.lastPosition||travel>.35||world.time<(this.lastTime??0);
    this.lastPosition=position.clone();this.lastTime=world.time;
    this.root.position.copy(position);this.root.rotation.y=c.yaw;
    for(const bone of this.boneList)bone.rotation.set(0,0,0);
    const p=a?.duration?clamp(a.elapsed/a.duration,0,1):0,inCar=['enter','driving','brake','exit'].includes(mode);
    let sit=['seated','rest','driving','brake'].includes(mode)?1:0;
    if(['sit','enter'].includes(mode))sit=smooth(.15,1,p);
    if(['stand','exit'].includes(mode))sit=1-smooth(0,.85,p);
    const bodyLift=inCar?0:(groundHeight(c.x,c.z)-.044)*(1-sit);
    this.root.position.y=bodyLift;
    const walking=mode==='walking'&&c.speed>.05,running=c.speed>2;
    this.bodyMotion??=new BodyMotion();
    const body=this.bodyMotion.update(c.speed,c.yaw,dt,{reset,enabled:['walking','idle'].includes(mode),holding:world.holding});
    const previousFeet=reset?null:this.lastFeet;
    if(reset){this.stopFeet=null;this.restFootwork=null;this.lastFootTargets=null;this.wasWalking=false;this.armSwing={r:0,l:0};this.runMix=0;this.motion=0;this.gait=null;this.gaitHeight=.94;}
    const starting=walking&&!this.wasWalking;
    if(starting){this.gait=null;this.gaitDistance=0;this.startAge=0;this.startFeet=previousFeet;}
    if(walking){this.gaitDistance=(this.gaitDistance??0)+travel;this.startAge=(this.startAge??0)+dt;}
    if(!walking&&this.wasWalking&&this.lastFeet){this.stopFeet=this.lastFeet;this.stopHip=this.gaitHeight??.94;this.settle=0;}
    if(walking){this.stopFeet=null;this.restFootwork=null;}
    if(this.stopFeet)this.settle=clamp(this.settle+dt/.55,0,1);
    this.wasWalking=walking;this.lastFeet={};
    this.motion=THREE.MathUtils.damp(this.motion,walking?smooth(.03,1.1,c.speed):0,10,dt);
    this.runMix=THREE.MathUtils.damp(this.runMix??0,walking&&running?1:0,8,dt);
    const strideScale=walking?THREE.MathUtils.lerp(.60,1,smooth(0,.55,this.gaitDistance))*
      THREE.MathUtils.lerp(.48,1,smooth(.15,1.5,c.speed)):1;
    const stride=THREE.MathUtils.lerp(.94,RUN_STRIDE,this.runMix)*strideScale;
    const stanceDuration=THREE.MathUtils.lerp(WALK_STANCE,RUN_STANCE,this.runMix);
    const lead=THREE.MathUtils.lerp(stride*.29,.23*strideScale,this.runMix);
    if(walking&&!reset)this.phase+=travel/stride*Math.PI*2;
    b.hips.position.set(0,THREE.MathUtils.lerp(.94,inCar?.96:.72,sit),0);
    const idle=!walking&&sit===0&&['idle','pickup','place'].includes(mode);
    b.hips.position.x=idle?Math.sin(world.time*.65)*.009:Math.sin(this.phase)*this.motion*.009;
    b.hips.position.x+=body.hipX;b.hips.position.z+=body.hipZ;b.hips.rotation.y=body.hipYaw;
    b.spine.rotation.z=idle?.018:Math.sin(this.phase)*this.motion*.025;
    b.spine.rotation.z+=body.roll;
    b.chest.rotation.y=0;
    b.chest.position.y=.23+Math.sin(world.time*1.8)*.002;
    b.spine.rotation.x=.18*this.runMix*this.motion+body.pitch;
    if(['sit','stand','enter','exit'].includes(mode))b.spine.rotation.x+=Math.sin(p*Math.PI)*.28;
    if(['pickup','place'].includes(mode))b.spine.rotation.x+=Math.sin(p*Math.PI)*.20;
    const forward=(x,y,z)=>new THREE.Vector3(x,y+bodyLift,z).applyAxisAngle(Y,c.yaw).add(position);
    const resting=!walking&&sit===0&&['idle','pickup','place'].includes(mode);
    if(!resting)this.restFootwork=null;
    if(resting&&previousFeet&&this.lastFootRotations){
      this.restFootwork??=new RestFootwork(previousFeet,this.lastFootRotations);
      const targets={r:forward(-.137,.15,0),l:forward(.137,.15,0)};
      for(const side of ['r','l'])targets[side].y=groundHeight(targets[side].x,targets[side].z)+.106;
      this.restFootwork.update(targets,new THREE.Quaternion().setFromAxisAngle(Y,c.yaw),dt);
    }
    const settling=resting&&this.restFootwork?.active;
    this.root.updateMatrixWorld(true);
    if(reset||(!walking&&this.motion<.02))this.gait=null;
    if(walking&&!this.gait){
      this.phase=.30*Math.PI*2;this.gait={};
      for(const side of ['r','l']){const x=side==='r'?-.137:.137;this.gait[side]={anchor:forward(x,.15,0),start:forward(x,.15,0),swing:false,yaw:c.yaw,initialSwing:side==='l'};}
    }
    this.footContacts={};this.reachCorrections=0;
    const feet={},footRotations={};
    for(const side of ['r','l']){
      const sign=side==='r'?-1:1;
      let foot=forward(sign*.137,inCar?THREE.MathUtils.lerp(.15,.455,sit):.15,sit*(inCar?.40:.43));
      if(this.gait&&walking){
        const step=((this.phase/(Math.PI*2)+(side==='r'?0:.5))%1+1)%1,state=this.gait[side],swing=step>=stanceDuration;
        let pitch=0,yaw=c.yaw;
        if(swing&&!state.swing)state.start=(this.lastFootTargets?.[side]??state.anchor).clone();
        if(swing){
          const t=state.initialSwing?clamp((step-.8)/.2,0,1):(step-stanceDuration)/(1-stanceDuration),landing=forward(sign*.137,.15,lead);
          const walk=walkingSwing(t);
          foot=state.start.clone().lerp(landing,walk.forward);foot.y+=walk.lift;
          const [y,z,angle]=recovery(t),runner=forward(sign*.137,y,z*strideScale);
          // Preserve the release point when entering the recovery trajectory.
          const [releaseY,releaseZ]=recovery(0);
          const release=state.start.clone().sub(forward(sign*.137,releaseY,releaseZ*strideScale));
          runner.addScaledVector(release,1-smooth(0,.32,t));
          const recoveryWeight=state.initialSwing?0:this.runMix;
          foot.lerp(runner,recoveryWeight);pitch=THREE.MathUtils.lerp(state.initialSwing?-.18*smooth(.65,1,t):walk.pitch,angle,recoveryWeight);
          // A tilted shoe must clear the floor with its heel as well as its toe.
          const soleLow=Math.min(...[-.0825,.2125].map(z=>-.106*Math.cos(pitch)-z*Math.sin(pitch)));
          foot.y=Math.max(foot.y,.044-soleLow);
        }
        else {
          // Finish at the exact cycle boundary instead of freezing the last
          // sampled swing position, which shortens steps at lower frame rates.
          if(state.swing){state.anchor=forward(sign*.137,.15,lead-stride*step);state.yaw=c.yaw;state.initialSwing=false;}
          foot=state.anchor.clone();
          pitch=THREE.MathUtils.lerp(walkingPitch(step/stanceDuration*WALK_STANCE),.85*smooth(.48,1,step/stanceDuration),this.runMix);
          yaw=state.yaw;
          const pivot=new THREE.Vector3(0,-.106,pitch<0?-.0825:.2125),rotated=pivot.clone().applyAxisAngle(new THREE.Vector3(1,0,0),pitch);
          foot.add(pivot.sub(rotated).applyAxisAngle(Y,yaw));
        }
        state.swing=swing;footRotations[side]=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
        this.footContacts[side]={stance:!swing,target:foot.toArray(),anchor:state.anchor.toArray(),pitch,yaw,step};
      }
      if(resting&&this.restFootwork){
        foot=this.restFootwork.feet[side].clone();footRotations[side]=this.restFootwork.rotations[side].clone();
        this.footContacts[side]={stance:this.restFootwork.movingSide!==side,target:foot.toArray(),settling:true};
      }
      if(walking&&this.startFeet&&this.startAge<.16){
        foot=this.startFeet[side].clone().lerp(foot,smooth(0,.16,this.startAge));
        this.footContacts[side].stance=false;
      }
      const rotation=footRotations[side]??new THREE.Quaternion().setFromAxisAngle(Y,c.yaw);
      const fitToGround=()=>{
        const soleLow=Math.min(...[-.0825,.2125].map(z=>new THREE.Vector3(0,-.106,z).applyQuaternion(rotation).y));
        let surface=-Infinity;
        for(const z of [-.0825,.065,.2125]){
          const point=new THREE.Vector3(0,-.106,z).applyQuaternion(rotation).add(foot);
          surface=Math.max(surface,groundHeight(point.x,point.z));
        }
        const lift=Math.max(0,surface-soleLow-foot.y);foot.y+=lift;
        if(lift>1e-8&&walking&&this.footContacts[side]?.stance){
          this.gait[side].anchor.y+=lift;this.footContacts[side].anchor=this.gait[side].anchor.toArray();
        }
      };
      fitToGround();
      if(walking||settling){
        // A stale or crossing foot target must yield to a reachable placement.
        // Never obtain ground contact by collapsing the pelvis below standing range.
        const hip=b['upperleg'+side].getWorldPosition(new THREE.Vector3());
        const dx=foot.x-hip.x,dz=foot.z-hip.z,horizontal=Math.hypot(dx,dz);
        const reach=this.footContacts[side]?.stance ? .766 : .769;
        const vertical=Math.max(0,.86+bodyLift-.02-foot.y),limit=Math.sqrt(Math.max(0,reach*reach-vertical*vertical));
        if(horizontal>limit){
          const correction=new THREE.Vector3(dx*(limit/horizontal-1),0,dz*(limit/horizontal-1));
          foot.add(correction);this.reachCorrections++;
          if(this.gait?.[side])this.gait[side].anchor.add(correction);
          if(this.footContacts[side]){this.footContacts[side].stance=false;this.footContacts[side].corrected=true;}
          fitToGround();
        }
      }
      if(this.footContacts[side])this.footContacts[side].target=foot.toArray();
      feet[side]=foot;
    }
    // Determine pelvis height from foot reach before solving either leg. A fixed
    // downward offset bends both knees even when the supporting foot is below us.
    if(walking||settling){
      let walkHeight=.94;
      if(walking){
        // The incoming support leg sets the weight-bearing height. The trailing
        // heel rolls up and the swing leg folds instead of lowering both knees.
        const supports=['r','l'].filter(side=>this.footContacts[side]?.stance);
        supports.sort((a,b)=>this.footContacts[a].step-this.footContacts[b].step);
        if(supports.length){
          const side=supports[0],hip=b['upperleg'+side].getWorldPosition(new THREE.Vector3()),foot=feet[side];
          const bend=walkingBend(this.footContacts[side].step/stanceDuration*WALK_STANCE)*Math.PI/180;
          const lengthSquared=.39**2+.38**2+2*.39*.38*Math.cos(bend);
          const horizontalSquared=(foot.x-hip.x)**2+(foot.z-hip.z)**2;
          walkHeight=clamp(foot.y+.02-bodyLift+Math.sqrt(Math.max(0,lengthSquared-horizontalSquared)),.89,.955);
        }
      }
      let height=walking?THREE.MathUtils.lerp(walkHeight,runningHeight(this.phase/(Math.PI*2)),this.runMix):
        THREE.MathUtils.lerp(this.stopHip??.94,.94,smooth(0,1,this.settle??1));
      for(const side of ['r','l']){
        const hip=b['upperleg'+side].getWorldPosition(new THREE.Vector3()),foot=feet[side];
        const horizontal=Math.hypot(foot.x-hip.x,foot.z-hip.z);
        const reach=.769;
        height=Math.min(height,foot.y+.02-bodyLift+Math.sqrt(Math.max(0,reach*reach-horizontal*horizontal)));
      }
      // Rise softly, but lower immediately when a planted foot needs the reach.
      const softened=Math.min(height,THREE.MathUtils.damp(reset ? .94 : (this.gaitHeight??.94),height,45,dt));
      b.hips.position.y=THREE.MathUtils.lerp(softened,height,this.runMix);
    }
    this.gaitHeight=b.hips.position.y;
    this.root.updateMatrixWorld(true);
    this.lastFootRotations={};
    for(const side of ['r','l']){
      this.solve(b['upperleg'+side],b['lowerleg'+side],b['foot'+side],feet[side],new THREE.Vector3(0,.1,1).applyAxisAngle(Y,c.yaw),.39,.38);
      const ankle=b['foot'+side],desired=footRotations[side]??new THREE.Quaternion().setFromAxisAngle(Y,c.yaw);
      ankle.quaternion.copy(ankle.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(desired));
      this.root.updateMatrixWorld(true);this.lastFeet[side]=ankle.getWorldPosition(new THREE.Vector3());
      this.lastFootRotations[side]=ankle.getWorldQuaternion(new THREE.Quaternion());
    }
    this.lastFootTargets=feet;
    // Walking follows foot travel. Running follows relative thigh travel because
    // a folded recovery leg's ankle can be behind a knee that is already forward.
    const kneeTravel={};
    for(const side of ['r','l'])kneeTravel[side]=b['lowerleg'+side].getWorldPosition(new THREE.Vector3()).sub(
      b['upperleg'+side].getWorldPosition(new THREE.Vector3())).applyAxisAngle(Y,-c.yaw).z;
    for(const side of ['r','l']){
      const localFoot=feet[side].clone().sub(position).applyAxisAngle(Y,-c.yaw);
      const signal=THREE.MathUtils.lerp(localFoot.z/(stride*.29),(kneeTravel[side]-kneeTravel[side==='r'?'l':'r'])/.26,this.runMix);
      const swing=walking?clamp(signal,-1,1):0;
      this.armSwing[side]=THREE.MathUtils.damp(this.armSwing[side],swing,30,dt);
    }
    b.chest.rotation.y=(this.armSwing.l-this.armSwing.r)*.5*this.motion*
      THREE.MathUtils.lerp(.035,.075,this.runMix)*(world.holding?.35:1)+body.chestYaw;
    this.root.updateMatrixWorld(true);
    for(const side of ['r','l']){
      const sign=side==='r'?-1:1,swing=this.armSwing[side],front=Math.max(0,-swing);
      const activity=this.motion*(world.holding?(side==='r'?.15:.72):1);
      b['clavicle'+side].rotation.z=sign*(-.025+front*activity*.025);
      // A relaxed walking arm swings through vertical. Forward-biased shoulders
      // plus a bent elbow leave the hand in front of the hips for most of a step.
      const walkShoulder=THREE.MathUtils.lerp(-.07,.03,this.motion);
      b['upperarm'+side].rotation.x=THREE.MathUtils.lerp(walkShoulder,.15,this.runMix*this.motion)+
        swing*activity*THREE.MathUtils.lerp(.40,.68,this.runMix);
      b['upperarm'+side].rotation.z=sign*(.05+.035*this.runMix*activity);
      b['lowerarm'+side].rotation.x=-THREE.MathUtils.lerp(.12,
        THREE.MathUtils.lerp(.10+front*.055,1.30+front*.18,this.runMix),this.motion);
      const palmInward=THREE.MathUtils.lerp(.55,THREE.MathUtils.lerp(1.35,1.25,this.runMix),this.motion);
      b['hand'+side].rotation.set(-swing*activity*.06,-sign*palmInward,0);
      this.curl(side,.18+.47*this.runMix*this.motion);
    }
    const lookTarget=['pickup','place'].includes(mode)?(mode==='pickup'?world.cup:CUP_DEST):null;
    const desiredLook=lookTarget?new THREE.Vector3(lookTarget.x,lookTarget.y,lookTarget.z).sub(forward(0,1.72,0)).applyAxisAngle(Y,-c.yaw):null;
    const lookYaw=desiredLook?clamp(Math.atan2(desiredLook.x,desiredLook.z),-.55,.55):Math.sin(world.time*.47)*.065+body.lookYaw;
    const lookPitch=desiredLook?clamp(-Math.atan2(desiredLook.y,Math.hypot(desiredLook.x,desiredLook.z)),-.15,.38):-.025;
    this.look.x=THREE.MathUtils.damp(this.look.x,lookYaw,5,dt);this.look.y=THREE.MathUtils.damp(this.look.y,lookPitch,5,dt);
    b.head.rotation.set(this.look.y-b.spine.rotation.x*.35,this.look.x,-.018-body.roll*.55);
    const blink=world.time%4.7,closure=blink<.18?Math.sin(blink/.18*Math.PI):0;
    const happy=this.expression==='happy'?1:0,calm=this.expression==='calm'?1:0;
    for(const eye of this.eyeGroups){eye.scale.y=Math.max(.06,1-closure*.96-happy*.20-calm*.16);eye.userData.brow.rotation.z=-Math.sign(eye.position.x)*happy*.1;}
    this.smileWeight=THREE.MathUtils.damp(this.smileWeight??0,happy,7,dt);
    this.mouth.scale.x=1+this.smileWeight*.12;
    if(Math.abs((this.lastSmile??-1)-this.smileWeight)>.0001){
      this.mouth.traverse(o=>{if(!o.isMesh)return;const positions=o.geometry.getAttribute('position'),rest=o.userData.restPositions;for(let i=0;i<positions.count;i++)positions.setY(i,rest[i*3+1]+this.smileWeight*.020*Math.pow(Math.min(1,Math.abs(rest[i*3])/.046),1.7));positions.needsUpdate=true;});
      this.lastSmile=this.smileWeight;
    }
    this.root.updateMatrixWorld(true);
    let handTarget=forward(-.25,1.14,.34),reachWeight=world.holding?1:0,cupYaw=c.yaw;
    if(['pickup','place'].includes(mode)&&a){
      const object=mode==='pickup'?world.cup:CUP_DEST,objectTarget=new THREE.Vector3(object.x+.124,object.y+.17,object.z);
      const reach=smooth(.04,.53,p)*(1-smooth(.63,1,p));
      handTarget=world.holding?handTarget.lerp(objectTarget,reach):objectTarget;
      reachWeight=world.holding?1:reach;
      cupYaw=mode==='pickup'?c.yaw*smooth(.67,1,p):c.yaw*(1-smooth(.04,.53,p));
    }
    if(reachWeight>0){this.reach('r',handTarget,reachWeight);this.orientHand('r',cupYaw);this.curl('r',world.holding?.86:smooth(.40,.57,p)*.86);}
    if(sit>0&&!inCar){
      for(const side of ['r','l']){const sign=side==='r'?-1:1;this.reach(side,forward(sign*.19,.72,.29),sit);this.orientHand(side,c.yaw,-.65*sit);this.curl(side,.15);}
    }
    if(['driving','brake'].includes(mode)){
      for(const side of ['r','l']){const sign=side==='r'?-1:1;this.reach(side,forward(sign*.19,1.15,.30));this.orientHand(side,c.yaw,-.5);this.curl(side,.75);}
    }
    this.root.updateMatrixWorld(true);
    if(world.holding){
      const wrist=b.handr.getWorldPosition(new THREE.Vector3()),offset=new THREE.Vector3(-.124,-.17,0).applyAxisAngle(Y,cupYaw);
      cup.position.copy(wrist).add(offset);cup.rotation.set(0,cupYaw,0);
    }else{cup.position.set(world.cup.x,world.cup.y,world.cup.z);cup.rotation.set(0,0,0);}
  }
}
