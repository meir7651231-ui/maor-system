// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/search/results-list.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ResultsList$q(searchQuery) {
    const q = searchQuery.value.trim();
    return q;
}

export const SIGS = {
  inner$ResultsList$q: [{"name":"searchQuery","d":{"t":"any"},"opt":false}],
};
