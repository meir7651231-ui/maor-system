#!/usr/bin/env node
/**
 * 🧪 בדיקות רק למה שהשתנה (SPEED1000, 14.10.2026) — `npm run test:catalog:changed`.
 *
 * לכל קובץ-בדיקה ב-catalog/: הרצה אחת שעברה נרשמת עם **כל קובץ שהיא נגעה בו** — מעקב-קריאות אמיתי (lib/trace-reads.mjs,
 * גם בתהליכי-בן ובעובדים; כולל מה שהאורז rolldown ארז — דרך הרשם globalThis.__catalogBundleDeps) — והטביעה של כל אחד
 * (sha של git, lib/gitfp.mjs). בהרצה הבאה: כל הקבצים שלה עם אותה טביעה (ואותה סביבה) ⇒ לא רצה. אחרת ⇒ רצה (לבד, עם מעקב),
 * ונרשמת מחדש רק אם עברה. בדיקה שנכשלה לא נזכרת — רצה שוב בכל פעם עד שתעבור.
 *
 * "הסביבה" (משנה ⇒ הכול רץ): node ראשי · גרסאות vitest/vite/typescript/rolldown · package.json · package-lock.json ·
 * vite.config.ts · tsconfig… · משתני ‎CATALOG_… · SELF_LOOP_… · GITFP · REBUILD_… · CENSUS_VIEW · ו-HEAD של git — לבדיקה שהקוד שלה
 * קורא ל-git (ההיסטוריה של הלולאה, מצבי-git של הבונה-מחדש).
 * ה-CI המלא (`npx vitest run catalog`) לא משתנה — זה קיצור לפיתוח, עם נפילה בטוחה: אין רישום ⇒ רצה.
 * ⚠️ קיצורים שלא קוראים קבצים (האינדקס של git — lib/gitfp.mjs) כבויים בזמן המעקב (CATALOG_TRACE) — אחרת בדיקה שמריצה
 * `rebuild --check` הייתה נרשמת בלי הקלטים שלו.
 *
 *   node catalog/scripts/test-changed.mjs           # רק מה שהשתנה
 *   node catalog/scripts/test-changed.mjs --list    # רק מה היה רץ, בלי להריץ
 *   node catalog/scripts/test-changed.mjs --all     # הכול (ונרשם)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gitIndexAsync, fileSha, readHead } from '../lib/gitfp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fp = (...ps) => { const h = crypto.createHash('sha256'); for (const p of ps) { const b = Buffer.from(String(p)); h.update(b.length + ':'); h.update(b); } return h.digest('hex').slice(0, 32); };
const CACHE = process.env.CATALOG_CACHE && process.env.CATALOG_CACHE !== 'off' ? path.resolve(process.env.CATALOG_CACHE) : path.join(ROOT, 'node_modules/.cache');
const OFF = process.env.CATALOG_CACHE === 'off';
const fileOf = (key) => path.join(CACHE, 'catalog-testmemo', key.slice(0, 2), key + '.json');

/** קובצי-הבדיקה של הקטלוג (כמו `vitest run catalog`). */
export function catalogTests(root = ROOT) {
  const out = [];
  const walk = (rel) => { for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) { const r = rel + '/' + e.name; if (e.isDirectory()) { if (!['node_modules', 'gen', '.cache'].includes(e.name)) walk(r); } else if (/\.test\.[mc]?[jt]sx?$/.test(e.name)) out.push(r); } };
  walk('catalog');
  return out.sort();
}

const ver = (pkg) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8')).version; } catch { return '?'; } };
function envKey(idx) {
  const files = ['package.json', 'package-lock.json', 'vite.config.ts', 'vitest.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'];
  const vars = Object.keys(process.env).filter((k) => /^(CATALOG_|SELF_LOOP|GITFP$|REBUILD_|CENSUS_VIEW$)/.test(k)).sort().map((k) => k + '=' + process.env[k]);
  return fp('testmemo-v1', 'node' + process.versions.node.split('.')[0], ...['vitest', 'vite', 'typescript', 'rolldown'].map(ver), ...files.flatMap((f) => [f, fileSha(ROOT, idx, f) ?? '!']), ...vars);
}
const head = () => readHead(ROOT) ?? 'no-git';

/** טביעה של רשימת-תלויות: [נתיב, סוג] ⇒ sha / '!' (חסר) / רשימת-השמות (תיקייה). */
const printMemo = new Map(); // אותו קובץ אצל כמה בדיקות ⇒ נטבע פעם אחת
function printOf(idx, deps) {
  return deps.map(([rel, kind]) => {
    const k = kind + rel;
    let v = printMemo.get(k);
    if (v !== undefined) return v;
    const abs = path.join(ROOT, rel);
    if (kind === 'd') { let es = '!'; try { es = fs.readdirSync(abs).sort().join('\n'); } catch { /* */ } v = fp(es); }
    else if (idx?.shas.has(rel)) v = idx.shas.get(rel); // קובץ נקי במעקב — קיים, והטביעה מהאינדקס (בלי stat)
    else { let st = null; try { st = fs.statSync(abs); } catch { /* */ } v = !st ? '!' : st.isDirectory() ? 'dir' : fileSha(ROOT, idx, rel); }
    printMemo.set(k, v);
    return v;
  });
}

