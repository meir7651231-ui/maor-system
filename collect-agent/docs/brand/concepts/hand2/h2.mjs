import {writeFileSync} from 'fs'; import {createRequire} from 'module';
const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
// כף יד פתוחה בפרופיל, אצבעות שמאלה (אל הקורא ב-RTL), אגודל מורם, מטבע מונח על כף היד
const hand=`M8.5 31.5 C8.5 29.2 10.6 28 12.6 29 C15 30.4 16.6 34.2 20.5 36 C24.5 37.8 30 37.8 34 36 C36.4 35 37.6 33 38.6 30.6 C39.6 28.2 42.4 27.6 44.2 29.2 C45.6 30.5 45.6 32.6 44.8 34.4 C44.2 35.8 45 37 46.6 37.4 L66 41 L66 55 L46 51.6 C40 50.6 34 50.6 27 50 C17 49.2 10.6 44 9 37.6 Z`;
const coin=(cx,cy,r,g,bg,ring)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${g}"/>`+(ring?`<circle cx="${cx}" cy="${cy}" r="${r*0.64}" fill="none" stroke="${bg}" stroke-width="${r*0.15}"/>`:'');
const V={
 H1:{t:'יד מגישה · מטבע מלא',f:(ink,g,bg)=>`<path d="${hand}" fill="${ink}"/>${coin(27,27,8,g,bg,false)}`},
 H2:{t:'יד מגישה · מטבע עם שפה',f:(ink,g,bg)=>`<path d="${hand}" fill="${ink}"/>${coin(27,27,8,g,bg,true)}`},
 H3:{t:'יד מגישה · המטבע בדרך אליך',f:(ink,g,bg)=>`<path d="${hand}" fill="${ink}"/>${coin(24,22.5,8,g,bg,true)}<path d="M14 14 Q18 11.5 22 12" fill="none" stroke="${g}" stroke-width="2.4" stroke-linecap="round"/>`},
};
const t=(k,bg,ink,g,px)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}"><defs><clipPath id="c${k}${px}${bg.slice(1)}"><rect width="64" height="64" rx="14"/></clipPath></defs><g clip-path="url(#c${k}${px}${bg.slice(1)})"><rect width="64" height="64" fill="${bg}"/>${V[k].f(ink,g,bg)}</g></svg>`;
writeFileSync('h2.html',`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;padding:20px;background:#eef0f3;font-family:Arial"><h2 style="margin:0 0 12px">גבי — סבב 2: כף יד מגישה את הכסף (סקיצות)</h2>${Object.keys(V).map(k=>`<div style="display:flex;gap:14px;align-items:end;margin-bottom:14px;background:#fff;padding:12px;border-radius:12px"><b style="width:150px">${V[k].t}</b>${t(k,C,N,GL,160)}${t(k,N,C,G,160)}${t(k,N,C,G,48)}${t(k,N,C,G,32)}${t(k,N,C,G,16)}</div>`).join('')}</body>`);
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:820,height:700},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/h2.html');await p.screenshot({path:'h2.png',fullPage:true});await b.close();
