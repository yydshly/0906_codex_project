import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 原创说明图：根据固定版本源码绘制，不是产品截图或运行结果。
const out = fileURLToPath(new URL('../../docs/assets/projects/008-claudish-to-english/capability-architecture.svg', import.meta.url));
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1460" viewBox="0 0 1600 1460" role="img" aria-labelledby="title desc">
<title id="title">Claudish to English 完整能力架构图</title><desc id="desc">两条输入路径通过钩子进入提示词与模型改写，分别输出屏幕文字和 Markdown 文件。语言、表达、后端与运行控制可配置。</desc>
<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#66758d" stroke-width="1.5"/></marker></defs>
<style>text{font-family:'Microsoft YaHei','Noto Sans CJK SC',sans-serif;fill:#20324c}.title{font-size:40px;font-weight:700}.sub{font-size:21px;fill:#607088}.h{font-size:24px;font-weight:700}.body{font-size:21px}.small{font-size:18px;fill:#607088}.section{font-size:18px;fill:#516781;font-weight:700;letter-spacing:2px}</style>
<rect width="1600" height="1460" fill="#f4f7fb"/>`];
function text(x,y,s,cls='body'){parts.push(`<text x="${x}" y="${y}" class="${cls}">${esc(s)}</text>`);}
function rect(x,y,w,h,fill='#fff',stroke='#dbe3ef'){parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${stroke}"/>`);}
function box(x,y,w,h,title,lines,fill='#fff',stroke='#dbe3ef') {rect(x,y,w,h,fill,stroke);text(x+24,y+39,title,'h');lines.forEach((s,i)=>text(x+24,y+76+i*31,s));}
function arrow(x1,y1,x2,y2){parts.push(`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#66758d" stroke-width="2" fill="none" marker-end="url(#arrow)"/>`);}
text(52,62,'Claudish to English｜完整能力架构','title');
text(52,102,'通过钩子接收内容，再由模型按语言与表达规则改写；同时支持屏幕回答与 Markdown 文档。','sub');
text(52,141,'原创源码说明图 · v0.9.0 / bf271f9 · 非产品截图 · 未调用模型实测','small');

text(52,190,'01  输入与触发：两条独立路径','section');
box(52,209,728,160,'A  屏幕回答｜MessageDisplay',[
  '接收 Claude 回答片段 → 按会话与消息缓存',
  '完整回答到齐后调用一次；不先用程序提取核心内容',
  '原始会话记录保留原文'
],'#eaf2ff','#b9cfee');
box(820,209,728,160,'B  文档写入｜PostToolUse · Write / Edit',[
  '默认关闭；启用后仅处理指定目录内的 .md 文件',
  '检查文件范围与重复标记 → 暂存 YAML 元数据',
  '这是文件处理路径，会实际写入磁盘'
],'#eaf7f0','#badcca');
arrow(700,369,700,419);arrow(1184,369,1184,419);

text(52,406,'02  提示词：语言与表达可以组合，文档有独立规则','section');
box(52,429,472,182,'语言｜用什么语言说',[
  '默认跟随输入或宿主语言设置',
  '显式指定中文、英文等目标语言',
  '可以组合：中文＋摘要／通俗表达'
]);
box(564,429,472,182,'表达｜怎么说',[
  '默认：短句、日常词汇，保留信息',
  '屏幕预设：摘要 / 儿童解释 / 极简',
  '摘要允许省略次要细节和代码块'
]);
box(1076,429,472,182,'自定义｜按自己的要求说',[
  '屏幕、Markdown 各有提示词文件',
  '覆盖基础规则及已附加的语言要求',
  '需自行写全语言、保真和输出要求'
]);
rect(52,627,1496,66,'#e9edf5');
text(76,654,'默认约束：保留事实、数字、名称、路径与代码；只输出改写正文。','body');
text(76,681,'屏幕额外语境：最近用户问题（有则附加）＋说话者关系；不让改写模型重新回答问题。','small');
arrow(800,693,800,738);

text(52,730,'03  模型后端：真正执行翻译、换词、拆句和摘要','section');
rect(52,751,1496,172,'#243b59','#243b59');
parts.push('<text x="76" y="788" style="font-size:24px;font-weight:700;fill:white">统一调用：改写指令 sys ＋ 完整材料 → 模型生成新文本</text>');
const providers = [
  ['Ollama','默认本地模型；可配置地址'],
  ['Codex CLI','使用 CLI 自身登录与模型'],
  ['Anthropic','API；可选非官方登录复用'],
  ['OpenAI 兼容接口','接入本地服务或远端模型']
];
providers.forEach(([a,b],i)=>{let x=76+i*367;rect(x,807,345,91,'#fff','#fff');text(x+16,841,a,'h');text(x+16,875,b,'small');});
arrow(416,923,416,971);arrow(1184,923,1184,971);

text(52,955,'04  输出：分别回到显示或文件路径','section');
box(52,985,728,160,'A  回答展示',[
  'append：原文流式显示完成后，追加改写版',
  'replace：等待改写后仅显示新文本',
  '/claudish last：重新显示最近原回答'
],'#eaf2ff','#b9cfee');
box(820,985,728,160,'B  Markdown 保存',[
  'sibling：生成 NAME.plain.md，可自定义后缀',
  'overwrite：覆盖原文件并写入已处理标记',
  '恢复 YAML 元数据；临时文件写好后再替换'
],'#eaf7f0','#badcca');

text(52,1182,'05  贯穿流程的控制与保护','section');
box(52,1200,728,147,'运行控制｜/claudish ＋配置',[
  '开关、显示、风格、语言、模型切换；cycle / reset',
  '面板显示配置来源；覆盖项跨会话保留并提醒'
]);
box(820,1200,728,147,'调用与故障处理',[
  '长度门槛、超时、部分后端推理强度；失败回退',
  '截断结果丢弃、一次性通知、DEBUG 日志、STUB 测试'
]);
rect(52,1366,1496,54,'#fff3df','#e7d3ad');
text(76,1400,'能力边界：保真主要依赖提示词；没有自动事实核验、专用简化模型或 RAG。风格预设主要用于屏幕回答。','body');
text(52,1445,'来源：固定提交的 README、hooks、rewrite、rewrite-md、providers、lang 与 claudish-ctl。研究日期：2026-09-07。','small');
parts.push('</svg>');
writeFileSync(out,parts.join('\n'));
console.log(out);
