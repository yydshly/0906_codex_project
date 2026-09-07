// Authored walking phases: heel contact, load, extended support, toe release.
export const WALK_STANCE=.60;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function walkingPitch(step){
  if(step<.12)return -.18*(1-smooth(step/.12));
  return .40*smooth((step-.43)/(WALK_STANCE-.43));
}
export function walkingBend(step){
  const keys=[[0,8],[.10,15],[.28,5],[.42,6],[WALK_STANCE,28]];
  const i=Math.min(keys.length-2,Math.max(0,keys.findIndex((p,j)=>j<keys.length-1&&step<=keys[j+1][0])));
  const [a,x]=keys[i],[b,y]=keys[i+1];return x+(y-x)*smooth((step-a)/(b-a));
}
export function walkingSwing(t){
  // Recover the trailing foot early, flex for clearance, extend before landing.
  const forward=1-Math.pow(1-t,2);
  const lift=.095*Math.pow(Math.sin(Math.PI*t),1.25);
  const pitch=.40*(1-smooth(t/.40))-.18*smooth((t-.65)/.35);
  return {forward,lift,pitch};
}
