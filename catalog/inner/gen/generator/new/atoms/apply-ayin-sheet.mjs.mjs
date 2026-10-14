// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/apply-ayin-sheet.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$applyAyinSheet$arr(byId, u) {
    const arr = byId.get(u.supporterId) ?? [];
    return arr;
}
export function inner$applyAyinSheet$map$mine(byId, sp) {
    const mine = byId.get(sp.id);
    return mine;
}
export function inner$applyAyinSheet$map$rec(a, u) {
    const rec = a.names.find((n) => n.id === u.nameId);
    return rec;
}
export function inner$applyAyinSheet$byId$$after_loop(upds) {
    const byId = new Map();
    for (const u of upds) {
        const arr = byId.get(u.supporterId) ?? [];
        arr.push(u);
        byId.set(u.supporterId, arr);
    }
    return byId;
}

export const SIGS = {
  inner$applyAyinSheet$arr: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"u","d":{"t":"any"},"opt":false}],
  inner$applyAyinSheet$map$mine: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$applyAyinSheet$map$rec: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"u","d":{"t":"any"},"opt":false}],
  inner$applyAyinSheet$byId$$after_loop: [{"name":"upds","d":{"t":"any"},"opt":false}],
};
