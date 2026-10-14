// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/lessons-in-term.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const WEEKS_PER_MONTH = 52 / 12;
export function inner$lessonsInTerm$f(freq) {
    const f = Math.max(0, Number.isFinite(freq) ? freq : 0);
    return f;
}
export function inner$lessonsInTerm$perWeek(freq, unit, T) {
    const f = Math.max(0, Number.isFinite(freq) ? freq : 0);
    const perWeek = unit === T.k1 ? f : f / WEEKS_PER_MONTH;
    return perWeek;
}
export function inner$lessonsInTerm$perWeek$$step(unit, T, f) {
    const perWeek = unit === T.k1 ? f : f / WEEKS_PER_MONTH;
    return perWeek;
}
export function inner$lessonsInTerm$perMonth(freq, unit, T) {
    const f = Math.max(0, Number.isFinite(freq) ? freq : 0);
    const perMonth = unit === T.k2 ? f : f * WEEKS_PER_MONTH;
    return perMonth;
}
export function inner$lessonsInTerm$perMonth$$step(unit, T, f) {
    const perMonth = unit === T.k2 ? f : f * WEEKS_PER_MONTH;
    return perMonth;
}
export function inner$lessonsInTerm$n(months) {
    const n = Math.max(1, months || 1);
    return n;
}

export const SIGS = {
  inner$lessonsInTerm$f: [{"name":"freq","d":{"t":"any"},"opt":false}],
  inner$lessonsInTerm$perWeek: [{"name":"freq","d":{"t":"any"},"opt":false},{"name":"unit","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$lessonsInTerm$perWeek$$step: [{"name":"unit","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"num"},"opt":false}],
  inner$lessonsInTerm$perMonth: [{"name":"freq","d":{"t":"any"},"opt":false},{"name":"unit","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$lessonsInTerm$perMonth$$step: [{"name":"unit","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"num"},"opt":false}],
  inner$lessonsInTerm$n: [{"name":"months","d":{"t":"num"},"opt":false}],
};
