// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/rule-plural.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$rulePlural$stem(nq) {
    const stem = nq.slice(0, -2);
    return stem;
}

export const SIGS = {
  inner$rulePlural$stem: [{"name":"nq","d":{"t":"any"},"opt":false}],
};
