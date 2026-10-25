import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../engine/kupa.mjs';
import * as E from '../engine/escpos.mjs';
import { readFileSync } from 'node:fs';

const NOW = '2026-10-25T14:59:00';

test('סדר חזותי: זהה ל-python-bidi (מימוש UAX #9) בכל חלקי הקבלות והדוחות', () => {
  // הקובץ נוצר מ-python-bidi get_display(base_dir='R') — מקור השוואה חיצוני
  const fx = JSON.parse(readFileSync(new URL('./fixtures-bidi.json', import.meta.url), 'utf8'));
  assert.ok(fx.length > 40);
  for (const [logical, ref] of fx) assert.equal(E.bidiSegment(logical), ref, logical);
});

test('שורה עם חלקים: סדר החלקים מתהפך וכל חלק נשאר קריא', () => {
  assert.equal(E.toVisual('סה"כ    89.90'), '89.90    כ"הס');
  assert.equal(E.toVisual('  1 x 89.90      89.90'), '89.90      1 x 89.90  ');
});

test('ריפוד לרוחב: שורת "שם ... סכום" יוצאת עם השם בימין והסכום בשמאל', () => {
  const doc = E.escposDocument(['סה"כ  89.90'], { width: 20, cut: false });
  const body = [...doc.slice(5, 5 + 20)];
  const text = String.fromCharCode(...body.map((b) => (b >= 0x80 && b <= 0x9a ? 0x5d0 + b - 0x80 : b)));
  assert.equal(text, '         89.90  כ"הס');
});

test('מסמך ESC/POS: אתחול, עמוד עברית 36 (CP862), שורות, הזנה וחיתוך', () => {
  const d = E.escposDocument(['א'], { width: 4 });
  assert.deepEqual([...d.slice(0, 5)], [0x1b, 0x40, 0x1b, 0x74, 36]);
  assert.deepEqual([...d.slice(5, 10)], [0x20, 0x20, 0x20, 0x80, 0x0a]);
  assert.deepEqual([...d.slice(-7)], [0x1b, 0x64, 4, 0x1d, 0x56, 0x42, 0x00]);
  assert.equal(E.escposDocument(['ת'], { width: 1, codepage: 'cp1255', cut: false })[4], 49);
  assert.equal(E.escposDocument(['ת'], { width: 1, codepage: 'cp1255', cut: false })[5], 0xfa);
});

test('כל קבלה ודוח שהקופה מפיקה — בלי אף תו שהמדפסת לא מכירה (?)', () => {
  let card = K.updateSettings(K.emptyCard(), { bizName: 'בוטיק לנשים - הדגמה', osekNo: '000000018', address: 'רחוב הדוגמה 1', phone: '050-0000000' });
  card = K.upsertProduct(card, { code: '7290000000015', name: 'חולצה (כותנה)', price: 8990, stock: 1 }).card;
  const b = K.checkCard(card, K.newDevice('D', 'a1'.repeat(32)));
  card = b.card;
  const device = b.device;
  let c = K.cartAdd(K.emptyCart(), card, '7290000000015').cart;
  c = K.cartBasket(K.cartDiscountPct(c, 0, 10).cart, { amount: 100 }).cart;
  let st = K.checkout(card, c, { method: 'cash', tendered: 10000, now: NOW, device });
  const sale = st.receipt;
  st = K.checkout(st.card, K.cartAdd(K.cartToggleRefund(K.emptyCart(), 1), st.card, '7290000000015').cart, { method: 'cash', now: NOW, device: st.device });
  const z = K.closeDay(st.card, NOW, st.device);
  const all = [
    ...K.receiptLines(z.card, sale), ...K.receiptLines(z.card, sale, { copy: true }), ...K.receiptLines(z.card, st.receipt),
    ...K.reportLines(z.card, z.report), ...K.stockLines(z.card, NOW),
  ];
  for (const l of all) {
    const bytes = E.encodeCp862(E.toVisual(l));
    assert.ok(!bytes.includes(0x3f) || l.includes('?'), `תו לא מוכר בשורה: ${l}`);
  }
});
