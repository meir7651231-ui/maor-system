#!/usr/bin/env node
/** 🥇 רתמת-זהב · אימות-קלט (lib-validate) — הישן (maor src/lib/validate.ts, מתורגם-חי)
 *  ≡ החדש (Genesis new/boxes/validate.mjs) על קורפוס-LCG דטרמיניסטי seed=20260824:
 *  ת"ז (תקינות/זבל/ריפוד) · טלפונים (‏+972/00972/מקפים/זבל) · שמות עבריים
 *  (ניקוד/סופיות/תארים/גרשיים/סדר-מילים). אפס-סטייה, כולל זהות-חריגות. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-'));
// validate.ts עצמאי-לחלוטין (אפס imports) — מתרגמים את הקובץ כולו כלשונו
const src = fs.readFileSync('/home/user/maor-system/src/lib/validate.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'validate.mjs'),
  ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'validate.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/validate.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (n) => Math.floor(rnd() * n);

// ── מחוללי-קורפוס ──
const digits = () => Array.from({ length: 1 + int(11) }, () => String(int(10))).join('');
const KNOWN_IDS = ['123456782', '000000000', '19000', ' 123456782 ', '12345678a', '', '0', '999999999', 123456782, 19000, null, undefined];
const PHONE_PREFIX = ['', '0', '+972', '972', '00972', '+972-', '05', 'abc'];
const PHONE_SEP = ['', '-', ' ', '.', '(', ')'];
const phone = () => pick(PHONE_PREFIX) + Array.from({ length: int(11) }, () => pick(PHONE_SEP) + String(int(10))).join('');
const HEB = ['כהן', 'לוי', 'בן', 'בר', 'צבי', 'רחל', 'מרים', 'מר', 'הרב', 'שליטא', 'זצל', 'משפחת', 'דויד',
  'שָׁלוֹם', 'כץ', 'יוסף', 'ד"ר', 'לוי-כהן', "צ'רלי", 'ABC', 'Def', '״גרשיים״', '...', '–', '  ', ''];
const name = () => Array.from({ length: int(6) }, () => pick(HEB)).join(pick([' ', '  ', ' '])) + pick(['', ' ', '\t']);

// ── רץ-זהות: ערך ≡ ערך, חריגה ≡ חריגה (נאמנות גם לשבירה) ──
const run = (fn, arg) => { try { return { ok: true, v: fn(arg) }; } catch (e) { return { ok: false, v: e.constructor.name }; } };
let n = 0;
const same = (label, oldFn, newFn, arg) => {
  const a = run(oldFn, arg), b = run(newFn, arg);
  assert.deepStrictEqual(b, a, `${label}(${JSON.stringify(arg)})`);
  n++;
};

for (let i = 0; i < 400; i++) {
  same('validIsraeliId', OLD.validIsraeliId, NEW.validIsraeliId, digits());
  same('normalizePhone', OLD.normalizePhone, NEW.normalizePhone, phone());
  same('formatIsraeliPhone', OLD.formatIsraeliPhone, NEW.formatIsraeliPhone, phone());
  const t = name();
  same('normSearch', OLD.normSearch, NEW.normSearch, t);
  same('normName', OLD.normName, NEW.normName, t);
  same('nameSortKey', OLD.nameSortKey, NEW.nameSortKey, t);
}
// קצוות מכוונים — כולל קלטים ששוברים את המקור (זהות-חריגות)
for (const id of KNOWN_IDS) same('validIsraeliId·edge', OLD.validIsraeliId, NEW.validIsraeliId, id);
for (const p of ['', null, undefined, 501234567, '0501234567', '+972501234567', '00972-2-5678901', '  ', 'טל: 050']) {
  same('normalizePhone·edge', OLD.normalizePhone, NEW.normalizePhone, p);
  same('formatIsraeliPhone·edge', OLD.formatIsraeliPhone, NEW.formatIsraeliPhone, p);
}
for (const t of [null, undefined, '', 'הרב', 'בן צבי רחל', 'רחל בן צבי', 'מרים כהן', 'הרב יוסף כהן שליטא']) {
  same('normSearch·edge', OLD.normSearch, NEW.normSearch, t);
  same('normName·edge', OLD.normName, NEW.normName, t);
  same('nameSortKey·edge', OLD.nameSortKey, NEW.nameSortKey, t);
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-אימות: ישן≡חדש על ${n} השוואות (400 סבבי-LCG × 6 פונקציות + קצוות, כולל זהות-חריגות)`);
