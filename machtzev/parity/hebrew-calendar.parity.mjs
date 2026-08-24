#!/usr/bin/env node
/** 🥇 רתמת-זהב · לוח-עברי — הישן (maor/src/lib/hebrew.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/hebrew-calendar.mjs) על ~1,300 ימים רצופים (2024-2027 —
 *  מכסה מעוברת תשפ״ד עם אדר-א'/ב' ופשוטות): ‏parts · fullDate · דין-אדר. אפס-סטייה. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const src = fs.readFileSync('/home/user/maor-system/src/lib/hebrew.ts', 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const tmp = path.join(os.tmpdir(), 'heb-old-' + process.pid + '.mjs');
fs.writeFileSync(tmp, js);
const OLD = await import(pathToFileURL(tmp).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/hebrew-calendar.mjs');

let n = 0;
const d0 = new Date('2024-01-01T12:00:00');
for (let i = 0; i < 1300; i++) {
  const d = new Date(d0.getTime() + i * 86400000);
  const iso = d.toISOString().slice(0, 10);
  // 1) פירוק זהה (החדש בלי מטמון — משווים ערכים)
  assert.deepStrictEqual(NEW.parts(iso), OLD.hebPartsOfIso(iso), 'parts: ' + iso);
  // 2) התאריך-המלא זהה תו-בתו
  assert.strictEqual(NEW.fullDate(iso), OLD.hebDateFull(iso), 'fullDate: ' + iso);
  n += 2;
}
// דין-אדר קונקרטי: י"ד אדר-ב' תשפ"ד (2024-03-24, מעוברת) ≡ י"ד אדר תשפ"ה (2025-03-14, פשוטה)
assert.strictEqual(NEW.annualKey('2024-03-24'), NEW.annualKey('2025-03-14'), 'דין-אדר: פורים מעוברת≠פשוטה');
// והישן מסכים שהם שקולים-שנתית
assert.ok(OLD.hebAnnualEq(OLD.hebPartsOfIso('2024-03-24'), OLD.hebPartsOfIso('2025-03-14')), 'hebAnnualEq לא מסכים');
// קצוות: ריק/זבל
assert.strictEqual(NEW.fullDate(''), OLD.hebDateFull(''));
assert.strictEqual(NEW.fullDate('junk'), OLD.hebDateFull('junk'));
n += 4;
fs.unlinkSync(tmp);
console.log(`🥇 זהב-לוח-עברי: ישן≡חדש על ${n} השוואות (1,300 ימים 2024-2027 + דין-אדר + קצוות)`);
