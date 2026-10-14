#!/usr/bin/env node
/**
 * ⚖️ המצרף · מריץ את השופט וכותב `catalog/combiner/proofs.json` (COMBINER, 14.10.2026).
 *   node catalog/combiner/prove.mjs           # כותב
 *   node catalog/combiner/prove.mjs --check   # יציאה 1 אם לא מעודכן או שהוכחה נכשלה
 * רץ על קוד ה-TypeScript עצמו דרך ה-module runner של vite (כמו המפעל).
 */
import { runnerImport } from 'vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const OUT = join(HERE, 'proofs.json');

export async function computeProofs() {
  const { module } = await runnerImport(join(HERE, 'judge.ts'), { root: ROOT, configFile: false, logLevel: 'silent' });
  return module.judgeAll();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const proofs = await computeProofs();
  const text = JSON.stringify(proofs, null, 1) + '\n';
  const failed = [...Object.entries(proofs.parts), ...Object.entries(proofs.flows)].filter(([, p]) => p.status !== 'proven');
  for (const [id, p] of failed) console.error('✗ ' + id + ' — ' + p.counterexample);
  if (process.argv.includes('--check')) {
    const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (cur !== text) {
      console.error('proofs.json לא מעודכן — הריצו node catalog/combiner/prove.mjs');
      process.exit(1);
    }
    process.exit(failed.length ? 1 : 0);
  }
  writeFileSync(OUT, text);
  console.log('⚖️ ' + Object.keys(proofs.parts).length + ' חלקים · ' + Object.keys(proofs.flows).length + ' זרימות · ' + failed.length + ' נכשלו ⇒ ' + OUT);
}
