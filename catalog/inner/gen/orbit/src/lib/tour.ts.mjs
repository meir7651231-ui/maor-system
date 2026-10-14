// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/tour.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$tourAdvance$next(index, delta) {
    const next = index + delta;
    return next;
}
export function inner$spotlightBox$left(rect, pad) {
    const left = Math.max(0, rect.left - pad);
    return left;
}
export function inner$spotlightBox$top(rect, pad) {
    const top = Math.max(0, rect.top - pad);
    return top;
}

export const SIGS = {
  inner$tourAdvance$next: [{"name":"index","d":{"t":"num"},"opt":false},{"name":"delta","d":{"t":"num"},"opt":false}],
  inner$spotlightBox$left: [{"name":"rect","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"Rect","p":[["left",{"t":"num"},false],["top",{"t":"num"},false],["width",{"t":"num"},false],["height",{"t":"num"},false]]}]},"opt":false},{"name":"pad","d":{"t":"num"},"opt":false}],
  inner$spotlightBox$top: [{"name":"rect","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"Rect","p":[["left",{"t":"num"},false],["top",{"t":"num"},false],["width",{"t":"num"},false],["height",{"t":"num"},false]]}]},"opt":false},{"name":"pad","d":{"t":"num"},"opt":false}],
};
