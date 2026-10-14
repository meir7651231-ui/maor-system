// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/parse-ayin-sheet.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const clean = (x) => (x ?? '').replace(/\s+/g, ' ').trim();
export function inner$parseAyinSheet$header(rows) {
    const header = (rows[0] ?? []).map((h) => clean(h));
    return header;
}
export function inner$parseAyinSheet$supN(rows, iSup, r) {
    const row = rows[r] ?? [];
    const supN = clean(iSup >= 0 ? row[iSup] : '');
    return supN;
}
export function inner$parseAyinSheet$supN$$step(iSup, row) {
    const supN = clean(iSup >= 0 ? row[iSup] : '');
    return supN;
}
export function inner$parseAyinSheet$nm(rows, iNm, r) {
    const row = rows[r] ?? [];
    const nm = clean(row[iNm]);
    return nm;
}
export function inner$parseAyinSheet$nm$$step(iNm, row) {
    const nm = clean(row[iNm]);
    return nm;
}
export function inner$parseAyinSheet$raw(rows, iEyes, r) {
    const row = rows[r] ?? [];
    const raw = clean(row[iEyes]);
    return raw;
}
export function inner$parseAyinSheet$raw$$step(iEyes, row) {
    const raw = clean(row[iEyes]);
    return raw;
}
export function inner$parseAyinSheet$eyes(rows, iEyes, r) {
    const row = rows[r] ?? [];
    const raw = clean(row[iEyes]);
    const eyes = /^\d+$/.test(raw) ? +raw : null;
    return eyes;
}
export function inner$parseAyinSheet$eyes$$step(raw) {
    const eyes = /^\d+$/.test(raw) ? +raw : null;
    return eyes;
}
export function inner$parseAyinSheet$doneRaw(rows, iDone, r) {
    const row = rows[r] ?? [];
    const doneRaw = clean(iDone >= 0 ? row[iDone] : '');
    return doneRaw;
}
export function inner$parseAyinSheet$doneRaw$$step(iDone, row) {
    const doneRaw = clean(iDone >= 0 ? row[iDone] : '');
    return doneRaw;
}
export function inner$parseAyinSheet$paidRaw(rows, iPaid, r) {
    const row = rows[r] ?? [];
    const paidRaw = iPaid >= 0 ? clean(row[iPaid]) : '';
    return paidRaw;
}
export function inner$parseAyinSheet$paidRaw$$step(iPaid, row) {
    const paidRaw = iPaid >= 0 ? clean(row[iPaid]) : '';
    return paidRaw;
}
export function inner$parseAyinSheet$ansRaw(rows, iAns, r) {
    const row = rows[r] ?? [];
    const ansRaw = iAns >= 0 ? clean(row[iAns]) : '';
    return ansRaw;
}
export function inner$parseAyinSheet$ansRaw$$step(iAns, row) {
    const ansRaw = iAns >= 0 ? clean(row[iAns]) : '';
    return ansRaw;
}
export function inner$parseAyinSheet$leadRaw(rows, iLead, r) {
    const row = rows[r] ?? [];
    const leadRaw = iLead >= 0 ? clean(row[iLead]) : '';
    return leadRaw;
}
export function inner$parseAyinSheet$leadRaw$$step(iLead, row) {
    const leadRaw = iLead >= 0 ? clean(row[iLead]) : '';
    return leadRaw;
}

export const SIGS = {
  inner$parseAyinSheet$header: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$supN: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iSup","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$supN$$step: [{"name":"iSup","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$nm: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iNm","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$nm$$step: [{"name":"iNm","d":{"t":"any"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$raw: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iEyes","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$raw$$step: [{"name":"iEyes","d":{"t":"any"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$eyes: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iEyes","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$eyes$$step: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$doneRaw: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iDone","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$doneRaw$$step: [{"name":"iDone","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$paidRaw: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iPaid","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$paidRaw$$step: [{"name":"iPaid","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$ansRaw: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iAns","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$ansRaw$$step: [{"name":"iAns","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
  inner$parseAyinSheet$leadRaw: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"iLead","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$parseAyinSheet$leadRaw$$step: [{"name":"iLead","d":{"t":"num"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
};
