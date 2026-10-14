// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/default-course-dates.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$defaultCourseDates$d(today, T) {
    const d = new Date(today.slice(0, T.k1) + 'T12:00:00');
    return d;
}
export function inner$defaultCourseDates$startYear(y, m) {
    const startYear = m >= 7 ? y : y - 1;
    return startYear;
}

export const SIGS = {
  inner$defaultCourseDates$d: [{"name":"today","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$defaultCourseDates$startYear: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false}],
};
