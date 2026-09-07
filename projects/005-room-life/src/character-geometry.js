import * as THREE from 'three';

// Original surface construction shared by the character. No external assets.
export function surface(rows, columns, sample) {
  const positions=[], colors=[], indices=[];
  for(let i=0;i<=rows;i++) for(let j=0;j<=columns;j++) {
    const p=sample(i/rows,j/columns);
    positions.push(p.x,p.y,p.z);
    if(p.color)colors.push(p.color.r,p.color.g,p.color.b);
    if(i<rows&&j<columns){const a=i*(columns+1)+j;indices.push(a,a+1,a+columns+1,a+1,a+columns+2,a+columns+1);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  if(colors.length)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

export function profileAt(profile,y) {
  let i=0;while(i<profile.length-2&&y>profile[i+1][0])i++;
  const a=profile[i],b=profile[i+1],t=THREE.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);
  const p0=profile[Math.max(0,i-1)],p3=profile[Math.min(profile.length-1,i+2)];
  // Smooth radii along a handmade silhouette without bulging at thin endpoints.
  return a.slice(1).map((v,k)=>{
    const n=k+1,m0=(b[n]-p0[n])/(b[0]-p0[0])*(b[0]-a[0]),m1=(p3[n]-a[n])/(p3[0]-a[0])*(b[0]-a[0]);
    return (2*t**3-3*t*t+1)*v+(t**3-2*t*t+t)*m0+(-2*t**3+3*t*t)*b[n]+(t**3-t*t)*m1;
  });
}

export function profileGeometry(profile,{rows=44,columns=48,deform=null}={}) {
  const min=profile[0][0],max=profile.at(-1)[0];
  return surface(rows,columns,(u,v)=>{
    const y=THREE.MathUtils.lerp(min,max,u),[rx,rz,cz=0]=profileAt(profile,y),a=v*Math.PI*2;
    // Bottom to top, clockwise viewed from above: outward-facing triangles.
    const p={x:Math.sin(a)*rx,y,z:Math.cos(a)*rz+cz};
    return deform?deform(p,a):p;
  });
}

export function weightGeometry(geometry,bones,getWeights) {
  const skin=[],weights=[],p=geometry.getAttribute('position');
  for(let i=0;i<p.count;i++) {
    const influences=getWeights(new THREE.Vector3().fromBufferAttribute(p,i));
    const entries=influences.filter(([,w])=>w>0).slice(0,4),sum=entries.reduce((n,[,w])=>n+w,0);
    for(let j=0;j<4;j++){skin.push(j<entries.length?bones.indexOf(entries[j][0]):0);weights.push(j<entries.length?entries[j][1]/sum:0);}
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));return geometry;
}

export function ribbonGeometry(points,width,depth) {
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return surface(36,16,(t,v)=>{
    const p=path.getPoint(t),tangent=path.getTangent(t).normalize();
    const side=new THREE.Vector3(-tangent.y,tangent.x,0);
    if(side.lengthSq()<.0001)side.set(1,0,0);side.normalize();
    const normal=new THREE.Vector3().crossVectors(tangent,side).normalize();
    const taper=Math.pow(Math.sin(Math.PI*THREE.MathUtils.clamp(t,.002,.998)),.55);
    return p.addScaledVector(side,Math.cos(v*Math.PI*2)*width*taper).addScaledVector(normal,Math.sin(v*Math.PI*2)*depth*taper);
  });
}
