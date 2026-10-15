#!/usr/bin/env node
/**
 * ⚡ בונה-מחדש (SELF → SELF-V2, 14.10.2026) — כל צינור-הקטלוג שאפשר לשחזר בריפו הזה (בלי ../catsrc), בפקודה אחת, ומהר.
 * המכונה מאיצה את עצמה עם הפעלים שלה:
 *   · «מטביע חותם» — לכל שלב: טביעה של **הקלטים שהוא באמת קורא** (מוצהרים ב-STAGES, ונבדקים מול מעקב-קריאות אמיתי —
 *     lib/trace-reads.mjs, self-v2.test), של קוד-המכונה ושל גרסאות node(ראשית)/typescript/rolldown. בלי ענף ובלי שעון.
 *   · «מנרמל» — קוד TS נטבע **בלי הערות** (lib/blank.mjs) בשלבים שקוראים אותו כך (פותח · קורא · מכונת-השילוב);
 *     שינוי-הערה ⇒ אותה טביעה ⇒ השלב לא רץ. המפקד (שקורא JSDoc) נטבע על הקובץ כמו שהוא.
 *   · «מחפש לפי מפתח» בשלוש שכבות:
 *       1. **החותמות שבריפו** (catalog/self/stamps.json): הטביעה שממנה נוצרו הפלטים שבריפו + טביעת כל פלט.
 *          שכפול טרי בלי שום שינוי ⇒ כל שלב מזהה שהקלטים שלו = החותמת והפלטים = החותמת ⇒ לא רץ (הפלטים כבר בריפו).
 *       2. מטמון מקומי (node_modules/.cache/catalog-stage) — מצבים קודמים (מעבר בין ענפים, ביטול שינוי).
 *       3. הרצה. בתוך השלבים הכבדים — מטמון לפי חלק/מודול (lib/cache.mjs).
 *   · «עצירה מוקדמת» — שלב שרץ ויצא עם אותם פלטים ⇒ הטביעות של השלבים אחריו לא זזות ⇒ הם לא רצים.
 *   · «מחלק» + «בתורות» — הגרף נגזר מ-in/out; שלבים בלי תלות רצים במקביל (קיבולת = מספר הליבות; כבד = 3).
 * הפלטים ביט-זהים לריצה בלי מטמון (CATALOG_CACHE=off) — נבדק ב-self-v2.test ובכל ה-`--check`.
 *
 *   node catalog/scripts/rebuild.mjs            # בונה (מדלג על שלבים שלא השתנו) + מעדכן את החותמות
 *   node catalog/scripts/rebuild.mjs --times    # + טבלת-זמנים
 *   node catalog/scripts/rebuild.mjs --check    # בלי להריץ כלום: יציאה 1 אם שלב כלשהו לא תואם לחותמת שלו (שניות)
 *   CATALOG_CACHE=off node catalog/scripts/rebuild.mjs   # בלי שום מטמון וחותמת — כל שלב רץ (= הצינור הישן, צעד-צעד)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { fingerprint, cacheGet, cachePut, CACHE_OFF } from '../lib/cache.mjs';
import { gitIndex, gitIndexAsync, fileSha } from '../lib/gitfp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const STAMPS = 'catalog/self/stamps.json';

/* ═══════════════ הקלטים ═══════════════ */

/** קוד-המכונה: כל שלב תלוי בו (שינוי בחוק/במחולל/בסקריפט ⇒ הכול מחדש). */
const MACHINE = ['catalog/lib/*', 'catalog/core/*.mjs', 'catalog/inner/lib/*', 'catalog/inner/scripts/*', 'catalog/scripts/*', 'catalog/combiner/*.mjs', 'catalog/combiner/*.ts', 'catalog/self/parts.mjs', 'catalog/self/roles.mjs', 'src/lib/atoms/verify/', 'src/lib/atoms/parts/'];
/** הקוד של אורביט (הריפו הזה) · וההגדרות שהמהדר קורא כשהוא פותר ייבוא. */
const CODE = ['src/', 'telephony/', 'functions/'];
const TSENV = ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'jsconfig.json'];
const view = (...ps) => ps.map((p) => ({ p, view: true })); // TS בלי הערות (lib/blank.mjs)
// SPEED1000: קוד כמו שהמפקד רואה אותו — בלי ההערות שהוא לא קורא (lib/census-view.mjs; הוכחה: CENSUS_VIEW=1 --check)
const censusView = (...ps) => ps.map((p) => ({ p, view: 'census' }));
// הקבצים הפרושים (catalog/sources|behavior/inner-*.json) לא בריפו ונגזרים מהמחסן — הקלט הוא המחסן
const SOURCES = { p: 'catalog/sources/*.json', not: /\/inner-[^/]*\.json$/ };
const BEHAVIOR = { p: 'catalog/behavior/*.json', not: /\/inner-[^/]*\.json$/ };
const STORES = 'catalog/inner/store/*.json';
const GOALS = { p: 'catalog/goals/*.json', not: /\/coverage\.json$/ }; // coverage.json = פלט של goals-coverage, לא קובץ-מטרות
const RECIPES = { p: 'catalog/recipes/*.json', not: /\/combo-[^/]*$/ }; // combo-* = פלט של combine
const COMBINER_DATA = ['catalog/combiner/fixtures/goals.json', 'catalog/combiner/leads.json', 'catalog/combiner/verb-recipes.json'];

/**
 * השלבים. `in` = מה השלב קורא (בנוסף ל-MACHINE): קובץ · תיקייה/ (רקורסיבי) · dir/*.ext · {p, not, view}. `out` = מה הוא
 * כותב בריפו (קובץ, תיקייה/ או תחילית-שם). `heavy` = מאגר-עובדים משלו. התלות בין שלבים נגזרת מ-out ⇒ in.
 */
