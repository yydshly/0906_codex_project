// Independent teaching model. No network, CLI processes, or model calls.
export const workerSpecs = [
  {id: 'A', label: '前端成员 A', duration: 3, tool: 'Claude Code'},
  {id: 'B', label: '后端成员 B', duration: 5, tool: 'Codex'},
  {id: 'C', label: '文档成员 C', duration: 2, tool: 'Codex'},
];
const event = (s, message) => s.events.push({tick: s.tick, message});
function enqueue(s, id, label, kind, duration, tool='Codex') {
  s.jobs.push({id, label, kind, duration, remaining: duration, tool, status: 'queued', start: null, end: null});
}
export function createSimulation({capacity=2, mode='worktree'}={}) {
  if (![1,2,3].includes(capacity) || !['worktree','direct'].includes(mode)) throw new Error('Invalid teaching configuration');
  const s={capacity, mode, tick:0, issue:'todo', jobs:[], events:[], reviewNumber:0};
  enqueue(s,'L0','负责人：首次派工','plan',1);
  event(s,'任务已交给小队，负责人首次 Run 等待领取。');
  return s;
}
function requestReview(s) {
  if (s.jobs.some(j => j.kind==='review' && ['queued','running'].includes(j.status))) {
    event(s,'反馈合并到待处理的负责人检查中。');
    return;
  }
  s.reviewNumber++;
  enqueue(s,`L${s.reviewNumber}`,`负责人：检查 ${s.reviewNumber}`,'review',1);
  event(s,'成员反馈触发负责人后续 Run。');
}
export function advance(s) {
  if (['in_review','done'].includes(s.issue)) return s;
  s.tick++;
  const finished=[];
  for (const job of s.jobs.filter(j=>j.status==='running')) {
    job.remaining--;
    if (job.remaining===0) {
      job.status='completed'; job.end=s.tick; finished.push(job);
      event(s,`${job.label}结束，清理完成并归还一个名额。`);
    }
  }
  // Settle all completions first so a leader checking in this step sees current facts.
  for (const job of finished) {
    if (job.kind==='plan') {
      for (const w of workerSpecs) enqueue(s,w.id,w.label,'worker',w.duration,w.tool);
      event(s,'负责人分派 A / B / C 后结束本轮；整体任务继续进行。');
    } else if (job.kind==='worker') requestReview(s);
  }
  for (const job of finished.filter(j=>j.kind==='review')) {
    const workers=s.jobs.filter(j=>j.kind==='worker');
    if (workers.length===3 && workers.every(j=>j.status==='completed')) {
      s.issue='in_review'; event(s,'负责人确认教学目标已满足，提交审阅；尚未标记完成。');
    } else event(s,'负责人发现仍有成员未完成，结束检查并等待后续反馈。');
  }
  if (s.issue==='in_review') return s;
  while (s.jobs.filter(j=>j.status==='running').length<s.capacity) {
    const candidate=s.jobs.find(j=>j.status==='queued');
    if (!candidate) break;
    if (s.mode==='direct' && s.jobs.some(j=>j.status==='running')) break;
    candidate.status='running'; candidate.start=s.tick;
    s.issue='in_progress';
    event(s,`取得名额并领取 ${candidate.label}，启动 ${candidate.tool} 教学运行。`);
  }
  return s;
}
export function approve(s) {
  if (s.issue!=='in_review') throw new Error('Review is required before completion');
  s.issue='done'; event(s,'人工验收通过，整体任务进入 done。'); return s;
}
