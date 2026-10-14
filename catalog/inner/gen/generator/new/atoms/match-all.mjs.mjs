// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/match-all.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$matchAll$stillOpen(allOpen, used) {
    const pool = [...allOpen];
    const stillOpen = pool.filter((r) => !used.has(r.plan.id));
    return stillOpen;
}
export function inner$matchAll$stillOpen$$step(used, pool) {
    const stillOpen = pool.filter((r) => !used.has(r.plan.id));
    return stillOpen;
}

export const SIGS = {
  inner$matchAll$stillOpen: [{"name":"allOpen","d":{"t":"any"},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$matchAll$stillOpen$$step: [{"name":"used","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"pool","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
