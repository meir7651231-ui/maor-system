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
import { fingerprint, machineSalt, cacheGet, cachePut, CACHE_OFF } from '../lib/cache.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const STAMPS = 'catalog/self/stamps.json';

/* ═══════════════ הקלטים ═══════════════ */

/** קוד-המכונה: כל שלב תלוי בו (שינוי בחוק/במחולל/בסקריפט ⇒ הכול מחדש). */
const MACHINE = ['catalog/lib/*', 'catalog/core/*.mjs', 'catalog/inner/lib/*', 'catalog/inner/scripts/*', 'catalog/scripts/*', 'catalog/combiner/*.mjs', 'catalog/combiner/*.ts', 'catalog/self/parts.mjs', 'catalog/self/roles.mjs', 'src/lib/atoms/verify/', 'src/lib/atoms/parts/'];
/** הקוד של אורביט (הריפו הזה) · וההגדרות שהמהדר קורא כשהוא פותר ייבוא. */
const CODE = ['src/', 'telephony/', 'functions/'];
const TSENV = ['package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'jsconfig.json'];
const view = (...ps) => ps.map((p) => ({ p, view: true })); // TS בלי הערות (lib/blank.mjs)
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
  { name: 'orbit-census', run: ['catalog/scripts/orbit-census.mjs'], in: [...CODE, 'catalog/names/orbit.json', 'catalog/schema.json', 'package.json'], out: ['catalog/sources/orbit.json'] },
  { name: 'core-census', run: ['catalog/scripts/core-census.mjs'], in: ['catalog/core/origins.json', 'catalog/schema.json'], out: ['catalog/sources/core.json'] },
  { name: 'core-b-census', run: ['catalog/scripts/core-b-census.mjs'], in: ['catalog/core/origins-b.json'], out: ['catalog/sources/core-b.json'] },
  { name: 'core-c-census', run: ['catalog/scripts/core-c-census.mjs'], in: ['catalog/core/origins-c.json'], out: ['catalog/sources/core-c.json'] },
  { name: 'open-orbit', early: ['orbit-census'], run: ['catalog/inner/scripts/open.mjs', '--source', 'orbit'], in: [...view(...CODE), ...TSENV, 'catalog/sources/orbit.json'], out: ['catalog/inner/store/parts-orbit.json', 'catalog/inner/open-orbit.json', 'catalog/inner/gen.manifest.json'] },
  { name: 'probe-orbit', early: ['orbit-census'], run: ['catalog/scripts/behavior-probe.mjs', '--source', 'orbit'], in: [...view(...CODE), ...TSENV, 'catalog/sources/orbit.json'], out: ['catalog/behavior/orbit.json', 'catalog/self/stamps/behavior-orbit.json'], heavy: true },
  { name: 'probe-core', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core'], in: ['catalog/sources/core.json'], out: ['catalog/behavior/core.json', 'catalog/self/stamps/behavior-core.json'], heavy: true },
  { name: 'probe-core-b', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core-b'], in: ['catalog/sources/core-b.json'], out: ['catalog/behavior/core-b.json', 'catalog/self/stamps/behavior-core-b.json'], heavy: true },
  { name: 'probe-core-c', run: ['catalog/scripts/behavior-probe.mjs', '--source', 'core-c'], in: ['catalog/sources/core-c.json'], out: ['catalog/behavior/core-c.json', 'catalog/self/stamps/behavior-core-c.json'], heavy: true },
  { name: 'prove-orbit', run: ['catalog/inner/scripts/prove.mjs', '--source', 'orbit'], in: [...view(...CODE), 'catalog/inner/store/parts-orbit.json', 'catalog/inner/gen.manifest.json'], out: ['catalog/inner/store/behavior-orbit.json', 'catalog/self/stamps/inner-orbit.json'], heavy: true },
  { name: 'catalog-build', run: ['catalog/scripts/catalog-build.mjs'], in: [SOURCES, BEHAVIOR, STORES, 'catalog/inner/gen.manifest.json', 'catalog/names/', 'catalog/notes/', 'catalog/schema.json'], out: ['catalog/index.json', 'catalog/verbs.json', 'catalog/verbs.md', 'catalog/alphabet.md'] },
  { name: 'lift', run: ['catalog/inner/scripts/lift.mjs'], in: [SOURCES, BEHAVIOR, STORES, GOALS, 'catalog/inner/gen.manifest.json', 'catalog/inner/motion-baseline.json', 'catalog/verbs.json'], out: ['catalog/inner/lift.json'] },
  { name: 'goals-coverage', run: ['catalog/scripts/goals-coverage.mjs'], in: [SOURCES, BEHAVIOR, STORES, GOALS, 'catalog/inner/gen.manifest.json'], out: ['catalog/goals/coverage.json', 'catalog/goals/coverage.md'] },
  { name: 'core-demo', run: ['catalog/scripts/core-demo.mjs'], in: ['catalog/core/origins.json'], out: ['catalog/core/demo.html'] },
  { name: 'combiner-prove', run: ['catalog/combiner/prove.mjs'], in: [...view(...CODE), ...TSENV], out: ['catalog/combiner/proofs.json'] },
  { name: 'combine', early: ['catalog-build'], run: ['catalog/combiner/combine.mjs'], in: [...view(...CODE), ...TSENV, SOURCES, BEHAVIOR, STORES, GOALS, RECIPES, ...COMBINER_DATA, 'catalog/combiner/proofs.json', 'catalog/inner/gen.manifest.json', 'catalog/verbs.json', { p: 'catalog/self/stamps/*.json', not: /\/combine\.json$/ }], out: ['catalog/combiner/combos.json', 'catalog/recipes/combo-', 'catalog/self/stamps/combine.json'] },
  { name: 'build', run: ['catalog/combiner/build.mjs'], in: [SOURCES, BEHAVIOR, STORES, GOALS, 'catalog/recipes/', ...COMBINER_DATA, 'catalog/combiner/proofs.json', 'catalog/inner/gen.manifest.json', 'catalog/verbs.json'], out: ['catalog/combiner/lab-data.json', 'catalog/combiner/dig/'] },
  { name: 'self-check', run: ['catalog/scripts/self-check.mjs'], in: ['catalog/schema.json', ...TSENV, 'src/lib/atoms/'], out: ['catalog/self/machine.json', 'catalog/self/behavior-machine.json', 'catalog/self/report.json'], heavy: true },
];

const SKIP_DIR = new Set(['node_modules', 'gen', '.git', '.cache']);
function walk(rel, out) {
  let es; try { es = fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true }); } catch { return; }
  for (const e of es) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk(r, out); } else if (e.isFile() && !/^\.env/.test(e.name)) out.push(r); // סודות (.env*) לא נקראים ולא נטבעים
  }
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

