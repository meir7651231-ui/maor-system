// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/pending-deliveries-today.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pendingDeliveriesToday$openDays(db, todayIso) {
    const openDays = new Set(db.distributionDays.filter((d) => d.date <= todayIso && !d.closed).map((d) => d.id));
    return openDays;
}

export const SIGS = {
  inner$pendingDeliveriesToday$openDays: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"num"},"opt":false}],
};
