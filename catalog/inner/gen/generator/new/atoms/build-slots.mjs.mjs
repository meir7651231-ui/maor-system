// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/build-slots.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildSlots$step(room, T) {
    const step = room.slot > 0 ? room.slot : T.k21;
    return step;
}
export function inner$buildSlots$wd(iso) {
    const wd = new Date(iso + 'T12:00:00').getDay();
    return wd;
}

export const SIGS = {
  inner$buildSlots$step: [{"name":"room","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$buildSlots$wd: [{"name":"iso","d":{"t":"any"},"opt":false}],
};
