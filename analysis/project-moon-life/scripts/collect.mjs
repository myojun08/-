// Run M lives with default auto policy; record event occurrence stats and sample prompt states per event.
import * as G from './harness.mjs';
import fs from 'fs';
const data = G.St();
const M = parseInt(process.argv[2]||'3000'), S = parseInt(process.argv[3]||'40'), OFF = parseInt(process.argv[4]||'0');
const occ = {};      // eventId -> lives in which it appeared
const occAll = {};   // eventId -> total appearances
const samples = {};  // eventId -> [stateJSON]
const chosen = {};   // eventId -> {choiceIndex: count}
const t0=Date.now();
for(let i=0;i<M;i++){
  const seed = String(5000000+OFF+i);
  const s = G.wy(data, { seed, name:'T', gender: (i%2)?'m':'f' });
  const seen = new Set();
  let guard=0;
  while(!s.dead && guard++ < 100000){
    if(s.prompt){
      const p = s.prompt;
      const id = p.req ? 'request' : (p.warp ? ('warp:'+p.warp) : p.eventId);
      if(id && p.kind!=='reflect' && p.kind!=='color'){
        occAll[id]=(occAll[id]||0)+1;
        if(!seen.has(id)){ seen.add(id); occ[id]=(occ[id]||0)+1; }
        const unlocked = (p.choices||[]).filter(c=>!c.locked).length;
        if(unlocked>=2 || (p.kind==='minor')){
          const arr = samples[id] || (samples[id]=[]);
          // reservoir sampling
          const n = occAll[id];
          if(arr.length < S) arr.push(JSON.stringify(s));
          else { const j = Math.floor(Math.random()*n); if(j<S) arr[j]=JSON.stringify(s); }
        }
      }
      const c = G.Vy(s);
      if(id){ const m = chosen[id]||(chosen[id]={}); const key = c<0?'ignore':String(c); m[key]=(m[key]||0)+1; }
      G.nr(s, data, c, {auto:true}); continue;
    }
    if(s.cursor < s.plan.length){ G.Ry(s, data); continue; }
    G.rm(s, data);
  }
}
console.log('lives',M,'ms',Date.now()-t0, 'events seen', Object.keys(occ).length);
fs.writeFileSync(`sim/collect_${OFF}.json`, JSON.stringify({M, occ, occAll, samples, chosen}));