/** מעקב ⇒ [נתיב-יחסי, 'f'|'d'] ממוינים (בתוך הריפו; בלי node_modules/.git/המודולים המחוללים/הקבצים הפרושים). */
function depsFromTrace(dir) {
  const real = fs.realpathSync(ROOT);
  const out = new Map();
  for (const f of fs.readdirSync(dir)) {
    for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
      const m = /^([rdem]) (.+)$/.exec(line); if (!m) continue;
      let p = m[2]; if (p.startsWith('file://')) p = fileURLToPath(p);
      if (!path.isAbsolute(p)) p = path.resolve(ROOT, p);
      let rel = null;
      for (const base of [ROOT, real]) { const r = path.relative(base, p); if (r && !r.startsWith('..') && !path.isAbsolute(r)) { rel = r.split(path.sep).join('/'); break; } }
      if (!rel || /(^|\/)(node_modules|\.git|\.cache)(\/|$)/.test(rel) || /^catalog\/inner\/gen(\/|$)/.test(rel) || /^catalog\/(sources|behavior)\/inner-[^/]*\.json$/.test(rel)) continue;
      const kind = m[1] === 'd' ? 'd' : 'f';
      if (kind === 'd' || !out.has(rel)) out.set(rel + (kind === 'd' ? '/' : ''), [rel, kind]);
    }
  }
  return [...out.values()].sort((a, b) => (a[0] + a[1] < b[0] + b[1] ? -1 : 1));
}
/** האם הבדיקה תלויה ב-git (הקוד שהיא טענה קורא ל-git) ⇒ HEAD נכנס למפתח. */
const usesGit = (deps) => deps.some(([rel, k]) => k === 'f' && /\.(m?js|ts)$/.test(rel) && (() => { try { return /spawnSync\(\s*'git'|execFileSync\(\s*'git'|\['git'|"git"|'git',/.test(fs.readFileSync(path.join(ROOT, rel), 'utf8')); } catch { return false; } })());

function runOne(test) {
  return new Promise((resolve) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'testmemo-'));
    const TR = path.join(ROOT, 'catalog/lib/trace-reads.mjs');
    const env = { ...process.env, CATALOG_TRACE: dir, NODE_OPTIONS: ((process.env.NODE_OPTIONS ?? '') + ' --import=' + TR).trim() };
    const ch = spawn(process.execPath, [path.join(ROOT, 'node_modules/vitest/vitest.mjs'), 'run', test], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    ch.stdout.on('data', (d) => { log += d; }); ch.stderr.on('data', (d) => { log += d; });
    ch.on('exit', (code) => {
      let deps = []; try { deps = depsFromTrace(dir); } catch { /* */ }
      fs.rmSync(dir, { recursive: true, force: true });
      resolve({ test, ok: code === 0, log, deps });
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const t0 = Date.now();
  const idx = await gitIndexAsync(ROOT);
  const env = envKey(idx);
  let HEAD = null;
  const tests = catalogTests();
  const keyOf = (t, git) => fp(env, t, git ? (HEAD ??= head()) : '-');
  const todo = []; let fromMemo = 0;
  for (const t of tests) {
    let e = null;
    if (!OFF && !argv.includes('--all')) {
      for (const git of [false, true]) { try { e = JSON.parse(fs.readFileSync(fileOf(keyOf(t, git)), 'utf8')); } catch { e = null; } if (e && e.git === git) break; e = null; }
    }
    if (e && JSON.stringify(printOf(idx, e.deps)) === JSON.stringify(e.prints)) { fromMemo++; continue; }
    todo.push(t);
  }
  console.log(`🧪 ${tests.length} קובצי-בדיקה · ${fromMemo} עברו כבר על אותם קבצים · ${todo.length} לריצה${todo.length ? ': ' + todo.map((t) => path.basename(t)).join(' · ') : ''}`);
  if (argv.includes('--list') || !todo.length) return;
  const cores = Math.max(1, Math.min(todo.length, os.availableParallelism?.() ?? os.cpus().length));
  const results = []; const queue = [...todo];
  await Promise.all(Array.from({ length: cores }, async () => { while (queue.length) { const r = await runOne(queue.shift()); results.push(r); console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.test + ' · ' + r.deps.length + ' קבצים נרשמו'); } }));
  const idx2 = await gitIndexAsync(ROOT); // הבדיקות עצמן לא אמורות לשנות קבצים — אבל טובעים אחרי, ליתר ביטחון
  printMemo.clear();
  for (const r of results.filter((x) => x.ok && x.deps.length)) {
    const git = usesGit(r.deps);
    const f = fileOf(keyOf(r.test, git));
    if (OFF) continue;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify({ git, deps: r.deps, prints: printOf(idx2, r.deps) }));
  }
  const bad = results.filter((r) => !r.ok);
  for (const r of bad) console.log('\n✗ ' + r.test + '\n' + r.log.split('\n').filter((l) => /FAIL|✗|×|Error|expected/i.test(l)).slice(0, 15).join('\n'));
  console.log(`🧪 ${results.length - bad.length}/${results.length} עברו · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (bad.length) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
