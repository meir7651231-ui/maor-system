// מנוע המקשים — מה קורה בכל לחיצה. טהור: בלי מסך, בלי שעון, בלי אחסון.
// אותו מנוע ירוץ בסימולטור ובמכשיר; המסך רק מציג את המצב ומבצע את ה"תוצאות":
//   out.prints  — שורות להדפסה
//   out.beep    — true (צפצוף הצלחה) / false (שגיאה) / null
//   out.persist — לשמור: קודם כרטיס + קבצים, אחר כך זיכרון פנימי (סדר חשוב — הפסקת חשמל)
import * as K from './kupa.mjs';
import * as F from './files.mjs';

const DIGIT = /^[0-9]$/;
const PROTECTED = { REFUND: 'החזרה', DISC: 'הנחה', PCT: 'הנחה', BASKET: 'הנחת סל', BPCT: 'הנחת סל', Z: 'סגירת יום' };

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
  return { s: { ...st }, out: { prints: [], beep: null, persist: false, files: null } };
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
  s.card = { ...s.card, productsHash: F.textHash(files[F.PRODUCTS_FILE]) };
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
// files = הקבצים שבכרטיס (לפחות מוצרים.csv אם קיים)
export function insertCard(st, card, files = {}) {
  const { s, out } = begin(st);
  s.inserted = true;
  s.mode = 'sale';
  s.pending = null;
  s.paidInfo = null; // תצוגת "שולם · עודף" לא שורדת החלפת כרטיס
  s.card = card;
  const r = K.checkCard(card, s.device);
  if (r.error) { s.cardError = r.error; fail(s, out, `⛔ ${r.error}`); return { st: s, out }; }
  s.cardError = '';
  s.card = r.card;
  if (r.device) s.device = r.device;
  say(s, r.recovered ? `הכרטיס נקרא · הושלמו ${r.recovered} פעולות אחרי הפסקת חשמל` : 'הכרטיס נקרא', 'ok');
  const csv = files[F.PRODUCTS_FILE];
  if (csv !== undefined && s.card.productsHash && F.textHash(csv) !== s.card.productsHash) {
    const imp = F.importProductsCsv(s.card, typeof csv === 'string' ? new TextEncoder().encode(csv) : csv);
    if (imp.errors.length) {
      const e = imp.errors[0];
      fail(s, out, `⚠ מוצרים.csv שורה ${e.line}: ${e.msg}${imp.errors.length > 1 ? ` (+${imp.errors.length - 1} נוספות)` : ''} — נשארו המוצרים הקודמים`);
      if (r.bound || r.device) { out.persist = true; } // שומרים שיוך/השלמה, לא דורסים את הקובץ השגוי
      return { st: s, out };
    }
    const summary = `${imp.added} נוספו · ${imp.changed} עודכנו · ${imp.removed} נמחקו`;
    if (imp.removed > 0) {
      // מחיקת מוצרים מהאקסל — רק באישור (שורה שנמחקה בטעות)
      const gone = s.card.products.filter((p) => !imp.card.products.some((n) => K.codeKey(n.code) === K.codeKey(p.code))).map((p) => p.name);
      s.mode = 'confirmCsv';
      s.pending = { card: imp.card, summary };
      say(s, `מוצרים.csv: יימחקו ${imp.removed} (${gone.slice(0, 3).join(', ')}${gone.length > 3 ? '…' : ''}) · אישור = כן · C = לא`, 'info');
      if (r.bound || r.device) out.persist = true;
      return { st: s, out };
    }
    say(s, `✓ מוצרים.csv: ${summary}`, 'ok');
    s.card = imp.card;
  }
  persist(s, out, {});
  out.beep = true;
  return { st: s, out };
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
export function scan(st, code, now) {
  const { s, out } = begin(st);
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
  s.lastReceipt = r.receipt;
  out.prints.push(K.receiptLines(s.card, r.receipt));
  s.paidInfo = method === 'cash' && r.receipt.type === 'sale' ? { paid: r.receipt.tendered, change: r.receipt.change } : null;
  s.cart = K.emptyCart(); s.buf = ''; s.sel = -1; s.mode = 'sale';
  say(s, `קבלה ${r.receipt.no} הודפסה`, 'ok');
  out.beep = true;
}

// ── פעולות מוגנות בקוד מנהל ──
function protect(s, out, action, now) {
  if (!s.card.settings.pinHash) return run(s, out, action, now);
  s.mode = 'pin';
  s.pending = { action, buf: s.buf };
  s.buf = '';
  say(s, `קוד מנהל ל${PROTECTED[action]} · אישור`, 'info');
}

function run(s, out, action, now) {
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
export function press(st, k, now) {
  const { s, out } = begin(st);

  if (s.mode === 'menu') {
    s.mode = 'sale';
    if (k === 'C') say(s, '');
    else if (k === '1') {
      const r = K.printInterim(s.card, now, s.device);
      if (r.error) fail(s, out, r.error);
      else { persist(s, out, r); out.prints.push(K.reportLines(s.card, r.report)); say(s, 'דוח ביניים הודפס', 'ok'); }
    } else if (k === '2') protect(s, out, 'Z', now);
    else if (k === '3') { out.prints.push(K.stockLines(s.card, now)); say(s, 'דוח מלאי הודפס', 'ok'); }
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
      const r = K.closeDay(s.card, now, s.device);
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
    if (k === 'C') { s.mode = 'sale'; s.pending = null; s.buf = buf; say(s, 'בוטל', 'info'); return { st: s, out }; }
    if (k === 'OK') {
      const ok = K.checkPin(s.card, s.buf);
      s.mode = 'sale'; s.pending = null; s.buf = buf;
      if (!ok) { fail(s, out, 'קוד מנהל שגוי'); return { st: s, out }; }
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
    else {
      const r = K.cartSetQty(s.cart, selIdx(s), q);
      if (r.error) fail(s, out, r.error); else { s.cart = r.cart; s.buf = ''; say(s, `כמות: ${q}`, 'ok'); }
    }
  } else if (k in PROTECTED) {
    if (k !== 'REFUND' && !s.cart.lines.length) fail(s, out, 'אין פריטים');
    else if (k === 'REFUND' && s.cart.refund) run(s, out, 'REFUND', now); // יציאה ממצב החזרה — בלי קוד
    else protect(s, out, k, now);
  } else if (k === 'PRICE') {
    const a = bufAgorot(s.buf);
    const r = a === null ? { error: 'הקלידו מחיר' } : K.cartAddManual(s.cart, a, 'פריט כללי', s.card);
    if (r.error) fail(s, out, r.error);
    else { s.cart = r.cart; s.sel = -1; s.buf = ''; s.paidInfo = null; say(s, `פריט כללי ₪${K.money(a)}`, 'ok'); out.beep = true; }
  } else if (k === 'DEL') {
    const r = K.cartVoid(s.cart, selIdx(s));
    if (r.error) fail(s, out, 'אין מה למחוק'); else { s.cart = r.cart; s.sel = -1; say(s, 'השורה נמחקה', 'info'); }
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
