// מנוע המקשים — מה קורה בכל לחיצה. טהור: בלי מסך, בלי שעון, בלי אחסון.
// אותו מנוע ירוץ בסימולטור ובמכשיר; המסך רק מציג את המצב ומבצע את ה"תוצאות":
//   out.prints  — שורות להדפסה
//   out.beep    — true (צפצוף הצלחה) / false (שגיאה) / null
//   out.persist — לשמור: קודם כרטיס + קבצים, אחר כך זיכרון פנימי (סדר חשוב — הפסקת חשמל)
//   out.persistDevice — לשמור רק את הזיכרון הפנימי (מונה ניסיונות קוד שגויים, קוד מנהל)
//   out.drawer  — לפתוח את מגירת הכסף (פקודה למדפסת)
//   out.verifyUpdate — עדכון לאימות חתימה (אסינכרוני, אצל המארח) ⇒ updateResult()
// הזמן שמגיע מבחוץ הוא שעון החומרה; המנוע מוסיף את תיקון השעון (deviceNow).
import * as K from './kupa.mjs';
import * as F from './files.mjs';
import * as U from './update.mjs';

const DIGIT = /^[0-9]$/;
const PROTECTED = { REFUND: 'החזרה', DISC: 'הנחה', PCT: 'הנחה', BASKET: 'הנחת סל', BPCT: 'הנחת סל', Z: 'סגירת יום', CLOCK: 'כיוון שעון', DRAWER: 'פתיחת מגירה', UPDATE: 'עדכון תוכנה', PIN: 'החלפת קוד מנהל', BIND: 'כרטיס חדש' };
const BIG_AMOUNT = 500000; // ₪5,000 — מעל זה מחיר ידני דורש אישור (טעות הקלדה)
const BIG_QTY = 50;

