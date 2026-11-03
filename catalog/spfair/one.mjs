#!/usr/bin/env node
/**
 * ⚖️ SP-FAIR — הרצה אחת של המנוע הקפוא + מדידה. לא מריצים ישירות: fair.mjs מפעיל עם
 *   node --import ./hook.mjs one.mjs <name>     (SPFAIR_SALT / SPFAIR_ROUNDS בסביבה, NODE_OPTIONS לתהליכי-הצמיחה)
 * הפלט: catalog/spfair/runs/<name>.json (דטרמיניסטי).
 */
import './hook.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SALT, ROUNDS, budgetText, rawBudget } from './hook.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const name = process.argv[2];
if (!name) { console.error('one.mjs <name>'); process.exit(2); }
const t0 = Date.now();
const log = (s) => console.error('[' + name + '] ' + s + ' · ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');

/* מטמון-הצמיחה: הרצה שבה רק `rounds` שונה — הצמיחה זהה (אותו תת-תקציב, אותו זרע) ⇒ מעתיקים את הקובץ למפתח החדש
   (selfprint.mjs › growSources מגבב את כל budget.json, כולל rounds). רק העתקה של קלט זהה — לא קיצור של שום חישוב. */
const L = await import('../grow/lib.mjs');
const origBudget = fs.readFileSync(path.join(ROOT, 'catalog/selfprint/budget.json'), 'utf8'); // דרך הוו ⇒ כבר מותאם
if (ROUNDS !== null && !SALT) {
  const growFiles = ['grow.mjs', 'lib.mjs', 'runtime.mjs', 'truth.mjs'].map((f) => fs.readFileSync(path.join(ROOT, 'catalog/grow', f), 'utf8')).join('');
  const plain = rawBudget();
  const keyOf = (txt) => L.fnv(JSON.stringify(JSON.parse(txt)) + growFiles);
  const CACHE = path.join(ROOT, 'node_modules/.cache/selfprint');
  for (const n of ['baseline', 'half']) {
    const from = path.join(CACHE, n + '-' + keyOf(plain) + '.json'); const to = path.join(CACHE, n + '-' + keyOf(budgetText(plain)) + '.json');
    if (fs.existsSync(from) && !fs.existsSync(to)) { fs.copyFileSync(from, to); log('מטמון-צמיחה הועתק: ' + n); }
  }
}

process.env.NODE_OPTIONS = ((process.env.NODE_OPTIONS || '') + ' --import ' + JSON.stringify(path.join(HERE, 'hook.mjs'))).trim();
let tap = null;
globalThis.__spfairTap = (x) => { tap = x; };
globalThis.__spfairEngine = true; // שומר-המטרות פעיל
const SP = await import('../selfprint/selfprint.mjs');
const res = await SP.run({ log });
globalThis.__spfairEngine = false;
if (!tap) throw new Error('הברז לא נקרא');

const same = Object.fromEntries(Object.entries(SP.OUT).map(([k, p]) => [k, fs.existsSync(p) && fs.readFileSync(p, 'utf8') === res[k]]));
const { TARGETS } = await import('./targets.mjs');
const { scanTargets, closestTarget } = await import('./measure.mjs');
const BUD = JSON.parse(origBudget);
const compare = JSON.parse(res.compare);
const found = JSON.parse(res.found);
const bpById = new Map(tap.bps.map((b) => [b.id, b]));
/* SHELF-FIX (3.11.2026) · budget.numTol: המנוע רץ בסרגל החדש (רצפה ליד אפס). כל מדידה כאן נעשית **פעמיים** באותה הרצה —
   בסרגל החדש (השדות הרגילים) ובסרגל הישן (…OldStick): r2 ⇒ הרצה-חדשה-בסרגל-הישן = השפעת המנוע; ישן ⇒ חדש = השפעת הסרגל.
   בלי הדגל — אין מדידה שנייה ואין שדות חדשים (ביט-זהה). */
