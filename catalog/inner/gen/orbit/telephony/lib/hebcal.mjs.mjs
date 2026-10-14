// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/hebcal.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const isAdar = (m) => m === 'Adar' || m === 'Adar II';
export function inner$fmtFor$f(_fmt, tz) {
    let f = _fmt.get(tz);
    return f;
}
export function inner$hebParts$d(iso) {
    const d = new Date(`${iso}T12:00:00Z`);
    return d;
}
export function inner$classifyDay$shabbat(dow) {
    const shabbat = dow === 6;
    return shabbat;
}
export function inner$classifyDay$isFast(d, m, dow) {
    const isFast = (m === 'Tishri' && d === 10) || // יום כיפור
        (m === 'Tishri' && d === 3 && dow !== 6) || (m === 'Tishri' && d === 4 && dow === 0) || // צום גדליה
        (m === 'Tevet' && d === 10) || // עשרה בטבת
        (isAdar(m) && d === 13 && dow !== 6) || (isAdar(m) && d === 11 && dow === 4) || // תענית אסתר (נדחית לחמישי כש-י״ג בשבת)
        (m === 'Tammuz' && d === 17 && dow !== 6) || (m === 'Tammuz' && d === 18 && dow === 0) || // י״ז בתמוז
        (m === 'Av' && d === 9 && dow !== 6) || (m === 'Av' && d === 10 && dow === 0);
    return isFast;
}
export function inner$classifyDay$roshChodesh(d, m) {
    const roshChodesh = (d === 1 && m !== 'Tishri') || d === 30;
    return roshChodesh;
}
export function inner$addDays$d(iso) {
    const d = new Date(`${iso}T12:00:00Z`);
    return d;
}

export const SIGS = {
  inner$fmtFor$f: [{"name":"_fmt","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tz","d":{"t":"any"},"opt":false}],
  inner$hebParts$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$classifyDay$shabbat: [{"name":"dow","d":{"t":"any"},"opt":false}],
  inner$classifyDay$isFast: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"dow","d":{"t":"any"},"opt":false}],
  inner$classifyDay$roshChodesh: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$addDays$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
};
