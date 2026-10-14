// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sanitize-incoming.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$sanitizeIncoming$out$$after_loop(item, fields) {
    let out = item;
    for (const f of fields) {
        if (!Array.isArray(out[f]))
            out = { ...out, [f]: [] };
    }
    return out;
}

export const SIGS = {
  inner$sanitizeIncoming$out$$after_loop: [{"name":"item","d":{"t":"any"},"opt":false},{"name":"fields","d":{"t":"any"},"opt":false}],
};