const NT = !!BUD.numTol;
const oldStick = (f) => { if (!NT) return undefined; L.setNumTol(false); try { return f(); } finally { L.setNumTol(true); } };
/* SHELF-FIX · בדיקת-לחץ שלי לכל פגיעה (בשני הסרגלים): קלטים שאין בלחץ של המנוע/של measure.mjs — רשימה ריקה ופריט אחד,
   0–500 פריטים עם **שברים** (גם זעירים ‎~1e-9‎), ענקיים עם שבר (‎±1e15+¼‎), רשימה אחידה-שברית; מספרים: שברים/ענקיים/זעירים.
   מול מימוש-הייחוס של המטרה, בסרגל החדש; נרשם גם הפער המספרי המקסימלי (מוחלט). דטרמיניסטי (LCG קבוע). */
const ownCheck = (() => {
  if (!NT) return null;
  const done = new Map(); const rows = [];
  const lcg = (seed) => { let x = seed >>> 0; return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296); };
  const ownOf = (sig) => {
    const r = lcg(0x5e1f ^ parseInt(L.fnv(sig.join(',')), 16));
    const frac = () => Math.round((r() * 2000 - 1000) * 1e4) / 1e4;
    const num = (k) => [0.5, -2.75, 1e-9, -3.3e-10, 1e15 + 0.25, -1e15 - 0.25, 7, -1, 0, 123456.789, frac(), frac()][k % 12];
    const nums = (k) => {
      const n = [0, 1, 2, 3, 5, 10, 40, 100, 250, 500][k % 10]; const mode = Math.floor(k / 10) % 4;
      return Array.from({ length: n }, () => (mode === 0 ? frac() : mode === 1 ? (r() - 0.5) * 2e-9 : mode === 2 ? (r() < 0.5 ? 1 : -1) * (1e15 + 0.25) * (r() < 0.5 ? 1 : 0.5) : 0.1));
    };
    const pt = () => ({ x: frac(), y: frac() });
    const one = (sem, k) => (sem === 'num' ? num(k) : sem === 'nums' ? nums(k) : sem === 'pt' ? pt() : Array.from({ length: [0, 1, 2, 5, 40][k % 5] }, pt));
    return Array.from({ length: 40 }, (_, k) => sig.map((sem, a) => one(sem, k + a * 7)));
  };
  const gapOf = (o, w) => { const a = [].concat(o); const b = [].concat(w); if (a.length !== b.length || !a.every((x) => typeof x === 'number') || !b.every((x) => typeof x === 'number')) return null; return Math.max(0, ...a.map((x, i) => Math.abs(x - b[i]))); };
  const fn = (suite, T, hit) => {
    const k = suite + '|' + T.id + '|' + hit.id; if (done.has(k)) return; done.set(k, true);
    const t = tap.H0.things.get(hit.id); if (!t) return;
    let ran = 0; let fail = 0; let first = null; let maxGap = 0; let ref = 0;
    for (const a of ownOf(t.sig)) {
      const w = T.f(...a); if (w === null || w === undefined) continue; ref++;
      const o = R1(t, a); if (o === null) { fail++; first ||= { why: 'לא רץ', in: brief(a) }; continue; }
      ran++; const g = gapOf(o, w); if (g !== null && g > maxGap) maxGap = g;
      if (!L.sameOut(o, w)) { fail++; first ||= { why: 'פלט שונה', in: brief(a), got: brief(o), want: brief(w) }; }
    }
    rows.push({ suite, target: T.id, id: hit.id, inputs: ref, ran, fail, maxGap, ...(first ? { first } : {}) });
  };
  fn.rows = rows; return fn;
  function R1(t, a) { return tap.R.runOne(t, a, BUD.thingSteps).v; }
  function brief(v) { return Array.isArray(v) ? (v.length > 4 ? { len: v.length, head: v.slice(0, 3) } : v.map(brief)) : v; }
})();
const ownOf = (suite) => (ownCheck ? { ownCheck: ownCheck.rows.filter((r) => r.suite === suite) } : {});
const checkHits = (suite, targets, ...scans) => { if (!ownCheck) return; const byId = new Map(targets.map((T) => [T.id, T])); for (const sc of scans) for (const h of sc?.hits || []) ownCheck(suite, byId.get(h.target), h); };
const sp = scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById, targets: TARGETS, thingSteps: BUD.thingSteps });
const bl = scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: TARGETS, thingSteps: BUD.thingSteps });
const spOld = oldStick(() => scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById, targets: TARGETS, thingSteps: BUD.thingSteps }));
const blOld = oldStick(() => scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: TARGETS, thingSteps: BUD.thingSteps }));
checkHits('SP-FAIR', TARGETS, sp, spOld);
const exactOld = oldStick(() => ({ baseline: SP.__internals.metricsOf(tap.R, tap.B0.things, tap.B0.shelf).exactRebuilt, selfprint: SP.__internals.metricsOf(tap.R, tap.H0.things, tap.H0.shelf, bpById).exactRebuilt }));
/* RINGS-PORT · המבחן הנסתר (catalog/spfair/hidden, חתום sha256): נמדד באותה הרצה, נכתב לקובץ נפרד שלא פותחים עד הסוף */
const HID = path.join(HERE, 'hidden/targets-hidden.mjs');
let hidden = null;
if (fs.existsSync(HID)) {
  // שומר-העיוורון של המנוע (selfprint/guard.mjs) נשאר מותקן בתהליך גם אחרי שהמנוע סיים — כלי-המדידה קורא את הקובץ
  // דרך הקורא שמתחת לשומר (__orig) ומייבא מ-data: — רק אחרי שהמנוע סיים (__spfairEngine=false; שומר-המטרות עדיין בודק).
  const rd = fs.readFileSync.__orig || fs.readFileSync;
  const { TARGETS: HT } = await import('data:text/javascript;base64,' + Buffer.from(String(rd(HID, 'utf8'))).toString('base64'));
  const hsp = scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById: new Map(tap.bps.map((b) => [b.id, b])), targets: HT, thingSteps: JSON.parse(origBudget).thingSteps });
  const hbl = scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: HT, thingSteps: JSON.parse(origBudget).thingSteps });
  const bpmA = new Map(tap.bps.map((b) => [b.id, b]));
  const hOld = oldStick(() => ({ selfprintOldStick: scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById: bpmA, targets: HT, thingSteps: BUD.thingSteps }), baselineOldStick: scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: HT, thingSteps: BUD.thingSteps }) }));
  checkHits('א׳', HT, hsp, hOld?.selfprintOldStick);
  hidden = { about: 'RINGS-PORT · המבחן הנסתר (sha256 ב-hidden/SHA256) על אותה הרצה. נבנה ע״י fair.mjs', name, targets: HT.length, selfprint: hsp, baseline: hbl, ...hOld, ...ownOf('א׳') };
}
/* RECIPES · המבחן הנסתר ב׳ (catalog/spfair/hidden/b, 44 מטרות, חתום sha256): אותה מדידה, קובץ נפרד שלא פותחים עד הסוף */
const HIDB = path.join(HERE, 'hidden/b/targets-b.mjs');
if (fs.existsSync(HIDB)) {
  const rd = fs.readFileSync.__orig || fs.readFileSync;
  const { TARGETS: HB } = await import('data:text/javascript;base64,' + Buffer.from(String(rd(HIDB, 'utf8'))).toString('base64'));
  const bpm = new Map(tap.bps.map((b) => [b.id, b]));
  const hsp = scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById: bpm, targets: HB, thingSteps: BUD.thingSteps });
  const hbl = scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: HB, thingSteps: BUD.thingSteps });
  fs.mkdirSync(path.join(HERE, 'hidden/b/runs'), { recursive: true });
  const bOld = oldStick(() => ({ selfprintOldStick: scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById: bpm, targets: HB, thingSteps: BUD.thingSteps }), baselineOldStick: scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: HB, thingSteps: BUD.thingSteps }) }));
  checkHits('ב׳', HB, hsp, bOld?.selfprintOldStick);
  fs.writeFileSync(path.join(HERE, 'hidden/b/runs', name + '.json'), JSON.stringify({ about: 'RECIPES · המבחן הנסתר ב׳ (sha256 ב-hidden/b/SHA256) על אותה הרצה. נבנה ע״י fair.mjs', name, targets: HB.length, selfprint: hsp, baseline: hbl, ...bOld, ...ownOf('ב׳') }, null, 1) + '\n');
}
/* RECIPES2 · המבחן הנסתר ג׳ (catalog/spfair/hidden/c, 46 מטרות, סוכן עיוור, חתום sha256 לפני כל שינוי): אותה מדידה בדיוק,
   קובץ נפרד (hidden/c/runs/<name>.json) שלא פותחים עד הסוף */
