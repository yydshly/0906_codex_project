(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const originalFrame = $('#j-original-frame');
  $('#j-original-toggle').addEventListener('click', event => {
    const active = event.currentTarget.getAttribute('aria-pressed') === 'true';
    event.currentTarget.setAttribute('aria-pressed', String(!active));
    event.currentTarget.textContent = active ? '重新加载原版' : '关闭原版';
    originalFrame.src = active ? 'about:blank' : 'original/';
    originalFrame.hidden = active;
    $('#j-original-poster').hidden = !active;
  });
  const sourceBase = 'https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/';
  const capabilities = [
    {name:'软体形变',en:'SOFT BODY',symbol:'◌',text:'拉伸、压缩，再慢慢回弹。',experience:'拖动身体的一部分，其他部位随之变形；释放后回弹并逐渐静止。',principle:'内部四面体上的弹性与体积约束计算形变，阻尼消耗振动能量，精细表皮通过权重跟随。',inspiration:'把“软硬程度”变成可调参数，用于材料认知、互动玩具和有触感的角色。',boundary:'没有自碰撞与撕裂；极端拉伸下的稳定性仍需验证。',file:'src/physics/soft-body.js'},
    {name:'抓取抛掷',en:'DIRECT TOUCH',symbol:'↗',text:'选中一点，拉扯整个身体。',experience:'抓住表面、拖动和甩出。释放动量交给物理系统，产生落地与恢复。',principle:'将选中的表面位置映射到物理节点，用带力上限的抓取约束驱动，结合桌面接触与摩擦。',inspiration:'设计拉伸目标、投掷靶或创意落地动作，让直接操作成为玩法本身。',boundary:'多物体碰撞与复杂场景接触需要扩展，不能直接当通用拖拽引擎。',file:'src/physics/soft-body.js'},
    {name:'行走跳跃',en:'POWERED MOTION',symbol:'↥',text:'用力驱动，而后交给物理。',experience:'角色能转向、行走、跳跃；抓取时释放运动驱动，松手后逐渐恢复姿态。',principle:'程序向节点施加姿态恢复力、交替步态和跳跃冲量，与弹性和接触求解共同作用。',inspiration:'做会跟随操作的桌面伙伴，或把走、跳、落地组合成轻量关卡。',boundary:'人工设计的运动控制；没有学习式自主行为。新角色需要重调步态。',file:'src/game/locomotion.ts'},
    {name:'果冻材质',en:'TRANSLUCENCY',symbol:'◐',text:'让厚度，成为颜色的一部分。',experience:'观察表面高光、通透的边缘，以及厚处更浓的颜色。',principle:'Three.js 物理材质结合透射、折射率、粗糙度和厚度相关吸收；Worker 计算光学厚度。',inspiration:'制作材质对照课、软糖外观展示或可调颜色的角色定制工具。',boundary:'属于实时视觉近似，未经过真实材料测量标定。',file:'src/graphics/baby.ts'},
    {name:'动态焦散',en:'REFRACTED LIGHT',symbol:'☼',text:'身体变了，桌面的光也变了。',experience:'穿过果冻的光落在桌面上，形成随形状变化的聚光亮斑。',principle:'GPU 从光源方向的前后深度近似计算折射与落点，按聚集程度着色，并使用模糊。',inspiration:'把光当作创作对象：做光影拼图、材质展台或可变形的光斑绘画。',boundary:'有限采样、平面接收和强度截断；不是完整路径追踪。',file:'src/graphics/refractive-light.js'},
    {name:'表情声音',en:'LIVING DETAILS',symbol:'☺',text:'把小小的反馈，连成生命感。',experience:'面部细节跟随身体变形，接触和脚步事件触发程序化声音。',principle:'附件绑定在表皮上；绘制顺序避免重复折射。接触事件与声音合成连接。',inspiration:'让角色通过落地节奏、表情变化和声音回应用户，探索多感官互动。',boundary:'情绪状态、语音对话与音乐编排均需另行开发。',file:'src/game/runtime.ts'}
  ];
  const capGrid = $('#j-cap-grid');
  capabilities.forEach((cap, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'j-cap-card';
    button.setAttribute('aria-pressed', String(index === 0));
    button.setAttribute('aria-controls', 'j-cap-detail');
    button.innerHTML = `<span class="j-cap-top"><span>0${index + 1}</span><span>↗</span></span><span class="j-cap-symbol" aria-hidden="true">${cap.symbol}</span><strong>${cap.name}</strong><small>${cap.en}</small><span class="j-cap-text">${cap.text}</span>`;
    button.addEventListener('click', () => showCapability(index));
    capGrid.append(button);
  });
  function showCapability(index) {
    const c = capabilities[index];
    [...capGrid.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    $('#j-cap-detail').innerHTML = `<div class="j-detail-title"><span class="j-small-label">能力 0${index + 1} / 源码分析</span><h3>${c.name}</h3><a href="${sourceBase + c.file}">查看对应源码 ↗</a></div><dl><dt>可以体验</dt><dd>${c.experience}</dd><dt>背后原理</dt><dd>${c.principle}</dd></dl><div class="j-detail-inspire"><span class="j-small-label">可以借鉴</span><p>${c.inspiration}</p><small>${c.boundary}</small></div>`;
  }
  showCapability(0);

  const scenarios = [
    {category:'learn',tag:'学习与研究',title:'可交互的物理课堂',fit:'高适合度',num:'01',need:'把抽象的弹性、体积和阻尼变成可观察的变化。',base:'软体形变 + 抓取',add:'增加参数对照、网格显示与实验记录。',first:'先比较两种阻尼下释放后的恢复过程。'},
    {category:'brand',tag:'品牌与展示',title:'会回应的品牌吉祥物',fit:'高适合度',num:'02',need:'让访客通过一次拉扯、一次跳跃记住角色。',base:'角色运动 + 表情声音',add:'自有模型、宿主页面适配、加载与生命周期管理。',first:'做一个可抓取、可重置的单角色落地页。'},
    {category:'play',tag:'娱乐与互动',title:'随手打开的解压玩具',fit:'高适合度',num:'03',need:'用直接操作、柔软回弹和声音形成轻松体验。',base:'抓取抛掷 + 软体形变',add:'触控调优、静音、反馈节奏和设备分档。',first:'保留拉伸、释放和重置三个核心动作。'},
    {category:'brand',tag:'品牌与展示',title:'软糖与凝胶的材质展台',fit:'需适配',num:'04',need:'让用户从不同角度观察通透、厚度与高光。',base:'果冻材质 + 动态焦散',add:'模型绑定、材质校准和产品信息；不承诺真实力学性能。',first:'在固定光照下比较三组材质参数。'},
    {category:'play',tag:'娱乐与互动',title:'软乎乎的投掷小游戏',fit:'需扩展',num:'05',need:'让形变、惯性和落地反馈成为挑战的一部分。',base:'抓取抛掷 + 行走跳跃',add:'目标、计分、障碍碰撞和关卡管理。',first:'先做桌面投靶，暂不加入多角色碰撞。'},
    {category:'learn',tag:'学习与研究',title:'实时图形性能实验室',fit:'高适合度',num:'06',need:'比较计算精度、视觉效果和交互延迟的取舍。',base:'多精度模型 + CPU / Worker / GPU',add:'分阶段计时、设备记录、对照开关和数据导出。',first:'分开测量求解、表皮更新和渲染帧时间。'}
  ];
  function renderScenarios(filter) {
    const items = scenarios.filter(s => filter === 'all' || s.category === filter);
    $('#j-scenario-grid').innerHTML = items.map(s => `<article class="j-scenario"><div class="j-scenario-top"><span>${s.tag}</span><span>${s.fit}</span></div><span class="j-scenario-no">${s.num}</span><h3>${s.title}</h3><p>${s.need}</p><dl><dt>可借用</dt><dd>${s.base}</dd><dt>需补齐</dt><dd>${s.add}</dd></dl><details><summary>最小实践建议 <span>＋</span></summary><p>${s.first}</p></details></article>`).join('');
    $('#j-scenario-count').textContent = filter === 'all' ? '展示全部 6 个场景' : `展示 ${items.length} 个${items[0].tag}场景`;
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    renderScenarios(button.dataset.filter);
  }));
  renderScenarios('all');

  const ideas = [
    {name:'软体材料实验台',tag:'优先实践 · 改造成本较低',title:'让每一次拉扯，都成为一个小实验。',hook:'同样的形状，不同的软硬和阻尼，会怎样恢复？',base:'软体形变、抓取与已有物理检查',new:'参数对照面板、四面体显示、体积比与时间曲线',steps:['固定模型、光照和操作步骤，保留一键重置。','先开放阻尼与软硬参数，比较释放后的变化。','同步记录体积比、恢复时间与帧时间。'],measure:'用户能否通过操作区分参数作用；重复实验的趋势是否一致。',risk:'材料参数有适用范围，不能将观感对比当作真实材料标定。'},
    {name:'有回应的网页伙伴',tag:'产品探索 · 改造成本中等',title:'把一次点击，变成有性格的回应。',hook:'页面里的角色能否通过动作，让等待和完成更有温度？',base:'行走跳跃、抓取、面部附件与声音',new:'状态映射、动画触发接口、静音和减少动态效果选项',steps:['定义等待、完成、被拖动三个状态。','用短动作响应页面事件，避免持续抢占注意力。','封装挂载、事件、尺寸适配与资源释放。'],measure:'用户能否理解状态；角色是否干扰主要任务或拖慢页面。',risk:'对话、情绪理解和 AI 行为都不在现有能力内。'},
    {name:'可揉捏的光影画布',tag:'创意探索 · 改造成本中高',title:'揉一揉形状，画出另一束光。',hook:'把桌面当成画布，把透明软体当成一枚可变形的透镜。',base:'半透明材质、GPU 焦散与抓取',new:'颜色与光源控制、固定视角、作品快照和对照模式',steps:['锁定接收平面，只开放少量材质和形状参数。','提供几组形状目标，引导观察光斑变化。','增加作品快照，并标注是实时近似渲染。'],measure:'形状改变是否带来清楚的光影差异；交互时光斑是否稳定跟随。',risk:'复杂遮挡、内部反射与多光源需要新的光学实现。'},
    {name:'会发声的果冻乐器',tag:'跨感官探索 · 改造成本中等',title:'把拉伸的距离，变成声音的高低。',hook:'将身体形变与落地节奏映射到音高、音量和音色。',base:'程序化接触声音、抓取与跳跃',new:'形变到声音的映射、音高量化、节拍与音量限制',steps:['先把拉伸程度映射到一个连续音高。','用落地事件触发短音，增加静音和音量控制。','对比自由音高与音阶量化两种玩法。'],measure:'用户能否主动重复一个声音；声音延迟是否影响操作。',risk:'原始音效不是现成乐器，持续合成与音高控制需新增。'},
    {name:'软体闯关与协作',tag:'长期方向 · 改造成本高',title:'用柔软的身体，通过刚硬的障碍。',hook:'拉伸穿过窄口、跳跃跨过台阶，让形变参与解谜。',base:'角色驱动、抓取与桌面接触',new:'任意障碍碰撞、自碰撞、关卡；协作还需网络同步',steps:['从单角色、单障碍和单目标开始。','先验证接触稳定性，再增加形变解谜。','多角色与联网单独评估，不与首版捆绑。'],measure:'碰撞与恢复是否稳定；完成关卡是否依赖可理解的规则。',risk:'自碰撞、撕裂与联网均未实现，属于较大规模扩展。'}
  ];
  const ideaButtons = $('#j-idea-buttons');
  ideas.forEach((idea, i) => {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-controls', 'j-idea-detail'); button.setAttribute('aria-pressed', String(i === 0));
    button.innerHTML = `<span>0${i + 1}</span>${idea.name}<span>↗</span>`;
    button.addEventListener('click', () => showIdea(i)); ideaButtons.append(button);
  });
  function showIdea(i) {
    const idea = ideas[i];
    [...ideaButtons.children].forEach((b, index) => b.setAttribute('aria-pressed', String(index === i)));
    $('#j-idea-detail').innerHTML = `<span class="j-idea-tag">扩展设想 / ${idea.tag}</span><h3>${idea.title}</h3><p class="j-idea-hook">${idea.hook}</p><div class="j-idea-pair"><div><span>现有基础</span><p>${idea.base}</p></div><div><span>新增部分</span><p>${idea.new}</p></div></div><h4>从一个最小版本开始</h4><ol>${idea.steps.map(step => `<li>${step}</li>`).join('')}</ol><div class="j-idea-measure"><strong>怎样知道值得继续？</strong><p>${idea.measure}</p></div><small>${idea.risk}</small>`;
  }
  showIdea(0);

  const proposals = {
    'learn-stretch':['弹性对照小课堂','拖动相同形状，比较两组阻尼下的释放与恢复。','增加参数面板、网格开关与恢复曲线。','用户能否区分软硬与阻尼的作用。'],
    'learn-light':['一束光的果冻旅行','固定视角，调整形状和材质，观察厚度、颜色和光斑。','增加材质预设、焦散开关及前后对照。','用户能否说明厚度与颜色变化的关系。'],
    'learn-motion':['用力走路的角色课','观察驱动力、跳跃冲量与身体恢复如何协作。','增加驱动力显示、慢速观察和接触事件时间线。','用户能否区分姿态驱动与被动回弹。'],
    'brand-stretch':['可揉捏的品牌形象','访客拉伸自有角色，释放后恢复，并得到短促反馈。','制作自有模型绑定、页面嵌入接口与一键重置。','访客能否完成一次互动且不影响页面主要任务。'],
    'brand-light':['通透材质的产品展台','通过固定角度与少量材质选择，展示颜色、厚度和高光。','重建产品模型、绑定和材质参数；添加产品说明。','外观差异是否清楚，加载和交互是否可接受。'],
    'brand-motion':['会回应的完成时刻','任务完成时，让角色短跳一次并发出可关闭的声音。','增加宿主事件接口、状态映射和减少动态效果选项。','反馈是否被理解，且不会分散注意力。'],
    'play-stretch':['口袋里的果冻玩具','提供拉伸、释放、重置三个动作，突出轻松的直接反馈。','优化触控、抓取反馈和设备画质分档。','用户是否无需说明就能操作，快速拖动是否稳定。'],
    'play-light':['揉光小画布','揉捏一枚透明角色，尝试做出指定的光斑轮廓。','增加目标图形、固定光照和作品快照。','形变到光斑的变化是否可理解、可重复。'],
    'play-motion':['果冻节奏跳跳','用跳跃和落地触发短音，组合一个轻量节奏小游戏。','增加节拍、音高映射、计分与音量控制。','声音是否及时、节奏是否可主动重复。']
  };
  let proposalText = '';
  function updateProposal() {
    const p = proposals[`${$('#j-purpose').value}-${$('#j-interaction').value}`];
    $('#j-proposal').innerHTML = `<span class="j-small-label">你的实验提案 · 扩展设想</span><h4>${p[0]}</h4><p>${p[1]}</p><dl><dt>先补什么</dt><dd>${p[2]}</dd><dt>如何验证</dt><dd>${p[3]}</dd></dl>`;
    proposalText = `实验提案：${p[0]}\n定位：基于 Jelly-Baby 的扩展设想，尚未实现。\n核心体验：${p[1]}\n先补什么：${p[2]}\n如何验证：${p[3]}\n研究版本：df52c92a8459286bb287f0849764929e73b4f8ce\n来源：https://github.com/scottstts/Jelly-Baby`;
    $('#j-copy-status').textContent = '';
    $('#j-copy-fallback')?.remove();
  }
  $('#j-purpose').addEventListener('change', updateProposal);
  $('#j-interaction').addEventListener('change', updateProposal);
  $('#j-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(proposalText); $('#j-copy-status').textContent = '已复制，可粘贴到研究笔记。'; }
    catch {
      let field = $('#j-copy-fallback');
      if (!field) { field = document.createElement('textarea'); field.id = 'j-copy-fallback'; field.readOnly = true; field.setAttribute('aria-label', '可手动复制的实验提案'); $('.j-mixer').append(field); }
      field.value = proposalText; field.focus(); field.select(); $('#j-copy-status').textContent = '请复制下方已选中的提案文本。';
    }
  });
  updateProposal();

  const body = $('#j-gel-body'), stage = $('#j-stage'), caption = $('#j-stage-caption');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dragging = false, startX = 0, startY = 0, animation = null;
  let extensionMode = 'material', peakStretch = 1, completed = 0;
  let soundEnabled = false, audioContext = null;
  const prototypeDetails = {
    material: ['为角色换一种材质观感。', '选择颜色、调整通透度，立即比较视觉差异。这里调节的是二维示意外观，不是上游折射参数。', '将颜色和通透度映射为上游材质参数，建立可靠的重建与更新接口，再验证焦散与主体外观是否一致。'],
    challenge: ['把一次拉伸，变成一个小目标。', '向上拖动身体，拉长至 1.20× 后释放，完成三次。进度和得分是本页新增的玩法反馈。', '从上游真实节点提取形变指标，再接入目标与计分逻辑；验证体积保持、极端拉扯和恢复稳定性。'],
    sound: ['让你的动作，带出不同的声音。', '开启声音后，轻弹或拉伸再释放。拉伸程度改变音高，动作触发短音；音效由本页独立合成。', '将上游接触、速度与形变映射到音高、力度和音色，再校准音画延迟、音量与触控手感。']
  };
  document.querySelectorAll('[data-prototype]').forEach(button => button.addEventListener('click', () => {
    extensionMode = button.dataset.prototype;
    document.querySelectorAll('[data-prototype]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    for (const key of Object.keys(prototypeDetails)) $(`#j-${key}-panel`).hidden = key !== extensionMode;
    const detail = prototypeDetails[extensionMode];
    $('#j-prototype-title').textContent = detail[0]; $('#j-prototype-description').textContent = detail[1]; $('#j-prototype-next').textContent = detail[2];
    caption.textContent = extensionMode === 'challenge' ? '向上拉长至 1.20× 后释放' : extensionMode === 'sound' ? '先开启声音，再轻弹或拉伸' : '拖动角色，感受形变示意';
    if (extensionMode !== 'sound' && soundEnabled) {
      soundEnabled = false; audioContext?.suspend().catch(() => {});
      $('#j-sound-enable').setAttribute('aria-pressed', 'false'); $('#j-sound-enable').textContent = '开启原型声音'; $('#j-sound-note').textContent = '声音未开启';
    }
  }));
  $('#j-color').addEventListener('change', event => { body.style.filter = `hue-rotate(${event.target.value}deg)`; });
  function showStretch(value) {
    $('#j-stretch-fill').style.width = `${Math.min(100, Math.max(0, (value - 1) / .2 * 100))}%`;
    $('#j-stretch-value').textContent = `${value.toFixed(2)}×`;
  }
  function scoreStretch(value) {
    if (extensionMode !== 'challenge' || value < 1.2 || completed >= 3) return;
    completed++;
    $('#j-challenge-count').textContent = completed === 3 ? '3 / 3 次 · 挑战完成！' : `${completed} / 3 次`;
  }
  $('#j-challenge-reset').addEventListener('click', () => { completed = 0; peakStretch = 1; showStretch(1); $('#j-challenge-count').textContent = '0 / 3 次'; });
  $('#j-challenge-key').addEventListener('click', () => {
    animation?.cancel(); body.style.transform = ''; showStretch(1.23); scoreStretch(1.23);
    if (!reduceMotion.matches) animation = body.animate([{transform:'scale(1,1)'},{transform:'scale(.9,1.23)',offset:.4},{transform:'scale(1,1)'}], {duration:650,easing:'ease-in-out'});
    caption.textContent = '拉长并释放 · 已记录本次挑战';
  });
  $('#j-sound-enable').addEventListener('click', async () => {
    try {
      if (soundEnabled) {
        soundEnabled = false; await audioContext.suspend();
        $('#j-sound-enable').textContent = '开启原型声音'; $('#j-sound-enable').setAttribute('aria-pressed', 'false'); $('#j-sound-note').textContent = '声音已关闭'; return;
      }
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('unavailable');
      audioContext ||= new Context(); await audioContext.resume(); soundEnabled = true;
      $('#j-sound-enable').textContent = '关闭原型声音'; $('#j-sound-enable').setAttribute('aria-pressed', 'true');
      playNote(1);
    } catch { soundEnabled = false; $('#j-sound-note').textContent = '当前浏览器未能开启音频，请尝试其他浏览器。'; }
  });
  function playNote(stretch) {
    if (!soundEnabled || extensionMode !== 'sound' || audioContext?.state !== 'running') return;
    const frequency = Math.round(220 * Math.pow(2, Math.max(0, stretch - 1) * 3));
    const tone = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
    tone.type = 'sine'; tone.frequency.setValueAtTime(frequency, now); tone.frequency.exponentialRampToValueAtTime(frequency * .76, now + .22);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(Number($('#j-volume').value) / 100, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + .26);
    tone.connect(gain); gain.connect(audioContext.destination); tone.start(now); tone.stop(now + .28);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    $('#j-sound-note').textContent = `已触发短音 · 起始音高 ${frequency} Hz`;
  }
  function settle(complete = true) {
    dragging = false; body.style.transform = ''; stage.classList.remove('is-dragging');
    caption.textContent = reduceMotion.matches ? '已恢复 · 当前减少动态效果' : '已释放 · 回弹与恢复示意';
    if (complete) { scoreStretch(peakStretch); playNote(peakStretch); }
    peakStretch = 1;
  }
  stage.addEventListener('pointerdown', event => {
    if (!event.target.closest('#j-gel-body') || (event.pointerType === 'mouse' && event.button !== 0)) return;
    animation?.cancel(); dragging = true; peakStretch = 1; startX = event.clientX; startY = event.clientY;
    stage.setPointerCapture(event.pointerId); stage.classList.add('is-dragging'); caption.textContent = '正在拉伸 · 二维形变示意';
  });
  stage.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = Math.max(-65, Math.min(65, event.clientX - startX));
    const dy = Math.max(-90, Math.min(45, event.clientY - startY));
    const sy = 1 - dy / 280, sx = 1 / Math.sqrt(sy);
    body.style.transform = `translate(${dx * .25}px, 0) skewX(${-dx / 7}deg) scale(${sx}, ${sy})`;
    peakStretch = Math.max(peakStretch, sy); showStretch(peakStretch);
  });
  stage.addEventListener('pointerup', () => { if (dragging) settle(); });
  stage.addEventListener('pointercancel', () => { if (dragging) settle(false); });
  stage.addEventListener('lostpointercapture', () => { if (dragging) settle(false); });
  $('#j-bounce').addEventListener('click', () => {
    animation?.cancel(); body.style.transform = '';
    playNote(1.15);
    if (!reduceMotion.matches) animation = body.animate([
      {transform:'scale(1,1)'},{transform:'scale(1.16,.8)',offset:.17},
      {transform:'translateY(-32px) scale(.88,1.15)',offset:.43},{transform:'scale(1.12,.87)',offset:.72},{transform:'scale(1,1)'}
    ], {duration:850, easing:'ease-in-out'});
    caption.textContent = reduceMotion.matches ? '轻弹示意 · 当前减少动态效果' : '轻弹 → 离地 → 恢复 · 动作示意';
  });
  $('#j-wire-toggle').addEventListener('click', event => {
    const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    event.currentTarget.setAttribute('aria-pressed', String(enabled));
    event.currentTarget.textContent = enabled ? '隐藏网格' : '显示网格';
    $('#j-wire').setAttribute('visibility', enabled ? 'visible' : 'hidden');
    caption.textContent = enabled ? '网格仅作结构示意，不是上游四面体数据' : '拖动角色，感受形变示意';
  });
  $('#j-opacity').addEventListener('input', event => { body.style.opacity = String(Number(event.target.value) / 100); caption.textContent = '透明度示意 · 上游材质还包含折射与厚度吸收'; });
  $('#j-reset').addEventListener('click', () => {
    animation?.cancel(); settle(false); body.style.opacity = '.9'; $('#j-opacity').value = '90';
    body.style.filter = ''; $('#j-color').value = '0'; peakStretch = 1; showStretch(1);
    $('#j-wire').setAttribute('visibility', 'hidden'); $('#j-wire-toggle').setAttribute('aria-pressed', 'false');
    $('#j-wire-toggle').textContent = '显示网格'; caption.textContent = '拖动角色，感受形变示意';
  });
})();