export const STAGES = [
  { name: 'orbit-census', run: ['catalog/scripts/orbit-census.mjs'], in: [...censusView(...CODE), 'catalog/names/orbit.json', 'catalog/schema.json', 'package.json'], out: ['catalog/sources/orbit.json'] },
  { name: 'core-census', run: ['catalog/scripts/core-census.mjs'], in: ['catalog/core/origins.json', 'catalog/schema.json'], out: ['catalog/sources/core.json'] },
  { name: 'core-b-census', run: ['catalog/scripts/core-b-census.mjs'], in: ['catalog/core/origins-b.json'], out: ['catalog/sources/core-b.json'] },
  { name: 'core-c-census', run: ['catalog/scripts/core-c-census.mjs'], in: ['catalog/core/origins-c.json'], out: ['catalog/sources/core-c.json'] },
  { name: 'open-orbit', critical: true, early: ['orbit-census'], run: ['catalog/inner/scripts/open.mjs', '--source', 'orbit'], in: [...view(...CODE), ...TSENV, 'catalog/sources/orbit.json'], out: ['catalog/inner/store/parts-orbit.json', 'catalog/inner/open-orbit.json', 'catalog/inner/gen.manifest.json'] },
  { name: 'probe-orbit', early: ['orbit-census'], run: ['catalog/scripts/behavior-probe.mjs', '--source', 'orbit'], in: [...view(...CODE), ...TSENV, 'catalog/sources/orbit.json'], out: ['catalog/behavior/orbit.json', 'catalog/self/stamps/behavior-orbit.json'], heavy: true },
  { name: 'probe-core', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core'], in: ['catalog/sources/core.json'], out: ['catalog/behavior/core.json', 'catalog/self/stamps/behavior-core.json'], heavy: true },
  { name: 'probe-core-b', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core-b'], in: ['catalog/sources/core-b.json'], out: ['catalog/behavior/core-b.json', 'catalog/self/stamps/behavior-core-b.json'], heavy: true },
  { name: 'probe-core-c', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core-c'], in: ['catalog/sources/core-c.json'], out: ['catalog/behavior/core-c.json', 'catalog/self/stamps/behavior-core-c.json'], heavy: true },
  { name: 'prove-orbit', critical: true, run: ['catalog/inner/scripts/prove.mjs', '--source', 'orbit'], in: [...view(...CODE), 'catalog/inner/store/parts-orbit.json', 'catalog/inner/gen.manifest.json'], out: ['catalog/inner/store/behavior-orbit.json', 'catalog/self/stamps/inner-orbit.json'], heavy: true },
  { name: 'catalog-build', run: ['catalog/scripts/catalog-build.mjs'], in: [SOURCES, BEHAVIOR, STORES, 'catalog/inner/gen.manifest.json', 'catalog/names/', 'catalog/notes/', 'catalog/schema.json'], out: ['catalog/index.json', 'catalog/verbs.json', 'catalog/verbs.md', 'catalog/alphabet.md'] },
  { name: 'lift', run: ['catalog/inner/scripts/lift.mjs'], in: [SOURCES, BEHAVIOR, STORES, GOALS, 'catalog/inner/gen.manifest.json', 'catalog/inner/motion-baseline.json', 'catalog/verbs.json'], out: ['catalog/inner/lift.json'] },
  { name: 'goals-coverage', run: ['catalog/scripts/goals-coverage.mjs'], in: [SOURCES, BEHAVIOR, STORES, GOALS, 'catalog/inner/gen.manifest.json'], out: ['catalog/goals/coverage.json', 'catalog/goals/coverage.md'] },
  { name: 'core-demo', run: ['catalog/scripts/core-demo.mjs'], in: ['catalog/core/origins.json'], out: ['catalog/core/demo.html'] },
  { name: 'combiner-prove', run: ['catalog/combiner/prove.mjs'], in: [...view(...CODE), ...TSENV], out: ['catalog/combiner/proofs.json'] },
  { name: 'combine', critical: true, early: ['catalog-build'], run: ['catalog/combiner/combine.mjs'], in: [...view(...CODE), ...TSENV, SOURCES, BEHAVIOR, STORES, GOALS, RECIPES, ...COMBINER_DATA, 'catalog/combiner/proofs.json', 'catalog/inner/gen.manifest.json', 'catalog/verbs.json', { p: 'catalog/self/stamps/*.json', not: /\/combine\.json$/ }], out: ['catalog/combiner/combos.json', 'catalog/recipes/combo-', 'catalog/self/stamps/combine.json'] },
  { name: 'build', critical: true, early: ['combine', 'catalog-build'], run: ['catalog/combiner/build.mjs'], in: [SOURCES, BEHAVIOR, STORES, GOALS, 'catalog/recipes/', ...COMBINER_DATA, 'catalog/combiner/proofs.json', 'catalog/inner/gen.manifest.json', 'catalog/verbs.json'], out: ['catalog/combiner/lab-data.json', 'catalog/combiner/dig/'] },
  // 📦 המוצר «מוקד-חלוקה» (PRODUCT-V2): ההרכבה ⇒ חבילה. אורז את קוד-המקור **עם ההערות** (rolldown שומר אותן) ⇒ CODE כמו שהוא
  // SPEED1000 · `reads`: מתוך CODE השלב קורא רק את מה שהאורז באמת ארז (moduleIds) — נרשם בהרצה (CATALOG_READS_OUT) ונשמר
  // בחותמת; הטביעה = הקבצים האלה + רשימות-השמות של התיקיות שלהם (קובץ חדש שמשנה פתרון-ייבוא ⇒ טביעה אחרת)
  { name: 'bundle', run: ['catalog/runtime/bundle.mjs'], reads: CODE, in: ['catalog/runtime/', ...CODE, ...TSENV, SOURCES, BEHAVIOR, STORES, GOALS, 'catalog/recipes/', ...COMBINER_DATA, 'catalog/combiner/combos.json', 'catalog/combiner/proofs.json', 'catalog/inner/gen.manifest.json', 'catalog/verbs.json', 'catalog/index.json'], out: ['catalog/products/distribution/assembly.json', 'catalog/products/distribution/parts.bundle.mjs'] },
  { name: 'self-check', run: ['catalog/scripts/self-check.mjs'], in: ['catalog/schema.json', ...TSENV, 'src/lib/atoms/', 'catalog/scripts/rebuild.mjs' /* המפקד של המכונה קורא גם את המתזמן */, 'catalog/self/*.mjs' /* והלולאה (SELF-LOOP) */], out: ['catalog/self/machine.json', 'catalog/self/behavior-machine.json', 'catalog/self/report.json'], heavy: true },
];

const SKIP_DIR = new Set(['node_modules', 'gen', '.git', '.cache']);
/**
 * ⚡ SPEED1000: סריקת-תיקייה פעם אחת לכל הרצה (STAGES סורקים את src/ שבע פעמים) — `resetRun()` מנקה (במצב --watch: אחרי
 * כל שינוי). `.gitattributes` בתוך תיקייה שנסרקת ⇒ האינדקס של git לא משקף את התוכן ⇒ נפילה לחישוב מהתוכן (lib/gitfp.mjs).
 */
const walkMemo = new Map();
let sawAttributes = false;
function walk(rel, out) {
  let list = walkMemo.get(rel);
  if (!list) {
    list = [];
    let es; try { es = fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true }); } catch { es = []; }
    for (const e of es) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.name === '.gitattributes') sawAttributes = true;
      if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk(r, list); } else if (e.isFile() && !/^\.env/.test(e.name)) list.push(r); // סודות (.env*) לא נקראים ולא נטבעים
    }
    walkMemo.set(rel, list);
  }
  for (const f of list) out.push(f);
}
const norm = (spec) => (typeof spec === 'string' ? { p: spec } : spec);
const globRe = (p) => new RegExp('^' + path.posix.basename(p).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
/** האם קובץ (יחסי) בתוך מפרט-קלט. */
export function specMatches(spec, rel) {
  const s = norm(spec);
  if (s.not && s.not.test(rel)) return false;
  if (s.p.endsWith('/')) return rel.startsWith(s.p);
  if (s.p.includes('*')) return path.posix.dirname(rel) === path.posix.dirname(s.p) && globRe(s.p).test(path.posix.basename(rel));
  return rel === s.p;
}
/** מפרט-קלט ⇒ קבצים (יחסיים, ממוינים). */
export function expand(spec) {
  const s = norm(spec);
  const out = [];
  if (s.p.endsWith('/')) walk(s.p.slice(0, -1), out);
  else if (s.p.includes('*')) {
    const dir = path.posix.dirname(s.p);
    let es = []; try { es = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }); } catch { /* */ }
    for (const e of es) if (e.isFile()) out.push(dir + '/' + e.name);
  } else if (fs.existsSync(path.join(ROOT, s.p))) out.push(s.p);
  return out.filter((f) => specMatches(s, f)).sort();
}

