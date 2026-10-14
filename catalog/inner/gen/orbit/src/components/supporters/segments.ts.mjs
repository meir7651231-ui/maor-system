// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/segments.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$matchSegment$def(SEGMENTS, key) {
    const def = SEGMENTS.find((s) => s.key === key);
    return def;
}

export const SIGS = {
  inner$matchSegment$def: [{"name":"SEGMENTS","d":{"t":"arr","of":{"t":"obj","n":"SegmentDef","p":[["key",{"t":"lit","v":["hok","atrisk","goldsilent","gave12m","noemail"]},false],["label",{"t":"str"},false],["dot",{"t":"str"},false],["match",{"t":"fn"},false]]}},"opt":false},{"name":"key","d":{"t":"lit","v":["hok","atrisk","goldsilent","gave12m","noemail"]},"opt":false}],
};
