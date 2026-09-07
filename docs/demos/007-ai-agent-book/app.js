const missions = {
  research: {
    label: '研究 Agent',
    title: '查来源、读实现、形成可追溯结论',
    description: '模型先拆解研究问题，搜索最新资料，读取固定版本源码；必要时运行小实验，最终把每个结论绑定到直接证据。',
    output: '版本明确的研究报告、源码链接与验证边界',
    risk: '把 README 宣称当成实测，或让结论超过证据范围',
    stack: ['目标拆分', '网络搜索', '源码工具', '代码执行', '引用核验'],
    chapters: '对应章节：1 基础 · 4 工具 · 5 Coding Agent · 7 评估'
  },
  knowledge: {
    label: '知识 Agent',
    title: '从私有资料中找到依据，并记住有用信息',
    description: '文档先被切分和索引。查询同时走语义与关键词检索，融合并重排候选；相关内容进入上下文，回答附带来源。',
    output: '有依据的专业问答、跨会话偏好与主动提醒',
    risk: '召回遗漏、错误记忆、过时信息和访问权限泄漏',
    stack: ['资料解析', '混合检索', '重排序', '用户记忆', '引用检查'],
    chapters: '对应章节：2 上下文 · 3 记忆与知识 · 7 评估'
  },
  coding: {
    label: 'Coding Agent',
    title: '读取工作区，修改代码，再用环境事实验收',
    description: '模型用搜索和读取工具定位实现，生成补丁，运行测试并根据错误继续修复。最终结果由代码差异和测试状态共同说明。',
    output: '范围明确的补丁、测试结果和剩余风险',
    risk: '越权修改、破坏用户改动、测试不足或把进程退出当成成功',
    stack: ['仓库检索', '文件编辑', '终端执行', '失败恢复', '回归验证'],
    chapters: '对应章节：4 工具 · 5 Coding Agent · 7 评估 · 9 进化'
  },
  operation: {
    label: '操作 Agent',
    title: '把自然语言意图变成受控的真实操作',
    description: '工具协议把 API、数据库、浏览器和桌面能力暴露给模型；程序在执行前检查参数、权限和风险，执行后核对环境状态。',
    output: '数据库记录、表单提交、文件变更或外部系统状态',
    risk: '重复提交、权限越界、不可逆动作和页面变化导致误操作',
    stack: ['工具发现', '参数校验', '权限门禁', '幂等执行', '状态核验'],
    chapters: '对应章节：4 工具 · 5 通用 Agent · 6 交互 · 7 评估'
  },
  evolution: {
    label: '进化 Agent',
    title: '把可靠的失败经验变成可回滚的系统更新',
    description: '系统先验证失败轨迹，提炼最小修改，再在边界集、保留集和安全集上回归。只有通过发布门的候选才能生效。',
    output: '更新后的规则、Prompt、Skill、程序或模型参数',
    risk: '从错误轨迹学习、只优化单个样例，或让更新破坏已有能力',
    stack: ['轨迹验证', '失败归因', '候选更新', '回归测试', '灰度回滚'],
    chapters: '对应章节：7 评估 · 8 后训练 · 9 持续进化'
  },
  collaboration: {
    label: '多 Agent',
    title: '让多个角色并行工作，并由独立规则收敛结果',
    description: '任务被拆给拥有独立上下文的 worker；消息总线传递必要信息，审核者检查证据，运行时负责并发、取消和唯一结算。',
    output: '多路研究证据、冲突说明和经审核的综合结果',
    risk: '重复工作、上下文污染、协调成本和错误在角色之间扩散',
    stack: ['任务分解', '上下文隔离', '并行执行', '消息协议', '独立审核'],
    chapters: '对应章节：6 异步 · 7 评估 · 10 多 Agent'
  }
};

function selectPressed(button, selector) {
  document.querySelectorAll(selector).forEach(item => {
    item.setAttribute('aria-pressed', String(item === button));
  });
}

document.querySelectorAll('[data-mission]').forEach(button => {
  button.addEventListener('click', () => {
    const mission = missions[button.dataset.mission];
    selectPressed(button, '[data-mission]');
    document.getElementById('mission-label').textContent = mission.label;
    document.getElementById('mission-title').textContent = mission.title;
    document.getElementById('mission-description').textContent = mission.description;
    document.getElementById('mission-output').textContent = mission.output;
    document.getElementById('mission-risk').textContent = mission.risk;
    document.getElementById('mission-chapters').textContent = mission.chapters;
    const stack = document.getElementById('mission-stack');
    stack.replaceChildren(...mission.stack.map((name, index) => {
      const item = document.createElement('span');
      item.textContent = name;
      item.style.setProperty('--level', index + 1);
      return item;
    }));
  });
});

document.querySelectorAll('[data-skill-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.skillFilter;
    selectPressed(button, '[data-skill-filter]');
    document.querySelectorAll('[data-skill-level]').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.skillLevel !== filter;
    });
  });
});

