// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/student-history-text.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$studentHistoryText$map$yr(h) {
    const yr = h.yearLabel ? `[${h.yearLabel}] ` : '';
    return yr;
}
export function inner$studentHistoryText$map$grp(h) {
    const grp = h.group ? ` · ${h.group}` : '';
    return grp;
}

export const SIGS = {
  inner$studentHistoryText$map$yr: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$studentHistoryText$map$grp: [{"name":"h","d":{"t":"any"},"opt":false}],
};