// Only run one embedded 3D experience at a time.
(() => {
  const frame=document.querySelector('#j-companion-frame');
  const welcome=document.querySelector('#j-companion-welcome');
  const stop=document.querySelector('#j-companion-stop');
  const original=document.querySelector('#j-original-toggle');
  const close=()=>{frame.src='about:blank';frame.hidden=true;welcome.hidden=false;stop.hidden=true;};
  document.querySelector('#j-companion-launch').addEventListener('click',()=>{
    if(original.getAttribute('aria-pressed')==='true')original.click();
    frame.src='companion/';frame.hidden=false;welcome.hidden=true;stop.hidden=false;
  });
  stop.addEventListener('click',close);
  original.addEventListener('click',()=>{if(original.getAttribute('aria-pressed')==='true')close();});
})();

// A reviewable same-origin page-to-character event boundary.
document.querySelectorAll('[data-brand-event]').forEach(button=>button.addEventListener('click',()=>{
  const frame=document.querySelector('#j-companion-frame'),status=document.querySelector('#j-brand-status');
  if(frame.hidden||!frame.contentDocument?.querySelector('#loading.hidden')){status.textContent='请先唤醒青团，等它出现在画面中再体验。';return;}
  frame.contentWindow.postMessage({type:'jelly-brand',event:button.dataset.brandEvent},location.origin);
  status.textContent={welcome:'访客进入 → 青团挥手欢迎。',waiting:'处理中 → 青团安静陪伴。',complete:'任务完成 → 青团蓄力、跳跃并庆祝。'}[button.dataset.brandEvent];
}));