/** פלט ⇒ האם הקובץ הזה הוא פלט של השלב (קובץ · תיקייה/ · תחילית-שם). */
const isOutOf = (stage, rel) => stage.out.some((o) => rel === o || (o.endsWith('/') ? rel.startsWith(o) : rel.startsWith(o) && !o.endsWith('.json') && !o.endsWith('.md') && !o.endsWith('.html') && path.posix.dirname(rel) === path.posix.dirname(o)));
/** קבצי-הפלט הקיימים של שלב. */
export function outFiles(stage) {
  const out = [];
  for (const o of stage.out) {
    if (o.endsWith('/')) { walk(o.slice(0, -1), out); continue; }
    if (fs.existsSync(path.join(ROOT, o)) && fs.statSync(path.join(ROOT, o)).isFile()) { out.push(o); continue; }
    const dir = path.posix.dirname(o); const pre = path.posix.basename(o);
    let es = []; try { es = fs.readdirSync(path.join(ROOT, dir)); } catch { /* */ }
    for (const f of es) if (f.startsWith(pre) && fs.statSync(path.join(ROOT, dir, f)).isFile()) out.push(dir + '/' + f);
  }
  return [...new Set(out)].sort();
}

/* ═══════════════ «מטביע חותם» ═══════════════ */

/**
 * ⚡ SPEED1000 — «טביעה בלי קריאה»: טביעת קובץ = ה-sha של git (lib/gitfp.mjs) — לקובץ נקי מהאינדקס, בלי לקרוא אותו;
 * למלוכלך/חדש — מהתוכן (אותו חישוב בדיוק). טביעת-view (TS בלי הערות, lib/blank.mjs) נשמרת לפי ה-sha: בזיכרון ·
 * בחותמות שבריפו (`views` ב-stamps.json — שכפול טרי לא מנתח אף קובץ) · במטמון המקומי · ורק אחרת מחושבת (טעינת המהדר).
 * ה-sha וה-view הם פונקציה של התוכן בלבד ⇒ אותה טביעה בכל דרך (ratchet: speed1000.test — עם/בלי git, עם/בלי חותמות).
 */
