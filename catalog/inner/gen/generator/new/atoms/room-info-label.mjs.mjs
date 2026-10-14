// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/room-info-label.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$roomInfoLabel$eqOn(room) {
    const eqOn = Object.entries(room.eq || {})
        .filter(([, v]) => v)
        .map(([k]) => k);
    return eqOn;
}

export const SIGS = {
  inner$roomInfoLabel$eqOn: [{"name":"room","d":{"t":"any"},"opt":false}],
};
