// A bounded original collection: geometry choices and coordinated material palettes.
export const APPEARANCE_KEY='room-life.appearance.v1';
export const OPTIONS={
  face:[['defined','清秀'],['soft','柔和']],
  hair:[['sweep','侧分短发'],['crop','清爽短发'],['bob','齐耳短发']],
  top:[['jacket','翻领外套'],['knit','圆领针织']],
  bottom:[['taper','锥形长裤'],['straight','直筒长裤']],
  shoes:[['sneakers','休闲鞋'],['boots','短靴']],
  palette:[['sage','鼠尾草'],['clay','陶土'],['ink','深海']],
  skin:[['peach','暖杏'],['honey','蜜棕'],['umber','深棕']],
  hairColor:[['chestnut','栗棕'],['black','墨黑'],['copper','赤茶']]
};
export const PALETTES={sage:{top:'#63877a',bottom:'#a18f76',shoe:'#f2e7d5',accent:'#779588'},clay:{top:'#b9765e',bottom:'#595a52',shoe:'#e5d9c4',accent:'#a06550'},ink:{top:'#495f77',bottom:'#8d9697',shoe:'#e1e4e1',accent:'#4c6070'}};
export const SKINS={peach:'#dfb59e',honey:'#ba8564',umber:'#825642'};
export const HAIR_COLORS={chestnut:'#49332c',black:'#262626',copper:'#875039'};
export const DEFAULT_APPEARANCE=Object.freeze({face:'defined',hair:'sweep',top:'jacket',bottom:'taper',shoes:'sneakers',palette:'sage',skin:'peach',hairColor:'chestnut'});
export function normalizeAppearance(value){
  const input=value&&typeof value==='object'?value:{};
  return Object.fromEntries(Object.entries(OPTIONS).map(([key,choices])=>[key,choices.some(([id])=>id===input[key])?input[key]:DEFAULT_APPEARANCE[key]]));
}
export function readAppearance(storage){
  try{const raw=storage.getItem(APPEARANCE_KEY);if(!raw)return {value:{...DEFAULT_APPEARANCE},status:'empty'};const data=JSON.parse(raw);if(data?.version!==1)throw new Error('version');return {value:normalizeAppearance(data.appearance),status:'saved'};}
  catch{return {value:{...DEFAULT_APPEARANCE},status:'unavailable'};}
}
export function saveAppearance(storage,value){storage.setItem(APPEARANCE_KEY,JSON.stringify({version:1,appearance:normalizeAppearance(value)}));}
