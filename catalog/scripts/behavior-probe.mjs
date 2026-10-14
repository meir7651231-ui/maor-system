#!/usr/bin/env node
/**
 * 🔬 קורא-ההתנהגות (CATALOG-VERBS, 14.10.2026) — כותב catalog/behavior/<source>.json.
 *
 * לכל חלק במקור:
 *   · **run** — חלק טהור ב-TS/JS (או לבנת-טבעות עם המריץ שלה): מריצים בארגז-חול על קלטים עם זרע ובודקים את חוקי כל פועל.
 *   · **twin** — חלק של המחולל (Dart) שהוא העתק מוצהר/בעל-אותה-חתימה של חלק שהורץ באורביט/BuildSmart: מקבל את התווית שלו.
 *   · **static** — כל השאר (Dart, Python, מכונה בלי מריץ, לא-טהור, או שההרצה נכשלה): ניחוש משם/סמל/חתימה, עם סיבה.
 *
 * הרצה:
 *   node catalog/scripts/behavior-probe.mjs                     # כל המקורות
 *   node catalog/scripts/behavior-probe.mjs --source orbit,rings
 *   --src <dir>   שכפולי-הקריאה של שאר הריפואים (ברירת-מחדל: $CATALOG_SRC או ../catsrc): buildsmart · rings · 14kk · mmmm · yoman · yeshiva
 *   --workers N   (ברירת-מחדל 4) · --only <מחרוזת> (רק חלקים שה-id שלהם מכיל) · --timeout ms (לחלק; ברירת-מחדל 20000)
 * דטרמיניסטי: זרע קבוע, תוצאות ממוינות לפי id; מספר העובדים לא משנה את הפלט.
 */
import { Worker } from 'node:worker_threads';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundleBridge } from '../lib/load-bridge.mjs';
import { probePart, behaviorHash, fnvHash } from '../lib/probe.mjs';
import { prepareJobs, isRunnable } from '../lib/probe-file.mjs';
import { entryFor, tally } from '../lib/entry.mjs';
import { crossSourceDups } from '../lib/links.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SRC = path.resolve(ROOT, opt('--src', process.env.CATALOG_SRC || '../catsrc'));
const WORKERS = Number(opt('--workers', Math.min(4, os.cpus().length)));
const ONLY = opt('--only', '');
const TIMEOUT = Number(opt('--timeout', 20000));
export const SEED = 0x0ca7a10;
export const PROBE_VERSION = 1;

/** איפה כל מקור נמצא ומה מריצים בו. */
const SOURCES = {
  orbit: { dir: ROOT, run: 'code' },
  core: { dir: ROOT, run: 'code' },
  buildsmart: { dir: 'buildsmart', run: 'code' },
  mmmm: { dir: 'mmmm', run: 'code' },
  '14kk': { dir: '14kk', run: 'code' },
  'yoman-habina': { dir: 'yoman', run: 'code' },
  yeshiva: { dir: 'yeshiva', run: 'code' },
  rings: { dir: 'rings', run: 'rings' },
  generator: { dir: null, run: 'twin' },
  'qa-scanner': { dir: null, run: 'none' },
};
const ORDER = ['orbit', 'core', 'buildsmart', 'mmmm', '14kk', 'yoman-habina', 'yeshiva', 'rings', 'qa-scanner', 'generator'];
const want = opt('--source', '') ? opt('--source', '').split(',') : ORDER;

const readSource = (s) => JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/sources', s + '.json'), 'utf8'));
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/* ═══════════════ מקור עם קוד: TS/JS ═══════════════ */

function cloneDir(name, doc) {
  const dir = SOURCES[name].dir === ROOT ? ROOT : path.join(SRC, SOURCES[name].dir);
  if (!fs.existsSync(dir)) return { dir: null, why: 'אין שכפול-קריאה ב-' + dir };
  if (dir === ROOT) return { dir };
  const sha = String(doc.ref).split('@')[1];
  let head = '';
  try { head = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* */ }
  if (!sha || !head.startsWith(sha.slice(0, 7))) return { dir: null, why: `השכפול ב-${head.slice(0, 7) || '?'} ולא ב-${sha?.slice(0, 7)} (ה-ref של המפקד)` };
  return { dir };
}

