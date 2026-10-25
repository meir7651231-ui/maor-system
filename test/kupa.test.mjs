import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../engine/kupa.mjs';

const NOW = '2026-10-25T14:59:00';

function setup() {
  let card = K.updateSettings(K.emptyCard(), { bizName: 'בוטיק לנשים', osekNo: '512345678', address: 'רחוב הדוגמה 1', phone: '050-0000000' });
  card = K.upsertProduct(card, { code: '7290000000011', name: 'חולצה', price: 8990, stock: 5 }).card;
  card = K.upsertProduct(card, { code: '7290000000028', name: 'חצאית', price: 12000, stock: null }).card;
  return card;
}

test('בלי שם עסק ומספר עוסק — אי אפשר למכור', () => {
  const card = K.emptyCard();
  assert.equal(K.isConfigured(card), false);
  const cart = K.cartAddManual(K.emptyCart(), 1000).cart;
  assert.equal(K.checkout(card, cart, { method: 'cash', now: NOW }).error, 'הקופה לא הוגדרה');
});

test('ספרת ביקורת של מספר עוסק', () => {
  assert.equal(K.validOsekNo('000000018'), true);
  assert.equal(K.validOsekNo('000000017'), false);
  assert.equal(K.validOsekNo('12345'), false);
});

test('סריקה כפולה של אותו מוצר מגדילה כמות; מוצר לא קיים מחזיר שגיאה', () => {
  const card = setup();
  let cart = K.cartAdd(K.emptyCart(), card, '7290000000011').cart;
  cart = K.cartAdd(cart, card, '7290000000011').cart;
  assert.equal(cart.lines.length, 1);
  assert.equal(cart.lines[0].qty, 2);
  assert.equal(K.cartAdd(cart, card, '999').error, 'מוצר לא נמצא');
});

test('מכירה במזומן: עודף, מע"מ כלול, מלאי יורד, מספור רציף', () => {
  let card = setup();
  let cart = K.cartAdd(K.emptyCart(), card, '7290000000011').cart;
  cart = K.cartAdd(cart, card, '7290000000028').cart;
  const r1 = K.checkout(card, cart, { method: 'cash', tendered: 25000, now: NOW });
  assert.equal(r1.receipt.no, 1);
  assert.equal(r1.receipt.total, 20990);
  assert.equal(r1.receipt.change, 4010);
  assert.equal(r1.receipt.vat, Math.round((20990 * 0.18) / 1.18));
  card = r1.card;
  assert.equal(K.findProduct(card, '7290000000011').stock, 4);
  assert.equal(K.findProduct(card, '7290000000028').stock, null); // לא במעקב
  const r2 = K.checkout(card, K.cartAddManual(K.emptyCart(), 500).cart, { method: 'credit', now: NOW });
  assert.equal(r2.receipt.no, 2);
  assert.deepEqual(K.checkSequence(r2.card), { ok: true });
});

test('מזומן פחות מהסכום — נדחה ולא צורך מספר קבלה', () => {
  const card = setup();
  const cart = K.cartAdd(K.emptyCart(), card, '7290000000011').cart;
  const r = K.checkout(card, cart, { method: 'cash', tendered: 5000, now: NOW });
  assert.ok(r.error);
  assert.equal(r.card.seq.receipt, 0);
});

test('הנחה לא יכולה לעבור את סכום השורה', () => {
  const card = setup();
  const cart = K.cartAdd(K.emptyCart(), card, '7290000000011').cart;
  assert.ok(K.cartDiscount(cart, 0, 9000).error);
  assert.equal(K.cartTotals(K.cartDiscount(cart, 0, 990).cart, 0.18).total, 8000);
});

test('החזרה: סכומים שליליים, המלאי חוזר', () => {
  let card = setup();
  const cart = K.cartToggleRefund(K.cartAdd(K.emptyCart(), card, '7290000000011').cart);
  const r = K.checkout(card, cart, { method: 'cash', now: NOW });
  assert.equal(r.receipt.total, -8990);
  assert.equal(r.receipt.type, 'refund');
  assert.equal(K.findProduct(r.card, '7290000000011').stock, 6);
  assert.ok(K.receiptLines(r.card, r.receipt).some((l) => l.includes('הוחזר במזומן') && l.includes('89.90')));
});

