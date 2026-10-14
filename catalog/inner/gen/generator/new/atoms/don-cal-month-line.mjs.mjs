// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/don-cal-month-line.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$donCalMonthLine$sums(mi, mu) {
    const sums = (mi ? '₪' + mi.toLocaleString('he-IL') : '') + (mi && mu ? ' + ' : '') + (mu ? '$' + mu.toLocaleString('he-IL') : '');
    return sums;
}

export const SIGS = {
  inner$donCalMonthLine$sums: [{"name":"mi","d":{"t":"num"},"opt":false},{"name":"mu","d":{"t":"num"},"opt":false}],
};
