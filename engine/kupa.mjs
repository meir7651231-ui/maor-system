// מנוע הקופה — טהור: בלי DOM, בלי שעון, בלי אחסון.
// כל הסכומים באגורות (מספרים שלמים). הזמן מוזרק (now = ISO).
// "הכרטיס" = אובייקט JSON אחד — זה מה שנשמר בכרטיס הזיכרון ונפתח במחשב.
// "העגלה" = זיכרון העסקה הפתוחה בקופה בלבד (לא נשמרת בכרטיס).

import { mac, canon } from './sign.mjs';

export const CARD_VERSION = 2;
export const DEFAULT_VAT = 0.18;

export function emptyCard() {
  return {
    v: CARD_VERSION,
    settings: {
      bizName: '',
      osekType: 'מורשה', // 'מורשה' | 'פטור'
      osekNo: '',
      address: '',
      phone: '',
      vatRate: DEFAULT_VAT,
      footer: 'תודה ולהתראות!',
      width: 32, // רוחב גליל המדפסת בתווים
    },
    products: [], // {code, name, price, stock|null}
    seq: { receipt: 0, z: 0, internal: 0, op: 0 },
    receipts: [], // כל הקבלות שהופקו, לפי סדר
    zReports: [],
    ops: [], // פעולות שאינן מסמך: דוח ביניים, העתק, ביטול עסקה
    head: '', // חתימת הרשומה האחרונה בשרשרת
    deviceId: null, // הקופה שהכרטיס שייך לה
  };
}

// ── הגדרה ראשונית ──────────────────────────────────────────────
export function isConfigured(card) {
  const s = card.settings;
  return !!(s.bizName.trim() && /^\d{9}$/.test(s.osekNo));
}

export function updateSettings(card, patch) {
  const s = { ...card.settings, ...patch };
  if (patch.osekNo !== undefined) s.osekNo = String(patch.osekNo).replace(/\D/g, '');
  if (s.osekType === 'פטור') s.vatRate = 0;
  return { ...card, settings: s };
}

// מספר עוסק/ח"פ — ספרת ביקורת (אותו אלגוריתם כמו ת"ז)
export function validOsekNo(n) {
  const d = String(n).replace(/\D/g, '');
  if (d.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let x = Number(d[i]) * ((i % 2) + 1);
    if (x > 9) x -= 9;
    sum += x;
  }
  return sum % 10 === 0;
}

// ── מוצרים ────────────────────────────────────────────────────
export function findProduct(card, code) {
  const c = String(code).trim();
  return card.products.find((p) => p.code === c) || null;
}

export function upsertProduct(card, prod) {
  const code = String(prod.code || '').trim();
  if (!code) return { card, error: 'חסר ברקוד' };
  if (!String(prod.name || '').trim()) return { card, error: 'חסר שם מוצר' };
  const price = Math.round(Number(prod.price));
  if (!Number.isFinite(price) || price < 0) return { card, error: 'מחיר לא תקין' };
  const stock = prod.stock === null || prod.stock === undefined || prod.stock === '' ? null : Math.round(Number(prod.stock));
  const p = { code, name: String(prod.name).trim(), price, stock };
  const i = card.products.findIndex((x) => x.code === code);
  const products = card.products.slice();
  if (i >= 0) products[i] = p; else products.push(p);
  return { card: { ...card, products } };
}

export function removeProduct(card, code) {
  return { ...card, products: card.products.filter((p) => p.code !== code) };
}

export function addStock(card, code, qty) {
  return {
    ...card,
    products: card.products.map((p) => (p.code === code ? { ...p, stock: (p.stock ?? 0) + Math.round(qty) } : p)),
  };
}

// ── ברקודים ───────────────────────────────────────────────────
export function ean13CheckDigit(d12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d12[i]) * (i % 2 ? 3 : 1);
  return (10 - (sum % 10)) % 10;
}

export function validEan13(code) {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}

