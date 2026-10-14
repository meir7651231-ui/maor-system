// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/wa-digits.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$waDigits$d(phone) {
    let d = (phone || '').replace(/\D/g, '');
    return d;
}

export const SIGS = {
  inner$waDigits$d: [{"name":"phone","d":{"t":"any"},"opt":false}],
};
