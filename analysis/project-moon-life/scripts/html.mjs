import fs from 'fs';
const T = JSON.parse(fs.readFileSync('sim/tables.json','utf8'));
const rows = JSON.parse(fs.readFileSync('sim/report_rows.json','utf8'));
const P = fs.existsSync('sim/policy_all.json') ? JSON.parse(fs.readFileSync('sim/policy_all.json','utf8')) : {};
const NARR = fs.existsSync('sim/narrative.json') ? JSON.parse(fs.readFileSync('sim/narrative.json','utf8')) : {findings:[], notes:[]};
const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const f1=(x,d=1)=> x==null||Number.isNaN(x)? '–' : Number(x).toFixed(d);
const pct=(x,d=1)=> x==null||Number.isNaN(x)? '–' : (x*100).toFixed(d)+'%';
const sgn=(x,d=1)=> x==null? '–' : (x>0?'+':'')+Number(x).toFixed(d);
const KO={health:'건강',sanity:'정신',wealth:'재산',network:'인맥',rep:'평판'};
const birth = T.birth.slice().sort((a,b)=>b.p-a.p);
// ---------- compact data for client
const evData = rows.map(r=>({id:r.id, text:r.text, major:r.major, cond:r.cond, pLife:r.pLife, perLife:r.perLife, evMean:r.evMean, spread:r.spread, wSpread:r.wSpread, best:r.best, nStates:r.nStates,
  opts: r.opts.map(o=>({label:o.label, idx:o.idx, needs:o.needs, dream:o.dream, pDeath:o.pDeath, pRisk:o.pRisk, exp:o.exp, flags:o.flags, jobs:o.jobs, extra:o.extra, n:o.n, rem:o.rem, d1:o.d1, d5:o.d5, fin:o.fin, power:o.power, rare:o.rare, pn:o.pn, dRem:o.dRem, dWealth:o.dWealth, dRep:o.dRep, dHealth:o.dHealth, dD5:o.dD5,
    outcomes:(o.outcomes||[]).map(x=>({p:x.p, text:x.text, effects:x.effects, death:x.death, risk:x.risk, flagsAdd:x.flagsAdd, job:x.job, work:x.work, cond:x.cond}))}))}));
