// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/needs-care-tzedaka.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$needsCare$soon(todayIso) {
    const soon = new Date(todayIso + 'T12:00:00');
    return soon;
}

export const SIGS = {
  inner$needsCare$soon: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
};