let IDX = null;
/** טביעת קובץ (sha של git). במצב --watch מוחלף בטביעות שבזיכרון. */
let SHA = (rel) => fileSha(ROOT, idx(), rel);
let WATCHING = false;
const idx = () => {
  IDX ??= gitIndex(ROOT);
  if (IDX.ok && sawAttributes) IDX = { ok: false, why: '.gitattributes', shas: new Map() }; // (gitfp בודק גם בעצמו)
  return IDX;
};
/** השלב כתב/מחק קבצים ⇒ הסריקות של תיקיות-הפלט שלו (ושל האבות שלהן) לא בתוקף. */
function forgetOuts(stage) {
  for (const o of stage.out) {
    const d = o.endsWith('/') ? o.slice(0, -1) : path.posix.dirname(o);
    for (const k of [...walkMemo.keys()]) if (k === d || k.startsWith(d + '/')) walkMemo.delete(k);
    for (let a = path.posix.dirname(d); ; a = path.posix.dirname(a)) { walkMemo.delete(a); if (a === '.' || !a.includes('/')) break; }
  }
}
/** הרצה חדשה (מצב --watch): שוכחים את הסריקות ואת האינדקס — טביעות-ה-view נשארות (הן לפי תוכן). */
export function resetRun() { walkMemo.clear(); IDX = null; sawAttributes = false; machineMemo = null; }
const viewMemo = new Map();
let storedViews = null; // {algo, map} מהחותמות שבריפו
let blankMod = null;
const BLANKABLE = /\.(ts|tsx|mts|cts)$/; // = lib/blank.mjs › isBlankable (בלי לטעון את המהדר)
let algoMemo = null;
/** גרסת-האלגוריתם של «מנרמל»: הקוד שלו (blank + cache) וגרסת המהדר. שינוי ⇒ טביעות-ה-view השמורות לא בתוקף. */
export function viewAlgo() {
  if (algoMemo) return algoMemo;
  let tsv = '?'; try { tsv = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/typescript/package.json'), 'utf8')).version; } catch { /* */ }
  return (algoMemo = fingerprint('view-algo-v2', tsv, ...['catalog/lib/blank.mjs', 'catalog/lib/cache.mjs', 'catalog/lib/census-view.mjs'].map((f) => SHA(f) ?? '!')));
}
export const viewKey = (rel, sha, kind = true) => (kind === 'census' ? 'c' + (rel.endsWith('x') ? 'x' : /\.[mc]?js$/.test(rel) ? 'j' : 't') : rel.endsWith('x') ? 'x' : 't') + sha;
let censusMod = null;
async function viewHash(rel, sha, kind = true) {
  const k = viewKey(rel, sha, kind);
  let h = viewMemo.get(k);
  if (h) return h;
  const fresh = process.env.REBUILD_VIEWS === 'off'; // בדיקות: בלי החותמות ובלי המטמון — מחושב מהמהדר (ratchet: speed1000.test)
  if (!fresh && storedViews?.algo === viewAlgo()) h = storedViews.map[k];
  const ck = fingerprint(viewAlgo(), k);
  h ??= CACHE_OFF || fresh ? undefined : cacheGet('viewsha', ck);
  if (typeof h !== 'string') {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (kind === 'census') { censusMod ??= await import('../lib/census-view.mjs'); h = fingerprint('cview', censusMod.censusView(text, rel)); }
    else { blankMod ??= await import('../lib/blank.mjs'); h = fingerprint('view', blankMod.sourceViewCached(rel, text)); }
    cachePut('viewsha', ck, h);
  }
  viewMemo.set(k, h);
  return h;
}
const CENSUS_VIEWABLE = (rel) => /\.(ts|tsx|mts|cts|mjs|js|cjs)$/.test(rel) && !/\.d\.[mc]?ts$/.test(rel) && !/\.test\.|\/__tests__\/|\/engines\/generated\//.test(rel); // = census-view › isCensusViewable
/** האם לקובץ הזה יש גרסת-view מהסוג הזה (אחרת — הטביעה היא ה-sha כמו שהוא). */
export const hasView = (rel, kind) => (kind === 'census' ? CENSUS_VIEWABLE(rel) : !!kind && BLANKABLE.test(rel));
/** טביעת קובץ: התוכן כמו שהוא (sha של git), או view — TS בלי הערות (true) / כמו שהמפקד רואה ('census'). */
async function fileHash(rel, kind) {
  const sha = SHA(rel);
  if (sha == null) throw new Error('rebuild: קובץ-קלט נעלם — ' + rel);
  return hasView(rel, kind) ? viewHash(rel, sha, kind) : sha;
}

/**
 * «מלח» של קוד-המכונה ושל הסביבה (node ראשי · typescript · rolldown) — משותף לכל השלבים. SPEED1000: אותו מלח כמו
 * lib/cache.mjs › machineSalt (אותן תיקיות, אותן גרסאות) — אבל דרך הטביעות של git ובלי לקרוא אף קובץ נקי.
 */
const SALT_DIRS = ['catalog/lib', 'catalog/core', 'catalog/inner/lib', 'catalog/combiner', 'src/lib/atoms/verify', 'src/lib/atoms/parts'];
function machineSaltFast() {
  const files = [];
  for (const d of SALT_DIRS) { const out = []; walk(d, out); for (const f of out) if (/\.(mjs|ts)$/.test(f)) files.push(f); }
  files.sort(); files.push('catalog/self/parts.mjs');
  const ver = (pkg) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8')).version; } catch { return '?'; } };
  return fingerprint('salt-v3', 'node' + process.versions.node.split('.')[0], ver('typescript'), ver('rolldown'), ...files.flatMap((f) => [f, SHA(f) ?? '!']));
}
let machineMemo = null;
async function machineKey() {
  if (machineMemo) return machineMemo;
  // הבונה-מחדש עצמו (המתזמן) לא משנה שום פלט — שינוי בו לא פוסל את החותמות; ה-STAGES שלו נכנסים ממילא דרך run/in
  const files = [...new Set(MACHINE.flatMap(expand))].filter((f) => f !== 'catalog/scripts/rebuild.mjs').sort();
  const hs = await Promise.all(files.map((f) => fileHash(f, false)));
  machineMemo = fingerprint(machineSaltFast(), 'machine-v3', ...files.flatMap((f, k) => [f, hs[k]]));
  return machineMemo;
}

/**
 * הקבצים שהשלב קורא (בלי הפלטים שלו): [קובץ, איך] — false = כמו שהוא · true = TS בלי הערות · 'census' = כמו שהמפקד רואה.
 * קובץ שנקרא בכמה דרכים ⇒ הדרך שרואה יותר (כמו-שהוא > המפקד > בלי-הערות). `reads` (SPEED1000) ⇒ ממפרטי-`reads` רק מה
 * שנרשם בהרצה האחרונה (`declared: true` — כל המוצהר, לבדיקת מעקב-הקריאות).
 */
const RANK = (v) => (v === false ? 3 : v === 'census' ? 2 : v ? 1 : 3);
export function inputFiles(stage, { declared = false, reads = null } = {}) {
  const seen = new Map();
  const narrow = !declared && stage.reads && reads ? new Set(reads) : null; // עוד לא נרשם ⇒ כל המוצהר
  for (const spec of stage.in) {
    const s = typeof spec === 'string' ? { p: spec } : spec;
    const dyn = narrow && stage.reads.includes(s.p);
    for (const f of expand(s)) {
      if (isOutOf(stage, f) || (dyn && !narrow.has(f))) continue;
      const v = s.view ?? false;
      seen.set(f, seen.has(f) && RANK(seen.get(f)) >= RANK(v) ? seen.get(f) : v);
    }
  }
  return [...seen].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** תיקיות-האם של הקבצים שנרשמו (רשימת-השמות שלהן נכנסת לטביעה — פתרון-ייבוא תלוי בה). */
const readDirs = (reads) => [...new Set((reads ?? []).map((f) => path.posix.dirname(f)))].sort();
const dirPrint = (d) => { let es = []; try { es = fs.readdirSync(path.join(ROOT, d)).sort(); } catch { /* */ } return fingerprint(...es); };

/** טביעת-השלב: המלח + שם + פקודה + כל קובץ-קלט (נתיב + טביעה) [+ מה שנרשם: הקבצים והתיקיות]. */
/** במצב --watch: מפתח-שלב שאף קלט שלו לא נגעו בו מאז — מהזיכרון (ראו touch ב-watch). */
const keyMemo = new Map();
export async function stageKey(stage, reads = null) {
  const mk = stage.name + '|' + JSON.stringify(reads ?? null);
  if (keyMemo.has(mk)) return keyMemo.get(mk);
  const k = await stageKeyNow(stage, reads);
  if (WATCHING) keyMemo.set(mk, k);
  return k;
}
async function stageKeyNow(stage, reads) {
  const files = inputFiles(stage, { reads });
  const hs = await Promise.all(files.map(([f, v]) => fileHash(f, v)));
  const dyn = stage.reads ? ['reads', ...readDirs(reads).flatMap((d) => [d + '/', dirPrint(d)])] : [];
  return fingerprint(await machineKey(), 'stage-v3', stage.name, JSON.stringify(stage.run), ...files.flatMap(([f, v], k) => [f + (v === 'census' ? '#census' : v ? '#view' : ''), hs[k]]), ...dyn);
}


/* ═══════════════ החותמות שבריפו ═══════════════ */

export function readStamps() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, STAMPS), 'utf8')); } catch { return { version: 1, stages: {} }; }
}
const stagesOf = (st) => Object.fromEntries(STAGES.filter((s) => st.stages[s.name]).map((s) => [s.name, st.stages[s.name]]));
const stampsText = (st) => JSON.stringify({
  version: 2,
  note: 'נוצר ע"י catalog/scripts/rebuild.mjs — לכל שלב: טביעת-הקלטים שממנה נוצרו הפלטים שבריפו, וטביעת כל פלט (sha של git). שכפול טרי שהקלטים שלו זהים ⇒ השלב לא רץ. views: טביעת-view (TS בלי הערות) לכל sha של קובץ-קוד — שכפול טרי לא מנתח אף קובץ.',
  stages: stagesOf(st),
  ...(st.views ? { views: st.views } : {}),
}, null, 1) + '\n';
const outHashes = (stage) => Object.fromEntries(outFiles(stage).map((f) => [f, SHA(f)]));
/** טביעות-ה-view של כל קובצי-הקוד שהשלבים קוראים כ-view (ממוינות) — נשמרות בחותמות. */
async function viewsNow(stamps) {
  const map = {};
  for (const st of STAGES) for (const [f, v] of inputFiles(st, { reads: stamps.stages[st.name]?.reads })) if (hasView(f, v)) { const sha = SHA(f); map[viewKey(f, sha, v)] = await viewHash(f, sha, v); }
  return { algo: viewAlgo(), map: Object.fromEntries(Object.entries(map).sort((a, b) => (a[0] < b[0] ? -1 : 1))) };
}
const sameOut = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ═══════════════ הגרף ═══════════════ */

