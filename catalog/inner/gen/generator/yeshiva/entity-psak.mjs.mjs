// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/entity-psak.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const lawIsEntity = (w) => `«${w}» היא מילת-ישות`;
const lawClass = (w, cls) => `«${w}» ⇒ ${cls}`;
export function inner$encodeWord$best(cands) {
    const best = Math.max(...cands.map((c) => c.score));
    return best;
}
export function inner$encodeWord$LE(word) {
    const LE = lawIsEntity(word);
    return LE;
}
export function inner$encodeWord$law(word, c) {
    const law = lawClass(word, c.cls);
    return law;
}
export function inner$foldAnswers$by(answers) {
    const by = new Map(answers.map((a) => [a.law, a]));
    return by;
}
export function inner$foldAnswers$ent(word, answers) {
    const by = new Map(answers.map((a) => [a.law, a]));
    const ent = by.get(lawIsEntity(word));
    return ent;
}
export function inner$foldAnswers$ent$$step(word, by) {
    const ent = by.get(lawIsEntity(word));
    return ent;
}
export function inner$foldAnswers$yes(word, cands, answers) {
    const by = new Map(answers.map((a) => [a.law, a]));
    const yes = cands.filter((c) => (by.get(lawClass(word, c.cls)) || {}).outcome === true).map((c) => c.cls);
    return yes;
}
export function inner$foldAnswers$yes$$step(word, cands, by) {
    const yes = cands.filter((c) => (by.get(lawClass(word, c.cls)) || {}).outcome === true).map((c) => c.cls);
    return yes;
}
export function inner$foldAnswers$none(word, cands, answers) {
    const by = new Map(answers.map((a) => [a.law, a]));
    const none = cands.filter((c) => (by.get(lawClass(word, c.cls)) || {}).outcome === null).map((c) => c.cls);
    return none;
}
export function inner$foldAnswers$none$$step(word, cands, by) {
    const none = cands.filter((c) => (by.get(lawClass(word, c.cls)) || {}).outcome === null).map((c) => c.cls);
    return none;
}
export function inner$map$a(w, mine, c) {
    const a = mine.find((x) => x.law === lawClass(w, c.cls));
    return a;
}
export function inner$map$o(w, mine, c) {
    const a = mine.find((x) => x.law === lawClass(w, c.cls));
    const o = a ? a.outcome : undefined;
    return o;
}
export function inner$map$o$$step(a) {
    const o = a ? a.outcome : undefined;
    return o;
}

export const SIGS = {
  inner$encodeWord$best: [{"name":"cands","d":{"t":"any"},"opt":false}],
  inner$encodeWord$LE: [{"name":"word","d":{"t":"any"},"opt":false}],
  inner$encodeWord$law: [{"name":"word","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$foldAnswers$by: [{"name":"answers","d":{"t":"any"},"opt":false}],
  inner$foldAnswers$ent: [{"name":"word","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false}],
  inner$foldAnswers$ent$$step: [{"name":"word","d":{"t":"any"},"opt":false},{"name":"by","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$foldAnswers$yes: [{"name":"word","d":{"t":"any"},"opt":false},{"name":"cands","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false}],
  inner$foldAnswers$yes$$step: [{"name":"word","d":{"t":"any"},"opt":false},{"name":"cands","d":{"t":"any"},"opt":false},{"name":"by","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$foldAnswers$none: [{"name":"word","d":{"t":"any"},"opt":false},{"name":"cands","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"any"},"opt":false}],
  inner$foldAnswers$none$$step: [{"name":"word","d":{"t":"any"},"opt":false},{"name":"cands","d":{"t":"any"},"opt":false},{"name":"by","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$map$a: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$map$o: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"mine","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$map$o$$step: [{"name":"a","d":{"t":"any"},"opt":false}],
};
