#!/usr/bin/env node
/**
 * ✅ המאמת — טבלה מלאה: כל מנוע קטן וכל חיבור בארגז, ✓/✗, כמה בדיקות, והדוגמה הנגדית (מכווצת) אם יש.
 * יוצא עם 1 על כל כישלון — אפשר להפוך אותו לשער.
 *
 *   node scripts/atoms-verify.mjs                 # 2,000 קלטים לכל חלק · DB-הבדיקה + 50 ארגונים אקראיים · 2 סטים של פרטים
 *   node scripts/atoms-verify.mjs --n 20000 --dbs 200 --seed 7 --params 3
 *   node scripts/atoms-verify.mjs --json          # הסיכום לחותמת "✅ מאומת" (stdout, JSON)
 *
 * רץ על קוד ה-TypeScript עצמו דרך ה-module runner של vite (בלי build). DB-הבדיקה = previewsFixture (המרכזייה + ההרחבות).
 */
import { runnerImport } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, d) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : d;
};
const N = opt('n', 2000);
const DBS = opt('dbs', 50);
const SEED = opt('seed', 20261014);
const PARAMS = opt('params', 2);
const JSON_OUT = args.includes('--json');

const load = async (p) => (await runnerImport(resolve(ROOT, p), { root: ROOT, logLevel: 'error', configFile: false })).module;
const run = await load('src/lib/atoms/verify/run.ts');
const fx = await load('src/lib/atoms/__tests__/previewsFixture.ts');

const t0 = performance.now();
const atoms = run.verifyAtoms({ n: N, seed: SEED });
const t1 = performance.now();
const db = fx.richDb();
// אותו DB כמו ratchet-הכיסוי: יתרה ₪1,200 בהזמנה הצמודה של לוי
db.hostBookings = db.hostBookings.map((b) => (b.id === 'hb9' ? { ...b, charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }] } : b));
const conns = run.verifyConnections(fx.ctxOf(db), {
  dbs: DBS,
  seed: SEED,
  paramSets: PARAMS,
  secrets: { names: [...fx.REQUESTERS, ...fx.QUIET_WORDS], texts: fx.RAW_TEXTS },
});
const t2 = performance.now();

if (JSON_OUT) {
  process.stdout.write(JSON.stringify(run.verifySummary(atoms, conns), null, 1) + '\n');
  process.exit(Object.values(atoms).every((a) => a.passed === a.cases) && Object.values(conns).every((c) => c.passed === c.checks) ? 0 : 1);
}

const fmt = (n) => n.toLocaleString('en-US');
const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - [...String(s)].length));
let bad = 0;

console.log('\n✅ המאמת — שמונת המנועים הקטנים (' + fmt(N) + ' קלטים אקראיים לכל אחד, זרע ' + SEED + ')\n');
for (const [id, r] of Object.entries(atoms)) {
  const ok = r.passed === r.cases;
  if (!ok) bad++;
  console.log(' ' + (ok ? '✓' : '✗') + ' ' + pad(id, 10) + pad(fmt(r.passed) + '/' + fmt(r.cases) + ' קלטים', 22) + fmt(r.checks) + ' בדיקות-חוק');
  if (r.counterexample) {
    console.log('     חוק: ' + r.counterexample.law + ' — ' + r.counterexample.why);
    console.log('     דוגמה נגדית (מכווצת, ' + r.counterexample.shrinkSteps + ' צעדים): ' + JSON.stringify(r.counterexample.input));
  }
}

console.log('\n✅ החיבורים — DB-הבדיקה + ' + DBS + ' ארגונים אקראיים × (ברירת-מחדל + ' + PARAMS + ' סטים של פרטים)\n');
let checks = 0;
for (const [key, r] of Object.entries(conns)) {
  const ok = r.passed === r.checks;
  if (!ok) bad++;
  checks += r.checks;
  console.log(' ' + (ok ? '✓' : '✗') + ' ' + pad(key, 58) + pad(fmt(r.passed) + '/' + fmt(r.checks) + ' בדיקות', 22) + 'תוצאה ב-' + r.shown + '/' + r.evals);
  for (const f of r.failures.slice(0, 2)) {
    console.log('     ' + f.db + ' · ' + JSON.stringify(f.params) + ' — ' + f.why);
    if (f.lines) console.log('       ' + f.title + ' | ' + f.lines.join(' / '));
  }
}

const atomChecks = Object.values(atoms).reduce((a, r) => a + r.checks, 0);
console.log(
  '\n' + (bad ? '✗ ' + bad + ' נכשלו' : '✓ הכול עבר') +
    ' · ' + fmt(atomChecks) + ' בדיקות-חוק על ' + Object.keys(atoms).length + ' חלקים (' + Math.round(t1 - t0) + 'ms)' +
    ' · ' + fmt(checks) + ' בדיקות על ' + Object.keys(conns).length + ' חיבורים (' + Math.round(t2 - t1) + 'ms)\n',
);
process.exit(bad ? 1 : 0);
