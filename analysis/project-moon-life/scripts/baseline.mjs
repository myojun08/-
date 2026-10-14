import * as G from './harness.mjs';
import fs from 'fs';
const data = G.St();
function runLife(seed, chooser){
  const s = G.wy(data, { seed, name:'T', gender: (parseInt(seed)%2)?'m':'f' });
  let guard=0;
  while(!s.dead && guard++ < 100000){
    if(s.prompt){ const c = chooser(s); G.nr(s, data, c, {auto:true}); continue; }
    if(s.cursor < s.plan.length){ G.Ry(s, data); continue; }
    G.rm(s, data);
  }
  return s;
}
const N = parseInt(process.argv[2]||'2000');
const t0=Date.now();
const rows=[];
for(let i=0;i<N;i++){
  const s = runLife(String(1000000+i), (st)=>G.Vy(st));
  const sum = G.Nc(s, data);
  rows.push({seed:s.seed, region:s.regionId, family:s.family, age:s.dead.age, cause:s.dead.cause, src:s.dead.source, job:sum.job, rare:sum.rare, jobTier:sum.jobTier, stats:s.stats, flags:s.flags, org:sum.org, events:s.log.filter(l=>l.kind==='event').length, choices:s.log.filter(l=>l.kind==='result'&&l.choice).length});
}
console.log('lives',N,'ms',Date.now()-t0);
fs.writeFileSync('sim/baseline.json', JSON.stringify(rows));
const cnt=(arr,f)=>{const m={};for(const r of arr){const k=f(r);m[k]=(m[k]||0)+1;}return Object.entries(m).sort((a,b)=>b[1]-a[1]);};
const mean=(arr,f)=>arr.reduce((a,r)=>a+f(r),0)/arr.length;
console.log('mean age', mean(rows,r=>r.age).toFixed(1), 'median', rows.map(r=>r.age).sort((a,b)=>a-b)[Math.floor(N/2)]);
console.log('cause', cnt(rows,r=>r.cause).slice(0,15));
console.log('source', cnt(rows,r=>r.src));
console.log('region', cnt(rows,r=>r.region));
console.log('family', cnt(rows,r=>r.family));
console.log('job', cnt(rows,r=>r.job).slice(0,25));
console.log('age<5', rows.filter(r=>r.age<5).length/N, 'age<20', rows.filter(r=>r.age<20).length/N, 'age>=60', rows.filter(r=>r.age>=60).length/N);
console.log('avg events', mean(rows,r=>r.events).toFixed(1), 'avg choices', mean(rows,r=>r.choices).toFixed(1));