// ברקוד פנימי למוצר בלי ברקוד: קידומת 2 (טווח "שימוש פנימי" של GS1)
export function nextInternalCode(card) {
  const n = card.seq.internal + 1;
  const d12 = '2' + String(n).padStart(11, '0');
  const code = d12 + ean13CheckDigit(d12);
  return { card: { ...card, seq: { ...card.seq, internal: n } }, code };
}

// ── זיכרון הקופה הפנימי + חתימה ────────────────────────────────
// הקופה מחזיקה בזיכרון פנימי (לא בכרטיס): מזהה, מפתח סודי, מונה-פעולות וראש-השרשרת.
// כל רשומה (קבלה / סגירת יום / פעולה) מקבלת מספר-פעולה רץ (n) וחתימה (h) על
// התוכן + החתימה הקודמת. עריכה, מחיקה או החזרת הכרטיס לגרסה ישנה — מתגלות.
export function newDevice(id, keyHex) {
  return { id, key: keyHex, op: 0, head: '', receipt: 0, z: 0 };
}

function sealBody(rec) {
  const { h, ...body } = rec;
  return canon(body);
}

function seal(card, device, rec) {
  const n = card.seq.op + 1;
  const r = { ...rec, n, prev: card.head };
  r.h = mac(device.key, sealBody(r));
  return {
    rec: r,
    card: { ...card, head: r.h, seq: { ...card.seq, op: n } },
    device: { ...device, op: n, head: r.h },
  };
}

export function allRecords(card) {
  return [...card.receipts, ...card.zReports, ...card.ops].sort((a, b) => a.n - b.n);
}

// בדיקת הכרטיס מול הקופה — בכל הכנסת כרטיס ולפני כל מכירה
export function checkCard(card, device) {
  if (!card.deviceId) {
    if (allRecords(card).length) return { error: 'בכרטיס יש רשומות בלי שיוך לקופה', kind: 'foreign' };
    return { card: { ...card, deviceId: device.id }, bound: true };
  }
  if (card.deviceId !== device.id) return { error: 'זה כרטיס של קופה אחרת', kind: 'foreign' };
  const recs = allRecords(card);
  let prev = '';
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.n !== i + 1) return { error: `חסרה פעולה מס' ${i + 1} בכרטיס`, kind: 'tamper' };
    if (r.prev !== prev || mac(device.key, sealBody(r)) !== r.h) return { error: `פעולה מס' ${r.n} בכרטיס שונתה`, kind: 'tamper' };
    prev = r.h;
  }
  if (prev !== card.head || recs.length !== card.seq.op) return { error: 'ראש השרשרת בכרטיס לא תואם', kind: 'tamper' };
  if (card.seq.op < device.op) return { error: 'הכרטיס הוחזר לגרסה ישנה — חסרות בו פעולות', kind: 'rollback' };
  if (card.seq.op > device.op || card.head !== device.head) return { error: 'הכרטיס לא תואם לזיכרון הקופה', kind: 'tamper' };
  return { card };
}

// ── עגלה (העסקה הפתוחה) ───────────────────────────────────────
export function emptyCart() {
  return { lines: [], refund: false };
}

export function cartAdd(cart, card, code) {
  const p = findProduct(card, code);
  if (!p) return { cart, error: 'מוצר לא נמצא' };
  const lines = cart.lines.slice();
  const last = lines[lines.length - 1];
  if (last && last.code === p.code && !last.manual && !last.discount) {
    lines[lines.length - 1] = { ...last, qty: last.qty + 1 };
  } else {
    lines.push({ code: p.code, name: p.name, price: p.price, qty: 1, discount: 0 });
  }
  return { cart: { ...cart, lines } };
}

export function cartAddManual(cart, price, name = 'פריט כללי') {
  const pr = Math.round(price);
  if (!(pr > 0)) return { cart, error: 'מחיר לא תקין' };
  return { cart: { ...cart, lines: [...cart.lines, { code: '', name, price: pr, qty: 1, discount: 0, manual: true }] } };
}

