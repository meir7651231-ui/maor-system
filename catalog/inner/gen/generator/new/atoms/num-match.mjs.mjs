// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/num-match.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$numMatch$m(q) {
    let m = q.match(/^(\d+)\s*\+$/);
    return m;
}

export const SIGS = {
  inner$numMatch$m: [{"name":"q","d":{"t":"any"},"opt":false}],
};