// DDMMYYYYHHMM ⇄ ISO
export function isoToDigits(iso) {
  return iso.slice(8, 10) + iso.slice(5, 7) + iso.slice(0, 4) + iso.slice(11, 13) + iso.slice(14, 16);
}
export function digitsToIso(d) {
  if (!/^\d{12}$/.test(d)) return null;
  return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}T${d.slice(8, 10)}:${d.slice(10, 12)}`;
}

export function initState({ card, device, inserted = true }) {
  return {
    card, device, inserted, cardError: '',
    cart: K.emptyCart(), buf: '', sel: -1,
    mode: 'sale', // sale | menu | confirmZ | cash | pin | refundOf | confirmCsv
    pending: null, paidInfo: null, cancelArmed: false,
    msg: { text: '', kind: '' }, lastReceipt: null,
  };
}

// ── עזר ──
function begin(st) {
  return { s: { ...st }, out: { prints: [], beep: null, persist: false, persistDevice: false, files: null, drawer: false, verifyUpdate: null } };
}
function say(s, text, kind = 'info') { s.msg = { text, kind }; }
function fail(s, out, text) { say(s, text, 'err'); out.beep = false; }
function bufAgorot(buf) {
  if (!buf) return null;
  const n = Number(buf);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}
export function selIdx(s) { return s.sel < 0 ? s.cart.lines.length - 1 : s.sel; }
function typeDigit(s, k) {
  if (s.buf.length < 9 && !(k === '.' && s.buf.includes('.'))) s.buf += k;
}

// שמירה: הכרטיס מקבל את טביעת מוצרים.csv שנכתב; הקבצים יוצאים ב-out.files
function persist(s, out, r) {
  if (r.card) s.card = r.card;
  if (r.device) s.device = r.device;
  const files = F.exportCardFiles(s.card);
  const h = F.textHash(files[F.PRODUCTS_FILE]);
  // הטביעה הקודמת נשמרת: אם החשמל נפל אחרי כתיבת KUPA.JSON ולפני מוצרים.csv, הקובץ הישן
  // שנשאר בכרטיס מזוהה כ"לא נכתב" ולא כעריכה של הבעלים (אחרת המלאי היה חוזר אחורה)
  const prev = s.card.productsHash && s.card.productsHash !== h ? s.card.productsHash : s.card.productsHashPrev;
  s.card = { ...s.card, productsHash: h, ...(prev ? { productsHashPrev: prev } : {}) };
  out.files = files;
  out.persist = true;
}

function ready(s, out) {
  if (!s.inserted) { fail(s, out, 'אין כרטיס בקופה'); return false; }
  if (s.cardError) { fail(s, out, `⛔ ${s.cardError}`); return false; }
  if (!K.isConfigured(s.card)) { fail(s, out, 'הקופה לא הוגדרה — הוציאו את הכרטיס והגדירו עסק במחשב'); return false; }
  return true;
}

// ── כרטיס ──
// files = הקבצים שבכרטיס (לפחות מוצרים.csv אם קיים).
// loadError = KUPA.JSON קיים אבל לא נקרא (נכתב חלקית / פגום) ⇒ חוסם, ולעולם לא נכתב עליו כרטיס ריק.
export function insertCard(st, card, files = {}, raw, loadError) {
  if (loadError || !card) {
    const { s, out } = begin(st);
    s.inserted = true; s.mode = 'sale'; s.pending = null; s.paidInfo = null;
    s.card = K.emptyCard();
    s.cardError = `${loadError || 'הקובץ בכרטיס פגום'} — לא כותבים עליו. פנו לספק (הקבלות בקבצים שבכרטיס)`;
    fail(s, out, `⛔ ${s.cardError}`);
    return { st: s, out };
  }
  const r0 = insertCardInner(st, card, files, raw);
  const { st: s, out } = r0;
  if (s.mode === 'sale') afterInsert(s, out, files, raw);
  return { st: s, out };
}

// אחרי שהכרטיס נקרא: שעון חשוד ⇒ כיוון חובה; ואז עדכון תוכנה אם יש
function afterInsert(s, out, files, raw) {
  // שעון חשוד (הפסקת חשמל בלי סוללת שעון, קפיצה, החזרה) ⇒ מסך כיוון שעון לפני הכול.
  // אי אפשר לצאת ממנו בלי לאשר תאריך: מקלידים את התאריך והשעה הנכונים (גם אם הם בדיוק מה שמוצג)
  if (raw && s.inserted && !s.cardError && s.mode === 'sale') {
    const now = K.deviceNow(raw, s.device);
    const why = K.clockSuspect(s.device, now);
    if (why) {
      const hint = s.card.pcTime && s.card.pcTime > now ? s.card.pcTime : now;
      s.mode = 'setClock';
      s.clockForced = true;
      s.buf = '';
      say(s, `⏰ ${why} · הקלידו תאריך ושעה נכונים: יום-חודש-שנה-שעה-דקה (למשל ${isoToDigits(hint)}) · אישור`, 'err');
      out.beep = false;
    }
  }
  // עדכון תוכנה בכרטיס (אחרי שהשעון תקין — הרישום ביומן צריך שעה נכונה)
  if (s.inserted && !s.cardError && s.mode === 'sale' && files[U.UPDATE_FILE]) {
    const p = U.parseUpdate(files[U.UPDATE_FILE]);
    const c = p.error ? p : U.checkUpdate(p.update, versionOf(s));
    if (c.ok) {
      s.mode = 'confirmUpdate';
      s.pending = { update: p.update };
      say(s, `⬆ עדכון לגרסה ${p.update.manifest.version} בכרטיס${p.update.manifest.notes ? ` (${p.update.manifest.notes})` : ''} · אישור = התקנה · C = לא עכשיו`, 'info');
    } else if (!c.old) {
      say(s, `⚠ קובץ העדכון בכרטיס נדחה: ${c.error}`, 'err');
      out.beep = false;
    }
  }
}

export function versionOf(s) {
  return s.device?.version || U.VERSION;
}

// תוצאת אימות החתימה מהמארח: התקנה נרשמת ביומן החתום
export function updateResult(st, result, raw) {
  const { s, out } = begin(st);
  const upd = s.pending?.update;
  s.mode = 'sale'; s.pending = null;
  if (!upd) return { st: s, out };
  if (!result?.ok) { fail(s, out, `⛔ ${result?.error || 'העדכון נדחה'}`); return { st: s, out }; }
  const now = K.deviceNow(raw, s.device);
  const from = versionOf(s), to = upd.manifest.version;
  const r = K.logOp(s.card, { ...s.device, version: to }, now, 'UPDATE', { from, to, sha256: upd.manifest.sha256 });
  if (r.error) { fail(s, out, r.error); return { st: s, out }; }
  persist(s, out, r);
  out.install = upd; // המארח כותב את התוכנה החדשה (במכשיר: מחיצה B ואתחול)
  say(s, `✓ התוכנה עודכנה לגרסה ${to}`, 'ok');
  out.beep = true;
  return { st: s, out };
}

function insertCardInner(st, card, files, raw) {
  const { s, out } = begin(st);
  s.inserted = true;
  s.mode = 'sale';
  s.pending = null;
  s.clockForced = false;
  s.paidInfo = null; // תצוגת "שולם · עודף" לא שורדת החלפת כרטיס
  s.card = card;
  const r = K.checkCard(card, s.device, raw ? K.deviceNow(raw, s.device) : '');
  if (r.error) { s.cardError = r.error; fail(s, out, `⛔ ${r.error}`); return { st: s, out }; }
  s.cardError = '';
  if (r.bound && r.continued) {
    // כרטיס ריק בקופה שכבר מכרה (כרטיס חלופי — או כרטיס שמחקו ממנו הכול): רק באישור + קוד מנהל
    s.mode = 'confirmBind';
    s.pending = { files };
    say(s, `כרטיס ריק. להמשיך בו את הקופה (מקבלה ${(s.device.receipt || 0) + 1})? אישור + קוד מנהל · C = לא`, 'info');
    out.beep = false;
    return { st: s, out };
  }
  finishInsert(s, out, r, files);
  return { st: s, out };
}

function finishInsert(s, out, r, files) {
  s.card = r.card;
  if (r.device) s.device = r.device;
  say(s, r.recovered ? `הכרטיס נקרא · הושלמו ${r.recovered} פעולות אחרי הפסקת חשמל`
    : r.continued ? `כרטיס חדש — ממשיך מקבלה ${s.card.seq.receipt + 1} (סגירת יום ${s.card.seq.z + 1})` : 'הכרטיס נקרא', 'ok');
  const csv = files[F.PRODUCTS_FILE];
  const hash = csv === undefined ? null : F.textHash(csv);
  // מוצרים.csv שונה ממה שהקופה כתבה (ולא הגרסה הקודמת שלא הוחלפה בגלל הפסקת חשמל) ⇒ עריכה של הבעלים
  if (hash !== null && hash !== s.card.productsHash && hash !== s.card.productsHashPrev) {
    const imp = F.importProductsCsv(s.card, typeof csv === 'string' ? new TextEncoder().encode(csv) : csv);
    if (imp.errors.length) {
      const e = imp.errors[0];
      fail(s, out, `⚠ מוצרים.csv שורה ${e.line}: ${e.msg}${imp.errors.length > 1 ? ` (+${imp.errors.length - 1} נוספות)` : ''} — נשארו המוצרים הקודמים`);
      if (r.bound || r.device) { out.persist = true; } // שומרים שיוך/השלמה, לא דורסים את הקובץ השגוי
      return;
    }
    const summary = `${imp.added} נוספו · ${imp.changed} עודכנו · ${imp.removed} נמחקו`;
    const changed = imp.added + imp.changed + imp.removed > 0;
    if (changed && (imp.removed > 0 || !s.card.productsHash)) {
      // מחיקת מוצרים מהאקסל, או כרטיס שהקופה עוד לא כתבה בו — רק באישור
      const gone = s.card.products.filter((p) => !imp.card.products.some((n) => K.codeKey(n.code) === K.codeKey(p.code))).map((p) => p.name);
      s.mode = 'confirmCsv';
      s.pending = { card: imp.card, summary };
      say(s, imp.removed > 0
        ? `מוצרים.csv: יימחקו ${imp.removed} (${gone.slice(0, 3).join(', ')}${gone.length > 3 ? '…' : ''}) · אישור = כן · C = לא`
        : `מוצרים.csv: ${summary} · לקלוט? אישור = כן · C = לא`, 'info');
      if (r.bound || r.device) out.persist = true;
      return;
    }
    if (changed) say(s, `✓ מוצרים.csv: ${summary}${r.recovered ? ` · הושלמו ${r.recovered} פעולות` : ''}`, 'ok');
    s.card = imp.card;
  }
  persist(s, out, {});
  out.beep = true;
}

export function ejectCard(st) {
  const { s, out } = begin(st);
  if (s.cart.lines.length) { fail(s, out, 'אי אפשר להוציא כרטיס באמצע עסקה'); return { st: s, out }; }
  s.inserted = false;
  s.mode = 'sale';
  s.pending = null;
  s.paidInfo = null;
  say(s, '');
  return { st: s, out };
}

// ── סריקה ──
export function scan(st, code, raw) {
  const { s, out } = begin(st);
  const now = raw && K.deviceNow(raw, s.device);
  code = String(code).trim();
  if (!code) return { st: s, out };
  if (s.mode !== 'sale') { fail(s, out, 'סיימו קודם את הפעולה שעל המסך (C = חזרה)'); return { st: s, out }; }
  if (!ready(s, out)) return { st: s, out };
  const r = K.cartAdd(s.cart, s.card, code);
  if (r.error) { fail(s, out, `${r.error}: ${code}`); return { st: s, out }; }
  s.cart = r.cart; s.sel = -1; s.buf = ''; s.paidInfo = null; s.cancelArmed = false;
  const l = s.cart.lines.find((x) => x.code && K.codeKey(x.code) === K.codeKey(code)) || s.cart.lines[s.cart.lines.length - 1];
  if (r.warn) say(s, `${l.name} · ${r.warn}`, 'info');
  else say(s, `${l.name} · ${K.money(l.price)}`, 'ok');
  out.beep = true;
  void now;
  return { st: s, out };
}

// ── תשלום ──
function pay(s, out, method, now) {
  if (!ready(s, out)) return;
  const tendered = method === 'cash' ? (bufAgorot(s.buf) ?? 0) : 0;
  const r = K.checkout(s.card, s.cart, { method, tendered, now, device: s.device });
  if (r.error) { fail(s, out, r.error); return; }
  persist(s, out, r);
  if (method === 'cash') out.drawer = true;
  s.lastReceipt = r.receipt;
  out.prints.push(K.receiptLines(s.card, r.receipt));
  s.paidInfo = method === 'cash' && r.receipt.type === 'sale' ? { paid: r.receipt.tendered, change: r.receipt.change } : null;
  s.cart = K.emptyCart(); s.buf = ''; s.sel = -1; s.mode = 'sale';
  say(s, `קבלה ${r.receipt.no} הודפסה`, 'ok');
  out.beep = true;
}

function setQty(s, out, q) {
  const r = K.cartSetQty(s.cart, selIdx(s), q);
  if (r.error) fail(s, out, r.error); else { s.cart = r.cart; s.buf = ''; say(s, `כמות: ${q}`, 'ok'); }
}
function addManual(s, out, a) {
  const r = a === null ? { error: 'הקלידו מחיר' } : K.cartAddManual(s.cart, a, 'פריט כללי', s.card);
  if (r.error) fail(s, out, r.error);
  else { s.cart = r.cart; s.sel = -1; s.buf = ''; s.paidInfo = null; say(s, `פריט כללי ₪${K.money(a)}`, 'ok'); out.beep = true; }
}

// ── פעולות מוגנות בקוד מנהל ──
function protect(s, out, action, now) {
  if (!K.pinRequired(s.card, s.device)) return run(s, out, action, now);
  s.mode = 'pin';
  s.pending = { action, buf: s.buf, update: s.pending?.update, files: s.pending?.files };
  s.buf = '';
  say(s, `קוד מנהל ל${PROTECTED[action]} · אישור`, 'info');
}

function run(s, out, action, now) {
  if (action === 'BIND') {
    const r = K.checkCard(s.card, s.device, now || '');
    const files = s.pending?.files || {};
    s.mode = 'sale'; s.pending = null;
    if (r.error) { s.cardError = r.error; return fail(s, out, `⛔ ${r.error}`); }
    finishInsert(s, out, r, files);
    if (s.mode === 'sale') afterInsert(s, out, files, s.rawNow);
    return;
  }
  if (action === 'PIN') {
    s.mode = 'newPin'; s.buf = '';
    return say(s, 'קוד מנהל חדש (4–8 ספרות) · אישור · C = ביטול', 'info');
  }
  if (action === 'REFUND') {
    if (s.cart.refund) { s.cart = K.emptyCart(); say(s, 'חזרה למכירה רגילה', 'info'); return; }
    if (s.cart.lines.length) return fail(s, out, 'קודם סיימו או בטלו את העסקה');
    s.mode = 'refundOf'; s.buf = '';
    return say(s, "החזרה: הקלידו מס' קבלה מקורית · אישור", 'info');
  }
  if (action === 'Z') {
    s.mode = 'confirmZ';
    return say(s, 'סגירת יום? אישור = כן · C = לא', 'info');
  }
  if (action === 'UPDATE') {
    s.mode = 'updating';
    out.verifyUpdate = s.pending?.update;
    return say(s, 'בודק את חתימת העדכון…', 'info');
  }
  if (action === 'CLOCK') {
    s.mode = 'setClock';
    s.buf = isoToDigits(now);
    return say(s, 'כיוון שעון: יום-חודש-שנה-שעה-דקה · C מוחק · אישור', 'info');
  }
  if (action === 'DRAWER') {
    const r = K.logOp(s.card, s.device, now, 'DRAWER');
    if (r.error) return fail(s, out, r.error);
    persist(s, out, r);
    out.drawer = true;
    return say(s, 'המגירה נפתחה (נרשם)', 'info');
  }
  const idx = selIdx(s);
  if (action === 'DISC') {
    const a = bufAgorot(s.buf);
    const r = a === null ? { error: 'הקלידו סכום הנחה' } : K.cartDiscount(s.cart, idx, a);
    if (r.error) return fail(s, out, r.error);
    s.cart = r.cart; s.buf = ''; return say(s, `הנחה ₪${K.money(a)}`, 'ok');
  }
  if (action === 'PCT') {
    const p = Number(s.buf);
    const r = !s.buf ? { error: 'הקלידו אחוז הנחה' } : K.cartDiscountPct(s.cart, idx, p);
    if (r.error) return fail(s, out, r.error);
    s.cart = r.cart; s.buf = ''; return say(s, `הנחה ${p}%`, 'ok');
  }
  if (action === 'BASKET' || action === 'BPCT') {
    const v = action === 'BPCT' ? { pct: Number(s.buf || 0) } : { amount: bufAgorot(s.buf) ?? 0 };
    const r = K.cartBasket(s.cart, v);
    if (r.error) return fail(s, out, r.error);
    s.cart = r.cart; s.buf = '';
    return say(s, !r.cart.basket ? 'הנחת הסל בוטלה' : v.pct ? `הנחת סל ${v.pct}%` : `הנחת סל ₪${K.money(v.amount)}`, 'ok');
  }
  void now;
}

// ── מקשים ──
export function press(st, k, raw) {
  const { s, out } = begin(st);
  const now = raw && K.deviceNow(raw, s.device);

  if (s.mode === 'setClock') {
    if (DIGIT.test(k)) { if (s.buf.length < 12) s.buf += k; }
    else if (k === 'C') {
      if (s.buf) s.buf = '';
      else if (s.clockForced) fail(s, out, 'חובה להקליד תאריך ושעה נכונים לפני שממשיכים (12 ספרות · אישור)');
      else { s.mode = 'sale'; say(s, 'השעון לא שונה', 'info'); }
    } else if (k === 'OK') {
      const target = digitsToIso(s.buf);
      const r = target ? K.setClock(s.device, raw, target) : { error: 'הקלידו 12 ספרות: יום חודש שנה שעה דקה' };
      if (r.error) return (fail(s, out, r.error), { st: s, out });
      const newNow = K.deviceNow(raw, r.device);
      const log = K.logOp(s.card, r.device, newNow, 'CLOCK', { was: now });
      if (log.error) return (fail(s, out, log.error), { st: s, out });
      persist(s, out, log);
      s.mode = 'sale'; s.buf = ''; s.clockForced = false;
      say(s, `השעון כוון: ${newNow.slice(8, 10)}/${newNow.slice(5, 7)}/${newNow.slice(0, 4)} ${newNow.slice(11, 16)}`, 'ok');
      out.beep = true;
    }
    return { st: s, out };
  }

  if (s.mode === 'confirmBind') {
    if (k === 'OK') { s.rawNow = raw; protect(s, out, 'BIND', now); }
    else if (k === 'C') { s.mode = 'sale'; s.pending = null; s.cardError = 'הכרטיס לא שויך לקופה — הוציאו אותו'; say(s, `⛔ ${s.cardError}`, 'err'); }
    return { st: s, out };
  }

  if (s.mode === 'newPin') {
    if (DIGIT.test(k)) { if (s.buf.length < 8) s.buf += k; }
    else if (k === 'C') { s.mode = 'sale'; s.buf = ''; say(s, 'קוד המנהל לא שונה', 'info'); }
    else if (k === 'OK') {
      const r = K.changeDevicePin(s.card, s.device, s.buf);
      if (r.error) { s.buf = ''; return (fail(s, out, r.error), { st: s, out }); }
      const log = K.logOp(r.card, r.device, now, 'PIN');
      if (log.error) return (fail(s, out, log.error), { st: s, out });
      persist(s, out, log);
      s.mode = 'sale'; s.buf = '';
      say(s, '✓ קוד המנהל הוחלף', 'ok');
      out.beep = true;
    }
    return { st: s, out };
  }

  if (s.mode === 'confirmUpdate') {
    if (k === 'OK') protect(s, out, 'UPDATE', now);
    else if (k === 'C') { s.mode = 'sale'; s.pending = null; say(s, 'העדכון לא הותקן — אפשר להתקין בהכנסת הכרטיס הבאה', 'info'); }
    return { st: s, out };
  }
  if (s.mode === 'updating') return { st: s, out }; // ממתינים לאימות החתימה

  if (s.mode === 'confirmBig') {
    const p = s.pending;
    s.mode = 'sale'; s.pending = null;
    if (k !== 'OK') { s.buf = ''; say(s, 'בוטל', 'info'); return { st: s, out }; }
    if (p.kind === 'price') addManual(s, out, p.value);
    else setQty(s, out, p.value);
    return { st: s, out };
  }

  if (s.mode === 'menu') {
    s.mode = 'sale';
    if (k === 'C') say(s, '');
    else if (k === '1') {
      const r = K.printInterim(s.card, now, { ...s.device, version: versionOf(s) });
      if (r.error) fail(s, out, r.error);
      else { persist(s, out, r); out.prints.push(K.reportLines(s.card, r.report)); say(s, 'דוח ביניים הודפס', 'ok'); }
    } else if (k === '2') protect(s, out, 'Z', now);
    else if (k === '3') { out.prints.push(K.stockLines(s.card, now)); say(s, 'דוח מלאי הודפס', 'ok'); }
    else if (k === '5') protect(s, out, 'DRAWER', now);
    else if (k === '6') protect(s, out, 'CLOCK', now);
    else if (k === '7') protect(s, out, 'PIN', now);
    else if (k === '4') {
      if (!s.lastReceipt) fail(s, out, 'אין קבלה אחרונה');
      else {
        const r = K.logOp(s.card, s.device, now, 'COPY', { ref: s.lastReceipt.no });
        if (r.error) fail(s, out, r.error);
        else { persist(s, out, r); out.prints.push(K.receiptLines(s.card, s.lastReceipt, { copy: true })); say(s, 'העתק הודפס', 'ok'); }
      }
    } else { s.mode = 'menu'; fail(s, out, 'בחירה לא קיימת'); }
    return { st: s, out };
  }

  if (s.mode === 'confirmZ') {
    s.mode = 'sale';
    if (k === 'OK') {
      const r = K.closeDay(s.card, now, { ...s.device, version: versionOf(s) });
      if (r.error) fail(s, out, r.error);
      else { persist(s, out, r); out.prints.push(K.reportLines(s.card, r.report)); say(s, `יום ${r.report.no} נסגר`, 'ok'); out.beep = true; }
    } else say(s, 'סגירת היום בוטלה', 'info');
    return { st: s, out };
  }

  if (s.mode === 'confirmCsv') {
    if (k === 'OK') { const { card, summary } = s.pending; persist(s, out, { card }); say(s, `✓ מוצרים.csv: ${summary}`, 'ok'); out.beep = true; }
    else if (k === 'C') { persist(s, out, {}); say(s, 'השינויים במוצרים.csv בוטלו — נשארו המוצרים הקודמים', 'info'); }
    else return { st: s, out };
    s.mode = 'sale'; s.pending = null;
    return { st: s, out };
  }

  if (s.mode === 'pin') {
    if (DIGIT.test(k)) { if (s.buf.length < 8) s.buf += k; return { st: s, out }; }
    const { action, buf } = s.pending;
    if (k === 'C') {
      // ביטול בשיוך כרטיס חוזר לשאלה; בשאר — חזרה למכירה
      if (action === 'BIND') { s.mode = 'confirmBind'; s.pending = { files: s.pending.files }; s.buf = ''; say(s, 'כרטיס ריק — אישור + קוד מנהל · C = לא', 'info'); return { st: s, out }; }
      s.mode = 'sale'; s.pending = null; s.buf = buf; say(s, 'בוטל', 'info'); return { st: s, out };
    }
    if (k === 'OK') {
      const c = K.checkPin(s.card, s.buf, s.device, now);
      const { update: upd, files } = s.pending;
      s.mode = action === 'BIND' ? 'confirmBind' : 'sale';
      s.pending = upd ? { update: upd } : files ? { files } : null;
      s.buf = action === 'BIND' ? '' : buf;
      if (!c.ok) {
        s.device = c.device; // מונה הניסיונות השגויים נשמר בזיכרון הקופה (שורד כיבוי)
        out.persistDevice = true;
        if (c.locked) { fail(s, out, `קוד מנהל שגוי ${K.PIN_MAX_FAILS} פעמים — נעול עד ${c.locked.slice(11, 16)}`); }
        else fail(s, out, 'קוד מנהל שגוי');
        return { st: s, out };
      }
      if (c.device !== s.device || c.card !== s.card) { s.card = c.card; s.device = c.device; if (action !== 'BIND') persist(s, out, {}); else out.persistDevice = true; }
      run(s, out, action, now);
    }
    return { st: s, out };
  }

  if (s.mode === 'refundOf') {
    if (DIGIT.test(k)) { typeDigit(s, k); return { st: s, out }; }
    if (k === 'C') { s.mode = 'sale'; s.buf = ''; say(s, 'ההחזרה בוטלה', 'info'); return { st: s, out }; }
    if (k === 'OK') {
      const no = Number(s.buf);
      const left = K.refundable(s.card, no);
      s.buf = '';
      if (left.error) { fail(s, out, left.error); return { st: s, out }; }
      if (!left.units.some((u) => u.left > 0)) { fail(s, out, `כל הפריטים מקבלה ${no} כבר הוחזרו`); return { st: s, out }; }
      s.mode = 'sale';
      s.cart = K.cartToggleRefund(K.emptyCart(), no);
      say(s, `החזרה לקבלה ${no} — סרקו את הפריטים המוחזרים`, 'info');
    }
    return { st: s, out };
  }

  if (s.mode === 'cash') {
    if (DIGIT.test(k) || k === '00' || k === '.') typeDigit(s, k);
    else if (k === 'C') { if (s.buf) s.buf = ''; else { s.mode = 'sale'; say(s, 'התשלום בוטל — אפשר להמשיך לסרוק', 'info'); } }
    else if (k === 'OK' || k === 'CASH') {
      const due = K.payableOf(s.card, s.cart, 'cash');
      const paid = bufAgorot(s.buf) ?? due; // בלי סכום = שילם בדיוק
      if (paid < due) fail(s, out, `חסרים ₪${K.money(due - paid)}`);
      else pay(s, out, 'cash', now);
    } else if (k === 'CREDIT') { s.buf = ''; pay(s, out, 'credit', now); }
    return { st: s, out };
  }

  // ── מצב מכירה ──
  if (k !== 'CANCEL') s.cancelArmed = false;
  if (DIGIT.test(k) || k === '00' || k === '.') typeDigit(s, k);
  else if (k === 'C') { if (s.buf) s.buf = ''; else say(s, ''); }
  else if (k === 'UP') { if (s.cart.lines.length) s.sel = Math.max(0, selIdx(s) - 1); }
  else if (k === 'DOWN') { if (s.cart.lines.length) { const i = selIdx(s) + 1; s.sel = i >= s.cart.lines.length - 1 ? -1 : i; } }
  else if (k === 'MENU') {
    if (s.cart.lines.length || s.cart.refund) fail(s, out, 'קודם סיימו או בטלו את העסקה');
    else if (ready(s, out)) { s.mode = 'menu'; say(s, ''); }
  } else if (k === 'OK') {
    if (s.buf) { const code = s.buf; s.buf = ''; return scan(s, code, now); } // הקלדת ברקוד ידנית
  } else if (!ready(s, out)) {
    /* ready כבר הציג שגיאה */
  } else if (k === 'QTY') {
    const q = Number(s.buf);
    if (s.cart.refund) fail(s, out, 'בהחזרה סורקים כל פריט בנפרד');
    else if (q > BIG_QTY && s.cart.lines.length) { s.mode = 'confirmBig'; s.pending = { kind: 'qty', value: q }; say(s, `כמות ${q} — בטוח? אישור = כן · C = לא`, 'info'); }
    else setQty(s, out, q);
  } else if (k in PROTECTED) {
    if (k !== 'REFUND' && !s.cart.lines.length) fail(s, out, 'אין פריטים');
    else if (k === 'REFUND' && s.cart.refund) run(s, out, 'REFUND', now); // יציאה ממצב החזרה — בלי קוד
    else protect(s, out, k, now);
  } else if (k === 'PRICE') {
    const a = bufAgorot(s.buf);
    if (a !== null && a > BIG_AMOUNT && !s.cart.refund) { s.mode = 'confirmBig'; s.pending = { kind: 'price', value: a }; say(s, `מחיר ₪${K.money(a)} — בטוח? אישור = כן · C = לא`, 'info'); }
    else addManual(s, out, a);
  } else if (k === 'DEL') {
    const r = K.cartVoid(s.cart, selIdx(s));
    if (r.error) fail(s, out, 'אין מה למחוק');
    else {
      // בהחזרה: מחירי היחידות שנשארו מחושבים מחדש (כל יחידה במחיר ששולם עליה)
      s.cart = r.cart.refund && r.cart.lines.length ? (K.repriceRefund(r.cart, s.card).cart) : r.cart;
      s.sel = -1; say(s, 'השורה נמחקה', 'info');
    }
  } else if (k === 'CANCEL') {
    if (!s.cart.lines.length && !s.cart.refund) say(s, 'אין עסקה פתוחה', 'info');
    else if (!s.cancelArmed) { s.cancelArmed = true; say(s, 'לבטל את כל העסקה? לחצו בטל שוב', 'info'); }
    else {
      if (s.cart.lines.length) {
        const t = K.cartTotals(s.cart, s.card.settings.vatRate);
        const r = K.logOp(s.card, s.device, now, 'CANCEL', { items: t.items, amount: t.total });
        if (r.error) return (fail(s, out, r.error), { st: s, out });
        persist(s, out, r);
      }
      s.cart = K.emptyCart(); s.buf = ''; s.sel = -1; s.cancelArmed = false;
      say(s, 'העסקה בוטלה ונרשמה', 'info');
    }
  } else if (k === 'CASH') {
    if (!s.cart.lines.length) fail(s, out, 'אין פריטים');
    else if (s.cart.refund || s.buf) pay(s, out, 'cash', now); // החזרה, או קיצור: סכום הוקלד מראש
    else { s.mode = 'cash'; say(s, ''); }
  } else if (k === 'CREDIT') {
    if (!s.cart.lines.length) fail(s, out, 'אין פריטים');
    else pay(s, out, 'credit', now);
  }
  return { st: s, out };
}
