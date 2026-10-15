#!/usr/bin/env node
/**
 * ⚖️ בדיקת-אמת בדיעבד (BLUEPRINTS, 14.10.2026) — **לא חלק מהחיפוש.** החיפוש (search.mjs) מקבל שילוב רק לפי חוקי הפועל;
 * כאן שואלים שאלה אחרת: "האם מה שעבר את החוקים באמת עושה את מה שהפועל *אומר*?" — כדי לדעת מתי החוקים חלשים מדי.
 *
 * לכל שילוב ב-found/ (הנבחר + החלופות שעברו): מריצים על קלטים שהחוקים כמעט לא מייצרים (תחנות כפולות, 10 תחנות,
 * רשימות עם שליליים) ומשווים למשמעות:
 *   sum/average — שווה לסכום/לממוצע · extreme — אחד מהפריטים, ותמיד המקסימום או תמיד המינימום · count — שלם בין 0 לאורך ואדיטיבי ·
 *   compare (נקודות) — הסימן תמיד כמו (או תמיד הפוך מ-) |a|−|b| · tour — כל תחנה ייחודית פעם אחת, מתחיל במוצא, לא ארוך מהסדר
 *   שהגיע, ואף היפוך-קטע לא מקצר · allot — החוקים על קלטים גדולים + **איכות** מול מימוש-הייחוס (סך-המרחק של המשובצים, כמה בחוץ).
 * דטרמיניסטי (LCG קבוע). הפלט: truth.json.
 *
 *   node catalog/blueprints/truth.mjs           # כותב truth.json
 *   node catalog/blueprints/truth.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { graphFunction } from './run.mjs';
import { allotRef, pathLen } from '../lib/verbs-route.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'truth.json');
const N = 200;

function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pt = (r, hi = 40) => ({ x: int(r, 0, hi), y: int(r, 0, hi) });
const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const uniq = (xs) => { const s = new Set(); return xs.filter((p) => { const k = p.x + ',' + p.y; if (s.has(k)) return false; s.add(k); return true; }); };
const flip = (r, i, j) => [...r.slice(0, i), ...r.slice(i, j + 1).reverse(), ...r.slice(j + 1)];
const bag = (xs) => xs.map((p) => p.x + ',' + p.y).sort().join('|');
const safe = (f, ...a) => { try { return f(...a); } catch (e) { return { $err: String(e?.message || e).slice(0, 80) }; } };

/** בדיקה לכל פועל: (fn) ⇒ {ok, n, bad, example?, quality?} */
const CHECKS = {
  sum: (fn) => numbersCheck(fn, (xs) => xs.reduce((a, b) => a + b, 0), 'הסכום'),
  average: (fn) => numbersCheck(fn, (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null), 'הממוצע', true),
  count: (fn) => {
    const r = lcg(11); let bad = 0; let ex = null;
    for (let k = 0; k < N; k++) {
      const a = Array.from({ length: int(r, 0, 8) }, () => int(r, -20, 60)); const b = Array.from({ length: int(r, 0, 8) }, () => int(r, -20, 60));
      const fa = safe(fn, a); const fb = safe(fn, b); const fab = safe(fn, a.concat(b));
      const ok = [fa, fb, fab].every(Number.isInteger) && fa >= 0 && fa <= a.length && fab === fa + fb;
      if (!ok) { bad++; ex ||= { in: a, out: fa }; }
    }
    return { n: N, bad, ...(ex ? { example: ex } : {}), says: 'שלם בין 0 לאורך, ושתי רשימות = סכום הספירות' };
  },
  extreme: (fn) => {
    const r = lcg(12); let bad = 0; let ex = null; let mx = 0; let mn = 0;
    for (let k = 0; k < N; k++) {
      const xs = Array.from({ length: int(r, 1, 8) }, () => int(r, -40, 60));
      const o = safe(fn, xs);
      if (!xs.includes(o)) { bad++; ex ||= { in: xs, out: o, why: 'התשובה לא אחת מהפריטים' }; continue; }
      if (o === Math.max(...xs)) mx++; if (o === Math.min(...xs)) mn++;
    }
    const consistent = Math.max(mx, mn);
    return { n: N, bad: bad + (N - bad - consistent > 0 ? N - bad - consistent : 0), ...(ex ? { example: ex } : {}), says: 'אחד מהפריטים, ותמיד הגדול (או תמיד הקטן)' };
  },
  compare: (fn) => {
    const r = lcg(13); let same = 0; let opp = 0; let zero = 0; let n = 0;
    for (let k = 0; k < N; k++) {
      const a = pt(r); const b = pt(r); const want = Math.sign(Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
      const o = safe(fn, a, b); if (typeof o !== 'number') continue; n++;
      const s = Math.sign(o); if (s === want) same++; else if (s === -want) opp++; else zero++;
    }
    const bad = n - Math.max(same, opp) + (N - n);
    return { n: N, bad, says: 'הסימן תמיד כמו (או תמיד הפוך מ-) המרחק מהמוצא: |a| − |b|', note: Math.max(same, opp) === same ? 'אותו כיוון' : 'כיוון הפוך' };
  },
  tour: (fn) => {
    const r = lcg(14); let bad = 0; let ex = null; let dupBad = 0;
    for (let k = 0; k < N; k++) {
      const from = pt(r); const m = int(r, 2, 10);
      const stops = Array.from({ length: m }, () => pt(r, 12)); // רשת קטנה ⇒ הרבה כפולים
      if (k % 3 === 0 && stops.length) stops.push({ ...stops[0] });
      const out = safe(fn, from, stops);
      const why = !Array.isArray(out) ? 'לא רשימה' : bag(out.slice(1)) !== bag(uniq(stops)) ? 'התחנות לא כל תחנה-ייחודית פעם אחת' : out[0].x !== from.x || out[0].y !== from.y ? 'לא מתחיל במוצא'
        : pathLen(out) > pathLen([from, ...uniq(stops)]) + 1e-9 ? 'ארוך מהסדר שהגיע' : twoOptGain(out) ? 'היפוך-קטע מקצר' : null;
      if (why) { bad++; if (why.startsWith('התחנות') && uniq(stops).length !== stops.length) dupBad++; ex ||= { from, stops, why }; }
    }
    return { n: N, bad, dupBad, ...(ex ? { example: ex } : {}), says: 'כל תחנה ייחודית פעם אחת · מתחיל במוצא · לא ארוך מהסדר שהגיע · אף היפוך-קטע לא מקצר — גם עם תחנות כפולות ועד 11 תחנות' };
  },
  allot: (fn) => {
    const r = lcg(15); let bad = 0; let ex = null; let dist = 0; let distRef = 0; let out1 = 0; let outRef = 0;
    for (let k = 0; k < N; k++) {
      const bins = Array.from({ length: int(r, 2, 5) }, () => pt(r)); const items = Array.from({ length: int(r, 3, 14) }, () => pt(r)); const cap = int(r, 1, 4);
      const o = safe(fn, bins, items, cap); const ref = allotRef(bins, items, cap);
      if (!Array.isArray(o)) { bad++; ex ||= { why: 'לא רשימה' }; continue; }
      const load = bins.map((_, b) => o.filter((x) => x.b === b).length);
      const why = bag(o.map((x) => x.item)) !== bag(items) ? 'לא כל פריט פעם אחת' : load.some((v) => v > cap) ? 'מעל התקרה' : o.some((x) => x.b === -1) && load.some((v) => v < cap) ? 'בחוץ למרות שיש מקום' : null;
      if (why) { bad++; ex ||= { why }; continue; }
      dist += o.filter((x) => x.b >= 0).reduce((a, x) => a + d(x.item, bins[x.b]), 0); distRef += ref.filter((x) => x.b >= 0).reduce((a, x) => a + d(x.item, bins[x.b]), 0);
      out1 += o.filter((x) => x.b < 0).length; outRef += ref.filter((x) => x.b < 0).length;
    }
    return { n: N, bad, ...(ex ? { example: ex } : {}), quality: { assignedKm: round(dist), refAssignedKm: round(distRef), vsRef: round(dist / distRef), waiting: out1, refWaiting: outRef }, says: 'כל פריט פעם אחת · אף סל מעל התקרה · בחוץ רק כשהכול מלא — על קלטים גדולים; ואיכות: סך-המרחק מול מימוש-הייחוס (הקרוב-לסל ראשון)' };
  },
};
const round = (x) => Math.round(x * 1000) / 1000;
function twoOptGain(r) { const L = pathLen(r); for (let i = 1; i < r.length - 1; i++) for (let j = i + 1; j < r.length; j++) if (pathLen(flip(r, i, j)) < L - 1e-9 * Math.max(1, L) - 1e-9) return true; return false; }
function numbersCheck(fn, want, he, skipEmpty = false) {
  const r = lcg(10); let bad = 0; let ex = null;
  for (let k = 0; k < N; k++) {
    const xs = Array.from({ length: int(r, skipEmpty ? 1 : 0, 9) }, () => int(r, -30, 60));
    const o = safe(fn, xs); const w = want(xs);
    if (typeof o !== 'number' || Math.abs(o - w) > 1e-9 * Math.max(1, Math.abs(w))) { bad++; ex ||= { in: xs, out: o, want: w }; }
  }
  return { n: N, bad, ...(ex ? { example: ex } : {}), says: 'שווה ל' + he + ' (על ' + N + ' רשימות, גם שליליים)' };
}

export async function truthAll() {
  const dir = path.join(HERE, 'found');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const rows = [];
  for (const f of files) {
    const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const C = rec.combo; const check = CHECKS[C.verb];
    if (!check) { rows.push({ verb: C.verb, file: f, skipped: 'אין בדיקת-אמת לפועל הזה' }); continue; }
    const all = [{ shape: rec.blueprint.shape, variant: rec.blueprint.variant, parts: C.steps.length, graph: C.graph, chosen: true }, ...(rec.alternatives || []).map((a) => ({ ...a, chosen: false }))];
    const evals = [];
    for (const a of all) {
      const fn = await graphFunction({ verb: C.verb, sig: C.sig, graph: a.graph });
      const res = check(fn);
      evals.push({ shape: a.shape, variant: a.variant, parts: a.parts, chosen: a.chosen, ok: res.bad === 0, ...res });
    }
    rows.push({ verb: C.verb, file: f, chosenOk: evals[0].ok, anyOk: evals.some((e) => e.ok), firstOk: evals.findIndex((e) => e.ok), evals });
  }
  return JSON.stringify({ about: 'נבנה ע״י catalog/blueprints/truth.mjs — בדיקת-אמת בדיעבד (לא חלק מהחיפוש): האם מה שעבר את חוקי הפועל עושה את מה שהפועל אומר', n: N, rows }, null, 1) + '\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const text = await truthAll();
  if (process.argv.includes('--check')) {
    if ((fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '') !== text) { console.error('truth.json לא מעודכן — הריצו node catalog/blueprints/truth.mjs'); process.exit(1); }
    process.exit(0);
  }
  fs.writeFileSync(OUT, text);
  for (const r of JSON.parse(text).rows) console.log(r.verb.padEnd(8), r.skipped || ((r.chosenOk ? '✓ הנבחר נכון' : '✗ הנבחר שגוי') + ' · ' + r.evals.filter((e) => e.ok).length + '/' + r.evals.length + ' מהשילובים שעברו נכונים' + (r.evals[0].quality ? ' · איכות ' + JSON.stringify(r.evals[0].quality) : '')));
}
