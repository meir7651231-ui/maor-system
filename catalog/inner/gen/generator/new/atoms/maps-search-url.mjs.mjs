// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/maps-search-url.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function cleanStop(s) {
    return (s || '').replace(/\|/g, ' ').trim();
}
export function inner$mapsSearchUrl$q(address, city) {
    const q = [address, city].map(cleanStop).filter(Boolean).join(', ');
    return q;
}

export const SIGS = {
  inner$mapsSearchUrl$q: [{"name":"address","d":{"t":"any"},"opt":false},{"name":"city","d":{"t":"str"},"opt":false}],
};
