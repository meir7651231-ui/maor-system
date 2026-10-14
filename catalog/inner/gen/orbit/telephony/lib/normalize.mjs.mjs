// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/normalize.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$toE164$hadPlus(raw) {
    const hadPlus = raw.trim().startsWith('+');
    return hadPlus;
}
export function inner$toE164$d(raw) {
    let d = raw.replace(/[^\d]/g, '');
    return d;
}
export function inner$toE164$local(d) {
    const local = d.replace(/^0+/, '');
    return local;
}

export const SIGS = {
  inner$toE164$hadPlus: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$toE164$d: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$toE164$local: [{"name":"d","d":{"t":"str"},"opt":false}],
};
