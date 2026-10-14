// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/courses/retention.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$dropoutInsights$map$base(minAbs, absences) {
    const base = Math.min(100, 50 + (absences - minAbs) * 12);
    return base;
}
export function inner$dropoutInsights$map$score(minAbs, absences, debt) {
    const base = Math.min(100, 50 + (absences - minAbs) * 12);
    const score = Math.min(100, base + (debt > 0 ? 10 : 0));
    return score;
}
export function inner$dropoutInsights$map$score$$step(debt, base) {
    const score = Math.min(100, base + (debt > 0 ? 10 : 0));
    return score;
}
export function inner$dropoutInsights$map$reasonParts(absences) {
    const reasonParts = [absences + ' חיסורים שנצברו'];
    return reasonParts;
}

export const SIGS = {
  inner$dropoutInsights$map$base: [{"name":"minAbs","d":{"t":"num"},"opt":false},{"name":"absences","d":{"t":"num"},"opt":false}],
  inner$dropoutInsights$map$score: [{"name":"minAbs","d":{"t":"num"},"opt":false},{"name":"absences","d":{"t":"num"},"opt":false},{"name":"debt","d":{"t":"num"},"opt":false}],
  inner$dropoutInsights$map$score$$step: [{"name":"debt","d":{"t":"num"},"opt":false},{"name":"base","d":{"t":"num"},"opt":false}],
  inner$dropoutInsights$map$reasonParts: [{"name":"absences","d":{"t":"num"},"opt":false}],
};
