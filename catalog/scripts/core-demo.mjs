#!/usr/bin/env node
/**
 * 🎞️ דף-ההדגמה של הליבה (MINED-VERBS, 14.10.2026) — כותב catalog/core/demo.html.
 * הקוד של כל מנוע מוטמע מתוך catalog/core/*.mjs כמו שהוא (רק בלי `export`) — הדף מריץ בדיוק את הליבה שנבדקה,
 * בלי שרת ובלי תלויות. מתחת לכל מנוע: שמו בעברית ו"נמצא ב:" מתוך origins.json.
 *
 *   node catalog/scripts/core-demo.mjs           # כותב
 *   node catalog/scripts/core-demo.mjs --check   # יציאה 1 אם הדף לא מעודכן
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOTION_VERBS, CORE_OF } from '../lib/verbs-motion.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'catalog/core/demo.html');
// 🧪 SELF-V2: נקרא בפעם הראשונה שצריך (לא בטעינה) — טהור-בטעינה ⇒ המכונה יכולה להריץ ולהוכיח את הקובץ הזה
let ORIGINS_; const ORIGINS = () => (ORIGINS_ ??= JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/core/origins.json'), 'utf8')).verbs);
const SRC_HE = { orbit: 'אורביט', buildsmart: 'בנייה-חכמה', generator: 'המחולל', rings: 'מעבדת-הטבעות', yeshiva: 'הישיבה', 'qa-scanner': 'סורק-האיכות', 'yoman-habina': 'יומן-הבינה', '14kk': '14kk', mmmm: 'MMMM' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** קוד-הליבה: כל קובץ בתוך פונקציה משלו (עזרים פרטיים כמו fin לא מתנגשים), מחזיר את הפונקציה המיוצאת. */
function coreCode() {
  return MOTION_VERBS.map((v) => {
    const { file, symbol } = CORE_OF[v.id];
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^export function /gm, 'function ').replace(/^import \{[^}]*\} from '\.\/[a-z-]+\.mjs';\n/gm, '');
    // ליבה שהיא שילוב (קופץ = מתקפל × דועך) מייבאת ליבה-אחות — בדף היא כבר מוגדרת קודם (decay לפני bounce)
    return `const ${symbol} = (() => {\n${src}\nreturn ${symbol};\n})();`;
  }).join('\n');
}

function card(v) {
  const og = ORIGINS()[v.id];
  const best = og.origins.find((o) => o.best);
  const combo = og.foundAs === 'combination' ? `<p class="where combo">🧩 נמצא כשילוב: ${og.of.map((id) => '<b>' + esc(MOTION_VERBS.find((x) => x.id === id)?.he ?? id) + '</b>').join(' × ')}</p>` : '';
  const where = `${combo}<p class="where">נמצא ב: <b>${esc(SRC_HE[best.source])}</b> · <code dir="ltr">${esc(best.file.split('/').pop())}:${best.line}</code></p><p class="what">${esc(best.what)}</p>`;
  const more = `<p class="more">ועוד ${og.origins.length - 1} מקומות ב-${new Set(og.origins.map((o) => o.source)).size} פרויקטים</p>`;
  return `<figure class="card" id="${v.id}"><canvas data-engine="${v.id}" width="320" height="180" aria-label="${esc(v.he)} — הדגמה חיה"></canvas><figcaption><h2>${esc(v.he)} <span dir="ltr">${v.id}</span></h2><p class="means">${esc(v.means)}</p>${where}${more}</figcaption></figure>`;
}

