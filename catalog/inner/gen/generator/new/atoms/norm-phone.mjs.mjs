// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/norm-phone.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$normPhone$nameCityKey$n(f) {
    const n = (f.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return n;
}
export function inner$normPhone$nameCityKey$c(f) {
    const c = (f.city || '').trim().toLowerCase();
    return c;
}
export function inner$normPhone$d(s) {
    let d = (s || '').replace(/\D/g, '');
    return d;
}

export const SIGS = {
  inner$normPhone$nameCityKey$n: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$normPhone$nameCityKey$c: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$normPhone$d: [{"name":"s","d":{"t":"any"},"opt":false}],
};
