// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/supporter-aggregates.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supporterAggregates$dons(sp) {
    const dons = Array.isArray(sp.donations) ? sp.donations : [];
    return dons;
}
export function inner$supporterAggregates$amt(d) {
    const amt = Number.isFinite(d.amount) ? d.amount : 0;
    return amt;
}

export const SIGS = {
  inner$supporterAggregates$dons: [{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$supporterAggregates$amt: [{"name":"d","d":{"t":"any"},"opt":false}],
};
