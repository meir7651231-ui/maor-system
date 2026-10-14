#!/usr/bin/env node
/**
 * 🌊 קו-הבסיס של תכונות-התנועה (INNER, 14.10.2026) — catalog/inner/motion-baseline.json.
 * כדי שההשוואה "מה נוסף רק בזכות החלקים הפנימיים" תהיה הוגנת: אותם צופי-תנועה (lib/motion.mjs) רצים גם על
 * החלקים **השלמים** של הקטלוג (כל חלק שקורא-ההתנהגות מריץ), באותו ארגז-חול. הפעלים שלהם לא נוגעים — רק motion.
 *   node catalog/inner/scripts/baseline.mjs        (שכפולים ב-../catsrc; מקור בלי שכפול — מדולג, נאמר)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bundleBridge } from '../../lib/load-bridge.mjs';
import { prepareJobs, isRunnable } from '../../lib/probe-file.mjs';
import { runPool } from '../../lib/pool.mjs';
import { REPOS } from '../lib/repos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SRC = path.resolve(ROOT, process.env.CATALOG_SRC || '../catsrc');
const bridgePath = await bundleBridge();
const PREV = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/inner/motion-baseline.json'), 'utf8')); } catch { return {}; } })();
const out = { version: 1, generatedAt: null, note: 'תכונות-תנועה (lib/motion.mjs) של החלקים השלמים בקטלוג — קו-בסיס להשוואה הוגנת. רק חלקים שיש להם תכונה.', sources: {} };
for (const [source, R] of Object.entries(REPOS)) {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/sources', R.catalog + '.json'), 'utf8'));
  const dir = R.dir ? path.join(SRC, R.dir) : ROOT;
  // 🪞 SELF: בלי שכפול — הקו הקודם נשמר (במקום להידרס ב-skipped:no-clone)
  if (!fs.existsSync(dir)) { console.log(`· ${source}: אין שכפול — הקו הקודם נשמר`); out.sources[R.catalog] = PREV.sources?.[R.catalog] ?? { skipped: 'no-clone' }; continue; }
  if (R.dir) {
    const sha = String(doc.ref).split('@')[1] ?? '';
    const head = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (!head.startsWith(sha.slice(0, 7))) { out.sources[R.catalog] = PREV.sources?.[R.catalog] ?? { skipped: 'wrong-ref' }; continue; }
  }
  const runnable = doc.parts.filter(isRunnable);
  const { jobs } = prepareJobs(dir, runnable);
  const mjobs = jobs.map((j) => ({ ...j, motionOnly: true, parts: j.parts.map((p) => ({ ...p, motionKey: p.id })) }));
  const results = await runPool({ file: path.join(ROOT, 'catalog/inner/scripts/prove-worker.mjs'), jobs: mjobs, workers: 4, data: { bridgePath, seed: 0x0ca7a10 } });
  const got = {};
  for (const id of [...results.keys()].sort()) { const r = results.get(id); if (r && r.motion && r.motion.length) got[id] = r.motion; }
  out.sources[R.catalog] = { runnable: runnable.length, withMotion: Object.keys(got).length, parts: got };
  console.log(`${source}: ${runnable.length} ניתנים-להרצה · ${Object.keys(got).length} עם תנועה`);
}
fs.writeFileSync(path.join(ROOT, 'catalog/inner/motion-baseline.json'), JSON.stringify(out, null, 1) + '\n');
