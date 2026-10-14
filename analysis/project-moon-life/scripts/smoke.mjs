import * as G from './harness.mjs';
const data = G.St();
console.log('regions', data.regions.length, 'events', data.events.length, 'daily', data.daily.length, 'requests', data.requests.length, 'orgs', Object.keys(data.orgs||{}));
function runLife(seed, chooser){
  const s = G.wy(data, { seed, name:'테스트', gender:'m' });
  let guard=0;
  while(!s.dead && guard++ < 200000){
    if(s.prompt){ const c = chooser(s); G.nr(s, data, c, {auto:true}); continue; }
    if(s.cursor < s.plan.length){ G.Ry(s, data); continue; }
    G.rm(s, data);
  }
  return s;
}
const s = runLife('12345', (st)=>G.Vy(st));
console.log(s.dead, s.regionId, s.job, s.grade, s.stats, s.flags, s.log.length);
const sum = G.Nc(s, data);
console.log(sum.age, sum.cause, sum.region.name, sum.job, sum.rare);
