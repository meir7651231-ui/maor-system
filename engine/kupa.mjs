// מנוע הקופה — טהור: בלי DOM, בלי שעון, בלי אחסון.
// כל הסכומים באגורות (מספרים שלמים). הזמן מוזרק (now = ISO).
// "הכרטיס" = אובייקט JSON אחד — זה מה שנשמר בכרטיס הזיכרון ונפתח במחשב.
// "העגלה" = זיכרון העסקה הפתוחה בקופה בלבד (לא נשמרת בכרטיס).

import { mac, canon, sha256, hex, utf8 } from './sign.mjs';

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
      width: 48, // תווים בשורה: 48 = גליל 80 מ"מ (Epson TM-T20IV) · 32 = גליל 58 מ"מ
      cashRound: true, // עיגול תשלום במזומן ל-10 אגורות (בנק ישראל: 1–4 למטה, 5–9 למעלה)
      pinHash: '', // קוד מנהל (טביעה). ריק = בלי קוד
    },
    products: [], // {code, name, price, stock|null}
    seq: { receipt: 0, z: 0, internal: 0, op: 0 },
    // נקודת ההתחלה של הכרטיס: כרטיס חדש בקופה שכבר מכרה ממשיך את המספור ואת השרשרת שלה
    base: { op: 0, head: '', receipt: 0, z: 0, gt: 0 },
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

export const PAPER_WIDTHS = { 80: 48, 58: 32 };

export function updateSettings(card, patch) {
  const s = { ...card.settings, ...patch };
  if (patch.width !== undefined && !Object.values(PAPER_WIDTHS).includes(Number(patch.width))) s.width = card.settings.width;
  else if (patch.width !== undefined) s.width = Number(patch.width);
  if (patch.osekNo !== undefined) s.osekNo = String(patch.osekNo).replace(/\D/g, '');
  if (s.osekType === 'פטור') s.vatRate = 0;
  return { ...card, settings: s };
}

