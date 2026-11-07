import {writeFileSync} from 'fs'; import {createRequire} from 'module';
const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
const cap=(x1,y1,x2,y2,w,ink)=>`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${ink}" stroke-width="${w}" stroke-linecap="round"/>`;
// יד פתוחה מלמעלה-ימין: שרוול, כף, 3 אצבעות נפרדות פרושות מטה-שמאלה, אגודל נפרד — משחררת את המטבע לפתח הארנק
const hand=(ink,bg,o={})=>{const a=o.a??0;return `<g transform="rotate(${a} 44 20)">`+
 `<rect x="47" y="2" width="8" height="15" rx="2.6" transform="rotate(-42 51 9.5)" fill="${ink}"/>`+   // שרוול
 `<ellipse cx="41.5" cy="21" rx="9.5" ry="7.2" transform="rotate(-42 41.5 21)" fill="${ink}"/>`+     // כף
 cap(37.5,27.2,31.5,35.5,4.4,ink)+cap(41.5,28.6,37.2,38.6,4.4,ink)+cap(45.4,28.4,43.4,37,4.4,ink)+ // אצבעות
 cap(34,20.5,26.5,24.5,4.6,ink)+                                                                    // אגודל
 `</g>`;};
const wallet=(ink,bg,x,y,w=30,h=18)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${ink}"/><rect x="${x+w-8}" y="${y+h/2-3.2}" width="10" height="6.4" rx="3.2" fill="${ink}" stroke="${bg}" stroke-width="1.6"/><circle cx="${x+w-3.6}" cy="${y+h/2}" r="1.4" fill="${bg}"/>`;
// המטבע נכנס לפתח: חצי עליון גלוי מעל שפת הארנק, טבעת ברקע מפרידה
const coinIn=(cx,cy,r,g,bg)=>`<circle cx="${cx}" cy="${cy}" r="${r+1.6}" fill="${bg}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}"/>`;
const V={
 A:{t:'א · אצבעות פרושות, המטבע נופל לפתח',f:(ink,g,bg)=>wallet(ink,bg,8,44)+`<rect x="12" y="44" width="22" height="2.6" rx="1.3" fill="${bg}"/>`+coinIn(23,41.5,5.8,g,bg)+`<rect x="8" y="46.6" width="30" height="15.4" rx="0" fill="${ink}" opacity="0"/>`+hand(ink,bg)},
 B:{t:'ב · המטבע חצי בתוך הארנק',f:(ink,g,bg)=>coinIn(23,44,5.8,g,bg)+`<g>${wallet(ink,bg,8,46)}</g>`+hand(ink,bg)},
 C:{t:'ג · המטבע באוויר בין האצבעות לארנק',f:(ink,g,bg)=>wallet(ink,bg,8,48)+`<circle cx="25" cy="41" r="5.8" fill="${g}"/>`+hand(ink,bg)},
};
const t=(k,bg,ink,g,px)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}"><rect width="64" height="64" rx="14" fill="${bg}"/><g class="m">${V[k].f(ink,g,bg)}</g></svg>`;
writeFileSync('f1.html',`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;padding:20px;background:#eef0f3;font-family:Arial"><h2 style="margin:0 0 12px">גבי — יד פתוחה משחררת את המטבע לארנק</h2>${Object.keys(V).map(k=>`<div style="display:flex;gap:14px;align-items:end;margin-bottom:14px;background:#fff;padding:12px;border-radius:12px"><b style="width:150px">${V[k].t}</b>${t(k,C,N,GL,160)}${t(k,N,C,G,160)}${t(k,'#FFFFFF','#000','#000',96)}${t(k,N,C,G,48)}${t(k,N,C,G,32)}</div>`).join('')}</body>`);
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:860,height:700},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/f1.html');
await p.evaluate(()=>{for(const g of document.querySelectorAll('g.m')){const b=g.getBBox();const k=Math.min(50/b.width,50/b.height);g.setAttribute('transform',`translate(${32-k*(b.x+b.width/2)} ${32-k*(b.y+b.height/2)}) scale(${k})`);}});
await p.screenshot({path:'f1.png',fullPage:true});await b.close();
