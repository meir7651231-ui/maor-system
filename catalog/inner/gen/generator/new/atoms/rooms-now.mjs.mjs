// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/rooms-now.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$roomsNow$toMin$h(t) {
    const [h, m] = t.split(':').map(Number);
    return h;
}
export function inner$roomsNow$toMin$m(t) {
    const [h, m] = t.split(':').map(Number);
    return m;
}

export const SIGS = {
  inner$roomsNow$toMin$h: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$roomsNow$toMin$m: [{"name":"t","d":{"t":"any"},"opt":false}],
};
