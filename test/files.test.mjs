import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../engine/kupa.mjs';
import * as F from '../engine/files.mjs';

const NOW = '2026-10-25T14:59:00';
const enc = (s) => new TextEncoder().encode(s);
// קידוד Windows-1255 (מה ששומר "CSV" רגיל באקסל עברי): א–ת ⇒ 0xE0–0xFA
const cp1255 = (s) => Uint8Array.from([...s].map((ch) => {
  const c = ch.codePointAt(0);
  if (c >= 0x5d0 && c <= 0x5ea) return c - 0x5d0 + 0xe0;
  if (c < 0x80) return c;
  throw new Error('no cp1255 for ' + ch);
}));

function card() {
  let c = K.updateSettings(K.emptyCard(), { bizName: 'בוטיק', osekNo: '000000018' });
  c = K.upsertProduct(c, { code: '7290000000015', name: 'חולצה, כותנה', price: 8990, stock: 5 }).card;
  c = K.upsertProduct(c, { code: '7290000000022', name: 'חצאית', price: 14900, stock: null }).card;
  return c;
}

test('מוצרים.csv: ייצוא ⇒ ייבוא מחזיר בדיוק את אותם מוצרים (כולל פסיק בשם)', () => {
  const c = card();
  const csv = F.productsCsv(c);
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes("'7290000000015"));
  const r = F.importProductsCsv(c, enc(csv));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.card.products, c.products);
  assert.equal(r.added + r.changed + r.removed, 0);
});

test('קובץ שנשמר באקסל כ-CSV רגיל (Windows-1255, בלי גרש) — נקרא נכון', () => {
  const text = 'ברקוד,שם,מחיר,מלאי\r\n7290000000015,חולצה,99.90,4\r\n7290000000022,חצאית,149,\r\n';
  const r = F.importProductsCsv(card(), cp1255(text));
  assert.deepEqual(r.errors, []);
  assert.equal(r.card.products[0].name, 'חולצה');
  assert.equal(r.card.products[0].price, 9990);
  assert.equal(r.changed, 1);
});

test('מפריד נקודה-פסיק (הגדרות אזור אחרות באקסל) ומחירים בכמה צורות', () => {
  const text = 'ברקוד;שם;מחיר;מלאי\n7290000000015;חולצה;₪89.90;5\n7290000000022;חצאית;"1,234.50";\n7290000000039;צעיף;45,5;2\n';
  const r = F.importProductsCsv(card(), enc(text));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.card.products.map((p) => p.price), [8990, 123450, 4550]);
  assert.equal(r.added, 1);
});

test('ברקוד שאקסל שיבש (7.29E+12) — נדחה עם הסבר, ושום דבר לא משתנה', () => {
  const c = card();
  const text = 'ברקוד,שם,מחיר,מלאי\n7.29E+12,חולצה,89.90,5\n';
  const r = F.importProductsCsv(c, enc(text));
  assert.equal(r.card, c);
  assert.equal(r.errors[0].line, 2);
  assert.match(r.errors[0].msg, /השתבש באקסל/);
});

test('הכול או כלום: שורה שגויה אחת ⇒ אף מוצר לא משתנה; כל השגיאות מדווחות עם מספר שורה', () => {
  const c = card();
  const text = 'ברקוד,שם,מחיר,מלאי\n7290000000015,חולצה,10,5\n7290000000016,שגוי,10,\n7290000000022,,10,\n7290000000039,צעיף,abc,\n7290000000015,כפול,10,\n7290000000046,מלאי,10,x\n';
  const r = F.importProductsCsv(c, enc(text));
  assert.equal(r.card, c);
  assert.deepEqual(r.errors.map((e) => e.line), [3, 4, 5, 6, 7]);
});

test('חסרה עמודה ⇒ שגיאה ברורה', () => {
  const r = F.importProductsCsv(card(), enc('ברקוד,שם\n7290000000015,חולצה\n'));
  assert.match(r.errors[0].msg, /מחיר/);
});

test('מחיקת שורה מוחקת מוצר; ברקוד פנימי שהוקלד ידנית מקדם את המונה', () => {
  const text = "ברקוד,שם,מחיר,מלאי\n'7290000000015,חולצה,89.90,5\n'2000000000053,פריט פנימי,10,\n";
  const r = F.importProductsCsv(card(), enc(text));
  assert.deepEqual(r.errors, []);
  assert.equal(r.removed, 1);
  assert.equal(r.card.seq.internal, 5);
  assert.notEqual(K.nextInternalCode(r.card).code, '2000000000053');
});

test('הקבצים בכרטיס: מוצרים, קבלות, קרא-אותי, וקובץ לכל סגירת יום', () => {
  const device = K.newDevice('D', 'a1'.repeat(32));
  let c = K.checkCard(card(), device).card;
  let st = K.checkout(c, K.cartAdd(K.emptyCart(), c, '7290000000015').cart, { method: 'cash', now: NOW, device });
  st = K.closeDay(st.card, NOW, st.device);
  const files = F.exportCardFiles(st.card);
  assert.deepEqual(Object.keys(files).sort(), ['דוחות/סגירת-יום-0001.txt', 'מוצרים.csv', 'קבלות.csv', 'קרא-אותי.txt'].sort());
  assert.ok(files['דוחות/סגירת-יום-0001.txt'].includes('89.90'));
  assert.ok(files['קבלות.csv'].includes('מזומן'));
});

test('אקסל מחק אפסים מובילים (0012… ⇒ 12…) — אותו מוצר, הברקוד המקורי נשמר; סורק ששולח 12 ספרות מוצא אותו', () => {
  let c = K.upsertProduct(card(), { code: '0012345678905', name: 'אפסים', price: 2500, stock: 3 }).card;
  const text = 'ברקוד,שם,מחיר,מלאי\n7290000000015,חולצה,89.90,5\n7290000000022,חצאית,149,\n12345678905,אפסים,30,3\n';
  const r = F.importProductsCsv(c, enc(text));
  assert.deepEqual(r.errors, []);
  const p = r.card.products.find((x) => x.name === 'אפסים');
  assert.equal(p.code, '0012345678905');
  assert.equal(p.price, 3000);
  assert.equal(r.added, 0);
  assert.equal(r.removed, 0);
  assert.equal(K.findProduct(r.card, '012345678905').name, 'אפסים'); // UPC-A מסורק
  assert.equal(K.findProduct(r.card, '0012345678905').name, 'אפסים');
});
