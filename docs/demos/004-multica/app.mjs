import {createSimulation,advance,approve} from './simulation.mjs';
const $=id=>document.getElementById(id);
const asset='../../assets/projects/004-multica/';
const atlas={
  guide:['architecture-guide','先看入口、平台与执行机，再分别理解并发控制和任务推进。'],
  system:['multica-system-architecture','组件归属、部署边界、通信协议、数据存放与扩展位置。'],
  execution:['multica-execution-architecture','负责人和成员如何绑定 Runtime，如何通过工具进程接入模型。'],
  control:['multica-system-control-architecture','程序管理并发执行；规则、模型判断与人工验收共同推进任务。橙色区域是建议增强。'],
  capability:['multica-capability-architecture','任务、角色、技能、自动化、执行管理与成果展示的功能分布。'],
};
for(const button of document.querySelectorAll('[data-atlas]')) button.addEventListener('click',()=>{
  const [stem,caption]=atlas[button.dataset.atlas];
  for(const peer of document.querySelectorAll('[data-atlas]')) peer.setAttribute('aria-pressed',String(peer===button));
  $('atlas-image').src=asset+stem+'.svg'; $('atlas-image').alt=caption;
  $('atlas-open').href=asset+stem+'.svg'; $('atlas-download').href=asset+stem+'.png';
  $('atlas-caption').textContent=caption+' 点击图片可打开矢量原图。';
});
let state;
const labels={todo:'待开始',in_progress:'进行中',in_review:'待人工审阅',done:'已完成',queued:'排队',running:'运行中',completed:'本次执行结束'};
function render(){
  const active=state.jobs.filter(j=>j.status==='running').length;
  $('sim-status').textContent=`第 ${state.tick} 步 · 名额占用 ${active} / ${state.capacity} · 整体任务：${labels[state.issue]}`;
  $('sim-jobs').replaceChildren(...state.jobs.map(job=>{
    const row=document.createElement('div'); row.className='mc-job '+job.status;
    const name=document.createElement('strong');name.textContent=job.label;
    const status=document.createElement('span');status.textContent=labels[job.status];
    const detail=document.createElement('small');detail.textContent=`${job.tool} · ${job.status==='running'?'剩余 '+job.remaining+' 步':job.start===null?'等待执行':`开始 ${job.start} / 结束 ${job.end??'—'}`}`;
    row.append(name,status,detail);return row;
  }));
  $('sim-events').replaceChildren(...state.events.slice(-8).reverse().map(e=>{
    const li=document.createElement('li');const stamp=document.createElement('span');stamp.textContent=String(e.tick).padStart(2,'0');
    const message=document.createElement('p');message.textContent=e.message;li.append(stamp,message);return li;
  }));
  $('advance').disabled=['in_review','done'].includes(state.issue);
  $('approve').hidden=state.issue!=='in_review';
}
function reset(){state=createSimulation({capacity:Number($('capacity').value),mode:$('directory-mode').value});render();}
$('advance').addEventListener('click',()=>{advance(state);render();});
$('approve').addEventListener('click',()=>{approve(state);render();});
$('reset').addEventListener('click',reset);
$('capacity').addEventListener('change',reset);
$('directory-mode').addEventListener('change',reset);
reset();
