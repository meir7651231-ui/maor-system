import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../engine/kupa.mjs';

const NOW = '2026-10-25T14:59:00';
const TOMORROW = '2026-10-26T09:00:00';
const KEY = 'a1'.repeat(32);

function setup() {
  let card = K.updateSettings(K.emptyCard(), { bizName: 'בוטיק לנשים', osekNo: '512345678', address: 'רחוב הדוגמה 1', phone: '050-0000000' });
  card = K.upsertProduct(card, { code: '7290000000011', name: 'חולצה', price: 8990, stock: 5 }).card;
  card = K.upsertProduct(card, { code: '7290000000028', name: 'חצאית', price: 12000, stock: null }).card;
  const device = K.newDevice('KUPA-0001', KEY);
  card = K.checkCard(card, device).card; // שיוך הכרטיס לקופה
  return { card, device };
}

// מכירה מהירה: מחזיר {card, device, receipt}
function sell(st, build, opts = {}) {
  const cart = build(K.emptyCart(), st.card);
  return K.checkout(st.card, cart, { method: 'cash', now: NOW, device: st.device, ...opts });
}
const shirt = (c, card) => K.cartAdd(c, card, '7290000000011').cart;
const manual = (amt) => (c) => K.cartAddManual(c, amt).cart;

test('בלי שם עסק ומספר עוסק — אי אפשר למכור', () => {
  const device = K.newDevice('D', KEY);
  const card = K.checkCard(K.emptyCard(), device).card;
  const r = K.checkout(card, K.cartAddManual(K.emptyCart(), 1000).cart, { method: 'cash', now: NOW, device });
  assert.equal(r.error, 'הקופה לא הוגדרה');
});

test('ספרת ביקורת של מספר עוסק', () => {
  assert.equal(K.validOsekNo('000000018'), true);
  assert.equal(K.validOsekNo('000000017'), false);
  assert.equal(K.validOsekNo('12345'), false);
});

test('סריקה כפולה של אותו מוצר מגדילה כמות; מוצר לא קיים מחזיר שגיאה', () => {
  const { card } = setup();
  let cart = K.cartAdd(K.emptyCart(), card, '7290000000011').cart;
  cart = K.cartAdd(cart, card, '7290000000011').cart;
  assert.equal(cart.lines.length, 1);
  assert.equal(cart.lines[0].qty, 2);
  assert.equal(K.cartAdd(cart, card, '999').error, 'מוצר לא נמצא');
});

test('מכירה במזומן: עודף, מע"מ כלול, מלאי יורד, מספור רציף, חתימה', () => {
  let st = setup();
  let cart = K.cartAdd(K.emptyCart(), st.card, '7290000000011').cart;
  cart = K.cartAdd(cart, st.card, '7290000000028').cart;
  const r1 = K.checkout(st.card, cart, { method: 'cash', tendered: 25000, now: NOW, device: st.device });
  assert.equal(r1.receipt.no, 1);
  assert.equal(r1.receipt.n, 1);
  assert.ok(/^[0-9a-f]{64}$/.test(r1.receipt.h));
  assert.equal(r1.receipt.total, 20990);
  assert.equal(r1.receipt.change, 4010);
  assert.equal(r1.receipt.vat, Math.round((20990 * 0.18) / 1.18));
  assert.equal(K.findProduct(r1.card, '7290000000011').stock, 4);
  assert.equal(K.findProduct(r1.card, '7290000000028').stock, null);
  const r2 = sell(r1, manual(500), { method: 'credit' });
  assert.equal(r2.receipt.no, 2);
  assert.deepEqual(K.checkSequence(r2.card), { ok: true, missing: [], dup: [], top: 2 });
  assert.ok(K.checkCard(r2.card, r2.device).card);
});

test('מזומן פחות מהסכום — נדחה ולא צורך מספר קבלה או פעולה', () => {
  const st = setup();
  const r = sell(st, shirt, { tendered: 5000 });
  assert.ok(r.error);
  assert.equal(r.card.seq.receipt, 0);
  assert.equal(r.card.seq.op, 0);
});

