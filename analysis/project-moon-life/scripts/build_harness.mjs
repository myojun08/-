import fs from 'fs';
let src = fs.readFileSync('site/app.pretty.js','utf8');
const lastLine = 'ic(document.getElementById("root")).render(d.jsx(of.StrictMode, { children: d.jsx(ck, {}) }));';
if(!src.includes(lastLine)) throw new Error('render line not found');
src = src.replace(lastLine, '');
const stubs = `
globalThis.window = globalThis;
Object.defineProperty(globalThis,'navigator',{value:{ language: 'ko' },configurable:true});
const __store = {};
globalThis.localStorage = { getItem:(k)=>__store[k]??null, setItem:(k,v)=>{__store[k]=String(v)}, removeItem:(k)=>{delete __store[k]} };
const __el = () => new Proxy({relList:undefined, style:{}, setAttribute(){}, getAttribute(){return null}, appendChild(){}, removeChild(){}, addEventListener(){}, removeEventListener(){}, oninput:null}, {get(t,k){ return k in t ? t[k] : undefined; }});
globalThis.document = { createElement:__el, createElementNS:__el, createTextNode:()=>({}), querySelectorAll:()=>[], getElementById:()=>null, documentElement:{lang:'ko', style:{}}, body:{style:{}}, head:{appendChild(){}}, addEventListener(){}, removeEventListener(){}, documentMode:undefined, implementation:{} };
globalThis.MutationObserver = class { observe(){} disconnect(){} };
globalThis.requestAnimationFrame = (cb)=>setTimeout(()=>cb(performance.now()),16);
globalThis.cancelAnimationFrame = (id)=>clearTimeout(id);
globalThis.matchMedia = ()=>({matches:false, addEventListener(){}, removeEventListener(){}});
`;
const exportsLine = `
export { wy, St, cl, Ry, nr, Vy, rm, Nc, xe, ne, bc, ar, ht, ns, Cy, Sy, Wy, $h, as, Bh, Ac, Ha, oo, em, Sc, Zy, Cw, Sw, xr, Wa, ky, os, jc, xy, vy, Ty, Dy, My, Xr, De, f, fe, mw, Zi, Vt, oy, qo, jy, Ay, Yn, Da, ai, Se, Io, kt, Cn, Tr, Cc, fl, _y, Yy, Ey, Py, Ny, Iy, ly, iy, $y, Ty as pickCount };
`;
fs.writeFileSync('sim/harness.mjs', stubs + src + exportsLine);
console.log('ok', (stubs+src+exportsLine).length);
