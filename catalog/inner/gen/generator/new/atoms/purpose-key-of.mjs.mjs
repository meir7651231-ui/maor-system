// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/purpose-key-of.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$purposeKeyOf$p(d) {
    const p = (d.purpose ?? '').trim();
    return p;
}

export const SIGS = {
  inner$purposeKeyOf$p: [{"name":"d","d":{"t":"any"},"opt":false}],
};
