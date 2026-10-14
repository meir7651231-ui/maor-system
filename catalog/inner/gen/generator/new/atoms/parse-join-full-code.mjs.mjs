// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/parse-join-full-code.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$parseJoinFullCode$t(full) {
    const t = full.trim();
    return t;
}
export function inner$parseJoinFullCode$dot(full) {
    const t = full.trim();
    const dot = t.indexOf('.');
    return dot;
}
export function inner$parseJoinFullCode$dot$$step(t) {
    const dot = t.indexOf('.');
    return dot;
}
export function inner$parseJoinFullCode$slug(full) {
    const t = full.trim();
    const dot = t.indexOf('.');
    const slug = t.slice(0, dot).trim().toLowerCase();
    return slug;
}
export function inner$parseJoinFullCode$slug$$step(t, dot) {
    const slug = t.slice(0, dot).trim().toLowerCase();
    return slug;
}
export function inner$parseJoinFullCode$code(full) {
    const t = full.trim();
    const dot = t.indexOf('.');
    const code = t.slice(dot + 1).trim();
    return code;
}
export function inner$parseJoinFullCode$code$$step(t, dot) {
    const code = t.slice(dot + 1).trim();
    return code;
}

export const SIGS = {
  inner$parseJoinFullCode$t: [{"name":"full","d":{"t":"any"},"opt":false}],
  inner$parseJoinFullCode$dot: [{"name":"full","d":{"t":"any"},"opt":false}],
  inner$parseJoinFullCode$dot$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$parseJoinFullCode$slug: [{"name":"full","d":{"t":"any"},"opt":false}],
  inner$parseJoinFullCode$slug$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"dot","d":{"t":"any"},"opt":false}],
  inner$parseJoinFullCode$code: [{"name":"full","d":{"t":"any"},"opt":false}],
  inner$parseJoinFullCode$code$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"dot","d":{"t":"num"},"opt":false}],
};
