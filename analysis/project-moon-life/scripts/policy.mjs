// Compare global strategies over N lives each.
import * as G from './harness.mjs';
import fs from 'fs';
const data = G.St();
const N = parseInt(process.argv[2]||'1500'); const which = process.argv[3]||'all';
function labelOf(s, idx){ const c=s.prompt.choices[idx]; return c?c.label:''; }
function findLabel(s, re){ const i = s.prompt.choices.findIndex(c=>!c.locked && re.test(c.label)); return i; }
const policies = {
  default: (s)=>G.Vy(s),
  request_decline: (s)=> s.prompt.req ? 2 : G.Vy(s),
  request_care: (s)=> s.prompt.req ? 1 : G.Vy(s),
  request_bold: (s)=> s.prompt.req ? 0 : G.Vy(s),
  request_smart: (s)=> { if(!s.prompt.req) return G.Vy(s); const {dBold,dCare}=s.prompt.req; if(dCare>0.05) return 2; return dBold<0.02?0:1; },
  no_warp: (s)=> /^wt_enter_/.test(s.prompt.eventId||'') ? 1 : G.Vy(s),
  yes_warp: (s)=> /^wt_enter_/.test(s.prompt.eventId||'') ? 0 : G.Vy(s),
  never_ignore: (s)=> { const v=G.Vy(s); if(v<0 && s.prompt.kind==='minor'){ const a=s.prompt.choices.map((c,i)=>c.locked?-1:i).filter(i=>i>=0); return a.length? a[Math.floor(G.xe(s).next()*a.length)] : -1;} return v; },
  always_ignore_minor: (s)=> s.prompt.kind==='minor' ? -1 : G.Vy(s),
  prefer_fixer: (s)=> { const i=findLabel(s,/해결사|사무소|휘장|협회 시험/); return i>=0 && s.prompt.kind==='major' ? i : G.Vy(s); },
  prefer_wing: (s)=> { const i=findLabel(s,/날개|사원|정규/); return i>=0 && s.prompt.kind==='major' ? i : G.Vy(s); },
  prefer_finger: (s)=> { const i=findLabel(s,/손가락|엄지|검지|중지|약지|조직/); return i>=0 && s.prompt.kind==='major' ? i : G.Vy(s); },
  safe: (s)=> { // choose the choice whose static death prob is lowest; tie -> Vy
    if(s.prompt.req){ const {dBold,dCare}=s.prompt.req; return dCare>0.03?2:1; }
    if(/^wt_enter_/.test(s.prompt.eventId||'')) return 1;
    const ev = G.ne(data, s.prompt.eventId); if(!ev||!ev.choices) return G.Vy(s);
    let best=-1, bestD=1e9;
    s.prompt.choices.forEach((c,pos)=>{ if(c.locked) return; const ch=ev.choices[c.i]; let d=0; if(ch.outcomes){ let tot=0, dw=0; for(const o of ch.outcomes){ let w=(o.w??1)*(o.death?0.55:1); tot+=w; if(o.death) dw+=w; if(o.risk) dw+=w*Object.values(o.risk).reduce((a,b)=>a+b,0)*0.55; } d = tot? dw/tot:0; } else { if(ch.death) d=1; if(ch.risk) d=Object.values(ch.risk).reduce((a,b)=>a+b,0)*0.55; } if(d<bestD){bestD=d;best=pos;} });
    return best;
  },
};
const names = which==='all'? Object.keys(policies) : which.split(',');
const res = {};
for(const name of names){
  const pol = policies[name]; const rows=[]; const t0=Date.now();
  for(let i=0;i<N;i++){
    const s = G.wy(data, { seed: String(9000000+i), name:'T', gender:(i%2)?'m':'f' });
    let guard=0;
    while(!s.dead && guard++<100000){
      if(s.prompt){ G.nr(s, data, pol(s), {auto:true}); continue; }
      if(s.cursor<s.plan.length){ G.Ry(s, data); continue; }
      G.rm(s, data);
    }
    rows.push({age:s.dead.age, cause:s.dead.cause, stats:s.stats, power:G.Wa(s), job:s.job, grade:s.grade, finger:s.finger, work:s.work, rare:s.flags.filter(f=>['E.G.O개화','특색','유물','혈귀'].includes(f)), region:s.regionId});
  }
  const mean=(f)=>rows.reduce((a,r)=>a+f(r),0)/rows.length;
  const cnt=(f)=>{const m={};for(const r of rows){const k=f(r);m[k]=(m[k]||0)+1;}return Object.fromEntries(Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,+(v/rows.length).toFixed(3)]));};
  res[name] = {N, meanAge:+mean(r=>r.age).toFixed(1), medAge: rows.map(r=>r.age).sort((a,b)=>a-b)[Math.floor(N/2)], pUnder20:+mean(r=>r.age<20).toFixed(3), pOver60:+mean(r=>r.age>=60).toFixed(3), pOver80:+mean(r=>r.age>=80).toFixed(3), wealth:+mean(r=>r.stats.wealth).toFixed(1), rep:+mean(r=>r.stats.rep).toFixed(1), health:+mean(r=>r.stats.health).toFixed(1), sanity:+mean(r=>r.stats.sanity).toFixed(1), network:+mean(r=>r.stats.network).toFixed(1), power:+mean(r=>r.power).toFixed(2), pFixerTop3:+mean(r=>r.job==='해결사'&&r.grade<=3).toFixed(3), pColor:+mean(r=>r.rare.includes('특색')).toFixed(3), pEGO:+mean(r=>r.rare.includes('E.G.O개화')).toFixed(3), job:cnt(r=>r.work||r.job||'무직'), cause:cnt(r=>r.cause), ms:Date.now()-t0};
  console.log(name, JSON.stringify(res[name]));
}
fs.writeFileSync(`sim/policy_${which.replace(/[^a-z_]/g,'')||'all'}.json`, JSON.stringify(res,null,1));
