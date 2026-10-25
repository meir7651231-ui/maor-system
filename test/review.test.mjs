// בדיקות שימור — ממצאי הבדיקה העצמאית (25.10.2026). כל בדיקה מתעדת את הבאג שנמצא והוכח.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../engine/kupa.mjs';
import * as R from '../engine/register.mjs';
import * as F from '../engine/files.mjs';
import * as E from '../engine/escpos.mjs';

const NOW = '2026-10-25T14:59:00';
const KEY = 'a1'.repeat(32);
const SHIRT = '7290000000011';
const SKIRT = '7290000000028';

function setup() {
  let card = K.updateSettings(K.emptyCard(), { bizName: 'בוטיק', osekNo: '512345678' });
  card = K.upsertProduct(card, { code: SHIRT, name: 'חולצה', price: 1000, stock: 5 }).card;
  card = K.upsertProduct(card, { code: SKIRT, name: 'חצאית', price: 1001, stock: null }).card;
  const b = K.checkCard(card, K.newDevice('KUPA-0001', KEY));
  return { card: b.card, device: b.device };
}
function sell(st, cart, opts = {}) {
  const r = K.checkout(st.card, cart, { method: 'cash', now: NOW, device: st.device, ...opts });
  if (r.error) throw new Error(r.error);
  return r;
}
const reload = (c) => K.parseCard(K.serializeCard(c)).card;
const man = (amt) => K.cartAddManual(K.emptyCart(), amt).cart;
function sales(n) {
  let st = setup();
  for (let i = 0; i < n; i++) st = sell(st, man(1000));
  return st;
}
function keys(st, seq, now = NOW) {
  let out;
  for (const k of seq) ({ st, out } = k.startsWith('scan:') ? R.scan(st, k.slice(5), now) : R.press(st, k, now));
  return { st, out };
}

// ── 1–3: שום שדה לא-חתום בכרטיס לא קובע ──
test('באג 1: מחיקת הקבלות הראשונות + זיוף נקודת התחלה (base) — נפסל', () => {
  const st = sales(5);
  const c = reload(st.card);
  const r4 = c.receipts[3];
  c.receipts = c.receipts.slice(4);
  c.ops = []; // גם רשומת השיוך
  c.base = { op: r4.n, head: r4.h, receipt: 4, z: 0, gt: 0 };
  assert.equal(K.checkCard(c, st.device).kind, 'tamper');
  // גם בלי לגעת ברשומת השיוך: שינוי base לבד נפסל
  const c2 = reload(st.card);
  c2.base = { ...c2.base, gt: 99999900 };
  assert.match(K.checkCard(c2, st.device).error, /נקודת ההתחלה/);
});

test('באג 2: העברת קבלה מ-receipts ל-ops + הורדת המונה (להנפיק את המספר שוב) — נפסל', () => {
  const st = sales(3);
  const c = reload(st.card);
  c.ops.push(c.receipts.pop());
  c.seq.receipt = 2;
  assert.equal(K.checkCard(c, st.device).kind, 'tamper');
});

test('באג 3: מונה קבלות / Z שנערכו ידנית — נפסל; זיכרון הקופה זוכר את המונים וה-GT', () => {
  const st = sales(2);
  for (const patch of [{ receipt: 50 }, { z: 9 }]) {
    const c = reload(st.card);
    c.seq = { ...c.seq, ...patch };
    assert.equal(K.checkCard(c, st.device).kind, 'tamper', JSON.stringify(patch));
  }
  // זיכרון שלא תואם (למשל GT) — נפסל
  assert.equal(K.checkCard(st.card, { ...st.device, gt: st.device.gt + 1 }).kind, 'tamper');
  assert.ok(K.checkCard(st.card, st.device).card); // ללא שינוי — תקין
});