export function cartSetQty(cart, idx, qty) {
  const q = Math.round(qty);
  if (!cart.lines[idx]) return { cart, error: 'אין שורה' };
  if (!(q > 0)) return { cart, error: 'כמות לא תקינה' };
  const lines = cart.lines.map((l, i) => (i === idx ? { ...l, qty: q } : l));
  return { cart: { ...cart, lines } };
}

export function cartVoid(cart, idx) {
  if (!cart.lines[idx]) return { cart, error: 'אין שורה' };
  return { cart: { ...cart, lines: cart.lines.filter((_, i) => i !== idx) } };
}

// הנחה בשקלים על שורה (לא יותר מסכום השורה)
export function cartDiscount(cart, idx, amount) {
  const l = cart.lines[idx];
  if (!l) return { cart, error: 'אין שורה' };
  const a = Math.round(amount);
  if (!(a >= 0) || a > l.price * l.qty) return { cart, error: 'הנחה לא תקינה' };
  const lines = cart.lines.map((x, i) => (i === idx ? { ...x, discount: a } : x));
  return { cart: { ...cart, lines } };
}

export function cartToggleRefund(cart) {
  return { ...cart, refund: !cart.refund };
}

export function lineTotal(l) {
  return l.price * l.qty - (l.discount || 0);
}

// המחירים כוללים מע"מ; המע"מ = החלק הכלול
export function vatPart(total, rate) {
  if (!rate) return 0;
  return Math.round((total * rate) / (1 + rate));
}

export function cartTotals(cart, vatRate) {
  let gross = 0, discount = 0, items = 0;
  for (const l of cart.lines) {
    gross += l.price * l.qty;
    discount += l.discount || 0;
    items += l.qty;
  }
  const total = gross - discount;
  return { gross, discount, total, vat: vatPart(total, vatRate), items };
}

// ── תשלום = הפקת קבלה ─────────────────────────────────────────
// method: 'cash' | 'credit'. באשראי — רק רישום; הסליקה במסוף נפרד.
export function dayOf(iso) {
  return String(iso).slice(0, 10);
}

// סגירת יום חובה: אי אפשר למכור ביום חדש לפני Z ליום הקודם
export function needsClose(card, now) {
  const open = openReceipts(card);
  return open.length > 0 && dayOf(open[0].at) < dayOf(now);
}

export function checkout(card, cart, { method, tendered = 0, now, device }) {
  if (!isConfigured(card)) return { card, device, error: 'הקופה לא הוגדרה' };
  if (!device) return { card, device, error: 'אין זיכרון קופה' };
  if (!cart.lines.length) return { card, device, error: 'אין פריטים' };
  if (method !== 'cash' && method !== 'credit') return { card, device, error: 'אמצעי תשלום לא ידוע' };
  if (needsClose(card, now)) return { card, device, error: 'צריך לסגור את היום הקודם (תפריט 2) לפני מכירה' };
  const t = cartTotals(cart, card.settings.vatRate);
  const sign = cart.refund ? -1 : 1;
  let change = 0;
  if (method === 'cash' && !cart.refund) {
    const tend = Math.round(tendered) || t.total; // בלי סכום = סכום מדויק
    if (tend < t.total) return { card, device, error: 'הסכום ששולם קטן מהסכום לתשלום' };
    change = tend - t.total;
    tendered = tend;
  } else {
    tendered = t.total;
  }
  const no = card.seq.receipt + 1;
  const draft = {
    no,
    at: now,
    type: cart.refund ? 'refund' : 'sale',
    lines: cart.lines.map((l) => ({ ...l })),
    gross: sign * t.gross,
    discount: sign * t.discount,
    total: sign * t.total,
    vat: sign * t.vat,
    items: sign * t.items,
    method,
    tendered: sign * tendered,
    change,
  };
  const products = card.products.map((p) => {
    if (p.stock === null) return p;
    const sold = cart.lines.filter((l) => l.code === p.code).reduce((s, l) => s + l.qty, 0);
    return sold ? { ...p, stock: p.stock - sign * sold } : p;
  });
  const sealed = seal({ ...card, products, seq: { ...card.seq, receipt: no } }, device, draft);
  return {
    card: { ...sealed.card, receipts: [...card.receipts, sealed.rec] },
    device: { ...sealed.device, receipt: no },
    receipt: sealed.rec,
  };
}