test('הנחה לא יכולה לעבור את סכום השורה', () => {
  const { card } = setup();
  const cart = K.cartAdd(K.emptyCart(), card, '7290000000011').cart;
  assert.ok(K.cartDiscount(cart, 0, 9000).error);
  assert.equal(K.cartTotals(K.cartDiscount(cart, 0, 990).cart, 0.18).total, 8000);
});

test('החזרה: סכומים שליליים, המלאי חוזר', () => {
  const st = setup();
  const r = sell(st, (c, card) => K.cartToggleRefund(shirt(c, card)));
  assert.equal(r.receipt.total, -8990);
  assert.equal(r.receipt.type, 'refund');
  assert.equal(K.findProduct(r.card, '7290000000011').stock, 6);
  assert.ok(K.receiptLines(r.card, r.receipt).some((l) => l.includes('הוחזר במזומן') && l.includes('89.90')));
});

test('דוח ביניים לא סוגר; סגירת יום סוגרת, ממספרת, ומספור הקבלות ממשיך', () => {
  let st = setup();
  st = sell(st, shirt);
  st = sell(st, (c, card) => K.cartAdd(c, card, '7290000000028').cart, { method: 'credit' });
  const x = K.printInterim(st.card, NOW, st.device);
  assert.equal(x.report.count, 2);
  assert.equal(x.report.cash, 8990);
  assert.equal(x.report.credit, 12000);
  assert.equal(x.report.nonSale, 1); // הדוח עצמו
  st = x;
  const z = K.closeDay(st.card, NOW, st.device);
  assert.equal(z.report.no, 1);
  assert.equal(z.report.total, 20990);
  assert.equal(z.report.gt, 20990);
  st = z;
  assert.equal(K.interimReport(st.card, NOW).count, 0);
  assert.ok(K.closeDay(st.card, NOW, st.device).error);
  st = sell(st, manual(100));
  const z2 = K.closeDay(st.card, NOW, st.device).report;
  assert.equal(z2.no, 2);
  assert.equal(z2.fromNo, 3);
  assert.equal(z2.gt, 21090); // מצטבר מיום הפתיחה
});

test('סגירת יום חובה: ביום חדש אי אפשר למכור לפני Z ליום הקודם', () => {
  let st = setup();
  st = sell(st, shirt);
  const blocked = sell(st, shirt, { now: TOMORROW });
  assert.match(blocked.error, /לסגור את היום הקודם/);
  st = K.closeDay(st.card, TOMORROW, st.device);
  assert.ok(sell(st, shirt, { now: TOMORROW }).receipt);
});

test('עוסק פטור — בלי מע"מ', () => {
  let st = setup();
  st = { ...st, card: K.updateSettings(st.card, { osekType: 'פטור' }) };
  const r = sell(st, manual(1000));
  assert.equal(r.receipt.vat, 0);
  assert.ok(K.receiptLines(r.card, r.receipt).some((l) => l.includes('ללא מע"מ')));
});

test('מקור על הקבלה, העתק על העתק; דוחות מסתיימים ב"סוף דוח" עם GT', () => {
  const st = sell(setup(), shirt, { tendered: 10000 });
  const orig = K.receiptLines(st.card, st.receipt);
  const copy = K.receiptLines(st.card, st.receipt, { copy: true });
  assert.ok(orig.some((l) => l.includes('מקור')) && !orig.some((l) => l.includes('העתק')));
  assert.ok(copy.some((l) => l.includes('העתק')) && !copy.some((l) => l.includes('מקור')));
  for (const l of orig) assert.ok(l.length <= 32, l);
  const z = K.closeDay(st.card, NOW, st.device);
  const lines = K.reportLines(z.card, z.report);
  assert.ok(lines.some((l) => l.includes('GT') && l.includes('89.90')));
  assert.ok(lines[lines.length - 1].includes('סוף דוח'));
  for (const l of lines) assert.ok(l.length <= 32, l);
});

