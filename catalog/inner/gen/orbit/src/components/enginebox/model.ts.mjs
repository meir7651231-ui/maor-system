// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/enginebox/model.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pickableParts$own(start) {
    const own = new Set(start.parts.map((p) => p.id));
    return own;
}

export const SIGS = {
  inner$pickableParts$own: [{"name":"start","d":{"t":"obj","n":"BoxStart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["kind",{"t":"lit","v":["product","part"]},false],["parts",{"t":"arr","of":{"t":"obj","n":"BoxPart","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"str"},false],["what",{"t":"str"},false]]}},false]]},"opt":false}],
};
