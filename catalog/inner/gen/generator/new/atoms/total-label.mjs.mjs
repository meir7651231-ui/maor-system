// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/total-label.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$totalLabel$ils(i) {
    const ils = i ? '₪' + i.toLocaleString('he-IL') : '';
    return ils;
}
export function inner$totalLabel$usd(u) {
    const usd = u ? '$' + u.toLocaleString('he-IL') : '';
    return usd;
}

export const SIGS = {
  inner$totalLabel$ils: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$totalLabel$usd: [{"name":"u","d":{"t":"any"},"opt":false}],
};
