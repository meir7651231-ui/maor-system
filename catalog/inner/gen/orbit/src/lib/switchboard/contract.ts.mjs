// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/switchboard/contract.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isoAt$f(isoFmts, tz) {
    let f = isoFmts.get(tz);
    return f;
}

export const SIGS = {
  inner$isoAt$f: [{"name":"isoFmts","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"DateTimeFormat","p":[["format",{"t":"fn"},false],["resolvedOptions",{"t":"fn"},false],["formatToParts",{"t":"fn"},false],["formatRange",{"t":"fn"},false],["formatRangeToParts",{"t":"fn"},false]]}},"opt":false},{"name":"tz","d":{"t":"str"},"opt":false}],
};
