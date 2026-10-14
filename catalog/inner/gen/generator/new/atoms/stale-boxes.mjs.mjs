// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/stale-boxes.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$staleBoxes$cutoff(todayIso) {
    const cutoff = new Date(todayIso + 'T12:00:00');
    return cutoff;
}

export const SIGS = {
  inner$staleBoxes$cutoff: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
};
