// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/format-israeli-phone.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$formatIsraeliPhone$s(raw) {
    const s = String(raw || '').trim();
    return s;
}
export function inner$formatIsraeliPhone$d(raw) {
    const s = String(raw || '').trim();
    let d = s.replace(/\D/g, '');
    return d;
}
export function inner$formatIsraeliPhone$d$$step(s) {
    let d = s.replace(/\D/g, '');
    return d;
}

export const SIGS = {
  inner$formatIsraeliPhone$s: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$formatIsraeliPhone$d: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$formatIsraeliPhone$d$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
};
