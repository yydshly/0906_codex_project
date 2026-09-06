import fs from 'node:fs/promises';

// 只保留目录与结构检查结果，不复制上游讲义或医案正文。
const repository = 'jangviktor-web/nihaixia';
const commit = '68ce4bf21351a35911d173224c1bc66db3e4e754';
const headers = { 'User-Agent': 'github-research-lab', Accept: 'application/vnd.github+json' };
async function get(url, json = false) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return json ? response.json() : response.text();
}
const base = `https://raw.githubusercontent.com/${repository}/${commit}/`;
const results = await Promise.allSettled([
  get(`https://api.github.com/repos/${repository}/git/trees/${commit}?recursive=1`, true),
  get(`${base}SKILL.md`),
  get(`${base}cases/00_merged_table.md`),
  get(`${base}index.html`),
]);
const errors = results.filter((r) => r.status === 'rejected');
if (errors.length) throw new AggregateError(errors.map((r) => r.reason), '上游检查未完成');
const [tree, skill, cases, page] = results.map((r) => r.value);
if (tree.truncated) throw new Error('GitHub 目录被截断，无法可靠检查');
const files = tree.tree.filter((f) => f.type === 'blob');
const rows = cases.split('\n').filter((line) => /^\|\s*\d+\s*\|/.test(line));
const report = {
  repository: `https://github.com/${repository}`,
  commit,
  checkedAt: new Date().toISOString(),
  method: '固定 commit 的目录及文本结构检查；未安装技能，未验证医学内容或模型回答质量。',
  observations: {
    moduleFiles: files.filter((f) => /^modules\/.*\.md$/.test(f.path)).length,
    skillBytes: Buffer.byteLength(skill),
    numberedCaseRows: rows.length,
    placeholderCaseRows: rows.filter((line) => /^\|\s*\d+\s*\|(?:\s*---\s*\|){11}\s*$/.test(line)).length,
    rootLicenseFiles: files.filter((f) => /^(license|licence|copying)(\.[^/]*)?$/i.test(f.path)).map((f) => f.path),
    executableFilePaths: files.filter((f) => /\.(py|js|mjs|ts|sh|ipynb)$/i.test(f.path)).map((f) => f.path),
    keywordRetrievalPresent: /Grep/.test(skill) && /Read/.test(skill),
    landingPageTitle: page.match(/<title>(.*?)<\/title>/)?.[1] ?? null,
  },
  limitations: ['编号行不等于独立患者或有效病例。', '未发现某种扩展名不代表已完成安全审计。', '未发现根许可证文件不等于已作出法律授权判断。'],
};
await fs.writeFile(new URL('./verification.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
