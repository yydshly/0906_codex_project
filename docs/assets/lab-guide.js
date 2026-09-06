(() => {
  const $ = selector => document.querySelector(selector);
  const section = $('#lab-guide');
  if (!section) return;
  const cards = [...document.querySelectorAll('[data-project-id]')];
  const ids = new Set(cards.map(c => c.dataset.projectId));
  const key = 'research-lab-guide-v1';
  let stored = {}, storageOK = true;
  try { stored = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { storageOK = false; }
  const prefs = {
    interest: typeof stored.interest === 'string' ? stored.interest : '',
    search: typeof stored.search === 'string' ? stored.search.slice(0, 120) : '',
    favoritesOnly: stored.favoritesOnly === true,
    quiet: typeof stored.quiet === 'boolean' ? stored.quiet : matchMedia('(prefers-reduced-motion: reduce)').matches,
    muted: stored.muted !== false,
    color: stored.color === 'peach' ? 'peach' : 'lime',
    enabled: stored.enabled !== false,
    favorites: Array.isArray(stored.favorites) ? [...new Set(stored.favorites.filter(id => ids.has(id)))] : [],
    visited: true,
  };
  const firstVisit = !stored.visited;
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(prefs)); }
    catch { storageOK = false; }
    $('#guide-storage').textContent = storageOK ? '收藏与偏好只保存在当前浏览器。' : '当前浏览器无法保存偏好；本次筛选和收藏仍然可用。';
  }
  const entries = cards.map(card => ({ card, id: card.dataset.projectId,
    name: card.querySelector('h3').textContent,
    tags: JSON.parse(card.dataset.projectTags),
    text: card.textContent.toLocaleLowerCase(),
  }));
  const tags = [...new Set(entries.flatMap(e => e.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  for (const tag of tags) $('#guide-interest').add(new Option(tag, tag));
  if (!tags.includes(prefs.interest)) prefs.interest = '';
  $('#guide-interest').value = prefs.interest;
  $('#guide-search').value = prefs.search;
  $('#guide-favorites').checked = prefs.favoritesOnly;
  $('#guide-quiet').checked = prefs.quiet;
  $('#guide-muted').checked = prefs.muted;
  $('#guide-color').value = prefs.color;
  section.hidden = false;
  $('#guide-message').textContent = firstVisit ? '你好，选一个感兴趣的方向，我们一起逛逛。' : '欢迎回来，已恢复你的收藏与偏好。';
  const frame = $('#guide-frame'), poster = $('#guide-poster'), loadState = $('#guide-load-state');
  let visible = false, ready = false, loading = false, timer, welcomed = !firstVisit;
  let failed = false, lastCelebration = -Infinity;
  const supports3D = !!navigator.gpu;
  const post = message => frame.contentWindow?.postMessage(message, location.origin);
  const configure = () => {
    poster.style.filter = prefs.color === 'peach' ? 'hue-rotate(290deg)' : '';
    if (ready) post({ type: 'jelly-guide', event: 'configure', quiet: prefs.quiet, muted: prefs.muted, color: prefs.color });
  };
  function updateToggle() {
    $('#guide-toggle').textContent = !supports3D ? '静态形象' : failed ? '重试三维' : prefs.enabled ? '关闭伙伴' : '唤醒伙伴';
    $('#guide-toggle').disabled = !supports3D;
    $('#guide-toggle').setAttribute('aria-pressed', String(prefs.enabled && !failed && supports3D));
  }
  function unload(message) {
    clearTimeout(timer); ready = loading = false;
    frame.removeAttribute('src'); frame.hidden = true; frame.classList.remove('is-ready');
    poster.hidden = false; loadState.hidden = false; loadState.textContent = message;
  }
  function fallback(message) { failed = true; unload(message); updateToggle(); }
  function activity() {
    const active = prefs.enabled && visible && !document.hidden;
    if (active && supports3D && !ready && !loading && !failed) {
      loading = true; frame.hidden = false;
      loadState.textContent = '青团正在醒来，项目可以先看起来。';
      frame.src = 'demos/002-jelly-baby/companion/?guide=1';
      timer = setTimeout(() => fallback('三维加载较慢，先用静态形象陪你浏览。可以点击重试。'), 45000);
    }
    if (ready) post({ type: 'jelly-guide', event: 'active', active });
  }
  function respond(event) {
    if (!ready || !visible || document.hidden) return;
    if (event === 'complete') {
      if (performance.now() - lastCelebration < 8000) return;
      lastCelebration = performance.now();
    }
    post({ type: 'jelly-brand', event });
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || !loading && !ready) return;
    if (event.data?.type === 'jelly-error') { fallback('三维暂时不可用，已切换为静态形象。筛选和收藏仍可使用。'); return; }
    if (event.data?.type !== 'jelly-ready') return;
    clearTimeout(timer); loading = false; ready = true;
    frame.classList.add('is-ready'); poster.hidden = true; loadState.hidden = true;
    configure(); activity();
    if (!welcomed && visible) { welcomed = true; respond('welcome'); }
  });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; activity(); }, { threshold: 0 });
  observer.observe(section.querySelector('.guide-character'));
  document.addEventListener('visibilitychange', activity);
  $('#guide-toggle').addEventListener('click', () => {
    if (failed) { failed = false; prefs.enabled = true; }
    else prefs.enabled = !prefs.enabled;
    if (!prefs.enabled) unload('伙伴已关闭，筛选与收藏可以照常使用。');
    persist(); updateToggle(); activity();
  });
  if (!supports3D) unload('当前浏览器使用静态形象，筛选和收藏照常可用。');
  else if (!prefs.enabled) unload('伙伴已关闭，点击唤醒可恢复。');
  updateToggle(); configure();
  function filter(announce = true) {
    let count = 0;
    const query = prefs.search.trim().toLocaleLowerCase();
    for (const e of entries) {
      const saved = prefs.favorites.includes(e.id);
      e.card.hidden = !!(prefs.interest && !e.tags.includes(prefs.interest) || query && !e.text.includes(query) || prefs.favoritesOnly && !saved);
      if (!e.card.hidden) count++;
      const button = e.card.querySelector('[data-save]');
      button.hidden = false; button.textContent = saved ? '★ 已收藏' : '☆ 收藏项目';
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? '取消收藏' : '收藏'} ${e.name}`);
    }
    $('#guide-results').hidden = false;
    $('#guide-results').textContent = `找到 ${count} / ${entries.length} 个项目${prefs.interest ? ` · ${prefs.interest}` : ''}`;
    $('#guide-empty').hidden = count !== 0;
    $('#guide-save-count').textContent = String(prefs.favorites.length);
    const first = entries.find(e => !e.card.hidden);
    $('#guide-pick').hidden = !first;
    if(first){
      $('#guide-pick-name').textContent = first.name;
      $('#guide-pick-link').href = '#project-' + first.id;
      $('#guide-pick-save').textContent = prefs.favorites.includes(first.id) ? '取消收藏' : '收藏这个项目';
      $('#guide-pick-save').onclick = () => first.card.querySelector('[data-save]').click();
    }
    if (announce) $('#guide-message').textContent = count ? `为你找到 ${count} 个项目。喜欢的可以先收藏，下次继续看。` : '暂时没有匹配项目，试试其他方向或清空关键词。';
    persist();
  }
  for (const e of entries) e.card.querySelector('[data-save]').addEventListener('click', () => {
    const saved = prefs.favorites.includes(e.id);
    prefs.favorites = saved ? prefs.favorites.filter(id => id !== e.id) : [...prefs.favorites, e.id];
    filter(false);
    $('#guide-message').textContent = saved ? `已取消收藏「${e.name}」。` : `已收藏「${e.name}」，下次可以从“只看我的收藏”继续。`;
    const toast=$('#guide-toast');toast.hidden=false;
    toast.textContent = saved ? `青团 · 已取消收藏「${e.name}」` : `青团 · 已收藏「${e.name}」，下次继续看。`;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},4500);
    if (!saved) respond('complete');
  });
  $('#guide-interest').addEventListener('change', event => { prefs.interest = event.target.value; filter(); respond('selected'); });
  let toastTimer;
  let searchTimer;
  $('#guide-search').addEventListener('input', event => {
    prefs.search = event.target.value.slice(0, 120);
    clearTimeout(searchTimer); searchTimer = setTimeout(() => filter(), 120);
  });
  $('#guide-favorites').addEventListener('change', event => { prefs.favoritesOnly = event.target.checked; filter(); });
  $('#guide-reset').addEventListener('click', () => {
    clearTimeout(searchTimer); prefs.interest = ''; prefs.search = ''; prefs.favoritesOnly = false;
    $('#guide-interest').value = ''; $('#guide-search').value = ''; $('#guide-favorites').checked = false; filter();
  });
  for (const field of ['quiet', 'muted', 'color']) $('#guide-' + field).addEventListener('change', event => {
    prefs[field] = field === 'color' ? event.target.value : event.target.checked;
    persist(); configure();
    $('#guide-message').textContent = prefs.quiet ? '安静模式已开启：保留表情回应，减少主动动作。' : '偏好已更新，青团会按你的选择陪伴。';
  });
  filter(false);
})();
