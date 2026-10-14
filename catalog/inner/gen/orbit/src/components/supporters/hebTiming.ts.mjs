// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/hebTiming.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hebTimingTasks$partsOf$hit(cache, iso) {
    const hit = cache.get(iso);
    return hit;
}

export const SIGS = {
  inner$hebTimingTasks$partsOf$hit: [{"name":"cache","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["m",{"t":"str"},false],["y",{"t":"num"},false]]}},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false}],
};