// קוד מנהל. הקוד הראשוני אפשר לקבוע במחשב (טביעה בכרטיס); בפעם הראשונה שהוא מוקלד בקופה
// הוא עובר לזיכרון הפנימי כטביעה עם מפתח הקופה (לא בכרטיס ⇒ אי אפשר לנחש אותו מהכרטיס במחשב),
// ובכרטיס נשאר רק סימון PIN_IN_DEVICE. מאז — משנים רק בקופה (תפריט 7), ומחשב לא יכול לבטל.
export const PIN_IN_DEVICE = 'device';
export const PIN_MAX_FAILS = 5;
export const PIN_LOCK_MS = 5 * 60 * 1000;
export function pinHashOf(pin) {
  return hex(sha256(utf8('kupa-pin:' + String(pin))));
}
export function devicePinHash(device, pin) {
  return mac(device.key, 'kupa-pin:' + String(pin));
}
export function setPin(card, pin) {
  if (card.settings.pinHash === PIN_IN_DEVICE) return { card, error: 'קוד המנהל נשמר בקופה — משנים אותו רק בקופה (תפריט 7)' };
  const p = String(pin ?? '').trim();
  if (p && !/^\d{4,8}$/.test(p)) return { card, error: 'קוד מנהל: 4–8 ספרות' };
  return { card: { ...card, settings: { ...card.settings, pinHash: p ? pinHashOf(p) : '' } } };
}
export function pinRequired(card, device) {
  return !!(device?.pinHash || (card.settings.pinHash && card.settings.pinHash !== PIN_IN_DEVICE));
}
// בדיקת קוד: { ok, card, device } — בהצלחה הראשונה הקוד עובר לזיכרון הקופה.
// אחרי PIN_MAX_FAILS ניסיונות שגויים — נעילה ל-5 דקות (now = שעת הקופה).
export function checkPin(card, pin, device = null, now = '') {
  if (!pinRequired(card, device)) return { ok: true, card, device };
  if (device?.pinLockUntil && now && now < device.pinLockUntil) return { ok: false, locked: device.pinLockUntil, card, device };
  const ok = device?.pinHash ? devicePinHash(device, pin) === device.pinHash : pinHashOf(pin) === card.settings.pinHash;
  if (!device) return { ok, card, device };
  if (!ok) {
    const fails = (device.pinFails || 0) + 1;
    const lock = fails >= PIN_MAX_FAILS && now ? msToIso(isoToMs(now) + PIN_LOCK_MS) : '';
    return { ok: false, locked: lock || undefined, card, device: { ...device, pinFails: lock ? 0 : fails, pinLockUntil: lock } };
  }
  const dev = { ...device, pinFails: 0, pinLockUntil: '', pinHash: device.pinHash || devicePinHash(device, pin) };
  return { ok: true, card: { ...card, settings: { ...card.settings, pinHash: PIN_IN_DEVICE } }, device: dev };
}
// קוד חדש בקופה (אחרי הקלדת הקוד הקיים)
export function changeDevicePin(card, device, pin) {
  const p = String(pin ?? '').trim();
  if (!/^\d{4,8}$/.test(p)) return { error: 'קוד מנהל: 4–8 ספרות' };
  return { card: { ...card, settings: { ...card.settings, pinHash: PIN_IN_DEVICE } }, device: { ...device, pinHash: devicePinHash(device, p), pinFails: 0, pinLockUntil: '' } };
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
// השוואת ברקודים בלי אפסים מובילים: אקסל מוחק אותם (0012… ⇒ 12…), וסורקים רבים
// שולחים UPC-A ב-12 ספרות במקום EAN-13 עם 0 מוביל — אותו מוצר.
export function codeKey(code) {
  return String(code).trim().replace(/^0+(?=\d)/, '');
}

export function findProduct(card, code) {
  const k = codeKey(code);
  return card.products.find((p) => codeKey(p.code) === k) || null;
}

export function upsertProduct(card, prod) {
  const code = String(prod.code || '').trim();
  if (!code) return { card, error: 'חסר ברקוד' };
  if (!String(prod.name || '').trim()) return { card, error: 'חסר שם מוצר' };
  const price = Math.round(Number(prod.price));
  if (!Number.isFinite(price) || price < 0) return { card, error: 'מחיר לא תקין' };
  const stock = prod.stock === null || prod.stock === undefined || prod.stock === '' ? null : Math.round(Number(prod.stock));
  const prev = card.products.find((x) => codeKey(x.code) === codeKey(code));
  const p = { code: prev ? prev.code : code, name: String(prod.name).trim(), price, stock };
  const i = card.products.findIndex((x) => codeKey(x.code) === codeKey(code));
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
  return { id, key: keyHex, op: 0, head: '', receipt: 0, z: 0, gt: 0, lastAt: '', clockOffsetMs: 0 };
}

// ── שעון הקופה ──
// השעה = שעון החומרה + תיקון שנשמר בזיכרון הפנימי (כיוון מהתפריט או מהמחשב).
// זמנים הם מחרוזות מקומיות 'YYYY-MM-DDTHH:MM:SS' (בלי אזור-זמן).
function isoToMs(iso) {
  const [d, t = '00:00:00'] = String(iso).split('T');
  const [y, m, dd] = d.split('-').map(Number);
  const [hh, mm, ss = 0] = t.split(':').map(Number);
  return Date.UTC(y, m - 1, dd, hh, mm, ss);
}
function msToIso(ms) {
  return new Date(ms).toISOString().slice(0, 19);
}
export function deviceNow(rawIso, device) {
  return device && device.clockOffsetMs ? msToIso(isoToMs(rawIso) + device.clockOffsetMs) : rawIso;
}
// כיוון השעון ליעד; אסור לכוון לפני הפעולה האחרונה (זה היה מאפשר קבלות "בעבר")
export function setClock(device, rawIso, targetIso) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(targetIso) || Number.isNaN(isoToMs(targetIso))) return { device, error: 'תאריך/שעה לא תקינים' };
  const t = targetIso.length === 16 ? targetIso + ':00' : targetIso;
  if (device.lastAt && t < device.lastAt) return { device, error: `אי אפשר לכוון לפני הפעולה האחרונה (${device.lastAt.replace('T', ' ').slice(0, 16)})` };
  return { device: { ...device, clockOffsetMs: isoToMs(t) - isoToMs(rawIso) } };
}
// האם השעה חשודה: לא מכוונת (אחרי הפסקת חשמל בלי סוללת שעון), מאחור, או קפצה קדימה בהרבה
export function clockSuspect(device, nowIso) {
  if (nowIso.slice(0, 4) < '2025') return 'השעון לא מכוון';
  if (device.lastAt && nowIso < device.lastAt) return 'שעון הקופה מאחור';
  if (device.lastAt && isoToMs(nowIso) - isoToMs(device.lastAt) > 31 * 864e5) return `עבר יותר מחודש מאז הפעולה האחרונה (${device.lastAt.slice(0, 10)}) — האם התאריך נכון?`;
  return null;
}

// שעון: אסור שפעולה תהיה מוקדמת מהפעולה האחרונה (שעון שהוחזר אחורה)
export function clockError(device, now) {
  if (device && device.lastAt && String(now) < device.lastAt) {
    return `שעון הקופה מאחור (${now.replace('T', ' ').slice(0, 16)}) — הפעולה האחרונה הייתה ב-${device.lastAt.replace('T', ' ').slice(0, 16)}. תקנו את השעון`;
  }
  return null;
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
    device: { ...device, op: n, head: r.h, lastAt: rec.at > (device.lastAt || '') ? rec.at : device.lastAt },
  };
}

export function allRecords(card) {
  return [...card.receipts, ...card.zReports, ...card.ops].sort((a, b) => a.n - b.n);
}

