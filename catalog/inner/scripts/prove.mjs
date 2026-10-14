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
 *   --workers N (ברירת-מחדל 4) · --only <מחרוזת> · --timeout ms (לחלק; ברירת-מחדל 20000) · --src <dir>
 * דטרמיניסטי: הפלט ממוין לפי id ולא תלוי במספר העובדים.
 */
import { Worker } from 'node:worker_threads';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleBridge } from '../../lib/load-bridge.mjs';
import { literalPool } from '../../lib/tsdesc.mjs';
import { tally } from '../../lib/entry.mjs';
import { entriesFor } from '../lib/prove-job.mjs';
import { ORDER, REPOS } from '../lib/repos.mjs';
import { readSigs } from '../lib/sigs.mjs';
import { ensureGen, storePath } from '../lib/ensure-gen.mjs';
import { packBehavior, storeText } from '../lib/store.mjs';
import { byId } from '../../self/parts.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SRC = path.resolve(ROOT, opt('--src', process.env.CATALOG_SRC || '../catsrc'));
const WORKERS = Number(opt('--workers', Math.min(4, os.cpus().length)));
const ONLY = opt('--only', '');
const TIMEOUT = Number(opt('--timeout', 20000));
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
      abs, pool,
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

export function runBucket(jobs, bridgePath, results, pairs) {
  return new Promise((resolve) => {
    let rest = jobs.map((j) => ({ ...j, parts: j.parts.slice() }));
    const spawn = () => {
      rest = rest.map((j) => ({ ...j, parts: j.parts.filter((p) => !results.has(p.id)) })).filter((j) => j.parts.length);
      if (!rest.length) return resolve();
      const w = new Worker(path.join(ROOT, 'catalog/inner/scripts/prove-worker.mjs'), { workerData: { bridgePath, jobs: rest, seed: SEED }, env: process.env.CATALOG_CACHE ? { CATALOG_CACHE: process.env.CATALOG_CACHE } : {}, resourceLimits: { maxOldGenerationSizeMb: 1536 }, stdout: true, stderr: true });
      let cur = null; let timer = null;
      const arm = () => { clearTimeout(timer); timer = setTimeout(() => { if (cur) results.set(cur, { status: 'timeout' }); w.terminate(); }, TIMEOUT); };
      w.on('message', (m) => {
        if (m.type === 'start') { cur = m.id; arm(); }
        else if (m.type === 'done') { results.set(m.id, m.result); cur = null; clearTimeout(timer); }
        else if (m.type === 'pairs') pairs.push(...m.pairs);
        else if (m.type === 'end') clearTimeout(timer);
      });
      w.on('error', () => { if (cur) results.set(cur, { status: 'crashed' }); });
      w.on('exit', () => { clearTimeout(timer); if (cur && !results.has(cur)) results.set(cur, { status: 'crashed' }); spawn(); });
    };
    spawn();
  });
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
  const results = new Map(); const pairs = [];
  const buckets = Array.from({ length: Math.max(1, WORKERS) }, () => []);
  // חלוקה מאוזנת לפי מספר החלקים (קבועה; הפלט ממוין בסוף)
  const load = buckets.map(() => 0);
  for (const j of jobs.slice().sort((a, b) => b.parts.length - a.parts.length || (a.abs < b.abs ? -1 : 1))) { const k = load.indexOf(Math.min(...load)); buckets[k].push(j); load[k] += j.parts.length; }
  await Promise.all(buckets.map((b) => runBucket(b, bridgePath, results, pairs)));
  const sigs = new Map(jobs.flatMap((j) => j.parts.map((p) => [p.id, p.sig])));
  const entries = entriesFor(doc.parts.filter((p) => !ONLY || p.id.includes(ONLY)), results, pairs, sigs);
  if (ONLY) { console.log(JSON.stringify(entries, null, 1)); return; }
  const totals = tally(entries);
  totals.withMotion = entries.filter((e) => e.motion).length;
  const out = { source: `inner-${source}`, ref: doc.ref, probe: { version: PROVE_VERSION, seed: SEED, generatedAt: null }, totals, parts: entries.sort(byId) };
  fs.writeFileSync(path.join(ROOT, 'catalog/behavior', `inner-${source}.json`), JSON.stringify(out, null, 1) + '\n');
  // v2: בריפו — המחסן הדחוס; הקובץ הפרוש (gitignored) נוצר ממנו לפי דרישה, ביט-זהה
  fs.writeFileSync(path.join(ROOT, storePath('behavior', source)), storeText(packBehavior(out, doc.parts.map((p) => p.id)).store));
  console.log(`inner-${source}: ${doc.parts.length} חלקים · run ${totals.run} (עם פועל ${totals.runWithVerb}, עם תנועה ${totals.withMotion}) · static ${totals.static} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
