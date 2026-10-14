// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/expiring-intakes.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$expiringIntakes$horizon(todayIso) {
    const horizon = new Date(todayIso + 'T12:00:00');
    return horizon;
}

export const SIGS = {
  inner$expiringIntakes$horizon: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
};