// בדיקת הכרטיס מול הקופה — בכל הכנסת כרטיס ולפני כל מכירה.
// שום דבר בכרטיס לא נסמך על שדה לא-חתום: נקודת ההתחלה (base) נחתמת ברשומת BIND,
// המונים נגזרים מהרשומות החתומות, וכל רשומה חייבת להיות במערך שלה ובמספור רציף.
// now — שעת השיוך (לרשומת BIND של כרטיס חדש)
export function checkCard(card, device, now = '') {
  if (!card.deviceId) {
    if (allRecords(card).length) return { error: 'בכרטיס יש רשומות בלי שיוך לקופה', kind: 'foreign' };
    // כרטיס ריק: אם הקופה כבר מכרה — הכרטיס ממשיך ממנה (מספור קבלות, Z, שרשרת ו-GT), לא מתחיל מ-1.
    // נקודת ההתחלה נחתמת כרשומה הראשונה בכרטיס ⇒ אי אפשר לקצץ קבלות מראש הכרטיס ולזייף נקודת התחלה.
    const base = { op: device.op, head: device.head, receipt: device.receipt || 0, z: device.z || 0, gt: device.gt || 0 };
    const start = { ...card, deviceId: device.id, base, head: device.head, seq: { ...card.seq, op: base.op, receipt: base.receipt, z: base.z } };
    // השעה נשמרת כ-when ולא כ-at: שיוך לא מקדם את "הפעולה האחרונה" — שעון שגוי ברגע השיוך לא ינעל את הקופה
    const sealed = seal(start, device, { op: 'BIND', when: now, base });
    return {
      card: { ...sealed.card, ops: [sealed.rec] },
      device: sealed.device,
      bound: true,
      continued: device.op > 0,
    };
  }
  if (card.deviceId !== device.id) return { error: 'זה כרטיס של קופה אחרת', kind: 'foreign' };
  const base = card.base || { op: 0, head: '', receipt: 0, z: 0, gt: 0 };
  const recs = allRecords(card);
  let prev = base.head;
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.n !== base.op + i + 1) return { error: `חסרה פעולה מס' ${base.op + i + 1} בכרטיס`, kind: 'tamper' };
    if (r.prev !== prev || mac(device.key, sealBody(r)) !== r.h) return { error: `פעולה מס' ${r.n} בכרטיס שונתה`, kind: 'tamper' };
    prev = r.h;
  }
  if (prev !== card.head || base.op + recs.length !== card.seq.op) return { error: 'ראש השרשרת בכרטיס לא תואם', kind: 'tamper' };
  // נקודת ההתחלה = מה שנחתם ברשומה הראשונה
  const first = recs[0];
  if (!first || first.op !== 'BIND' || canon(first.base) !== canon(base)) return { error: 'נקודת ההתחלה של הכרטיס שונתה', kind: 'tamper' };
  // כל רשומה במקומה, במספור רציף; המונים נגזרים מהרשומות
  if (card.receipts.some((r, i) => (r.type !== 'sale' && r.type !== 'refund') || r.op !== undefined || r.kind !== undefined || r.no !== base.receipt + i + 1)) return { error: 'רשימת הקבלות בכרטיס שונתה', kind: 'tamper' };
  if (card.zReports.some((z, i) => z.kind !== 'Z' || z.type !== undefined || z.op !== undefined || z.no !== base.z + i + 1)) return { error: 'רשימת סגירות היום בכרטיס שונתה', kind: 'tamper' };
  if (card.ops.some((o) => typeof o.op !== 'string' || o.type !== undefined || o.kind !== undefined)) return { error: 'יומן הפעולות בכרטיס שונה', kind: 'tamper' };
  if (card.seq.receipt !== base.receipt + card.receipts.length || card.seq.z !== base.z + card.zReports.length) return { error: 'המונים בכרטיס שונו', kind: 'tamper' };
  if (card.seq.op < device.op) return { error: 'הכרטיס הוחזר לגרסה ישנה — חסרות בו פעולות', kind: 'rollback' };
  if (card.seq.op > device.op) {
    // הפסקת חשמל בין כתיבת הכרטיס לכתיבת הזיכרון הפנימי: הכרטיס מקדים.
    // כל הרשומות חתומות במפתח של הקופה הזו (נבדק למעלה), ונקודת הזיכרון האחרונה
    // נמצאת בשרשרת ⇒ אלה פעולות של הקופה עצמה. משלימים את הזיכרון מהרשומות החתומות.
    if (device.op < base.op) return { error: 'הכרטיס לא תואם לזיכרון הקופה', kind: 'tamper' };
    const anchor = device.op === base.op ? base.head : recs[device.op - base.op - 1].h;
    if (anchor !== device.head) return { error: 'הכרטיס לא תואם לזיכרון הקופה', kind: 'tamper' };
    const last = recs[recs.length - 1];
    return {
      card,
      device: { ...device, op: card.seq.op, head: card.head, receipt: card.seq.receipt, z: card.seq.z, gt: grandTotal(card), lastAt: last.at > (device.lastAt || '') ? last.at : device.lastAt },
      recovered: card.seq.op - device.op,
    };
  }
  if (card.head !== device.head) return { error: 'הכרטיס לא תואם לזיכרון הקופה', kind: 'tamper' };
  // הזיכרון הפנימי זוכר את המונים ואת ה-GT — כרטיס שלא תואם להם נפסל
  if (card.seq.receipt !== (device.receipt || 0) || card.seq.z !== (device.z || 0) || grandTotal(card) !== (device.gt || 0)) return { error: 'המונים בכרטיס לא תואמים לזיכרון הקופה', kind: 'tamper' };
  return { card };
}

// ── עגלה (העסקה הפתוחה) ───────────────────────────────────────
export function emptyCart() {
  return { lines: [], refund: false, refundOf: null, basket: null };
}

function qtyInCart(cart, code) {
  return cart.lines.filter((l) => l.code && codeKey(l.code) === codeKey(code)).reduce((s, l) => s + l.qty, 0);
}

