// Walkable surface heights shared by room rendering and character placement.
export const GROUND={
  wood:{top:.0475,thickness:.025},
  rug:{x:-4,z:.2,width:5.2,depth:4.5,top:.0775,thickness:.025},
  lane:{x:4.12,z:0,width:6.15,depth:9.2,top:.076,thickness:.032}
};
export function groundHeight(x,z){
  let height=GROUND.wood.top;
  for(const area of [GROUND.rug,GROUND.lane])if(Math.abs(x-area.x)<=area.width/2&&Math.abs(z-area.z)<=area.depth/2)height=Math.max(height,area.top);
  return height;
}
