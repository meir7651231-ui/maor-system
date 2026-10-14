// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/shop/CriteriaPanel.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CriteriaPanel$save$pct(f) {
    const pct = f.pct.trim() === '' ? 0 : +f.pct;
    return pct;
}

export const SIGS = {
  inner$CriteriaPanel$save$pct: [{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["pct",{"t":"str"},false],["notes",{"t":"str"},false]]},"opt":false}],
};