const HIDC = path.join(HERE, 'hidden/c/targets-c.mjs');
if (fs.existsSync(HIDC)) {
  const rd = fs.readFileSync.__orig || fs.readFileSync;
  const { TARGETS: HC } = await import('data:text/javascript;base64,' + Buffer.from(String(rd(HIDC, 'utf8'))).toString('base64'));
  const bpm = new Map(tap.bps.map((b) => [b.id, b]));
  const hsp = scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById: bpm, targets: HC, thingSteps: BUD.thingSteps });
  const hbl = scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: HC, thingSteps: BUD.thingSteps });
  fs.mkdirSync(path.join(HERE, 'hidden/c/runs'), { recursive: true });
  const cOld = oldStick(() => ({ selfprintOldStick: scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById: bpm, targets: HC, thingSteps: BUD.thingSteps }), baselineOldStick: scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: HC, thingSteps: BUD.thingSteps }) }));
  checkHits('ג׳', HC, hsp, cOld?.selfprintOldStick);
  fs.writeFileSync(path.join(HERE, 'hidden/c/runs', name + '.json'), JSON.stringify({ about: 'RECIPES2 · המבחן הנסתר ג׳ (sha256 ב-hidden/c/SHA256) על אותה הרצה. נבנה ע״י fair.mjs', name, targets: HC.length, selfprint: hsp, baseline: hbl, ...cOld, ...ownOf('ג׳') }, null, 1) + '\n');
}
log('מדידה: ' + sp.hits.length + ' פגיעות (שרטוטים) · ' + bl.hits.length + ' (צמיחה בלבד)');

