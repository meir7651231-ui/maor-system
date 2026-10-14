// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/gen-screen.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$expr$e(v) {
    const e = v.slice(2).trim();
    return e;
}
export function inner$expr$n(v) {
    const [n, t] = v.slice(2).trim().split('|');
    return n;
}
export function inner$expr$t(v) {
    const [n, t] = v.slice(2).trim().split('|');
    return t;
}
export function inner$expr$n_L58(v) {
    const n = v.slice(2).trim();
    return n;
}
export function inner$expr$t_L59(v) {
    const n = v.slice(2).trim();
    const t = /radius|size|width|height|space|pill/i.test(n) ? 'double' : 'Color';
    return t;
}
export function inner$expr$t_L59$$step(n) {
    const t = /radius|size|width|height|space|pill/i.test(n) ? 'double' : 'Color';
    return t;
}
export function inner$sectionCode$fields(s, A) {
    const fields = Object.entries(s.props || {}).filter(([, v]) => v === '~:')
        .map(([k]) => ({ name: k, type: (A.types.get(k) || 'String').replace(/\?$/, '') }));
    return fields;
}
export function inner$sectionCode$listName(rptItem) {
    const listName = rptItem.charAt(0).toLowerCase() + rptItem.slice(1) + 's';
    return listName;
}
export function inner$sectionCode$valOf$t(v) {
    const t = v.slice(2).trim() || 'String';
    return t;
}
export function inner$sectionCode$w(s, posLines, namedLines) {
    const propLines = [...posLines, ...namedLines];
    let w = `${s.atom}(\n            ${propLines.join('\n            ')}\n          )`;
    return w;
}
export function inner$sectionCode$w$$step(s, propLines) {
    let w = `${s.atom}(\n            ${propLines.join('\n            ')}\n          )`;
    return w;
}
export function inner$sectionCode$inner(s, w) {
    const inner = s.repeat ? `Column(children: [\n        ${w}\n      ])` : w;
    return inner;
}

export const SIGS = {
  inner$expr$e: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$expr$n: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$expr$t: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$expr$n_L58: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$expr$t_L59: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$expr$t_L59$$step: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$sectionCode$fields: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"A","d":{"t":"any"},"opt":false}],
  inner$sectionCode$listName: [{"name":"rptItem","d":{"t":"any"},"opt":false}],
  inner$sectionCode$valOf$t: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$sectionCode$w: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"posLines","d":{"t":"any"},"opt":false},{"name":"namedLines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$sectionCode$w$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"propLines","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$sectionCode$inner: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"w","d":{"t":"str"},"opt":false}],
};
