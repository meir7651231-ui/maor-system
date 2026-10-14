#!/usr/bin/env node
/**
 * 🔬 מוכיח את החלקים הפנימיים (INNER, 14.10.2026) — כותב catalog/behavior/inner-<source>.json.
 *
 * אותו קורא-התנהגות של הקטלוג (catalog/lib/probe.mjs), אותו ארגז-חול (catalog/lib/sandbox.mjs), אותו זרע:
 * כל פונקציה מורמת מורצת על קלטים מחוללים (הצורה מטיפוסי-המקור, ‏SIGS במודול) ופועל נרשם **רק** אם כל החוקים
 * שלו עברו על כל המקרים (n/n). השם לא משתתף. בנוסף — `motion`: תכונות-התנועה (lib/motion.mjs), גם הן בהרצה.
 *
 *   node catalog/inner/scripts/prove.mjs                  # כל המקורות שיש להם inner-<source>.json
 *   node catalog/inner/scripts/prove.mjs --source orbit
 *   --workers N (ברירת-מחדל 4) · --only <מחרוזת> · --src <dir>   (⏱️ SELF-V2: עצירה = תקציב-צעדים, לא שעון)
 * דטרמיניסטי: הפלט ממוין לפי id ולא תלוי במספר העובדים.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleBridge } from '../../lib/load-bridge.mjs';
import { literalPool } from '../../lib/tsdesc.mjs';
import { tally } from '../../lib/entry.mjs';
import { entriesFor, jobKeyOf, resultKeyOf } from '../lib/prove-job.mjs';
import { relDep } from '../../lib/probe-file.mjs';
import { writeIfChanged } from '../../lib/write.mjs';
import { fingerprint, cacheGet, CACHE_OFF } from '../../lib/cache.mjs';
import { ORDER, REPOS } from '../lib/repos.mjs';
import { readSigs } from '../lib/sigs.mjs';
import { ensureGen, storePath } from '../lib/ensure-gen.mjs';
import { packBehavior, storeText } from '../lib/store.mjs';
import { byId } from '../../self/parts.mjs';
import { runPool } from '../../lib/pool.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SRC = path.resolve(ROOT, opt('--src', process.env.CATALOG_SRC || '../catsrc'));
const WORKERS = Number(opt('--workers', Math.min(4, os.cpus().length)));
const ONLY = opt('--only', '');
export const SEED = 0x0ca7a10; // = הזרע של behavior-probe.mjs
export const PROVE_VERSION = 1;
const want = opt('--source', '') ? opt('--source', '').split(',') : ORDER;

/** עבודות לפי מודול-gen. */
export function jobsFor(doc, source) {
  const R = REPOS[source];
  const base = R.dir ? path.join(SRC, R.dir) : ROOT;
  const byGen = new Map();
  for (const p of doc.parts) {
    if (ONLY && !p.id.includes(ONLY)) continue;
    const tag = p.tags.find((t) => t.startsWith('gen:'));
    const [genRel, exp] = tag.slice(4).split('#');
    if (!byGen.has(genRel)) byGen.set(genRel, { genRel, orig: p.path, parts: [] });
    byGen.get(genRel).parts.push({ p, exp });
  }
  const jobs = [];
  for (const { genRel, orig, parts } of [...byGen.values()].sort((a, b) => (a.genRel < b.genRel ? -1 : 1))) {
    const abs = path.join(ROOT, genRel);
    const sigs = readSigs(fs.readFileSync(abs, 'utf8'));
    const origAbs = path.join(base, orig);
    const pool = fs.existsSync(origAbs) ? literalPool(origAbs) : { str: [], num: [] };
    jobs.push({
      abs, rel: genRel, base: ROOT, pool, records: fingerprint(JSON.stringify(parts.map(({ p }) => p))),
      parts: parts.map(({ p, exp }) => ({
        id: p.id, exp,
        sig: { takes: (sigs[exp] ?? []).map((t, k) => ({ ...t, kind: p.takes[k]?.kind ?? 'unknown' })) },
        // אחים (x ו-y של אותה פונקציה, אותם קלטים) מקבלים אותם בסיסים — כך אפשר לבדוק אם הם מקיפים יחד
        motionKey: p.symbol.replace(/\.[^.]*$/, '') + (p.symbol.endsWith(':step') ? ':step' : ''),
      })),
    });
  }
  return jobs;
}

