// Static per-choice probability/effect extraction from event data.
import * as G from './harness.mjs';
import fs from 'fs';
const data = G.St();
const FL = G.fl; // death outcome weight multiplier (0.55)
const STATS = ['health','sanity','wealth','network','rep'];
function outcomeTable(choice){
  // returns [{p, effects, death, risk, flagsAdd, job, ...}] with base probabilities (no conditional multipliers), plus notes on conditional multipliers
  if(!choice.outcomes) return [{p:1, ...choice}];
  const rows = choice.outcomes.map(o=>{
    let w = o.w ?? 1;
    if(o.death) w *= FL;
    const cond = [];
    for(const x of o.wIf||[]) cond.push(`플래그 ${x.flag}: ×${x.mult}`);
    for(const x of o.wStat||[]) cond.push(`${x.stat}${x.min!=null?'≥'+x.min:''}${x.max!=null?'≤'+x.max:''}: ×${x.mult}`);
    for(const x of o.wPower||[]) cond.push(`전투력${x.min!=null?'≥'+x.min:''}${x.max!=null?'≤'+x.max:''}: ×${x.mult}`);
    if(o.gradeUp) cond.push('승급 가중치(등급·장비 의존)');
    if(o.fingerUp) cond.push('손가락 승진 가중치(계급 의존)');
    if(o.wingUp) cond.push('날개 승진 가중치(계급 의존)');
    if(o.hatch) cond.push('부화장 부상 누적 의존');
    if(o.exact) cond.push('조건 정확 일치');
    return {w, o, cond};
  });
  const tot = rows.reduce((a,r)=>a+r.w,0);
  return rows.map(r=>({p: tot>0? r.w/tot : 0, ...r.o, cond:r.cond}));
}
function summarizeChoice(c){
  const outs = outcomeTable(c);
  const exp = {}; for(const s of STATS) exp[s]=0;
  let pDeath=0, pRisk=0; const deaths={}, flags=new Set(), jobs=new Set(), extra=new Set();
  for(const o of outs){
    for(const s of STATS) exp[s] += (o.effects?.[s]||0)*o.p;
    if(o.death){ pDeath += o.p; deaths[o.death]=(deaths[o.death]||0)+o.p; }
    if(o.risk){ for(const [k,v] of Object.entries(o.risk)){ pRisk += o.p*v*FL; deaths[k+'(risk)']=(deaths[k+'(risk)']||0)+o.p*v*FL; } }
    for(const f of o.flagsAdd||[]) flags.add(f);
    for(const f of o.flagsRemove||[]) flags.add('-'+f);
    if(o.job) jobs.add(o.work? `${o.job}:${o.work}` : o.job);
    if(o.joinFinger) jobs.add('손가락:'+o.joinFinger);
    if(o.clearJob) jobs.add('퇴직');
    if(o.gradeUp) extra.add('해결사 승급+'+o.gradeUp);
    if(o.fingerUp) extra.add('손가락 승진+'+o.fingerUp);
    if(o.wingUp) extra.add('날개 승진+'+o.wingUp);
    if(o.prosthetic) extra.add('의체+'+o.prosthetic);
    if(o.joinOffer) extra.add('조직 가입');
    if(o.leaveOrg) extra.add('조직 탈퇴');
    if(o.bfTurn) extra.add('혈귀 전환:'+o.bfTurn);
    if(o.warpStart) extra.add('워프열차 탑승');
    if(o.next) extra.add('후속 이벤트:'+[].concat(o.next).join('/'));
    if(typeof o.thirst==='number') extra.add('갈증'+(o.thirst>0?'+':'')+o.thirst);
    if(o.bite) extra.add('흡혈');
  }
  return {label:c.label, needs:c.needs||null, requires:c.requires||null, forbids:c.forbids||null, jobs:c.jobs||null, notJobs:c.notJobs||null, power:c.power||null, dream:c.dream||null,
    nOutcomes: outs.length, outcomes: outs.map(o=>({p:+o.p.toFixed(3), text:o.text, effects:o.effects||{}, death:o.death||null, risk:o.risk||null, flagsAdd:o.flagsAdd||null, job:o.job||null, work:o.work||null, cond:o.cond&&o.cond.length?o.cond:null})),
    exp: Object.fromEntries(STATS.map(s=>[s,+exp[s].toFixed(2)])), pDeath:+pDeath.toFixed(4), pRisk:+pRisk.toFixed(4), deaths, flags:[...flags], jobs:[...jobs], extra:[...extra]};
}
function condSummary(e){
  const c=[];
  if(e.age) c.push(`나이 ${e.age[0]}~${e.age[1]}`);
  if(e.ageEvery) c.push(`${e.ageEvery[0]}세부터 ${e.ageEvery[1]}년마다`);
  if(e.regions) c.push('구역:'+e.regions.join('/'));
  if(e.notRegions) c.push('구역제외:'+e.notRegions.join('/'));
  if(e.jobs) c.push('직업:'+e.jobs.join('/'));
  if(e.notJobs) c.push('직업제외:'+e.notJobs.join('/'));
  if(e.noJob) c.push('무직');
  if(e.requires) c.push('필요플래그:'+e.requires.join('/'));
  if(e.forbids) c.push('금지플래그:'+e.forbids.join('/'));
  if(e.needs) c.push('스탯:'+Object.entries(e.needs).map(([k,v])=>`${k} ${v[0]}~${v[1]}`).join(','));
  if(e.rneeds) c.push('구역스탯:'+Object.entries(e.rneeds).map(([k,v])=>`${k} ${v[0]}~${v[1]}`).join(','));
  if(e.grade) c.push(`해결사 등급 ${e.grade[0]}~${e.grade[1]}`);
  if(e.finger) c.push('손가락:'+[].concat(e.finger).join('/'));
  if(e.fingerRank) c.push(`손가락 계급 ${e.fingerRank[0]}~${e.fingerRank[1]}`);
  if(e.wingRank) c.push(`날개 계급 ${e.wingRank[0]}~${e.wingRank[1]}`);
  if(e.branch) c.push('지부:'+e.branch.join('/'));
  if(e.org) c.push('조직:'+e.org);
  if(e.orgName) c.push('조직명:'+e.orgName.join('/'));
  if(e.power) c.push(`전투력 ${e.power[0]}~${e.power[1]}`);
  if(e.presence) c.push(`존재감 ${e.presence[0]}~${e.presence[1]}`);
  if(e.ego) c.push('E.G.O 후보');
  if(e.bf) c.push('혈귀:'+e.bf);
  if(e.everJob) c.push('경력:'+e.everJob.join('/'));
  if(e.neverJob) c.push('경력없음:'+e.neverJob.join('/'));
  if(e.cooldown) c.push(`쿨다운 ${e.cooldown}년`);
  if(!e.repeat) c.push('1회성');
  if(e.must) c.push('필수');
  if(e.force) c.push('강제('+e.forceGroup+')');
  if(e.major) c.push('주요');
  if(e.rare) c.push('희귀');
  if(e.chance!=null) c.push(`발생확률 ${e.chance}`+(e.bias?` (bias ${e.bias})`:''));
  else c.push(`가중치 ${e.weight??1}`+(e.bias?` (bias ${e.bias})`:''));
  if(e.manual) c.push('수동(엔진 직접 호출)');
  return c;
}
const out=[];
for(const e of data.events){
  if(!Array.isArray(e.choices)||!e.choices.length) continue;
  const row = {id:e.id, text:e.text, major:!!e.major, cond:condSummary(e), age:e.age||null, choices:e.choices.map(summarizeChoice)};
  if(e.ignore) row.ignore = summarizeChoice({label: e.ignoreLabel||'흘려보낸다', ...e.ignore});
  out.push(row);
}
fs.writeFileSync('sim/static_choices.json', JSON.stringify(out, null, 1));
console.log('events with choices', out.length, 'choices', out.reduce((a,e)=>a+e.choices.length,0));
// death-bearing choices
const deadly = [];
for(const e of out) for(const c of e.choices) if(c.pDeath>0||c.pRisk>0) deadly.push({ev:e.id, label:c.label, pDeath:c.pDeath, pRisk:c.pRisk, deaths:c.deaths});
deadly.sort((a,b)=>(b.pDeath+b.pRisk)-(a.pDeath+a.pRisk));
console.log('deadly choices', deadly.length);
console.log(deadly.slice(0,40).map(d=>`${d.ev} | ${d.label} | 즉사 ${(d.pDeath*100).toFixed(1)}% + 위험 ${(d.pRisk*100).toFixed(1)}% ${JSON.stringify(d.deaths)}`).join('\n'));