test('ברקוד פנימי: EAN-13 תקין, קידומת 2, רץ', () => {
  const { card } = setup();
  const a = K.nextInternalCode(card);
  const b = K.nextInternalCode(a.card);
  assert.ok(K.validEan13(a.code) && a.code.startsWith('2'));
  assert.notEqual(a.code, b.code);
});

test('כרטיס: שמירה וטעינה זהות; קובץ פגום נדחה', () => {
  const st = sell(setup(), manual(100));
  const back = K.parseCard(K.serializeCard(st.card)).card;
  assert.deepEqual(back, st.card);
  assert.ok(K.checkCard(back, st.device).card);
  assert.ok(K.parseCard('not json').error);
  assert.ok(K.parseCard('{"v":99}').error);
});

// ── חתימה וזיכרון הקופה ──
test('עריכת סכום של קבלה בכרטיס (במחשב) — מתגלה', () => {
  const st = sell(setup(), shirt);
  const edited = JSON.parse(K.serializeCard(st.card));
  edited.receipts[0].total = 100;
  const r = K.checkCard(K.parseCard(JSON.stringify(edited)).card, st.device);
  assert.equal(r.kind, 'tamper');
});

test('מחיקת קבלה מהכרטיס — מתגלה', () => {
  let st = sell(setup(), shirt);
  st = sell(st, manual(100));
  const cut = { ...st.card, receipts: st.card.receipts.slice(0, 1) };
  assert.ok(K.checkCard(cut, st.device).error);
});

test('החזרת הכרטיס לגרסה ישנה (גיבוי) — מתגלה', () => {
  const st1 = sell(setup(), shirt);
  const old = st1.card;
  const st2 = sell(st1, manual(100));
  assert.equal(K.checkCard(old, st2.device).kind, 'rollback');
});

test('כרטיס של קופה אחרת — נדחה; מפתח אחר לא מאמת', () => {
  const st = sell(setup(), shirt);
  assert.equal(K.checkCard(st.card, K.newDevice('KUPA-0002', KEY)).kind, 'foreign');
  assert.equal(K.checkCard(st.card, { ...st.device, key: 'b2'.repeat(32) }).kind, 'tamper');
});

test('ביטול עסקה והעתק נרשמים כפעולות חתומות ונספרים בדוח', () => {
  let st = sell(setup(), shirt);
  st = K.logOp(st.card, st.device, NOW, 'COPY', { ref: 1 });
  st = K.logOp(st.card, st.device, NOW, 'CANCEL', { items: 2, amount: 17980 });
  assert.equal(st.card.seq.op, 3);
  assert.ok(K.checkCard(st.card, st.device).card);
  assert.equal(K.closeDay(st.card, NOW, st.device).report.nonSale, 2);
});

test('בדיקת רציפות מפרטת את כל החסרים והכפולים', () => {
  let st = setup();
  for (let i = 0; i < 5; i++) st = sell(st, manual(100));
  const rs = st.card.receipts;
  const broken = { ...st.card, receipts: [rs[0], rs[2], rs[2], rs[4]] };
  const s = K.checkSequence(broken);
  assert.equal(s.ok, false);
  assert.deepEqual(s.missing, [2, 4]);
  assert.deepEqual(s.dup, [3]);
});

test('ניהול מהמחשב: מוצרים מותר; קבלות, סגירות, יומן, חתימה ומונים — אסור', () => {
  let st = sell(setup(), manual(100));
  st = K.closeDay(st.card, NOW, st.device);
  const card = st.card;
  assert.ok(K.guardManaged(card, K.upsertProduct(card, { code: '1', name: 'חדש', price: 100 }).card).card);
  assert.ok(K.guardManaged(card, K.emptyCard()).error);
  assert.ok(K.guardManaged(card, { ...card, receipts: [] }).error);
  assert.ok(K.guardManaged(card, { ...card, zReports: [] }).error);
  assert.ok(K.guardManaged(card, { ...card, ops: [{}] }).error);
  assert.ok(K.guardManaged(card, { ...card, head: '' }).error);
  assert.ok(K.guardManaged(card, { ...card, seq: { ...card.seq, receipt: 0 } }).error);
});
