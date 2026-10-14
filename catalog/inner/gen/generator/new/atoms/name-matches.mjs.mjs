// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/name-matches.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$nameMatches$wa(na) {
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    return wa;
}
export function inner$nameMatches$wb(nb) {
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    return wb;
}
export function inner$nameMatches$need(na, nb) {
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    const need = wa.size === 1 && wb.size === 1 ? 1 : 2;
    return need;
}
export function inner$nameMatches$need$$step(wa, wb) {
    const need = wa.size === 1 && wb.size === 1 ? 1 : 2;
    return need;
}
export function inner$nameMatches$overlap$$after_loop(na, nb) {
    const wa = new Set(na.split(' ').filter((w) => w.length >= 2));
    const wb = new Set(nb.split(' ').filter((w) => w.length >= 2));
    let overlap = 0;
    for (const w of wa)
        if (wb.has(w))
            overlap++;
    return overlap;
}

export const SIGS = {
  inner$nameMatches$wa: [{"name":"na","d":{"t":"any"},"opt":false}],
  inner$nameMatches$wb: [{"name":"nb","d":{"t":"any"},"opt":false}],
  inner$nameMatches$need: [{"name":"na","d":{"t":"any"},"opt":false},{"name":"nb","d":{"t":"any"},"opt":false}],
  inner$nameMatches$need$$step: [{"name":"wa","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"wb","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$nameMatches$overlap$$after_loop: [{"name":"na","d":{"t":"any"},"opt":false},{"name":"nb","d":{"t":"any"},"opt":false}],
};
