// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/studio-full.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$map$L(s) {
    const L = s.split('\n');
    return L;
}
export function inner$map$ent(s) {
    const L = s.split('\n');
    const ent = L.filter(l => /^\s*(צור\s+)?(ישות|טופס|טבלת)(\s|$)/.test(l)).length;
    return ent;
}
export function inner$map$ent$$step(L) {
    const ent = L.filter(l => /^\s*(צור\s+)?(ישות|טופס|טבלת)(\s|$)/.test(l)).length;
    return ent;
}
export function inner$map$part(s) {
    const L = s.split('\n');
    const part = L.filter(l => /^\s*חלקיק\s/.test(l)).length;
    return part;
}
export function inner$map$part$$step(L) {
    const part = L.filter(l => /^\s*חלקיק\s/.test(l)).length;
    return part;
}
export function inner$map$cont(s) {
    const L = s.split('\n');
    const cont = L.filter(l => /^\s*תוכן\s/.test(l)).length;
    return cont;
}
export function inner$map$cont$$step(L) {
    const cont = L.filter(l => /^\s*תוכן\s/.test(l)).length;
    return cont;
}
export function inner$map$rep(s) {
    const L = s.split('\n');
    const rep = L.filter(l => /^\s*דוח\s/.test(l)).length;
    return rep;
}
export function inner$map$rep$$step(L) {
    const rep = L.filter(l => /^\s*דוח\s/.test(l)).length;
    return rep;
}
export function inner$map$dash(s) {
    const L = s.split('\n');
    const dash = L.filter(l => /^\s*(דשבורד|לוח-מחוונים)/.test(l)).length;
    return dash;
}
export function inner$map$dash$$step(L) {
    const dash = L.filter(l => /^\s*(דשבורד|לוח-מחוונים)/.test(l)).length;
    return dash;
}
export function inner$map$role(s) {
    const L = s.split('\n');
    const role = L.filter(l => /^\s*(תפקיד|הרשאת)\s/.test(l)).length;
    return role;
}
export function inner$map$role$$step(L) {
    const role = L.filter(l => /^\s*(תפקיד|הרשאת)\s/.test(l)).length;
    return role;
}
export function inner$map$fields(s) {
    const L = s.split('\n');
    const fields = L.filter(l => /^\s{2,}\S/.test(l) && !/^\s*[|#]/.test(l)).length;
    return fields;
}
export function inner$map$fields$$step(L) {
    const fields = L.filter(l => /^\s{2,}\S/.test(l) && !/^\s*[|#]/.test(l)).length;
    return fields;
}
export function inner$map$ns(f) {
    const ns = f.replace(/\.txt$/, '');
    return ns;
}
export function inner$map$c(l) {
    const c = l.split('\t');
    return c;
}

export const SIGS = {
  inner$map$L: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$ent: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$ent$$step: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$map$part: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$part$$step: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$map$cont: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$cont$$step: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$map$rep: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$rep$$step: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$map$dash: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$dash$$step: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$map$role: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$role$$step: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$map$fields: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$fields$$step: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$map$ns: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$map$c: [{"name":"l","d":{"t":"any"},"opt":false}],
};