test('כרטיס ריק בקופה שכבר מכרה (כרטיס חלופי או "ניקו" את הכרטיס) — רק באישור, ונמשך המספור', () => {
  let st = R.initState({ card: setup().card, device: setup().device });
  st = R.insertCard(st, st.card, {}, NOW).st;
  st = keys(st, ['scan:' + SHIRT, 'CREDIT']).st;
  const blank = K.updateSettings(K.emptyCard(), { bizName: 'ב', osekNo: '512345678' });
  const ins = R.insertCard(R.ejectCard(st).st, blank, {}, NOW);
  assert.equal(ins.st.mode, 'confirmBind');
  assert.equal(ins.out.persist, false); // לא נשמר כלום לפני אישור
  assert.ok(R.scan(ins.st, SHIRT, NOW).st.cart.lines.length === 0);
  const no = R.press(ins.st, 'C', NOW);
  assert.match(no.st.cardError, /לא שויך/);
  const yes = R.press(ins.st, 'OK', NOW);
  assert.equal(yes.st.card.seq.receipt, 1);
  assert.equal(yes.st.card.ops[0].op, 'BIND');
});

// ── 4: קובץ פגום ──
test('באג 4: KUPA.JSON שנקטע (הפסקת חשמל) — חוסם, לא נכתב עליו כרטיס ריק', () => {
  const st = sales(3);
  const text = K.serializeCard(st.card);
  const cut = text.slice(0, -40);
  assert.ok(K.pickCardText(cut, null).error);
  // TMP תקין (נכתב במלואו) והקובץ הראשי נקטע ⇒ קוראים את TMP
  assert.equal(K.pickCardText(cut, text).card.seq.receipt, 3);
  // TMP נקטע והראשי ישן-תקין ⇒ הראשי
  assert.equal(K.pickCardText(text, cut).card.seq.receipt, 3);
  // TMP חדש יותר מהראשי ⇒ TMP
  const newer = sell(st, man(500));
  assert.equal(K.pickCardText(text, K.serializeCard(newer.card)).card.seq.receipt, 4);
  assert.ok(K.pickCardText(null, null).empty);
  // בקופה: שגיאה חוסמת ושום דבר לא נשמר
  const r = R.insertCard(R.initState({ card: st.card, device: st.device, inserted: false }), null, {}, NOW, 'הקובץ בכרטיס פגום');
  assert.ok(r.st.cardError);
  assert.equal(r.out.persist, false);
  assert.match(R.scan(r.st, SHIRT, NOW).st.msg.text, /פגום/);
});

// ── 5: החזרות ──
test('באג 5: החזרה = בדיוק מה ששולם על כל יחידה (לא לפי היחידה הראשונה, לא אגורה יותר)', () => {
  // שתי חולצות בשורות שונות: ₪10 ו-₪1 (הנחה)
  let st = setup();
  let c = K.cartAdd(K.emptyCart(), st.card, SHIRT).cart;
  c = K.cartAdd(c, st.card, SKIRT).cart;
  c = K.cartAdd(c, st.card, SHIRT).cart;
  c = K.cartDiscount(c, 2, 900).cart;
  st = sell(st, c, { method: 'credit' });
  let rc = K.cartToggleRefund(K.emptyCart(), st.receipt.no);
  rc = K.cartAdd(rc, st.card, SHIRT).cart;
  rc = K.cartAdd(rc, st.card, SHIRT).cart;
  const r = K.checkout(st.card, rc, { method: 'credit', now: NOW, device: st.device });
  assert.equal(r.receipt.total, -1100);
  // עוד החזרה — אין מה להחזיר
  assert.ok(K.cartAdd(K.cartToggleRefund(K.emptyCart(), st.receipt.no), r.card, SHIRT).error);
  // עיגול: 2 יחידות ששולם עליהן 20.01 ⇒ 10.00 + 10.01
  let st2 = setup();
  let c2 = K.cartAdd(K.cartAdd(K.emptyCart(), st2.card, SKIRT).cart, st2.card, SKIRT).cart;
  c2 = K.cartBasket(c2, { amount: 1 }).cart;
  st2 = sell(st2, c2, { method: 'credit' });
  let one = K.cartAdd(K.cartToggleRefund(K.emptyCart(), st2.receipt.no), st2.card, SKIRT).cart;
  const a = K.checkout(st2.card, one, { method: 'credit', now: NOW, device: st2.device });
  one = K.cartAdd(K.cartToggleRefund(K.emptyCart(), st2.receipt.no), a.card, SKIRT).cart;
  const b = K.checkout(a.card, one, { method: 'credit', now: NOW, device: a.device });
  assert.equal(a.receipt.total + b.receipt.total, -2001);
});