// פעולה שאינה מסמך (נרשמת וחתומה): 'X' דוח ביניים · 'COPY' העתק · 'CANCEL' ביטול עסקה
export function logOp(card, device, now, kind, info = {}) {
  const sealed = seal(card, device, { op: kind, at: now, ...info });
  return { card: { ...sealed.card, ops: [...card.ops, sealed.rec] }, device: sealed.device, op: sealed.rec };
}

// ── דוחות ─────────────────────────────────────────────────────
// מסמכים מאז סגירת היום האחרונה
export function openReceipts(card) {
  const lastZ = card.zReports[card.zReports.length - 1];
  const from = lastZ ? lastZ.toNo : 0;
  return card.receipts.filter((r) => r.no > from);
}

function openOps(card) {
  const lastZ = card.zReports[card.zReports.length - 1];
  const fromN = lastZ ? lastZ.n : 0;
  return card.ops.filter((o) => o.n > fromN);
}

export function summarize(receipts) {
  const s = { count: receipts.length, sales: 0, refunds: 0, items: 0, cash: 0, credit: 0, refundTotal: 0, discount: 0, total: 0, vat: 0, fromNo: null, toNo: null };
  for (const r of receipts) {
    if (r.type === 'refund') { s.refunds++; s.refundTotal += r.total; } else s.sales++;
    s.items += r.items;
    s[r.method] += r.total;
    s.discount += r.discount;
    s.total += r.total;
    s.vat += r.vat;
    if (s.fromNo === null) s.fromNo = r.no;
    s.toNo = r.no;
  }
  return s;
}

// סה"כ מצטבר מיום הפתיחה (GT)
export function grandTotal(card) {
  return card.receipts.reduce((s, r) => s + r.total, 0);
}

function nonSaleCount(card) {
  return openOps(card).length;
}

// דוח ביניים (X) — תצוגה בלבד (גם במחשב); לא סוגר את היום
export function interimReport(card, now) {
  return { kind: 'X', at: now, ...summarize(openReceipts(card)), gt: grandTotal(card), nonSale: nonSaleCount(card) };
}

// הדפסת דוח ביניים בקופה — נרשמת כפעולה חתומה
export function printInterim(card, now, device) {
  const r = logOp(card, device, now, 'X');
  return { card: r.card, device: r.device, report: { ...interimReport(r.card, now), opNo: r.op.n } };
}

// סגירת יום (Z) — סוגר, ממספר, חותם ושומר בכרטיס
export function closeDay(card, now, device) {
  if (!device) return { card, device, error: 'אין זיכרון קופה' };
  const rs = openReceipts(card);
  if (!rs.length) return { card, device, error: 'אין מסמכים מאז הסגירה האחרונה' };
  const no = card.seq.z + 1;
  const draft = { kind: 'Z', no, at: now, ...summarize(rs), gt: grandTotal(card), nonSale: nonSaleCount(card) };
  const sealed = seal({ ...card, seq: { ...card.seq, z: no } }, device, draft);
  return {
    card: { ...sealed.card, zReports: [...card.zReports, sealed.rec] },
    device: { ...sealed.device, z: no },
    report: sealed.rec,
  };
}

export function stockReport(card) {
  return card.products
    .filter((p) => p.stock !== null)
    .map((p) => ({ code: p.code, name: p.name, stock: p.stock, low: p.stock <= 2 }))
    .sort((a, b) => a.stock - b.stock);
}

// ── הדפסה (שורות טקסט לגליל) ───────────────────────────────────
export function money(ag) {
  const neg = ag < 0;
  const a = Math.abs(ag);
  return (neg ? '-' : '') + Math.floor(a / 100) + '.' + String(a % 100).padStart(2, '0');
}

function row(left, right, w) {
  const space = Math.max(1, w - left.length - right.length);
  return left + ' '.repeat(space) + right;
}

