import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as M from './concepts-r18.mjs';
const { R18, C, VARIANTS, svgR18, lockupSvg, tileSvg, favPixel, favHinted } = M; const favBig = favHinted;
const out = new URL('../../docs/brand/concepts/round18/', import.meta.url);
mkdirSync(out, { recursive: true });
const w = (n, s) => writeFileSync(new URL(n, out), s + '\n');
for (const v of Object.keys(VARIANTS)) w(`${R18.id}-${v}.svg`, svgR18(v, 512));
w('app-icon-1024.svg', tileSvg(1024)); w('ios-dark-1024.svg', M.iosDarkSvg());
w('android-adaptive-foreground.svg', M.adaptiveFg()); w('android-adaptive-background.svg', M.adaptiveBg()); w('android-monochrome.svg', M.adaptiveMono());
w('favicon-16-pixel-master.svg', favPixel(16)); w('favicon-32-hinted.svg', favHinted(32));
w('lockup-light.svg', lockupSvg(C.navy, C.greenOnLight)); w('lockup-dark.svg', lockupSvg(C.cream, C.green));
const darkish = v => v.includes('dark');
const label = { 'light': 'נייבי על קרם', 'dark': 'קרם על נייבי', 'mono-light': 'שחור על לבן', 'mono-dark': 'לבן על שחור' };
const CHROME = ['#FFFFFF', '#DEE1E6', '#202124', '#35363A'];
const sms = `<div style="display:flex;gap:16px;flex-wrap:wrap"><div class="sms"><div class="bubble"><div class="from"><b>StudioNoa</b> · SMS</div>סטודיו נועה: שלום דני, חשבונית 1043 ע״ס 1,800 ₪ טרם סומנה כשולמה. לתשלום: gabi.example/p/7Kq2 להפסקה: בקישור</div><small>ב-SMS השולח הוא העסק. גבי לא מופיעה.</small></div>
<div class="sms" style="background:#f1f5f9"><div class="bubble"><div class="from"><b>סטודיו נועה</b> &lt;noa@example.com&gt;</div>שלום דני, זו תזכורת ידידותית לחשבונית 1043…<div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;color:#475569">${lockupSvg(C.navy, C.greenOnLight, 20)} · תזכורות תשלום</div></div><small>במייל: חתימה קטנה (סימן-המילה) בתחתית.</small></div></div>`;
const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>גבי — סבב 18</title><style>
body{margin:0;font-family:Heebo,Arial,sans-serif;background:#eef0f3;color:${C.navy}}h1{font-size:24px;margin:20px 24px 4px}.sub{margin:0 24px 12px;color:#475569}
section{background:#fff;margin:12px 24px;border-radius:16px;padding:16px}.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
.theme{display:flex;align-items:flex-end;gap:16px;padding:14px;border-radius:12px;border:1px solid #0001;overflow:hidden}.cell{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px}.cell span{opacity:.7}
.tag{margin-inline-start:auto;font-size:12px}.lockup small{font-size:12px;opacity:.7}
.sms{background:#e5e7eb;border-radius:14px;padding:12px;max-width:360px}.bubble{background:#fff;border-radius:14px;padding:10px 12px;font-size:14px;line-height:1.5}.from{display:flex;gap:6px;align-items:center;font-size:12px;margin-bottom:4px}
.ios{border-radius:22.37%;overflow:hidden;display:block}
</style><h1>גבי — סבב 18: «${R18.name}»</h1><p class="sub">${R18.story}</p>
<section><div class="grid">${Object.keys(VARIANTS).map(v => `<div class="theme" style="background:${VARIANTS[v].bg};color:${darkish(v) ? C.cream : C.navy}">${[160, 64, 32, 24].map(px =>
  `<div class="cell"><div style="width:${px}px;height:${px}px">${svgR18(v, px)}</div><span>${px === 160 ? 512 : px}</span></div>`).join('')}<span class="tag">${label[v]}</span></div>`).join('')}
${['#FBF8F1', '#2C2C2E'].map(bg => `<div class="theme" style="background:${bg};color:${bg === '#2C2C2E' ? C.cream : C.navy}">${[160, 120, 60].map(px => `<div class="cell"><div class="ios" style="width:${px}px;height:${px}px">${tileSvg(px)}</div><span>${px}</span></div>`).join('')}<span class="tag">אריח (מסכת iOS) · ${bg}</span></div>`).join('')}
<div class="theme" style="background:#1C1C1E;color:${C.cream}">${[120, 60].map(px => `<div class="cell"><div class="ios" style="width:${px}px;height:${px}px;background:linear-gradient(#3A3A3C,#1C1C1E)">${M.iosDarkSvg().replace('width="1024" height="1024"', `width="${px}" height="${px}"`)}</div><span>${px}</span></div>`).join('')}<span class="tag">iOS מצב כהה (המערכת מציירת לוחית)</span></div>
<div class="theme" style="background:#FBF8F1">${[[120, '50%', 'עיגול'], [120, '28%', 'סקווירקל'], [60, '50%', 'עיגול']].map(([px, r, n]) => `<div class="cell"><div style="width:${px}px;height:${px}px;border-radius:${r};overflow:hidden;background:${C.navy}">${M.adaptiveFg().replace('width="432" height="432"', `width="${px}" height="${px}"`)}</div><span>${n} ${px}</span></div>`).join('')}<span class="tag">Android adaptive (חזית+רקע)</span></div>
${CHROME.map(bg => `<div class="theme" style="background:${bg};color:${['#202124', '#35363A'].includes(bg) ? C.cream : C.navy}"><div class="cell">${favPixel(64)}<span>16 (מוגדל ×4)</span></div><div class="cell">${favPixel(16)}<span>16</span></div><div class="cell">${favBig(32)}<span>32</span></div><div class="cell">${favBig(48)}<span>48</span></div><span class="tag">פאביקון · ${bg}</span></div>`).join('')}
<div class="theme" style="background:${C.cream}"><div class="lockup"><div>${lockupSvg(C.navy, C.greenOnLight, 80)}<small style="display:block;text-align:center">תזכורות תשלום</small></div></div><span class="tag">סימן-המילה (ראשי)</span></div>
<div class="theme" style="background:${C.navy};color:${C.cream}"><div class="lockup"><div>${lockupSvg(C.cream, C.green, 80)}<small style="display:block;text-align:center">תזכורות תשלום</small></div></div><span class="tag">סימן-המילה · כהה</span></div>
<div class="theme" style="background:#2C2C2E;color:#FBF8F1">${[60, 120].map(px => `<div class="cell"><div style="position:relative;width:${px}px;height:${px}px"><div class="ios" style="width:${px}px;height:${px}px">${tileSvg(px)}</div><div style="position:absolute;top:-6px;right:-6px;min-width:${px / 3.5}px;height:${px / 3.5}px;border-radius:99px;background:#FF3B30;color:#fff;font:600 ${px / 6}px/ ${px / 3.5}px Arial;text-align:center">3</div></div><span>${px}</span></div>`).join('')}<span class="tag">עם תג-התראה של iOS — הדגש בתוך האות, לא בפינה</span></div>
</div></section><section><b>איפה החייב פוגש את המותג</b> ${sms}</section></html>`;
w('board.html', html);
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto(new URL('board.html', out).href); await p.screenshot({ path: new URL('board.png', out).pathname, fullPage: true });
// פאביקונים בפיקסלים אמיתיים על כרום
const t = await b.newPage({ viewport: { width: 4 * 90 + 10, height: 50 }, deviceScaleFactor: 1 });
await t.setContent(`<body style="margin:5px;display:flex;gap:0">${CHROME.map(bg => `<div style="display:flex;gap:6px;align-items:center;padding:6px;background:${bg};width:78px">${favPixel(16)}${favBig(32)}</div>`).join('')}</body>`);
await t.screenshot({ path: new URL('favicons-actual-px.png', out).pathname });
// PNG fallbacks
for (const [px, svg] of [[16, favPixel(16)], [32, favBig(32)], [48, favBig(48)], [180, tileSvg(180)]]) {
  const q = await b.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  await q.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  await q.screenshot({ path: new URL(px === 180 ? 'apple-touch-icon-180.png' : `favicon-${px}.png`, out).pathname, omitBackground: true });
}
await b.close(); console.log('✓ round18');
