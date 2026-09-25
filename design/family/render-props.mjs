// Pixel-art props (shaded, auto-outlined) → out/props/*.svg. Run: node render-props.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out', 'props');
fs.mkdirSync(OUT_DIR, { recursive: true });
const R = {
 w:['#c98a4b','#9a5f30','#6b3d1f'], d:['#7a4a26','#5a3419','#3c2211'],
 s:['#b3ad9f','#8a8478','#615b52'], S:['#6e6960','#524e47','#3a3732'],
 m:['#c9d0d6','#8f979f','#5d646c'], g:['#ffe28a','#f0b93a','#b9791b'],
 r:['#e0645a','#b5372f','#7c2220'], b:['#6f9be0','#3f67b8','#2a4480'],
 v:['#a47fd6','#7652b0','#4e3480'], t:['#7fd0c4','#3f9c90','#276a62'],
 n:['#9ccf5a','#6aa33a','#44722a'], p:['#fff6df','#e9dcbc','#bfae88'],
 f:['#fff3a0','#ffb23a','#e0622a'], a:['#f4d99a','#dcb866','#b08c44'],
 c:['#e2f6fa','#a9dbe8','#6fb0c6'], z:['#e6b878','#b07a3c','#7a4f22'],
};
const FLAT = { o:'#1a1210', h:'#fff8e8', y:'#b9791b', k:'#2a1f19' };
const OUT = '#1a1210';
const mir = rows => rows.map(r => r + [...r].reverse().join(''));
const L = {
chest: ["...wwwwwwwwwwwwwwww...","..wwwwwwwwwwwwwwwwww..",".mwwwwwwwwwwwwwwwwwwm.",".mwwwwwwwwwwwwwwwwwwm.",".mwwwwwwwwwwwwwwwwwwm.","mmmmmmmmmggggmmmmmmmmm",".mwwwwwwwggggwwwwwwwm.",".mwwwwwwwgoogwwwwwwwm.",".mwwwwwwwggggwwwwwwwm.",".mwwwwwwwwwwwwwwwwwwm.",".mwwwwwwwwwwwwwwwwwwm.","mmmmmmmmmmmmmmmmmmmmmm",".mwwwwwwwwwwwwwwwwwwm.",".mmmmmmmmmmmmmmmmmmmm."],
chestopen: ["......h........h......","...dddddddddddddddd...","..dddddddddddddddddd..",".mddddddddddddddddddm.",".mdddggddddddgggddddm.",".mdgggggdggggggggggdm.",".gggggggggggggggggggg.","gggggggggggggggggggggg","mmmmmmmmmggggmmmmmmmmm",".mwwwwwwwgoogwwwwwwwm.",".mwwwwwwwggggwwwwwwwm.",".mwwwwwwwwwwwwwwwwwwm.","mmmmmmmmmmmmmmmmmmmmmm",".mwwwwwwwwwwwwwwwwwwm.",".mmmmmmmmmmmmmmmmmmmm."],
hourglass: ["wwwwwwwwwwwwwwww","dddddddddddddddd",".m.cccccccccc.m.",".m.caaaaaaaac.m.",".m..caaaaaac..m.",".m...caaaac...m.",".m....caac....m.",".m.....cc.....m.",".m.....ca.....m.",".m....cacc....m.",".m...ccaccc...m.",".m..cccaaccc..m.",".m.caaaaaaaac.m.",".m.caaaaaaaac.m.","dddddddddddddddd","wwwwwwwwwwwwwwww"],
torch: ["...ff...","..fff...","..ffff..",".ffhfff.",".fhhhff.",".ffhhff.","..ffff..",".mmmmmm.",".dddddd.","..mmmm..","...ww...","...ww...","...ww...","...ww...","...ww...","...ww...","...ww...","...ww..."],
coin: mir(["....ggg","..ggggg",".ggyyyy",".gygggg","ggygggy","ggyggyy","ggyggyy","ggygggy",".gygggg",".ggyyyy","..ggggg","....ggg"]),
board: ["dddddddddddddddddddddddd",".wwwwwwwwwwwwwwwwwwwwww.",".wddddddddddddddddddddw.",".wdpppppddpppppdpppppdw.",".wdprpppddpppppdppprpdw.",".wdpkkkpddpkkkpdpkkkpdw.",".wdpppppddpppppdpppppdw.",".wdpkkkpddpkkkpdpkkkpdw.",".wdpppppddpppppdpppppdw.",".wdpkkppddpppppdpkkppdw.",".wdpppppddpkkkpdpppppdw.",".wddddddddddddddddddddw.",".wwwwwwwwwwwwwwwwwwwwww.","...ww..............ww...","...ww..............ww...","...ww..............ww...","...ww..............ww...","...ww..............ww...","..dddd............dddd.."],
stall: ["..rrrppprrrppprrrppprr..",".rrrppprrrppprrrppprrrp.","rrrppprrrppprrrppprrrppp","rrrppprrrppprrrppprrrppp","rr.pp.rr.pp.rr.pp.rr.pp.",".w....................w.",".w....................w.",".w....................w.",".w....................w.",".w..aa.rr..nn..cc.bb..w.",".waaaarrrrnnnnccccbbbbw.","wwwwwwwwwwwwwwwwwwwwwwww","dwwwwwwwwwwwwwwwwwwwwwwd","dwwwwwwwwwwwwwwwwwwwwwwd","dwwwwwwwwwwwwwwwwwwwwwwd","dddddddddddddddddddddddd",".dd..................dd."],
gate: ["..nnnsssssssssnnsssss.",".ssssssssssssssssssss.","ssssssssssssssssssssss","ssssssskkkkkkkksssssss","ssssskkkkkkkkkkkksssss","sssskkkkkkkkkkkkkkssss","sssskmkkmkkmkkmkkmssss","sssskmkkmkkmkkmkkmssss","ssssmmmmmmmmmmmmmmssss","sssskmkkmkkmkkmkkmssss","sssskmkkmkkmkkmkkmssss","ssssmmmmmmmmmmmmmmssss","sssskmkkmkkmkkmkkmssss","sssskmkkmkkmkkmkkmssss","ssssmmmmmmmmmmmmmmssss","sssskmkkmkkmkkmkkmssss","sssskmkkmkkmkkmkkmssss","ssssmmmmmmmmmmmmmmssss","sssskmkkmkkmkkmkkmssss","SSSSSSSSSSSSSSSSSSSSSS"],
banner: ["......gg......","......ww......","wwwwwwwwwwwwww",".XXXXXXXXXXXX.",".XXXXXXXXXXXX.",".XXXXXggXXXXX.",".XXXXggggXXXX.",".XXXggggggXXX.",".XXXXggggXXXX.",".XXXXXggXXXXX.",".XXXXXXXXXXXX.",".XXXXXXXXXXXX.",".XXXXXXXXXXXX.",".XXXXX..XXXXX.",".XXXX....XXXX.",".XXX......XXX.","......ww......","......ww......","......ww......","......ww......","......ww......","......ww......","....SSSSSS...."],
anvil: ["..mmmmmmmmmmmmmmmmmmm.","mmmmmmmmmmmmmmmmmmmmm.","..mmmmmmmmmmmmmmmmmmm.","......mmmmmmmmmmmm....",".......mmmmmmmmmm.....",".......mmmmmmmmmm.....","......mmmmmmmmmmmm....",".....mmmmmmmmmmmmmm...","....dddddddddddddddd..","....wwwwwwwwwwwwwwww..","....wwwwwwwwwwwwwwww..","....dddddddddddddddd.."],
scroll: [".aaaaaaaaaaaaaaaaaa.","aaaaaaaaaaaaaaaaaaaa","..pppppppppppppppp..","..pkkkkkkkkkkkkkkp..","..pppppppppppppppp..","..pkkkkkkkkkkkpppp..","..pppppppppppppppp..","..pkkkkkkkkkkkkkkp..","..pppppppppppppppp..","..pkkkkkkkpprrrrpp..","..ppppppppprrrrrrp..","..ppppppppprrrrrrp..","..pppppppppprrrrpp..","aaaaaaaaaaaaaaaaaaaa",".aaaaaaaaaaaaaaaaaa."],
bell: [".......ww.......",".......ww.......","......zzzz......",".....zzzzzz.....","....zzzzzzzz....","....zzzzzzzz....","...zzzzzzzzzz...","...zzzzzzzzzz...","...zzzzzzzzzz...","..zzzzzzzzzzzz..",".zzzzzzzzzzzzzz.","zzzzzzzzzzzzzzzz",".......kk......."],
helm: [".......rr.......","......rrrr......",".....mmmmmm.....","...mmmmmmmmmm...","..mmmmmmmmmmmm..",".mmmmmmmmmmmmmm.",".mmmmmmmmmmmmmm.",".mmkkkkkkkkkkmm.",".mmmmmmmmmmmmmm.",".mmmkmkmmkmkmmm.",".mmmmmmmmmmmmmm.","..mmmmmmmmmmmm..","..mmmmmmmmmmmm..",".mmmmmmmmmmmmmm.","mmmmmmmmmmmmmmmm"],
padlock: ["...mmmmmmmm...","..mm......mm..","..mm......mm..","..mm......mm..","zzzzzzzzzzzzzz","zzzzzzzzzzzzzz","zzzzzzkkzzzzzz","zzzzzzkkzzzzzz","zzzzzzzkzzzzzz","zzzzzzzzzzzzzz","zzzzzzzzzzzzzz"],
};
const variants = { banner: { red:'r', teal:'t', violet:'v' } };
function render(name, rows0) {
  const W = Math.max(...rows0.map(r=>r.length));
  rows0.forEach((r,i)=>{ if(r.length!==W) throw new Error(`${name} row ${i} len ${r.length} != ${W}`); [...r].forEach(ch=>{ if(ch!=='.'&&!R[ch]&&!FLAT[ch]) throw new Error(`${name} bad ${ch}`)}) });
  const w=W+2,h=rows0.length+2;
  const g=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>{const c=rows0[y-1]?.[x-1];return c&&c!=='.'?c:null;}));
  const col=Array.from({length:h},()=>Array(w).fill(null));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const M=g[y][x];
    if(!M){ if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>g[y+dy]?.[x+dx])) col[y][x]=OUT; continue;}
    if(FLAT[M]){col[y][x]=FLAT[M];continue;}
    const [hi,base,lo]=R[M]; const same=(dx,dy)=>g[y+dy]?.[x+dx]===M;
    let c=base;
    if(!same(0,-1)) c=hi; else if(!same(-1,0)) c=hi; else if(!same(0,1)||!same(1,0)) c=lo;
    else if((M==='w'||M==='d') && y%3===2 && (x+y)%7!==0) c=lo;
    else if((M==='s'||M==='S') && (y%4===3 || (x+(Math.floor(y/4)%2)*3)%6===5)) c=lo;
    else if(M==='g' && (x*7+y*3)%11===0) c=hi;
    col[y][x]=c; }
  let rects='';
  for(let y=0;y<h;y++){let x=0;while(x<w){const c=col[y][x];if(!c){x++;continue;}let x2=x;while(x2<w&&col[y][x2]===c)x2++;rects+=`<rect x="${x}" y="${y}" width="${x2-x}" height="1" fill="${c}"/>`;x=x2;}}
  fs.writeFileSync(path.join(OUT_DIR, `${name}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w*8}" height="${h*8}" shape-rendering="crispEdges">${rects}</svg>`);
  console.log(name,w+'x'+h);
}
for (const [n,rows] of Object.entries(L)) {
  if (variants[n]) for (const [vn,ch] of Object.entries(variants[n])) render(`${n}-${vn}`, rows.map(r=>r.replaceAll('X',ch)));
  else render(n, rows);
}