async function runCode(name, doc, bridgePath) {
  const { dir, why } = cloneDir(name, doc);
  const runnable = doc.parts.filter((p) => isRunnable(p) && (!ONLY || p.id.includes(ONLY)));
  const results = new Map();
  if (!dir) { for (const p of runnable) results.set(p.id, { status: 'no-clone', why }); return { results, runnable: runnable.length }; }
  const { jobs: list, results: pre, sigs } = prepareJobs(dir, runnable);
  for (const [k, v] of pre) results.set(k, v);
  // חלוקה לעובדים (קבוע; הפלט ממוין בסוף ולכן לא תלוי בחלוקה)
  const buckets = Array.from({ length: Math.max(1, WORKERS) }, () => []);
  list.forEach((j, k) => buckets[k % buckets.length].push(j));
  await Promise.all(buckets.map((b) => runBucket(b, bridgePath, results)));
  return { results, runnable: runnable.length, sigs };
}

/** מריץ רשימת-עבודות בעובד אחד; חלק שנתקע ⇒ timeout, העובד מוחלף וממשיכים מהחלק הבא. */
function runBucket(jobs, bridgePath, results) {
  return new Promise((resolve) => {
    let rest = jobs.map((j) => ({ ...j, parts: j.parts.slice() }));
    const spawn = () => {
      rest = rest.map((j) => ({ ...j, parts: j.parts.filter((p) => !results.has(p.id)) })).filter((j) => j.parts.length);
      if (!rest.length) return resolve();
      const w = new Worker(path.join(ROOT, 'catalog/scripts/probe-worker.mjs'), { workerData: { bridgePath, jobs: rest, seed: SEED }, env: {}, resourceLimits: { maxOldGenerationSizeMb: 1536 }, stdout: true, stderr: true });
      let cur = null; let timer = null;
      const arm = () => { clearTimeout(timer); timer = setTimeout(() => { if (cur) results.set(cur, { status: 'timeout' }); w.terminate(); }, TIMEOUT); };
      w.on('message', (m) => {
        if (process.env.PROBE_DEBUG) console.error('[probe]', m.type, m.id ?? '');
        if (m.type === 'start') { cur = m.id; arm(); }
        else if (m.type === 'done') { results.set(m.id, m.result); cur = null; clearTimeout(timer); }
        else if (m.type === 'end') clearTimeout(timer);
      });
      w.on('error', () => { if (cur) results.set(cur, { status: 'crashed' }); });
      w.on('exit', () => { clearTimeout(timer); if (cur && !results.has(cur)) results.set(cur, { status: 'crashed' }); spawn(); });
    };
    spawn();
  });
}

/* ═══════════════ מנוע-הטבעות: המריץ של המכונה ═══════════════ */