/** stage ⇒ שמות-השלבים שהוא תלוי בהם (פלט של שלב אחר שנקרא כקלט). פלט = קובץ · תיקייה/ · תחילית — נבדק על דוגמה. */
export function graph() {
  const sample = (o) => (o.endsWith('/') ? o + 'x' : /\.\w+$/.test(o) ? o : o + 'x.json');
  const deps = new Map(STAGES.map((s) => [s.name, new Set()]));
  for (const b of STAGES) for (const a of STAGES) if (a !== b && a.out.some((o) => b.in.some((spec) => specMatches(spec, sample(o))))) deps.get(b.name).add(a.name);
  return deps;
}

/* ═══════════════ 📜 זיכרון-התוצאות מההיסטוריה (SPEED1000 · יעד 6) ═══════════════ */

/**
 * "מה שכבר חושב פעם אחת — לא מחושב שוב". כל קומיט כבר מכיל את החותמות שלו (catalog/self/stamps.json): לכל שלב — טביעת-הקלטים
 * (`in`) וה-sha של git של כל פלט (`out`). כל קובץ-פלט כזה **כבר שמור ב-git** (כ-blob) מאז שקומט. לכן, לפני שמריצים שלב:
 *   מפתח השלב ⇒ מחפשים אותו בחותמות של כל הקומיטים (כל הענפים המקומיים: `git log --all -- stamps.json`) ⇒ נמצא ⇒ הפלטים נשלפים
 *   מ-git לפי ה-sha (`git cat-file --batch`) — בלי לחשב. התוכן נמצא לפי הטביעה שלו, לכן כל קומיט שנותן אותו — נותן אותם בייטים.
 * בלי שירות, בלי מפתחות, בלי push. סדר-החיפוש: החותמת הנוכחית ⇒ המטמון המקומי ⇒ **ההיסטוריה** ⇒ הרצה.
 * נפילה בטוחה (⇒ מחשבים כרגיל): אין git · שכפול רדוד (רק מה שהורד) · מפתח שלא נמצא · blob חסר · REBUILD_HISTORY=off.
 * ratchet: speed1000.test (§6) — שלב שנשלף מההיסטוריה = אותו שלב מחושב בלי שום זיכרון, ביט-אחר-ביט.
 */
