#!/usr/bin/env node
/**
 * 🔁 RINGS-PORT — ההיסטוריה של המכונה עצמה (כמו stagestats/ladder-order של מעבדת-הטבעות: "כמה הצלחות של המכונה יצאו
 * מהכלי"). מקור: הפלטים שהמנוע עצמו כתב לריפו בקומיט הבסיס (MINER2 @380625d) — blueprints.json (נבנו/הצלחות לכל שרטוט)
 * ו-control-v1.json (מה מצאה הביקורת עם הספרייה הישנה). בלי מטרות-מדידה, בלי המבחן הנסתר — רק "הצלחה" כפי שהמנוע
 * עצמו מגדיר אותה (שם מיוחד אחרי חוקים + אמת + לחץ).
 *
 * הקובץ history.json **קפוא** (קלט, לא פלט): המנוע קורא אותו ולא כותב אותו — אחרת --check היה רודף אחרי עצמו.
 *   node catalog/selfprint/history.mjs   # כותב מחדש מאותו קומיט (דורש את 380625d בהיסטוריה של git)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FROM = '380625d';
const show = (f) => JSON.parse(execFileSync('git', ['show', FROM + ':catalog/selfprint/' + f], { cwd: HERE, maxBuffer: 1 << 28 }).toString());
const bps = show('blueprints.json');
const ctl = show('control-v1.json');
const code = {};
const at = (k) => (code[k] ||= { built: 0, successes: 0, verbs: {} });
for (const b of bps) if (b.source === 'code') { const e = at(b.origin.code); e.built += b.built; e.successes += b.successes; }
for (const f of ctl.found) { const e = at(f.blueprint.origin.code); e.successes += 1; for (const v of f.verbs) e.verbs[v] = (e.verbs[v] || 0) + 1; }
const succ = bps.filter((b) => b.source !== 'code');
const out = {
  about: 'RINGS-PORT · ההיסטוריה של המכונה (קפוא — קלט). נכתב ע״י history.mjs מפלטי המנוע בקומיט ' + FROM + ' (blueprints.json + control-v1.json). code = לכל שלד-מהקוד: נבנו/הצלחות (ובביקורת-v1 גם אילו פעלים); fromSuccess = סך שרטוטים-מהצלחה.',
  from: FROM,
  code: Object.fromEntries(Object.keys(code).sort().map((k) => [k, code[k]])),
  fromSuccess: { blueprints: succ.length, built: succ.reduce((a, b) => a + b.built, 0), successes: succ.reduce((a, b) => a + b.successes, 0) },
};
fs.writeFileSync(path.join(HERE, 'history.json'), JSON.stringify(out, null, 1) + '\n');
console.log('history.json · ' + Object.keys(code).length + ' שלדים');
