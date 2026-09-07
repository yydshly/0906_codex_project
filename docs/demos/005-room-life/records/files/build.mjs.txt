import { build } from 'esbuild';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {buildRecords} from './build-records.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../docs/demos/005-room-life');
await mkdir(path.join(out,'assets'), {recursive:true});
await build({entryPoints:[path.join(here,'src/main.js')],bundle:true,format:'esm',minify:true,outfile:path.join(out,'app.js'),legalComments:'eof'});
await copyFile(path.join(here,'src/style.css'),path.join(out,'style.css'));
const [script,style,template]=await Promise.all([
  readFile(path.join(out,'app.js')),readFile(path.join(out,'style.css')),readFile(path.join(here,'src/index.html'),'utf8')
]);
const version=data=>createHash('sha256').update(data).digest('hex').slice(0,12);
await writeFile(path.join(out,'index.html'),template
  .replace('src="./app.js"',`src="./app.js?v=${version(script)}"`)
  .replace('href="./style.css"',`href="./style.css?v=${version(style)}"`));
await copyFile(path.join(here,'node_modules/three/LICENSE'),path.join(out,'assets/three-LICENSE.txt'));
const records=await buildRecords(here,out);
console.log('Built '+records.pages+' record pages');
console.log('Built room-life-lab');
