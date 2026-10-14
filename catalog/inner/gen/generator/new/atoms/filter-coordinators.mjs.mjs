// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/filter-coordinators.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$filterCoordinators$base(coords, onlyActive) {
    const base = onlyActive ? coords.filter((c) => c.active) : [...coords];
    return base;
}

export const SIGS = {
  inner$filterCoordinators$base: [{"name":"coords","d":{"t":"any"},"opt":false},{"name":"onlyActive","d":{"t":"any"},"opt":false}],
};
