import {writeFileSync} from 'fs'; import {createRequire} from 'module';
const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
const V={
 A:{t:'א · מגש-חיוך',d:'קו אחד מעוקל — כף יד פתוחה, מגש וחיוך בבת אחת — ועליו המטבע הירוק. "הנה, בבקשה"',
  f:(ink,g)=>`<path d="M20 56 Q50 88 80 56" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round"/><circle cx="50" cy="48" r="13" fill="${g}"/>`},
 B:{t:'ב · וי שמחזיק כסף',d:'"טיפלתי בזה" (וי) + "הנה הכסף" (המטבע יושב בתוך הוי, כמו בכף יד)',
  f:(ink,g)=>`<path d="M20 50 L40 70 L82 26" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><circle cx="43" cy="44" r="10" fill="${g}"/>`},
 C:{t:'ג · יד מושטת',d:'כף יד פתוחה מושטת אליך מהצד, המטבע על כף היד — רגע המסירה עצמו',
  f:(ink,g)=>`<path d="M14 63 Q14 55 22 55 L60 55 Q68 55 73 60 L90 77 L79 88 L63 73 Q59 71 53 71 L22 71 Q14 71 14 63 Z" fill="${ink}"/><path d="M58 56 L50 42" stroke="${ink}" stroke-width="9" stroke-linecap="round"/><circle cx="32" cy="42" r="10.5" fill="${g}"/>`},
};
const tile=(k,bg,ink,g,px)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${px}" height="${px}"><rect width="100" height="100" rx="22" fill="${bg}"/>${V[k].f(ink,g)}</svg>`;
const word=(ink,g,h)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 100" height="${h}" width="${h*1.9}">
 <g transform="translate(90 0)">${V.B.f(ink,g)}</g>
 <path d="M14 22 H44 Q56 22 56 34 V76 M14 76 H66" fill="none" stroke="${ink}" stroke-width="14" stroke-linecap="round" transform="translate(28 0)"/>
 <path d="M16 22 H22 Q30 22 30 30 V42" fill="none" stroke="${ink}" stroke-width="14" stroke-linecap="round"/></svg>`;
const row=k=>`<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:22px">
<div style="width:230px"><b>${V[k].t}</b><div style="font-size:13px;color:#475569;margin-top:6px">${V[k].d}</div></div>
${V[k].word? `<div style="background:${C};padding:14px;border-radius:14px">${word(N,GL,110)}</div><div style="background:${N};padding:14px;border-radius:14px">${word(C,G,110)}</div><div style="background:${C};padding:6px;border-radius:8px">${word(N,GL,32)}</div>`
 : `${tile(k,C,N,GL,160)}${tile(k,N,C,G,160)}<div style="display:flex;gap:10px;align-items:end">${tile(k,C,N,GL,48)}${tile(k,C,N,GL,24)}${tile(k,C,N,GL,16)}</div>`}</div>`;
writeFileSync('give2.html',`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;background:#EEF0F4;font-family:Rubik,Arial;padding:24px">
<h2 style="margin:0 0 4px">גבי — «טיפלתי בזה. הנה הכסף.» · בלי ג׳ (סקיצות)</h2><div style="color:#475569;margin-bottom:16px">הרגע של המסירה: מישהו מושיט לך את הכסף שלך — העבודה כבר נעשתה.</div>
${Object.keys(V).map(row).join('')}</body></html>`);
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright'); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:800},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/give2.html'); await p.screenshot({path:'give2.png',fullPage:true}); await b.close(); console.log('ok');
