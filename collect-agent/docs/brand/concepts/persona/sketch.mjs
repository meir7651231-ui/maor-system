const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
// בסיס: ראש עגול + כתפיים (סוודר) — הדמות מהתמונה, מצוירת בקו אחד
const bust=(ink)=>`<circle cx="50" cy="34" r="17" fill="${ink}"/><path d="M14 92 C14 66 30 56 50 56 C70 56 86 66 86 92 Z" fill="${ink}"/>`;
const smile=(bg,w=3.2)=>`<path d="M42 37 Q50 44 58 37" fill="none" stroke="${bg}" stroke-width="${w}" stroke-linecap="round"/>`;
const eyes=(bg)=>`<circle cx="44" cy="30" r="2.1" fill="${bg}"/><circle cx="56" cy="30" r="2.1" fill="${bg}"/>`;
const V={
 A:{t:'א · חיוך בלבד',d:'ראש+כתפיים, רק החיוך — הרגע "אל תדאג, אני מטפל". ירוק = הטלפון ביד',f:(bg,g,ink)=>bust(ink)+smile(bg)+`<rect x="58" y="70" width="11" height="17" rx="2.5" fill="${g}"/>`},
 B:{t:'ב · מבט + חיוך',d:'קשר-עין כמו בתמונה — עיניים וחיוך, צווארון-עגול ירוק (הסוודר)',f:(bg,g,ink)=>bust(ink)+smile(bg)+eyes(bg)+`<path d="M38 57.5 Q50 67 62 57.5" fill="none" stroke="${g}" stroke-width="4" stroke-linecap="round"/>`},
 C:{t:'ג · הצווארון הוא החיוך',d:'בלי פנים: ראש + כתפיים, והצווארון הירוק מתעקל כחיוך — אדם רגוע ומחייך במינימום',f:(bg,g,ink)=>bust(ink)+`<path d="M37 58 Q50 70 63 58" fill="none" stroke="${g}" stroke-width="5" stroke-linecap="round"/>`},
};
const tile=(k,bg,g,px,ink=N)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${px}" height="${px}"><rect width="100" height="100" rx="22" fill="${bg}"/>${V[k].f(bg,g,ink)}</svg>`;
const html=`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;background:#EEF0F4;font-family:Rubik,Arial;padding:24px">
<h2 style="margin:0 0 4px">גבי — מהתמונה ללוגו (סקיצות)</h2><div style="color:#475569;margin-bottom:16px">מה שהתמונה אומרת: אדם רגוע, מחייך, מסתכל עליך — "אני מטפל בזה בשבילך". ירוק אחד בלבד, כמו הטלפון.</div>
${Object.keys(V).map(k=>`<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:22px">
<div style="width:230px"><b>${V[k].t}</b><div style="font-size:13px;color:#475569;margin-top:6px">${V[k].d}</div></div>
${tile(k,C,GL,160)}${tile(k,N,G,160,C)}
<div style="display:flex;gap:10px;align-items:end">${tile(k,C,GL,48)}${tile(k,C,GL,24)}${tile(k,C,GL,16)}</div></div>`).join('')}
</body></html>`;
import {writeFileSync} from 'fs'; writeFileSync('sketch.html',html);
import {createRequire} from 'module'; const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright'); const b=await chromium.launch(); const p=await b.newPage({viewport:{width:900,height:800},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/sketch.html'); await p.screenshot({path:'sketch.png',fullPage:true}); await b.close(); console.log('ok');