function center(s, w) {
  const pad = Math.max(0, Math.floor((w - s.length) / 2));
  return ' '.repeat(pad) + s;
}

function stamp(iso) {
  // ISO → DD/MM/YYYY HH:MM (בלי המרת אזור-זמן: המחרוזת היא הזמן המקומי)
  const [d, t = ''] = iso.split('T');
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y} ${t.slice(0, 5)}`;
}

function header(card) {
  const s = card.settings, w = s.width;
  const out = [center(s.bizName, w)];
  if (s.address) out.push(center(s.address, w));
  if (s.phone) out.push(center(s.phone, w));
  out.push(center(`עוסק ${s.osekType} ${s.osekNo}`, w));
  out.push('-'.repeat(w));
  return out;
}

export function receiptLines(card, r, { copy = false } = {}) {
  const w = card.settings.width;
  const out = header(card);
  out.push(center(r.type === 'refund' ? `קבלה (החזרה) מס' ${r.no}` : `קבלה מס' ${r.no}`, w));
  out.push(center(copy ? '*** העתק ***' : '*** מקור ***', w));
  out.push(center(stamp(r.at) + (r.n ? `  פעולה ${r.n}` : ''), w));
  out.push('-'.repeat(w));
  for (const l of r.lines) {
    out.push(l.name.slice(0, w));
    out.push(row(`  ${l.qty} x ${money(l.price)}`, money(l.price * l.qty), w));
    if (l.discount) out.push(row('  הנחה', money(-l.discount), w));
  }
  out.push('-'.repeat(w));
  out.push(row('סה"כ לתשלום', money(r.total), w));
  if (card.settings.vatRate) out.push(row(`מתוכו מע"מ ${Math.round(card.settings.vatRate * 100)}%`, money(r.vat), w));
  else out.push('עוסק פטור - ללא מע"מ');
  if (r.type === 'refund') {
    out.push(row(r.method === 'cash' ? 'הוחזר במזומן' : 'זיכוי באשראי', money(-r.total), w));
  } else if (r.method === 'cash') {
    out.push(row('מזומן', money(r.tendered), w));
    if (r.change) out.push(row('עודף', money(r.change), w));
  } else {
    out.push(row('אשראי', money(r.total), w));
  }
  out.push('-'.repeat(w));
  if (card.settings.footer) out.push(center(card.settings.footer, w));
  return out;
}

export function reportLines(card, rep) {
  const w = card.settings.width;
  const out = header(card);
  out.push(center(rep.kind === 'Z' ? `סגירת יום מס' ${rep.no} (Z)` : 'דוח ביניים (X)', w));
  const opNo = rep.kind === 'Z' ? rep.n : rep.opNo;
  out.push(center(stamp(rep.at) + (opNo ? `  פעולה ${opNo}` : ''), w));
  out.push('-'.repeat(w));
  if (!rep.count) {
    out.push('אין מסמכים');
  } else {
    out.push(row('מסמכים', `${rep.fromNo}-${rep.toNo}`, w));
    out.push(row('עסקאות מכירה', String(rep.sales), w));
    out.push(row('החזרות', String(rep.refunds), w));
    out.push(row('פריטים (נטו)', String(rep.items), w));
    out.push('-'.repeat(w));
    out.push(row('מזומן', money(rep.cash), w));
    out.push(row('אשראי', money(rep.credit), w));
    if (rep.refunds) out.push(row('מתוכם החזרות', money(rep.refundTotal), w));
    if (rep.discount) out.push(row('הנחות שניתנו', money(rep.discount), w));
    out.push(row('סה"כ פדיון', money(rep.total), w));
    if (card.settings.vatRate) out.push(row('מתוכו מע"מ', money(rep.vat), w));
  }
  out.push('-'.repeat(w));
  out.push(row('פעולות שאינן מכירה', String(rep.nonSale ?? 0), w));
  out.push(row('סה"כ מצטבר (GT)', money(rep.gt ?? 0), w));
  out.push('-'.repeat(w));
  if (rep.kind === 'Z') out.push(center('היום נסגר. מחר מתחיל יום חדש.', w));
  out.push(center('*** סוף דוח ***', w));
  return out;
}

