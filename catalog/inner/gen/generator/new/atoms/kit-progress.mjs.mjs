// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/kit-progress.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$kitProgress$done(a) {
    const kit = a?.kit || [];
    const done = kit.reduce((n, k) => n + (k.done ? 1 : 0), 0);
    return done;
}
export function inner$kitProgress$done$$step(kit) {
    const done = kit.reduce((n, k) => n + (k.done ? 1 : 0), 0);
    return done;
}

export const SIGS = {
  inner$kitProgress$done: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$kitProgress$done$$step: [{"name":"kit","d":{"t":"any"},"opt":false}],
};