const hashMemo = new Map();
let blankMod = null;
/** טביעת קובץ: התוכן כמו שהוא, או (view) — TS בלי הערות. */
async function fileHash(rel, asView) {
  const stt = fs.statSync(path.join(ROOT, rel));
  const k = (asView ? 'v:' : 'r:') + rel + ':' + stt.mtimeMs + ':' + stt.size; // קובץ שנכתב מחדש ⇒ טביעה חדשה
  if (hashMemo.has(k)) return hashMemo.get(k);
  const buf = fs.readFileSync(path.join(ROOT, rel));
  let h;
  if (asView) {
    blankMod ??= await import('../lib/blank.mjs');
    h = blankMod.isBlankable(rel) ? fingerprint('view', blankMod.sourceViewCached(rel, buf.toString('utf8'))) : fingerprint(buf);
  } else h = fingerprint(buf);
  hashMemo.set(k, h);
  return h;
}

/** «מלח» של קוד-המכונה ושל הסביבה (node ראשי · typescript · rolldown) — משותף לכל השלבים. */
let machineMemo = null;
async function machineKey() {
  if (machineMemo) return machineMemo;
  const files = [...new Set(MACHINE.flatMap(expand))].sort();
  const hs = await Promise.all(files.map((f) => fileHash(f, false)));
  machineMemo = fingerprint(machineSalt(), 'machine-v2', ...files.flatMap((f, k) => [f, hs[k]]));
  return machineMemo;
}

