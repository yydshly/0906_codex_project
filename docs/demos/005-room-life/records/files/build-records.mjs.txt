import {Marked,Renderer} from 'marked';
import {readFile,writeFile,copyFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const escape=value=>String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const inside=(root,file)=>{const rel=path.relative(root,file);return !rel.startsWith('..')&&!path.isAbsolute(rel);};
const relative=(from,to)=>encodeURI(path.relative(path.dirname(from),to).split(path.sep).join('/'));

export async function buildRecords(here,out){
  const docs=path.resolve(out,'../..'),entry=path.join(here,'optimization-log.md');
  const pages=new Map([[entry,path.join(out,'updates.html')]]),files=new Map(),finished=new Set(),links=[];
  const css=await readFile(path.join(here,'src/records.css'));
  await writeFile(path.join(out,'records.css'),css);
  const cssVersion=createHash('sha256').update(css).digest('hex').slice(0,12);
  while([...pages.keys()].some(file=>!finished.has(file))){
    const source=[...pages.keys()].find(file=>!finished.has(file)),destination=pages.get(source);
    finished.add(source);
    const markdown=await readFile(source,'utf8'),title=markdown.match(/^# (.+)$/m)?.[1]??'实验记录';
    const toc=[],ids=new Map(),renderer=new Renderer(),defaultTable=renderer.table;
    const rewrite=href=>{
      if(/^(https?:|mailto:|#)/i.test(href))return href;
      if(/^[a-z][a-z\d+.-]*:/i.test(href))return '#';
      const [file,fragment]=href.split('#'),target=path.resolve(path.dirname(source),decodeURI(file));
      let output;
      if(inside(docs,target))output=target;
      else if(inside(here,target)){
        const rel=path.relative(here,target);
        if(path.extname(target)==='.md'){
          if(!pages.has(target))pages.set(target,path.join(out,'records',rel.replace(/\.md$/,'.html')));
          output=pages.get(target);
        }else{
          output=path.join(out,'records/files',rel+'.txt');files.set(target,output);
        }
      }else if(target===path.resolve(here,'../../README.md'))output=path.join(docs,'index.html');
      else throw new Error('未映射的记录链接：'+source+' -> '+href);
      links.push({output,fragment,source});
      return relative(destination,output)+(fragment?'#'+fragment:'');
    };
    renderer.heading=function({tokens,depth,text}){
      if(depth===1)return '';
      const plain=text.replace(/[*\x60]/g,''),base=plain.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s/g,'-');
      const count=ids.get(base)??0;ids.set(base,count+1);const id=base+(count?'-'+count:'');
      if(depth===2)toc.push({id,title:plain});
      return '<h'+depth+' id="'+escape(id)+'">'+this.parser.parseInline(tokens)+'</h'+depth+'>';
    };
    renderer.html=({text})=>escape(text);
    renderer.image=({href,text})=>'<img src="'+escape(href)+'" alt="'+escape(text)+'" loading="lazy" decoding="async">';
    renderer.table=function(token){
      if(token.header[0]?.text==='记录')return '<div class="history-grid">'+[...token.rows].reverse().map((row,i)=>
        '<details class="history-card"'+(i===0?' open':'')+'><summary>'+this.parser.parseInline(row[0].tokens)+'</summary><dl>'+
        row.slice(1).map((cell,j)=>'<dt>'+escape(token.header[j+1].text)+'</dt><dd>'+this.parser.parseInline(cell.tokens)+'</dd>').join('')+'</dl></details>').join('')+'</div>';
      return '<div class="table-scroll" tabindex="0" role="region" aria-label="'+escape(token.header.map(h=>h.text).join('、'))+'">'+defaultTable.call(this,token)+'</div>';
    };
    const marked=new Marked({renderer,walkTokens(token){if(token.type==='link'||token.type==='image')token.href=rewrite(token.href);}});
    const content=marked.parse(markdown);
    const demo=relative(destination,path.join(out,'index.html')),updates=relative(destination,path.join(out,'updates.html'));
    const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f2eb"><title>'+escape(title)+' · 栖居</title><link rel="icon" href="data:,"><link rel="stylesheet" href="'+relative(destination,path.join(out,'records.css'))+'?v='+cssVersion+'"></head><body>'+
      '<a class="skip" href="#record-content">跳到正文</a><header class="record-header"><a class="brand" href="'+demo+'">栖居 <span>ROOM LIFE LAB</span></a><nav aria-label="记录导航"><a href="'+updates+'">优化记录</a><a href="'+demo+'">返回房间 ↗</a></nav></header>'+
      '<main><div class="record-intro"><span class="eyebrow">栖居 · 迭代档案</span><h1>'+escape(title)+'</h1><p>每轮的问题、修改、验证与待办，都在这里保留。</p></div><nav class="contents" aria-label="本页目录">'+
      toc.map(item=>'<a href="#'+escape(item.id)+'">'+escape(item.title)+'</a>').join('')+'</nav><article id="record-content">'+content+'</article></main>'+
      '<footer>记录随演示构建同步更新 · 历史截图对应当时版本 · <a href="#">回到顶部 ↑</a></footer></body></html>';
    await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,html);
  }
  for(const [source,destination] of files){await mkdir(path.dirname(destination),{recursive:true});await copyFile(source,destination);}
  for(const {output,fragment,source} of links){
    await access(output);
    if(fragment&&path.extname(output)==='.html'){
      const html=await readFile(output,'utf8');
      if(!html.includes('id="'+escape(decodeURI(fragment))+'"'))throw new Error('记录锚点不存在：'+source+' -> '+output+'#'+fragment);
    }
  }
  await copyFile(path.join(here,'node_modules/marked/LICENSE'),path.join(out,'assets/marked-LICENSE.txt'));
  return {pages:pages.size,files:files.size};
}
