// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/widgetLayout.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$shiftId$from(list, id) {
    const from = list.indexOf(id);
    return from;
}
export function inner$shiftId$to(list, id, dir) {
    const from = list.indexOf(id);
    const to = from + dir;
    return to;
}
export function inner$shiftId$to$$step(dir, from) {
    const to = from + dir;
    return to;
}
export function inner$sanitizeIds$out$$after_loop(raw, allowed) {
    const out = [];
    for (const id of raw)
        if (allowed.includes(id) && !out.includes(id))
            out.push(id);
    return out;
}

export const SIGS = {
  inner$shiftId$from: [{"name":"list","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$shiftId$to: [{"name":"list","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false},{"name":"dir","d":{"t":"lit","v":[1,-1]},"opt":false}],
  inner$shiftId$to$$step: [{"name":"dir","d":{"t":"lit","v":[1,-1]},"opt":false},{"name":"from","d":{"t":"num"},"opt":false}],
  inner$sanitizeIds$out$$after_loop: [{"name":"raw","d":{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},"opt":false},{"name":"allowed","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
