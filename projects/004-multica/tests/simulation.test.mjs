import assert from 'node:assert/strict';
import {createSimulation,advance,approve} from '../../../docs/demos/004-multica/simulation.mjs';

for (const capacity of [1,2,3]) for (const mode of ['worktree','direct']) {
  const s=createSimulation({capacity,mode});
  assert.throws(()=>approve(s));
  for(let i=0;i<50 && s.issue!=='in_review';i++) {
    advance(s);
    const active=s.jobs.filter(j=>j.status==='running');
    assert.ok(active.length<=capacity,'Machine capacity must never be exceeded');
    if(mode==='direct') assert.ok(active.length<=1,'Shared directory must serialize execution');
    assert.equal(new Set(active.map(j=>j.id)).size,active.length,'A run must not execute twice');
  }
  assert.equal(s.issue,'in_review','Progress must terminate in review, not done');
  assert.ok(s.jobs.filter(j=>j.kind==='worker').every(j=>j.status==='completed'));
  const before=s.tick; advance(s); assert.equal(s.tick,before);
  approve(s); assert.equal(s.issue,'done');
}
const parallel=createSimulation({capacity:2,mode:'worktree'});
while(parallel.issue!=='in_review') advance(parallel);
const [a,b,c]=['A','B','C'].map(id=>parallel.jobs.find(j=>j.id===id));
assert.equal(a.start,b.start,'Independent workers should start together when capacity permits');
assert.equal(c.start,a.end,'Freed capacity should be reusable immediately');
assert.ok(c.start<b.end,'C must not wait for both A and B');
assert.ok(parallel.jobs.some(j=>j.kind==='review' && j.start!==null),'Feedback must drive a later leader run');
assert.throws(()=>createSimulation({capacity:0}));
assert.throws(()=>createSimulation({mode:'unknown'}));
console.log('PASS: 6 capacity/directory combinations; independent slot release; feedback; human review boundary.');