const learningPlans = {
  overview: {
    duration: '1 DAY / ORIENTATION',
    title: '先建立全局地图，再决定深入方向',
    description: '适合第一次接触 Agent 工程。集中理解核心公式、工具循环和评估边界，不安装复杂训练或硬件依赖。',
    stages: [
      ['AM 01', '理解最小 Agent', '阅读第 1 章导论与 context 实验说明', '能画出模型、上下文、工具和 Harness'],
      ['AM 02', '理解上下文与知识', '浏览第 2–3 章，区分 Prompt、记忆和 RAG', '能说明三类信息分别放在哪里'],
      ['PM 01', '理解工具与 Coding Agent', '阅读第 4–5 章核心循环和工具注册', '能追踪一次 tool_call 到 tool_result'],
      ['PM 02', '理解评估与后续路线', '重点阅读第 7 章，再浏览第 8–10 章', '选定一个准备亲手运行的实验']
    ]
  },
  practice: {
    duration: '2 WEEKS / MINIMUM LOOP',
    title: '亲手完成一个有知识、有工具、有评估的 Agent',
    description: '适合希望快速进入实践的人。第一周建立执行能力，第二周补上检索和评估，形成一个小而完整的项目。',
    stages: [
      ['D1–2', '运行基础循环', '第 1 章：context 与 web-search-agent', '产物：带完整轨迹的多轮搜索'],
      ['D3–4', '管理上下文', '第 2 章：Prompt、KV Cache 与压缩', '产物：三种上下文策略对照'],
      ['D5–7', '接入工具', '第 4–5 章：只读工具与 Coding Agent', '产物：安全的工具 schema 和错误路径'],
      ['D8–10', '接入知识', '第 3 章：BM25、向量与重排序', '产物：带来源的知识问答'],
      ['D11–14', '建立评估', '第 7 章：20 个任务、Verifier 与失败归因', '产物：完成率、引用、成本和时延报告']
    ]
  },
  systematic: {
    duration: '6 WEEKS / RECOMMENDED',
    title: '从最小 Agent 到可评估、可进化的系统',
    description: '适合希望建立完整 Agent 工程能力，并把所学迁移到自己项目的人。每周只选择少量代表实验，先完成证据闭环。',
    stages: [
      ['W1', '建立最小循环', '第 1–2 章：Agent、Harness、上下文与压缩', '产物：带轨迹的搜索 Agent'],
      ['W2', '接入知识', '第 3 章：记忆、混合检索、RAG 与索引', '产物：带引用的知识问答'],
      ['W3', '获得行动能力', '第 4–5 章：工具、MCP 与 Coding Harness', '产物：读改测闭环'],
      ['W4', '扩展交互并评估', '第 6–7 章：异步、GUI、环境和 Verifier', '产物：20 题评估报告'],
      ['W5', '理解能力更新', '第 8–9 章：后训练、轨迹学习、回归与回滚', '产物：一项安全规则更新'],
      ['W6', '组织协作并迁移', '第 10 章：单 / 多 Agent 对照，迁移到现有项目', '产物：最终实践报告']
    ]
  }
};

function renderLearningPlan(key) {
  const plan = learningPlans[key];
  document.getElementById('plan-duration').textContent = plan.duration;
  document.getElementById('plan-title').textContent = plan.title;
  document.getElementById('plan-description').textContent = plan.description;
  const list = document.getElementById('plan-list');
  list.replaceChildren(...plan.stages.map(([step, title, description, output]) => {
    const article = document.createElement('article');
    const badge = document.createElement('b');
    const copy = document.createElement('div');
    const heading = document.createElement('h3');
    const detail = document.createElement('p');
    const result = document.createElement('span');
    badge.textContent = step;
    heading.textContent = title;
    detail.textContent = description;
    result.textContent = output;
    copy.append(heading, detail);
    article.append(badge, copy, result);
    return article;
  }));
}

document.querySelectorAll('[data-plan]').forEach(button => {
  button.addEventListener('click', () => {
    selectPressed(button, '[data-plan]');
    renderLearningPlan(button.dataset.plan);
  });
});

const studyProgressKey = 'agentbook-study-progress-v1';
const weekChecks = [...document.querySelectorAll('[data-week-check]')];
const studyProgress = document.getElementById('study-progress');
const studyProgressText = document.getElementById('study-progress-text');

function renderStudyProgress() {
  const completed = weekChecks.filter(check => check.checked).length;
  studyProgress.value = completed;
  studyProgress.textContent = `${completed} / 6`;
  studyProgressText.textContent = completed === 6 ? '6 / 6 周完成 · 可以开始迁移复盘' : `${completed} / 6 周完成`;
}

try {
  const savedWeeks = JSON.parse(localStorage.getItem(studyProgressKey) || '[]');
  weekChecks.forEach(check => {
    check.checked = savedWeeks.includes(check.dataset.weekCheck);
  });
} catch {
  localStorage.removeItem(studyProgressKey);
}