let HIST = null;
const SHA40 = /^[0-9a-f]{40}$/;
const gitEnv = () => { const e = { ...process.env, LC_ALL: 'C' }; for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR']) delete e[k]; return e; };
const gitRun = (args, input) => createRequire(import.meta.url)('node:child_process').spawnSync('git', ['-C', ROOT, ...args], { input, encoding: 'buffer', maxBuffer: 1 << 30, env: gitEnv() });
/** פירוק פלט של `git cat-file --batch` ⇒ [Buffer | null] לפי הסדר. */
function catBatch(specs) {
  if (!specs.length) return [];
  const r = gitRun(['cat-file', '--batch'], Buffer.from(specs.join('\n') + '\n'));
  if (r.status !== 0) return specs.map(() => null);
  const buf = r.stdout; const out = []; let i = 0;
  for (let k = 0; k < specs.length; k++) {
    const nl = buf.indexOf(10, i); const head = buf.subarray(i, nl).toString('utf8'); i = nl + 1;
    const m = /^\S+ \S+ (\d+)$/.exec(head);
    if (!m) { out.push(null); continue; }
    const n = Number(m[1]); out.push(buf.subarray(i, i + n)); i += n + 1;
  }
  return out;
}
export const HISTORY_CAP = 500; // קומיטים שבהם החותמות השתנו
/** האינדקס: שם-שלב|מפתח ⇒ {out, reads, commit} — מהחותמות שבכל הקומיטים (החדש ביותר קודם). נבנה רק כשצריך. */
export function historyResults() {
  if (HIST) return HIST;
  HIST = { byKey: new Map(), state: '', commits: 0 };
  if (process.env.REBUILD_HISTORY === 'off' || CACHE_OFF) { HIST.state = 'כבוי'; return HIST; }
  if (!fs.existsSync(path.join(ROOT, '.git'))) { HIST.state = 'אין git'; return HIST; }
  const log = gitRun(['log', '--all', '--format=%H', '-n', String(HISTORY_CAP), '--', STAMPS]);
  if (log.status !== 0) { HIST.state = 'git log נכשל'; return HIST; }
  const commits = String(log.stdout).split('\n').filter((l) => SHA40.test(l));
  const texts = catBatch(commits.map((c) => c + ':' + STAMPS));
  commits.forEach((c, k) => {
    let st; try { st = JSON.parse(String(texts[k])); } catch { return; }
    for (const [name, e] of Object.entries(st?.stages ?? {})) {
      // רק חותמות בפורמט הנוכחי (פלטים לפי sha של git); הישנות (sha256) — לא ניתנות לשליפה מ-git
      if (!e?.in || !e.out || !Object.values(e.out).every((h) => SHA40.test(h))) continue;
      const k2 = name + '|' + e.in;
      if (!HIST.byKey.has(k2)) HIST.byKey.set(k2, { out: e.out, reads: e.reads, commit: c });
    }
  });
  HIST.commits = commits.length;
  HIST.state = String(gitRun(['rev-parse', '--is-shallow-repository']).stdout).trim() === 'true' ? 'שכפול רדוד — רק הקומיטים שהורדו' : 'מלאה';
  return HIST;
}
/** השלב עם המפתח הזה כבר חושב וקומט ⇒ הפלטים (Buffer לפי נתיב) מ-git; אחרת null. */
function fromHistory(stage, key) {
  const h = historyResults().byKey.get(stage.name + '|' + key);
  if (!h) return null;
  const rels = Object.keys(h.out);
  const bufs = catBatch(rels.map((r) => h.out[r]));
  if (bufs.some((b) => !b)) return null; // blob חסר (שכפול רדוד/גיזום) ⇒ מחשבים
  return { files: new Map(rels.map((r, k) => [r, bufs[k]])), reads: h.reads, commit: h.commit };
}

/* ═══════════════ הרצה ═══════════════ */

function runStage(stage, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, stage.run.map((a, k) => (k === 0 ? path.join(ROOT, a) : a)), { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } });
    // «מדרג»: הנתיב הקריטי (פותח ⇒ מוכיח ⇒ שילוב ⇒ דף) בעדיפות רגילה; כל שלב אחר שרץ לצידו — בעדיפות נמוכה (nice 10),
    // כך שהוא לא גוזל ליבות מהשלב שכולם מחכים לו. לא משנה שום פלט — רק את סדר-הקבלה של המעבד
    if (!stage.critical) { try { os.setPriority(child.pid, 10); } catch { /* לא חובה */ } }
    let log = '';
    child.stdout.on('data', (d) => { log += d; });
    child.stderr.on('data', (d) => { log += d; });
    child.on('exit', (code) => (code === 0 ? resolve(log) : reject(Object.assign(new Error(`${stage.name} נכשל (${code})\n${log.slice(-3000)}`), { log }))));
  });
}

/** מה שהשלב רשם שקרא (CATALOG_READS_OUT) ⇒ יחסיים, רק מתוך מפרטי-`reads`, ממוינים. */
function readsOf(stage, file) {
  let list = []; try { list = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* לא נרשם ⇒ אין */ }
  const rel = [...new Set(list.map((a) => path.relative(ROOT, a).split(path.sep).join('/')))].filter((f) => !f.startsWith('..') && stage.reads.some((sp) => specMatches(sp, f)));
  return rel.sort();
}
/** קבצים שנכתבו (פלטי-שלב) — במצב --watch הטביעות שלהם בזיכרון כבר לא בתוקף. */
let onWrote = () => {};

/**
 * בנייה אחת. check ⇒ רק השוואה לחותמות (בלי להריץ). מחזיר {rows, stale, ran} — ran = שמות השלבים שרצו או שוחזרו מהמטמון.
 */
