import fs from 'fs';
const T = JSON.parse(fs.readFileSync('sim/tables.json','utf8'));
const rows = JSON.parse(fs.readFileSync('sim/report_rows.json','utf8'));
const P = JSON.parse(fs.readFileSync('sim/policy_all.json','utf8'));
const N = JSON.parse(fs.readFileSync('sim/narrative.json','utf8'));
const strip=(s)=>s.replace(/<[^>]+>/g,'');
const pct=(x,d=1)=> x==null? '–' : (x*100).toFixed(d)+'%';
const f1=(x,d=1)=> x==null? '–' : Number(x).toFixed(d);
const sgn=(x,d=1)=> x==null? '–' : (x>0?'+':'')+Number(x).toFixed(d);
const polNames = {default:'기본(게임 자동 선택)', request_decline:'의뢰 항상 거절', request_care:'의뢰 항상 신중', request_bold:'의뢰 항상 정면', request_smart:'의뢰 사망률 기준 선택', no_warp:'워프열차 항상 거절', yes_warp:'워프열차 항상 수락', never_ignore:'사소한 이벤트 무시 안 함', always_ignore_minor:'사소한 이벤트 항상 무시', prefer_fixer:'해결사 진로 선호', prefer_wing:'날개 사원 진로 선호', prefer_finger:'손가락 진로 선호', safe:'정적 사망률 최소 선택'};
const imp = rows.filter(r=>r.spread!=null).map(r=>({...r, imp:r.spread*r.pLife})).sort((a,b)=>b.imp-a.imp);
const deadly=[]; for(const r of rows) for(const o of r.opts) if(o.pDeath+o.pRisk>=0.15) deadly.push({id:r.id,label:o.label,pDeath:o.pDeath,pRisk:o.pRisk,pLife:r.pLife});
deadly.sort((a,b)=>(b.pDeath+b.pRisk)-(a.pDeath+a.pRisk));
let md = `# 도시의 한 사람으로 태어나 — 선택지별 확률·영향력 분석

대상: https://project-moon-life.cityborn.workers.dev/ (Project Moon 세계관 비공식 팬게임, 인생 시뮬레이션)

전체 보고서(검색 가능한 선택지 표 포함)는 \`report.html\` 을 브라우저로 열면 됩니다.

## 방법

1. 사이트의 번들 JS(\`assets/index-*.js\`)를 받아 prettier로 정리한 뒤, 브라우저 전역(document, localStorage 등)을 스텁으로 채워 Node.js에서 그대로 로드했습니다. 게임 엔진 함수(출생 \`wy\`, 연간 계획 \`cl\`, 이벤트 실행 \`Ry\`, 선택 처리 \`nr\`, 연말 정산 \`rm\`, 자동 선택 \`Vy\`)와 데이터(구역 ${T.birth.length}개, 이벤트 ${rows.length + 68}개, 일상 155개, 의뢰 템플릿 ${T.requestTypes.length}개)를 수정 없이 사용했으므로 결과는 실제 게임과 동일한 난수·규칙으로 계산됩니다.
2. **정적 분석**: 모든 선택지의 결과 가중치(w)를 합산해 확률로 바꾸고(사망 결과는 엔진이 0.55배로 깎는 점을 반영), 기대 스탯 변화·즉사 확률·위험(risk) 사망 기대값·직업/플래그 변화를 뽑았습니다.
3. **기준 시뮬레이션**: 게임의 자동 선택 정책(Vy)으로 ${T.M.toLocaleString()}회의 인생을 돌려 이벤트별 발생 확률과, 이벤트가 뜬 순간의 상태를 이벤트당 최대 40개 표집했습니다.
4. **분기(반사실) 시뮬레이션**: 표집한 각 상황에서 고를 수 있던 모든 선택지를 각각 3회 끝까지 돌리고, 같은 상황의 다른 선택지 평균과 비교한 남은 수명·최종 재산·평판 차이를 선택지별로 평균했습니다(약 14만 회).
5. **전략 비교**: 특정 종류의 선택만 고정한 13개 전략을 각 1,500회(같은 시드) 돌렸습니다.

## 핵심 요약

${N.findings.map(x=>'- '+strip(x)).join('\n')}

## 기준 결과 (자동 선택, ${P.default.N.toLocaleString()}회)

| 지표 | 값 |
|---|---|
| 평균 사망 나이 | ${P.default.meanAge}세 (중앙값 ${P.default.medAge}세) |
| 20세 전 사망 | ${pct(P.default.pUnder20)} |
| 60세 이상 생존 | ${pct(P.default.pOver60)} |
| 80세 이상 생존 | ${pct(P.default.pOver80)} |
| 해결사 3급 이상 도달 | ${pct(P.default.pFixerTop3)} |
| 특색 / E.G.O 개화 | ${pct(P.default.pColor)} / ${pct(P.default.pEGO)} |
| 사망 시 평균 재산 / 평판 / 건강 / 정신 | ${P.default.wealth} / ${P.default.rep} / ${P.default.health} / ${P.default.sanity} |

사인: ${Object.entries(P.default.cause).slice(0,8).map(([k,v])=>`${k} ${pct(v)}`).join(', ')}

최종 직업: ${Object.entries(P.default.job).slice(0,8).map(([k,v])=>`${k} ${pct(v)}`).join(', ')}

## 전략 비교 (각 ${P.default.N.toLocaleString()}회, 같은 시드)

| 전략 | 평균 수명 | 중앙값 | 60세+ | 80세+ | 재산 | 평판 | 전투력 | 해결사 3급+ | E.G.O |
|---|---|---|---|---|---|---|---|---|---|
${Object.entries(P).map(([k,v])=>`| ${polNames[k]||k} | ${v.meanAge} | ${v.medAge} | ${pct(v.pOver60)} | ${pct(v.pOver80)} | ${v.wealth} | ${v.rep} | ${v.power} | ${pct(v.pFixerTop3)} | ${pct(v.pEGO)} |`).join('\n')}

${N.notes.map(x=>'- '+strip(x)).join('\n')}

## 출생 확률

| 구역 | 출생 확률 | 기대수명 | 부유/보통/가난 | 시작 건강/정신/재산/인맥 |
|---|---|---|---|---|
${T.birth.map(r=>`| ${r.name}${r.alias?' ('+r.alias+')':''} | ${pct(r.p)} | ${r.lifeExp} | ${pct(r.pRich,0)} / ${pct(r.pNormal,0)} / ${pct(r.pPoor,0)} | ${r.startHealth}/${r.startSanity}/${r.startWealth}/${r.startNetwork} |`).join('\n')}

R사 출생 시 ${pct(T.cloneChanceR,0)}는 부화장 복제 개체(20~30세, 부모 없음)로 시작합니다.

## 해결사 의뢰 확률 (건강 50·인맥 30·무소속 기준)

적정 등급: 9급→뜬소문, 8급→괴담, 7·6급→전설, 5·4급→질병, 3·2급→악몽, 1급→별. 실제 의뢰 등급은 적정 등급에서 −1:18%, 0:45%, +1:25%, +2:9%, +3:3% 이동합니다.

| 해결사 | 의뢰 등급 | 정면 성공/실패/사망 | 신중 성공/실패/사망 | 성공 보수 정면/신중 |
|---|---|---|---|---|
${T.request.filter(r=>r.mode==='bold' && [9,7,5,3,1].includes(r.grade) && r.tier>=r.fit-1 && r.tier<=r.fit+2).map(b=>{const c=T.request.find(r=>r.grade===b.grade&&r.tier===b.tier&&r.mode==='care'); return `| ${b.grade}급 | ${b.tierName}${b.tier===b.fit?' (적정)':''} | ${b.ok}/${b.fail}/${b.tiny?'<1':b.die}% | ${c.ok}/${c.fail}/${c.tiny?'<1':c.die}% | +${b.payOk} / +${c.payOk} |`;}).join('\n')}

## 수명을 가장 크게 가르는 선택 이벤트 (영향력 = 선택지 간 수명 차이 × 발생 확률)

| 이벤트 | 발생 확률 | 수명 차이 | 최선 | 최악 |
|---|---|---|---|---|
${imp.slice(0,25).map(r=>`| \`${r.id}\` | ${pct(r.pLife)} | ${f1(r.spread)}년 | ${r.best} | ${r.opts.filter(o=>o.dRem!=null&&o.pn>=8).reduce((a,o)=>o.dRem<a.dRem?o:a).label} |`).join('\n')}

