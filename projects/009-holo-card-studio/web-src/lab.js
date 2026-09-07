const $=id=>document.getElementById(id);
const modes={all:{flags:[1,1,1,1],note:'视差、虹彩与细闪共同组成成品效果。'},print:{flags:[0,0,0,0],note:'关闭画面内视差与光效，对照原始印刷色彩。卡片仍可转动。'},depth:{flags:[1,0,0,0],note:'向两侧转动：白鹿与森林反向错动，文字保持原位。'},foil:{flags:[0,1,0,0],note:'转动卡片，观察彩色光带的位置。虹彩由视角驱动。'},line:{flags:[0,0,1,0],note:'缓慢左右转动：细轮廓在光带经过时亮起，整体保持克制。'},star:{flags:[0,0,0,1],note:'稍等片刻，观察背景中的稀疏闪点；转动也会改变它们的亮度。'}};
const names=['uParallaxEnabled','uFoilEnabled','uLineEnabled','uStarEnabled'];
const layers={background:['背景层 · 向后延伸','森林和月亮保持在主体后方。深度为负时，与主体产生相反方向的视差。'],subject:['主体层 · 向前浮起','PNG 内含真实透明通道。透明处透出森林；主体缩放与安全区映射为文字留出空间。'],lineart:['线稿层 · 有选择地发光','根据同一白鹿图生成的线稿。深色线条经过阈值处理，再与移动扫光相乘；不是整张图发光。生成线稿仍需检查局部对齐。'],text:['文字层 · 保持阅读稳定','由上游排版脚本生成，使用本机楷体字体。它始终以零视差覆盖卡面，标题与编号不会跟着主体漂移。']};
export function setupLab({uniforms,config,reset,root,camera}){
  let currentMode='all';
  const setMode=mode=>{currentMode=mode;modes[mode].flags.forEach((value,i)=>uniforms[names[i]].value=value);document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===mode)));$('mode-note').textContent=modes[mode].note;};
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.mode)));
  const restore=()=>{reset();setMode('all');for(const [id,key] of [['foil','foil'],['scale','subjectScale'],['depth','subjectDepth'],['bg-depth','backgroundDepth']]){$(id).value=config.parameters[key];$(id).dispatchEvent(new Event('input'));}};
  // Property handler is assigned by upstream after this initializer; this listener restores parameters too.
  $('reset').addEventListener('click',restore);
  $('export-config').addEventListener('click',()=>{
    const out=structuredClone(config);out.parameters={subjectScale:uniforms.uScale.value,subjectDepth:uniforms.uDepth.value,backgroundDepth:uniforms.uBgDepth.value,foil:uniforms.uFoil.value};
    const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='card-config.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('export-config').innerHTML='参数已导出 <span>✓</span>';setTimeout(()=>$('export-config').innerHTML='导出我的参数 <span>↗</span>',2000);
  });
  document.querySelectorAll('[data-layer]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.layer;const [title,description]=layers[name];$('layer-preview').src=config.assets[name];$('layer-preview').alt=title;$('layer-title').textContent=title;$('layer-description').textContent=description;$('layer-download').href=config.assets[name];$('layer-dialog').showModal();}));
  $('layer-dialog').querySelector('.close').onclick=()=>$('layer-dialog').close();
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
  window.__lab={setMode,get mode(){return currentMode;},restore};
}