weekChecks.forEach(check => {
  check.addEventListener('change', () => {
    const completedWeeks = weekChecks.filter(item => item.checked).map(item => item.dataset.weekCheck);
    localStorage.setItem(studyProgressKey, JSON.stringify(completedWeeks));
    renderStudyProgress();
  });
});

renderStudyProgress();

const loopSteps = [
  {
    owner: 'PROGRAM · 输入准备',
    title: '把目标、规则和可用能力放进当前上下文',
    detail: '程序读取用户目标、必要历史、检索资料和工具描述。上下文决定模型这一轮能看到什么，也决定它可能采取哪些动作。',
    trace: [['goal', '分析 ai-agent-book 的能力'], ['context', '固定提交 + README + 章节索引'], ['tools', 'web_search, read_source, run_check']],
    responsibility: 'Harness 选择、裁剪并排列信息'
  },
  {
    owner: 'MODEL · 动作决策',
    title: '根据当前信息，生成回答或结构化工具调用',
    detail: '模型判断信息是否足够。如果需要外部事实，它返回工具名称和参数；如果任务完成，则生成最终回答。程序不会把自然语言猜测直接当作操作。',
    trace: [['thought', '需要核对核心循环的真实实现'], ['action', 'read_source'], ['arguments', '{ path: "chapter5/coding-agent/agent.py" }']],
    responsibility: 'LLM 选择下一步，但不直接改变环境'
  },
  {
    owner: 'PROGRAM · 工具执行',
    title: '校验参数和权限，在真实环境中执行动作',
    detail: 'Harness 从注册表找到工具，检查调用参数、权限和运行边界。搜索、读取、写文件或执行命令都发生在模型之外。',
    trace: [['registry', '找到 read_source 工具'], ['guard', '只读路径允许'], ['execute', '读取固定版本源码']],
    responsibility: '工具实现与权限系统承担实际后果'
  },
  {
    owner: 'ENVIRONMENT · 事实返回',
    title: '把工具输出作为观察，写回消息历史',
    detail: '模型看到的是环境返回的文本、数据、图片或错误。它根据新观察继续推理，也可以在失败后换一种方法。',
    trace: [['observation', '解析 tool_calls → 执行 → tool_result'], ['status', '200 / source received'], ['history', '追加 role=tool 消息']],
    responsibility: '环境给出事实，Harness 保留完整轨迹'
  },
  {
    owner: 'VERIFIER · 结果判断',
    title: '分别检查过程约束和最终任务是否成立',
    detail: '模型说“完成”只是一个信号。验证器还要检查来源、文件、测试、环境快照和违规动作，必要时把失败反馈给 Agent。',
    trace: [['process', '来源与固定提交存在'], ['outcome', '五个研究问题均有明确回答'], ['verdict', 'PASS WITH BOUNDARY']],
    responsibility: '确定性检查、环境规则或独立评审判定'
  },
  {
    owner: 'SYSTEM · 经验更新',
    title: '只把可信经验写入记忆、规则、程序或参数',
    detail: '通过验证的轨迹可以产生最小更新。候选还要经过回归、灰度和回滚门，防止修复一个样例却破坏其他任务。',
    trace: [['signal', '缺少固定版本会导致结论漂移'], ['proposal', '研究模板新增版本锚点检查'], ['release', '边界集 + 保留集通过后发布']],
    responsibility: '发布系统控制版本，保留回滚能力'
  }
];

function renderLoop(index) {
  const step = loopSteps[index];
  document.querySelectorAll('[data-step]').forEach((button, buttonIndex) => {
    button.setAttribute('aria-pressed', String(buttonIndex === index));
  });
  document.getElementById('loop-counter').textContent = `STEP ${String(index + 1).padStart(2, '0')} / 06`;
  document.getElementById('loop-owner').textContent = step.owner;
  document.getElementById('loop-title').textContent = step.title;
  document.getElementById('loop-detail').textContent = step.detail;
  document.getElementById('loop-responsibility').textContent = step.responsibility;
  const trace = document.getElementById('loop-trace');
  trace.replaceChildren(...step.trace.flatMap(([key, value], lineIndex) => {
    const keyNode = document.createElement('span');
    keyNode.textContent = key;
    const textNode = document.createTextNode(`  ${value}`);
    return lineIndex === step.trace.length - 1 ? [keyNode, textNode] : [keyNode, textNode, document.createTextNode('\n')];
  }));
}

let currentLoopStep = 0;
document.querySelectorAll('[data-step]').forEach(button => {
  button.addEventListener('click', () => {
    currentLoopStep = Number(button.dataset.step);
    renderLoop(currentLoopStep);
  });
});
document.getElementById('loop-next').addEventListener('click', () => {
  currentLoopStep = (currentLoopStep + 1) % loopSteps.length;
  renderLoop(currentLoopStep);
});
