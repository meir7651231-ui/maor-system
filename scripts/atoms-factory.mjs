#!/usr/bin/env node
/**
 * 🏭 המפעל (ATOMS-FACTORY, 14.10.2026) — מנוע אחד, דטרמיניסטי, בלי AI ובלי סוכנים, שרץ לבד:
 *   (א) מפרק   — מריץ את המפרק (`scripts/atoms-decompose.mjs`) ⇒ `src/lib/atoms/engines/generated/*`
 *   (ב) מחבר   — לכל מנוע (יד + שנמצא): כל מקום × כל חלק מאותו סוג, וכל שרשרת דרך outputKind
 *   (ג) מאמת   — כל החיבורים: DB-הבדיקה + ארגונים אקראיים + הדמו + עולמות מטולטלים; שמונת החלקים מול החוקים שלהם
 *   (ד) כותב   — `src/lib/atoms/engines/generated/verified.ts` (הארגז מציג רק את מה שבו)
 *   (ה) מדווח  — טבלה במסוף + `knowledge/FACTORY-LAST-RUN.md`
 *
 *   npm run atoms:factory                 # כותב (גם ב-prebuild — כל build משקף את הקוד; מטמון לפי חתימת-הקלט)
 *   npm run atoms:factory -- --check      # ב-verify וב-CI: יציאה 1 אם הקבצים לא מעודכנים או חיבור מאומת נכשל (תמיד ריצה מלאה)
 *   npm run atoms:factory -- --force      # כתיבה בלי המטמון
 *   --n 2000 --dbs 50 --seed 20261014     # כמו המאמת
 *
 * המטמון (prebuild): חתימת-הקלט ב-node_modules/.cache — הקוד לא השתנה ⇒ לא מריצים שוב. --check תמיד מריץ הכול.
 * רץ על קוד ה-TypeScript עצמו דרך ה-module runner של vite (בלי build).
 */
import { runnerImport } from 'vite';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const FORCE = args.includes('--force');
const opt = (name, d) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : d;
};
const SEED = opt('seed', 20261014);
const N = opt('n', 2000);
const DBS = opt('dbs', 50);
const GEN_DBS = opt('gen-dbs', 8);
const DEMO_DBS = opt('demo-dbs', 12);

const VERIFIED_FILE = join(ROOT, 'src/lib/atoms/engines/generated/verified.ts');
const REPORT_FILE = join(ROOT, 'knowledge/FACTORY-LAST-RUN.md');
const rel = (p) => relative(ROOT, p);

/* ───────── חתימת-הקלט (מטמון ל-prebuild בלבד) ───────── */

/** כל מה שהתוצאה תלויה בו: הקוד (lib · components · types), הדמו, והסקריפטים. */
function inputHash() {
  const h = createHash('sha256');
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        if (name === '__tests__' && !p.includes(join('lib', 'atoms'))) continue;
        walk(p);
      } else if (/\.(ts|json)$/.test(name) && p !== VERIFIED_FILE) {
        h.update(rel(p) + '\n');
        h.update(readFileSync(p));
      }
    }
  };
  for (const d of ['src/lib', 'src/components', 'src/types']) walk(join(ROOT, d));
  for (const f of ['public/demo.json', 'scripts/atoms-factory.mjs', 'scripts/atoms-decompose.mjs']) h.update(readFileSync(join(ROOT, f)));
  h.update(JSON.stringify({ SEED, N, DBS, GEN_DBS, DEMO_DBS }));
  return h.digest('hex').slice(0, 16);
}

/** המטמון מחוץ לריפו (node_modules/.cache) — הקובץ שנוצר עצמו תלוי רק בתוצאה, לא בחתימה. */
const CACHE_FILE = join(ROOT, 'node_modules/.cache/atoms-factory.json');

function writeCache(verifiedText, reportText) {
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify({ hash, out: createHash('sha256').update(verifiedText).update(reportText).digest('hex') }));
  } catch {
    /* מטמון בלבד */
  }
}

/* ───────── (א) מפרק ───────── */

const t0 = performance.now();
try {
  execFileSync(process.execPath, [join(ROOT, 'scripts/atoms-decompose.mjs'), ...(CHECK ? ['--check'] : [])], { stdio: 'inherit' });
} catch {
  console.error('🏭 המפעל: (א) המפרק נכשל' + (CHECK ? ' — הקבצים שנוצרו לא מעודכנים. להרצה: npm run atoms:factory' : ''));
  process.exit(1);
}

const hash = inputHash();
if (!CHECK && !FORCE && existsSync(VERIFIED_FILE) && existsSync(REPORT_FILE) && existsSync(CACHE_FILE)) {
  const c = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  const sum = createHash('sha256').update(readFileSync(VERIFIED_FILE)).update(readFileSync(REPORT_FILE)).digest('hex');
  if (c.hash === hash && c.out === sum) {
    console.log('🏭 המפעל: הקוד לא השתנה מהריצה האחרונה (חתימת-קלט ' + hash + ') — ' + rel(VERIFIED_FILE) + ' מעודכן.');
    process.exit(0);
  }
}

