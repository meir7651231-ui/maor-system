// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/dedup.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$nameCityKey$n(f) {
    const n = (f.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return n;
}
export function inner$nameCityKey$c(f) {
    const c = (f.city || '').trim().toLowerCase();
    return c;
}
export function inner$supNameCityKey$n(sp) {
    const n = (sp.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return n;
}
export function inner$supNameCityKey$c(sp) {
    const c = (sp.city || '').trim().toLowerCase();
    return c;
}
export function inner$dedupById$seen$$after_loop(items) {
    const seen = new Set();
    const out = [];
    for (const it of items) {
        if (seen.has(it.id))
            continue;
        seen.add(it.id);
        out.push(it);
    }
    return seen;
}
export function inner$dedupById$out$$after_loop(items) {
    const seen = new Set();
    const out = [];
    for (const it of items) {
        if (seen.has(it.id))
            continue;
        seen.add(it.id);
        out.push(it);
    }
    return out;
}

export const SIGS = {
  inner$nameCityKey$n: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$nameCityKey$c: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$supNameCityKey$n: [{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$supNameCityKey$c: [{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$dedupById$seen$$after_loop: [{"name":"items","d":{"t":"any"},"opt":false}],
  inner$dedupById$out$$after_loop: [{"name":"items","d":{"t":"any"},"opt":false}],
};
