// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/dedup/dedup.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hasTest$base(src) {
    const base = src.split('/').pop().replace(/\.(ts|dart|mjs)$/, '');
    return base;
}

export const SIGS = {
  inner$hasTest$base: [{"name":"src","d":{"t":"any"},"opt":false}],
};
