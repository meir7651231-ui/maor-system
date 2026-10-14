// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/normalize-phone.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$normalizePhone$s(raw) {
    let s = String(raw || '').replace(/[\s\-().]/g, '');
    return s;
}

export const SIGS = {
  inner$normalizePhone$s: [{"name":"raw","d":{"t":"any"},"opt":false}],
};