/** null ⇒ אפשר להוכיח; אחרת — למה לא (אין שכפול / השכפול ב-ref אחר מהמפקד). אורביט = הריפו הזה. */
const readJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); } catch { return null; } };

export function cloneMissing(source) {
  const R = REPOS[source];
  if (!R?.dir) return null;
  const dir = path.join(SRC, R.dir);
  if (!fs.existsSync(dir)) return 'אין שכפול ב-' + dir;
  const sha = String(JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/sources', R.catalog + '.json'), 'utf8')).ref).split('@')[1] ?? '';
  let head = '';
  try { head = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* */ }
  return sha && head.startsWith(sha.slice(0, 7)) ? null : `השכפול ב-${head.slice(0, 7) || '?'} ולא ב-${sha.slice(0, 7)}`;
}

async function main() {
  if (want.length > 1) {
    await ensureGen({ src: SRC });
    const pass = args.filter((a, k) => a !== '--source' && args[k - 1] !== '--source');
    for (const name of want) if (fs.existsSync(path.join(ROOT, storePath('parts', name)))) execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--source', name, ...pass], { stdio: 'inherit' });
    return;
  }
  const source = want[0];
  await ensureGen({ sources: [source], src: SRC });
  const file = path.join(ROOT, 'catalog/sources', `inner-${source}.json`);
  if (!fs.existsSync(file)) { console.log(`· ${source}: אין inner-${source}.json — מדולג`); return; }
  // 🪞 SELF: בלי השכפול אין מילון-הקוד של הקובץ המקורי (literalPool) ⇒ קלטים אחרים ⇒ תוצאות אחרות, והמחסן שבריפו נדרס
  // בשקט (נתפס כשהמכונה הריצה את עצמה). בלי שכפול / ב-ref אחר — המחסן נשמר כמו שהוא. ratchet: self.test
  const why = cloneMissing(source);
  if (why) { console.log(`· inner-${source}: ${why} — המחסן נשמר כמו שהוא`); return; }
  const t0 = Date.now();
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const bridgePath = await bundleBridge();
  const jobs = jobsFor(doc, source);
  /*
   * ⚡ SELF-V2: «מחפש לפי מפתח» בתהליך הראשי, לכל מודול-gen: מפתח-העבודה + טביעת מה שנארז ⇒ מטמון מקומי (תוצאות +
   * זוגות-המסלול) ⇒ או **החותמת שבריפו** (catalog/self/stamps/inner-<source>.json: המפתח שממנו נוצרו השורות שכבר במחסן,
   * + טביעת רשומות-החלקים) ⇒ או הרצה. רק מודולים שהמפתח שלהם השתנה הולכים לעובדים. CATALOG_CACHE=off ⇒ הכול רץ.
   */
  const SP = !ONLY && `catalog/self/stamps/inner-${source}.json`;
  const committed = (!CACHE_OFF && process.env.CATALOG_STAMPS !== 'off' && SP && readJson(SP)) || { jobs: {} };
  const prev = new Map(!CACHE_OFF ? (readJson(`catalog/behavior/inner-${source}.json`)?.parts ?? []).map((e) => [e.id, e]) : []);
  const commitKey = (resultKey, job) => fingerprint('commit-v1', resultKey, job.records).slice(0, 16);
  const pairs = []; const results = new Map(); const reused = new Map(); const depsOf = new Map(); const todo = [];
  for (const job of jobs) {
    const jk = jobKeyOf(job, SEED);
    const known = (CACHE_OFF ? null : cacheGet('prove-deps', jk)) ?? committed.jobs[job.rel]?.deps?.map((r) => path.join(ROOT, r));
    if (known) {
      depsOf.set(job.abs, known);
      const rk = resultKeyOf(jk, known, ROOT);
      const hit = CACHE_OFF ? undefined : cacheGet('prove', rk);
      if (hit) { for (const [id, r] of hit.results) results.set(id, r); pairs.push(...hit.pairs); continue; }
      if (committed.jobs[job.rel]?.key === commitKey(rk, job) && job.parts.every((p) => prev.has(p.id))) { for (const p of job.parts) reused.set(p.id, prev.get(p.id)); continue; }
    }
    todo.push(job);
  }
  // «מחלק» + «בתורות» — מאגר-העובדים המשותף (lib/pool.mjs): חלוקה מאוזנת קבועה; הפלט ממוין בסוף
  await runPool({ file: path.join(ROOT, 'catalog/inner/scripts/prove-worker.mjs'), jobs: todo, workers: WORKERS, data: { bridgePath, seed: SEED }, results, onMessage: (m) => { if (m.type === 'pairs') pairs.push(...m.pairs); else if (m.type === 'deps') depsOf.set(m.abs, m.deps); } });
  const sigs = new Map(jobs.flatMap((j) => j.parts.map((p) => [p.id, p.sig])));
  const fresh = entriesFor(doc.parts.filter((p) => (!ONLY || p.id.includes(ONLY)) && !reused.has(p.id)), results, pairs.sort((a, b) => (a.a < b.a ? -1 : a.a > b.a ? 1 : a.b < b.b ? -1 : a.b > b.b ? 1 : 0)), sigs);
  const byIdFresh = new Map(fresh.map((e) => [e.id, e]));
  const entries = doc.parts.filter((p) => !ONLY || p.id.includes(ONLY)).map((p) => reused.get(p.id) ?? byIdFresh.get(p.id));
  if (ONLY) { console.log(JSON.stringify(entries, null, 1)); return; }
  const totals = tally(entries);
  totals.withMotion = entries.filter((e) => e.motion).length;
  const out = { source: `inner-${source}`, ref: doc.ref, probe: { version: PROVE_VERSION, seed: SEED, generatedAt: null }, totals, parts: entries.sort(byId) };
  writeIfChanged(path.join(ROOT, 'catalog/behavior', `inner-${source}.json`), JSON.stringify(out, null, 1) + '\n');
  // v2: בריפו — המחסן הדחוס; הקובץ הפרוש (gitignored) נוצר ממנו לפי דרישה, ביט-זהה
  writeIfChanged(path.join(ROOT, storePath('behavior', source)), storeText(packBehavior(out, doc.parts.map((p) => p.id)).store));
  // החותמות: לכל מודול — מה נארז (יחסי) והמפתח שממנו נוצרו השורות (עובד שקרס ⇒ בלי חותמת, ירוץ שוב)
  const stamps = { version: 1, seed: SEED, jobs: {} };
  for (const job of jobs) {
    const deps = depsOf.get(job.abs) ?? [job.abs];
    if (job.parts.some((p) => !reused.has(p.id) && ['crashed', 'watchdog'].includes(results.get(p.id)?.status))) continue;
    stamps.jobs[job.rel] = { deps: deps.map((f) => relDep(ROOT, f)), key: commitKey(resultKeyOf(jobKeyOf(job, SEED), deps, ROOT), job) };
  }
  writeIfChanged(path.join(ROOT, SP), JSON.stringify(stamps, null, 1) + '\n');
  console.log(`inner-${source}: ${doc.parts.length} חלקים · run ${totals.run} (עם פועל ${totals.runWithVerb}, עם תנועה ${totals.withMotion}) · static ${totals.static} · ${todo.length} מודולים רצו עכשיו, ${jobs.length - todo.length} מהמטמון/החותמת · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
