// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/sefer/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$note$key(dept, ent, idx) {
    const key = dept + '|' + ent + '|' + idx;
    return key;
}
export function inner$note$h(handHit, dept, ent, rule) {
    const h = handHit.find(x => x[0] === dept && x[1] === ent && rule.startsWith(x[2].slice(0, 12)));
    return h;
}
export function inner$entHtml$req(e) {
    const req = e.fields.filter(f => f.req);
    return req;
}
export function inner$entHtml$shapes(e) {
    const shapes = [...new Set(e.fields.map(f => f.shape).filter(Boolean))];
    return shapes;
}

export const SIGS = {
  inner$note$key: [{"name":"dept","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"idx","d":{"t":"any"},"opt":false}],
  inner$note$h: [{"name":"handHit","d":{"t":"arr","of":{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"any"}]}}},"opt":false},{"name":"dept","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false},{"name":"rule","d":{"t":"any"},"opt":false}],
  inner$entHtml$req: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$entHtml$shapes: [{"name":"e","d":{"t":"any"},"opt":false}],
};
