import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = 'https://github.com/yydshly/0906_codex_project';
const statuses = ['待研究', '研究中', '已完成', '已归档'];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(root, file), text);
const key = (p) => `${p.id}-${p.slug}`;
const html = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md = (value) => html(value).replace(/[\\`*_[\]{}|]/g, (c) => `&#${c.charCodeAt(0)};`);
const https = (value) => {
  try { const u = new URL(value); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password && !/[\s<>"()]/.test(value); }
  catch { return false; }
};
function localFile(file, prefix) {
  if (!file.startsWith(prefix) || !/^[a-zA-Z0-9/_.-]+$/.test(file) || file.split('/').some((part) => part === '..' || part === '.')) return false;
  const full = path.join(root, file);
  return fs.existsSync(full) && fs.statSync(full).isFile();
}
function validate(items) {
  if (!Array.isArray(items)) throw new Error('projects.json 必须是数组。');
  const ids = new Set();
  for (const p of items) {
    if (!p || typeof p !== 'object') throw new Error('项目条目必须是对象。');
    if (typeof p.id !== 'string' || !/^\d{3,}$/.test(p.id) || !Number.isSafeInteger(Number(p.id)) || Number(p.id) < 1 || p.id !== String(Number(p.id)).padStart(3, '0') || ids.has(p.id)) throw new Error(`编号无效或重复：${p.id}`);
    ids.add(p.id);
    if (typeof p.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) throw new Error(`英文短名无效：${p.slug}`);
    if (!Number.isSafeInteger(p.order) || p.order < 1) throw new Error(`${p.id}: order 必须为正整数。`);
    for (const field of ['name', 'summary', 'repository', 'status', 'cover', 'coverAlt', 'demo']) {
      if (typeof p[field] !== 'string' || /[\r\n]/.test(p[field])) throw new Error(`${p.id}: ${field} 必须为单行字符串。`);
    }
    if (!p.name.trim() || !p.summary.trim() || !https(p.repository)) throw new Error(`${p.id}: 名称、摘要或仓库地址无效。`);
    if (!statuses.includes(p.status)) throw new Error(`${p.id}: 未知研究状态。`);
    if (!Array.isArray(p.tags) || p.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || /[\r\n]/.test(tag))) throw new Error(`${p.id}: tags 必须是非空字符串数组（可为空数组）。`);
    if (!localFile(`projects/${key(p)}/README.md`, 'projects/')) throw new Error(`${p.id}: 缺少研究 README。`);
    if (p.cover && (!localFile(p.cover, `docs/assets/projects/${key(p)}/`) || !/\.(png|jpe?g|webp|gif|svg)$/i.test(p.cover) || !p.coverAlt.trim())) throw new Error(`${p.id}: 封面路径、文件或图片说明无效。`);
    if (p.demo && !https(p.demo) && (p.demo !== `demos/${key(p)}/` || !localFile(`docs/${p.demo}index.html`, 'docs/demos/'))) throw new Error(`${p.id}: demo 需为 HTTPS 地址或有 index.html 的对应演示目录。`);
  }
  return [...items].sort((a, b) => a.order - b.order || Number(a.id) - Number(b.id));
}
function replaceSection(text, name, body) {
  const start = `<!-- ${name}:START -->`;
  const end = `<!-- ${name}:END -->`;
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(end) < text.indexOf(start)) throw new Error(`README 中的 ${name} 标记缺失或重复。`);
  return text.slice(0, text.indexOf(start)) + `${start}\n${body}\n${end}` + text.slice(text.indexOf(end) + end.length);
}
function outputs(items) {
  const demoReadme = (p) => p.demo.startsWith('https://') ? p.demo : `https://yydshly.github.io/0906_codex_project/${p.demo}`;
  const rows = items.map((p) => `| ${p.id} | [${md(p.name)}](projects/${key(p)}/README.md) | ${md(p.summary)} | ${p.status} | [源码](${p.repository}) | ${p.demo ? `[演示](${demoReadme(p)})` : '—'} |`);
  const index = items.length ? ['| 编号 | 项目 | 研究摘要 | 状态 | 原仓库 | Web |', '| --- | --- | --- | --- | --- | --- |', ...rows].join('\n') : '尚未登记研究项目。第一个真实项目将从 **001** 开始，后续按展示顺序排列。';
  const gallery = items.filter((p) => p.cover).map((p) => `### ${p.id} · ${md(p.name)}\n\n[![${md(p.coverAlt)}](${p.cover})](projects/${key(p)}/README.md)\n\n${md(p.summary)}`).join('\n\n') || '项目封面和截图将在完成实际研究后展示；每张图片链接至对应研究文档。';
  let readme = replaceSection(read('README.md'), 'PROJECT_INDEX', index);
  readme = replaceSection(readme, 'PROJECT_GALLERY', gallery);
  const cards = items.map((p) => `<article class="card" id="project-${p.id}" data-project-id="${p.id}" data-project-tags="${html(JSON.stringify(p.tags))}">
${p.cover ? `<img src="${html(p.cover.slice(5))}" alt="${html(p.coverAlt)}" loading="lazy">` : ''}
<div class="card-body"><div class="meta"><span>RESEARCH / ${p.id}</span><span>${p.status}</span></div>
<h3>${html(p.name)}</h3><p>${html(p.summary)}</p><div class="tags">${p.tags.map((tag) => `<span class="tag">${html(tag)}</span>`).join('')}</div>
<button type="button" class="guide-save" data-save="${p.id}" aria-pressed="false" aria-label="收藏 ${html(p.name)}" hidden>☆ 收藏项目</button><div class="links"><a href="${repo}/tree/main/projects/${key(p)}">研究文档 ↗</a><a href="${html(p.repository)}">原仓库 ↗</a>${p.demo ? `<a href="${html(p.demo)}">Web 演示 ↗</a>` : ''}</div></div></article>`).join('\n');
  const page = `<!doctype html>
<!-- Generated by scripts/catalog.mjs. Edit projects.json and run npm run sync. -->
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="优秀 GitHub 开源项目的研究笔记、实践记录与 Web 演示索引。"><title>GitHub Research Lab · 开源项目研究</title><link rel="icon" href="data:,"><link rel="stylesheet" href="assets/style.css"><script src="assets/lab-guide.js" defer></script></head>
<body>
<header><div class="brand"><span></span>RESEARCH LAB</div><a href="${repo}">GitHub 仓库 ↗</a></header>
<main>
<section class="hero"><div class="eyebrow">OPEN SOURCE / FIELD NOTES</div><h1>发现好项目，<br><span>把研究变成实践。</span></h1><p class="intro">一个持续生长的开源项目研究档案。从值得收藏的仓库出发，记录设计、验证想法，留下可复现的结论与可以体验的作品。</p>
<div class="stats"><span><strong>${items.length}</strong> 研究项目</span><span><strong>${items.filter((p) => p.status === '研究中').length}</strong> 研究中</span><span><strong>${items.filter((p) => p.demo).length}</strong> Web 演示</span></div></section>
${read('scripts/templates/lab-guide.html')}
<section aria-labelledby="project-heading"><div class="section-heading"><h2 id="project-heading">项目索引</h2><span class="count">固定编号 · 按研究索引顺序展示</span></div>
<div class="grid">${cards || '<div class="empty"><div class="empty-number">001</div><div><h3>为第一项研究留一个位置</h3><p>研究档案已准备就绪。下一个值得深入的开源项目，将从这里开始，逐步补充研究笔记、真实截图与实践演示。</p></div></div>'}</div></section>
<section class="about" aria-label="研究方式"><div><div class="eyebrow">01 / DISCOVER</div><h3>发现与选择</h3><p>记录项目解决的问题、适用场景和研究价值，保留上游来源。</p></div><div><div class="eyebrow">02 / EXPLORE</div><h3>拆解与验证</h3><p>追踪关键设计，通过可复现的实验形成自己的理解。</p></div><div><div class="eyebrow">03 / BUILD</div><h3>实践与沉淀</h3><p>用研究笔记、界面截图和 Web 演示串起每一次探索。</p></div></section>
</main><footer><span>GitHub Research Lab · 持续记录，逐步积累。</span><a href="${repo}/blob/main/CONTRIBUTING.md">研究与维护约定 ↗</a></footer>
</body></html>
`;
  return [['README.md', readme], ['docs/index.html', page]];
}
function sync(items, check = false) {
  for (const [file, expected] of outputs(items)) {
    if (check) {
      if (!fs.existsSync(path.join(root, file)) || read(file) !== expected) throw new Error(`${file} 尚未同步，请运行 npm run sync。`);
    } else write(file, expected);
  }
}
function create(items, args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--slug', '--name', '--repo'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options[args[i]]) throw new Error('用法：npm run project:new -- --slug project-name --name "项目名称" --repo https://github.com/owner/repo');
    options[args[i]] = args[i + 1];
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options['--slug'] || '') || !options['--name']?.trim() || /[\r\n]/.test(options['--name']) || !https(options['--repo'] || '')) throw new Error('请提供有效的 --slug、--name 和 HTTPS --repo。');
  if (items.some((p) => p.slug === options['--slug'])) throw new Error('该英文短名已登记。');
  const p = { id: String(Math.max(0, ...items.map((p) => Number(p.id))) + 1).padStart(3, '0'), slug: options['--slug'], order: Math.max(0, ...items.map((p) => p.order)) + 10, name: options['--name'], summary: '待补充：项目价值与研究重点。', repository: options['--repo'], status: '待研究', tags: [], cover: '', coverAlt: '', demo: '' };
  const directory = `projects/${key(p)}`;
  const assets = `docs/assets/projects/${key(p)}`;
  if (fs.existsSync(path.join(root, directory)) || fs.existsSync(path.join(root, assets))) throw new Error('目标目录已存在，停止创建。');
  const values = { ID: p.id, NAME: md(p.name), SUMMARY: p.summary, REPOSITORY: p.repository, KEY: key(p) };
  const templates = ['README.md', 'notes.md'].map((file) => [file, read(`templates/project/${file}`).replace(/\{\{(\w+)\}\}/g, (_, name) => values[name])]);
  // Check generated sections before creating any project files.
  outputs(items);
  fs.mkdirSync(path.join(root, directory), { recursive: true });
  fs.mkdirSync(path.join(root, assets), { recursive: true });
  for (const [file, content] of templates) write(`${directory}/${file}`, content);
  write(`${assets}/.gitkeep`, '');
  const updated = validate([...items, p]);
  write('projects.json', `${JSON.stringify(updated, null, 2)}\n`);
  sync(updated);
  console.log(`已创建 ${directory}，并同步 README 与 Web 索引。`);
}
try {
  const command = process.argv[2];
  if (!['new', 'sync', 'check'].includes(command)) throw new Error('支持的命令：new、sync、check。');
  const items = validate(JSON.parse(read('projects.json')));
  if (command === 'new') create(items, process.argv.slice(3));
  else { sync(items, command === 'check'); console.log(`${command === 'check' ? '校验通过' : '同步完成'}：${items.length} 个研究项目。`); }
} catch (error) {
  console.error(`错误：${error.message}`);
  process.exitCode = 1;
}
