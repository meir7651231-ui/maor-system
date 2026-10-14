// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/nedarimDonors.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HDR = {
    zeout: 'מספר זהות',
    familyName: 'שם משפחה',
    firstName: 'שם פרטי',
    address: 'כתובת',
    city: 'עיר',
    phone: 'טלפון 1',
    phone2: 'טלפון 2',
    phone3: 'טלפון 3',
    email: 'אימייל',
    notes: 'הערות',
    toremId: 'מזהה תורם',
};
export function inner$unwrapCell$s(cell) {
    let s = String(cell == null ? '' : cell).trim();
    return s;
}
export function inner$unwrapCell$m(s) {
    const m = /^="([\s\S]*)"$/.exec(s);
    return m;
}
export function inner$parseDonorsTsv$rows(text) {
    const rows = String(text || '').split(/\r?\n/).filter((r) => r.length > 0);
    return rows;
}
export function inner$parseDonorsTsv$header(text) {
    const rows = String(text || '').split(/\r?\n/).filter((r) => r.length > 0);
    const header = rows[0].split('\t').map((h) => h.trim());
    return header;
}
export function inner$parseDonorsTsv$header$$step(rows) {
    const header = rows[0].split('\t').map((h) => h.trim());
    return header;
}
export function inner$parseDonorsTsv$cells(text, i) {
    const rows = String(text || '').split(/\r?\n/).filter((r) => r.length > 0);
    const cells = rows[i].split('\t');
    return cells;
}
export function inner$parseDonorsTsv$cells$$step(rows, i) {
    const cells = rows[i].split('\t');
    return cells;
}
export function inner$parseDonorsTsv$name(firstName, familyName) {
    const name = [firstName, familyName].filter(Boolean).join(' ').trim();
    return name;
}
export function inner$parseDonorsTsv$col$$after_loop(text) {
    const rows = String(text || '').split(/\r?\n/).filter((r) => r.length > 0);
    const header = rows[0].split('\t').map((h) => h.trim());
    const col = {};
    for (const key of Object.keys(HDR))
        col[key] = header.indexOf(HDR[key]);
    return col;
}

export const SIGS = {
  inner$unwrapCell$s: [{"name":"cell","d":{"t":"any"},"opt":false}],
  inner$unwrapCell$m: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$parseDonorsTsv$rows: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseDonorsTsv$header: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$parseDonorsTsv$header$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$parseDonorsTsv$cells: [{"name":"text","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$parseDonorsTsv$cells$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$parseDonorsTsv$name: [{"name":"firstName","d":{"t":"str"},"opt":false},{"name":"familyName","d":{"t":"str"},"opt":false}],
  inner$parseDonorsTsv$col$$after_loop: [{"name":"text","d":{"t":"str"},"opt":false}],
};