export function cartAdd(cart, card, code) {
  if (cart.refund) return cartAddRefund(cart, card, code);
  const p = findProduct(card, code);
  if (!p) return { cart, error: 'מוצר לא נמצא' };
  const lines = cart.lines.slice();
  const last = lines[lines.length - 1];
  if (last && last.code === p.code && !last.manual && !last.discount) {
    lines[lines.length - 1] = { ...last, qty: last.qty + 1 };
  } else {
    lines.push({ code: p.code, name: p.name, price: p.price, qty: 1, discount: 0 });
  }
  const next = { ...cart, lines };
  const inCart = qtyInCart(next, p.code);
  const warn = p.stock !== null && inCart > p.stock ? `אזהרה: במלאי ${Math.max(p.stock, 0)} בלבד` : undefined;
  return { cart: next, warn };
}

export function cartAddManual(cart, price, name = 'פריט כללי', card = null) {
  const pr = Math.round(price);
  if (!(pr > 0)) return { cart, error: 'מחיר לא תקין' };
  if (cart.refund) {
    // בהחזרה: פריט כללי רק אם היה כזה בקבלה המקורית, במחיר ששולם עליו (נטו)
    const left = refundable(card, cart.refundOf);
    if (left.error) return { cart, error: left.error };
    const pick = nextRefundUnit(left, cart, (u) => u.manual, pr);
    if (!pick) return { cart, error: `אין בקבלה ${cart.refundOf} פריט כללי ב-₪${money(pr)} שאפשר להחזיר` };
    return { cart: addRefundLine(cart, pick) };
  }
  return { cart: { ...cart, lines: [...cart.lines, { code: '', name, price: pr, qty: 1, discount: 0, manual: true }] } };
}

export function cartSetQty(cart, idx, qty) {
  const q = Math.round(qty);
  if (!cart.lines[idx]) return { cart, error: 'אין שורה' };
  if (!(q > 0)) return { cart, error: 'כמות לא תקינה' };
  const l = cart.lines[idx];
  if ((l.discount || 0) > l.price * q) return { cart, error: 'ההנחה גדולה מסכום השורה — שנו את ההנחה או מחקו את השורה' };
  const lines = cart.lines.map((x, i) => (i === idx ? { ...x, qty: q } : x));
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
  if (cart.refund) return { cart, error: 'אין הנחה בהחזרה — המחיר הוא מה ששולם' };
  const a = Math.round(amount);
  if (!(a >= 0) || a > l.price * l.qty) return { cart, error: 'הנחה לא תקינה' };
  const lines = cart.lines.map((x, i) => (i === idx ? { ...x, discount: a } : x));
  return { cart: { ...cart, lines } };
}

// הנחה באחוזים על שורה
export function cartDiscountPct(cart, idx, pct) {
  const l = cart.lines[idx];
  if (!l) return { cart, error: 'אין שורה' };
  if (!(pct > 0 && pct <= 100)) return { cart, error: 'אחוז הנחה: 1–100' };
  return cartDiscount(cart, idx, Math.round((l.price * l.qty * pct) / 100));
}

// הנחה על כל הסל: { amount } בשקלים או { pct } באחוזים; 0 = ביטול
export function cartBasket(cart, { amount, pct } = {}) {
  if (cart.refund) return { cart, error: 'אין הנחה בהחזרה — המחיר הוא מה ששולם' };
  if (!cart.lines.length) return { cart, error: 'אין פריטים' };
  if (pct !== undefined) {
    if (pct === 0) return { cart: { ...cart, basket: null } };
    if (!(pct > 0 && pct <= 100)) return { cart, error: 'אחוז הנחה: 1–100' };
    return { cart: { ...cart, basket: { pct } } };
  }
  const a = Math.round(amount);
  if (a === 0) return { cart: { ...cart, basket: null } };
  const base = cart.lines.reduce((s, l) => s + lineTotal(l), 0);
  if (!(a > 0) || a > base) return { cart, error: 'הנחת סל לא תקינה' };
  return { cart: { ...cart, basket: { amount: a } } };
}

// מצב החזרה — חייב קבלה מקורית (מספר). בלי מספר = יציאה ממצב החזרה
export function cartToggleRefund(cart, refundOf) {
  if (cart.refund || refundOf === undefined) return emptyCart();
  return { ...emptyCart(), refund: true, refundOf };
}

export function lineTotal(l) {
  return l.price * l.qty - (l.discount || 0);
}

function basketAmountOf(cart, base) {
  if (!cart.basket) return 0;
  if (cart.basket.pct) return Math.round((base * cart.basket.pct) / 100);
  return Math.min(cart.basket.amount, base);
}

// עיגול תשלום במזומן ל-10 אגורות: 1–4 למטה, 5–9 למעלה
export function roundCash(a) {
  return Math.floor((a + 5) / 10) * 10;
}

// מחיר יחידה k (מ-0) בשורה ששולם עליה paid ב-qty יחידות: כולן מעוגלות למטה והאחרונה משלימה ⇒
// החזרת כל היחידות = בדיוק מה ששולם, לא אגורה יותר ולא פחות
export function unitPrice(paid, qty, k) {
  const f = Math.floor(paid / qty);
  return k === qty - 1 ? paid - f * (qty - 1) : f;
}

