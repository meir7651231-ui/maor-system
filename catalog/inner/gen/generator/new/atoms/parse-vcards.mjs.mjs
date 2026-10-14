// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/parse-vcards.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$parseVcards$trimmed(line) {
    const trimmed = line.trim();
    return trimmed;
}
export function inner$parseVcards$segs(decoded) {
    const segs = decoded.split(';');
    return segs;
}
export function inner$parseVcards$v(value) {
    const v = value.trim();
    return v;
}

export const SIGS = {
  inner$parseVcards$trimmed: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseVcards$segs: [{"name":"decoded","d":{"t":"any"},"opt":false}],
  inner$parseVcards$v: [{"name":"value","d":{"t":"any"},"opt":false}],
};