async function loadRingsRunner(dir) {
  // כמו המפקד: מחלצים את machine3s.mjs ואת מה שהוא קורא (import יחסי + קבצי-טקסט) מה-git לתיקייה זמנית
  const RUNNER = 'lab-rings/lab13/machine3s.mjs';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rings-probe-'));
  const base = path.posix.dirname(RUNNER); const seen = new Set();
  const pull = (n) => {
    if (seen.has(n)) return; seen.add(n);
    let txt; try { txt = execFileSync('git', ['-C', dir, 'show', `HEAD:${base}/${n}`], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch { return; }
    fs.writeFileSync(path.join(tmp, n), txt);
    if (n.endsWith('.mjs')) for (const m of txt.matchAll(/['"]\.?\/?([\w.-]+\.(?:mjs|txt))['"]/g)) pull(m[1]);
  };
  pull(path.posix.basename(RUNNER));
  const mod = await import(pathToFileURL(path.join(tmp, path.posix.basename(RUNNER))).href);
  const shelf = JSON.parse(execFileSync('git', ['-C', dir, 'show', 'HEAD:lab-rings/lab13/shelf3.json'], { encoding: 'utf8', maxBuffer: 1 << 28 }));
  return { run: mod.run, shelf, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

/** לבנה ⇒ פונקציה JS על ערכים רגילים (תאים 0–15, רשימה = כתובות 8–15 מקושרות מתא 1). */
function ringsFn(run, brick, part) {
  const cellOf = (type) => { const m = /^cell(\d+)/.exec(type); return m ? +m[1] : null; };
  const g = part.gives.type;
  return (...vals) => {
    const mem = Array.from({ length: 16 }, () => 0);
    if (/כתובת/.test(brick.name) && !brick.name.startsWith('כתוב')) for (let a = 8; a < 16; a++) mem[a] = (a * 7) % 16;
    if (brick.name.startsWith('דלג אם')) mem[2] = 0;
    part.takes.forEach((t, k) => {
      const v = vals[k];
      if (t.kind === 'list') { const l = Array.isArray(v) ? v : []; mem[1] = l[0] || 0; l.forEach((a, i) => { mem[a] = l[i + 1] || 0; }); }
      else { const c = cellOf(t.type); if (c != null) mem[c] = ((Number(v) % 16) + 16) % 16; }
    });
    const r = run(brick.prog, mem, { maxSteps: 200000 });
    if (!r) throw new Error('לא נגמר');
    if (part.gives.kind === 'list') { const out = []; let a = r.mem[1]; for (let i = 0; a && i < 10; i++) { out.push(a); a = r.mem[a]; } return out; }
    if (part.gives.kind === 'sequence') return [r.mem[6], r.mem[7]];
    if (g.startsWith('cell[cell0]')) return r.mem[mem[0] || 0];
    return r.mem[cellOf(g) ?? brick.out];
  };
}
function ringsSig(part) {
  const cap = /עד (\d+)/.exec(part.symbol);
  return {
    mod: 16,
    takes: part.takes.map((t) => {
      if (t.kind === 'list') return { name: t.name, kind: 'list', d: { t: 'arr', of: { t: 'int', lo: 8, hi: 15 }, u: true, max: cap ? +cap[1] : 6 } };
      const addr = /:8\.\.15/.test(t.type);
      return { name: t.name, kind: 'number', d: { t: 'int', lo: addr ? 8 : 0, hi: 15 } };
    }),
  };
}

async function runRings(doc, B) {
  const { dir, why } = cloneDir('rings', doc);
  const results = new Map(); const sigs = new Map();
  if (!dir) { for (const p of doc.parts) results.set(p.id, { status: 'no-clone', why }); return { results, runnable: doc.parts.length, sigs }; }
  const { run, shelf, cleanup } = await loadRingsRunner(dir);
  try {
    const seen = new Map();
    const bySymbol = new Map();
    for (const b of shelf.named) { const k = (seen.get(b.name) || 0) + 1; seen.set(b.name, k); bySymbol.set(k > 1 ? `${b.name}~${k}` : b.name, b); }
    const { directCall } = await import('../lib/probe.mjs');
    for (const p of doc.parts) {
      if (ONLY && !p.id.includes(ONLY)) continue;
      const brick = bySymbol.get(p.symbol);
      if (!brick) { results.set(p.id, { status: 'not-found' }); continue; }
      const sig = ringsSig(p); sigs.set(p.id, sig);
      const call = directCall(ringsFn(run, brick, p));
      const seed = (fnvHash(p.id) ^ SEED) >>> 0;
      const res = probePart({ sig, call, seed, B });
      if (res.status === 'ran') res.hash = behaviorHash(sig, call, B);
      results.set(p.id, res);
    }
  } finally { cleanup(); }
  return { results, runnable: results.size, sigs };
}

/* ═══════════════ כתיבה ═══════════════ */

async function main() {
  fs.mkdirSync(path.join(ROOT, 'catalog/behavior'), { recursive: true });
  // כמה מקורות ⇒ כל מקור בתהליך משלו (עובד שהופל באמצע אריזה לא מפיל את המקור הבא)
  if (want.length > 1) {
    const pass = args.filter((a, k) => a !== '--source' && args[k - 1] !== '--source');
    for (const name of want) execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--source', name, ...pass], { stdio: 'inherit' });
    return;
  }
  const bridgePath = await bundleBridge();
  const B = await import(pathToFileURL(bridgePath).href);
  const summary = [];
  for (const name of want) {
    if (!SOURCES[name]) { console.error('מקור לא מוכר: ' + name); continue; }
    if (!fs.existsSync(path.join(ROOT, 'catalog/sources', name + '.json'))) continue;
    const t0 = Date.now();
    const doc = readSource(name);
    let results = new Map(); let sigs = new Map(); let runnable = 0;
    if (SOURCES[name].run === 'code') ({ results, sigs = new Map(), runnable } = await runCode(name, doc, bridgePath));
    else if (SOURCES[name].run === 'rings') ({ results, sigs, runnable } = await runRings(doc, B));
    const entries = doc.parts.map((p) => entryFor(p, results.get(p.id), sigs.get(p.id)));
    if (SOURCES[name].run === 'twin') twinLabels(doc, entries);
    if (ONLY) { console.log(JSON.stringify(entries.filter((e) => e.id.includes(ONLY)), null, 1)); continue; }
    const out = {
      source: name, ref: doc.ref, probe: { version: PROBE_VERSION, seed: SEED, generatedAt: null },
      totals: tally(entries),
      parts: entries.sort(byId),
    };
    fs.writeFileSync(path.join(ROOT, 'catalog/behavior', name + '.json'), JSON.stringify(out, null, 1) + '\n');
    summary.push(`${name}: ${doc.parts.length} חלקים · ניתנים-להרצה ${runnable} · run ${out.totals.run} (עם פועל ${out.totals.runWithVerb}) · twin ${out.totals.twin} · static ${out.totals.static} · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    console.log(summary[summary.length - 1]);
  }
}

/** המחולל: חלק שהוא העתק (מוצהר או באותה חתימה) של חלק שהורץ — מקבל את התווית שלו. */
function twinLabels(doc, entries) {
  const runs = new Map();
  for (const s of ['orbit', 'buildsmart', 'mmmm']) {
    const f = path.join(ROOT, 'catalog/behavior', s + '.json');
    if (!fs.existsSync(f)) continue;
    for (const e of JSON.parse(fs.readFileSync(f, 'utf8')).parts) if (e.labeledBy === 'run' && e.verbs.length) runs.set(e.id, e);
  }
  const all = ['orbit', 'buildsmart', 'mmmm', doc.source].flatMap((s) => (s === doc.source ? doc.parts : fs.existsSync(path.join(ROOT, 'catalog/sources', s + '.json')) ? readSource(s).parts : []));
  const groups = crossSourceDups(all).filter((g) => g.confidence !== 'name');
  const twinOf = new Map();
  for (const g of groups) {
    const src = g.members.filter((id) => runs.has(id)).sort((a, b) => (a.startsWith('orbit:') === b.startsWith('orbit:') ? (a < b ? -1 : 1) : a.startsWith('orbit:') ? -1 : 1))[0];
    if (!src) continue;
    for (const id of g.members) if (id.startsWith(doc.source + ':')) twinOf.set(id, src);
  }
  for (let k = 0; k < entries.length; k++) {
    const src = twinOf.get(entries[k].id);
    if (!src) continue;
    const r = runs.get(src);
    entries[k] = { id: entries[k].id, labeledBy: 'twin', twinOf: src, verbs: r.verbs.map(({ id, implied }) => (implied ? { id, implied } : { id })), primary: r.primary, material: r.material };
  }
}

await main();