// מה עוד אפשר להחזיר מקבלה — לפי שורה בקבלה המקורית (origLine), במחיר ששולם בפועל על כל יחידה
export function refundable(card, no) {
  const orig = card && card.receipts.find((r) => r.no === Number(no));
  if (!orig) return { error: `קבלה ${no} לא נמצאה` };
  if (orig.type !== 'sale') return { error: `קבלה ${no} היא החזרה` };
  const units = orig.lines.map((l, i) => ({
    i, key: l.manual ? null : codeKey(l.code), code: l.code, name: l.name, manual: !!l.manual,
    qty: l.qty, paid: l.paid ?? lineTotal(l), used: 0,
  }));
  for (const r of card.receipts) {
    if (r.type !== 'refund' || r.refundOf !== orig.no) continue;
    for (const l of r.lines) if (units[l.origLine]) units[l.origLine].used += l.qty;
  }
  for (const u of units) u.left = Math.max(0, u.qty - u.used);
  return { orig, units };
}

function inRefundCart(cart, i) {
  return cart.lines.filter((l) => l.origLine === i).reduce((s, l) => s + l.qty, 0);
}
// היחידה הבאה להחזרה מתוך השורות שמתאימות; price (אופציונלי) = רק אם זה מחיר היחידה הבאה
function nextRefundUnit(left, cart, match, price) {
  for (const u of left.units) {
    if (!match(u)) continue;
    const k = u.used + inRefundCart(cart, u.i);
    if (k >= u.qty) continue;
    const p = unitPrice(u.paid, u.qty, k);
    if (price === undefined || p === price) return { u, price: p };
  }
  return null;
}
function addRefundLine(cart, { u, price }) {
  const lines = cart.lines.slice();
  const j = lines.findIndex((l) => l.origLine === u.i && l.price === price);
  if (j >= 0) lines[j] = { ...lines[j], qty: lines[j].qty + 1 };
  else lines.push({ code: u.code, name: u.name, price, qty: 1, discount: 0, origLine: u.i, ...(u.manual ? { manual: true } : {}) });
  return { ...cart, lines };
}

function cartAddRefund(cart, card, code) {
  const left = refundable(card, cart.refundOf);
  if (left.error) return { cart, error: left.error };
  const k = codeKey(code);
  if (!left.units.some((u) => u.key === k)) return { cart, error: `המוצר לא נמצא בקבלה ${cart.refundOf}` };
  const pick = nextRefundUnit(left, cart, (u) => u.key === k);
  if (!pick) return { cart, error: `כל היחידות מקבלה ${cart.refundOf} כבר הוחזרו` };
  return { cart: addRefundLine(cart, pick) };
}

// תמחור מחדש של עגלת החזרה לפי כמות היחידות מכל שורה מקורית (אחרי מחיקת שורה, ובתשלום).
// מחזיר שגיאה אם יש בעגלה יותר ממה שנשאר להחזיר או שורה שלא מהקבלה.
export function repriceRefund(cart, card) {
  const left = refundable(card, cart.refundOf);
  if (left.error) return { cart, error: left.error };
  const order = [];
  const count = new Map();
  for (const l of cart.lines) {
    const u = left.units[l.origLine];
    if (!u || !!l.manual !== u.manual || (!u.manual && codeKey(l.code) !== u.key)) return { cart, error: `אי אפשר להחזיר פריט שלא נקנה בקבלה ${cart.refundOf}` };
    if (!count.has(u.i)) order.push(u.i);
    count.set(u.i, (count.get(u.i) || 0) + l.qty);
  }
  const lines = [];
  for (const i of order) {
    const u = left.units[i], n = count.get(i);
    if (n > u.left) return { cart, error: `אי אפשר להחזיר יותר ממה שנקנה בקבלה ${cart.refundOf}` };
    for (let k = u.used; k < u.used + n; k++) {
      const price = unitPrice(u.paid, u.qty, k);
      const last = lines[lines.length - 1];
      if (last && last.origLine === i && last.price === price) last.qty++;
      else lines.push({ code: u.code, name: u.name, price, qty: 1, discount: 0, origLine: i, ...(u.manual ? { manual: true } : {}) });
    }
  }
  return { cart: { ...cart, lines }, orig: left.orig };
}

// המחירים כוללים מע"מ; המע"מ = החלק הכלול
export function vatPart(total, rate) {
  if (!rate) return 0;
  return Math.round((total * rate) / (1 + rate));
}

export function cartTotals(cart, vatRate) {
  let gross = 0, lineDiscount = 0, items = 0;
  for (const l of cart.lines) {
    gross += l.price * l.qty;
    lineDiscount += l.discount || 0;
    items += l.qty;
  }
  const basket = basketAmountOf(cart, gross - lineDiscount);
  const discount = lineDiscount + basket;
  const total = gross - discount;
  return { gross, discount, basket, total, vat: vatPart(total, vatRate), items };
}

