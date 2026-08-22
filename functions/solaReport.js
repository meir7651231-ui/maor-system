/**
 * כיוון-נכנס · Sola Payments (Cardknox white-label) — מיפוי שורות Reporting API
 * → רשומות "תשלום-נכנס". **טהור** (בלי firebase/רשת) — נבדק ביחידה, כמו
 * nedarimHistory.js שהוא בן-הדמות שלו.
 *
 * ההבדל המהותי מנדרים: **סולה לא מנפיקה קבלת-§46** — xRefNum הוא מספר-אסמכתה של
 * השער, לא קבלה. לכן `receipt` נשאר ריק, והרישום בקליינט עובר דרך תור-האישור
 * (IncomingPayments) — המנהל מאשר ⇒ הקבלה נרשמת במאור ברצף הרגיל (canIssueReceipt).
 * אינווריאנט-הברזל: המודול הזה לעולם לא נוגע בקבלות/מונים — רק תשלומים-נכנסים.
 *
 * שדות-סולה (docs.solapayments.com ≡ docs.cardknox.com, עוגן ידע:
 * knowledge/SOLA-PAYMENTS-2026-08-21.md): xResult A/E/D · xRefNum (64-bit! נשמר
 * כמחרוזת) · xAuthAmount/xAmount · xName · xMaskedCardNumber · xInvoice ·
 * xCurrency · xDate/xEnteredDate · xCommand (cc:sale/check:sale/cc:refund…).
 * המיפוי סובלני-שמות (pick עם וריאנטים) — ו-solaPull תומך ?peek=1 להצצה חיה
 * בשורות הגולמיות לפני שסומכים על המיפוי (אותו נוהג שעבד בנדרים).
 */

function pick(r, ...keys) {
  for (const k of keys) {
    const v = r[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/** 'usd'/'USD'/'$' ⇒ '$'; כל השאר (ILS/ריק/₪) ⇒ '₪'. */
function pickCurrency(r) {
  const raw = pick(r, 'xCurrency', 'Currency', 'currency');
  return /usd|\$|דולר/i.test(raw) ? '$' : '₪';
}

/** סכום: xAuthAmount (מה שאושר בפועל — המלצת-סולה לאמת מולו) עם נפילה ל-xAmount. */
function pickAmount(r) {
  const raw = pick(r, 'xAuthAmount', 'xAmount', 'Amount', 'amount');
  return Number(String(raw || 0).replace(/[^\d.-]/g, '')) || 0;
}

/** תאריך-סולה ("M/D/YYYY h:mm:ss AM" או ISO) → "yyyy-MM-dd". ⚠️ אמריקאי: חודש/יום. */
function solaDateToIso(raw) {
  const s = String(raw || '').trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  const us = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (!us) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${us[3]}-${pad(us[1])}-${pad(us[2])}`; // חודש/יום/שנה — הפוך מנדרים!
}

/** 4 ספרות אחרונות מ-xMaskedCardNumber ("4xxxxxxxxxxx1111"). */
function pickLast4(r) {
  const masked = pick(r, 'xMaskedCardNumber', 'xMaskedAccountNumber');
  const m = /(\d{4})\s*$/.exec(masked);
  return m ? m[1] : '';
}

/** doc-id בטוח: [A-Za-z0-9_-] בלבד (לקח-נחיל F13 — '/' במזהה מפיל create). */
function safeId(raw) {
  return String(raw || '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 100);
}

/** האם השורה היא עסקה שנקלטת? מאושרות בלבד (xResult A / 'Approved'). */
function isApproved(r) {
  const res = pick(r, 'xResult', 'xGatewayResult', 'xStatus', 'xResponseResult');
  return res === 'A' || /^approved$/i.test(res);
}

/**
 * @param {Array<Record<string, unknown>>} rows - xReportData מ-Report:Transactions
 * @param {string} org - slug הארגון
 * @returns {{ writes: Array<{id: string, data: Record<string, unknown>}>, lastDateIso: string }}
 *   writes — רשומות-לכתיבה (doc-id דטרמיניסטי `sola-<xRefNum>` ⇒ דדופ בין-ריצות);
 *   lastDateIso — התאריך המאוחר ביותר שנראה (ל-cursor-החלון של המשיכה הבאה).
 */
function planSolaWrites(rows, org) {
  const writes = [];
  let lastDateIso = '';
  for (const r of Array.isArray(rows) ? rows : []) {
    const ref = pick(r, 'xRefNum', 'xRefnum', 'RefNum');
    const dIso = solaDateToIso(pick(r, 'xEnteredDate', 'xDate', 'xResponseDate'));
    if (dIso > lastDateIso) lastDateIso = dIso;
    if (!ref) continue; // בלי xRefNum אין דדופ — מדלגים
    if (!isApproved(r)) continue; // נדחות/שגיאות לא נקלטות (אין כסף שזז)
    const cmd = pick(r, 'xCommand', 'xType').toLowerCase();
    // void/adjust/save אינם כסף-נכנס; capture/sale/postauth = חיוב; refund/credit = זיכוי.
    if (/void|save|adjust|verify|balance/.test(cmd)) continue;
    const amount = pickAmount(r);
    if (!amount) continue; // 0 ⇒ אין מה לקלוט (עסקת-אימות וכד')
    const isRefund = /refund|credit/.test(cmd) || amount < 0;
    const kind = isRefund ? 'refund' : 'charge';
    writes.push({
      id: 'sola-' + safeId(ref),
      data: {
        amount: isRefund ? -Math.abs(amount) : amount,
        currency: pickCurrency(r),
        name: pick(r, 'xName', 'xBillFirstName') || '',
        phone: pick(r, 'xBillPhone', 'xPhone') || '',
        email: pick(r, 'xEmail', 'xBillEmail') || '',
        zeout: '',
        category: '',
        kevaId: '',
        reference: ref, // xRefNum — להציג למשתמש ולצרף לקבלה (המלצת-סולה)
        txnId: ref,
        d: dIso, // תאריך-העסקה האמיתי; ריק ⇒ הלקוח ייפול ל-isoToday
        receipt: '', // ⚠️ סולה לא מנפיקה §46 — הקבלה תירשם במאור באישור-המנהל
        last4: pickLast4(r),
        toremId: '',
        invoice: pick(r, 'xInvoice') || '',
        cardType: pick(r, 'xCardType') || '',
        provider: 'sola',
        source: 'pull',
        status: 'pending',
        ...(kind !== 'charge' ? { kind } : {}),
      },
    });
  }
  return { writes, lastDateIso };
}

module.exports = { planSolaWrites, solaDateToIso, safeId };
