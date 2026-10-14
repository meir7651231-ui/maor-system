// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/valid-israeli-id.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$validIsraeliId$s(id) {
    const s = String(id).trim();
    return s;
}
export function inner$validIsraeliId$p(id) {
    const s = String(id).trim();
    const p = s.padStart(9, '0');
    return p;
}
export function inner$validIsraeliId$p$$step(s) {
    const p = s.padStart(9, '0');
    return p;
}
export function inner$validIsraeliId$d(id, i) {
    const s = String(id).trim();
    const p = s.padStart(9, '0');
    let d = +p[i] * (i % 2 === 0 ? 1 : 2);
    return d;
}
export function inner$validIsraeliId$d$$step(p, i) {
    let d = +p[i] * (i % 2 === 0 ? 1 : 2);
    return d;
}
export function inner$validIsraeliId$sum$$after_loop(id) {
    const s = String(id).trim();
    const p = s.padStart(9, '0');
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let d = +p[i] * (i % 2 === 0 ? 1 : 2);
        if (d > 9)
            d -= 9;
        sum += d;
    }
    return sum;
}

export const SIGS = {
  inner$validIsraeliId$s: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$validIsraeliId$p: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$validIsraeliId$p$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$validIsraeliId$d: [{"name":"id","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$validIsraeliId$d$$step: [{"name":"p","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$validIsraeliId$sum$$after_loop: [{"name":"id","d":{"t":"any"},"opt":false}],
};
