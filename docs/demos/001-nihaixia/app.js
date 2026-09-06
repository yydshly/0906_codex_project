const upstream = 'https://github.com/jangviktor-web/nihaixia/blob/68ce4bf21351a35911d173224c1bc66db3e4e754/';
const capabilities = [
  { id: 'classics', number: '01', category: 'knowledge', name: '经典资料查询', short: '把分散讲义组织成可查的知识', label: '资料与学习', description: '围绕经典篇目、术语和主题检索讲义，组织解释并定位相关内容。', mechanism: '入口中的篇目导航和关键词表指向 modules/，宿主搜索关键词并读取段落。', scenario: '阅读经典时查找某个概念、比较同一主题在不同讲义中的解释。', example: '“库中如何解释六经？相关讲义在哪里？”', boundary: '回答反映库内整理的观点。资料覆盖度不等于医学有效性，原文、整理和推断应分开。', sources: [['技能入口与导航', 'SKILL.md'], ['黄帝内经讲义模块', 'modules/08_huangdi_detail.md']] },
  { id: 'reasoning', number: '02', category: 'reasoning', name: '辨证过程讲解', short: '用预设步骤组织分析与教学', label: '分析与表达', description: '以六经、八纲和七步分析框架组织教学式解释，展示库内的判断方法。', mechanism: 'references/distilled/ 中的公式、流程和速查表作为模型的文本规程。', scenario: '研究专家如何组织问题，或分析提示词能否提高回答步骤的一致性。', example: '“七步走分析框架各自在判断什么？”', boundary: '步骤由模型遵循，没有程序保证执行。未测试诊疗准确率，不能用于自动诊断。', sources: [['七步框架与公式', 'references/distilled/01-six-meridian-formulas.md']] },
  { id: 'formulas', number: '03', category: 'knowledge', name: '方剂资料整理', short: '关联条文、组成与版本差异', label: '资料与学习', description: '检索方剂相关资料，并按上游规则生成包含条文、原方和临床记载的资料卡片。', mechanism: '技能入口规定出卡时机及完整性检查，剂量速查表提供补充索引。', scenario: '做文献整理时对照不同版本记载，检查某个字段是否有明确出处。', example: '“方剂卡片包含哪些字段？如何区分记载版本？”', boundary: '生成完整表格不能证明内容正确。本展示不提供用药剂量或个人处方。', sources: [['卡片输出规则', 'SKILL.md'], ['方剂资料速查', 'references/distilled/05-clinical-dose-quickref.md']] },
  { id: 'cases', number: '04', category: 'knowledge', name: '医案检索', short: '从结构化表格回到叙事记录', label: '资料与学习', description: '按疾病、方剂或日期检索医案表，再查找分类叙事或按日期组织的记录。', mechanism: '12 列表格作为检索入口，cases/ 分类文件与 modules/03 作为详文补充。', scenario: '历史资料研究、字段完整性分析、案例索引设计。', example: '“医案记录有哪些字段？哪些记录缺少结果？”', boundary: '1,257 个编号行包含占位和续诊记录，不能视为同等数量的独立患者或疗效样本。', sources: [['结构化医案表', 'cases/00_merged_table.md'], ['医案详文模块', 'modules/03_yian.md']] },
  { id: 'style', number: '05', category: 'reasoning', name: '人物表达模拟', short: '让回答带有讲课语气与节奏', label: '分析与表达', description: '通过口头禅、比喻、课堂式追问等规则，塑造具有辨识度的回答风格。', mechanism: 'expression_style.md 提供表达范式，SKILL.md 设置输出检查项。', scenario: '研究人物化知识产品、教学表达和提示词对回答风格的影响。', example: '“同一段知识，改变讲解风格会影响理解吗？”', boundary: '模拟口吻不代表本人发言。确定性语气可能放大权威感，应与证据可靠性分别评估。', sources: [['表达风格规则', 'expression_style.md']] },
  { id: 'culture', number: '06', category: 'culture', name: '传统文化问答', short: '检索易经、命理与风水相关材料', label: '传统文化', description: '库内还收录天纪、易经、紫微斗数和风水等主题，可用于相关材料的查询与观点整理。', mechanism: '主题导航指向混合知识模块中的相应章节，由宿主读取并转述。', scenario: '传统文化资料整理、研究同一资料体系的主题覆盖范围。', example: '“库中收录了哪些易经相关内容？”', boundary: '这类材料应作为文化与历史观点阅读，不能作为医学证据或可靠的个人预测。', sources: [['相关知识模块', 'modules/09_zhenjiu_bencao.md']] },
];
const steps = [
  { name: '问题进入', file: 'SKILL.md · 触发与路由', title: '先确定问题属于哪个主题', body: '宿主识别技能适用范围，按主题找到索引。这里用“库中如何解释六经？”说明流程，并未实际调用模型。' },
  { name: '索引定位', file: 'SKILL.md · 关键词导航', title: '从主题找到相关文件', body: '查找“六经”“辨证”等关键词，定位到技能入口的速查内容或 references/distilled/01-six-meridian-formulas.md。' },
  { name: '搜索与读取', file: 'Grep / Read · 宿主工具', title: '读取与问题相关的段落', body: '宿主搜索关键词并读取附近文本。未命中时按规则更换同义词、概念或文件层级；这些能力由宿主提供。' },
  { name: '组织分析', file: 'modules/ + references/distilled/', title: '用查到的资料组织解释', body: '模型结合检索片段与预设分析框架组织回答。“七步走”等规则是提示文本，执行情况需要通过实际评测确认。' },
  { name: '输出检查', file: 'expression_style.md + SKILL.md', title: '应用格式与表达规则', body: '模型按规则检查重点标注、风格和适用的条文卡片。我们的扩展建议是同时展示来源，并明确区分资料记载和模型推断。' },
];
const list = document.querySelector('#cap-list');
const transferValue = {
  classics: '借鉴按主题组织资料和篇目导航，让源码说明、技术文档更容易被找到。',
  reasoning: '把技术选型与故障排查的顺序、条件和例外沉淀为方法，再通过真实问题评测。',
  formulas: '借鉴字段化资料卡：结论、条件、版本与来源放在一起，方便逐项检查。',
  cases: '把复现与故障记录组织为可搜索的案例，区分同一对象的多次记录和独立案例。',
  style: '将解释方式与事实依据分开配置；比较表达效果时同时检查有无过度断言。',
  culture: '为不同知识领域设置明确的来源类别和使用边界，防止跨领域混用结论。',
};
const detail = document.querySelector('#cap-detail');
const search = document.querySelector('#cap-search');
let filter = 'all';
let selected = capabilities[0].id;
function showCapability(item) {
  detail.innerHTML = `<div class="detail-meta"><span>${item.label}</span><span>能力 ${item.number} / 06</span></div><h3>${item.name}</h3><p class="detail-description">${item.description}</p><dl><dt>如何实现</dt><dd>${item.mechanism}</dd><dt>适用场景</dt><dd>${item.scenario}</dd><dt>对我们的借鉴</dt><dd>${transferValue[item.id]}</dd></dl><div class="example-question"><span>资料问题示例 · 未调用 AI</span><p>${item.example}</p></div><div class="detail-boundary"><strong>能力边界</strong><p>${item.boundary}</p></div><div class="detail-sources"><span>追溯来源</span>${item.sources.map(([label, path]) => `<a href="${upstream}${path}">${label} ↗</a>`).join('')}</div>`;
}
function renderCapabilities() {
  const query = search.value.trim().toLocaleLowerCase();
  const items = capabilities.filter((item) => (filter === 'all' || item.category === filter) && [item.name, item.short, item.description, item.mechanism, item.scenario, item.example].join(' ').toLocaleLowerCase().includes(query));
  document.querySelector('#cap-count').textContent = `显示 ${items.length} / ${capabilities.length} 项能力`;
  if (!items.some((item) => item.id === selected)) selected = items[0]?.id;
  list.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cap-item';
    button.setAttribute('aria-pressed', String(item.id === selected));
    button.innerHTML = `<span class="cap-number">${item.number}</span><span><strong>${item.name}</strong><small>${item.short}</small></span><span aria-hidden="true">↗</span>`;
    button.addEventListener('click', () => {
      selected = item.id;
      for (const sibling of list.children) sibling.setAttribute('aria-pressed', String(sibling === button));
      showCapability(item);
    });
    list.append(button);
  }
  if (items.length) showCapability(items.find((item) => item.id === selected));
  else detail.innerHTML = '<div class="no-results"><h3>没有匹配的能力</h3><p>试试“医案”或“条文”，也可以重置筛选。</p><button type="button" id="reset-search">显示全部能力</button></div>';
  document.querySelector('#reset-search')?.addEventListener('click', () => {
    search.value = '';
    filter = 'all';
    updateFilters();
    renderCapabilities();
    search.focus();
  });
}
function updateFilters() {
  document.querySelectorAll('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
}
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  updateFilters();
  renderCapabilities();
}));
search.addEventListener('input', renderCapabilities);
const flow = document.querySelector('#flow-steps');
function showStep(index) {
  const step = steps[index];
  [...flow.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  document.querySelector('#flow-detail').innerHTML = `<div><span class="flow-index">0${index + 1}</span><span class="flow-file">${step.file}</span></div><h3>${step.title}</h3><p>${step.body}</p>`;
}
steps.forEach((step, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = `<span>0${index + 1}</span>${step.name}<span aria-hidden="true">→</span>`;
  button.addEventListener('click', () => showStep(index));
  flow.append(button);
});
renderCapabilities();
showStep(0);

// 场景说明来自研究整理，仅展示选型思路，不执行检索或模型推理。
const architectureScenarios = [
  { label: '扫描件与表格', title: '先把资料取准，再谈检索', stages: ['版面与 OCR 解析', '对照原件校验', '保留章节与来源', '建立检索索引'], reason: '阅读顺序、表格单元格或单位一旦提取错，后面的搜索与模型会继续使用错误内容。文档解析是 RAG 的上游。', reference: 'Docling：文档解析与结构化输出', url: 'https://github.com/docling-project/docling', boundary: '要用我们的真实扫描件抽查错字、表格对齐与漏页；工具支持某种格式不代表每份资料都能准确解析。', comparison: '本库主要提供已整理的 Markdown；关联项目有文本清理脚本，完整原始资料导入尚需补建。' },
  { label: '自然语言问答', title: '以关键词为基线，比较混合 RAG', stages: ['保留条件的分段', '关键词 + 向量检索', '合并与可选重排序', '基于片段并引用来源'], reason: '专业术语适合精确检索，同义或口语表达需要语义补充；必须通过同一批问题验证组合是否比现有搜索更有效。', reference: 'Azure 示例：资料入库、检索与问答', url: 'https://github.com/Azure-Samples/azure-search-openai-demo', boundary: '检索到相似片段仍可能版本不符。若切块丢失主体或例外，可保留父章节或加入经核对的上下文。示例依赖 Azure 服务，参考架构不等于必须选择同一部署平台。', comparison: '上游 Skill 采用文件导航与关键词检索；混合检索和重排序是待验证的扩展，目前未接入我们的展示页。' },
  { label: '精确统计与筛选', title: '先定义数据口径，再使用结构化查询', stages: ['定义字段与单位', '清洗重复及缺失', 'SQL 或程序查询', '解释结果并关联来源'], reason: '“有多少条符合条件”“哪些版本发生变化”需要覆盖完整数据。仅检索若干相似段落，容易遗漏计数对象。', reference: 'Microsoft：关系数据库与专用索引', url: 'https://learn.microsoft.com/en-us/azure/developer/ai/advanced-retrieval-augmented-generation', boundary: '模型生成的查询需要限制可访问范围并检查语义；总行数、独立对象数和有效记录数应分别定义。', comparison: '医案已经有表格结构，但含占位、续诊和缺失字段，尚不能直接将编号行当作独立病例统计。' },
  { label: '跨文档关系', title: '关系问题明确时，再评估 GraphRAG', stages: ['提取实体与关系', '关联原文证据', '图与主题摘要索引', '关联查询或全局归纳'], reason: '适合追踪人物、概念和案例间的联系，或回答涉及整个资料集合的主题问题。它增加了一层显式关系组织。', reference: 'GraphRAG：局部与全局查询', url: 'https://microsoft.github.io/graphrag/query/overview/', boundary: '实体合并、关系抽取和摘要都可能出错；建设与维护工作更多，需要证明关系检索确有收益。', comparison: '本库用文件导航和表格组织关联，没有自带图索引。GraphRAG 是可参考方向，不是上游已有实现。' },
  { label: '少量资料精读', title: '先用完整上下文做一个简单基线', stages: ['核对资料与来源', '提供完整相关文本', '模型按任务阅读', '检查引用与遗漏'], reason: '资料足够少、能放入模型上下文时，可以先直接提供相关全文。这样便于检查分段和检索是否反而遗漏条件。', reference: 'Anthropic：全文上下文与检索的取舍', url: 'https://www.anthropic.com/engineering/contextual-retrieval', boundary: '可用容量取决于模型；长输入有成本，也可能产生遗漏。资料增加后需重新比较检索方案。', comparison: '本库部分速查内容内嵌在技能入口，详细模块按需读取；并非每次将全库送入模型。' },
];
const architectureOptions = document.querySelector('#architecture-options');
function showArchitecture(index) {
  const item = architectureScenarios[index];
  [...architectureOptions.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  document.querySelector('#architecture-detail').innerHTML = `<div class="nhx-architecture-title"><span class="evidence-label">参考组合 · 尚未实施</span><h3>${item.title}</h3></div><ol class="nhx-route">${item.stages.map((stage, i) => `<li><span>0${i + 1}</span>${stage}</li>`).join('')}</ol><div class="nhx-architecture-notes"><div><h4>为什么适合</h4><p>${item.reason}</p><h4>与当前方案的关系</h4><p>${item.comparison}</p></div><div><h4>实施前要验证</h4><p>${item.boundary}</p><a href="${item.url}">${item.reference} ↗</a></div></div>`;
}
architectureScenarios.forEach((item, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = item.label;
  button.setAttribute('aria-controls', 'architecture-detail');
  button.addEventListener('click', () => showArchitecture(index));
  architectureOptions.append(button);
});
showArchitecture(1);