/** פעלים שנבנו מחדש בדיוק — מ-compare של המנוע; לכל אחד: הטוב, ומאיזה שרטוט. */
const exactOf = (m) => Object.fromEntries(Object.entries(m.exactRebuilt).map(([v, e]) => [v, { exact: e.exact, fromOthers: e.fromOthers, byBlueprint: e.byBlueprint, byBlueprintFair: e.byBlueprintFair, best: e.best }]));
const bpSummary = (id) => { const b = bpById.get(id); return b ? { id, source: b.source, depth: b.depth, origin: b.origin, excl: b.excl } : { id }; };
const fairExact = Object.entries(compare.selfprint.exactRebuilt).filter(([, e]) => e.byBlueprintFair).map(([v, e]) => ({ verb: v, ...(e.best.blueprint ? { blueprint: bpSummary(e.best.blueprint) } : {}), best: e.best }));
const out = {
  about: 'SP-FAIR — הרצה אחת של המנוע הקפוא (catalog/selfprint) + מדידה (catalog/spfair/measure.mjs). נבנה ע״י catalog/spfair/fair.mjs — לא לערוך ביד',
  name, salt: SALT, rounds: ROUNDS ?? BUD.rounds,
  sameBytesAsBranch: same,
  built: compare.built,
  wrongImprovements: compare.wrongImprovements, replacements: compare.replacements,
  ...(compare.rings ? { rings: compare.rings } : {}), // RINGS-PORT: שלבים/תאומים/tie-bind/כלים/ראיות
  blueprints: compare.blueprints,
  rounds_: JSON.parse(res.ledger).rounds.map((F) => ({ round: F.round, blueprints: F.blueprints, built: F.built, new: F.new, replaced: F.replaced, dup: F.dup, named: F.named, born: F.bornBlueprints ?? 0 })),
  exact: { baseline: exactOf(compare.baseline), selfprint: exactOf(compare.selfprint) },
  exactByBlueprintFair: fairExact,
  bestGrown: { baseline: compare.baseline.bestGrown, selfprint: compare.selfprint.bestGrown },
  namedSpecialGrown: { baseline: compare.baseline.namedSpecialGrown, selfprint: compare.selfprint.namedSpecialGrown },
  foundByVerb: countBy(found.flatMap((f) => f.verbs)),
  /* בונה מעל מה שבנה: הצלחות ששרטוט-המקור שלהן נולד מדבר-משרטוט (שרשרת), עם הפעלים לאורך השרשרת */
  onTopOfBlueprints: found.filter((f) => f.blueprint.source === 'success-of-blueprint').map((f) => ({ id: f.id, round: f.round, verbs: f.verbs, excludedByLeaveOneOut: f.excludedByLeaveOneOut, example: f.example, blueprint: f.blueprint, fill: f.fill })),
  /* שרטוטים שנולדו מהצלחה של שרטוט (בונה מעל מה שבנה): ממי נולדו, כמה בנו, ומה יצא — כל דבר חדש שעלה מהם למדף */
  bornFromBlueprintSuccess: tap.bps.filter((b) => b.source === 'success-of-blueprint').map((b) => {
    const parent = tap.H0.things.get(b.origin.thing);
    const made = [...tap.H0.shelf.values()].filter((t) => t.bp === b.id).sort((x, y) => (x.id < y.id ? -1 : 1));
    return {
      id: b.id, depth: b.depth, from: { thing: b.origin.thing, verbs: b.origin.verbs, blueprint: b.origin.blueprint, example: parent?.ex || null }, excl: b.excl,
      built: b.built, onShelf: made.length, successes: b.successes,
      made: made.map((t) => ({ id: t.id, round: t.round, sig: t.sig.join(',') + '>' + t.out, verbs: (t.names || []).map((n) => n.verb), ...closestTarget({ R: tap.R, L, t, targets: TARGETS, thingSteps: BUD.thingSteps }) })),
    };
  }),
  targets: { selfprint: sp, baseline: bl },
  ...(NT ? { numTol: { about: 'SHELF-FIX · אותה הרצה בסרגל הישן (בלי רצפה ליד אפס): השפעת-המנוע = r2 מול ‎…OldStick‎; השפעת-הסרגל = ‎…OldStick‎ מול השדות הרגילים', targetsOldStick: { selfprint: spOld, baseline: blOld }, exactOldStick: { baseline: exactOf({ exactRebuilt: exactOld.baseline }), selfprint: exactOf({ exactRebuilt: exactOld.selfprint }) }, onLoad: compare.numTolOnLoad, ...ownOf('SP-FAIR'), stressDiffer: JSON.parse(res.ledger).rounds.map((F) => ({ round: F.round, ...F.stressDiffer })) } } : {}),
};
fs.mkdirSync(path.join(HERE, 'runs'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'runs', name + '.json'), JSON.stringify(out, null, 1) + '\n');
if (hidden) { fs.mkdirSync(path.join(HERE, 'hidden/runs'), { recursive: true }); fs.writeFileSync(path.join(HERE, 'hidden/runs', name + '.json'), JSON.stringify(hidden, null, 1) + '\n'); }
log('נכתב runs/' + name + '.json');
function countBy(xs) { const o = {}; for (const k of xs) o[k] = (o[k] || 0) + 1; return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))); }
