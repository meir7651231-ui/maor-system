// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/nl-spec.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const heWords = (s) => [...(s || '').matchAll(/[֐-׿][֐-׿'"׳״]*/g)].map((m) => m[0]);
export function inner$nlToSpec$t(text) {
    const t = String(text || '').replace(/[•]/g, ' ');
    return t;
}
export function inner$nlToSpec$clauses(text) {
    const t = String(text || '').replace(/[•]/g, ' ');
    const clauses = t.split(/[.;\n]+/).map((c) => c.trim()).filter((c) => heWords(c).length);
    return clauses;
}
export function inner$nlToSpec$clauses$$step(t) {
    const clauses = t.split(/[.;\n]+/).map((c) => c.trim()).filter((c) => heWords(c).length);
    return clauses;
}
export function inner$nlToSpec$clause(IMPLIED, EACH_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    return clause;
}
export function inner$nlToSpec$iParts(IMPLIED, EACH_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    return iParts;
}
export function inner$nlToSpec$iParts$$step(INTRO_RE, clause) {
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    return iParts;
}
export function inner$nlToSpec$work(IMPLIED, EACH_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    return work;
}
export function inner$nlToSpec$work$$step(clause, iParts) {
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    return work;
}
export function inner$nlToSpec$seg(IMPLIED, EACH_RE, MARK_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    const seg = MARK_RE ? work.split(MARK_RE) : [work];
    return seg;
}
export function inner$nlToSpec$seg$$step(MARK_RE, work) {
    const seg = MARK_RE ? work.split(MARK_RE) : [work];
    return seg;
}
export function inner$nlToSpec$tailStr(IMPLIED, EACH_RE, MARK_RE, INTRO_RE, rawClause) {
    const clause = EACH_RE ? rawClause.replace(EACH_RE, (m, w) => ` , ${w} ${IMPLIED} `) : rawClause;
    const iParts = INTRO_RE ? clause.split(INTRO_RE) : [clause];
    const work = iParts.length > 1 ? iParts.slice(1).join(' ') : clause;
    const seg = MARK_RE ? work.split(MARK_RE) : [work];
    const tailStr = seg.slice(1).join(' ');
    return tailStr;
}
export function inner$nlToSpec$tailStr$$step(seg) {
    const tailStr = seg.slice(1).join(' ');
    return tailStr;
}
export function inner$nlToSpec$prev(byStem, key) {
    const prev = byStem.get(key);
    return prev;
}

export const SIGS = {
  inner$nlToSpec$t: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$nlToSpec$clauses: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$nlToSpec$clauses$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$clause: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$iParts: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$iParts$$step: [{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"clause","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$work: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$work$$step: [{"name":"clause","d":{"t":"str"},"opt":false},{"name":"iParts","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$nlToSpec$seg: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"MARK_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$seg$$step: [{"name":"MARK_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"work","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$tailStr: [{"name":"IMPLIED","d":{"t":"any"},"opt":false},{"name":"EACH_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"MARK_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"INTRO_RE","d":{"t":"or","of":[{"t":"null"},{"t":"any"}]},"opt":false},{"name":"rawClause","d":{"t":"str"},"opt":false}],
  inner$nlToSpec$tailStr$$step: [{"name":"seg","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$nlToSpec$prev: [{"name":"byStem","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
};
