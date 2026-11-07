import {writeFileSync} from 'fs'; import {createRequire} from 'module';
const N='#0F172A',G='#10B981',GL='#059669',C='#FBF8F1';
// כף יד מקומרת (מילוי אחד), אגודל נוטה אל המטבע, שרוול נפרד בפרק (הסוודר של גבי)
const hand=`M9 31 C9 28.5 12.5 27.8 14 30 C16.5 35 20.5 37.8 26 37.8 C31 37.8 34.5 35.5 36.6 31.5 L35 22.5 C34.7 20.2 37.6 19 39 20.8 L42.4 30.5 C43.2 32.6 45 33.8 47.5 34.2 L52 35 L52 46.6 C45 46.6 40 46.4 35 46.6 C22 47.2 12 42 9.5 35 C9.2 33.8 9 32.4 9 31 Z`;
const handNoThumb=`M9 31 C9 28.5 12.5 27.8 14 30 C16.5 35 20.5 37.8 26 37.8 C31 37.8 34.5 35.5 36.6 31.5 C38.4 28.6 41.6 28.4 43.4 30.6 C44.6 32.4 45.6 33.8 47.5 34.2 L52 35 L52 46.6 C45 46.6 40 46.4 35 46.6 C22 47.2 12 42 9.5 35 C9.2 33.8 9 32.4 9 31 Z`;
const cuff=ink=>`<rect x="54.2" y="33" width="6.6" height="16" rx="2.4" fill="${ink}"/>`;
const V={
 A:{t:'א · כף + אגודל + שרוול',f:(ink,g)=>`<path d="${hand}" fill="${ink}"/>${cuff(ink)}<circle cx="25.5" cy="27" r="8" fill="${g}"/>`},
 B:{t:'ב · כף + שרוול (אגודל עגול)',f:(ink,g)=>`<path d="${handNoThumb}" fill="${ink}"/>${cuff(ink)}<circle cx="25.5" cy="27" r="8" fill="${g}"/>`},
 C:{t:'ג · כף + אגודל, בלי שרוול',f:(ink,g)=>`<path d="${hand.replace('L52 35 L52 46.6','C50 34.6 52.5 35.5 53.2 38.5 C54 41.6 54 44 52 46.6')}" fill="${ink}"/><circle cx="25.5" cy="27" r="8" fill="${g}"/>`},
};
const t=(k,bg,ink,g,px)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}"><rect width="64" height="64" rx="14" fill="${bg}"/><g transform="translate(-3 -1.5)">${V[k].f(ink,g)}</g></svg>`;
writeFileSync('h4.html',`<!doctype html><html dir="rtl"><meta charset="utf8"><body style="margin:0;padding:20px;background:#eef0f3;font-family:Arial"><h2 style="margin:0 0 12px">גבי — חידוד: כף היד המגישה</h2>${Object.keys(V).map(k=>`<div style="display:flex;gap:14px;align-items:end;margin-bottom:14px;background:#fff;padding:12px;border-radius:12px"><b style="width:150px">${V[k].t}</b>${t(k,C,N,GL,160)}${t(k,N,C,G,160)}${t(k,N,C,G,48)}${t(k,N,C,G,32)}${t(k,N,C,G,16)}</div>`).join('')}</body>`);
const {chromium}=createRequire(process.env.NODE_PATH+'/')('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:820,height:700},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/h4.html');await p.screenshot({path:'h4.png',fullPage:true});await b.close();