const imp = rows.filter(r=>r.spread!=null).map(r=>({id:r.id, pLife:r.pLife, spread:r.spread, imp:r.spread*r.pLife, best:r.best, worst: r.opts.filter(o=>o.dRem!=null&&o.pn>=8).reduce((a,o)=>o.dRem<a.dRem?o:a).label, text:r.text, major:r.major})).sort((a,b)=>b.imp-a.imp);
const deadly = []; for(const r of rows) for(const o of r.opts) if(o.pDeath+o.pRisk>0.03) deadly.push({id:r.id, label:o.label, pDeath:o.pDeath, pRisk:o.pRisk, pLife:r.pLife, d1:o.d1, text:r.text});
deadly.sort((a,b)=>(b.pDeath+b.pRisk)-(a.pDeath+a.pRisk));
const reqG = {}; for(const r of T.request){ (reqG[r.grade] ||= []).push(r); }
const polNames = {default:'기본(게임 자동 선택)', request_decline:'의뢰 항상 거절', request_care:'의뢰 항상 신중', request_bold:'의뢰 항상 정면', request_smart:'의뢰 사망률 기준 선택', no_warp:'워프열차 항상 거절', yes_warp:'워프열차 항상 수락', never_ignore:'사소한 이벤트 무시 안 함', always_ignore_minor:'사소한 이벤트 항상 무시', prefer_fixer:'해결사 진로 선호', prefer_wing:'날개 사원 진로 선호', prefer_finger:'손가락 진로 선호', safe:'정적 사망률 최소 선택'};
const occTop = T.occ.slice(0,40);
const html = `<title>도시 인생 선택지 분석</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* layout: single column dossier, 1040px max, sticky section nav, data tables in scroll wrappers */
:root{ --bg:#f3f1ec; --bg2:#e9e5dc; --fg:#1d1b17; --mute:#5f5a50; --line:#cfc8ba; --acc:#8a2d1e; --acc2:#2e5a4a; --warn:#b4541a; --good:#2e6b3f; --bad:#9e1f1f; --card:#fbfaf7;
 --fd:"Noto Serif KR","Apple SD Gothic Neo",serif; --fb:"Noto Sans KR","Apple SD Gothic Neo",system-ui,sans-serif; --fm:"IBM Plex Mono",ui-monospace,Menlo,monospace; }
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#15161a; --bg2:#1e2026; --fg:#e8e4da; --mute:#a39d90; --line:#3a3d46; --acc:#e07b63; --acc2:#7fc2a6; --warn:#e5934a; --good:#7fcf92; --bad:#ef7373; --card:#1b1d22; color-scheme:dark } }
:root[data-theme="dark"]{ --bg:#15161a; --bg2:#1e2026; --fg:#e8e4da; --mute:#a39d90; --line:#3a3d46; --acc:#e07b63; --acc2:#7fc2a6; --warn:#e5934a; --good:#7fcf92; --bad:#ef7373; --card:#1b1d22; color-scheme:dark }
body{background:var(--bg);color:var(--fg);font-family:var(--fb);font-size:15px;line-height:1.6}
.wrap{max-width:1040px;margin:0 auto;padding-inline:16px;padding-block:24px 64px}
h1{font-family:var(--fd);font-size:clamp(28px,5vw,42px);line-height:1.15;margin:0 0 8px;text-wrap:balance}
h2{font-family:var(--fd);font-size:22px;margin:48px 0 12px;padding-top:12px;border-top:2px solid var(--acc);text-wrap:balance}
h3{font-size:16px;margin:24px 0 8px}
p{max-width:72ch}
.eyebrow{font-family:var(--fm);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--acc)}
.lead{color:var(--mute);max-width:72ch}
nav.toc{position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);border-bottom:1px solid var(--line);padding:8px 0;margin:16px 0 8px;z-index:5;display:flex;gap:4px 14px;flex-wrap:wrap;font-size:13px}
nav.toc a{color:var(--mute);text-decoration:none}
nav.toc a:hover,nav.toc a:focus{color:var(--acc)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:12px 0}
.tile{background:var(--card);border:1px solid var(--line);padding:12px 14px;min-width:0}
.tile .k{font-size:12px;color:var(--mute)}
.tile .v{font-family:var(--fm);font-size:24px;font-variant-numeric:tabular-nums}
.tile .s{font-size:12px;color:var(--mute)}
.tw{overflow-x:auto;border:1px solid var(--line);background:var(--card);margin:8px 0}
table{border-collapse:collapse;width:100%;font-size:13px;font-variant-numeric:tabular-nums}
th,td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{background:var(--bg2);font-weight:500;white-space:nowrap;position:sticky;top:0}
td.n,th.n{text-align:right;font-family:var(--fm);white-space:nowrap}
tr:last-child td{border-bottom:0}
.pos{color:var(--good)} .neg{color:var(--bad)} .mid{color:var(--mute)}
.bar{display:inline-block;height:8px;background:var(--acc2);vertical-align:middle;margin-right:6px}
.bar.bad{background:var(--bad)}
.tag{display:inline-block;font-family:var(--fm);font-size:11px;padding:1px 6px;border:1px solid var(--line);border-radius:3px;margin:1px 2px 1px 0;color:var(--mute)}
.tag.major{border-color:var(--acc);color:var(--acc)}
ul.find{padding-left:1.2em;max-width:80ch} ul.find li{margin:6px 0}
ul.find b{font-weight:700}
details{border:1px solid var(--line);background:var(--card);margin:8px 0}
summary{cursor:pointer;padding:10px 12px;list-style:none;display:flex;gap:10px;flex-wrap:wrap;align-items:baseline}
summary::-webkit-details-marker{display:none}
summary .id{font-family:var(--fm);font-size:12px;color:var(--acc)}
summary .t{flex:1 1 300px;min-width:0}
summary .m{font-family:var(--fm);font-size:12px;color:var(--mute);white-space:nowrap}
.body{padding:0 12px 12px}
.opt{border-top:1px solid var(--line);padding:8px 0}
.opt .lab{font-weight:500}
.opt .meta{font-family:var(--fm);font-size:12px;color:var(--mute);margin:2px 0}
.oc{font-size:13px;color:var(--mute);padding-left:12px;border-left:2px solid var(--line);margin:4px 0}
.ctl{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0}
.ctl input,.ctl select{font:inherit;padding:6px 8px;border:1px solid var(--line);background:var(--card);color:var(--fg);min-width:0}
.ctl input{flex:1 1 220px}
button{font:inherit;padding:6px 10px;border:1px solid var(--line);background:var(--bg2);color:var(--fg);cursor:pointer}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.note{font-size:13px;color:var(--mute);max-width:80ch}
code{font-family:var(--fm);font-size:12.5px}
.cnt{font-family:var(--fm);font-size:12px;color:var(--mute)}
@media (max-width:480px){ body{font-size:14px} table{font-size:12px} }
</style>
<div class="wrap">
<div class="eyebrow">Project Moon 팬게임 · 엔진 역추출 분석</div>
<h1>도시의 한 사람으로 태어나: 선택지별 확률과 영향력</h1>
<p class="lead">project-moon-life.cityborn.workers.dev 의 번들에서 게임 엔진과 데이터(구역 ${T.birth.length}개, 선택 이벤트 ${rows.length}개, 의뢰 템플릿 ${T.requestTypes.length}종)를 그대로 추출해 Node에서 실행했습니다. 기준 분포는 자동 선택 정책으로 ${T.M.toLocaleString()}회의 인생을 돌린 결과이고, 선택지별 영향력은 같은 상황에서 각 선택지를 고른 뒤 사망까지 다시 돌리는 분기 시뮬레이션으로 측정했습니다.</p>
<nav class="toc"><a href="#sum">요약</a><a href="#eng">엔진 규칙</a><a href="#birth">출생</a><a href="#base">기준 결과</a><a href="#career">진로</a><a href="#req">의뢰</a><a href="#warp">워프열차</a><a href="#imp">영향력 순위</a><a href="#deadly">치명 선택지</a><a href="#pol">전략 비교</a><a href="#all">전체 선택지</a></nav>

<h2 id="sum">핵심 요약</h2>
<ul class="find">${NARR.findings.map(x=>`<li>${x}</li>`).join('')}</ul>

<h2 id="eng">엔진 규칙 (코드 기준)</h2>
<ul class="find">
<li><b>난수</b>: 시드 문자열을 FNV-1a 해시로 32비트 상태로 만들고, 매 호출마다 상태에 1831565813을 더해 mulberry32 방식으로 섞습니다. 같은 시드와 같은 선택이면 같은 인생이 재현됩니다.</li>
<li><b>연간 이벤트 수</b>: 0~4세는 60% 확률로 1개, 아니면 0개. 5세 이상은 0개 15%, 1개 40%, 2개 32%, 3개 13%. 한 해에 주요 이벤트는 최대 1개, 선택지가 있는 이벤트는 최대 2개. 강제(force) 이벤트와 기한이 찬 필수(must) 이벤트는 이 제한과 무관하게 들어갑니다.</li>
<li><b>이벤트 선정</b>: 조건을 통과한 후보 중 가중치(weight × 구역 편향 bias)로 추첨합니다. chance가 있는 이벤트는 매년 그 확률로 먼저 발생 여부를 굴립니다.</li>
<li><b>선택지 결과</b>: outcomes의 w를 합산해 비례 추첨하되, <b>사망 결과의 가중치는 0.55배</b>로 깎입니다. 승급·승진 결과는 현재 등급·장비에 따라 가중치가 변합니다. 이 페이지의 정적 확률은 이 0.55배를 반영한 기본값이며, 조건부 배수(플래그·스탯·전투력)는 각 결과에 따로 표시했습니다.</li>
<li><b>위험(risk) 사망</b>: 결과에 risk가 있으면 <code>risk × 0.55 × 건강보정(0.5~2) × (1.15 − 인맥×0.006)</code> 확률로 추가 사망 판정. 건강이 떨어지는 결과를 받으면 건강 20 미만일 때 <code>0.015 × 2^((20−건강)/3.2)</code> 확률로 부상·질병 사망 판정이 한 번 더 들어갑니다.</li>
<li><b>연말 사망 판정</b>: ① 건강 20 미만이면 위 공식으로 질병/노화 사망. ② 구역 기대수명으로 보정된 기본 위험률 × 건강보정(0.25~3) × 재산보정(0.8~1.4)로 사망, 사인은 나이·구역·직업별 가중치 추첨(해결사는 범죄·항쟁 1.8배·환상체 1.5배, 손가락은 범죄·항쟁 2.2배, 협회 직원은 환상체 1.8배, 무직 23세+는 범죄 1.3배). ③ 90세부터 <code>0.15 × 1.2^(나이−90)</code> 확률로 노화 사망, 110세에 강제 종료.</li>
<li><b>연간 스탯 변동</b>: 18세+ 재산은 직업 기본값(무직 2.4, 날개 직원 5, 해결사·손가락·협회·흑수 6.5, T/W/R사 6, 권속 4.5)에서 3.6을 뺀 값×0.6 + 해결사 등급 보너스 + 정규분포 노이즈(±18) − (재산−50)×0.05. 7% 확률로 ±15~40의 횡재/손실 이벤트. 건강은 45세+ 매년 −0.6, 55세+ −1.3, 70세+ −2.2, 오염 7+ 구역 −0.5, 의료 6+ 구역 40세+ +0.3, 70 미만이면 +5 회복(45세 미만). 정신력은 60 미만이면 +2.5(인맥 40+면 +4), 75 초과면 −0.3.</li>
<li><b>사소한(minor) 이벤트</b>: 10초 안에 고르지 않으면 "흘려보낸다"(ignore) 결과가 적용됩니다. 주요(major) 이벤트는 시간이 멈추고 반드시 골라야 합니다. 게임의 자동 모드는 사소한 이벤트의 20%를 흘려보내고, 어릴 적 꿈 표시가 붙은 선택지를 60% 확률로 우선합니다.</li>
</ul>

<h2 id="birth">출생 확률</h2>
<p>구역은 birthWeight 비례 추첨(상층 A·B·C 각 1.2, 일반 날개 구역 4, 외곽 5). 가정 형편은 구역 wealth에 따라 부유 <code>5%+wealth×3%</code>, 가난 <code>5%+(10−wealth)×5%</code>. R사(18구)에서 태어나면 ${pct(T.cloneChanceR,0)} 확률로 부화장 복제 개체로 시작하며, 모든 출생에 ${pct(T.bloodBirthP,1)} 확률로 '피의기색' 플래그가 붙습니다. 시작 스탯: 건강 40+의료×3, 정신 45+치안×3, 재산 wealth×9, 인맥 15+조직압력 (각 ±8/±5 노이즈), 평판 20±5.</p>
<div class="tw"><table><thead><tr><th>구역</th><th class="n">출생 확률</th><th class="n">기대수명</th><th class="n">시뮬 평균수명</th><th class="n">부유/보통/가난</th><th class="n">치안</th><th class="n">부</th><th class="n">의료</th><th class="n">조직압력</th><th class="n">환상체</th><th class="n">오염</th><th class="n">시작 건강/정신/재산/인맥</th></tr></thead><tbody>
${birth.map(r=>`<tr><td>${esc(r.name)}${r.alias?` <span class="cnt">${esc(r.alias)}</span>`:''}${r.ward?` <span class="cnt">${r.ward}구</span>`:''}</td><td class="n"><span class="bar" style="width:${Math.round(r.p*600)}px"></span>${pct(r.p,1)}</td><td class="n">${r.lifeExp}</td><td class="n">${r.avgLife}</td><td class="n">${pct(r.pRich,0)} / ${pct(r.pNormal,0)} / ${pct(r.pPoor,0)}</td><td class="n">${r.safety}</td><td class="n">${r.wealth}</td><td class="n">${r.medical}</td><td class="n">${r.orgPressure}</td><td class="n">${r.fantasm}</td><td class="n">${r.pollution}</td><td class="n">${r.startHealth}/${r.startSanity}/${r.startWealth}/${r.startNetwork}</td></tr>`).join('')}
</tbody></table></div>
<p class="note">'시뮬 평균수명'은 개발자가 데이터에 넣어 둔 구역별 평균 수명(avgLife)으로, 결과 화면의 "평균보다 ±N년" 비교 기준입니다.</p>

<h2 id="base">기준 결과 분포 (자동 선택, ${P.default?P.default.N.toLocaleString():'–'}회)</h2>
${P.default?`<div class="grid">
<div class="tile"><div class="k">평균 사망 나이</div><div class="v">${P.default.meanAge}</div><div class="s">중앙값 ${P.default.medAge}세</div></div>
<div class="tile"><div class="k">20세 전 사망</div><div class="v">${pct(P.default.pUnder20,1)}</div><div class="s">60세 이상 생존 ${pct(P.default.pOver60,1)} · 80세 이상 ${pct(P.default.pOver80,1)}</div></div>
<div class="tile"><div class="k">해결사 3급 이상 도달</div><div class="v">${pct(P.default.pFixerTop3,1)}</div><div class="s">특색 ${pct(P.default.pColor,1)} · E.G.O 개화 ${pct(P.default.pEGO,1)}</div></div>
<div class="tile"><div class="k">사망 시 평균 재산 / 평판</div><div class="v">${P.default.wealth} / ${P.default.rep}</div><div class="s">건강 ${P.default.health} · 정신 ${P.default.sanity} · 인맥 ${P.default.network}</div></div>
</div>
<div class="grid"><div class="tile"><div class="k">사인 분포</div><div class="tw"><table><tbody>${Object.entries(P.default.cause).slice(0,12).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n"><span class="bar bad" style="width:${Math.round(v*300)}px"></span>${pct(v,1)}</td></tr>`).join('')}</tbody></table></div></div>
<div class="tile"><div class="k">최종 직업 분포</div><div class="tw"><table><tbody>${Object.entries(P.default.job).slice(0,12).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n"><span class="bar" style="width:${Math.round(v*300)}px"></span>${pct(v,1)}</td></tr>`).join('')}</tbody></table></div></div></div>`:''}
<h3>가장 자주 나오는 선택 이벤트 (12,000회 기준)</h3>
<div class="tw"><table><thead><tr><th>이벤트</th><th class="n">인생당 발생 확률</th><th class="n">인생당 평균 횟수</th><th>자동 선택 분포</th></tr></thead><tbody>
${occTop.map(o=>`<tr><td><code>${esc(o.id)}</code></td><td class="n">${pct(o.pLife,1)}</td><td class="n">${f1(o.perLife,2)}</td><td class="cnt">${o.chosen?Object.entries(o.chosen).map(([k,v])=>`${k}:${v}`).join(' · '):''}</td></tr>`).join('')}
</tbody></table></div>

<h2 id="career">진로 결정 (필수 이벤트)</h2>
<p>세 가지 필수 진로 이벤트 중 하나가 출신 구역에 따라 반드시 발생합니다. 각 선택지의 결과 확률은 사망 가중치 0.55배 적용 없이 w 비율 그대로이며, 어릴 적 꿈 플래그(날개동경·협회동경·해결사동경·손가락동경)가 있으면 해당 결과의 가중치가 1.3~1.6배로 늘어납니다.</p>
${['a_career_top','a_career_wing','a_career_outskirts'].map(id=>{const r=rows.find(x=>x.id===id); if(!r) return ''; return `<details open><summary><span class="id">${id}</span><span class="t">${esc(r.text)}</span><span class="m">${r.cond.filter(c=>/나이|구역/.test(c)).join(' · ')}</span></summary><div class="body">${r.opts.map(o=>`<div class="opt"><div class="lab">${esc(o.label)}${o.dream?` <span class="tag">꿈: ${esc([].concat(o.dream).join('/'))}</span>`:''}</div><div class="meta">분기 ${o.pn}개 상황: 수명 ${sgn(o.dRem,1)}년 (같은 상황의 다른 선택지 평균 대비) · 재산 ${sgn(o.dWealth,0)} · 평판 ${sgn(o.dRep,0)} · 5년 내 사망 ${sgn(o.dD5*100,1)}%p · 평균 남은 수명 ${f1(o.rem)}년 · 1년 내 사망 ${pct(o.d1)} · 전투력 ${f1(o.power,2)} · 희귀 플래그 ${pct(o.rare)}</div>${o.outcomes.map(x=>`<div class="oc">${pct(x.p,0)} ${esc(x.text)} <span class="cnt">${x.job?`→ ${esc(x.work||x.job)}`:''} ${x.effects?Object.entries(x.effects).map(([k,v])=>`${KO[k]||k}${sgn(v,0)}`).join(' '):''}</span></div>`).join('')}</div>`).join('')}</div></details>`;}).join('')}

<h2 id="req">해결사 의뢰 확률표</h2>
<p>해결사는 16세부터 매년 85% 확률로 의뢰 1건, 조직 소속이면 45% 확률로 1건 더 받습니다. 의뢰 등급은 "적정 등급"(등급·특색·장비로 계산) 기준으로 −1: 18%, 0: 45%, +1: 25%, +2: 9%, +3: 3% 만큼 이동하고, 협회 소속이면 35% 확률로 한 단계 더 올라갑니다. 사망 확률은 <code>0.025 × 1.85^(등급차) × 0.55</code>에 정면 1.3배/신중 0.45배, 조직 소속 0.85배, 건강·인맥 보정이 곱해집니다. 아래는 건강 50·인맥 30·무소속 기준이며 게임 화면에 표시되는 성공/실패/사망 % 와 같은 계산입니다.</p>
<div class="ctl"><label for="reqGrade">해결사 등급</label><select id="reqGrade">${Object.keys(reqG).sort((a,b)=>b-a).map(g=>`<option value="${g}">${g}급</option>`).join('')}</select></div>
<div class="tw"><table id="reqTable"><thead><tr><th>의뢰 등급</th><th>방식</th><th class="n">성공</th><th class="n">실패</th><th class="n">사망</th><th class="n">성공 보수(재산)</th><th class="n">성공 평판</th><th class="n">승급 공적 / 필요</th></tr></thead><tbody></tbody></table></div>
<p class="note">성공 시 보수는 등급별 [3,5,8,13,20,32,50] × (정면 1.5 / 신중 0.7) × (협회 1.2 / 사무소 1.0 / 개인 0.85). 실패 시 건강 −(5+등급×1.3), 정신 −(3+등급×0.7), 평판 −등급. 정면 성공은 건강 −(1+등급×0.6). 뒤틀림·환상체·악몽 이상 의뢰는 성공해도 정신 −(1+등급×0.45). 도시의 별(5) 이상 성공 시 30% 확률로 '환상체생존' 플래그. 승급에 필요한 공적은 <code>4 + 4.5×(9−등급)²</code> (E.G.O 0.4배, 유물 0.55배, 평판 50+ 0.85배).</p>
<h3>의뢰 종류 (${T.requestTypes.length}종)</h3>
<div class="tw"><table><thead><tr><th>종류</th><th class="n">건수</th><th>등급 범위</th><th>사망 시 사인</th></tr></thead><tbody>
${Object.entries(T.requestTypes.reduce((m,r)=>{(m[r.type] ||= []).push(r);return m;},{})).map(([t,arr])=>`<tr><td>${esc(t)}</td><td class="n">${arr.length}</td><td>${[...new Set(arr.map(r=>r.tiers.join('~')))].join(', ')}</td><td>${[...new Set(arr.map(r=>r.cause))].join(', ')}${arr.some(r=>r.bite)?' <span class="tag">혈귀 감염 가능</span>':''}</td></tr>`).join('')}
</tbody></table></div>

<h2 id="warp">워프열차</h2>
<p>${esc(T.warp.enterChance)}. ${esc(T.warp.autoPolicy)}. 전투력(cp)은 ${esc(T.warp.cpFormula)}. 판정: ${esc(T.warp.result)}. 8칸을 모두 치우면 '워프 완주' 기록이 남습니다.</p>
<div class="tw"><table><thead><tr><th class="n">칸</th><th class="n">난이도 E</th><th>종류</th><th>특수</th><th>cp 기준 대승 조건(정면, 지터 0)</th></tr></thead><tbody>
${T.warp.cars.map(c=>`<tr><td class="n">${c.car}</td><td class="n">${c.E}</td><td>${c.kind==='person'?'사람':'물건'}</td><td>${c.failMindX2?'실패 시 정신 피해 2배':''}${c.jit?`지터 ±${c.jit}`:''}${c.mindHalf?'피해 절반이 정신으로':''}${c.noRed?'누적 실패 보정 없음':''}</td><td class="n">cp ≥ ${c.E+1}</td></tr>`).join('')}
</tbody></table></div>

<h2 id="imp">영향력 순위: 어떤 선택이 수명을 가장 크게 가르는가</h2>
<p>각 이벤트가 실제로 뜬 상황(최대 40개)에서 그 상황에서 고를 수 있던 모든 선택지를 각각 3회씩 끝까지 돌렸습니다. 선택지의 '수명 효과'는 같은 상황의 다른 선택지 평균 대비 남은 수명 차이(짝지은 비교)이고, '수명 차이'는 최선 선택지와 최악 선택지의 효과 차, '영향력'은 수명 차이 × 인생당 발생 확률입니다. 표본이 40개 상황 × 3회이므로 ±2년 정도는 노이즈로 보십시오.</p>
<div class="tw"><table><thead><tr><th class="n">#</th><th>이벤트</th><th class="n">발생 확률</th><th class="n">수명 차이</th><th class="n">영향력</th><th>최선</th><th>최악</th></tr></thead><tbody>
${imp.slice(0,40).map((r,i)=>`<tr><td class="n">${i+1}</td><td><code>${esc(r.id)}</code>${r.major?' <span class="tag major">주요</span>':''}<div class="cnt">${esc(r.text.slice(0,70))}…</div></td><td class="n">${pct(r.pLife,1)}</td><td class="n">${f1(r.spread)}년</td><td class="n">${f1(r.imp,2)}</td><td class="pos">${esc(r.best)}</td><td class="neg">${esc(r.worst)}</td></tr>`).join('')}
</tbody></table></div>

<h2 id="deadly">치명적인 선택지 (정적 사망 확률 3% 이상)</h2>
<p>'즉사'는 선택 직후 사망 결과가 나올 확률(사망 가중치 0.55배 반영), '위험'은 risk 판정에 의한 추가 사망 확률의 기대값, '분기 1년 내 사망'은 분기 시뮬레이션에서 1년 안에 죽은 비율입니다.</p>
<div class="tw"><table><thead><tr><th>이벤트</th><th>선택지</th><th class="n">즉사</th><th class="n">위험</th><th class="n">분기 1년 내 사망</th><th class="n">발생 확률</th></tr></thead><tbody>
${deadly.slice(0,60).map(d=>`<tr><td><code>${esc(d.id)}</code></td><td>${esc(d.label)}</td><td class="n neg">${pct(d.pDeath)}</td><td class="n">${pct(d.pRisk)}</td><td class="n">${pct(d.d1)}</td><td class="n">${pct(d.pLife,1)}</td></tr>`).join('')}
</tbody></table></div>

<h2 id="pol">전략 비교 (각 ${P.default?P.default.N.toLocaleString():'–'}회)</h2>
<p>특정 종류의 선택만 고정하고 나머지는 자동 선택에 맡겼을 때의 결과입니다. 같은 시드 집합을 사용했습니다.</p>
<div class="tw"><table><thead><tr><th>전략</th><th class="n">평균 수명</th><th class="n">중앙값</th><th class="n">20세 전 사망</th><th class="n">60세+</th><th class="n">80세+</th><th class="n">재산</th><th class="n">평판</th><th class="n">건강</th><th class="n">정신</th><th class="n">전투력</th><th class="n">해결사 3급+</th><th class="n">특색</th><th class="n">E.G.O</th></tr></thead><tbody>
${Object.entries(P).map(([k,v])=>`<tr><td>${esc(polNames[k]||k)}</td><td class="n">${v.meanAge}</td><td class="n">${v.medAge}</td><td class="n">${pct(v.pUnder20)}</td><td class="n">${pct(v.pOver60)}</td><td class="n">${pct(v.pOver80)}</td><td class="n">${v.wealth}</td><td class="n">${v.rep}</td><td class="n">${v.health}</td><td class="n">${v.sanity}</td><td class="n">${v.power}</td><td class="n">${pct(v.pFixerTop3)}</td><td class="n">${pct(v.pColor)}</td><td class="n">${pct(v.pEGO)}</td></tr>`).join('')}
</tbody></table></div>
${NARR.notes.length?`<ul class="find">${NARR.notes.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}

<h2 id="all">전체 선택 이벤트 (${rows.length}개, 선택지 ${rows.reduce((a,r)=>a+r.opts.length,0)}개)</h2>
<div class="ctl"><input id="q" type="search" placeholder="이벤트 id, 본문, 선택지 검색"><select id="sort"><option value="imp">영향력 순</option><option value="freq">발생 빈도 순</option><option value="spread">수명 차이 순</option><option value="death">사망 확률 순</option><option value="id">id 순</option></select><select id="kind"><option value="all">전체</option><option value="major">주요만</option><option value="minor">사소한 것만</option></select><span class="cnt" id="cnt"></span></div>
<div id="list"></div>
</div>
<script>
const EV = ${JSON.stringify(evData)};
const REQ = ${JSON.stringify(T.request)};
const KO = ${JSON.stringify(KO)};
const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const f1=(x,d=1)=> x==null||Number.isNaN(x)? '–' : Number(x).toFixed(d);
const pct=(x,d=1)=> x==null||Number.isNaN(x)? '–' : (x*100).toFixed(d)+'%';
const sgn=(x,d=0)=> x==null? '–' : (x>0?'+':'')+Number(x).toFixed(d);
function renderReq(){ const g=document.getElementById('reqGrade').value; const tb=document.querySelector('#reqTable tbody'); tb.innerHTML = REQ.filter(r=>String(r.grade)===g).map(r=>'<tr><td>'+esc(r.tierName)+' ('+r.tier+')'+(r.tier===r.fit?' <span class="tag">적정</span>':'')+'</td><td>'+(r.mode==='bold'?'정면':'신중')+'</td><td class="n pos">'+r.ok+'%</td><td class="n">'+r.fail+'%</td><td class="n neg">'+(r.tiny?'<1':r.die)+'%</td><td class="n">+'+r.payOk+'</td><td class="n">+'+r.repOk+'</td><td class="n">'+r.merit+' / '+r.meritNeed+'</td></tr>').join(''); }
document.getElementById('reqGrade').addEventListener('change', renderReq); renderReq();
function optHtml(o, ev){
  const sim = o.pn>=8 ? ' · 분기 '+o.pn+'개 상황: <b>수명 '+sgn(o.dRem,1)+'년</b> 재산 '+sgn(o.dWealth,0)+' 평판 '+sgn(o.dRep,0)+' 건강 '+sgn(o.dHealth,0)+' 5년 내 사망 '+sgn(o.dD5*100,1)+'%p (같은 상황의 다른 선택지 평균 대비) · 1년 내 사망 '+pct(o.d1) : (o.n>=20 ? ' · 분기 '+o.n+'회: 1년 내 사망 '+pct(o.d1) : '');
  const exp = o.exp ? Object.entries(o.exp).filter(([k,v])=>v).map(([k,v])=>KO[k]+sgn(v,1)).join(' ') : '';
  const tags = [].concat(o.needs?Object.entries(o.needs).map(([k,v])=>'<span class="tag">'+KO[k]+' '+v[0]+'~'+v[1]+'</span>'):[], (o.jobs||[]).map(j=>'<span class="tag major">→ '+esc(j)+'</span>'), (o.flags||[]).map(j=>'<span class="tag">'+esc(j)+'</span>'), (o.extra||[]).map(j=>'<span class="tag">'+esc(j)+'</span>'), o.dream?['<span class="tag">꿈: '+esc([].concat(o.dream).join('/'))+'</span>']:[]).join('');
  const death = (o.pDeath||o.pRisk) ? ' <span class="neg">즉사 '+pct(o.pDeath)+(o.pRisk?' + 위험 '+pct(o.pRisk):'')+'</span>' : '';
  const outs = (o.outcomes||[]).length>1 || (o.outcomes||[]).some(x=>x.cond) ? o.outcomes.map(x=>'<div class="oc">'+pct(x.p,0)+' '+esc(x.text)+' <span class="cnt">'+(x.death?'† '+esc(x.death)+' ':'')+(x.risk?'위험 '+Object.entries(x.risk).map(([k,v])=>k+' '+pct(v,0)).join(',')+' ':'')+(x.effects?Object.entries(x.effects).map(([k,v])=>KO[k]+sgn(v)).join(' '):'')+(x.flagsAdd?' +'+x.flagsAdd.join(','):'')+(x.job?' → '+esc(x.work||x.job):'')+(x.cond?' ['+x.cond.join('; ')+']':'')+'</span></div>').join('') : '';
  return '<div class="opt"><div class="lab">'+(o.idx==='ignore'?'<span class="cnt">(무시)</span> ':'')+esc(o.label)+death+'</div><div class="meta">기대 변화: '+(exp||'없음')+sim+'</div>'+tags+outs+'</div>';
}
function evHtml(e){
  return '<details><summary><span class="id">'+esc(e.id)+'</span>'+(e.major?'<span class="tag major">주요</span>':'')+'<span class="t">'+esc(e.text)+'</span><span class="m">발생 '+pct(e.pLife,1)+(e.spread!=null?' · 수명차 '+f1(e.spread)+'년':'')+'</span></summary><div class="body"><div class="cnt">'+e.cond.map(esc).join(' · ')+(e.nStates?' · 분기 표본 '+e.nStates+'개 상황':'')+'</div>'+e.opts.map(o=>optHtml(o,e)).join('')+'</div></details>';
}
const list=document.getElementById('list'), q=document.getElementById('q'), sort=document.getElementById('sort'), kind=document.getElementById('kind'), cnt=document.getElementById('cnt');
function maxDeath(e){ return Math.max(0,...e.opts.map(o=>(o.pDeath||0)+(o.pRisk||0))); }
function render(){
  const s=(q.value||'').trim().toLowerCase();
  let arr=EV.filter(e=> kind.value==='all' || (kind.value==='major')===!!e.major);
  if(s) arr=arr.filter(e=> e.id.toLowerCase().includes(s) || e.text.toLowerCase().includes(s) || e.opts.some(o=>o.label.toLowerCase().includes(s)));
  const key={imp:e=>(e.spread||0)*e.pLife, freq:e=>e.perLife, spread:e=>e.spread||0, death:maxDeath}[sort.value];
  if(key) arr.sort((a,b)=>key(b)-key(a)); else arr.sort((a,b)=>a.id<b.id?-1:1);
  cnt.textContent=arr.length+'개';
  list.innerHTML=arr.slice(0,120).map(evHtml).join('')+(arr.length>120?'<p class="note">상위 120개만 표시합니다. 검색어로 좁혀 주세요.</p>':'');
}
q.addEventListener('input',render); sort.addEventListener('change',render); kind.addEventListener('change',render); render();
</script>`;
fs.writeFileSync('report.html', html);
console.log('html bytes', html.length);
