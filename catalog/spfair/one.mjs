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
const sp = scanTargets({ R: tap.R, L, things: tap.H0.things, shelf: tap.H0.shelf, bpById, targets: TARGETS, thingSteps: BUD.thingSteps });
const bl = scanTargets({ R: tap.R, L, things: tap.B0.things, shelf: tap.B0.shelf, targets: TARGETS, thingSteps: BUD.thingSteps });
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
  hidden = { about: 'RINGS-PORT · המבחן הנסתר (sha256 ב-hidden/SHA256) על אותה הרצה. נבנה ע״י fair.mjs', name, targets: HT.length, selfprint: hsp, baseline: hbl };
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
  fs.writeFileSync(path.join(HERE, 'hidden/b/runs', name + '.json'), JSON.stringify({ about: 'RECIPES · המבחן הנסתר ב׳ (sha256 ב-hidden/b/SHA256) על אותה הרצה. נבנה ע״י fair.mjs', name, targets: HB.length, selfprint: hsp, baseline: hbl }, null, 1) + '\n');
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
};
fs.mkdirSync(path.join(HERE, 'runs'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'runs', name + '.json'), JSON.stringify(out, null, 1) + '\n');
if (hidden) { fs.mkdirSync(path.join(HERE, 'hidden/runs'), { recursive: true }); fs.writeFileSync(path.join(HERE, 'hidden/runs', name + '.json'), JSON.stringify(hidden, null, 1) + '\n'); }
log('נכתב runs/' + name + '.json');
function countBy(xs) { const o = {}; for (const k of xs) o[k] = (o[k] || 0) + 1; return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))); }