## 치명적인 선택지 (정적 사망 확률 15% 이상)

| 이벤트 | 선택지 | 즉사 | 위험 사망 기대값 | 발생 확률 |
|---|---|---|---|---|
${deadly.map(d=>`| \`${d.id}\` | ${d.label} | ${pct(d.pDeath)} | ${pct(d.pRisk)} | ${pct(d.pLife)} |`).join('\n')}

## 파일

- \`report.html\` — 전체 보고서. 선택 이벤트 ${rows.length}개·선택지 ${rows.reduce((a,r)=>a+r.opts.length,0)}개의 정적 확률과 분기 시뮬레이션 결과를 검색·정렬할 수 있습니다.
- \`data/static_choices.json\` — 선택지별 결과 확률·효과 (정적).
- \`data/report_rows.json\` — 이벤트별 발생 확률 + 선택지별 분기 시뮬레이션 결과.
- \`data/tables.json\` — 출생·의뢰·워프열차·발생 빈도·연간 사망 위험 표.
- \`data/policy_all.json\` — 전략 비교 결과.
- \`scripts/\` — 재현용 스크립트. 번들을 \`site/\`에 받아 \`build_harness.mjs\` → \`collect.mjs\` → \`merge.mjs\` → \`branch.mjs\` → \`static.mjs\` → \`tables.mjs\` → \`policy.mjs\` → \`report.mjs\` → \`html.mjs\` 순으로 실행합니다. 게임 번들 자체는 저작권상 포함하지 않았습니다.
`;
fs.writeFileSync('README.md', md); console.log('readme bytes', md.length);