export async function build({ check = false, times = false } = {}) {
  if (!WATCHING && !IDX) IDX = await gitIndexAsync(ROOT); // חמש הקריאות ל-git במקביל
  const stamps = readStamps();
  storedViews = stamps.views ?? null;
  const before = JSON.stringify(stagesOf(stamps));
  const t00 = Date.now();
  // הקבצים הפרושים (inner-*.json) מהמחסן — זול; המודולים עצמם (gen/) נוצרים רק כששלב שצריך להריץ אותם רץ.
  // SPEED1000: גם הקבצים הפרושים — רק לפני השלב הראשון שבאמת רץ (בלי שינוי ⇒ לא נוגעים בכלום)
  let gen = null;
  const ensureGen = () => (gen ??= import('../inner/lib/ensure-gen.mjs').then((m) => m.ensureGen({ quiet: true, modules: false })));
  const deps = graph();
  const rows = new Map();
  const done = new Set(); const running = new Map();
  const cores = Math.max(2, os.availableParallelism?.() ?? os.cpus().length);
  const ran = [];
  const wroteBy = new Set(); // שלבים שכתבו קבצים בבנייה הזו
  let stale = 0;
  const wrote = (stage) => { IDX = null; wroteBy.add(stage.name); forgetOuts(stage); onWrote(outFiles(stage)); };
  const one = async (stage, early) => {
    const t0 = Date.now();
    let how;
    // «מנחש ובודק»: שלב שהתחיל לפני שהשלב שלפניו גמר — רץ על הקלט הנוכחי; תקף רק אם השלבים שלפניו לא כתבו שום קובץ
    // (SPEED1000: במקום תמונת-מצב של כל הקלטים — stat לכל קובץ — שואלים אם מישהו כתב; שלב שכתב ⇒ מחדש, כמו קודם)
    const st = stamps.stages[stage.name];
    const key = CACHE_OFF ? null : await stageKey(stage, st?.reads);
    if (key && st && st.in === key && sameOut(outHashes(stage), st.out)) how = 'stamp';
    else if (check) { how = '✗ לא תואם'; stale++; }
    else {
      let reads = st?.reads;
      const hit = key && cacheGet('stage', key);
      if (hit) {
        // הפלטים מהמטמון: כל קובץ שונה נכתב; קובץ-פלט שלא היה אז — נמחק (כמו שהשלב עצמו היה עושה)
        const want = new Map(hit.files); let ok = true;
        const texts = new Map();
        for (const [rel, blob] of want) { const t = cacheGet('blob', blob); if (t === undefined) { ok = false; break; } texts.set(rel, t); }
        if (ok) {
          for (const rel of outFiles(stage)) if (!want.has(rel)) fs.rmSync(path.join(ROOT, rel));
          let n = 0;
          for (const [rel, t] of texts) { const abs = path.join(ROOT, rel); if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== t) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, t); n++; } }
          if (n) wrote(stage);
          how = n ? `cache (${n} נכתבו)` : 'cache';
          if (hit.reads) reads = hit.reads;
        }
      }
      // 📜 ההיסטוריה: אותו מפתח כבר חושב וקומט באיזשהו קומיט ⇒ הפלטים נשלפים מ-git, בלי לחשב
      const hh = !how && key ? fromHistory(stage, key) : null;
      if (hh) {
        for (const rel of outFiles(stage)) if (!hh.files.has(rel)) fs.rmSync(path.join(ROOT, rel));
        let n = 0;
        for (const [rel, b] of hh.files) { const abs = path.join(ROOT, rel); if (!fs.existsSync(abs) || !fs.readFileSync(abs).equals(b)) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, b); n++; } }
        if (n) wrote(stage);
        how = `history ${hh.commit.slice(0, 7)}` + (n ? ` (${n} נכתבו)` : '');
        if (hh.reads) reads = hh.reads;
      }
      if (!how) {
        await ensureGen();
        const outsBefore = outHashes(stage);
        const rf = stage.reads ? path.join(os.tmpdir(), `rebuild-reads-${process.pid}-${stage.name}.json`) : null;
        if (rf) fs.rmSync(rf, { force: true });
        try { await runStage(stage, rf ? { CATALOG_READS_OUT: rf } : {}); } finally { wrote(stage); }
        if (rf) { reads = readsOf(stage, rf); fs.rmSync(rf, { force: true }); }
        const outs = outHashes(stage);
        how = sameOut(outs, outsBefore) ? 'run (פלט זהה)' : 'run';
      }
      ran.push(stage.name);
      // השלב עם `reads`: הטביעה מחושבת מחדש לפי מה שנרשם עכשיו (לפני ההרצה — לפי מה שנרשם בפעם הקודמת)
      const k2 = CACHE_OFF ? null : stage.reads ? await stageKey(stage, reads) : key;
      if (k2 && how.startsWith('run')) {
        const files = outFiles(stage).map((rel) => { const text = fs.readFileSync(path.join(ROOT, rel), 'utf8'); const b = fingerprint(text); cachePut('blob', b, text); return [rel, b]; });
        cachePut('stage', k2, { files, ...(stage.reads ? { reads } : {}) });
      }
      if (k2) stamps.stages[stage.name] = { in: k2, out: outHashes(stage), ...(stage.reads ? { reads } : {}) };
    }
    if (early.length) {
      await Promise.all(early.map((d) => running.get(d)).filter(Boolean));
      if (early.some((d) => wroteBy.has(d))) { rows.set(stage.name + '·early', [how, 0, 0]); return one(stage, []); } // הניחוש לא החזיק ⇒ שוב
      how += ' ⚡מוקדם';
    }
    rows.set(stage.name, [how, (Date.now() - t0) / 1000, (t0 - t00) / 1000]);
  };
  // «מחלק» + «בתורות»: כל שלב שכל התלויות שלו גמרו — רץ, עד קיבולת-הליבות (שלב כבד = 3)
  await new Promise((resolve, reject) => {
    let load = 0;
    const pump = () => {
      if (done.size === STAGES.length) return resolve();
      for (const s of STAGES) {
        if (done.has(s.name) || running.has(s.name)) continue;
        const early = CACHE_OFF ? [] : (s.early ?? []).filter((d) => !done.has(d) && running.has(d));
        if (![...deps.get(s.name)].every((d) => done.has(d) || early.includes(d))) continue;
        const w = s.heavy ? 3 : 1;
        if (load > 0 && load + w > cores + (early.length ? 1 : 0)) continue;
        load += w;
        running.set(s.name, one(s, CACHE_OFF ? [] : early).then(() => { load -= w; running.delete(s.name); done.add(s.name); pump(); }, reject));
      }
    };
    pump();
  });
  // החותמות נכתבות רק כששלב השתנה (או שאין בהן עדיין טביעות-view בגרסה הנוכחית) — שכפול טרי בלי שינוי לא נוגע בכלום;
  // שינוי-הערה בקוד: אותן חותמות-שלב ⇒ גם טביעות-ה-view לא נכתבות (הן מאיצות בלבד; חסרה ⇒ מחושבת)
  if (!CACHE_OFF && !check && (JSON.stringify(stagesOf(stamps)) !== before || stamps.views?.algo !== viewAlgo())) {
    IDX = null;
    stamps.views = await viewsNow(stamps);
    fs.writeFileSync(path.join(ROOT, STAMPS), stampsText(stamps));
    onWrote([STAMPS]);
  }
  if (times || check) {
    for (const s of STAGES) { const [h, sec, at] = rows.get(s.name); console.log(`  ${s.name.padEnd(16)} ${h.padEnd(18)} ${sec.toFixed(1).padStart(6)}s  (מ-${at.toFixed(1)}s)`); }
    console.log(`  ${'סה"כ'.padEnd(16)} ${''.padEnd(18)} ${((Date.now() - t00) / 1000).toFixed(1).padStart(6)}s`);
  }
  return { rows, stale, ran };
}

/* ═══════════════ ⚡ מנוע תמיד-דלוק (--watch) — SPEED1000 ═══════════════ */

