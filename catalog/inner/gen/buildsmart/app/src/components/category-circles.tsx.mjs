// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/category-circles.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CategoryCircles$isRoot(path) {
    const isRoot = path.length === 0;
    return isRoot;
}

export const SIGS = {
  inner$CategoryCircles$isRoot: [{"name":"path","d":{"t":"any"},"opt":false}],
};
