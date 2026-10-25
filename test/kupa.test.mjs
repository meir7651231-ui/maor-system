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

test('החזרה: מקושרת לקבלה מקורית, סכומים שליליים, המלאי חוזר', () => {
  let st = sell(setup(), shirt);
  const r = sell(st, (c, card) => K.cartAdd(K.cartToggleRefund(c, 1), card, '7290000000011').cart);
  assert.equal(r.receipt.total, -8990);
  assert.equal(r.receipt.type, 'refund');
  assert.equal(r.receipt.refundOf, 1);
  assert.equal(K.findProduct(r.card, '7290000000011').stock, 5);
  const lines = K.receiptLines(r.card, r.receipt);
  assert.ok(lines.some((l) => l.includes('הוחזר במזומן') && l.includes('89.90')));
  assert.ok(lines.some((l) => l.includes("החזרה לקבלה מס' 1")));
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
  for (const l of orig) assert.ok(l.length <= st.card.settings.width, l);
  const z = K.closeDay(st.card, NOW, st.device);
  const lines = K.reportLines(z.card, z.report);
  assert.ok(lines.some((l) => l.includes('GT') && l.includes('89.90')));
  assert.ok(lines[lines.length - 1].includes('סוף דוח'));
  for (const l of lines) assert.ok(l.length <= z.card.settings.width, l);
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

test('רוחב גליל: 80 מ"מ = 48 תווים (ברירת מחדל), 58 מ"מ = 32; ערך אחר נדחה; אף שורה לא חורגת', () => {
  for (const w of [48, 32]) {
    let st = setup();
    st = { ...st, card: K.updateSettings(st.card, { width: w }) };
    assert.equal(st.card.settings.width, w);
    st = sell(st, (c, card) => K.cartDiscount(shirt(c, card), 0, 990).cart, { tendered: 10000 });
    const z = K.closeDay(st.card, NOW, st.device);
    const lines = [...K.receiptLines(z.card, st.receipt), ...K.receiptLines(z.card, st.receipt, { copy: true }), ...K.reportLines(z.card, z.report), ...K.stockLines(z.card, NOW)];
    for (const l of lines) assert.ok(l.length <= w, `${w}: ${l}`);
  }
  assert.equal(K.emptyCard().settings.width, 48);
  assert.equal(K.updateSettings(K.emptyCard(), { width: 40 }).settings.width, 48);
});

// ── תיקונים 25.10 ──
test('הפסקת חשמל אחרי כתיבת הכרטיס ולפני הזיכרון הפנימי — הכרטיס לא נפסל, הזיכרון משלים', () => {
  const st0 = sell(setup(), shirt);
  const st1 = sell(st0, manual(100)); // הכרטיס נכתב…
  const r = K.checkCard(st1.card, st0.device); // …אבל הזיכרון הפנימי נשאר מלפני
  assert.ok(r.card && !r.error);
  assert.equal(r.recovered, 1);
  assert.equal(r.device.op, st1.device.op);
  assert.equal(r.device.head, st1.device.head);
  assert.ok(K.checkCard(st1.card, r.device).card);
});

test('כרטיס "מקדים" שלא ממשיך את הזיכרון (שרשרת אחרת) — עדיין נפסל', () => {
  const a = sell(setup(), shirt);
  const b = sell(a, manual(100));
  const other = sell(sell(setup(), manual(500)), manual(700)); // אותו מפתח, היסטוריה אחרת
  assert.equal(K.checkCard(other.card, a.device).kind, 'tamper');
  assert.ok(b);
});

test('שעון שהוחזר אחורה — אין מכירה, אין דוח, אין סגירה', () => {
  const st = sell(setup(), shirt);
  const past = '2026-10-25T10:00:00';
  assert.match(sell(st, manual(100), { now: past }).error, /שעון הקופה מאחור/);
  assert.match(K.printInterim(st.card, past, st.device).error, /שעון/);
  assert.match(K.closeDay(st.card, past, st.device).error, /שעון/);
  assert.ok(sell(st, manual(100)).receipt); // אותה שעה — מותר
});

test('עיגול מזומן ל-10 אגורות (1–4 למטה, 5–9 למעלה); באשראי אין עיגול; בדוח Z המזומן = בפועל', () => {
  assert.deepEqual([1704, 1707, 1700, 1705].map(K.roundCash), [1700, 1710, 1700, 1710]);
  let st = sell(setup(), manual(1704));
  assert.equal(st.receipt.rounding, -4);
  assert.equal(st.receipt.tendered, 1700);
  assert.ok(K.receiptLines(st.card, st.receipt).some((l) => l.includes('עיגול')));
  st = sell(st, manual(1707), { tendered: 2000 });
  assert.equal(st.receipt.change, 2000 - 1710);
  st = sell(st, manual(1707), { method: 'credit' });
  assert.equal(st.receipt.rounding, 0);
  const z = K.closeDay(st.card, NOW, st.device).report;
  assert.equal(z.cash, 1700 + 1710);
  assert.equal(z.credit, 1707);
  assert.equal(z.rounding, -4 + 3);
  assert.equal(z.total, 1704 + 1707 + 1707);
});

test('אפשר לכבות עיגול מזומן בהגדרות', () => {
  let st = setup();
  st = { ...st, card: { ...st.card, settings: { ...st.card.settings, cashRound: false } } };
  assert.equal(sell(st, manual(1704)).receipt.rounding, 0);
});

test('הנחה באחוזים לשורה, והנחת סל (שקלים / אחוזים) מתחלקת בין השורות', () => {
  const { card } = setup();
  let c = K.cartAdd(K.emptyCart(), card, '7290000000011').cart; // 89.90
  c = K.cartAdd(c, card, '7290000000028').cart; // 120.00
  c = K.cartDiscountPct(c, 1, 10).cart; // 12.00
  assert.equal(c.lines[1].discount, 1200);
  assert.ok(K.cartDiscountPct(c, 0, 150).error);
  let t = K.cartTotals(c, 0.18);
  assert.equal(t.total, 8990 + 10800);
  c = K.cartBasket(c, { pct: 10 }).cart;
  t = K.cartTotals(c, 0.18);
  assert.equal(t.basket, Math.round(19790 * 0.1));
  assert.ok(K.cartBasket(c, { amount: 999999 }).error);
  const st = setup();
  const r = K.checkout(st.card, c, { method: 'credit', now: NOW, device: st.device });
  const paid = r.receipt.lines.reduce((s, l) => s + l.paid, 0);
  assert.equal(paid, r.receipt.total); // סכום "שולם" לשורות = סה"כ הקבלה
  assert.ok(K.receiptLines(r.card, r.receipt).some((l) => l.includes('הנחת סל')));
});

test('החזרה לקבלה: רק מה שנקנה, לא יותר ממה שנשאר, במחיר ששולם בפועל (אחרי הנחות)', () => {
  let st = setup();
  let c = K.cartAdd(K.emptyCart(), st.card, '7290000000011').cart;
  c = K.cartAdd(c, st.card, '7290000000011').cart; // 2 חולצות
  c = K.cartBasket(c, { pct: 10 }).cart; // 179.80 - 17.98
  st = K.checkout(st.card, c, { method: 'credit', now: NOW, device: st.device });
  const no = st.receipt.no;
  const unit = Math.round(st.receipt.lines[0].paid / 2);
  let rc = K.cartToggleRefund(K.emptyCart(), no);
  assert.equal(K.cartAdd(rc, st.card, '7290000000028').error, `המוצר לא נמצא בקבלה ${no}`);
  rc = K.cartAdd(rc, st.card, '7290000000011').cart;
  assert.equal(rc.lines[0].price, unit);
  assert.ok(K.cartDiscount(rc, 0, 100).error); // אין הנחה בהחזרה
  st = K.checkout(st.card, rc, { method: 'credit', now: NOW, device: st.device });
  assert.equal(st.receipt.total, -unit);
  rc = K.cartAdd(K.cartToggleRefund(K.emptyCart(), no), st.card, '7290000000011').cart; // השנייה
  assert.ok(rc.lines.length);
  assert.ok(K.cartAdd(rc, st.card, '7290000000011').error); // שלישית — אין
  assert.ok(K.cartToggleRefund(K.emptyCart(), 999) && K.cartAdd(K.cartToggleRefund(K.emptyCart(), 999), st.card, '7290000000011').error);
  // עקיפה ידנית של הסל — נחסמת בתשלום
  const forged = { ...rc, lines: [{ ...rc.lines[0], qty: 5 }] };
  assert.match(K.checkout(st.card, forged, { method: 'cash', now: NOW, device: st.device }).error, /יותר ממה שנקנה/);
});

test('החזרה של פריט כללי — רק אם היה כזה בקבלה, באותו מחיר', () => {
  let st = sell(setup(), manual(2500));
  const rc = K.cartToggleRefund(K.emptyCart(), st.receipt.no);
  assert.ok(K.cartAddManual(rc, 2500, 'פריט כללי', st.card).cart.lines.length);
  assert.ok(K.cartAddManual(rc, 3000, 'פריט כללי', st.card).error);
});

test('אזהרת מלאי כשמוכרים יותר ממה שיש', () => {
  let { card } = setup();
  card = K.upsertProduct(card, { code: '7290000000035', name: 'אחרון', price: 100, stock: 1 }).card;
  let r = K.cartAdd(K.emptyCart(), card, '7290000000035');
  assert.equal(r.warn, undefined);
  r = K.cartAdd(r.cart, card, '7290000000035');
  assert.match(r.warn, /במלאי 1 בלבד/);
});

test('קוד מנהל: 4–8 ספרות, נשמר רק כטביעה, ריק = בלי קוד', () => {
  const { card } = setup();
  assert.equal(K.checkPin(card, ''), true); // אין קוד
  assert.ok(K.setPin(card, '12').error);
  const c = K.setPin(card, '2468').card;
  assert.ok(!JSON.stringify(c).includes('2468'));
  assert.equal(K.checkPin(c, '2468'), true);
  assert.equal(K.checkPin(c, '1111'), false);
  assert.equal(K.checkPin(K.setPin(c, '').card, '9'), true);
});
