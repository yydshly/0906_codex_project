(() => {
  const $ = s => document.querySelector(s), frame = $('#lesson-frame');
  let ready = false, last = 'idle', started = false;
  const post = data => frame.contentWindow?.postMessage(data, location.origin);
  const timer = setTimeout(() => { if (!ready) failure(); }, 60000);
  function failure() { $('#instruction').textContent = '三维场景暂时没准备好'; $('#detail').textContent = '请使用支持 WebGPU 的浏览器，然后重新加载。实验尚未完成。'; $('#start').disabled = false; $('#start').textContent = '重新加载'; ready = false; }
  $('#start').addEventListener('click', () => {
    if (!ready) { location.reload(); return; }
    started = true; last = '';
    $('#discovery').hidden = true; $('#start').textContent = '重新开始';
    post({type:'jelly-brand',event:'selected'});
    post({type:'jelly-lesson',event:'start'});
  });
  document.addEventListener('visibilitychange', () => post({type:'jelly-guide',event:'active',active:!document.hidden}));
  window.addEventListener('message', e => {
    if(e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const d = e.data;
    if(d?.type === 'jelly-error') { clearTimeout(timer); failure(); return; }
    if(d?.type === 'jelly-ready') {
      clearTimeout(timer); ready = true;
      post({type:'jelly-guide',event:'configure',quiet:false,muted:true,color:'lime'});
      $('#instruction').textContent = '想知道我为什么能弹回来吗？';
      $('#detail').textContent = '点“开始实验”，再按住我的头顶，慢慢向上拉。';
      $('#start').textContent = '开始实验'; $('#start').disabled = false; return;
    }
    if(d?.type !== 'jelly-lesson-progress' || !started || !Number.isFinite(d.ratio)) return;
    $('#ratio').textContent = `${Math.round(d.ratio * 100)}%`;
    $('#height').value = Math.max(0, Math.min(1.5, d.ratio));
    const state = d.state === 'stretch' && d.peak >= 1.10 ? 'release' : d.state;
    if(state === last) return; last = state;
    const copy = {
      settling:['先站稳，记住我原来的样子。','正在记录初始高度，马上就好。',1],
      stretch:['按住我的头顶，慢慢向上拉。','把身体拉高到初始高度的 110% 以上；点空白处会转动视角，请抓住身体。',1],
      release:['哇，变长了！现在松手试试。','放开鼠标或手指，观察身体怎样回弹。',2],
      recover:['我正在弹回来，你看到了吗？','先别碰我，等晃动平息。我们在观察真实的回弹过程。',2],
      done:['我们完成啦！你发现弹性的秘密了。','你拉伸了身体，也观察到了松手后的恢复。再看下面的解释。',3],
      retry:['我还没站稳，再试一次吧。','点击“重新开始”，这次轻轻向上拉，达到目标就松手。',1]
    }[state];
    if(!copy) return;
    $('#instruction').textContent = copy[0]; $('#detail').textContent = copy[1];
    [1,2,3].forEach(n => $('#step-'+n).classList.toggle('current',n===copy[2]));
    if(state==='done') { $('#discovery').hidden=false; post({type:'jelly-brand',event:'complete'}); $('#role-response').textContent='你完成了真实操作，青团才庆祝。反馈对应你的进展，形成一次共同完成任务的体验。'; }
  });
})();
