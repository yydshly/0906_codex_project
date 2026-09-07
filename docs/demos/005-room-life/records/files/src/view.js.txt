import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {OriginalCharacter} from './character.js';
import {OriginalCharacter as FirstCharacter} from './character-v1.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ROOM,SEAT,CUP_HOME,CUP_DEST,clamp} from './simulation.js';
import {GROUND} from './ground.js';
const v=new THREE.Vector3(),q=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0);
export class RoomView {
  constructor(canvas,world){
    this.world=world;this.canvas=canvas;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e9e5dc');
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.16;
    this.camera=new THREE.PerspectiveCamera(36,1,.1,100);this.camera.position.set(13,13.5,18);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(0,.4,0);this.controls.enableDamping=true;this.controls.minDistance=3;this.controls.maxDistance=33;this.controls.maxPolarAngle=Math.PI*.46;this.controls.minPolarAngle=.2;this.controls.mouseButtons.LEFT=THREE.MOUSE.ROTATE;this.controls.mouseButtons.RIGHT=THREE.MOUSE.PAN;
    this.scene.add(new THREE.HemisphereLight('#dcefff','#ad8768',2.3));
    const sun=new THREE.DirectionalLight('#fff0d8',4.2);sun.position.set(-3,12,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:10,bottom:-10,near:.1,far:35});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;sun.shadow.radius=3;this.scene.add(sun);
    const fill=new THREE.DirectionalLight('#e4eeff',1.0);fill.position.set(8,5,-6);this.scene.add(fill);
    this.materials={};this.pickables=[];this.wheels=[];this.labels=[];this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);this.follow=false;
    this.buildRoom();this.wallBack=this.scene.children.filter(o=>o.isMesh&&o.position.z<-4.6&&o.position.y>.1);this.wallLeft=this.scene.children.filter(o=>o.isMesh&&o.position.x<-6.7&&o.position.y>.1);this.buildCar();this.buildCup();this.marker=new THREE.Mesh(new THREE.RingGeometry(.23,.29,40),new THREE.MeshBasicMaterial({color:'#db855f',side:THREE.DoubleSide,transparent:true,opacity:.85}));this.marker.rotation.x=-Math.PI/2;this.marker.position.y=.025;this.marker.visible=false;this.scene.add(this.marker);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);this.resize();
  }
  mat(color,roughness=.7,metalness=0){const key=color+roughness+metalness;return this.materials[key]??=new THREE.MeshStandardMaterial({color,roughness,metalness});}
  box(w,h,d,color,x,y,z,r=.055,parent=this.scene){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),typeof color==='string'?this.mat(color):color);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  cylinder(rt,rb,h,color,x,y,z,parent=this.scene,segments=24){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),typeof color==='string'?this.mat(color):color);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  sphere(r,color,x,y,z,parent=this.scene){const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),this.mat(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  label(text,x,y,z,color='#304c44',size=1.4){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='600 42px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:true}));s.position.set(x,y,z);s.scale.set(size,size/4,1);this.scene.add(s);this.labels.push(s);return s;}
  plant(x,z,scale=1){const root=new THREE.Group();root.position.set(x,0,z);root.scale.setScalar(scale);this.scene.add(root);this.cylinder(.3,.22,.52,'#d5b094',0,.26,0,root);this.cylinder(.27,.27,.045,'#51412f',0,.53,0,root);for(let i=0;i<9;i++){const a=i*2.4,h=.9+(i%3)*.24;const stem=this.cylinder(.018,.024,h-.5,'#526a48',Math.sin(a)*.11,(h+.5)/2,Math.cos(a)*.11,root,8);const leaf=this.sphere(.22,i%2?'#63865a':'#395f48',Math.sin(a)*.28,h,Math.cos(a)*.28,root);leaf.scale.set(.75,1.9,.35);leaf.rotation.set(.4*Math.sin(a),a,.45*Math.cos(a));}return root;}
  buildRoom(){
    this.box(16,.3,10.7,'#c7bcaa',0,-.2,0,.14);this.box(15.6,.09,10.3,'#ddd0b6',0,-.02,0);
    for(let i=0;i<34;i++){this.box(.445,GROUND.wood.thickness,9.8,i%3===0?'#d8c6a7':i%3===1?'#e2d2b6':'#dfceb0',-7.43+i*.45,GROUND.wood.top-GROUND.wood.thickness/2,0,.002);}
    // Cutaway walls keep the room readable from the main camera.
    this.box(15.6,2.75,.18,'#f4efe5',0,1.35,-5.12);this.box(.18,2.75,10.4,'#e5e8df',-7.82,1.35,0);
    this.box(15.6,.12,.11,'#b9b5a7',0,.08,-5);this.box(.12,.12,10.2,'#b9b5a7',-7.7,.08,0);
    for(const x of [-4.9,-1.5]){
      this.box(2.7,1.7,.13,'#bdcbbf',x,1.65,-4.99);this.box(2.43,1.45,.04,this.mat('#d9e9e5',.25),x,1.65,-4.89,.01);
      this.box(.05,1.5,.06,'#faf4e6',x,1.65,-4.83,.008);this.box(2.45,.05,.06,'#faf4e6',x,1.65,-4.83,.008);
      this.box(2.95,.09,.43,'#b5aa91',x,.78,-4.81,.02);
    }
    const rug=GROUND.rug,lane=GROUND.lane;
    this.box(rug.width,rug.thickness,rug.depth,'#b0b9a2',rug.x,rug.top-rug.thickness/2,rug.z,.12);
    for(let i=0;i<6;i++)this.box(4.9,.006,.015,'#d1d5c5',-4,.082,-1.8+i*.78,.001);
    this.box(lane.width,lane.thickness,lane.depth,'#b6c9c4',lane.x,lane.top-lane.thickness/2,lane.z,.13);
    for(let i=0;i<14;i++){this.box(.08,.008,.3,'#f0ecd9',1.2,.085,-4.25+i*.65,.01);this.box(.08,.008,.3,'#f0ecd9',7.1,.085,-4.25+i*.65,.01);}
    for(let i=0;i<9;i++){this.box(.25,.008,.06,'#e9eee5',1.6+i*.62,.085,-4.3,.01);this.box(.25,.008,.06,'#e9eee5',1.6+i*.62,.085,4.3,.01);}
    this.label('LIVING / 01',-4,2.4,-4.72,'#516554',2.1);this.label('MOBILITY / 02',4.2,2.4,-4.72,'#516554',2.3);
    // Work desk and a placeable side table.
    this.box(2.2,.14,1.1,'#a87954',-5.15,.83,-2.3,.045);
    for(const x of [-6.05,-4.25])for(const z of [-2.65,-1.95])this.box(.1,.75,.1,'#5d6355',x,.38,z,.015);
    this.box(.7,.07,.46,'#e1b45a',-5.8,.94,-2.4,.02);this.box(.67,.04,.43,'#efe6d6',-5.8,.998,-2.4,.01);
    this.box(.5,.035,.36,'#658f87',-4.52,.93,-2.38,.015);
    this.cylinder(.6,.6,.12,'#b48a64',-1.7,.85,-2.8);this.cylinder(.085,.085,.76,'#6b7467',-1.7,.4,-2.8);this.cylinder(.38,.42,.08,'#6b7467',-1.7,.07,-2.8);
    this.cylinder(.21,.21,.01,'#ddad6c',CUP_DEST.x,.917,CUP_DEST.z);
    // Lounge chair, its front faces +Z.
    const chair=new THREE.Group();chair.position.set(SEAT.x,0,SEAT.z-.3);this.scene.add(chair);
    this.box(1.4,.32,1.3,'#769184',0,.38,0,.11,chair);this.box(1.1,.17,1.06,'#e7dfca',0,.49,.03,.09,chair);
    this.box(1.35,.93,.25,'#759185',0,.87,-.55,.12,chair);this.box(1.09,.65,.16,'#e9e1cc',0,.99,-.37,.075,chair);
    for(const x of [-.67,.67])this.box(.16,.47,1.19,'#789285',x,.65,0,.07,chair);
    for(const x of [-.48,.48])for(const z of [-.44,.44])this.box(.1,.26,.1,'#815f48',x,.16,z,.02,chair);
    const pillow=this.box(.44,.4,.18,'#c47e59',-.21,.97,-.19,.08,chair);pillow.rotation.z=.13;
    this.cylinder(.33,.28,.45,'#d3a877',-3.17,.26,2.2);
    this.cylinder(.38,.38,.07,'#dcc6a0',-3.17,.52,2.2);
    // Shelving with books and small decorative objects.
    this.box(.61,1.95,3.05,'#a77d58',-7.12,.99,-2.4,.04);
    for(let row=0;row<3;row++){this.box(.57,.52,2.85,'#dcc8a8',-7.04,.39+row*.6,-2.4,.02);for(let i=0;i<7;i++){const book=this.box(.42,.28+(i%3)*.06,.13,['#77948a','#d7ad74','#a46c55','#e9d9b8'][i%4],-6.98,.3+row*.6,-3.5+i*.31,.008);}}
    this.plant(-1.4,3.6,1.1);this.plant(-6.8,3.65,1.5);
    this.box(.35,1.7,1.8,'#92a997',.45,.87,-3.5,.07);for(let i=0;i<7;i++)this.box(.39,1.8,.035,'#c8d0ba',.45,.9,-4.3+i*.25,.008);
    // A standing light adds a warm accent without expensive extra shadows.
    this.cylinder(.27,.32,.08,'#656859',-6.45,.08,1.3);this.cylinder(.028,.028,2.05,'#656859',-6.45,1.08,1.3);this.cylinder(.28,.42,.4,'#f0dba8',-6.45,2.05,1.3);
    const lamp=new THREE.PointLight('#ffd59d',2,4);lamp.position.set(-6.45,1.85,1.3);this.scene.add(lamp);
    this.label('拿取',-5.15,1.4,-2.3,'#365b4d',.85);this.label('放置',-1.7,1.4,-2.8,'#365b4d',.85);this.label('休息',-4.7,1.9,1.55,'#365b4d',.85);
  }
  buildCar(){
    const car=this.carGroup=new THREE.Group();this.scene.add(car);
    this.box(1.27,.3,1.9,'#355e56',0,.42,0,.12,car);this.box(1.22,.34,.52,'#8cb3a0',0,.65,.73,.11,car);this.box(1.22,.42,.37,'#8cb3a0',0,.7,-.83,.08,car);
    this.box(1.0,.11,.88,'#d9c7a4',0,.6,-.08,.055,car);this.box(.86,.16,.56,'#f2e5c8',0,.73,-.22,.07,car);this.box(.88,.66,.14,'#ebdfc6',0,1.02,-.5,.065,car);
    this.box(.98,.06,.38,'#34534c',0,.31,.33,.02,car);
    for(const x of [-.46,.46])this.box(.17,.11,.04,this.mat('#fff2bc',.2),x,.67,1.002,.025,car);
    this.box(.49,.14,.04,'#2a403a',0,.52,1.01,.02,car);
    for(let i=0;i<5;i++)this.box(.025,.1,.01,'#7b9785',-.16+i*.08,.52,1.04,.002,car);
    for(const z of [-.66,.64])for(const x of [-.65,.65]){const group=new THREE.Group();group.position.set(x,.29,z);car.add(group);const tire=this.cylinder(.285,.285,.18,'#343b37',0,0,0,group,24);tire.rotation.z=Math.PI/2;const hub=this.cylinder(.14,.14,.185,'#c7c2af',0,0,0,group,18);hub.rotation.z=Math.PI/2;this.wheels.push({group,front:z>0,tire,hub});}
    const column=this.cylinder(.035,.035,.42,'#364d45',0,.84,.36,car);column.rotation.x=-.35;
    this.steering=new THREE.Group();this.steering.position.set(0,1.02,.3);this.steering.rotation.x=.55;car.add(this.steering);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.24,.028,10,32),this.mat('#33483e'));this.steering.add(ring);
    this.box(.4,.035,.035,'#33483e',0,0,0,.015,this.steering);this.sphere(.055,'#bcb78e',0,0,0,this.steering);
    this.label('驾驶体验',4.4,2,2.1,'#365b4d',1.2);
  }
  buildCup(){this.cupGroup=new THREE.Group();this.scene.add(this.cupGroup);this.cylinder(.115,.09,.22,'#c37350',0,.08,0,this.cupGroup);this.cylinder(.096,.096,.012,'#513d2c',0,.192,0,this.cupGroup);const handle=new THREE.Mesh(new THREE.TorusGeometry(.076,.019,10,24),this.mat('#c37350'));handle.position.set(.124,.1,0);this.cupGroup.add(handle);this.cupGroup.position.set(CUP_HOME.x,CUP_HOME.y,CUP_HOME.z);}
  async loadCharacter(){
    this.characters={};this.setCharacter('v2');this.ready=true;
    return {source:'Original procedural geometry and motion',version:'v2',bones:Object.keys(this.bones),animations:['idle','walk','run','reach','sit','stand','drive']};
  }
  setCharacter(version){
    if(this.avatar)this.scene.remove(this.avatar);
    this.characters[version]??=version==='v1'?new FirstCharacter():new OriginalCharacter();
    this.avatarSystem=this.characters[version];this.avatar=this.avatarSystem.root;this.model=this.avatar;this.bones=this.avatarSystem.bones;
    this.avatarSystem.lastPosition=null;this.avatarSystem.gait=null;this.characterVersion=version;this.scene.add(this.avatar);
    this.avatarSystem.update(this.world,0,this.cupGroup);
  }
  setOutfit(color){this.avatarSystem?.setOutfit(color);}
  setAppearance(value){return this.characters?.v2?.setAppearance(value);}
  setExpression(name){this.avatarSystem?.setExpression?.(name);}
  portrait(angle='front'){
    if(!this.avatar)return;
    const c=this.world.character,offset=angle==='side'?new THREE.Vector3(4,1.9,.05):angle==='back'?new THREE.Vector3(.15,1.9,-4.2):new THREE.Vector3(.72,1.97,4.5);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0),c.yaw);this.camera.position.set(c.x+offset.x,offset.y,c.z+offset.z);
    this.controls.target.set(c.x,1.02,c.z);this.follow=true;this.frameLens();
  }
  resize(){const rect=this.canvas.parentElement.getBoundingClientRect();this.renderer.setSize(rect.width,rect.height,false);this.camera.aspect=rect.width/rect.height;this.frameLens();}
  frameLens(){this.camera.fov=this.follow?36:THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(Math.PI/10)*Math.max(1,1.25/this.camera.aspect)));this.camera.updateProjectionMatrix();}
  home(){this.follow=false;this.camera.position.set(13,13.5,18);this.controls.target.set(0,.4,0);this.frameLens();}
  close(){this.portrait('front');}
  floorPoint(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);return this.ray.ray.intersectPlane(this.floorPlane,new THREE.Vector3());}
  update(dt){
    const w=this.world,c=w.character;this.carGroup.position.set(w.car.x,0,w.car.z);this.carGroup.rotation.y=w.car.yaw;
    for(const wheel of this.wheels){wheel.group.rotation.y=wheel.front?w.car.steer:0;wheel.tire.rotation.x=w.car.distance/.28;wheel.hub.rotation.x=w.car.distance/.28;}
    this.steering.rotation.z=-w.car.steer*1.8;
    if(this.ready){
      this.avatarSystem.update(w,dt,this.cupGroup);this.currentClip=c.mode;
      if(this.follow){const target=new THREE.Vector3(c.x,1,c.z),delta=target.clone().sub(this.controls.target);this.controls.target.addScaledVector(delta,Math.min(1,dt*4));this.camera.position.addScaledVector(delta,Math.min(1,dt*4));}
    }
    if(w.path.length){this.marker.visible=true;const t=w.path.at(-1);this.marker.position.set(t.x,.095,t.z);this.marker.scale.setScalar(1+.1*Math.sin(w.time*5));}else this.marker.visible=false;
    this.controls.update();
    for(const piece of this.wallBack)piece.visible=this.camera.position.z>-4.6;
    for(const piece of this.wallLeft)piece.visible=this.camera.position.x>-6.8;
    this.renderer.render(this.scene,this.camera);
  }
}