// כמה משלמים בפועל באמצעי התשלום (במזומן — אחרי עיגול)
export function payableOf(card, cart, method) {
  const t = cartTotals(cart, card.settings.vatRate).total;
  return method === 'cash' && card.settings.cashRound !== false ? roundCash(t) : t;
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

// פרטי העסק כפי שהיו ברגע הפקת המסמך — נשמרים (וחתומים) בכל קבלה וסגירת יום,
// כך שהעתק או קובץ דוח ישן מציגים את מה שהיה אז, גם אם ההגדרות השתנו מאז
export function bizOf(card) {
  const s = card.settings;
  return { name: s.bizName, osekType: s.osekType, osekNo: s.osekNo, vatRate: s.vatRate, address: s.address, phone: s.phone };
}

export function checkout(card, cart, { method, tendered = 0, now, device }) {
  if (!isConfigured(card)) return { card, device, error: 'הקופה לא הוגדרה' };
  if (!device) return { card, device, error: 'אין זיכרון קופה' };
  if (!cart.lines.length) return { card, device, error: 'אין פריטים' };
  if (method !== 'cash' && method !== 'credit') return { card, device, error: 'אמצעי תשלום לא ידוע' };
  if (needsClose(card, now)) return { card, device, error: 'צריך לסגור את היום הקודם (תפריט 2) לפני מכירה' };
  const clk = clockError(device, now);
  if (clk) return { card, device, error: clk };
  if (cart.refund) {
    // החזרה: חייבת קבלה מקורית, לא יותר ממה שנשאר להחזיר ממנה, ובדיוק במחיר ששולם על כל יחידה
    const rp = repriceRefund(cart, card);
    if (rp.error) return { card, device, error: rp.error };
    if (rp.orig.method === 'credit' && method === 'cash') return { card, device, error: `קבלה ${cart.refundOf} שולמה באשראי — מחזירים באשראי` };
    cart = rp.cart;
  } else if (cart.lines.some((l) => lineTotal(l) < 0) || cartTotals(cart, card.settings.vatRate).total < 0) {
    return { card, device, error: 'סכום שלילי במכירה — בדקו את ההנחות' };
  }
  const t = cartTotals(cart, card.settings.vatRate);
  const sign = cart.refund ? -1 : 1;
  const payable = payableOf(card, cart, method);
  const rounding = payable - t.total;
  let change = 0;
  if (method === 'cash' && !cart.refund) {
    const tend = Math.round(tendered) || payable; // בלי סכום = סכום מדויק
    if (tend < payable) return { card, device, error: `חסרים ₪${money(payable - tend)}` };
    change = tend - payable;
    tendered = tend;
  } else {
    tendered = payable;
  }
  // חלוקת הנחת הסל בין השורות ⇒ "שולם" לכל שורה (בסיס להחזרה עתידית)
  const base = t.total + t.basket;
  let left = t.basket;
  const lines = cart.lines.map((l, i) => {
    const net = lineTotal(l);
    const share = i === cart.lines.length - 1 ? left : Math.round((t.basket * net) / (base || 1));
    left -= share;
    return { ...l, paid: net - share };
  });
  const no = card.seq.receipt + 1;
  const draft = {
    no,
    at: now,
    type: cart.refund ? 'refund' : 'sale',
    ...(cart.refund ? { refundOf: cart.refundOf } : {}),
    lines,
    gross: sign * t.gross,
    discount: sign * t.discount,
    basket: sign * t.basket,
    total: sign * t.total,
    vat: sign * t.vat,
    items: sign * t.items,
    method,
    rounding: sign * rounding,
    tendered: sign * tendered,
    change,
    biz: bizOf(card),
  };
  const products = card.products.map((p) => {
    if (p.stock === null) return p;
    const sold = cart.lines.filter((l) => l.code && codeKey(l.code) === codeKey(p.code)).reduce((s, l) => s + l.qty, 0);
    return sold ? { ...p, stock: p.stock - sign * sold } : p;
  });
  const sealed = seal({ ...card, products, seq: { ...card.seq, receipt: no } }, device, draft);
  return {
    card: { ...sealed.card, receipts: [...card.receipts, sealed.rec] },
    device: { ...sealed.device, receipt: no, gt: (device.gt || 0) + draft.total },
    receipt: sealed.rec,
  };
}

// פעולה שאינה מסמך (נרשמת וחתומה): 'X' דוח ביניים · 'COPY' העתק · 'CANCEL' ביטול עסקה
export function logOp(card, device, now, kind, info = {}) {
  const clk = clockError(device, now);
  if (clk) return { card, device, error: clk };
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
  const fromN = lastZ ? lastZ.n : (card.base?.op || 0);
  return card.ops.filter((o) => o.n > fromN);
}

export function summarize(receipts) {
  const s = { count: receipts.length, sales: 0, refunds: 0, items: 0, cash: 0, credit: 0, refundTotal: 0, discount: 0, rounding: 0, total: 0, vat: 0, fromNo: null, toNo: null };
  for (const r of receipts) {
    if (r.type === 'refund') { s.refunds++; s.refundTotal += r.total; } else s.sales++;
    s.items += r.items;
    s[r.method] += r.total + (r.rounding || 0); // מזומן = מה שנכנס/יצא בפועל
    s.rounding += r.rounding || 0;
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
  return (card.base?.gt || 0) + card.receipts.reduce((s, r) => s + r.total, 0);
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
  if (r.error) return r;
  return { card: r.card, device: r.device, report: { ...interimReport(r.card, now), opNo: r.op.n, version: device.version } };
}

// סגירת יום (Z) — סוגר, ממספר, חותם ושומר בכרטיס
export function closeDay(card, now, device) {
  if (!device) return { card, device, error: 'אין זיכרון קופה' };
  const rs = openReceipts(card);
  if (!rs.length) return { card, device, error: 'אין מסמכים מאז הסגירה האחרונה' };
  const clk = clockError(device, now);
  if (clk) return { card, device, error: clk };
  const no = card.seq.z + 1;
  const draft = { kind: 'Z', no, at: now, ...summarize(rs), gt: grandTotal(card), nonSale: nonSaleCount(card), ...(device.version ? { version: device.version } : {}), biz: bizOf(card) };
  const sealed = seal({ ...card, seq: { ...card.seq, z: no } }, device, draft);
  return {
    card: { ...sealed.card, zReports: [...card.zReports, sealed.rec] },
    device: { ...sealed.device, z: no },
    report: sealed.rec,
  };
}

// סיכום חודשי (לרו"ח / דיווח מע"מ): לכל חודש — מכירות, החזרות, מזומן, אשראי, עיגולים, הנחות, סה"כ, מע"מ
export function monthlySummary(card) {
  const by = new Map();
  for (const r of card.receipts) {
    const m = r.at.slice(0, 7);
    if (!by.has(m)) by.set(m, []);
    by.get(m).push(r);
  }
  return [...by.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, rs]) => ({ month, ...summarize(rs) }));
}

