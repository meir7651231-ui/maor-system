import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../engine/kupa.mjs';
import * as F from '../engine/files.mjs';
import * as R from '../engine/register.mjs';

const NOW = '2026-10-25T14:59:00';
const SHIRT = '7290000000011';

function fresh({ pin } = {}) {
  let card = K.updateSettings(K.emptyCard(), { bizName: 'בוטיק', osekNo: '000000018' });
  card = K.upsertProduct(card, { code: SHIRT, name: 'חולצה', price: 8990, stock: 5 }).card;
  card = K.upsertProduct(card, { code: '7290000000028', name: 'חצאית', price: 12000, stock: null }).card;
  if (pin) card = K.setPin(card, pin).card;
  const device = K.newDevice('KUPA-T', 'a1'.repeat(32));
  const r = R.insertCard(R.initState({ card, device, inserted: false }), card, {});
  return { st: r.st, out: r.out };
}
// הרצת רצף מקשים; מחזיר את המצב האחרון ואת כל ההדפסות
function keys(st, seq, now = NOW) {
  const prints = [];
  let last;
  for (const k of seq) {
    const r = k.startsWith('scan:') ? R.scan(st, k.slice(5), now) : R.press(st, k, now);
    st = r.st; last = r.out; prints.push(...r.out.prints);
  }
  return { st, out: last, prints };
}

test('הכנסת כרטיס ראשונה: משייכת, כותבת קבצים ושומרת', () => {
  const { st, out } = fresh();
  assert.equal(st.card.deviceId, 'KUPA-T');
  assert.ok(out.persist && out.files[F.PRODUCTS_FILE]);
  assert.equal(st.card.productsHash, F.textHash(out.files[F.PRODUCTS_FILE]));
});

test('מכירה במזומן במקשים: "כמה שילם" ⇒ חסר ⇒ עודף ⇒ קבלה', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CASH']);
  assert.equal(r.st.mode, 'cash');
  r = keys(r.st, ['5', '0', 'OK']);
  assert.match(r.st.msg.text, /חסרים/);
  assert.equal(r.prints.length, 0);
  r = keys(r.st, ['C', '1', '0', '0', 'OK']);
  assert.equal(r.prints.length, 1);
  assert.equal(r.st.paidInfo.change, 10000 - 8990);
  assert.ok(r.out.persist && r.out.files);
});

test('קוד מנהל: הנחה דורשת קוד; קוד שגוי חוסם; קוד נכון מבצע', () => {
  let { st } = fresh({ pin: '2468' });
  let r = keys(st, [`scan:${SHIRT}`, '1', '0', 'DISC']);
  assert.equal(r.st.mode, 'pin');
  r = keys(r.st, ['1', '1', '1', '1', 'OK']);
  assert.match(r.st.msg.text, /שגוי/);
  assert.equal(r.st.cart.lines[0].discount, 0);
  r = keys(r.st, ['DISC', '2', '4', '6', '8', 'OK']);
  assert.equal(r.st.cart.lines[0].discount, 1000); // הסכום שהוקלד לפני הקוד נשמר
});

test('בלי קוד מנהל — הנחה וסגירת יום ישירות', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, '1', '0', 'PCT']);
  assert.equal(r.st.cart.lines[0].discount, 899);
  r = keys(r.st, ['5', 'BASKET']);
  assert.equal(K.cartTotals(r.st.cart, 0.18).basket, 500);
  r = keys(r.st, ['CREDIT', 'MENU', '2', 'OK']);
  assert.ok(r.prints.some((p) => p.some((l) => l.includes('סגירת יום'))));
});