/** הקבצים שהשלב קורא (בלי הפלטים שלו). */
export function inputFiles(stage) {
  const seen = new Map();
  for (const spec of stage.in) {
    const s = typeof spec === 'string' ? { p: spec } : spec;
    for (const f of expand(s)) if (!isOutOf(stage, f)) seen.set(f, seen.get(f) || !!s.view);
  }
  return [...seen].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** טביעת-השלב: המלח + שם + פקודה + כל קובץ-קלט (נתיב + טביעה). */
export async function stageKey(stage) {
  const files = inputFiles(stage);
  const hs = await Promise.all(files.map(([f, v]) => fileHash(f, v)));
  return fingerprint(await machineKey(), 'stage-v2', stage.name, JSON.stringify(stage.run), ...files.flatMap(([f, v], k) => [f + (v ? '#view' : ''), hs[k]]));
}

/** תמונת-מצב של קלטי-השלב (נתיב · גודל · זמן-שינוי) — "לא נגעו בהם" בין תחילת השלב לסופו. */
function inputSnapshot(stage) {
  return fingerprint(...inputFiles(stage).flatMap(([f]) => { const st = fs.statSync(path.join(ROOT, f)); return [f, String(st.size), String(st.mtimeMs)]; }));
}

/* ═══════════════ החותמות שבריפו ═══════════════ */

export function readStamps() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, STAMPS), 'utf8')); } catch { return { version: 1, stages: {} }; }
}
const stampsText = (st) => JSON.stringify({
  version: 1,
  note: 'נוצר ע"י catalog/scripts/rebuild.mjs — לכל שלב: טביעת-הקלטים שממנה נוצרו הפלטים שבריפו, וטביעת כל פלט. שכפול טרי שהקלטים שלו זהים ⇒ השלב לא רץ.',
  stages: Object.fromEntries(STAGES.filter((s) => st.stages[s.name]).map((s) => [s.name, st.stages[s.name]])),
}, null, 1) + '\n';
const outHashes = (stage) => Object.fromEntries(outFiles(stage).map((f) => [f, fingerprint(fs.readFileSync(path.join(ROOT, f)))]));
const sameOut = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ═══════════════ הגרף ═══════════════ */

/** stage ⇒ שמות-השלבים שהוא תלוי בהם (פלט של שלב אחר שנקרא כקלט). פלט = קובץ · תיקייה/ · תחילית — נבדק על דוגמה. */
export function graph() {
  const sample = (o) => (o.endsWith('/') ? o + 'x' : /\.\w+$/.test(o) ? o : o + 'x.json');
  const deps = new Map(STAGES.map((s) => [s.name, new Set()]));
  for (const b of STAGES) for (const a of STAGES) if (a !== b && a.out.some((o) => b.in.some((spec) => specMatches(spec, sample(o))))) deps.get(b.name).add(a.name);
  return deps;
}

/* ═══════════════ הרצה ═══════════════ */

function runStage(stage) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, stage.run.map((a, k) => (k === 0 ? path.join(ROOT, a) : a)), { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', (d) => { log += d; });
    child.stderr.on('data', (d) => { log += d; });
    child.on('exit', (code) => (code === 0 ? resolve(log) : reject(Object.assign(new Error(`${stage.name} נכשל (${code})\n${log.slice(-3000)}`), { log }))));
  });
}

