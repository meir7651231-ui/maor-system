#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-ics — הישן (maor/src/lib/ics.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/lib-ics.mjs) על קורפוס-LCG: מופעים עם עברית · שעות-שבורות ·
 *  פסיקים/נקודה-פסיק/גרשיים/שורות-חדשות · בלי-שעה · notes/location · גלגול-חצות.
 *  אפס-סטייה תו-בתו. בלי Date.now — now קבוע מהקורפוס. הצד-DOM (downloadIcs) =
 *  גבול-IO, לא ברתמה (כמו downloadCsv ב-names-export). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'ics-'));
// חילוץ הצד-הטהור בלבד: interface + icsEscape + foldIcsLine + העוזרים + buildIcs
// (שורות 13-130). שורת-ה-import (11, exportGate) ו-downloadIcs (132-140) מושמטים —
// גבול-IO, לא ברתמה.
const icsLines = fs.readFileSync('/home/user/maor-system/src/lib/ics.ts', 'utf8').split('\n');
const pureSrc = icsLines.slice(12, 130).join('\n');
fs.writeFileSync(path.join(tdir, 'ics.mjs'), ts.transpileModule(pureSrc, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'ics.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-ics.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

// קורפוס-קצה
const strs = ['פגישה', 'א,ב;ג', 'עם\\backslash', 'שתי\nשורות', 'אולם; ראשי',
  'Meeting, "quoted"', '', 'תו-עברי ארוך '.repeat(8), 'x'.repeat(80), 'טל: 050-1234'];
const dates = ['2026-08-24', '2027-02-28', '2028-12-31', '2026-01-01', '2029-03-15'];
const times = ['19:30', '23:30', '00:00', '', '25:00', '12:60', '9:00', '07:05', '23:59', '99:99', '8:8'];
const cals = ['לוח', 'Calendar, Inc.', 'עמותת מאור; החסד', '', 'x'.repeat(90)];
// שני מועדי-DTSTAMP קבועים (בלי Date.now)
const nows = [new Date(Date.UTC(2026, 7, 24, 10, 0, 0)), new Date(Date.UTC(2027, 0, 1, 5, 30, 15))];

let n = 0;
for (let i = 0; i < 300; i++) {
  // א) icsEscape תו-בתו
  const raw = pick(strs);
  assert.strictEqual(NEW.icsEscape(raw), OLD.icsEscape(raw), `icsEscape: ${JSON.stringify(raw)}`);
  n++;
  // ב) foldIcsLine — מערך תו-בתו
  const ln = 'SUMMARY:' + pick(strs) + pick(strs);
  assert.deepStrictEqual(NEW.foldIcsLine(ln), OLD.foldIcsLine(ln), `foldIcsLine: ${JSON.stringify(ln)}`);
  n++;
  // ג) buildIcs — קובץ שלם תו-בתו
  const occ = Array.from({ length: Math.floor(rnd() * 4) }, (_, k) => {
    const o = { uid: 'u' + k + '@' + pick(strs), title: pick(strs), date: pick(dates), time: pick(times) };
    if (rnd() < 0.5) o.notes = pick(strs);
    if (rnd() < 0.5) o.location = pick(strs);
    return o;
  });
  const calName = pick(cals);
  const now = pick(nows);
  assert.strictEqual(
    NEW.buildIcs(occ, calName, now),
    OLD.buildIcs(occ, calName, now),
    `buildIcs sample ${i}`,
  );
  n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-lib-ics: ישן≡חדש על ${n} השוואות (300 סבבים: icsEscape + foldIcsLine + buildIcs תו-בתו, כולל שעות-שבורות/עברית/escaping)`);
