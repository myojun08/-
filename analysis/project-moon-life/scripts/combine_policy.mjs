import fs from 'fs';
const order=['default','request_decline','request_care','request_bold','request_smart','no_warp','yes_warp','never_ignore','always_ignore_minor','safe','prefer_fixer','prefer_wing','prefer_finger'];
const all={}; for(const f of fs.readdirSync('sim').filter(f=>/^policy_.*\.json$/.test(f)&&f!=='policy_all.json')) Object.assign(all, JSON.parse(fs.readFileSync('sim/'+f,'utf8')));
const out={}; for(const k of order) if(all[k]) out[k]=all[k];
fs.writeFileSync('sim/policy_all.json', JSON.stringify(out,null,1)); console.log(Object.keys(out));
