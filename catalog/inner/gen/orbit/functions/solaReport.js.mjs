// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/solaReport.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function pick(r, ...keys) {
    for (const k of keys) {
        const v = r[k];
        if (v != null && String(v).trim() !== '')
            return String(v).trim();
    }
    return '';
}
function pickCurrency(r) {
    const raw = pick(r, 'xCurrency', 'Currency', 'currency');
    return /ils|₪|שקל|nis/i.test(raw) ? '₪' : '$';
}
function pickAmount(r) {
    const raw = pick(r, 'xAuthAmount', 'xAmount', 'Amount', 'amount');
    return Number(String(raw || 0).replace(/[^\d.-]/g, '')) || 0;
}
function solaDateToIso(raw) {
    const s = String(raw || '').trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (iso)
        return iso[1] + '-' + iso[2] + '-' + iso[3];
    const us = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
    if (!us)
        return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${us[3]}-${pad(us[1])}-${pad(us[2])}`; // חודש/יום/שנה — הפוך מנדרים!
}
function pickLast4(r) {
    const masked = pick(r, 'xMaskedCardNumber', 'xMaskedAccountNumber');
    const m = /(\d{4})\s*$/.exec(masked);
    return m ? m[1] : '';
}
function safeId(raw) {
    return String(raw || '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 100);
}
function isApproved(r) {
    const res = pick(r, 'xResult', 'xGatewayResult', 'xStatus', 'xResponseResult');
    return res === 'A' || /^approved$/i.test(res);
}
export function inner$pickCurrency$raw(r) {
    const raw = pick(r, 'xCurrency', 'Currency', 'currency');
    return raw;
}
export function inner$pickAmount$raw(r) {
    const raw = pick(r, 'xAuthAmount', 'xAmount', 'Amount', 'amount');
    return raw;
}
export function inner$solaDateToIso$s(raw) {
    const s = String(raw || '').trim();
    return s;
}
export function inner$solaDateToIso$iso(raw) {
    const s = String(raw || '').trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return iso;
}
export function inner$solaDateToIso$iso$$step(s) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    return iso;
}
export function inner$solaDateToIso$us(raw) {
    const s = String(raw || '').trim();
    const us = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
    return us;
}
export function inner$solaDateToIso$us$$step(s) {
    const us = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
    return us;
}
export function inner$pickLast4$masked(r) {
    const masked = pick(r, 'xMaskedCardNumber', 'xMaskedAccountNumber');
    return masked;
}
export function inner$pickLast4$m(r) {
    const masked = pick(r, 'xMaskedCardNumber', 'xMaskedAccountNumber');
    const m = /(\d{4})\s*$/.exec(masked);
    return m;
}
export function inner$pickLast4$m$$step(masked) {
    const m = /(\d{4})\s*$/.exec(masked);
    return m;
}
export function inner$isApproved$res(r) {
    const res = pick(r, 'xResult', 'xGatewayResult', 'xStatus', 'xResponseResult');
    return res;
}
export function inner$planSolaWrites$ref(r) {
    const ref = pick(r, 'xRefNum', 'xRefnum', 'RefNum');
    return ref;
}
export function inner$planSolaWrites$dIso(r) {
    const dIso = solaDateToIso(pick(r, 'xEnteredDate', 'xDate', 'xResponseDate'));
    return dIso;
}
export function inner$planSolaWrites$cmd(r) {
    const cmd = pick(r, 'xCommand', 'xType').toLowerCase();
    return cmd;
}
export function inner$planSolaWrites$amount(r) {
    const amount = pickAmount(r);
    return amount;
}
export function inner$planSolaWrites$isRefund(r) {
    const cmd = pick(r, 'xCommand', 'xType').toLowerCase();
    const amount = pickAmount(r);
    const isRefund = /refund|credit/.test(cmd) || amount < 0;
    return isRefund;
}
export function inner$planSolaWrites$isRefund$$step(cmd, amount) {
    const isRefund = /refund|credit/.test(cmd) || amount < 0;
    return isRefund;
}
export function inner$planSolaWrites$kind(r) {
    const cmd = pick(r, 'xCommand', 'xType').toLowerCase();
    const amount = pickAmount(r);
    const isRefund = /refund|credit/.test(cmd) || amount < 0;
    const kind = isRefund ? 'refund' : 'charge';
    return kind;
}
export function inner$planSolaWrites$kind$$step(isRefund) {
    const kind = isRefund ? 'refund' : 'charge';
    return kind;
}
export function inner$planSolaWrites$writes$$after_loop(rows) {
    const writes = [];
    let lastDateIso = '';
    for (const r of Array.isArray(rows) ? rows : []) {
        const ref = pick(r, 'xRefNum', 'xRefnum', 'RefNum');
        const dIso = solaDateToIso(pick(r, 'xEnteredDate', 'xDate', 'xResponseDate'));
        if (dIso > lastDateIso)
            lastDateIso = dIso;
        if (!ref)
            continue; // בלי xRefNum אין דדופ — מדלגים
        if (!isApproved(r))
            continue; // נדחות/שגיאות לא נקלטות (אין כסף שזז)
        const cmd = pick(r, 'xCommand', 'xType').toLowerCase();
        // void/adjust/save אינם כסף-נכנס; capture/sale/postauth = חיוב; refund/credit = זיכוי.
        // 🐛 נחיל-סולה S4 (23.8): cc:authonly = אישור-מסגרת בלי לכידה — אין כסף שנכנס;
        // בלעדי-הסינון היה נקלט כהכנסה. (postauth כן חיוב — הרג'קס תופס authonly בלבד.)
        if (/void|save|adjust|verify|balance|authonly/.test(cmd))
            continue;
        // 💎 שטח-אמת 23.8 (הצצה #26): שורות-הדוח נושאות דגל xVoid — מכירה שבוטלה
        // נשארת CC:Sale/Approved אבל xVoid='1'. בלי הסינון היא נקלטת כהכנסה!
        if (pick(r, 'xVoid') === '1')
            continue;
        const amount = pickAmount(r);
        if (!amount)
            continue; // 0 ⇒ אין מה לקלוט (עסקת-אימות וכד')
        const isRefund = /refund|credit/.test(cmd) || amount < 0;
        const kind = isRefund ? 'refund' : 'charge';
        writes.push({
            id: 'sola-' + safeId(ref),
            data: {
                amount: isRefund ? -Math.abs(amount) : amount,
                currency: pickCurrency(r),
                // 💎 שטח-אמת (גשש 23.8): xName לפעמים ריק וה-שם יושב ב-xBillLastName
                // ("Halberstam Sinai"); טלפון = xBillPhone עם נפילה ל-xBillMobile.
                name: pick(r, 'xName') || [pick(r, 'xBillFirstName'), pick(r, 'xBillLastName')].filter(Boolean).join(' '),
                phone: pick(r, 'xBillPhone', 'xBillMobile', 'xPhone') || '',
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
    return writes;
}
export function inner$planSolaWrites$lastDateIso$$after_loop(rows) {
    const writes = [];
    let lastDateIso = '';
    for (const r of Array.isArray(rows) ? rows : []) {
        const ref = pick(r, 'xRefNum', 'xRefnum', 'RefNum');
        const dIso = solaDateToIso(pick(r, 'xEnteredDate', 'xDate', 'xResponseDate'));
        if (dIso > lastDateIso)
            lastDateIso = dIso;
        if (!ref)
            continue; // בלי xRefNum אין דדופ — מדלגים
        if (!isApproved(r))
            continue; // נדחות/שגיאות לא נקלטות (אין כסף שזז)
        const cmd = pick(r, 'xCommand', 'xType').toLowerCase();
        // void/adjust/save אינם כסף-נכנס; capture/sale/postauth = חיוב; refund/credit = זיכוי.
        // 🐛 נחיל-סולה S4 (23.8): cc:authonly = אישור-מסגרת בלי לכידה — אין כסף שנכנס;
        // בלעדי-הסינון היה נקלט כהכנסה. (postauth כן חיוב — הרג'קס תופס authonly בלבד.)
        if (/void|save|adjust|verify|balance|authonly/.test(cmd))
            continue;
        // 💎 שטח-אמת 23.8 (הצצה #26): שורות-הדוח נושאות דגל xVoid — מכירה שבוטלה
        // נשארת CC:Sale/Approved אבל xVoid='1'. בלי הסינון היא נקלטת כהכנסה!
        if (pick(r, 'xVoid') === '1')
            continue;
        const amount = pickAmount(r);
        if (!amount)
            continue; // 0 ⇒ אין מה לקלוט (עסקת-אימות וכד')
        const isRefund = /refund|credit/.test(cmd) || amount < 0;
        const kind = isRefund ? 'refund' : 'charge';
        writes.push({
            id: 'sola-' + safeId(ref),
            data: {
                amount: isRefund ? -Math.abs(amount) : amount,
                currency: pickCurrency(r),
                // 💎 שטח-אמת (גשש 23.8): xName לפעמים ריק וה-שם יושב ב-xBillLastName
                // ("Halberstam Sinai"); טלפון = xBillPhone עם נפילה ל-xBillMobile.
                name: pick(r, 'xName') || [pick(r, 'xBillFirstName'), pick(r, 'xBillLastName')].filter(Boolean).join(' '),
                phone: pick(r, 'xBillPhone', 'xBillMobile', 'xPhone') || '',
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
    return lastDateIso;
}

export const SIGS = {
  inner$pickCurrency$raw: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pickAmount$raw: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$solaDateToIso$s: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$solaDateToIso$iso: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$solaDateToIso$iso$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$solaDateToIso$us: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$solaDateToIso$us$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$pickLast4$masked: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pickLast4$m: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pickLast4$m$$step: [{"name":"masked","d":{"t":"str"},"opt":false}],
  inner$isApproved$res: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$planSolaWrites$ref: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planSolaWrites$dIso: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planSolaWrites$cmd: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planSolaWrites$amount: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planSolaWrites$isRefund: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planSolaWrites$isRefund$$step: [{"name":"cmd","d":{"t":"str"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false}],
  inner$planSolaWrites$kind: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planSolaWrites$kind$$step: [{"name":"isRefund","d":{"t":"bool"},"opt":false}],
  inner$planSolaWrites$writes$$after_loop: [{"name":"rows","d":{"t":"arr","of":{"t":"rec","of":{"t":"any"}}},"opt":false}],
  inner$planSolaWrites$lastDateIso$$after_loop: [{"name":"rows","d":{"t":"arr","of":{"t":"rec","of":{"t":"any"}}},"opt":false}],
};
