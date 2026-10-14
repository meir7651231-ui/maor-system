// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/receipt.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hebrewLocaleDate$d(iso) {
    const d = new Date(iso.slice(0, 10) + 'T12:00:00');
    return d;
}

export const SIGS = {
  inner$hebrewLocaleDate$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
};
