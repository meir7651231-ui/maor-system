// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/portfolio-portfolio-intel.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const _shiftIso = (iso, days) => new Date(Date.parse(iso.slice(0, 10) + 'T12:00:00') + days * 86_400_000).toISOString().slice(0, 10);
export function inner$portfolioIntel$in30(todayIso) {
    const in30 = _shiftIso(todayIso, 30);
    return in30;
}
export function inner$portfolioIntel$in90(todayIso) {
    const in90 = _shiftIso(todayIso, 90);
    return in90;
}
export function inner$portfolioIntel$top$$after_loop(topN, ltvs) {
    let top = 0;
    for (let i = 0; i < Math.min(topN, ltvs.length); i++)
        top += ltvs[i];
    return top;
}

export const SIGS = {
  inner$portfolioIntel$in30: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$portfolioIntel$in90: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$portfolioIntel$top$$after_loop: [{"name":"topN","d":{"t":"num"},"opt":false},{"name":"ltvs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
