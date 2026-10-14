// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/enroll-summary.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$enrollSummary$noshow(e) {
    const noshow = (e.absences ?? []).filter((a) => a.noshow).length;
    return noshow;
}
export function inner$enrollSummary$lastPresent(e) {
    const lastPresent = (e.presents ?? []).slice().sort().slice(-1)[0] ?? '';
    return lastPresent;
}

export const SIGS = {
  inner$enrollSummary$noshow: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$enrollSummary$lastPresent: [{"name":"e","d":{"t":"any"},"opt":false}],
};
