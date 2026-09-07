// Apply the documented teaching additions to the pinned, unmodified upstream viewer.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const base=new URL('./',import.meta.url);
let src=fs.readFileSync(new URL('upstream/assets/web-template/app.js',base),'utf8');
function replace(a,b){if(!src.includes(a))throw Error('Upstream contract changed: '+a);src=src.replace(a,b);}
replace("const stage=document.querySelector('#stage'), loading=document.querySelector('#loading');","import {setupLab} from './lab.js';\nconst stage=document.querySelector('#stage'), loading=document.querySelector('#loading');");
replace('uniform float uTime,uFoil,uScale,uDepth,uBgDepth,uSafeScale;','uniform float uTime,uFoil,uScale,uDepth,uBgDepth,uSafeScale;\nuniform float uParallaxEnabled,uFoilEnabled,uLineEnabled,uStarEnabled;');
replace('*d*.14;','*d*.14*uParallaxEnabled;');
replace('uFoil*.28);','uFoil*.28*uFoilEnabled);');
replace('uFoil*.36);','uFoil*.36*uFoilEnabled);');
replace('col+=foil*sweep*uFoil*.28;','col+=foil*sweep*uFoil*.28*uFoilEnabled;');
replace('sub.a*sweep*uFoil*.22;','sub.a*sweep*uFoil*.22*uLineEnabled;');
replace('*(1.-sub.a*.7);','*(1.-sub.a*.7)*uStarEnabled;');
replace("config.subtitle?.includes('雷')?'雷':'幻'","'鹿'");
replace("'HOLOGRAPHIC ATELIER'","'MOONLIT / RESEARCH LAB'");
replace("document.title=config.title+' · 幻光典藏'","document.title='幻光研究室 · '+config.title");
replace('renderer.setClearColor(0x000000,1)','renderer.setClearColor(0x010203,1)');
replace('uniforms={tSubject:','uniforms={uParallaxEnabled:{value:1},uFoilEnabled:{value:1},uLineEnabled:{value:1},uStarEnabled:{value:1},tSubject:');
replace('setupControls();new ResizeObserver','setupControls();setupLab({uniforms,config,reset,flip,setAuto,renderer,composer,root,camera});new ResizeObserver');
// Fixed upstream keyboard F bug: clamping used the pre-flip base angle.
replace("if(e.key.toLowerCase()==='f')flip();if(e.key.toLowerCase()==='r')reset();","if(e.key.toLowerCase()==='f'){flip();return;}if(e.key.toLowerCase()==='r'){document.getElementById('reset').click();return;}");
replace("flipped=false;setAuto(false);$('view-label')","flipped=false;setAuto(false);$('flip').innerHTML='翻看背面 ↻';$('view-label')");
fs.writeFileSync(new URL('web-src/app.js',base),'// Adapted from Holo Card Studio 01acf39; MIT. See ../upstream/LICENSE.\n'+src);
console.log('Adapted viewer:',fileURLToPath(new URL('web-src/app.js',base)));
