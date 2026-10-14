// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/plan-supporter-import.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$planSupporterImport$nm(r) {
    const nm = r.name.trim();
    return nm;
}
export function inner$planSupporterImport$existId(byName, key) {
    const existId = byName.get(key);
    return existId;
}
export function inner$planSupporterImport$ui(byName, updateIdx, key) {
    const existId = byName.get(key);
    const ui = updateIdx.get(existId);
    return ui;
}
export function inner$planSupporterImport$ui$$step(updateIdx, existId) {
    const ui = updateIdx.get(existId);
    return ui;
}
export function inner$planSupporterImport$idx(insertIdx, key) {
    const idx = insertIdx.get(key);
    return idx;
}

export const SIGS = {
  inner$planSupporterImport$nm: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$planSupporterImport$existId: [{"name":"byName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$planSupporterImport$ui: [{"name":"byName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"updateIdx","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$planSupporterImport$ui$$step: [{"name":"updateIdx","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"existId","d":{"t":"any"},"opt":false}],
  inner$planSupporterImport$idx: [{"name":"insertIdx","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
};
