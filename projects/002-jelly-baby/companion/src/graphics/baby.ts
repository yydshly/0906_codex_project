import * as THREE from 'three/webgpu';
import { characterPoint } from '../physics/character-shape.ts';
import { attribute } from 'three/tsl';
import { SurfaceBVH } from './refractive-light.js';
import type { SoftBody } from '../physics/soft-body.js';
import { refinePatch } from './surface-details.ts';

export const ABSORPTION=[48,3.2,85];
type Binding={weights:[number,number][]; offset:number; face:number[]; bary:number[]};

export type Mood='curious'|'happy'|'surprised'|'sleepy';
export class Baby {
  mood:Mood='curious';
  gaze=new THREE.Vector2();
  blink=1;
  private expression={happy:0,surprised:0,sleepy:0};
  private tags=new Map<THREE.Mesh,string>();
  readonly mesh:THREE.Mesh;
  readonly group=new THREE.Group();
  private details:{mesh:THREE.Mesh; bindings:Binding[]}[]=[];
  readonly body:SoftBody;
  constructor(body:SoftBody) {
    this.body=body;
    const material=new THREE.MeshPhysicalNodeMaterial({
      color:'#d8ef92',roughness:.23,metalness:0,transmission:.72,thickness:.035,
      ior:1.35,dispersion:.025,attenuationDistance:.035,
      clearcoat:.42,clearcoatRoughness:.05,envMapIntensity:1.05,
      transparent:false,side:THREE.FrontSide,flatShading:false,
    });
    material.attenuationColor.setRGB(Math.exp(-ABSORPTION[0]*.035),Math.exp(-ABSORPTION[1]*.035),Math.exp(-ABSORPTION[2]*.035),THREE.LinearSRGBColorSpace);
    material.thicknessNode=attribute('opticalThickness','float');
    this.mesh=new THREE.Mesh(body.surface.geometry,material);
    this.mesh.renderOrder=1;
    this.mesh.frustumCulled=false;this.group.add(this.mesh);
    const bvh=new SurfaceBVH(body.surface);
    const eye=new THREE.MeshPhysicalNodeMaterial({color:'#142905',roughness:.13,clearcoat:1,clearcoatRoughness:.06});
    const mouth=new THREE.MeshPhysicalNodeMaterial({color:'#254508',roughness:.24,clearcoat:.6});
    const tongue=new THREE.MeshPhysicalNodeMaterial({color:'#b5d641',roughness:.24,clearcoat:.5});
    const white=new THREE.MeshPhysicalNodeMaterial({color:'#fffbe8',roughness:.32});
    const sparkle=new THREE.MeshBasicNodeMaterial({color:'#ffffff'});
    const leaf=new THREE.MeshPhysicalNodeMaterial({color:'#4c792b',roughness:.45});
    const blush=new THREE.MeshPhysicalNodeMaterial({color:'#edab4f',roughness:.3,transparent:true,opacity:.48,depthWrite:false});
    const add=(geometry:THREE.BufferGeometry,mat:THREE.Material,cx:number,cy:number,depth:number,tag='')=>{
      const pos=geometry.getAttribute('position'),bindings:Binding[]=[];
      for(let i=0;i<pos.count;i++) {
        const [px,py]=characterPoint(pos.getX(i)+cx,pos.getY(i)+cy,0);
        const hit=bvh.hit([px,py,.08],[0,0,-1]);
        if(!hit) throw new Error('Facial detail outside the jelly surface');
        const ids=Array.from(body.surface.indices.slice(hit.t*3,hit.t*3+3)) as number[];
        const weights=new Map<number,number>();
        [1-hit.u-hit.v,hit.u,hit.v].forEach((bary,k)=>{
          for(const [id,w] of body.surface.stencils[ids[k]]) weights.set(id,(weights.get(id)||0)+bary*w);
        });
        bindings.push({weights:[...weights],offset:Math.max(.00008,pos.getZ(i)+depth),face:ids,bary:[1-hit.u-hit.v,hit.u,hit.v]});
      }
      geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos.count*3),3).setUsage(THREE.DynamicDrawUsage));
      const mesh=new THREE.Mesh(geometry,mat);mesh.frustumCulled=false;
      // Three r185 samples the opaque framebuffer for transmission. Surface ink
      // must enter the transparent queue AFTER jelly, otherwise it is refracted
      // as background and appears a second time. Keep depth testing/writing on.
      mat.transparent=true;mesh.renderOrder=2;
      this.group.add(mesh);this.details.push({mesh,bindings});this.tags.set(mesh,tag);
    };
    const oval=(x:number,y:number,z:number)=>new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,Math.PI/2).rotateX(Math.PI/2).scale(x,y,z);
    for(const sign of [-1,1]) {
      add(oval(.0048,.0058,.0012),white,sign*.0095,.0465,.0002,'eye');
      add(oval(.0027,.0036,.001),eye,sign*.0095,.0465,.00155,'pupil');
      add(oval(.0008,.001,.0002),sparkle,sign*.0095-.0008,.0475,.00265,'sparkle');
      add(oval(.0043,.0024,.00016),blush,sign*.014,.0388,.00010);
      const brow=new THREE.CatmullRomCurve3([
        new THREE.Vector3(-.0021,-.0005,0),new THREE.Vector3(0,.00045,0),new THREE.Vector3(.0021,-.0002,0),
      ]);
      add(new THREE.TubeGeometry(brow,16,.00048,8,false),mouth,sign*.0097,.0542,.00025,'brow');
    }
    const smile=new THREE.Shape();
    smile.moveTo(-.0046,.0019);smile.bezierCurveTo(-.002,.0006,.002,.0006,.0046,.002);
    smile.bezierCurveTo(.0055,-.0046,-.0048,-.0052,-.0046,.0019);
    add(refinePatch(new THREE.ShapeGeometry(smile,24)),mouth,0,.0389,.00018,'mouth');
    const lip=new THREE.Shape();lip.absellipse(0,0,.0024,.00125,0,Math.PI*2,false,0);
    add(refinePatch(new THREE.ShapeGeometry(lip,24)),tongue,0,.0368,.00028,'lip');
    const leafShape=new THREE.Shape();leafShape.moveTo(0,-.004);
    leafShape.bezierCurveTo(-.003,-.002,-.004,.001,0,.004);
    leafShape.bezierCurveTo(.004,.001,.003,-.002,0,-.004);
    add(refinePatch(new THREE.ShapeGeometry(leafShape,16).rotateZ(.55)),leaf,-.002,.058,.001,'leaf');
    add(refinePatch(new THREE.ShapeGeometry(leafShape,16).scale(.85,.85,1).rotateZ(-.6)),leaf,.002,.0575,.001,'leaf');
    this.update();
  }
  update(dt=1/60) {
    const ease=1-Math.exp(-10*dt);
    for(const key of ['happy','surprised','sleepy'] as const)this.expression[key]+=((this.mood===key?1:0)-this.expression[key])*ease;
    const x=this.body.x,n=this.body.surface.geometry.attributes.normal.array;
    const normal=new THREE.Vector3();
    const horizontal=new THREE.Vector3(1,0,0);
    const rest=this.body.rest;
    let sx=0,sz=0;
    for(let i=0;i<this.body.mass.length;i++){sx+=rest[i*3]*(x[i*3]-this.body.center.x);sz+=rest[i*3]*(x[i*3+2]-this.body.center.z);}
    const bodyRight=new THREE.Vector3(sx,0,sz).normalize();
    if(bodyRight.lengthSq()<.01)bodyRight.set(1,0,0);
    for(const {mesh,bindings} of this.details) {
      const positions=mesh.geometry.getAttribute('position');
      bindings.forEach((binding,i)=>{
        let px=0,py=0,pz=0;
        for(const [id,w] of binding.weights) {px+=x[id*3]*w;py+=x[id*3+1]*w;pz+=x[id*3+2]*w;}
        normal.set(0,0,0);
        binding.face.forEach((id,k)=>{
          const w=binding.bary[k];normal.x+=n[id*3]*w;normal.y+=n[id*3+1]*w;normal.z+=n[id*3+2]*w;
        });
        normal.normalize().multiplyScalar(binding.offset);
        positions.setXYZ(i,px+normal.x,py+normal.y,pz+normal.z);
      });
      const tag=this.tags.get(mesh),center=new THREE.Vector3(),faceNormal=new THREE.Vector3();
      for(let i=0;i<positions.count;i++){center.x+=positions.getX(i);center.y+=positions.getY(i);center.z+=positions.getZ(i);}
      center.divideScalar(positions.count);
      const b=bindings[0];
      b.face.forEach((id,k)=>faceNormal.addScaledVector(new THREE.Vector3(n[id*3],n[id*3+1],n[id*3+2]),b.bary[k]));
      faceNormal.normalize();
      // Project body orientation onto each attachment's moving surface tangent.
      horizontal.copy(bodyRight);
      const up=new THREE.Vector3().crossVectors(faceNormal,horizontal).normalize();
      horizontal.crossVectors(up,faceNormal).normalize();
      const eyePart=tag==='eye'||tag==='pupil'||tag==='sparkle';
      if(tag==='sparkle')center.addScaledVector(up,-.001).addScaledVector(horizontal,.0008);
      let scaleX=1,scaleY=1,dx=0,dy=0;
      const lid=(1-.86*this.expression.sleepy-.3*this.expression.happy)*this.blink;
      if(eyePart){scaleY=Math.max(.06,lid);if(tag!=='eye'){dx=this.gaze.x*.0015;dy=this.gaze.y*.0011;}}
      if(tag==='mouth'||tag==='lip'){
        scaleX=.9-.32*this.expression.surprised+.35*this.expression.happy;
        scaleY=.65+this.expression.surprised-.5*this.expression.sleepy+.55*this.expression.happy;
        mesh.visible=tag!=='lip'||this.mood==='happy';
      }
      if(tag==='brow')dy=.0015*this.expression.surprised-.001*this.expression.sleepy;
      if(tag==='leaf')dy=.020;
      const point=new THREE.Vector3();
      for(let i=0;i<positions.count;i++){
        point.fromBufferAttribute(positions,i).sub(center);
        const a=point.dot(horizontal),b=point.dot(up);
        point.addScaledVector(horizontal,a*(scaleX-1)+dx).addScaledVector(up,b*(scaleY-1)+dy).add(center);
        positions.setXYZ(i,point.x,point.y,point.z);
      }
      positions.needsUpdate=true;mesh.geometry.computeVertexNormals();
    }
  }
  dispose() {
    this.group.traverse(object=>{
      if(object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials=Array.isArray(object.material)?object.material:[object.material];
        materials.forEach(m=>m.dispose());
      }
    });
  }
}
