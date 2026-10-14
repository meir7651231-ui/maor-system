// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/WarehouseBoard.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$WarehouseBoard$shortCount(rows) {
    const shortCount = rows.filter((r) => r.short).length;
    return shortCount;
}

export const SIGS = {
  inner$WarehouseBoard$shortCount: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"WarehouseAllocation","p":[["item",{"t":"obj","n":"WarehouseItem","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["unit",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]},false],["allocated",{"t":"num"},false],["remaining",{"t":"num"},false],["short",{"t":"bool"},false],["byProject",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["qty",{"t":"num"},false]]}},false]]}},"opt":false}],
};
