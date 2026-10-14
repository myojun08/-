// Counterfactual branching: for each sampled prompt state, try each option and simulate to death.
import * as G from './harness.mjs';
import fs from 'fs';
const data = G.St();
const W = parseInt(process.argv[2]||'0'), NW = parseInt(process.argv[3]||'1'), K = parseInt(process.argv[4]||'3');
const samples = JSON.parse(fs.readFileSync('sim/samples_merged.json','utf8'));
const ids = Object.keys(samples).sort().filter((_,i)=>i%NW===W);
function continueLife(s){
  let guard=0;
  while(!s.dead && guard++ < 100000){
    if(s.prompt){ G.nr(s, data, G.Vy(s), {auto:true}); continue; }
    if(s.cursor < s.plan.length){ G.Ry(s, data); continue; }
    G.rm(s, data);
  }
  return s;
}
const results = {};
const t0=Date.now();
let sims=0;
for(const id of ids){
  const states = samples[id];
  const agg = {}; // optionKey -> accumulators
  for(const st0 of states){
    const p = st0.prompt;
    const opts = [];
    (p.choices||[]).forEach((c,pos)=>{ if(!c.locked) opts.push({key: String(c.i ?? pos), pos, label:c.label}); });
    if(p.kind==='minor') opts.push({key:'ignore', pos:-1, label: p.ignoreLabel||'흘려보낸다'});
    if(opts.length<2) continue;
    const per = {}; // option -> {rem:[], wealth:[], rep:[], d5:[]}
    for(const o of opts){
      for(let k=0;k<K;k++){
        const s = structuredClone(st0);
        s.rngState = (s.rngState + 2654435761*k) >>> 0;
        const age0 = s.age;
        const w0 = s.stats.wealth;
        try { G.nr(s, data, o.pos, {auto:true}); continueLife(s); } catch(err){ console.error('ERR', id, o.key, err.message); continue; }
        sims++;
        const a = agg[o.key] || (agg[o.key]={label:o.label, n:0, rem:0, d1:0, d5:0, health:0, sanity:0, wealth:0, network:0, rep:0, power:0, rare:0, ages:[]});
        const rem = s.dead.age - age0;
        a.n++; a.rem+=rem; a.ages.push(rem); if(rem<=1) a.d1++; if(rem<=5) a.d5++;
        for(const st of ['health','sanity','wealth','network','rep']) a[st]+=s.stats[st];
        a.power += G.Wa(s);
        if(s.flags.some(f=>['E.G.O개화','특색','유물'].includes(f))) a.rare++;
        const pp = per[o.key] || (per[o.key]={rem:0,wealth:0,rep:0,health:0,d5:0,n:0}); pp.n++; pp.rem+=rem; pp.wealth+=s.stats.wealth; pp.rep+=s.stats.rep; pp.health+=s.stats.health; if(rem<=5) pp.d5++;
      }
    }
    // paired deltas: option mean minus mean over all options evaluated in this state
    const keys = Object.keys(per).filter(k=>per[k].n>0); if(keys.length<2) continue;
    const m = {rem:0,wealth:0,rep:0,health:0,d5:0}; for(const k of keys) for(const f of Object.keys(m)) m[f]+=per[k][f]/per[k].n; for(const f of Object.keys(m)) m[f]/=keys.length;
    for(const k of keys){ const a=agg[k]; a.pn=(a.pn||0)+1; for(const f of Object.keys(m)){ a['d_'+f]=(a['d_'+f]||0)+(per[k][f]/per[k].n - m[f]); } }
  }
  for(const a of Object.values(agg)){ a.ages.sort((x,y)=>x-y); a.medRem = a.ages[Math.floor(a.ages.length/2)]; delete a.ages; }
  results[id] = {nStates: states.length, promptKind: states[0].prompt.kind, options: agg};
}
fs.writeFileSync(`sim/branch_${W}.json`, JSON.stringify(results));
console.log('worker',W,'events',ids.length,'sims',sims,'ms',Date.now()-t0);