test('החזרה: עגלה ששונתה ידנית (מחיר/שורה לא מהקבלה) — נדחית; מחיקת שורה מתמחרת מחדש', () => {
  let st = setup();
  st = sell(st, K.cartAdd(K.cartAdd(K.emptyCart(), st.card, SKIRT).cart, st.card, SKIRT).cart, { method: 'credit' });
  let rc = K.cartAdd(K.cartToggleRefund(K.emptyCart(), st.receipt.no), st.card, SKIRT).cart;
  const forged = { ...rc, lines: rc.lines.map((l) => ({ ...l, price: 5000 })) };
  const r = K.checkout(st.card, forged, { method: 'credit', now: NOW, device: st.device });
  assert.equal(r.receipt.total, -1001); // המחיר נקבע מהקבלה, לא מהעגלה
  const alien = { ...rc, lines: [...rc.lines, { code: '999', name: 'x', price: 1, qty: 1, discount: 0, origLine: 7 }] };
  assert.ok(K.checkout(st.card, alien, { method: 'credit', now: NOW, device: st.device }).error);
});

test('החזרה במזומן של קבלה ששולמה באשראי — נחסמת', () => {
  let st = setup();
  st = sell(st, K.cartAdd(K.emptyCart(), st.card, SHIRT).cart, { method: 'credit' });
  const rc = K.cartAdd(K.cartToggleRefund(K.emptyCart(), st.receipt.no), st.card, SHIRT).cart;
  assert.match(K.checkout(st.card, rc, { method: 'cash', now: NOW, device: st.device }).error, /באשראי/);
  assert.ok(K.checkout(st.card, rc, { method: 'credit', now: NOW, device: st.device }).receipt);
});

// ── 6: מכירה שלילית ──
test('באג 6: הנחה ואז הקטנת כמות ⇒ שורה שלילית — נחסם; ומכירה שלילית לא יוצאת', () => {
  let { card, device } = setup();
  let st = R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW).st;
  st = keys(st, ['scan:' + SHIRT, '3', 'QTY', '2', '5', 'DISC', '1', 'QTY']).st;
  assert.match(st.msg.text, /ההנחה גדולה/);
  assert.equal(K.cartTotals(st.cart, 0.18).total, 500);
  const neg = { ...K.emptyCart(), lines: [{ code: SHIRT, name: 'x', price: 1000, qty: 1, discount: 2500 }] };
  assert.match(K.checkout(card, neg, { method: 'cash', now: NOW, device }).error, /שלילי/);
});

// ── 7: שעון ──
test('באג 7: שעון שקפץ קדימה — אי אפשר לדלג (C); חייבים להקליד תאריך, וכך לא נתקעים חודשים', () => {
  let { card, device } = setup();
  let st = R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW).st;
  st = keys(st, ['scan:' + SHIRT, 'CREDIT']).st;
  const jump = '2027-12-01T10:00:00';
  let ins = R.insertCard(R.ejectCard(st).st, st.card, {}, jump);
  assert.equal(ins.st.mode, 'setClock');
  assert.equal(ins.st.buf, ''); // לא ממולא מראש — הקלדה במכוון
  let r = keys(ins.st, ['C', 'C', 'MENU', '2'], jump);
  assert.equal(r.st.mode, 'setClock'); // נשאר במסך השעון; לא נסגר יום בתאריך השגוי
  assert.equal(r.st.card.zReports.length, 0);
  r = keys(r.st, ['C', ...'251020261500', 'OK'], jump); // C מנקה את ה-2 שהוקלד
  assert.equal(r.st.mode, 'sale');
  assert.ok(keys(r.st, ['scan:' + SHIRT, 'CREDIT'], jump).st.lastReceipt.at.startsWith('2026-10-25T15:00'));
});