async function main() {
  const TIMES = process.argv.includes('--times');
  const CHECK = process.argv.includes('--check');
  const stamps = readStamps();
  const before = stampsText(stamps);
  const t00 = Date.now();
  // הקבצים הפרושים (inner-*.json) מהמחסן — זול; המודולים עצמם (gen/) נוצרים רק כששלב שצריך להריץ אותם רץ
  if (!CHECK) await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true, modules: false });
  const deps = graph();
  const rows = new Map();
  const done = new Set(); const running = new Map();
  const cores = Math.max(2, os.availableParallelism?.() ?? os.cpus().length);
  let stale = 0;
  const one = async (stage, early) => {
    const t0 = Date.now();
    let how;
    // «מנחש ובודק»: שלב שהתחיל לפני שהשלב שלפניו גמר — רץ על הקלט הנוכחי; תקף רק אם בסוף הקלטים זהים ולא נכתבו מחדש
    const snap = early.length ? inputSnapshot(stage) : null;
    const key = CACHE_OFF ? null : await stageKey(stage);
    const st = stamps.stages[stage.name];
    if (key && st && st.in === key && sameOut(outHashes(stage), st.out)) how = 'stamp';
    else if (CHECK) { how = '✗ לא תואם'; stale++; }
    else {
      const hit = key && cacheGet('stage', key);
      if (hit) {
        // הפלטים מהמטמון: כל קובץ שונה נכתב; קובץ-פלט שלא היה אז — נמחק (כמו שהשלב עצמו היה עושה)
        const want = new Map(hit.files); let ok = true;
        const texts = new Map();
        for (const [rel, blob] of want) { const t = cacheGet('blob', blob); if (t === undefined) { ok = false; break; } texts.set(rel, t); }
        if (ok) {
          for (const rel of outFiles(stage)) if (!want.has(rel)) fs.rmSync(path.join(ROOT, rel));
          let wrote = 0;
          for (const [rel, t] of texts) { const abs = path.join(ROOT, rel); if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== t) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, t); wrote++; } }
          how = wrote ? `cache (${wrote} נכתבו)` : 'cache';
        }
      }
      if (!how) {
        const outsBefore = outHashes(stage);
        await runStage(stage);
        const outs = outHashes(stage);
        how = sameOut(outs, outsBefore) ? 'run (פלט זהה)' : 'run';
        if (key) {
          const files = outFiles(stage).map((rel) => { const text = fs.readFileSync(path.join(ROOT, rel), 'utf8'); const b = fingerprint(text); cachePut('blob', b, text); return [rel, b]; });
          cachePut('stage', key, { files });
        }
      }
      if (key) stamps.stages[stage.name] = { in: key, out: outHashes(stage) };
    }
    if (early.length) {
      await Promise.all(early.map((d) => running.get(d)).filter(Boolean));
      if (inputSnapshot(stage) !== snap) { rows.set(stage.name + '·early', [how, 0, 0]); return one(stage, []); } // הניחוש לא החזיק ⇒ שוב
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
  if (!CACHE_OFF && !CHECK) { const t = stampsText(stamps); if (t !== before) fs.writeFileSync(path.join(ROOT, STAMPS), t); }
  if (TIMES || CHECK) {
    for (const s of STAGES) { const [h, sec, at] = rows.get(s.name); console.log(`  ${s.name.padEnd(16)} ${h.padEnd(18)} ${sec.toFixed(1).padStart(6)}s  (מ-${at.toFixed(1)}s)`); }
    console.log(`  ${'סה"כ'.padEnd(16)} ${''.padEnd(18)} ${((Date.now() - t00) / 1000).toFixed(1).padStart(6)}s`);
  }
  if (CHECK) { if (stale) { console.error(`✗ ${stale} שלבים לא תואמים לחותמת — הרץ: node catalog/scripts/rebuild.mjs`); process.exit(1); } console.log('✓ כל השלבים תואמים לחותמות שבריפו'); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
