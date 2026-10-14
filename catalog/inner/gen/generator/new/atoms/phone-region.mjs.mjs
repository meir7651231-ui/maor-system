// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/phone-region.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$phoneRegion$s(raw) {
    const s = (raw || '').replace(/[^\d+]/g, '');
    return s;
}
export function inner$phoneRegion$d(raw) {
    const s = (raw || '').replace(/[^\d+]/g, '');
    const d = s.replace(/\D/g, '');
    return d;
}
export function inner$phoneRegion$d$$step(s) {
    const d = s.replace(/\D/g, '');
    return d;
}

export const SIGS = {
  inner$phoneRegion$s: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$phoneRegion$d: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$phoneRegion$d$$step: [{"name":"s","d":{"t":"any"},"opt":false}],
};
