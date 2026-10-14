// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/spotlight-box.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$spotlightBox$left(rect, pad) {
    const left = Math.max(0, rect.left - pad);
    return left;
}
export function inner$spotlightBox$top(rect, pad) {
    const top = Math.max(0, rect.top - pad);
    return top;
}

export const SIGS = {
  inner$spotlightBox$left: [{"name":"rect","d":{"t":"any"},"opt":false},{"name":"pad","d":{"t":"num"},"opt":false}],
  inner$spotlightBox$top: [{"name":"rect","d":{"t":"any"},"opt":false},{"name":"pad","d":{"t":"num"},"opt":false}],
};
