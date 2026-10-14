#!/usr/bin/env node
/**
 * 📇 בונה את קובצי-הקטלוג המשותפים (CATALOG-INDEX, 14.10.2026):
 *   catalog/index.json · catalog/verbs.json · catalog/verbs.md · catalog/alphabet.md
 * מתוך catalog/sources/*.json (המפקדים) ו-catalog/behavior/*.json (קורא-ההתנהגות). לא מריץ קוד של אף חלק.
 *
 *   node catalog/scripts/catalog-build.mjs           # כותב
 *   node catalog/scripts/catalog-build.mjs --check   # יציאה 1 אם משהו לא מעודכן
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll } from '../lib/build-all.mjs';
import { loadBridge } from '../lib/load-bridge.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK = process.argv.includes('--check');
const B = await loadBridge();
await (await import('../inner/lib/ensure-gen.mjs')).ensureGen({ quiet: true }); // החלקים הפנימיים — מהמחסן (INNER v2)
const files = buildAll(ROOT, B.ATOM_LAWS);
let stale = 0;
for (const [rel, text] of Object.entries(files)) {
  const abs = path.join(ROOT, rel);
  const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  if (cur === text) continue;
  if (CHECK) { console.error('✗ ' + rel + ' לא מעודכן — הרץ: node catalog/scripts/catalog-build.mjs'); stale++; }
  else { fs.writeFileSync(abs, text); console.log('✓ ' + rel); }
}
if (CHECK && stale) process.exit(1);
if (CHECK) console.log('✓ הקטלוג מעודכן');
