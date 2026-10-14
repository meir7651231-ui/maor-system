// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/smart-filter.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$smartFilter$out(scored) {
    const out = scored.map((x) => x.it);
    return out;
}

export const SIGS = {
  inner$smartFilter$out: [{"name":"scored","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
