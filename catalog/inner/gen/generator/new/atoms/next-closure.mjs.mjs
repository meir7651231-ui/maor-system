// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/next-closure.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$nextClosure$cityHe(CITIES, tel) {
    const cityHe = (tel.city && CITIES[tel.city]) ? CITIES[tel.city].he : CITIES.jerusalem.he;
    return cityHe;
}

export const SIGS = {
  inner$nextClosure$cityHe: [{"name":"CITIES","d":{"t":"any"},"opt":false},{"name":"tel","d":{"t":"any"},"opt":false}],
};
