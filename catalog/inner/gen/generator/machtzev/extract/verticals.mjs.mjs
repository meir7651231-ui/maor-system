// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/verticals.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$block(arr, ids, m, i) {
    const block = arr.slice(m.index, i + 1 < ids.length ? ids[i + 1].index : arr.length);
    return block;
}
export function inner$forEach$terms(arr, ids, m, i) {
    const block = arr.slice(m.index, i + 1 < ids.length ? ids[i + 1].index : arr.length);
    const terms = block.match(/terms:\s*\{([\s\S]*?)\n\s{4}\}/);
    return terms;
}
export function inner$forEach$terms$$step(block) {
    const terms = block.match(/terms:\s*\{([\s\S]*?)\n\s{4}\}/);
    return terms;
}

export const SIGS = {
  inner$forEach$block: [{"name":"arr","d":{"t":"any"},"opt":false},{"name":"ids","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$forEach$terms: [{"name":"arr","d":{"t":"any"},"opt":false},{"name":"ids","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$forEach$terms$$step: [{"name":"block","d":{"t":"any"},"opt":false}],
};
