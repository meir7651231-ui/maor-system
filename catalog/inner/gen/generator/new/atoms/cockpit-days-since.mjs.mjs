// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/cockpit-days-since.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$cockpitDaysSince$t(iso) {
    const t = new Date(iso + 'T12:00:00').getTime();
    return t;
}
export function inner$cockpitDaysSince$now(todayIso) {
    const now = new Date(todayIso + 'T12:00:00').getTime();
    return now;
}

export const SIGS = {
  inner$cockpitDaysSince$t: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$cockpitDaysSince$now: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
};