// גודל הכרטיס (בתים) ואזהרה כשהוא מתמלא — עד שייבנה ארכיון שנתי במכשיר
export const CARD_WARN_BYTES = 20 * 1024 * 1024;
export function cardSize(card) {
  return new TextEncoder().encode(serializeCard(card)).length;
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

// שורה עם תווית ומספר: תווית ארוכה מתקצרת (בסדר הלוגי) — הסכום לעולם לא נחתך
function row(left, right, w) {
  const l = left.length + right.length + 1 > w ? left.slice(0, Math.max(0, w - right.length - 1)) : left;
  return l + ' '.repeat(Math.max(1, w - l.length - right.length)) + right;
}

// גלישה לפי מילים בסדר הלוגי (שם עסק/כתובת ארוכים לא נחתכים מהתחלתם בדפוס)
function wrap(s, w) {
  const out = [];
  let cur = '';
  for (const word of String(s).split(/\s+/).filter(Boolean)) {
    for (let piece = word; piece; piece = piece.slice(w)) {
      const part = piece.slice(0, w);
      if (!cur) cur = part;
      else if (cur.length + 1 + part.length <= w) cur += ' ' + part;
      else { out.push(cur); cur = part; }
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

function center(s, w) {
  const pad = Math.max(0, Math.floor((w - s.length) / 2));
  return ' '.repeat(pad) + s;
}
function centered(s, w) {
  return wrap(s, w).map((x) => center(x, w));
}

function stamp(iso) {
  // ISO → DD/MM/YYYY HH:MM (בלי המרת אזור-זמן: המחרוזת היא הזמן המקומי)
  const [d, t = ''] = iso.split('T');
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y} ${t.slice(0, 5)}`;
}

function header(card, biz = bizOf(card)) {
  const w = card.settings.width;
  const out = [...centered(biz.name, w)];
  if (biz.address) out.push(...centered(biz.address, w));
  if (biz.phone) out.push(...centered(biz.phone, w));
  out.push(center(`עוסק ${biz.osekType} ${biz.osekNo}`, w));
  out.push('-'.repeat(w));
  return out;
}

export function receiptLines(card, r, { copy = false } = {}) {
  const w = card.settings.width;
  const biz = r.biz || bizOf(card);
  const out = header(card, biz);
  out.push(center(r.type === 'refund' ? `קבלה (החזרה) מס' ${r.no}` : `קבלה מס' ${r.no}`, w));
  out.push(center(copy ? '*** העתק ***' : '*** מקור ***', w));
  out.push(center(stamp(r.at) + (r.n ? `  פעולה ${r.n}` : ''), w));
  if (r.refundOf) out.push(center(`החזרה לקבלה מס' ${r.refundOf}`, w));
  out.push('-'.repeat(w));
  for (const l of r.lines) {
    out.push(l.name.slice(0, w));
    out.push(row(`  ${l.qty} x ${money(l.price)}`, money(l.price * l.qty), w));
    if (l.discount) out.push(row('  הנחה', money(-l.discount), w));
  }
  out.push('-'.repeat(w));
  if (r.basket) out.push(row('הנחת סל', money(-Math.abs(r.basket)), w));
  out.push(row(r.type === 'refund' ? 'סה"כ להחזר' : 'סה"כ לתשלום', money(Math.abs(r.total)), w));
  if (biz.vatRate) out.push(row(`מתוכו מע"מ ${Math.round(biz.vatRate * 100)}%`, money(Math.abs(r.vat)), w));
  else out.push('עוסק פטור - ללא מע"מ');
  if (r.rounding) out.push(row('עיגול מזומן', money(Math.sign(r.total) * r.rounding), w));
  if (r.type === 'refund') {
    out.push(row(r.method === 'cash' ? 'הוחזר במזומן' : 'זיכוי באשראי', money(-r.total - (r.rounding || 0)), w));
  } else if (r.method === 'cash') {
    out.push(row('התקבל במזומן', money(r.tendered), w));
    out.push(row('עודף', money(r.change), w));
  } else {
    out.push(row('אשראי', money(r.total), w));
  }
  out.push('-'.repeat(w));
  if (card.settings.footer) out.push(center(card.settings.footer, w));
  return out;
}

export function reportLines(card, rep) {
  const w = card.settings.width;
  const biz = rep.biz || bizOf(card);
  const out = header(card, biz);
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
    if (rep.rounding) out.push(row('עיגולי מזומן', money(rep.rounding), w));
    out.push(row('סה"כ פדיון', money(rep.total), w));
    if (biz.vatRate) out.push(row('מתוכו מע"מ', money(rep.vat), w));
  }
  out.push('-'.repeat(w));
  out.push(row('פעולות שאינן מכירה', String(rep.nonSale ?? 0), w));
  out.push(row('סה"כ מצטבר (GT)', money(rep.gt ?? 0), w));
  if (rep.version) out.push(row('גרסת תוכנה', rep.version, w));
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
    base: { ...base.base, ...(raw.base || {}) },
  };
  if (typeof raw.productsHash === 'string') card.productsHash = raw.productsHash; // טביעת מוצרים.csv שהקופה כתבה
  if (typeof raw.productsHashPrev === 'string') card.productsHashPrev = raw.productsHashPrev; // והקודמת (הפסקת חשמל באמצע שמירה)
  if (typeof raw.pcTime === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw.pcTime)) card.pcTime = raw.pcTime; // שעת המחשב בשמירה האחרונה
  // המונה לעולם לא מאחורי המסמך האחרון (שומר על רציפות)
  const lastNo = card.receipts.reduce((m, r) => Math.max(m, r.no), 0);
  card.seq.receipt = Math.max(card.seq.receipt, lastNo);
  const lastZ = card.zReports.reduce((m, r) => Math.max(m, r.no), 0);
  card.seq.z = Math.max(card.seq.z, lastZ);
  return { card };
}

