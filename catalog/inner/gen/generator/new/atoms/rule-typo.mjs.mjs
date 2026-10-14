// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/rule-typo.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ruleTypo$max(nt) {
    const max = nt.length >= 6 ? 2 : 1;
    return max;
}

export const SIGS = {
  inner$ruleTypo$max: [{"name":"nt","d":{"t":"any"},"opt":false}],
};
