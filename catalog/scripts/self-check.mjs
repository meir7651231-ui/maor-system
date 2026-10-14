#!/usr/bin/env node
/**
 * 🪞 המכונה בודקת את עצמה (SELF, 14.10.2026) — אותו מפקד, אותו פותח, אותו קורא, אותו ארגז-חול ואותו זרע,
 * על הקוד של המכונה (catalog/lib · combiner · inner/lib · scripts):
 *
 *   1. מפקד   — catalog/scripts/machine-census.mjs ⇒ catalog/self/machine.json (פורמט-Part)
 *   2. קורא   — behavior-probe --source machine ⇒ catalog/self/behavior-machine.json (כל הפעלים, n/n)
 *   3. פותח   — buildSource(…, 'machine', {roots, files}) ⇒ catalog/inner/gen/machine/* (gitignored) + החלקים הפנימיים
 *   4. מוכיח  — proveJob על כל מודול-gen ⇒ הפעלים של הערכים-שבדרך
 *   5. תפקידים — catalog/self/roles.mjs: לכל עוזר שהתפקיד שלו ידוע (ממיין · מסיר-כפולים · חותם · מגביל…) — רק החוקים
 *                של הפועל שהתפקיד אומר, n/n; נכשל ⇒ החוק הראשון + הסיבה = באג במכונה
 *   ⇒ catalog/self/report.json (נכנס לריפו; `--check` = יציאה 1 אם השתנה)
 *
 *   node catalog/scripts/self-check.mjs            # כותב
 *   node catalog/scripts/self-check.mjs --check    # יציאה 1 אם catalog/self/* לא מעודכן
 */
import { Worker } from 'node:worker_threads';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { machineDoc, machineFiles, MACHINE_DIRS, OUT as CENSUS_OUT } from './machine-census.mjs';
import { buildSource } from '../inner/lib/build.mjs';
import { readSigs } from '../inner/lib/sigs.mjs';
import { entriesFor } from '../inner/lib/prove-job.mjs';
import { literalPool } from '../lib/tsdesc.mjs';
import { tally } from '../lib/entry.mjs';
import { bundleBridge } from '../lib/load-bridge.mjs';
import { runRoles } from '../self/roles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');
const SEED = 0x0ca7a10; // = הזרע של behavior-probe / inner prove
const WORKERS = Math.max(1, Math.min(4, os.availableParallelism?.() ?? os.cpus().length));
const SELF = 'catalog/self';
const text = (o) => JSON.stringify(o, null, 1) + '\n';
let stale = 0;
const put = (rel, t) => {
  const abs = path.join(ROOT, rel);
  const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (cur === t) return;
  if (CHECK) { console.error('✗ ' + rel + ' לא מעודכן — הרץ: node catalog/scripts/self-check.mjs'); stale++; return; }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, t);
};

/* 1 · מפקד */
const doc = machineDoc();
put(CENSUS_OUT, text(doc));

/* 2 · קורא (אותו behavior-probe, מקור machine) — כותב לקובץ זמני ב-check */
const BEH = path.join(ROOT, SELF, 'behavior-machine.json');
const behBefore = fs.existsSync(BEH) ? fs.readFileSync(BEH, 'utf8') : null;
execFileSync(process.execPath, [path.join(ROOT, 'catalog/scripts/behavior-probe.mjs'), '--source', 'machine'], { stdio: 'pipe' });
const behText = fs.readFileSync(BEH, 'utf8');
if (CHECK) { if (behBefore === null) fs.rmSync(BEH); else fs.writeFileSync(BEH, behBefore); put(SELF + '/behavior-machine.json', behText); }
const behavior = JSON.parse(behText);

/* 3 · פותח */
const opened = buildSource(ROOT, '', 'machine', { roots: MACHINE_DIRS, docPath: CENSUS_OUT, files: machineFiles() });
const gens = Object.entries(opened.files).filter(([rel]) => rel.startsWith('catalog/inner/gen/machine/'));
for (const rel of fs.existsSync(path.join(ROOT, 'catalog/inner/gen/machine')) ? listAll('catalog/inner/gen/machine') : []) if (!opened.files[rel]) fs.rmSync(path.join(ROOT, rel));
for (const [rel, t] of gens) { const abs = path.join(ROOT, rel); if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== t) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, t); } }
const inner = JSON.parse(opened.files['catalog/sources/inner-machine.json']);