test('דוח ביניים לא סוגר; סגירת יום סוגרת ומתחילה מאפס', () => {
  let card = setup();
  card = K.checkout(card, K.cartAdd(K.emptyCart(), card, '7290000000011').cart, { method: 'cash', now: NOW }).card;
  card = K.checkout(card, K.cartAdd(K.emptyCart(), card, '7290000000028').cart, { method: 'credit', now: NOW }).card;
  const x = K.interimReport(card, NOW);
  assert.equal(x.count, 2);
  assert.equal(x.cash, 8990);
  assert.equal(x.credit, 12000);
  const z = K.closeDay(card, NOW);
  assert.equal(z.report.no, 1);
  assert.equal(z.report.total, 20990);
  card = z.card;
  assert.equal(K.interimReport(card, NOW).count, 0);
  assert.ok(K.closeDay(card, NOW).error); // אין מה לסגור
  card = K.checkout(card, K.cartAddManual(K.emptyCart(), 100).cart, { method: 'cash', now: NOW }).card;
  const z2 = K.closeDay(card, NOW).report;
  assert.equal(z2.no, 2);
  assert.equal(z2.fromNo, 3); // מספור הקבלות לא מתאפס
});

test('עוסק פטור — בלי מע"מ', () => {
  let card = K.updateSettings(setup(), { osekType: 'פטור' });
  const r = K.checkout(card, K.cartAddManual(K.emptyCart(), 1000).cart, { method: 'cash', now: NOW });
  assert.equal(r.receipt.vat, 0);
  assert.ok(K.receiptLines(r.card, r.receipt).some((l) => l.includes('ללא מע"מ')));
});

test('ברקוד פנימי: EAN-13 תקין, קידומת 2, רץ', () => {
  let card = setup();
  const a = K.nextInternalCode(card);
  const b = K.nextInternalCode(a.card);
  assert.ok(K.validEan13(a.code) && a.code.startsWith('2'));
  assert.notEqual(a.code, b.code);
  assert.ok(K.validEan13('7290000000011') === (K.ean13CheckDigit('729000000001') === 1));
});

test('כרטיס: שמירה וטעינה זהות; מונה משתקם אם נשמר מאחור', () => {
  let card = setup();
  card = K.checkout(card, K.cartAddManual(K.emptyCart(), 100).cart, { method: 'cash', now: NOW }).card;
  const back = K.parseCard(K.serializeCard(card)).card;
  assert.deepEqual(back, card);
  const broken = { ...card, seq: { ...card.seq, receipt: 0 } };
  assert.equal(K.parseCard(JSON.stringify(broken)).card.seq.receipt, 1);
  assert.ok(K.parseCard('not json').error);
  assert.ok(K.parseCard('{"v":99}').error);
});

test('שורות הקבלה לא חורגות מרוחב הגליל', () => {
  let card = setup();
  const r = K.checkout(card, K.cartAdd(K.emptyCart(), card, '7290000000011').cart, { method: 'cash', tendered: 10000, now: NOW });
  const lines = K.receiptLines(r.card, r.receipt);
  for (const l of lines) assert.ok(l.length <= 32, l);
  assert.ok(lines.some((l) => l.includes("קבלה מס' 1")));
  assert.ok(lines.some((l) => l.includes('עודף')));
});

test('ניהול מהמחשב: מוצרים מותר; קבלות, סגירות ומונים — אסור (בלי איפוס ושחזור)', () => {
  let card = setup();
  card = K.checkout(card, K.cartAddManual(K.emptyCart(), 100).cart, { method: 'cash', now: NOW }).card;
  card = K.closeDay(card, NOW).card;
  const prod = K.upsertProduct(card, { code: '1', name: 'חדש', price: 100 }).card;
  assert.ok(K.guardManaged(card, prod).card);
  assert.ok(K.guardManaged(card, K.emptyCard()).error); // איפוס
  assert.ok(K.guardManaged(card, { ...card, receipts: [] }).error);
  assert.ok(K.guardManaged(card, { ...card, zReports: [] }).error);
  assert.ok(K.guardManaged(card, { ...card, seq: { ...card.seq, receipt: 0 } }).error);
});
