#!/usr/bin/env node
/**
 * ⚖️ SP-FAIR — מבחן הוגן למנוע-השרטוטים-העצמי (catalog/selfprint, קפוא). ראו knowledge/CLOSED-SP-FAIR-2026-10-15.md.
 *
 *   node catalog/spfair/fair.mjs                 # כל ההרצות שב-plan.json (ברצף — לא במקביל לבדיקות!) ⇒ runs/*.json + summary.json
 *   node catalog/spfair/fair.mjs seed1 r6        # רק אלה
 *   node catalog/spfair/fair.mjs --summary       # רק summary.json מתוך runs/
 *   node catalog/spfair/fair.mjs --check [names] # הרצה חוזרת (הצמיחה ממטמון node_modules/.cache/selfprint אם יש) ⇒ אותם בתים
 * כל הרצה = תהליך נפרד (one.mjs עם hook.mjs), כי budget.json נקרא פעם אחת בטעינת המנוע.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { summarize } from './summarize.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLAN = JSON.parse(fs.readFileSync(path.join(HERE, 'plan.json'), 'utf8'));
const args = process.argv.slice(2);
const check = args.includes('--check');
const names = args.filter((a) => !a.startsWith('--'));
const todo = args.includes('--summary') ? [] : names.length ? names : Object.keys(PLAN.runs);
const runFile = (n) => path.join(HERE, 'runs', n + '.json');

let bad = [];
for (const n of todo) {
  const r = PLAN.runs[n]; if (!r) throw new Error('אין הרצה ' + n);
  const before = check && fs.existsSync(runFile(n)) ? fs.readFileSync(runFile(n), 'utf8') : null;
  const env = { ...process.env, SPFAIR_SALT: String(r.salt || 0) };
  delete env.SPFAIR_ROUNDS; if (r.rounds) env.SPFAIR_ROUNDS = String(r.rounds);
  const p = spawnSync(process.execPath, ['--import', path.join(HERE, 'hook.mjs'), path.join(HERE, 'one.mjs'), n], { env, stdio: 'inherit' });
  if (p.status !== 0) { console.error('✗ ' + n + ' נכשל'); process.exit(1); }
  if (check) { const now = fs.readFileSync(runFile(n), 'utf8'); if (now !== before) { bad.push(n); if (before !== null) fs.writeFileSync(runFile(n), before); } }
}
if (check) { if (bad.length) { console.error('✗ SP-FAIR: הרצה חוזרת שונה: ' + bad.join(', ')); process.exit(1); } console.log('✓ SP-FAIR: הרצה חוזרת ⇒ אותם בתים (' + todo.join(', ') + ')'); }
if (!check) writeSummary();

function writeSummary() {
  const runs = {};
  for (const n of Object.keys(PLAN.runs)) if (fs.existsSync(runFile(n))) runs[n] = JSON.parse(fs.readFileSync(runFile(n), 'utf8'));
  fs.writeFileSync(path.join(HERE, 'summary.json'), JSON.stringify({ about: 'SP-FAIR — סיכום כל ההרצות (fair.mjs). לא לערוך ביד', ...summarize(runs) }, null, 1) + '\n');
  console.log('⚖️ summary.json · ' + Object.keys(runs).join(', '));
}