// כתיבה בטוחה לכרטיס (גם במכשיר): קודם KUPA.TMP, אחר כך KUPA.JSON, ואז מוחקים את TMP.
// בקריאה: הקובץ התקין העדכני מבין השניים. אף אחד לא תקין ⇒ שגיאה חוסמת — לעולם לא "כרטיס ריק"
// (אחרת כתיבה שנקטעה בהפסקת חשמל הייתה מוחקת את כל ההיסטוריה בשמירה הבאה).
export const CARD_FILE = 'KUPA.JSON';
export const CARD_TMP = 'KUPA.TMP';
export function pickCardText(main, tmp) {
  const has = (t) => typeof t === 'string' && t.trim() !== '';
  if (!has(main) && !has(tmp)) return { card: emptyCard(), empty: true };
  const a = has(main) ? parseCard(main) : null;
  const b = has(tmp) ? parseCard(tmp) : null;
  if (a?.card && b?.card) return b.card.seq.op > a.card.seq.op ? { card: b.card, fromTmp: true } : { card: a.card };
  if (a?.card) return { card: a.card };
  if (b?.card) return { card: b.card, fromTmp: true };
  return { error: (a || b).error };
}

// בדיקת רציפות: כל המספרים החסרים והכפולים (הוראה 36 נספח ה' (א)(5))
export function checkSequence(card) {
  const seen = new Map();
  for (const r of card.receipts) seen.set(r.no, (seen.get(r.no) || 0) + 1);
  const top = Math.max(card.seq.receipt, ...card.receipts.map((r) => r.no), 0);
  const from = (card.base?.receipt || 0) + 1; // כרטיס המשך: מתחיל אחרי הקבלה האחרונה של הכרטיס הקודם
  const missing = [], dup = [];
  for (let i = from; i <= top; i++) {
    const c = seen.get(i) || 0;
    if (!c) missing.push(i);
    if (c > 1) dup.push(i);
  }
  return { ok: !missing.length && !dup.length, missing, dup, top, from };
}

// ── שמירה מצד הניהול (במחשב) ───────────────────────────────────
// הכרעת-בעלים 25.10: בניהול אין איפוס ואין שחזור — רק מידע והוצאת נתונים.
// הניהול רשאי לשנות הגדרות/מוצרים/מלאי; קבלות, סגירות-יום ומונים — לעולם לא.
export function guardManaged(before, after) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(before.receipts, after.receipts)) return { error: 'אסור לשנות קבלות מהמחשב' };
  if (!same(before.zReports, after.zReports)) return { error: 'אסור לשנות סגירות יום מהמחשב' };
  if (!same(before.ops, after.ops)) return { error: 'אסור לשנות את יומן הפעולות מהמחשב' };
  if (after.head !== before.head || after.deviceId !== before.deviceId || !same(before.base, after.base)) return { error: 'אסור לשנות את חתימת הכרטיס' };
  if (after.seq.receipt !== before.seq.receipt || after.seq.z !== before.seq.z || after.seq.op !== before.seq.op) return { error: 'אסור לשנות את המונים' };
  if (after.seq.internal < before.seq.internal) return { error: 'אסור להחזיר את מונה הברקודים אחורה' };
  if (before.settings.pinHash === PIN_IN_DEVICE && after.settings.pinHash !== PIN_IN_DEVICE) return { error: 'קוד המנהל נשמר בקופה — משנים אותו רק בקופה' };
  return { card: after };
}
