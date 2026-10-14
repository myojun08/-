import * as G from './harness.mjs';
import fs from 'fs';
const data = G.St();
const out = {};
// 1. Birth region probabilities
const tw = data.regions.reduce((a,r)=>a+r.birthWeight,0);
out.birth = data.regions.map(r=>{
  const pr = r.birthWeight/tw;
  const pRich = 0.05 + r.wealth*0.03, pPoor = 0.05 + (10-r.wealth)*0.05;
  return {id:r.id, name:r.name, alias:r.alias, ward:r.ward, p:+pr.toFixed(4), lifeExp:r.lifeExp, avgLife:r.avgLife, safety:r.safety, wealth:r.wealth, medical:r.medical, orgPressure:r.orgPressure, fantasm:r.fantasm, pollution:r.pollution, orphanRate:r.orphanRate, infantMort:r.infantMort, childMort:r.childMort, adultRisk:r.adultRisk, pRich:+pRich.toFixed(3), pPoor:+pPoor.toFixed(3), pNormal:+(1-pRich-pPoor).toFixed(3), tags:r.tags,
    startHealth: 40 + r.medical*3, startSanity: 45 + r.safety*3, startWealth: r.wealth*9, startNetwork: 15 + r.orgPressure };
});
out.cloneChanceR = G.oy; out.bloodBirthP = G.Vt.birthP;
// 2. Request odds table: death prob and success prob by grade/tier/mode for a typical state
function mk(grade, flags=[], health=50, network=30, org=null){ return {grade, flags, stats:{health, network, rep:30}, org, job:'해결사'}; }
out.request = [];
for(let grade=9; grade>=1; grade--){
  const e = mk(grade);
  const fit = G.Ac(e);
  for(let tier=0; tier<6; tier++){
    for(const mode of ['bold','care']){
      const d = G.$h(e, tier, mode), s = G.as(e, tier, mode);
      const odds = G.Bh(d, s);
      out.request.push({grade, fit, tier, tierName:data.orgs.tiers[tier], mode, pDeath:+d.toFixed(4), pSuccessGivenAlive:+s.toFixed(3), ok:odds.ok, fail:odds.fail, die:odds.die, payOk: Math.round(G.jy[tier]*(mode==='bold'?1.5:0.7)*0.85), repOk: Math.round(G.Ay[tier]*(mode==='bold'?1.3:0.8)), merit: G._y(e, tier, mode), meritNeed: G.oo(e)});
    }
  }
}
// tier offset distribution relative to fit: [-1:18, 0:45, +1:25, +2:9, +3:3]
out.requestTierOffset = {'-1':18/100, '0':45/100, '+1':25/100, '+2':9/100, '+3':3/100, assocExtra:'협회 소속 시 35% 확률로 +1'};
out.requestFreq = '해결사 16세+: 매년 85% 확률로 의뢰 1건, 조직 소속이면 추가 45% 확률로 1건 더';
out.requestTypes = data.requests.map(r=>({id:r.id, type:r.type, tiers:r.tiers, cause:r.cause, org:r.org||null, bite:!!r.bite}));
// 3. Warp train
out.warp = { cars: [
 {car:1,E:3,kind:'person'},{car:2,E:4.5,kind:'person'},{car:3,E:5.5,kind:'person'},{car:4,E:6,kind:'person',failMindX2:true},{car:5,E:7,kind:'thing',jit:2},{car:6,E:7.5,kind:'person'},{car:7,E:8.5,kind:'thing',mindHalf:true},{car:8,E:11.5,kind:'person',noRed:true}],
 cpFormula: '해결사: 10-등급 / 손가락: 계급별 [3,5,8,10] 또는 [3,6,9] / 흑수 5~8.5 / T사 징수직 2~9.5 / W사 2~9 / R사 4무리 5~9; 특색+1, E.G.O+2, 유물+1, 혈귀+1, 강화시술·전투의체·고급장비 각+0.5, 좋은의체+0.25, 65세+ -2(55세+ -1), 건강<30 -1',
 result: 'x = cp + 보너스 - (E - 누적실패 - 연결보정 ± 지터). x≥1 대승(체력-3), x≥0 승(-8), x≥-1.5 버팀(-15, 정신-6), 그 아래 패배(-25, 정신-8). 체력/정신 0이면 하차',
 enterChance: '25세부터 매년 0.005+(나이-25)*0.006, 50세+ 100% (한 번만)',
 autoPolicy: '게임 자동모드는 열차 제안 80% 수락'
};
// 4. Event occurrence frequency (from 12000 simulated lives)
const st = JSON.parse(fs.readFileSync('sim/stats_merged.json','utf8'));
out.M = st.M;
out.occ = Object.entries(st.occ).map(([id,n])=>({id, pLife:+(n/st.M).toFixed(4), perLife:+((st.occAll[id]||0)/st.M).toFixed(3), chosen: st.chosen[id]||null})).sort((a,b)=>b.perLife-a.perLife);
// 5. yearly death model: base hazard per region at various ages (healthy 50 wealth 30)
out.yearlyHazard = data.regions.map(r=>{
  const row={id:r.id, name:r.name};
  for(const age of [0,5,20,40,60,80,100]){ const e={age, stats:{health:50,wealth:30,sanity:50}, flags:[], bf:null}; row['age'+age]=+G.em(e,r).toFixed(4); }
  return row;
});
out.causeWeights = (()=>{ const r=data.regions.find(x=>x.id==='D'); const rows={}; for(const age of [2,15,30,50,70]){ rows['age'+age]=G.Cw({age, stats:{health:50,wealth:30,sanity:50}, flags:[], job:null, work:null}, r, 0);} return rows; })();
fs.writeFileSync('sim/tables.json', JSON.stringify(out,null,1));
console.log('birth', out.birth.slice(0,3)); console.log(out.request.filter(r=>r.grade===9&&r.tier<=2)); console.log(out.occ.slice(0,30)); console.log(out.yearlyHazard.slice(0,3)); console.log(out.causeWeights);