/* 4 · מוכיח (אותו proveJob, אותו זרע) */
const bridgePath = await bundleBridge();
const jobs = innerJobs(inner);
const results = new Map(); const pairs = [];
const buckets = Array.from({ length: WORKERS }, () => []);
const load = buckets.map(() => 0);
for (const j of jobs.slice().sort((a, b) => b.parts.length - a.parts.length || (a.abs < b.abs ? -1 : 1))) { const k = load.indexOf(Math.min(...load)); buckets[k].push(j); load[k] += j.parts.length; }
await Promise.all(buckets.map((b) => runBucket(b)));
const sigs = new Map(jobs.flatMap((j) => j.parts.map((p) => [p.id, p.sig])));
const innerEntries = entriesFor(inner.parts, results, pairs.sort((a, b) => (a.a < b.a ? -1 : a.a > b.a ? 1 : a.b < b.b ? -1 : a.b > b.b ? 1 : 0)), sigs).sort((a, b) => (a.id < b.id ? -1 : 1));

/* 5 · תפקידים */
const B = await import(pathToFileURL(bridgePath).href);
const roles = await runRoles({ B, seed: SEED });

/* דוח */
const verbCount = (entries) => {
  const out = {};
  for (const e of entries) if (e.labeledBy === 'run') for (const v of e.verbs) if (!v.implied) out[v.id] = (out[v.id] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
};
const report = {
  source: 'machine', ref: doc.ref, seed: SEED, generatedAt: null,
  census: { files: machineFiles().length, parts: doc.parts.length },
  parts: { totals: behavior.totals, verbs: verbCount(behavior.parts), held: behavior.parts.filter((e) => e.labeledBy === 'run' && e.verbs.length).map((e) => ({ id: e.id, verbs: e.verbs.filter((v) => !v.implied).map((v) => v.id + ' ' + v.holds) })) },
  inner: { totals: { candidates: opened.stats.candidates, parts: inner.parts.length, ...tally(innerEntries) }, verbs: verbCount(innerEntries) },
  roles: { total: roles.length, held: roles.filter((r) => r.held).length, list: roles },
};
put(SELF + '/report.json', text(report));

if (CHECK && stale) process.exit(1);
console.log(`🪞 המכונה על עצמה: ${doc.parts.length} חלקים (run ${behavior.totals.run}, עם פועל ${behavior.totals.runWithVerb}) · ${inner.parts.length} פנימיים (run ${report.inner.totals.run}, עם פועל ${report.inner.totals.runWithVerb}) · תפקידים ${report.roles.held}/${report.roles.total} עומדים בחוקים`);
for (const r of roles.filter((x) => !x.held)) console.log(`  ✗ ${r.part} · ${r.verb}: ${r.law} — ${r.why}`);
if (CHECK) console.log(stale ? '' : '✓ catalog/self מעודכן');

/* ═══════════════ עזר ═══════════════ */

function listAll(rel) {
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p = d + '/' + e.name; if (e.isDirectory()) walk(p); else out.push(p); } };
  walk(rel);
  return out.sort();
}

function innerJobs(d) {
  const byGen = new Map();
  for (const p of d.parts) {
    const [genRel, exp] = p.tags.find((t) => t.startsWith('gen:')).slice(4).split('#');
    if (!byGen.has(genRel)) byGen.set(genRel, { genRel, orig: p.path, parts: [] });
    byGen.get(genRel).parts.push({ p, exp });
  }
  return [...byGen.values()].sort((a, b) => (a.genRel < b.genRel ? -1 : 1)).map(({ genRel, orig, parts }) => {
    const abs = path.join(ROOT, genRel);
    const s = readSigs(fs.readFileSync(abs, 'utf8'));
    return {
      abs, pool: literalPool(path.join(ROOT, orig)),
      parts: parts.map(({ p, exp }) => ({
        id: p.id, exp, sig: { takes: (s[exp] ?? []).map((t, k) => ({ ...t, kind: p.takes[k]?.kind ?? 'unknown' })) },
        motionKey: p.symbol.replace(/\.[^.]*$/, '') + (p.symbol.endsWith(':step') ? ':step' : ''),
      })),
    };
  });
}

function runBucket(list) {
  return new Promise((resolve) => {
    let rest = list.map((j) => ({ ...j, parts: j.parts.slice() }));
    const spawn = () => {
      rest = rest.map((j) => ({ ...j, parts: j.parts.filter((p) => !results.has(p.id)) })).filter((j) => j.parts.length);
      if (!rest.length) return resolve();
      const w = new Worker(path.join(ROOT, 'catalog/inner/scripts/prove-worker.mjs'), { workerData: { bridgePath, jobs: rest, seed: SEED }, env: process.env.CATALOG_CACHE ? { CATALOG_CACHE: process.env.CATALOG_CACHE } : {}, resourceLimits: { maxOldGenerationSizeMb: 1536 }, stdout: true, stderr: true });
      let cur = null; let timer = null;
      w.on('message', (m) => {
        if (m.type === 'start') { cur = m.id; clearTimeout(timer); timer = setTimeout(() => { if (cur) results.set(cur, { status: 'timeout' }); w.terminate(); }, 20000); }
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
