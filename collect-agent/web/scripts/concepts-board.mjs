// לוח קונספטים: כל כיוון × 512/64/24 × בהיר/כהה. כותב SVG לכל וריאציה + board.html, ומצלם PNG.
// הרצה: NODE_PATH=$(npm root -g) node scripts/concepts-board.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { CONCEPTS, C, svgFor } from './concepts.mjs';
const out = new URL('../../docs/brand/concepts/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const c of CONCEPTS) for (const t of ['light', 'dark']) writeFileSync(new URL(`${c.id}-${t}.svg`, out), svgFor(c, t, 512) + '\n');

const cell = (c, t, px) => `<div class="cell ${t}"><div class="art" style="width:${px}px;height:${px}px">${svgFor(c, t, px)}</div><span>${px}</span></div>`;
const row = c => `<section><header><b>${CONCEPTS.indexOf(c) + 1}. ${c.name}</b><p>${c.story}</p></header>
  <div class="grid">${['light', 'dark'].map(t => `<div class="theme ${t}">${[512, 64, 24].map(px => cell(c, t, px === 512 ? 160 : px)).join('')}
  <div class="lockup ${t}">${svgFor(c, t, 40)}<div><b>גבי</b><small>תזכורות תשלום</small></div></div></div>`).join('')}</div></section>`;
const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>גבי — סבב קונספטים ללוגו</title>
<style>
body{margin:0;font-family:Heebo,Rubik,Arial,sans-serif;background:#eef0f3;color:${C.navy}}
h1{font-size:26px;margin:24px 24px 4px}.sub{margin:0 24px 16px;color:#475569}
section{background:#fff;margin:16px 24px;border-radius:16px;padding:16px;box-shadow:0 1px 3px #0001}
header p{margin:4px 0 12px;color:#475569}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.theme{display:flex;align-items:flex-end;gap:18px;padding:16px;border-radius:12px;flex-wrap:wrap}
.theme.light{background:${C.cream}}.theme.dark{background:${C.navy};color:${C.cream}}
.cell{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;opacity:.9}
.lockup{display:flex;align-items:center;gap:8px;margin-inline-start:auto}.lockup b{display:block;font-size:22px;font-family:Rubik,Arial}.lockup small{font-size:11px;opacity:.7}
.note{margin:0 24px 24px;font-size:12px;color:#64748b}
</style>
<h1>גבי — 5 כיווני לוגו מהסיפור</h1><p class="sub">«הכסף שלך חוזר. בלי שתצטרך לרדוף.» · ירוק ${C.green} · נייבי ${C.navy} · קרם ${C.cream} · ב-512 מוצג מוקטן ל-160 בלוח (הקבצים עצמם 512)</p>
${CONCEPTS.map(row).join('')}
<p class="note">טיוטת קונספט לבחירה — לא הוחל על המוצר. הלוגו הנוכחי (ג) נשאר עד הכרעה.</p></html>`;
writeFileSync(new URL('board.html', out), html);

const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await p.goto(new URL('board.html', out).href);
await p.screenshot({ path: new URL('board.png', out).pathname, fullPage: true });
// בדיקת 24px אמיתית: כל קונספט ב-24 פיקסלים בדיוק (deviceScaleFactor 1) — כמו פאביקון
const t = await b.newPage({ viewport: { width: 5 * 34 + 10, height: 2 * 34 + 10 }, deviceScaleFactor: 1 });
await t.setContent(`<body style="margin:5px;display:grid;grid-template-columns:repeat(5,34px);gap:0">${['light', 'dark'].map(th => CONCEPTS.map(c =>
  `<div style="width:34px;height:34px;display:grid;place-items:center;background:${th === 'dark' ? C.navy : C.cream}">${svgFor(c, th, 24)}</div>`).join('')).join('')}</body>`);
await t.screenshot({ path: new URL('actual-24px.png', out).pathname });
await b.close();
console.log('✓ docs/brand/concepts: board.html, board.png, actual-24px.png +', CONCEPTS.length * 2, 'SVG');