export function demoHtml() {
  const n = MOTION_VERBS.length;
  const places = MOTION_VERBS.reduce((a, v) => a + ORIGINS()[v.id].origins.length, 0);
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>מנועי הזמן והתנועה</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E🌀%3C/text%3E%3C/svg%3E">
<style>
/* פריסה: רצועת-כותרת שקטה ואז גריד של מכשירים — כל כרטיס = מנוע אחד שרץ, ומתחתיו מאיפה הוא בא. */
:root {
  --bg: #eef2f1; --panel: #f9fbfa; --ink: #18272b; --muted: #58696d; --line: #d3dcdb;
  --teal: #2c7a76; --brass: #b7832a; --rose: #b4544a;
  --display: "Frank Ruhl Libre", "David", "Times New Roman", serif;
  --body: system-ui, "Segoe UI", "Arial Hebrew", Arial, sans-serif;
  --mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #10181b; --panel: #162125; --ink: #e2eaeb; --muted: #8ea0a4; --line: #24353a; --teal: #62b6b0; --brass: #dcaa55; --rose: #e0857a; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #10181b; --panel: #162125; --ink: #e2eaeb; --muted: #8ea0a4; --line: #24353a; --teal: #62b6b0; --brass: #dcaa55; --rose: #e0857a; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.6 var(--body); padding-block: 32px 48px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
header, main, footer { max-width: 1120px; margin-inline: auto; }
header { display: grid; gap: 8px; margin-bottom: 28px; }
.eyebrow { font-size: 12px; letter-spacing: .08em; color: var(--muted); }
h1 { font: 600 clamp(28px, 4vw, 40px)/1.15 var(--display); margin: 0; text-wrap: balance; }
.lede { max-width: 65ch; margin: 0; color: var(--muted); }
.lede b { color: var(--ink); font-weight: 600; }
main { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
.card { margin: 0; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; display: grid; grid-template-rows: auto 1fr; min-width: 0; }
.card canvas { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; max-width: 100%; border-bottom: 1px solid var(--line); }
figcaption { padding: 12px 14px 14px; display: grid; gap: 4px; align-content: start; min-width: 0; }
h2 { margin: 0; font: 600 19px/1.3 var(--display); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
h2 span { font: 12px var(--mono); color: var(--muted); }
.means { margin: 0; font-size: 13.5px; }
.where { margin: 6px 0 0; font-size: 13px; color: var(--teal); }
.where.combo { color: var(--teal); }
.where code, .combo code { font: 12px var(--mono); overflow-wrap: anywhere; }
.what, .more { margin: 0; font-size: 12.5px; color: var(--muted); }
footer { margin-top: 28px; color: var(--muted); font-size: 13px; }
footer code { font: 12px var(--mono); }
</style>
</head>
<body>
<header>
  <div class="eyebrow">הקטלוג · הליבה · ${n} מנועים</div>
  <h1>מנועי הזמן והתנועה</h1>
  <p class="lede">כל מנוע כאן נמצא בקוד שכבר כתבנו — באפקט, באנימציה, בשעון, בניתוב — וחולץ לליבה בלי עולם. <b>${n} מתוך ${n} נמצאו</b>, ב-${places} מקומות; "קופץ" נמצא כשילוב של שניים מהם (מתקפל מהרצפה × דועך). מה שרץ על המסך הוא בדיוק הקוד שנבדק בחוקים.</p>
</header>
<main>
${MOTION_VERBS.map(card).join('\n')}
</main>
<footer>נוצר מ-<code>catalog/core/*.mjs</code> ו-<code>origins.json</code> ע"י <code>node catalog/scripts/core-demo.mjs</code>. במצב "הפחתת תנועה" כל מנוע מוצג כתמונה עומדת עם המסלול שלו.</footer>
<script>
"use strict";
${coreCode()}

const css = (k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
const C = () => ({ ink: css('--ink'), muted: css('--muted'), line: css('--line'), teal: css('--teal'), brass: css('--brass'), rose: css('--rose'), panel: css('--panel') });
const dot = (g, x, y, r, fill) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); };
const line = (g, pts, stroke, w = 1.5) => { g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.strokeStyle = stroke; g.lineWidth = w; g.stroke(); };
const label = (g, text, x, y, fill, align = 'right') => { g.fillStyle = fill; g.font = '12px ' + css('--mono'); g.textAlign = align; g.fillText(text, x, y); };

/** כל מנוע: (הקשר, רוחב, גובה, צעד, צבעים) ⇒ ציור. הצעד הוא הזמן — כמו בליבה. */
const DRAW = {
  decay(g, w, h, t, c) {
    const s = { from: 150, floor: 20, keepPct: 94 }; const n = t % 140;
    const X = (k) => 20 + k * (w - 40) / 100; const Y = (v) => h - 20 - (v - 0) * (h - 40) / 160;
    line(g, [[X(0), Y(20)], [X(100), Y(20)]], c.line, 1);
    line(g, Array.from({ length: Math.min(n, 100) + 1 }, (_, k) => [X(k), Y(decay(s, k))]), c.teal);
    const v = decay(s, Math.min(n, 100)); dot(g, X(Math.min(n, 100)), Y(v), 5, c.teal);
    label(g, v === s.floor ? 'ברצפה ✓' : v.toFixed(2), w - 16, 18, c.muted);
  },
  countdown(g, w, h, t, c) {
    const s = { total: 30 }; const el = (t / 6) % 36; const r = countdown(s, el);
    const cx = w / 2; const cy = h / 2; const R = h * 0.34;
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.strokeStyle = c.line; g.lineWidth = 8; g.stroke();
    g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (r / s.total)); g.strokeStyle = r ? c.teal : c.rose; g.lineWidth = 8; g.stroke();
    g.fillStyle = c.ink; g.font = '600 26px ' + css('--mono'); g.textAlign = 'center'; g.fillText(Math.ceil(r), cx, cy + 9);
  },
  accumulate(g, w, h, t, c) {
    const deps = random({ seed: 46 }, 60).map((x) => 4 + Math.round(x * 14)); const k = Math.floor(t / 10) % deps.length;
    const lv = accumulate({ capacity: 100 }, deps.slice(0, k + 1));
    const bw = 70; const bx = w / 2 - bw / 2; const top = 18; const bh = h - 36;
    g.strokeStyle = c.muted; g.lineWidth = 1.5; g.strokeRect(bx, top, bw, bh);
    const f = lv[k] / 100; g.fillStyle = c.brass; g.fillRect(bx + 2, top + bh - (bh - 4) * f - 2, bw - 4, (bh - 4) * f);
    const emptied = k > 0 && lv[k] < lv[k - 1]; label(g, emptied ? 'ריקון!' : lv[k] + '/100', bx - 10, h / 2, emptied ? c.rose : c.muted);
    line(g, lv.map((v, i) => [w - 18 - (k - i) * 3, h - 18 - v * 0.5]).filter((p) => p[0] > bx + bw + 8), c.line, 1);
  },
  oscillate(g, w, h, t, c) {
    const s = { center: h / 2, amplitude: h * 0.3, period: 90 };
    line(g, Array.from({ length: 121 }, (_, i) => [w - 10 - i * (w - 20) / 120, oscillate(s, t - i)]), c.line, 1.2);
    dot(g, w - 10, oscillate(s, t), 6, c.teal);
  },
  random(g, w, h, t, c) {
    const seed = 7 + Math.floor(t / 150); const n = Math.min(80, (t % 150)); const xs = random({ seed }, 160);
    for (let i = 0; i < n; i++) dot(g, 12 + xs[2 * i] * (w - 24), 12 + xs[2 * i + 1] * (h - 30), 3, i === n - 1 ? c.brass : c.muted);
    label(g, 'זרע ' + seed, w - 12, h - 8, c.ink);
  },
  gravity(g, w, h, t, c) {
    for (let j = 0; j < 5; j++) {
      const step = (t + j * 13) % 46; const s = { y: 10, vy: -2 + j * 0.6, g: 0.18 }; const o = gravity(s, step);
      const x = w * (0.15 + j * 0.17) + step * 0.6; dot(g, x, Math.min(h - 8, o.y + 20), 5, c.brass);
    }
  },
  'move-along-path'(g, w, h, t, c) {
    const pts = [{ x: 24, y: h - 26 }, { x: w * 0.3, y: 30 }, { x: w * 0.55, y: h * 0.62 }, { x: w - 24, y: 26 }];
    line(g, pts.map((p) => [p.x, p.y]), c.line, 2); pts.forEach((p) => dot(g, p.x, p.y, 4, c.muted));
    const p = moveAlongPath({ points: pts }, ((t % 200) / 200)); dot(g, p.x, p.y, 6, c.teal);
  },
  orbit(g, w, h, t, c) {
    const s = { cx: w / 2, cy: h / 2, radius: h * 0.34, period: 240 };
    dot(g, s.cx, s.cy, 9, c.brass); g.beginPath(); g.arc(s.cx, s.cy, s.radius, 0, Math.PI * 2); g.strokeStyle = c.line; g.lineWidth = 1; g.stroke();
    for (let k = 12; k >= 0; k--) { const p = orbit(s, t - k * 3); dot(g, p.x, p.y, 5 - k * 0.3, k ? c.line : c.teal); }
  },
  'shortest-path'(g, w, h, t, c) {
    const P = [[0.1, 0.5], [0.35, 0.18], [0.35, 0.82], [0.62, 0.3], [0.62, 0.75], [0.9, 0.5]].map(([x, y]) => [x * w, y * h]);
    const edges = [{ a: 0, b: 1, w: 4 }, { a: 0, b: 2, w: 2 }, { a: 1, b: 3, w: 5 }, { a: 2, b: 4, w: 8 }, { a: 2, b: 3, w: 9 }, { a: 3, b: 5, w: 3 }, { a: 4, b: 5, w: 1 }, { a: 1, b: 4, w: 6 }];
    const to = [5, 4, 3][Math.floor(t / 120) % 3]; const r = shortestPath({ edges }, 0, to);
    edges.forEach((e) => { line(g, [P[e.a], P[e.b]], c.line, 1.5); label(g, String(e.w), (P[e.a][0] + P[e.b][0]) / 2, (P[e.a][1] + P[e.b][1]) / 2 - 4, c.muted, 'center'); });
    if (r) line(g, r.path.map((k) => P[k]), c.teal, 3.5);
    P.forEach((p, k) => dot(g, p[0], p[1], k === 0 || k === to ? 7 : 5, k === 0 || k === to ? c.teal : c.muted));
    label(g, 'מחיר ' + (r ? r.cost : '—'), w - 10, 16, c.ink);
  },
  spread(g, w, h, t, c) {
    const cols = 6; const rows = 3; const id = (x, y) => y * cols + x; const edges = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { if (x < cols - 1) edges.push({ a: id(x, y), b: id(x + 1, y) }); if (y < rows - 1) edges.push({ a: id(x, y), b: id(x, y + 1) }); }
    const reached = new Set(spread({ edges, sources: [id(2, 1)] }, Math.floor(t / 40) % 9));
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) dot(g, 30 + x * (w - 60) / (cols - 1), 30 + y * (h - 60) / (rows - 1), 9, reached.has(id(x, y)) ? c.rose : c.line);
  },
  sample(g, w, h, t, c) {
    const readings = Array.from({ length: 48 }, (_, i) => Math.sin((i + t * 0.05) * 0.35) * 0.8 + Math.sin(i * 1.7) * 0.15);
    const X = (i) => 14 + i * (w - 28) / 47; const Y = (v) => h / 2 - v * h * 0.35;
    readings.forEach((v, i) => dot(g, X(i), Y(v), 2, c.line));
    sample({ every: 4 }, readings.map((v, i) => i)).forEach((i) => { line(g, [[X(i), h - 10], [X(i), Y(readings[i])]], c.line, 1); dot(g, X(i), Y(readings[i]), 4, c.teal); });
    label(g, 'כל רביעית', w - 12, 16, c.muted);
  },
  echo(g, w, h, t, c) {
    const wall = w - 26; const src = 24; const speed = 2; const rtt = (2 * (wall - src)) / speed; const ph = t % (rtt + 40);
    line(g, [[wall, 20], [wall, h - 20]], c.ink, 3);
    const out = Math.min(ph, rtt); const x = out < rtt / 2 ? src + speed * out : wall - speed * (out - rtt / 2);
    if (ph < rtt) { g.beginPath(); g.arc(x, h / 2, 8, 0, Math.PI * 2); g.strokeStyle = c.teal; g.lineWidth = 2; g.stroke(); }
    dot(g, src, h / 2, 6, c.brass);
    label(g, ph >= rtt ? 'מרחק ' + echo({ speed }, rtt).toFixed(0) + ' (זמן ' + rtt + ')' : 'שולח…', w - 34, 18, c.ink);
  },
  follow(g, w, h, t, c) {
    const tgt = orbit({ cx: w / 2, cy: h / 2, radius: h * 0.32, period: 260 }, t);
    let x = w / 2; let y = h / 2; const trail = [];
    for (let k = Math.max(0, t - 300); k <= t; k++) { const p = orbit({ cx: w / 2, cy: h / 2, radius: h * 0.32, period: 260 }, k); x = follow({ target: p.x, pullPct: 4 }, x); y = follow({ target: p.y, pullPct: 4 }, y); if (t - k < 40) trail.push([x, y]); }
    line(g, trail, c.line, 2); dot(g, tgt.x, tgt.y, 5, c.brass); dot(g, x, y, 6, c.teal);
  },
  bounce(g, w, h, t, c) {
    const floor = 0; let body = { pos: 120, vel: 0 }; const trail = [];
    const n = t % 260;
    for (let k = 0; k < n; k++) { body = { pos: body.pos, vel: body.vel - 0.25 }; body = bounce({ floor, bouncePct: 78 }, body); if (n - k < 60) trail.push(body.pos); }
    const Y = (p) => h - 14 - p * (h - 30) / 125; const X = (i) => w - 30 - (trail.length - 1 - i) * 3.4;
    line(g, [[10, Y(0)], [w - 10, Y(0)]], c.ink, 2); line(g, trail.map((p, i) => [X(i), Y(p)]), c.line, 1.2); dot(g, w - 30, Y(body.pos), 7, c.rose);
  },
  'sun-position'(g, w, h, t, c) {
    const d = new Date(); const day = d.toISOString().slice(0, 10); const s = sunPosition({ lat: 31.778, lon: 35.235, depression: 0.833 }, day);
    const X = (m) => 16 + (m / 1440) * (w - 32); const base = h - 28;
    line(g, [[X(0), base], [X(1440), base]], c.line, 1);
    if (!s) return;
    const arc = (m) => base - Math.max(0, Math.sin(Math.PI * (m - s.rise) / (s.set - s.rise))) * (h - 60);
    line(g, Array.from({ length: 97 }, (_, i) => { const m = s.rise + (s.set - s.rise) * i / 96; return [X(m), arc(m)]; }), c.line, 1.5);
    const m = s.rise + ((t * 2) % (s.set - s.rise)); dot(g, X(m), arc(m), 8, c.brass);
    const hhmm = (u) => { const z = Math.round(u + 180); return String(Math.floor(z / 60) % 24).padStart(2, '0') + ':' + String(z % 60).padStart(2, '0'); };
    label(g, 'נץ ' + hhmm(s.rise), X(s.rise) + 22, base + 18, c.muted, 'center'); label(g, 'שקיעה ' + hhmm(s.set), X(s.set) - 22, base + 18, c.muted, 'center');
  },
};

const still = matchMedia('(prefers-reduced-motion: reduce)');
const canvases = [...document.querySelectorAll('canvas[data-engine]')];
function paint(t) {
  const c = C();
  for (const cv of canvases) {
    const r = cv.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(r.width * dpr); const H = Math.round(r.width * 9 / 16 * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    try { DRAW[cv.dataset.engine](g, r.width, r.width * 9 / 16, t, c); } catch (err) { label(g, 'שגיאה: ' + err.message, r.width - 10, 20, c.rose); }
  }
}
let t = 0; let raf = 0;
function loop() { t += 1; paint(t); raf = requestAnimationFrame(loop); }
function start() { cancelAnimationFrame(raf); if (still.matches) paint(120); else loop(); }
still.addEventListener('change', start);
addEventListener('resize', () => { if (still.matches) paint(120); });
start();
</script>
</body>
</html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const text = demoHtml();
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (process.argv.includes('--check')) { if (cur !== text) { console.error('✗ catalog/core/demo.html לא מעודכן — הרץ: node catalog/scripts/core-demo.mjs'); process.exit(1); } console.log('✓ catalog/core/demo.html מעודכן'); }
  else { fs.writeFileSync(OUT, text); console.log('✓ catalog/core/demo.html'); }
}
