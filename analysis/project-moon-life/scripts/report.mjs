import fs from 'fs';
const T = JSON.parse(fs.readFileSync('sim/tables.json','utf8'));
const S = JSON.parse(fs.readFileSync('sim/static_choices.json','utf8'));
const EV = Object.fromEntries(JSON.parse(fs.readFileSync('sim/data_events.json','utf8')).map(e=>[e.id,e]));
const B = {}; for(const f of fs.readdirSync('sim').filter(f=>/^branch_\d\.json$/.test(f))) Object.assign(B, JSON.parse(fs.readFileSync('sim/'+f,'utf8')));
const P = fs.existsSync('sim/policy_all.json') ? JSON.parse(fs.readFileSync('sim/policy_all.json','utf8')) : {};
const occ = Object.fromEntries(T.occ.map(o=>[o.id,o]));
const STATS=['health','sanity','wealth','network','rep'];
const KO={health:'건강',sanity:'정신력',wealth:'재산',network:'인맥',rep:'평판'};
// ---- per-event influence rows
const rows=[];
for(const e of S){
  const b = B[e.id]; const o = occ[e.id];
  const opts = [];
  const bOpts = b? b.options : {};
  // event-level mean remaining years (weighted by n)
  let totN=0, totRem=0; for(const a of Object.values(bOpts)){ totN+=a.n; totRem+=a.rem; }
  const evMean = totN? totRem/totN : null;
  e.choices.forEach((c,idx)=>{
    const a = bOpts[String(idx)];
    opts.push({idx, label:c.label, needs:c.needs, dream:c.dream, pDeath:c.pDeath, pRisk:c.pRisk, exp:c.exp, flags:c.flags, jobs:c.jobs, extra:c.extra, outcomes:c.outcomes,
      n:a?a.n:0, rem:a? a.rem/a.n : null, medRem:a?a.medRem:null, d1:a? a.d1/a.n : null, d5:a? a.d5/a.n : null,
      fin: a? Object.fromEntries(STATS.map(s=>[s, a[s]/a.n])) : null, power:a? a.power/a.n : null, rare:a? a.rare/a.n : null, pn:a?a.pn||0:0, dRem:a&&a.pn? a.d_rem/a.pn : null, dWealth:a&&a.pn? a.d_wealth/a.pn : null, dRep:a&&a.pn? a.d_rep/a.pn : null, dHealth:a&&a.pn? a.d_health/a.pn : null, dD5:a&&a.pn? a.d_d5/a.pn : null});
  });
  if(e.ignore){ const a=bOpts['ignore']; opts.push({idx:'ignore', label:e.ignore.label, pDeath:e.ignore.pDeath, pRisk:e.ignore.pRisk, exp:e.ignore.exp, flags:e.ignore.flags, jobs:e.ignore.jobs, extra:e.ignore.extra, outcomes:e.ignore.outcomes, n:a?a.n:0, rem:a?a.rem/a.n:null, medRem:a?a.medRem:null, d1:a?a.d1/a.n:null, d5:a?a.d5/a.n:null, fin:a?Object.fromEntries(STATS.map(s=>[s,a[s]/a.n])):null, power:a?a.power/a.n:null, rare:a?a.rare/a.n:null, pn:a?a.pn||0:0, dRem:a&&a.pn?a.d_rem/a.pn:null, dWealth:a&&a.pn?a.d_wealth/a.pn:null, dRep:a&&a.pn?a.d_rep/a.pn:null, dHealth:a&&a.pn?a.d_health/a.pn:null, dD5:a&&a.pn?a.d_d5/a.pn:null}); }
  else if(bOpts['ignore']){ const a=bOpts['ignore']; opts.push({idx:'ignore', label:'흘려보낸다', pDeath:0,pRisk:0, exp:{}, flags:[], jobs:[], extra:[], outcomes:[], n:a.n, rem:a.rem/a.n, medRem:a.medRem, d1:a.d1/a.n, d5:a.d5/a.n, fin:Object.fromEntries(STATS.map(s=>[s,a[s]/a.n])), power:a.power/a.n, rare:a.rare/a.n, pn:a.pn||0, dRem:a.pn?a.d_rem/a.pn:null, dWealth:a.pn?a.d_wealth/a.pn:null, dRep:a.pn?a.d_rep/a.pn:null, dHealth:a.pn?a.d_health/a.pn:null, dD5:a.pn?a.d_d5/a.pn:null}); }
  const withSim = opts.filter(x=>x.dRem!=null && x.pn>=8);
  const spread = withSim.length>=2 ? Math.max(...withSim.map(x=>x.dRem)) - Math.min(...withSim.map(x=>x.dRem)) : null;
  const wSpread = withSim.length>=2 ? Math.max(...withSim.map(x=>x.dWealth)) - Math.min(...withSim.map(x=>x.dWealth)) : null;
  const best = withSim.length? withSim.reduce((a,x)=>x.dRem>a.dRem?x:a) : null;
  rows.push({id:e.id, text:e.text, major:e.major, cond:e.cond, age:e.age, pLife:o?o.pLife:0, perLife:o?o.perLife:0, chosen:o?o.chosen:null, evMean, spread, wSpread, best: best?best.label:null, opts, nStates: b?b.nStates:0});
}
fs.writeFileSync('sim/report_rows.json', JSON.stringify(rows));
const fmt=(x,d=1)=> x==null? '–' : (typeof x==='number'? x.toFixed(d) : x);
const pct=(x,d=1)=> x==null? '–' : (x*100).toFixed(d)+'%';
const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
console.log('rows', rows.length, 'with sim', rows.filter(r=>r.spread!=null).length);
// importance = spread * pLife
const imp = rows.filter(r=>r.spread!=null).map(r=>({...r, imp: r.spread*r.pLife})).sort((a,b)=>b.imp-a.imp);
console.log('TOP IMPORTANCE');
for(const r of imp.slice(0,25)) console.log(r.id, 'pLife', pct(r.pLife), 'spread', fmt(r.spread), 'imp', fmt(r.imp,2), '| best:', r.best, '|', r.opts.map(o=>`${o.label}:Δ${fmt(o.dRem)}y(n${o.pn})/d1 ${pct(o.d1)}/ΔW${fmt(o.dWealth,0)}`).join(' ; '));
export {};
