// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/campaign-total.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$campaignTotal$sum$$after_loop(boxes, campaignId) {
    let sum = 0;
    for (const b of boxes)
        for (const c of b.collections)
            if (c.campaignId === campaignId)
                sum += Number.isFinite(c.amount) ? c.amount : 0;
    return sum;
}

export const SIGS = {
  inner$campaignTotal$sum$$after_loop: [{"name":"boxes","d":{"t":"any"},"opt":false},{"name":"campaignId","d":{"t":"any"},"opt":false}],
};
