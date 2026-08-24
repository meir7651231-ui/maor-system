#!/usr/bin/env node
/** 🥇 רתמת-זהב · hebdate — הישן (maor/src/lib/hebdate.ts + hebrew.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/hebdate.mjs) על קורפוס-LCG דטרמיניסטי (seed=20260824, אפס Date.now):
 *  ימים אקראיים 1994–2044 · round-trip עברי↔לועזי · מעוברת/פשוטה · מילון-חודשים ·
 *  ולידציית-CLDR · גבולות/קצוות. אפס-סטייה. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'hebdate-'));
const opts = { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } };
fs.writeFileSync(path.join(tdir, 'hebrew.mjs'),
  ts.transpileModule(fs.readFileSync('/home/user/maor-system/src/lib/hebrew.ts', 'utf8'), opts).outputText);
// hebdate מייבא './hebrew' — מפנים לקובץ המתורגם (Node דורש סיומת)
fs.writeFileSync(path.join(tdir, 'hebdate.mjs'),
  ts.transpileModule(fs.readFileSync('/home/user/maor-system/src/lib/hebdate.ts', 'utf8'), opts)
    .outputText.replace("from './hebrew'", "from './hebrew.mjs'"));
const OLDHEB = await import(pathToFileURL(path.join(tdir, 'hebrew.mjs')).href);
const OLD = await import(pathToFileURL(path.join(tdir, 'hebdate.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/hebdate.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
let n = 0;

// 1) לועזי→עברי על 400 ימים אקראיים בחלון קבוע 1994-01-01 + 0..18500 ימים (עד ~2044)
const base = new Date('1994-01-01T12:00:00');
const isos = Array.from({ length: 400 }, () =>
  new Date(base.getTime() + Math.floor(rnd() * 18500) * 86400000).toISOString().slice(0, 10));
for (const iso of isos) {
  assert.deepStrictEqual(NEW.isoToHebParts(iso), OLD.isoToHebParts(iso), 'isoToHebParts: ' + iso);
  n++;
}
// 2) round-trip עברי→לועזי (הסריקה היקרה) על 40 מהם — ישן≡חדש≡iso
for (const iso of isos.slice(0, 40)) {
  const p = OLD.isoToHebParts(iso);
  const o = OLD.hebToIso(p.day, p.monthHe, p.year);
  const w = NEW.hebToIso(p.day, p.monthHe, p.year);
  assert.strictEqual(w, o, 'hebToIso: ' + JSON.stringify(p));
  assert.strictEqual(w, iso, 'round-trip: ' + iso);
  n += 2;
}
// 3) מעוברת/פשוטה + חודשי-שנה על 5779..5790
for (let y = 5779; y <= 5790; y++) {
  assert.strictEqual(NEW.isHebLeapYear(y), OLD.isHebLeapYear(y), 'leap: ' + y);
  assert.deepStrictEqual(NEW.hebMonthsOf(y), OLD.hebMonthsOf(y), 'months: ' + y);
  n += 2;
}
// 4) מילון-החודשים דו-כיווני + לא-מוכרים
const EN = ['Tishri', 'Heshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar I', 'Adar II',
  'Nisan', 'Iyar', 'Sivan', 'Tamuz', 'Av', 'Elul', 'Foo', ''];
for (const en of EN) {
  assert.strictEqual(NEW.monthHeOf(en), OLD.monthHeOf(en), 'monthHeOf: ' + en);
  assert.strictEqual(NEW.monthEnOf(OLD.monthHeOf(en) || 'זבל'), OLD.monthEnOf(OLD.monthHeOf(en) || 'זבל'), 'monthEnOf: ' + en);
  n += 2;
}
// 5) hebYearNow — הנוסחה של המקור (hebdate.ts:53 — hebParts(now).year) על שעונים קבועים מוזרקים
for (const d of [new Date(2026, 7, 24, 12), new Date(2026, 8, 30, 12), new Date(1999, 0, 1, 12)]) {
  assert.strictEqual(NEW.hebYearNow(d), OLDHEB.hebParts(d).year, 'hebYearNow: ' + d.toISOString());
  n++;
}
// 6) ולידציית-CLDR — שנתיים קבועות (פשוטה+מעוברת), ישן≡חדש (שתיהן ריקות בסביבה תקינה)
for (const y of [5784, 5786]) {
  assert.deepStrictEqual(NEW.validateHebMonthNames(y), OLD.validateHebMonthNames(y), 'validate: ' + y);
  n++;
}
// 7) גבולות וקצוות — ישן≡חדש תו-בתו
const edges = [
  () => [NEW.hebToIso(0, 'אב', 5786), OLD.hebToIso(0, 'אב', 5786)],
  () => [NEW.hebToIso(31, 'אב', 5786), OLD.hebToIso(31, 'אב', 5786)],
  () => [NEW.hebToIso(2.5, 'אב', 5786), OLD.hebToIso(2.5, 'אב', 5786)],
  () => [NEW.hebToIso(15, 'אב', 3999), OLD.hebToIso(15, 'אב', 3999)],
  () => [NEW.hebToIso(15, 'אב', 7001), OLD.hebToIso(15, 'אב', 7001)],
  () => [NEW.hebToIso(15, 'זבל', 5786), OLD.hebToIso(15, 'זבל', 5786)],
  () => [NEW.hebToIso(1, 'אדר א׳', 5786), OLD.hebToIso(1, 'אדר א׳', 5786)], // אדר א׳ בפשוטה
  () => [NEW.hebToIso(30, 'חשוון', 5786), OLD.hebToIso(30, 'חשוון', 5786)], // ל׳ חשוון
  () => [NEW.hebToIso(30, 'חשוון', 5785), OLD.hebToIso(30, 'חשוון', 5785)],
  () => [NEW.hebToIso(23, 'אב', 5786), OLD.hebToIso(23, 'אב', 5786)],       // הדוגמה שבמקור
  () => [NEW.isoToHebParts(''), OLD.isoToHebParts('')],
  () => [NEW.isoToHebParts('junk'), OLD.isoToHebParts('junk')],
  () => [NEW.isoToHebParts('2026-8-6'), OLD.isoToHebParts('2026-8-6')],
  () => [JSON.stringify(NEW.isoToHebParts('2026-02-30')), JSON.stringify(OLD.isoToHebParts('2026-02-30'))], // גלגול-V8
];
for (const e of edges) { const [w, o] = e(); assert.deepStrictEqual(w, o, 'edge: ' + o); n++; }

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-hebdate: ישן≡חדש על ${n} השוואות (400 ימים 1994-2044 + 40 round-trip + 12 שנים + מילון + ולידציה + קצוות)`);
