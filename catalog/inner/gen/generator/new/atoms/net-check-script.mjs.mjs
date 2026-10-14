// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/net-check-script.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$netCheckScript$blocked(results) {
    const blocked = results.filter((r) => !r.ok);
    return blocked;
}

export const SIGS = {
  inner$netCheckScript$blocked: [{"name":"results","d":{"t":"any"},"opt":false}],
};
