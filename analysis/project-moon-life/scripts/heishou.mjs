import * as G from './harness.mjs';
import fs from 'fs';
const data = G.St();
const N = parseInt(process.argv[2]||'1500');
function findLabel(s, re){ return s.prompt.choices.findIndex(c=>!c.locked && re.test(c.label)); }
const pol = {
  accept: (s)=>{ if(s.prompt.eventId==='hs_join') return findLabel(s,/삼킨다/); if(s.prompt.kind==='major' && /^a_career|^a_find_work/.test(s.prompt.eventId||'')){ const i=findLabel(s,/날개의 사원|날개의 공채|정규 사원/); if(i>=0) return i; } return G.Vy(s); },
  decline: (s)=>{ if(s.prompt.eventId==='hs_join') return findLabel(s,/사양/); if(s.prompt.kind==='major' && /^a_career|^a_find_work/.test(s.prompt.eventId||'')){ const i=findLabel(s,/날개의 사원|날개의 공채|정규 사원/); if(i>=0) return i; } return G.Vy(s); },
};
const res={};
for(const [name,p] of Object.entries(pol)){
  const rows=[]; let joined=0, offered=0; const joinAges=[], rank2=[], causes={}, agesJoined=[], agesNot=[], evCount={};
  for(let i=0;i<N;i++){
    const s = G.wy(data,{seed:String(7000000+i), name:'T', gender:(i%2)?'m':'f', regionId:'H'});
    let gotOffer=false, j=false, jAge=null; let guard=0;
    while(!s.dead && guard++<100000){
      if(s.prompt){ if(s.prompt.eventId==='hs_join'){ gotOffer=true; } const c=p(s); if(s.work==='흑수' && s.prompt.eventId){ evCount[s.prompt.eventId]=(evCount[s.prompt.eventId]||0)+1; } G.nr(s,data,c,{auto:true}); if(!j && s.work==='흑수'){ j=true; jAge=s.age; } continue; }
      if(s.cursor<s.plan.length){ G.Ry(s,data); continue; }
      G.rm(s,data);
    }
    if(gotOffer) offered++;
    if(j){ joined++; joinAges.push(jAge); if((s.wingBest||0)>=2) rank2.push(1); agesJoined.push(s.dead.age); causes[s.dead.cause]=(causes[s.dead.cause]||0)+1; }
    else agesNot.push(s.dead.age);
    rows.push({age:s.dead.age, cause:s.dead.cause, joined:j, jAge, work:s.work, job:s.job, wingBest:s.wingBest, branch:s.branch, stats:s.stats, warp:s.warpRec||null});
  }
  const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  res[name]={N, offered:offered/N, joined:joined/N, joinAgeMean:mean(joinAges), lifeJoined:mean(agesJoined), lifeNotJoined:mean(agesNot), rank2:rank2.length/Math.max(1,joined), causesJoined:causes, evCount};
  fs.writeFileSync(`sim/heishou_${name}.json`, JSON.stringify(rows));
  console.log(name, JSON.stringify(res[name]));
}
fs.writeFileSync('sim/heishou_summary.json', JSON.stringify(res,null,1));