/**
 * תהליך אחד שנשאר פתוח ומחזיק בזיכרון: הטביעה של כל קובץ (sha — מהאינדקס פעם אחת, ואחר כך רק מה שהשתנה נקרא),
 * טביעות-ה-view (TS בלי הערות / כמו שהמפקד רואה — לפי sha), סריקות-התיקיות, ומודול המהדר (טעון). על שינוי-קובץ
 * (fs.watch רקורסיבי) ⇒ רק הקבצים שהשתנו נטבעים מחדש ⇒ אותו build() בדיוק ⇒ שלב שהטביעה שלו לא זזה לא רץ; שלב שזזה —
 * רץ כמו תמיד (תהליך נפרד, אותם פלטים). שינוי-הערה ⇒ אפס שלבים, אפס כתיבה. הפלטים = אותו build() ⇒ ביט-זהים לבנייה רגילה
 * (ratchet: speed1000.test — watch על עותק ⇒ אותם קבצים כמו rebuild).
 *   node catalog/scripts/rebuild.mjs --watch          # Ctrl-C לעצירה; שורה לכל סבב: כמה קבצים · כמה מ"ש · מה רץ
 */
const WATCH_ROOTS = ['catalog', 'src', 'telephony', 'functions'];
export async function watch({ log = console.log, onCycle = null, ready = null } = {}) {
  // הטביעות בזיכרון: sha לפי קובץ; קובץ שהשתנה ⇒ נמחק ⇒ נקרא מהתוכן (לא מהאינדקס, שכבר לא משקף אותו)
  const shas = new Map(); const reread = new Set();
  let base = null;
  WATCHING = true;
  SHA = (rel) => {
    let h = shas.get(rel);
    if (h !== undefined) return h;
    base ??= gitIndex(ROOT);
    h = reread.has(rel) ? fileSha(ROOT, null, rel) : fileSha(ROOT, base, rel);
    shas.set(rel, h);
    return h;
  };
  const machineSpecs = [...MACHINE, ...SALT_DIRS.map((d) => d + '/'), 'catalog/self/parts.mjs'];
  const touch = (rel) => {
    shas.delete(rel); reread.add(rel);
    // רשימת-התיקייה משתנה רק כשקובץ נוסף/נמחק — קובץ קיים שכבר ברשימה ⇒ הסריקות נשארות
    const dir = path.posix.dirname(rel);
    const listed = walkMemo.get(dir)?.includes(rel);
    if (!(listed && fs.existsSync(path.join(ROOT, rel)))) for (let d = dir; ; d = path.posix.dirname(d)) { walkMemo.delete(d); if (d === '.' || !d.includes('/')) break; }
    if (/^catalog\/lib\/(blank|cache|census-view)\.mjs$/.test(rel)) algoMemo = null;
    // מפתחות-השלבים: רק שלב שהקובץ במפרטי-הקלט/הפלט שלו (או קוד-המכונה ⇒ כולם) מחושב מחדש
    if (machineSpecs.some((sp) => specMatches(sp, rel)) || !listed) { machineMemo = null; keyMemo.clear(); return; }
    for (const st of STAGES) if (st.in.some((sp) => specMatches(sp, rel)) || isOutOf(st, rel)) for (const k of [...keyMemo.keys()]) if (k.startsWith(st.name + '|')) keyMemo.delete(k);
  };
  onWrote = (files) => { for (const f of files) touch(f); };
  const ignore = (rel) => rel.split('/').some((seg) => SKIP_DIR.has(seg)) || /(^|\/)\.env/.test(rel) || /\.tmp$|~$/.test(rel) || /^catalog\/(sources|behavior)\/inner-[^/]*\.json$/.test(rel) || /\/\.self-loop-hist-/.test(rel);
  const pending = new Set();
  let timer = null; let busy = false; let again = false; let cycles = 0;
  const cycle = async () => {
    if (busy) { again = true; return; }
    busy = true;
    const t0 = performance.now();
    const changed = [...pending]; pending.clear();
    for (const f of changed) touch(f);
    let res; let err = null;
    try { res = await build(); } catch (e) { err = e; }
    const ms = performance.now() - t0;
    cycles++;
    const line = err ? `✗ סבב ${cycles}: ${String(err.message).split('\n')[0]}` : `⚡ סבב ${cycles}: ${changed.length} קבצים · ${ms.toFixed(0)} מ"ש · ${res.ran.length ? 'רצו: ' + res.ran.join(', ') : 'אפס שלבים'}`;
    log(line);
    onCycle?.({ changed, ms, ran: res?.ran ?? [], err });
    busy = false;
    if (again || pending.size) { again = false; schedule(); }
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(cycle, 15); };
  const watchers = [];
  for (const r of WATCH_ROOTS) {
    if (!fs.existsSync(path.join(ROOT, r))) continue;
    watchers.push(fs.watch(path.join(ROOT, r), { recursive: true }, (_ev, name) => { if (!name) return; const rel = r + '/' + String(name).split(path.sep).join('/'); if (!ignore(rel)) { pending.add(rel); schedule(); } }));
  }
  for (const f of TSENV) if (fs.existsSync(path.join(ROOT, f))) watchers.push(fs.watch(path.join(ROOT, f), () => { pending.add(f); schedule(); }));
  // הסבב הראשון — בנייה רגילה (מטעין גם את המהדר מראש, כדי ששינוי ראשון לא ישלם על הטעינה)
  const t0 = performance.now();
  const first = await build();
  await import('../lib/blank.mjs'); await import('../lib/census-view.mjs');
  log(`⚡ מוכן (${(performance.now() - t0).toFixed(0)} מ"ש${first.ran.length ? ' · רצו: ' + first.ran.join(', ') : ''}) — מקשיב לשינויים ב-${WATCH_ROOTS.join(' · ')}`);
  ready?.();
  return { close: () => { for (const w of watchers) w.close(); clearTimeout(timer); } };
}

async function main() {
  const TIMES = process.argv.includes('--times');
  const CHECK = process.argv.includes('--check');
  if (process.argv.includes('--watch')) { await watch(); return; }
  const { stale } = await build({ check: CHECK, times: TIMES });
  if (CHECK) { if (stale) { console.error(`✗ ${stale} שלבים לא תואמים לחותמת — הרץ: node catalog/scripts/rebuild.mjs`); process.exit(1); } console.log('✓ כל השלבים תואמים לחותמות שבריפו'); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
