// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/presents-in-month.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$presentsInMonth$ym(todayIso) {
    const ym = todayIso.slice(0, 7);
    return ym;
}

export const SIGS = {
  inner$presentsInMonth$ym: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
};
