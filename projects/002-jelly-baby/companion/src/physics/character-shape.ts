import type { parseBabyCage } from './baby-cage.ts';

/** Conservative remap: retain topology, recompute rest volumes and both skins. */
export function characterPoint(x:number,y:number,z:number):[number,number,number] {
  const t=Math.max(0,Math.min(1,(y-.029)/.019));
  const head=t*t*(3-2*t);
  const arm=Math.max(0,Math.min(1,(Math.abs(x)-.026)/.012));
  const width=(.78+.28*head)*(1-arm)+.98*arm;
  return [x*width,y*1.16,z*.96];
}
export function reshapeCharacter(cage:ReturnType<typeof parseBabyCage>){
  const original=cage.pos.slice();cage.pos=cage.pos.slice();cage.volumes=cage.volumes.slice();
  for(let i=0;i<cage.pos.length;i+=3)cage.pos.set(characterPoint(original[i],original[i+1],original[i+2]),i);
  const determinant=(p:Float64Array,ids:number[])=>{
    const [a,b,c,d]=ids.map(i=>i*3);
    const ax=p[b]-p[a],ay=p[b+1]-p[a+1],az=p[b+2]-p[a+2];
    const bx=p[c]-p[a],by=p[c+1]-p[a+1],bz=p[c+2]-p[a+2];
    const cx=p[d]-p[a],cy=p[d+1]-p[a+1],cz=p[d+2]-p[a+2];
    return ax*(by*cz-bz*cy)-ay*(bx*cz-bz*cx)+az*(bx*cy-by*cx);
  };
  let volume=0,minRatio=Infinity;
  cage.tets.forEach((ids,i)=>{
    const before=determinant(original,ids),after=determinant(cage.pos,ids),ratio=after/before;
    if(!Number.isFinite(ratio)||ratio<=.1)throw new Error('Character reshape inverted a rest tetrahedron');
    minRatio=Math.min(minRatio,ratio);cage.volumes[i]=Math.abs(after)/6;volume+=cage.volumes[i];
  });
  cage.totalVolume=volume;
  for(const surface of [cage.surface,cage.opticalSurface]){
    const positions=surface.positions;
    for(let i=0;i<positions.length/3;i++)for(let axis=0;axis<3;axis++){
      let value=0;for(let k=0;k<4;k++)value+=cage.pos[surface.bindingIds[i*4+k]*3+axis]*surface.bindingWeights[i*4+k];
      positions[i*3+axis]=value;
    }
    surface.geometry.attributes.position.needsUpdate=true;
    surface.geometry.computeVertexNormals();surface.geometry.computeBoundingBox();surface.geometry.computeBoundingSphere();
    surface.restNormals=new Float32Array(surface.geometry.attributes.normal.array);
  }
  document.documentElement.dataset.shapeMinRatio=minRatio.toFixed(4);
  return cage;
}
