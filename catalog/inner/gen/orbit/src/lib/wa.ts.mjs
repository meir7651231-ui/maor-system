// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/wa.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function waDigits(phone) {
    let d = (phone || '').replace(/\D/g, '');
    if (!d)
        return null;
    if (d.startsWith('00972'))
        d = '972' + d.slice(5);
    else if (d.startsWith('00'))
        d = d.slice(2); // קידומת חיוג בינ"ל כללית
    if (d.startsWith('9720'))
        d = '972' + d.slice(4); // ‎+972 שנשמר עם ה-0 המקומי
    if (!d.startsWith('972') && !d.startsWith('0') && (d.length === 8 || d.length === 9)) {
        d = '0' + d; // ישראלי בלי 0 מוביל — אותו דין כמו formatIsraeliPhone
    }
    if (d.startsWith('0')) {
        if (d.length === 9 || d.length === 10)
            d = '972' + d.slice(1);
        else
            return null; // 0-מוביל באורך אחר = לא-תקין ל-wa.me — עדיף בלי כפתור
    }
    if (d.length < 8 || d.length > 15)
        return null; // גבולות E.164
    return d;
}
function waLink(phone, text = '') {
    const digits = waDigits(phone);
    if (!digits)
        return null;
    const t = text.trim();
    return 'https://wa.me/' + digits + (t ? '?text=' + encodeURIComponent(t) : '');
}
function waAppLink(phone, text = '') {
    const digits = waDigits(phone);
    if (!digits)
        return null;
    const t = text.trim();
    return 'whatsapp://send?phone=' + digits + (t ? '&text=' + encodeURIComponent(t) : '');
}
export function inner$waDigits$d(phone) {
    let d = (phone || '').replace(/\D/g, '');
    return d;
}
export function inner$waLink$digits(phone) {
    const digits = waDigits(phone);
    return digits;
}
export function inner$waLink$t(text) {
    const t = text.trim();
    return t;
}
export function inner$waAppLink$digits(phone) {
    const digits = waDigits(phone);
    return digits;
}
export function inner$waAppLink$t(text) {
    const t = text.trim();
    return t;
}
export function inner$waHref$href(phone, text, appScheme) {
    const href = appScheme ? waAppLink(phone, text) : waLink(phone, text);
    return href;
}

export const SIGS = {
  inner$waDigits$d: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$waLink$digits: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$waLink$t: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$waAppLink$digits: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$waAppLink$t: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$waHref$href: [{"name":"phone","d":{"t":"str"},"opt":false},{"name":"text","d":{"t":"str"},"opt":false},{"name":"appScheme","d":{"t":"bool"},"opt":false}],
};
