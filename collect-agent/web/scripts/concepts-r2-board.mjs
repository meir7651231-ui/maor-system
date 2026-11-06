import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { R2, C, svgR2, BG } from './concepts-r2.mjs';
const out = new URL('../../docs/brand/concepts/round2/', import.meta.url);
mkdirSync(out, { recursive: true });
const V = ['light', 'dark', 'mono-light', 'mono-dark'];
for (const c of R2) for (const v of V) writeFileSync(new URL(`${c.id}-${v}.svg`, out), svgR2(c, v, 512) + '\n');
const row = c => `<section><header><b>${R2.indexOf(c) + 1}. ${c.name}</b><p>${c.story}</p></header><div class="grid">${V.map(v =>
  `<div class="theme" style="background:${BG[v]};color:${v.includes('dark') ? C.cream : C.navy}">${[160, 64, 24, 16].map(px =>
    `<div class="cell"><div style="width:${px}px;height:${px}px">${svgR2(c, v, px)}</div><span>${px === 160 ? 512 : px}</span></div>`).join('')}
    ${v === 'light' || v === 'dark' ? `<div class="lockup">${svgR2(c, v, 40)}<div><b>גבי</b><small>תזכורות תשלום</small></div></div>` : `<div class="lockup"><small>${v.startsWith('mono') ? 'צבע אחד' : ''}</small></div>`}</div>`).join('')}</div></section>`;
const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>גבי — סבב 2</title><style>
body{margin:0;font-family:Heebo,Arial,sans-serif;background:#eef0f3;color:${C.navy}}h1{font-size:24px;margin:20px 24px 4px}.sub{margin:0 24px 12px;color:#475569}
section{background:#fff;margin:14px 24px;border-radius:16px;padding:14px}header p{margin:4px 0 10px;color:#475569}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.theme{display:flex;align-items:flex-end;gap:16px;padding:14px;border-radius:12px;border:1px solid #0001}
.cell{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;opacity:.85}.lockup{display:flex;align-items:center;gap:8px;margin-inline-start:auto}.lockup b{display:block;font-size:22px}.lockup small{font-size:11px;opacity:.7}
</style><h1>גבי — סבב 2: 3 כיוונים (אחרי ביקורת עוינת)</h1><p class="sub">בהיר: ירוק נגיש ${C.greenA11y} על קרם · כהה: ${C.green} על נייבי · צבע אחד: נייבי/קרם · גדלים 512 (מוצג 160) / 64 / 24 / 16</p>
${R2.map(row).join('')}</html>`;
writeFileSync(new URL('board.html', out), html);
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto(new URL('board.html', out).href); await p.screenshot({ path: new URL('board.png', out).pathname, fullPage: true });
const t = await b.newPage({ viewport: { width: R2.length * 34 * 2 + 10, height: 4 * 34 + 10 }, deviceScaleFactor: 1 });
await t.setContent(`<body style="margin:5px;display:grid;grid-template-columns:repeat(${R2.length * 2},34px)">${V.map(v => R2.map(c => [24, 16].map(px =>
  `<div style="width:34px;height:34px;display:grid;place-items:center;background:${BG[v]}">${svgR2(c, v, px)}</div>`).join('')).join('')).join('')}</body>`);
await t.screenshot({ path: new URL('actual-24-16px.png', out).pathname });
await b.close(); console.log('✓ round2 board');
