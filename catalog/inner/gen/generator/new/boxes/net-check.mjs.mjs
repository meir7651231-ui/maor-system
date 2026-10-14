// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/net-check.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const BUST_PREFIX = 'netcheck=';
export function inner$targets$bust(randToken) {
    const bust = BUST_PREFIX + randToken;
    return bust;
}

export const SIGS = {
  inner$targets$bust: [{"name":"randToken","d":{"t":"any"},"opt":false}],
};
