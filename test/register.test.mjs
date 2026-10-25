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

// ── שעון, מגירה, סכום חריג ──
test('שעון לא מכוון (אחרי הפסקת חשמל בלי סוללת שעון) ⇒ מסך כיוון; כיוון נרשם ביומן', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CREDIT']); // פעולה אחרונה: 25.10 14:59
  // החומרה התאפסה ל-1.1.2021
  const raw = '2021-01-01T00:00:10';
  let ins = R.insertCard(R.ejectCard(r.st).st, r.st.card, {}, raw);
  assert.equal(ins.st.mode, 'setClock');
  assert.match(ins.st.msg.text, /השעון לא מכוון/);
  let c = R.press(ins.st, 'C', raw); // מוחק את ההצעה
  for (const d of '251020261500') c = R.press(c.st, d, raw);
  c = R.press(c.st, 'OK', raw);
  assert.equal(c.st.mode, 'sale');
  assert.match(c.st.msg.text, /השעון כוון: 25\/10\/2026 15:00/);
  assert.ok(c.out.persist);
  assert.equal(c.st.card.ops.at(-1).op, 'CLOCK');
  // מכירה אחרי הכיוון — לפי השעה המתוקנת
  let s2 = R.scan(c.st, SHIRT, raw);
  s2 = R.press(s2.st, 'CREDIT', '2021-01-01T00:01:10');
  assert.equal(s2.st.lastReceipt.at, '2026-10-25T15:01:00');
});

test('כיוון לפני הפעולה האחרונה — נחסם', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CREDIT', 'MENU', '6']);
  assert.equal(r.st.mode, 'setClock');
  let c = R.press(r.st, 'C', NOW);
  for (const d of '010120261200') c = R.press(c.st, d, NOW);
  c = R.press(c.st, 'OK', NOW);
  assert.match(c.st.msg.text, /לפני הפעולה האחרונה/);
});

test('קפיצה של יותר מחודש קדימה ⇒ מבקש לאשר את התאריך', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CREDIT']);
  const ins = R.insertCard(R.ejectCard(r.st).st, r.st.card, {}, '2027-03-01T10:00:00');
  assert.equal(ins.st.mode, 'setClock');
  assert.match(ins.st.msg.text, /יותר מחודש/);
  const ok = R.press(ins.st, 'OK', '2027-03-01T10:00:00'); // ההצעה נכונה ⇒ אישור
  assert.equal(ok.st.mode, 'sale');
});

test('מזומן פותח מגירה; "פתיחת מגירה" מהתפריט נרשמת ונספרת כפעולה שאינה מכירה', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CASH', 'OK']);
  assert.equal(r.out.drawer, true);
  r = keys(r.st, [`scan:${SHIRT}`, 'CREDIT']);
  assert.equal(r.out.drawer, false);
  r = keys(r.st, ['MENU', '5']);
  assert.equal(r.out.drawer, true);
  assert.equal(r.st.card.ops.at(-1).op, 'DRAWER');
  r = keys(r.st, ['MENU', '2', 'OK']);
  assert.ok(r.prints[0].some((l) => /פעולות שאינן מכירה\s+1/.test(l)));
});

test('מחיר ידני מעל ₪5,000 או כמות מעל 50 ⇒ אישור (טעות הקלדה)', () => {
  let { st } = fresh();
  let r = keys(st, ['8', '0', '0', '0', '0', 'PRICE']);
  assert.equal(r.st.mode, 'confirmBig');
  r = keys(r.st, ['C']);
  assert.equal(r.st.cart.lines.length, 0);
  r = keys(r.st, ['8', '0', '0', '0', '0', 'PRICE', 'OK']);
  assert.equal(r.st.cart.lines[0].price, 8000000);
  r = keys(r.st, ['1', '0', '0', 'QTY']);
  assert.equal(r.st.mode, 'confirmBig');
  r = keys(r.st, ['OK']);
  assert.equal(r.st.cart.lines[0].qty, 100);
});

test('כרטיס חדש בקופה שמכרה ⇒ הודעה "ממשיך מקבלה N"', () => {
  let { st } = fresh();
  let r = keys(st, [`scan:${SHIRT}`, 'CREDIT', `scan:${SHIRT}`, 'CREDIT']);
  const blank = K.updateSettings(K.emptyCard(), { bizName: 'ב', osekNo: '000000018' });
  const ins = R.insertCard(R.ejectCard(r.st).st, blank, {}, NOW);
  assert.match(ins.st.msg.text, /ממשיך מקבלה 3/);
});
