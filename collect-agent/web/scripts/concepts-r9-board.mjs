import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { R9, C, VARIANTS, svgR9, lockupSvg } from './concepts-r9.mjs';
const out = new URL('../../docs/brand/concepts/round9/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const v of Object.keys(VARIANTS)) writeFileSync(new URL(`${R9.id}-${v}.svg`, out), svgR9(v, 512) + '\n');
const label = { 'light': 'נייבי על קרם', 'dark': 'קרם על נייבי', 'mono-light': 'שחור על לבן', 'mono-dark': 'לבן על שחור', 'app-icon': 'אריח · מערכת בהירה', 'app-icon-darkos': 'אותו אריח · מערכת כהה #2C2C2E' };
const sms = `<div style="display:flex;gap:16px;flex-wrap:wrap"><div class="sms"><div class="bubble"><div class="from"><b>StudioNoa</b> · SMS</div>סטודיו נועה: שלום דני, חשבונית 1043 ע״ס 1,800 ₪ טרם סומנה כשולמה. לתשלום: gabi.example/p/7Kq2 להפסקה: בקישור</div><small>ב-SMS השולח הוא העסק. גבי לא מופיעה.</small></div>
<div class="sms" style="background:#f1f5f9"><div class="bubble"><div class="from"><b>סטודיו נועה</b> &lt;noa@example.com&gt;</div>שלום דני, זו תזכורת ידידותית לחשבונית 1043…<div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11px;color:#475569">${svgR9('light', 16)} נשלח באמצעות גבי · תזכורות תשלום</div></div><small>במייל: חתימה קטנה בתחתית.</small></div></div>`;
const lockup = (v, ink) => lockupSvg(ink, v === 'dark' ? C.green : C.greenA11y, 70);
const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>גבי — סבב 9</title><style>
@font-face{font-family:RubikL;font-weight:800;src:url(../../../../web/node_modules/@fontsource/rubik/files/rubik-hebrew-800-normal.woff2)}body{margin:0;font-family:Heebo,Arial,sans-serif;background:#eef0f3;color:${C.navy}}h1{font-size:24px;margin:20px 24px 4px}.sub{margin:0 24px 12px;color:#475569}
section{background:#fff;margin:14px 24px;border-radius:16px;padding:14px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.theme{display:flex;align-items:flex-end;gap:16px;padding:14px;border-radius:12px;border:1px solid #0001}.cell{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px}.cell span{opacity:.7}
.tag{margin-inline-start:auto;font-size:12px}.lockup{display:flex;align-items:center;gap:10px}.lockup b{display:block;font-size:26px}.lockup small{font-size:12px;opacity:.7}
.sms{background:#e5e7eb;border-radius:14px;padding:12px;max-width:360px}.bubble{background:#fff;border-radius:14px;padding:10px 12px;font-size:14px;line-height:1.5}.from{display:flex;gap:6px;align-items:center;font-size:12px;margin-bottom:4px}
</style><h1>גבי — סבב 9: «${R9.name}»</h1><p class="sub">${R9.story}</p>
<section><div class="grid">${Object.keys(VARIANTS).map(v => `<div class="theme" style="background:${VARIANTS[v].bg};color:${['dark', 'mono-dark', 'app-icon-darkos'].includes(v) ? C.cream : C.navy}">${[160, 64, 32, 24, 16].map(px =>
  `<div class="cell"><div style="width:${px}px;height:${px}px">${svgR9(v, px)}</div><span>${px === 160 ? 512 : px}</span></div>`).join('')}<span class="tag">${label[v]}</span></div>`).join('')}
<div class="theme" style="background:${C.cream}"><div class="lockup"><div>${lockup('light', C.navy)}<small style="display:block;text-align:center">תזכורות תשלום</small></div></div><span class="tag">שילוב עם השם</span></div>
<div class="theme" style="background:${C.navy};color:${C.cream}"><div class="lockup"><div>${lockup('dark', C.cream)}<small style="display:block;text-align:center">תזכורות תשלום</small></div></div><span class="tag">שילוב עם השם · כהה</span></div>
</div></section><section><b>איפה החייב פוגש את המותג</b> ${sms}</section></html>`;
writeFileSync(new URL('board.html', out), html);
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto(new URL('board.html', out).href); await p.screenshot({ path: new URL('board.png', out).pathname, fullPage: true });
const V = Object.keys(VARIANTS); const BG = { ...Object.fromEntries(V.map(v => [v, VARIANTS[v].bg])) };
const t = await b.newPage({ viewport: { width: V.length * 34 + 10, height: 2 * 34 + 10 }, deviceScaleFactor: 1 });
await t.setContent(`<body style="margin:5px;display:grid;grid-template-columns:repeat(${V.length},34px)">${[24, 16].map(px => V.map(v =>
  `<div style="width:34px;height:34px;display:grid;place-items:center;background:${VARIANTS[v].bg}">${svgR9(v, px)}</div>`).join('')).join('')}</body>`);
await t.screenshot({ path: new URL('actual-24-16px.png', out).pathname });
await b.close(); console.log('✓ round9');
