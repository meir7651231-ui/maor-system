// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/kushya.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$answerAll$tag(k) {
    const tag = `${k.kind || ''} ${String(k.text || '').split(':')[0]}`;
    return tag;
}
export function inner$answerAll$mine(REG, k) {
    const tag = `${k.kind || ''} ${String(k.text || '').split(':')[0]}`;
    const mine = REG.filter((r) => r.kinds.some((w) => tag.includes(w)));
    return mine;
}
export function inner$answerAll$mine$$step(REG, tag) {
    const mine = REG.filter((r) => r.kinds.some((w) => tag.includes(w)));
    return mine;
}

export const SIGS = {
  inner$answerAll$tag: [{"name":"k","d":{"t":"any"},"opt":false}],
  inner$answerAll$mine: [{"name":"REG","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$answerAll$mine$$step: [{"name":"REG","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"tag","d":{"t":"str"},"opt":false}],
};
