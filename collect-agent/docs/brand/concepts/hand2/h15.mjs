import {writeFileSync,readFileSync} from 'fs'; import {createRequire} from 'module';
const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
const L=JSON.parse(readFileSync('/home/user/maor-system/collect-agent/web/scripts/concepts-t1-letters.json','utf8'));
// היד = ג: השרוול נכנס מימין-למעלה, ראש ה-ג = האצבעות, העמוד = כף היד, הרגל = האגודל שמשחרר את המטבע — אל הארנק
const wallet=(ink,bg,x,y,w=30,h=19)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${ink}"/><rect x="${x+3.6}" y="${y+3.8}" width="${w-7.2}" height="2.4" rx="1.2" fill="${bg}"/><rect x="${x+w-9.5}" y="${y+8}" width="12" height="8" rx="4" fill="${ink}" stroke="${bg}" stroke-width="1.8"/><circle cx="${x+w-3.8}" cy="${y+12}" r="1.7" fill="${bg}"/>`;
const cuff=(ink,cx,cy,rot)=>`<rect x="${cx-4}" y="${cy-8.5}" width="8" height="17" rx="2.6" transform="rotate(${rot} ${cx} ${cy})" fill="${ink}"/>`;
const V={
 A:{t:'א · ג-יד: שרוול → ראש=אצבעות, רגל=אגודל, המטבע נופל לארנק',f:(ink,g,bg)=>cuff(ink,53.6,4.2,45)+`<path d="${L.gimel}" fill="${ink}"/><circle cx="21" cy="47" r="6.4" fill="${g}"/>`+wallet(ink,bg,-2,56)},
 B:{t:'ב · אותו דבר, השרוול אופקי (היד נכנסת מימין)',f:(ink,g,bg)=>`<rect x="51" y="6.5" width="8" height="18" rx="2.6" fill="${ink}"/>`+`<path d="${L.gimel}" fill="${ink}"/><circle cx="21" cy="47" r="6.4" fill="${g}"/>`+wallet(ink,bg,-2,56)},
 C:{t:'ג · השרוול מעל העמוד (היד יורדת מלמעלה)',f:(ink,g,bg)=>`<rect x="38" y="-6" width="12" height="8" rx="2.6" fill="${ink}"/>`+`<path d="${L.gimel}" fill="${ink}"/><circle cx="21" cy="47" r="6.4" fill="${g}"/>`+wallet(ink,bg,-2,56)},
};
const t=(k,bg,ink,g,px)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}"><rect width="64" height="64" rx="14" fill="${bg}"/><g class="m">${V[k].f(ink,g,bg)}</g></svg>`;
writeFileSync('h15.html',`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;padding:20px;background:#eef0f3;font-family:Arial"><h2 style="margin:0 0 12px">גבי — היד היא ה-ג: שרוול, ג, מטבע, ארנק</h2>${Object.keys(V).map(k=>`<div style="display:flex;gap:14px;align-items:end;margin-bottom:14px;background:#fff;padding:12px;border-radius:12px"><b style="width:170px">${V[k].t}</b>${t(k,C,N,GL,160)}${t(k,N,C,G,160)}${t(k,N,C,G,48)}${t(k,N,C,G,32)}${t(k,N,C,G,16)}</div>`).join('')}</body>`);
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:820,height:720},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/h15.html');
await p.evaluate(()=>{for(const g of document.querySelectorAll('g.m')){const b=g.getBBox();const k=Math.min(50/b.width,50/b.height);g.setAttribute('transform',`translate(${32-k*(b.x+b.width/2)} ${32-k*(b.y+b.height/2)}) scale(${k})`);}});
await p.screenshot({path:'h15.png',fullPage:true});await b.close();
