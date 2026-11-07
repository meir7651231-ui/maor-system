import {writeFileSync} from 'fs'; import {createRequire} from 'module';
const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
const cap=(x1,y1,x2,y2,w,ink)=>`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${ink}" stroke-width="${w}" stroke-linecap="round"/>`;
// יד פתוחה מלמעלה-ימין: שרוול, כף, 3 אצבעות נפרדות פרושות מטה-שמאלה, אגודל נפרד — משחררת את המטבע לפתח הארנק
// יד פתוחה (בלי שרוול נפרד — פרק-כף מחובר), אצבעות נפרדות; המטבע חצי בתוך הארנק עם רווח 3
const hand=(ink,bg,o={})=>{const cuff=o.cuff??'none';return `<g>`+
 (cuff==='joined'?`<path d="M44 21 L55.5 8.5" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`:'')+
 (cuff==='none'?`<path d="M44 21 L52 12" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>`:'')+
 `<ellipse cx="41.5" cy="21" rx="9.5" ry="7.2" transform="rotate(-42 41.5 21)" fill="${ink}"/>`+
 cap(37.5,27.2,31.5,35.5,4.4,ink)+cap(41.5,28.6,37.2,38.6,4.4,ink)+cap(45.4,28.4,43.4,37,4.4,ink)+
 cap(34,20.5,26.5,24.5,4.6,ink)+`</g>`;};
const wallet=(ink,bg,x,y,w=30,h=18)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${ink}"/><rect x="${x+w-9}" y="${y+h/2-3.4}" width="9" height="6.8" rx="3.4" fill="${bg}"/><circle cx="${x+w-4.6}" cy="${y+h/2}" r="1.7" fill="${ink}"/>`;
// מטבע חצי בתוך הארנק: נחתך 3 יח׳ מעל שפת הארנק
const coinIn=(cx,wy,r,g)=>`<clipPath id="c${Math.round(wy*10)}"><rect x="-100" y="-100" width="300" height="${100+wy-3}"/></clipPath><circle cx="${cx}" cy="${wy}" r="${r}" fill="${g}" clip-path="url(#c${Math.round(wy*10)})"/>`;
const V={
 A:{t:'א · יד פתוחה, פרק-כף קצר, מטבע חצי בפנים (רווח 3)',f:(ink,g,bg)=>wallet(ink,bg,8,46)+coinIn(23,46,7,g)+hand(ink,bg,{cuff:'none'})},
 B:{t:'ב · אותו דבר, זרוע ארוכה יותר',f:(ink,g,bg)=>wallet(ink,bg,8,46)+coinIn(23,46,7,g)+hand(ink,bg,{cuff:'joined'})},
 C:{t:'ג · המטבע מתחת לאצבעות, הארנק קרוב',f:(ink,g,bg)=>wallet(ink,bg,10,44)+coinIn(28,44,7,g)+hand(ink,bg,{cuff:'none'})},
};
const t=(k,bg,ink,g,px)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}"><rect width="64" height="64" rx="14" fill="${bg}"/><g class="m">${V[k].f(ink,g,bg)}</g></svg>`;
writeFileSync('f2.html',`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;padding:20px;background:#eef0f3;font-family:Arial"><h2 style="margin:0 0 12px">גבי — יד פתוחה (בלי פטיש) · מטבע חצי בתוך הארנק</h2>${Object.keys(V).map(k=>`<div style="display:flex;gap:14px;align-items:end;margin-bottom:14px;background:#fff;padding:12px;border-radius:12px"><b style="width:150px">${V[k].t}</b>${t(k,C,N,GL,160)}${t(k,N,C,G,160)}${t(k,'#FFFFFF','#000','#000',96)}${t(k,N,C,G,48)}${t(k,N,C,G,32)}</div>`).join('')}</body>`);
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:860,height:700},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/f2.html');
await p.evaluate(()=>{for(const g of document.querySelectorAll('g.m')){const b=g.getBBox();const k=Math.min(50/b.width,50/b.height);g.setAttribute('transform',`translate(${32-k*(b.x+b.width/2)} ${32-k*(b.y+b.height/2)}) scale(${k})`);}});
await p.screenshot({path:'f2.png',fullPage:true});await b.close();
