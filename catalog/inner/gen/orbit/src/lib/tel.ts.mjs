// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/tel.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$telHref$cleaned(phone) {
    const cleaned = (phone || '').replace(/[^\d+]/g, '');
    return cleaned;
}
export function inner$telHref$digits(phone) {
    const cleaned = (phone || '').replace(/[^\d+]/g, '');
    const digits = cleaned.replace(/\D/g, '');
    return digits;
}
export function inner$telHref$digits$$step(cleaned) {
    const digits = cleaned.replace(/\D/g, '');
    return digits;
}

export const SIGS = {
  inner$telHref$cleaned: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$telHref$digits: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$telHref$digits$$step: [{"name":"cleaned","d":{"t":"str"},"opt":false}],
};