test('החזרה במקשים: מס\' קבלה ⇒ רק פריטים מהקבלה ⇒ קבלת החזרה', () => {
  let { st } = fresh({ pin: '2468' });
  let r = keys(st, [`scan:${SHIRT}`, 'CREDIT']);
  r = keys(r.st, ['REFUND', '2', '4', '6', '8', 'OK']);
  assert.equal(r.st.mode, 'refundOf');
  r = keys(r.st, ['9', '9', 'OK']);
  assert.match(r.st.msg.text, /לא נמצאה/);
  r = keys(r.st, ['1', 'OK']);
  assert.equal(r.st.cart.refundOf, 1);
  r = keys(r.st, ['scan:7290000000028']);
  assert.match(r.st.msg.text, /לא נמצא בקבלה 1/);
  r = keys(r.st, [`scan:${SHIRT}`, 'CREDIT']);
  const slip = r.prints[0].join('\n');
  assert.ok(slip.includes('החזרה') && slip.includes("לקבלה מס' 1"));
  r = keys(r.st, ['REFUND', '2', '4', '6', '8', 'OK', '1', 'OK']);
  assert.match(r.st.msg.text, /כבר הוחזרו/);
});

test('ביטול עסקה נרשם; שעון מאחור ⇒ שגיאה ברורה ושום דבר לא נשמר', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CREDIT']);
  r = keys(r.st, [`scan:${SHIRT}`, 'CANCEL', 'CANCEL']);
  assert.equal(r.st.card.ops.length, 1);
  r = keys(r.st, [`scan:${SHIRT}`, 'CREDIT'], '2026-10-24T09:00:00');
  assert.match(r.st.msg.text, /שעון הקופה מאחור/);
  assert.equal(r.out.persist, false);
});

test('מוצרים.csv עם מחיקה ⇒ מבקש אישור; C משאיר את הישנים; אישור מוחק', () => {
  let { st } = fresh();
  const card = st.card;
  const csv = 'ברקוד,שם,מחיר,מלאי\n7290000000011,חולצה,99,5\n';
  let r = R.insertCard(R.ejectCard(st).st, card, { [F.PRODUCTS_FILE]: csv });
  assert.equal(r.st.mode, 'confirmCsv');
  assert.match(r.st.msg.text, /יימחקו 1 \(חצאית\)/);
  let c = R.press(r.st, 'C', NOW);
  assert.equal(c.st.card.products.length, 2);
  r = R.insertCard(R.ejectCard(st).st, card, { [F.PRODUCTS_FILE]: csv });
  c = R.press(r.st, 'OK', NOW);
  assert.equal(c.st.card.products.length, 1);
  assert.equal(c.st.card.products[0].price, 9900);
});

test('הפסקת חשמל: כרטיס נשמר, זיכרון לא — בהכנסה הבאה ממשיכים כרגיל', () => {
  let { st } = fresh();
  const before = st.device;
  const r = keys(st, [`scan:${SHIRT}`, 'CREDIT']);
  const ins = R.insertCard({ ...R.ejectCard(r.st).st, device: before }, r.st.card, {});
  assert.equal(ins.st.cardError, '');
  assert.match(ins.st.msg.text, /הושלמו 1/);
  assert.equal(ins.st.device.op, r.st.device.op);
  assert.ok(ins.out.persist);
});

test('אזהרת מלאי מוצגת אבל המכירה ממשיכה', () => {
  let { st } = fresh();
  const r = keys(st, Array(6).fill(`scan:${SHIRT}`));
  assert.match(r.st.msg.text, /במלאי 5 בלבד/);
  assert.equal(r.st.cart.lines[0].qty, 6);
});

test('כרטיס שנפסל אחרי תשלום — המסך לא ממשיך להציג "שולם · עודף" מהעסקה הקודמת', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CASH', '1', '0', '0', 'OK']);
  assert.ok(r.st.paidInfo);
  const bad = { ...r.st.card, receipts: [{ ...r.st.card.receipts[0], total: 1 }] };
  const ins = R.insertCard(R.ejectCard(r.st).st, bad, {});
  assert.ok(ins.st.cardError);
  assert.equal(ins.st.paidInfo, null);
});
