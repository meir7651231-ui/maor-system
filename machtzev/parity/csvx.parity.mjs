#!/usr/bin/env node
/** 🥇 רתמת-זהב · csvx — הישן (maor/src/lib/csvx.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/csvx.mjs) על קורפוס-LCG דטרמיניסטי seed=20260824:
 *  csvEscape · toCsv · parseCsv · parseAnyDate · decodeCsvBuffer · readCsvFileText.
 *  downloadCsv = גבול-IO (DOM+guardExport) — לא ברתמה, כמו names-export.
 *  אפס Date.now בקורפוס — תאריכים קבועים (ציר-המאה של parseAnyDate נקרא
 *  מהשעון בשני הצדדים זהה ⇒ אפס-סטייה בכל רגע). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
// csvx.ts מייבא guardExport מ-'./exportGate' (שער-ה-DOM של downloadCsv) — מסירים
// את שורת-הייבוא כדי לתרגם עצמאית; downloadCsv לא נקרא ברתמה, אז ה-free-var בגוף
// הפונקציה ותלויות-ה-DOM (document/URL/Blob) לעולם לא מורצים.
const rawSrc = fs.readFileSync('/home/user/maor-system/src/lib/csvx.ts', 'utf8');
const src = rawSrc.replace(/^import\s.*from\s*['"]\.\/exportGate['"];\s*$/m, '');
const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const tmp = path.join(os.tmpdir(), 'csvx-old-' + process.pid + '.mjs');
fs.writeFileSync(tmp, js);
const OLD = await import(pathToFileURL(tmp).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/csvx.mjs');

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
let n = 0;

// 1) csvEscape ≡ — תאים עם הזרקות/פסיקים/גרשיים/שורות/עברית/מספרים/null
const cells = ['שם רגיל', '=SUM(A1)', '+972501234', '-5', '@cmd', 'עם,פסיק',
  'עם"גרש', 'שתי\nשורות', 'CR\rראש', '\tטאב', 'a"b"c', '', ' ', 0, 42, -7,
  '=1+2', 'שלום, עולם', '"מצוטט"', 'line\r\nbreak', null, undefined];
for (let i = 0; i < 600; i++) {
  const c = pick(cells);
  assert.strictEqual(NEW.csvEscape(c), OLD.csvEscape(c), 'csvEscape: ' + JSON.stringify(c));
  n++;
}

// 2) toCsv ≡ — שורות אקראיות (כולל ריקות, תאים-מרובים) — תו-בתו כולל BOM
for (let i = 0; i < 300; i++) {
  const rows = Array.from({ length: Math.floor(rnd() * 5) }, () =>
    Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => pick(cells)));
  assert.strictEqual(NEW.toCsv(rows), OLD.toCsv(rows), 'toCsv סבב ' + i);
  n++;
}

// 3) parseCsv ≡ — טקסטים-אקראיים מקטעי-CSV (ציטוט/פסיק/טאב/CRLF/עברית/BOM)
const frags = ['a', 'b', 'שלום', '', ',', '\t', '\n', '\r', '\r\n', '"', '""',
  '"x,y"', '"he ""said"""', 'עם,פסיק', '  ', '﻿', '123', '"multi\nline"',
  'z"mid', 'end"'];
for (let i = 0; i < 700; i++) {
  const text = Array.from({ length: Math.floor(rnd() * 14) }, () => pick(frags)).join('');
  assert.deepStrictEqual(NEW.parseCsv(text), OLD.parseCsv(text), 'parseCsv: ' + JSON.stringify(text));
  n++;
}

// 4) parseAnyDate ≡ — פורמטים נפוצים + זבל + קצוות (תאריכים קבועים)
const dates = ['2024-12-31', '2015-06-31', '2019-02-30', '2024-02-29', '2023-02-29',
  '31/12/2024', '5.3.2024', '1-2-2020', '29/2/2024', '31/4/2024', '13/13/2024',
  '44927', '45000', '00000', '99999', '1/2/26', '1/2/99', '01/01/00', '',
  '  ', 'לא-תאריך', '2024/12/31', 'abc', '2024-1-1', '5.3.24', '  7.7.2007  '];
for (let i = 0; i < 500; i++) {
  const d = pick(dates);
  assert.strictEqual(NEW.parseAnyDate(d), OLD.parseAnyDate(d), 'parseAnyDate: ' + JSON.stringify(d));
  n++;
}

// 5) decodeCsvBuffer ≡ — בייטים בקידודים שונים: UTF-16LE/BE BOM · UTF-8 (±BOM) ·
//    NUL-כבד (UTF-16LE בלי-BOM) · windows-1255 (בייטים גבוהים ⇒ � ב-UTF-8)
const strs = ['hi', 'שלום', 'a,b\nc,d', 'עם"גרש', 'mix עברית 123', '', 'x\ty'];
const enc16le = (str, bom) => { const b = new Uint8Array((bom ? 2 : 0) + str.length * 2); let o = 0; if (bom) { b[0] = 0xff; b[1] = 0xfe; o = 2; } for (let i = 0; i < str.length; i++) { b[o + i * 2] = str.charCodeAt(i) & 0xff; b[o + i * 2 + 1] = str.charCodeAt(i) >> 8; } return b.buffer; };
const enc16be = (str) => { const b = new Uint8Array(2 + str.length * 2); b[0] = 0xfe; b[1] = 0xff; for (let i = 0; i < str.length; i++) { b[2 + i * 2] = str.charCodeAt(i) >> 8; b[2 + i * 2 + 1] = str.charCodeAt(i) & 0xff; } return b.buffer; };
const enc8 = (str, bom) => { const body = new TextEncoder().encode(str); const b = new Uint8Array((bom ? 3 : 0) + body.length); if (bom) { b.set([0xef, 0xbb, 0xbf]); b.set(body, 3); } else b.set(body); return b.buffer; };
const win1255 = () => new Uint8Array([0xf9, 0xec, 0xe5, 0xed, 0x2c, 0x61]).buffer; // שלום,a ב-cp1255
const buffers = [];
for (const str of strs) { buffers.push(enc16le(str, true), enc16le(str, false), enc16be(str), enc8(str, true), enc8(str, false)); }
buffers.push(win1255(), new Uint8Array([]).buffer, new Uint8Array([0x41]).buffer,
  new Uint8Array(Array.from({ length: 40 }, (_, i) => (i % 2 ? 0 : 0x41))).buffer); // NUL-כבד ⇒ UTF-16LE
for (const buf of buffers) {
  assert.strictEqual(NEW.decodeCsvBuffer(buf), OLD.decodeCsvBuffer(buf), 'decodeCsvBuffer');
  n++;
  // 6) readCsvFileText ≡ — אותם בייטים דרך File-מזויף (arrayBuffer), decode מחווט
  const fake = { arrayBuffer: async () => buf };
  assert.strictEqual(await NEW.readCsvFileText(fake), await OLD.readCsvFileText(fake), 'readCsvFileText');
  n++;
}

fs.unlinkSync(tmp);
console.log(`🥇 זהב-csvx: ישן≡חדש על ${n} השוואות (csvEscape 600 · toCsv 300 · parseCsv 700 · parseAnyDate 500 · decode+readFile ${buffers.length}×2) — קורפוס-LCG seed=20260824, אפס Date.now`);
