import {writeFileSync,readFileSync} from 'fs'; import {createRequire} from 'module';
const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
const src=readFileSync('h14.mjs','utf8');const hand=src.match(/const hand=`([^`]*)`/)[1];
const hand2=hand.replace('L35 22.5 C34.7 20.2 37.6 19 39 20.8 L42.4 30.5','L33.2 16.4 C32.8 13.9 35.9 12.7 37.4 14.8 L42.4 30.5');
const Hd=ink=>`<path d="${hand2}" fill="${ink}"/><rect x="54.2" y="33" width="6.6" height="16" rx="2.4" fill="${ink}"/>`;
const rot=(x,y,d,cx=32,cy=32)=>{const r=d*Math.PI/180,dx=x-cx,dy=y-cy;return [cx+dx*Math.cos(r)-dy*Math.sin(r),cy+dx*Math.sin(r)+dy*Math.cos(r)];};
const wallet=(ink,bg,x,y,w=30,h=19)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${ink}"/><rect x="${x+3.6}" y="${y+3.8}" width="${w-7.2}" height="2.4" rx="1.2" fill="${bg}"/><rect x="${x+w-9.5}" y="${y+8}" width="12" height="8" rx="4" fill="${ink}" stroke="${bg}" stroke-width="1.8"/><circle cx="${x+w-3.8}" cy="${y+12}" r="1.7" fill="${bg}"/>`;
// יד הפוכה מסובבת d° — נקראת כ-ג מהצד: ראש=גב-היד והאצבעות המתקפלות, עמוד=כף היד, רגל=האגודל
const comp=(d,ink,g,bg)=>{const [fx,fy]=rot(11.2,53.6,d);const [tx,ty]=rot(35.4,68.6,d);
 // הארנק יושב בקצה האגודל; המטבע נופל מקצות האצבעות אל פתח הארנק
 const ww=27,wy=ty+2.2,wx=tx-ww+3;
 const cx=Math.max(fx+1,wx+9),cy=Math.min(fy+9,wy-7.5);
 return `<g transform="rotate(${d} 32 32) translate(0 82) scale(1 -1)">${Hd(ink)}</g><circle cx="${cx}" cy="${cy}" r="6" fill="${g}"/>`+wallet(ink,bg,wx,wy,ww,17);};
const V={A:{t:'א · 55° (מבט מטה)',d:55},B:{t:'ב · 48° (מבט מטה יותר)',d:48},P:{t:'(קודם · 60°)',d:60}};
const t=(k,bg,ink,g,px)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}"><rect width="64" height="64" rx="14" fill="${bg}"/><g class="m">${comp(V[k].d,ink,g,bg)}</g></svg>`;
writeFileSync('h21.html',`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;padding:20px;background:#eef0f3;font-family:Arial"><h2 style="margin:0 0 12px">גבי — היד הקודמת, מסובבת כך שתיקרא כ-ג מהצד</h2>${Object.keys(V).map(k=>`<div style="display:flex;gap:14px;align-items:end;margin-bottom:14px;background:#fff;padding:12px;border-radius:12px"><b style="width:120px">${V[k].t}</b>${t(k,C,N,GL,160)}${t(k,N,C,G,160)}${t(k,N,C,G,48)}${t(k,N,C,G,32)}</div>`).join('')}</body>`);
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:760,height:700},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/h21.html');
await p.evaluate(()=>{for(const g of document.querySelectorAll('g.m')){const b=g.getBBox();const k=Math.min(50/b.width,50/b.height);g.setAttribute('transform',`translate(${32-k*(b.x+b.width/2)} ${32-k*(b.y+b.height/2)}) scale(${k})`);}});
await p.screenshot({path:'h21.png',fullPage:true});await b.close();
