import fs from 'fs';
const files = fs.readdirSync('sim').filter(f=>/^collect_\d+\.json$/.test(f));
let M=0; const occ={}, occAll={}, chosen={}, samples={};
const CAP=40;
for(const f of files){
  const d = JSON.parse(fs.readFileSync('sim/'+f,'utf8'));
  M += d.M;
  for(const [k,v] of Object.entries(d.occ)) occ[k]=(occ[k]||0)+v;
  for(const [k,v] of Object.entries(d.occAll)) occAll[k]=(occAll[k]||0)+v;
  for(const [k,m] of Object.entries(d.chosen)){ const t=chosen[k]||(chosen[k]={}); for(const [c,n] of Object.entries(m)) t[c]=(t[c]||0)+n; }
  for(const [k,arr] of Object.entries(d.samples)){
    const t = samples[k]||(samples[k]=[]);
    for(const sj of arr){ if(t.length>=CAP) break; const s=JSON.parse(sj); s.log = s.log.slice(0,2); s.story=[]; s.reflections=[]; t.push(s); }
  }
  console.log(f, 'done');
}
fs.writeFileSync('sim/stats_merged.json', JSON.stringify({M, occ, occAll, chosen}));
fs.writeFileSync('sim/samples_merged.json', JSON.stringify(samples));
console.log('M',M,'events',Object.keys(occ).length,'sampled',Object.keys(samples).length, 'size', fs.statSync('sim/samples_merged.json').size);