export function stockLines(card, now) {
  const w = card.settings.width;
  const out = header(card);
  out.push(center('דוח מלאי', w));
  out.push(center(stamp(now), w));
  out.push('-'.repeat(w));
  const rows = stockReport(card);
  if (!rows.length) out.push('אין מוצרים במעקב מלאי');
  for (const r of rows) out.push(row((r.low ? '! ' : '') + r.name.slice(0, w - 8), String(r.stock), w));
  return out;
}

// ── כרטיס הזיכרון: קריאה/כתיבה ─────────────────────────────────
export function serializeCard(card) {
  return JSON.stringify(card, null, 1);
}

// טעינה סלחנית: שדה חסר ⇒ ברירת מחדל; לא תקין ⇒ שגיאה
export function parseCard(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { return { error: 'הקובץ בכרטיס פגום' }; }
  if (!raw || typeof raw !== 'object' || raw.v !== CARD_VERSION) return { error: 'זה לא כרטיס של הקופה' };
  if (raw.ops !== undefined && !Array.isArray(raw.ops)) return { error: 'הקובץ בכרטיס פגום' };
  const base = emptyCard();
  const card = {
    ...base,
    settings: { ...base.settings, ...(raw.settings || {}) },
    products: Array.isArray(raw.products) ? raw.products : [],
    seq: { ...base.seq, ...(raw.seq || {}) },
    receipts: Array.isArray(raw.receipts) ? raw.receipts : [],
    zReports: Array.isArray(raw.zReports) ? raw.zReports : [],
    ops: Array.isArray(raw.ops) ? raw.ops : [],
    head: typeof raw.head === 'string' ? raw.head : '',
    deviceId: raw.deviceId || null,
  };
  // המונה לעולם לא מאחורי המסמך האחרון (שומר על רציפות)
  const lastNo = card.receipts.reduce((m, r) => Math.max(m, r.no), 0);
  card.seq.receipt = Math.max(card.seq.receipt, lastNo);
  const lastZ = card.zReports.reduce((m, r) => Math.max(m, r.no), 0);
  card.seq.z = Math.max(card.seq.z, lastZ);
  return { card };
}

// בדיקת רציפות: כל המספרים החסרים והכפולים (הוראה 36 נספח ה' (א)(5))
export function checkSequence(card) {
  const seen = new Map();
  for (const r of card.receipts) seen.set(r.no, (seen.get(r.no) || 0) + 1);
  const top = Math.max(card.seq.receipt, ...card.receipts.map((r) => r.no), 0);
  const missing = [], dup = [];
  for (let i = 1; i <= top; i++) {
    const c = seen.get(i) || 0;
    if (!c) missing.push(i);
    if (c > 1) dup.push(i);
  }
  return { ok: !missing.length && !dup.length, missing, dup, top };
}

// ── שמירה מצד הניהול (במחשב) ───────────────────────────────────
// הכרעת-בעלים 25.10: בניהול אין איפוס ואין שחזור — רק מידע והוצאת נתונים.
// הניהול רשאי לשנות הגדרות/מוצרים/מלאי; קבלות, סגירות-יום ומונים — לעולם לא.
export function guardManaged(before, after) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(before.receipts, after.receipts)) return { error: 'אסור לשנות קבלות מהמחשב' };
  if (!same(before.zReports, after.zReports)) return { error: 'אסור לשנות סגירות יום מהמחשב' };
  if (!same(before.ops, after.ops)) return { error: 'אסור לשנות את יומן הפעולות מהמחשב' };
  if (after.head !== before.head || after.deviceId !== before.deviceId) return { error: 'אסור לשנות את חתימת הכרטיס' };
  if (after.seq.receipt !== before.seq.receipt || after.seq.z !== before.seq.z || after.seq.op !== before.seq.op) return { error: 'אסור לשנות את המונים' };
  if (after.seq.internal < before.seq.internal) return { error: 'אסור להחזיר את מונה הברקודים אחורה' };
  return { card: after };
}
