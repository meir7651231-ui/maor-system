// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/phone-issue.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const digits = (x) => (x || '').replace(/\D/g, '');
export function inner$phoneIssue$d(p) {
    const d = digits(p);
    return d;
}

export const SIGS = {
  inner$phoneIssue$d: [{"name":"p","d":{"t":"any"},"opt":false}],
};