// ── 8–9: מוצרים.csv ──
test('באג 8: הפסקת חשמל אחרי KUPA.JSON ולפני מוצרים.csv — המלאי לא חוזר אחורה', () => {
  let { card, device } = setup();
  let st = R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW).st;
  const before = F.exportCardFiles(st.card)[F.PRODUCTS_FILE];
  const r = keys(st, ['scan:' + SHIRT, 'scan:' + SHIRT, 'scan:' + SHIRT, 'CREDIT']);
  assert.equal(K.findProduct(r.st.card, SHIRT).stock, 2);
  // נשמר רק KUPA.JSON; מוצרים.csv הישן נשאר; גם הזיכרון הפנימי לא נשמר
  const ins = R.insertCard(R.initState({ card: r.st.card, device: st.device, inserted: false }), reload(r.st.card), { [F.PRODUCTS_FILE]: before }, NOW);
  assert.equal(K.findProduct(ins.st.card, SHIRT).stock, 2);
  assert.match(ins.st.msg.text, /הושלמו/);
  assert.equal(ins.out.files[F.PRODUCTS_FILE].includes(',2'), true); // הקובץ נכתב מחדש עם המלאי הנכון
});

test('באג 9: מוצרים.csv בכרטיס חדש (בלי טביעה) — נקלט באישור, לא נמחק', () => {
  const card = K.updateSettings(K.emptyCard(), { bizName: 'ב', osekNo: '512345678' });
  const csv = 'ברקוד,שם,מחיר,מלאי\n7290000000015,חולצה,10.50,5\n';
  const ins = R.insertCard(R.initState({ card, device: K.newDevice('D', KEY), inserted: false }), card, { [F.PRODUCTS_FILE]: csv }, NOW);
  assert.equal(ins.st.mode, 'confirmCsv');
  const ok = R.press(ins.st, 'OK', NOW);
  assert.equal(ok.st.card.products.length, 1);
  assert.ok(ok.out.files[F.PRODUCTS_FILE].includes('7290000000015'));
});

