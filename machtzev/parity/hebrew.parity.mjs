#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-hebrew — הישן (maor/src/lib/hebrew.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/hebrew.mjs) על כל 9 החוטים: gem/gemYear/adarNorm על קורפוס-LCG,
 *  hebParts/hebPartsOfIso/hebDateFull/holidayOf על ~5,600 ימים רצופים (2012-2027 —
 *  מכסה מעוברות, תענית-אסתר-מוקדמת 2013, ט' באב-נדחה 2022, גדליה-נדחה 2024, וגלישת
 *  מטמון-3000), hebAnnualEq על צמדים-אקראיים + הצלבת עוגני-30 מול ימי-א'. אפס-סטייה.
 *  דטרמיניסטי: ‏LCG ‏seed=20260824, תאריכים קבועים, בלי Date.now. */
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
const NEW = await import('/home/user/-ai-chat-server/new/boxes/hebrew.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
let n = 0;

// 1) gem — קורפוס-LCG שלמים/שבורים + מקרי-הקצה המנויים (15/16/אפסים/שליליים/NaN)
const gemSpecials = [0, 1, 15, 16, 100, 115, 116, 500, 786, 999, 1000, 5786, -1, -100, NaN, 1.5, 15.9, '15', '786', 'abc', Infinity, -Infinity];
for (const v of gemSpecials) { assert.strictEqual(NEW.gem(v), OLD.gem(v), 'gem: ' + v); n++; }
for (let i = 0; i < 500; i++) {
  const v = Math.floor(rnd() * 6100) - 50;
  assert.strictEqual(NEW.gem(v), OLD.gem(v), 'gem: ' + v); n++;
}

// 2) gemYear — מספר/מחרוזת/זבל
for (const v of [5786, '5786', 786, 0, 'תשפ״ו', '', -5786, 5784.7]) {
  assert.strictEqual(NEW.gemYear(v), OLD.gemYear(v), 'gemYear: ' + v); n++;
}

// 3) adarNorm — כל שמות-החודשים + זרים
for (const m of ['Tishri', 'Heshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar I', 'Adar II', 'Nisan', 'Iyar', 'Sivan', 'Tamuz', 'Av', 'Elul', '', 'adar ii', 'X']) {
  assert.strictEqual(NEW.adarNorm(m), OLD.adarNorm(m), 'adarNorm: ' + m); n++;
}

// 4-7) סריקת-ימים רציפה: parts ≡ · partsOfIso ≡ · fullDate ≡ תו-בתו · holidayOf ≡
const d0 = new Date('2012-01-01T12:00:00');
const day30 = [], day01 = [];
for (let i = 0; i < 5600; i++) {
  const d = new Date(d0.getTime() + i * 86400000);
  const iso = d.toISOString().slice(0, 10);
  const op = OLD.hebPartsOfIso(iso);
  assert.deepStrictEqual(NEW.hebParts(new Date(iso + 'T12:00:00')), OLD.hebParts(new Date(iso + 'T12:00:00')), 'hebParts: ' + iso);
  assert.deepStrictEqual(NEW.hebPartsOfIso(iso), op, 'hebPartsOfIso: ' + iso);
  assert.strictEqual(NEW.hebDateFull(iso), OLD.hebDateFull(iso), 'hebDateFull: ' + iso);
  assert.strictEqual(NEW.holidayOf(new Date(iso + 'T12:00:00')), OLD.holidayOf(new Date(iso + 'T12:00:00')), 'holidayOf: ' + iso);
  n += 4;
  if (op.day === 30 && day30.length < 40) day30.push(op);
  if (op.day === 1 && day01.length < 40) day01.push(op);
}

// 8) HOLIDAYS — המפה קבועה, זהה מפתח-במפתח
assert.deepStrictEqual(NEW.HOLIDAYS, OLD.HOLIDAYS, 'HOLIDAYS');
n++;

// 9) hebAnnualEq — צמדים-אקראיים מפירוקים אמיתיים + הצלבת כלל-ל' (עוגני-30 × ימי-א')
const parts = (i) => OLD.hebPartsOfIso(new Date(d0.getTime() + Math.floor(i) * 86400000).toISOString().slice(0, 10));
for (let i = 0; i < 400; i++) {
  const a = parts(rnd() * 5600), q = parts(rnd() * 5600);
  assert.strictEqual(NEW.hebAnnualEq(a, q), OLD.hebAnnualEq(a, q), `hebAnnualEq: ${JSON.stringify(a)} vs ${JSON.stringify(q)}`);
  n++;
}
for (const a of day30) for (const q of day01) {
  assert.strictEqual(NEW.hebAnnualEq(a, q), OLD.hebAnnualEq(a, q), `כלל-ל': ${JSON.stringify(a)} vs ${JSON.stringify(q)}`);
  n++;
}
// עוגנים סינתטיים לדין-אדר (כולל אדר-א'/ב' מפורשים מול שנה פשוטה ומעוברת)
const adarQ = [OLD.hebPartsOfIso('2024-03-24'), OLD.hebPartsOfIso('2025-03-14'), OLD.hebPartsOfIso('2024-02-23')];
for (const m of ['Adar', 'Adar I', 'Adar II', 'Elul']) for (const q of adarQ) {
  const a = { day: 14, month: m };
  assert.strictEqual(NEW.hebAnnualEq(a, q), OLD.hebAnnualEq(a, q), `דין-אדר: ${m} vs ${JSON.stringify(q)}`);
  n++;
}

// 10) קצוות: ריק/זבל/פורמט-שבור/ISO-ארוך — התנהגות זהה, בלי זריקות
for (const iso of ['', 'junk', '2026-8-4', '2026-08-24T23:59:59Z', '0000-00-00']) {
  assert.strictEqual(NEW.hebDateFull(iso), OLD.hebDateFull(iso), 'edge fullDate: ' + iso);
  n++;
  if (iso) { assert.deepStrictEqual(NEW.hebPartsOfIso(iso), OLD.hebPartsOfIso(iso), 'edge partsOfIso: ' + iso); n++; }
}
assert.strictEqual(NEW.holidayOf(new Date('zzz')), OLD.holidayOf(new Date('zzz')), 'edge holidayOf: invalid');
n++;

fs.unlinkSync(tmp);
console.log(`🥇 זהב-lib-hebrew: ישן≡חדש על ${n} השוואות (9/9 חוטים · 5,600 ימים 2012-2027 · LCG seed=20260824 · כלל-ל'+דין-אדר+צומות-נדחים · קצוות)`);
