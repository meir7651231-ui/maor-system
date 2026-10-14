// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/max-discount-pct.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$maxDiscountPct$c(criteria, id) {
    const c = criteria.find((x) => x.id === id);
    return c;
}
export function inner$maxDiscountPct$pct$$after_loop(criterionIds, criteria) {
    let pct = 0;
    for (const id of criterionIds) {
        const c = criteria.find((x) => x.id === id);
        if (c && Number.isFinite(c.discountPct) && c.discountPct > pct)
            pct = c.discountPct;
    }
    return pct;
}

export const SIGS = {
  inner$maxDiscountPct$c: [{"name":"criteria","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$maxDiscountPct$pct$$after_loop: [{"name":"criterionIds","d":{"t":"any"},"opt":false},{"name":"criteria","d":{"t":"any"},"opt":false}],
};