/* ───────── (ב)(ג) מחבר + מאמת ───────── */

const load = async (p) => (await runnerImport(resolve(ROOT, p), { root: ROOT, logLevel: 'error', configFile: false })).module;
const factory = await load('src/lib/atoms/verify/factory.ts');
const gen = await load('src/lib/atoms/engines/generated/index.ts');
const fx = await load('src/lib/atoms/__tests__/previewsFixture.ts');
const demo = JSON.parse(readFileSync(join(ROOT, 'public/demo.json'), 'utf8'));
const db = fx.richDb();
// אותו DB כמו המאמת וה-ratchet: יתרה ₪1,200 בהזמנה הצמודה של לוי
db.hostBookings = db.hostBookings.map((b) => (b.id === 'hb9' ? { ...b, charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }] } : b));

const t1 = performance.now();
const res = factory.runFactory({
  generated: gen.GENERATED_ENGINES,
  fixture: fx.ctxOf(db),
  fixtureSecrets: { names: [...fx.REQUESTERS, ...fx.QUIET_WORDS], texts: fx.RAW_TEXTS },
  demo: { db: demo, nowMs: Date.parse(demo.savedAt) },
  seed: SEED,
  n: N,
  dbs: DBS,
  genDbs: GEN_DBS,
  demoDbs: DEMO_DBS,
});
const t2 = performance.now();

/* ───────── (ד) הקבצים ───────── */

const verifiedText = factory.renderVerified(res);
const reportText = factory.renderReport(res);

/* ───────── (ה) הדוח ───────── */

console.log('\n🏭 המפעל — מפרק ⇒ מחבר ⇒ מאמת ⇒ רק מה שעבר נכנס לארגז\n');
for (const l of factory.factoryTable(res)) console.log(' ' + l);
const atomsBad = Object.entries(res.atoms).filter(([, v]) => v.passed !== v.cases);
console.log('\n חלקים: ' + Object.keys(res.atoms).length + ' · ' + (atomsBad.length ? '❌ ' + atomsBad.map(([k]) => k).join(', ') : 'כל החוקים עברו'));
console.log(' חיבורים: ' + res.totals.targets + ' · ✅ מאומתים ' + res.totals.verified + ' · נדחו ' + res.totals.rejected + ' · ' + res.totals.checks.toLocaleString('en-US') + ' בדיקות');
console.log('\n למה נדחו:');
for (const r of factory.rejectedByReason(res)) console.log('  ' + String(r.keys.length).padStart(4) + ' · ' + r.reason);
console.log('\n ⏱ מפרק ' + Math.round(t1 - t0) + 'ms · מחבר+מאמת ' + Math.round(t2 - t1) + 'ms\n');

if (CHECK) {
  const stale = [];
  if (!existsSync(VERIFIED_FILE) || readFileSync(VERIFIED_FILE, 'utf8') !== verifiedText) stale.push(rel(VERIFIED_FILE));
  if (!existsSync(REPORT_FILE) || readFileSync(REPORT_FILE, 'utf8') !== reportText) stale.push(rel(REPORT_FILE));
  // חיבור שהיה מאומת ועכשיו נכשל — נאמר במפורש (לא רק "לא מעודכן")
  const before = existsSync(VERIFIED_FILE) ? [...readFileSync(VERIFIED_FILE, 'utf8').matchAll(/^ {2}"([^"]+)": \d+,$/gm)].map((m) => m[1]) : [];
  const lost = before.filter((k) => !(k in res.verified));
  for (const k of lost.slice(0, 10)) console.error('  ✗ היה מאומת ונכשל: ' + k + ' — ' + (res.rejected.find((r) => r.key === k)?.why ?? ''));
  if (stale.length || lost.length || atomsBad.length) {
    console.error('🏭 המפעל --check: ' + (lost.length ? lost.length + ' חיבורים מאומתים נכשלו · ' : '') + (stale.length ? 'לא מעודכן: ' + stale.join(', ') : '') + (atomsBad.length ? ' · חלקים נכשלו בחוקים' : ''));
    console.error('להרצה: npm run atoms:factory');
    process.exit(1);
  }
  console.log('🏭 המפעל --check: מעודכן · ' + res.totals.verified + ' מאומתים.');
  writeCache(verifiedText, reportText); // ה-build שאחרי (prebuild) לא מריץ שוב את אותו קוד
  process.exit(0);
}

writeFileSync(VERIFIED_FILE, verifiedText);
writeFileSync(REPORT_FILE, reportText);
writeCache(verifiedText, reportText);
console.log('🏭 נכתבו ' + rel(VERIFIED_FILE) + ' + ' + rel(REPORT_FILE));