// ── 10: פרטי העסק בזמן ההנפקה ──
test('באג 10: העתק קבלה וקובץ Z אחרי שינוי הגדרות — מציגים את פרטי העסק כפי שהיו בהנפקה', () => {
  let st = setup();
  st = { ...st, card: K.updateSettings(st.card, { vatRate: 0.17 }) };
  st = sell(st, man(1000));
  st = K.closeDay(st.card, NOW, st.device);
  const changed = K.updateSettings(st.card, { bizName: 'עסק אחר', osekNo: '000000018', vatRate: 0.18 });
  const copy = K.receiptLines(changed, changed.receipts[0], { copy: true }).join('\n');
  assert.match(copy, /בוטיק/);
  assert.match(copy, /512345678/);
  assert.match(copy, /מע"מ 17%/);
  assert.doesNotMatch(copy, /עסק אחר/);
  const z = Object.entries(F.exportCardFiles(changed)).find(([k]) => k.includes('סגירת'))[1];
  assert.match(z, /512345678/);
  assert.ok(K.checkCard(changed, st.device).card); // שינוי הגדרות במחשב לא פוסל
});

// ── 11: הדפסה ──
test('באג 11: שם עסק ארוך — גולש לשורה הבאה ולא נחתך מתחילתו; במדפסת חיתוך לפי הסדר הלוגי', () => {
  let st = setup();
  st = { ...st, card: K.updateSettings(st.card, { bizName: 'מרכול השכונה הגדול של משפחת כהן והבנים בעמ', width: 32 }) };
  st = sell(st, man(1000));
  const lines = K.receiptLines(st.card, st.receipt);
  assert.ok(lines.every((l) => [...l].length <= 32));
  assert.match(lines[0], /^\s*מרכול השכונה/);
  assert.match(lines[1], /והבנים בעמ/);
  const doc = E.escposDocument(['מרכול השכונה הגדול של משפחת כהן והבנים בעמ'], { width: 32, cut: false });
  const visual = E.toVisual('מרכול השכונה הגדול של משפחת כהן'.padEnd(32));
  assert.deepEqual(doc.slice(5, 5 + 32), E.encodeCp862(visual)); // אחרי ESC @ + ESC t n
});

// ── קוד מנהל ──
test('קוד מנהל: עובר לזיכרון הקופה בהקלדה הראשונה; מהמחשב אי אפשר לבטל; ניחוש מהכרטיס לא אפשרי', () => {
  let { card, device } = setup();
  card = K.setPin(card, '2468').card;
  let st = R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW).st;
  let r = keys(st, ['MENU', '2', ...'2468', 'OK']);
  assert.equal(r.st.mode, 'confirmZ');
  assert.equal(r.st.card.settings.pinHash, K.PIN_IN_DEVICE);
  assert.ok(r.st.device.pinHash && !JSON.stringify(r.st.card).includes(r.st.device.pinHash));
  // במחשב: ביטול הקוד נחסם
  assert.ok(K.setPin(r.st.card, '').error);
  assert.ok(K.guardManaged(r.st.card, { ...r.st.card, settings: { ...r.st.card.settings, pinHash: '' } }).error);
  // גם אם ערכו את הכרטיס ידנית — הקופה עדיין דורשת קוד
  const hacked = { ...r.st.card, settings: { ...r.st.card.settings, pinHash: '' } };
  assert.equal(K.pinRequired(hacked, r.st.device), true);
});

test('קוד מנהל: 5 ניסיונות שגויים ⇒ נעילה ל-5 דקות (שורד כיבוי); החלפת קוד בתפריט 7', () => {
  let { card, device } = setup();
  card = K.setPin(card, '2468').card;
  let st = R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW).st;
  let r;
  for (let i = 0; i < 5; i++) r = keys(i ? r.st : st, ['MENU', '2', ...'1111', 'OK']);
  assert.match(r.st.msg.text, /נעול עד 15:04/);
  assert.equal(r.out.persistDevice, true);
  r = keys(r.st, ['MENU', '2', ...'2468', 'OK'], '2026-10-25T15:00:00');
  assert.notEqual(r.st.mode, 'confirmZ'); // נעול גם עם הקוד הנכון
  r = keys(r.st, ['MENU', '7', ...'2468', 'OK', ...'97531', 'OK'], '2026-10-25T15:05:00');
  assert.match(r.st.msg.text, /הוחלף/);
  assert.equal(r.st.card.ops.at(-1).op, 'PIN');
  assert.equal(keys(r.st, ['MENU', '2', ...'97531', 'OK'], '2026-10-25T15:06:00').st.mode, 'confirmZ');
});

test('שיוך כרטיס כשהשעון שגוי (קפץ קדימה) — לא נועל: אפשר לכוון לתאריך האמיתי', () => {
  let { card, device } = setup();
  let st = R.insertCard(R.initState({ card, device, inserted: false }), card, {}, NOW).st;
  st = keys(st, ['scan:' + SHIRT, 'CREDIT']).st;
  const jump = '2027-12-01T10:00:00';
  const blank = K.updateSettings(K.emptyCard(), { bizName: 'ב', osekNo: '512345678' });
  let r = keys(R.insertCard(R.ejectCard(st).st, blank, {}, jump).st, ['OK'], jump); // אישור כרטיס חדש
  assert.equal(r.st.mode, 'setClock');
  assert.ok(r.st.device.lastAt < '2027'); // השיוך לא קידם את "הפעולה האחרונה"
  r = keys(r.st, [...'251020261500', 'OK'], jump);
  assert.equal(r.st.mode, 'sale');
  assert.match(r.st.msg.text, /השעון כוון/);
});
