// One foot's airborne recovery, in character-local metres and radians.
// The heel folds behind the body before the knee brings the leg forward.
const keys=[
  [0, .278,-.36,.85],
  [.23,.57,-.34,1.05],
  [.48,.53,-.04,.38],
  [.73,.35,.29,-.12],
  [1,.15,.23,0]
];
export const RUN_STANCE=.34;
export const RUN_STRIDE=1.65;
export function recovery(t){
  t=Math.max(0,Math.min(1,t));
  const i=Math.min(keys.length-2,keys.findIndex((p,j)=>j<keys.length-1&&t<=keys[j+1][0]));
  const a=keys[i],b=keys[i+1],span=b[0]-a[0],u=(t-a[0])/span;
  return [1,2,3].map(axis=>{
    const tangent=j=>j===0?(keys[1][axis]-keys[0][axis])/(keys[1][0]-keys[0][0]):
      j===keys.length-1?(axis===2?-RUN_STRIDE*(1-RUN_STANCE):0):
      (keys[j+1][axis]-keys[j-1][axis])/(keys[j+1][0]-keys[j-1][0]);
    return (2*u**3-3*u*u+1)*a[axis]+(u**3-2*u*u+u)*span*tangent(i)+
      (-2*u**3+3*u*u)*b[axis]+(u**3-u*u)*span*tangent(i+1);
  });
}
export function runningHeight(cycle){
  const step=((cycle%.5)+.5)%.5;
  if(step<RUN_STANCE){const t=step/RUN_STANCE;return .91-.035*Math.sin(t*Math.PI)+.075*t*t;}
  const t=(step-RUN_STANCE)/(.5-RUN_STANCE);
  return .985+.022*4*t*(1-t)-.085*t*t*(3-2*t);
}
