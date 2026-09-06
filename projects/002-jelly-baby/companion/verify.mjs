// node --experimental-strip-types verify.mjs <companion-build directory>
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const work=path.resolve(process.argv[2]);
globalThis.document={documentElement:{dataset:{}}};
const load=name=>import(pathToFileURL(path.join(work,'src',name)).href);
const {parseBabyCage}=await load('physics/baby-cage.ts');
const {reshapeCharacter}=await load('physics/character-shape.ts');
const {SoftBody}=await load('physics/soft-body.js');
const {Locomotion}=await load('game/locomotion.ts');
const bytes=await readFile(path.join(work,'src/assets/model/jelly-baby.bin'));
const meta=JSON.parse(await readFile(path.join(work,'src/assets/model/jelly-baby.json'),'utf8'));
const cage=reshapeCharacter(parseBabyCage(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),meta));
const body=new SoftBody(cage),rig=new Locomotion(body);
let minimum=Infinity;
for(const pose of [{},{tilt:.75,bow:.5},{wave:1},{crouch:1},{tilt:-.8},{bow:.65},{}]){
  Object.assign(rig.pose,{tilt:0,bow:0,wave:0,crouch:0,breath:0},pose);
  for(let i=0;i<240;i++){
    rig.step(1/240);body.step(1/240);rig.afterStep();
    if(!body.isFinite())throw new Error('Nonfinite physics state');
    minimum=Math.min(minimum,body.lastMinJacobian);
    if(body.lastMinJacobian<=0)throw new Error('Inverted simulated tetrahedron');
  }
}
rig.jump();
for(let i=0;i<480;i++){rig.step(1/240);body.step(1/240);rig.afterStep();if(!body.isFinite()||body.lastMinJacobian<=0)throw new Error('Jump stability failure');}
body.reset();body.updateSurface();
if(!body.isFinite())throw new Error('Reset failure');
console.log(JSON.stringify({tetrahedra:cage.tets.length,restMinRatio:document.documentElement.dataset.shapeMinRatio,minimumSimulatedJacobian:minimum,steps:2160,reset:'passed'}));
