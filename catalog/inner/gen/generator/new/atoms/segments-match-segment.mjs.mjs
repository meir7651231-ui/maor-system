// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/segments-match-segment.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$matchSegment$def(key, SEGMENTS) {
    const def = SEGMENTS.find((s) => s.key === key);
    return def;
}

export const SIGS = {
  inner$matchSegment$def: [{"name":"key","d":{"t":"any"},"opt":false},{"name":"SEGMENTS","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"any"},false],["match",{"t":"fn"},false]]}},"opt":false}],
};
