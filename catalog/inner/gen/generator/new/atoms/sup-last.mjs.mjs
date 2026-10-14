// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sup-last.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supLast$m$$after_loop(sp) {
    let m = sp.last || '';
    for (const h of sp.hist ?? [])
        if (h.d > m)
            m = h.d;
    return m;
}

export const SIGS = {
  inner$supLast$m$$after_loop: [{"name":"sp","d":{"t":"any"},"opt":false}],
};
