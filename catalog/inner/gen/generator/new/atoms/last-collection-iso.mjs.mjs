// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/last-collection-iso.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$lastCollectionIso$last$$after_loop(box) {
    let last = '';
    for (const c of box.collections)
        if (c.date > last)
            last = c.date;
    return last;
}

export const SIGS = {
  inner$lastCollectionIso$last$$after_loop: [{"name":"box","d":{"t":"any"},"opt":false}],
};
