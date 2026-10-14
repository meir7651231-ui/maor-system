// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/excel-serial-to-iso.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$excelSerialToIso$dt(serial, T) {
    const dt = new Date(Math.round((serial - T.k1) * T.k2));
    return dt;
}
export function inner$excelSerialToIso$mo(serial, T) {
    const dt = new Date(Math.round((serial - T.k1) * T.k2));
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    return mo;
}
export function inner$excelSerialToIso$mo$$step(dt) {
    const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
    return mo;
}
export function inner$excelSerialToIso$da(serial, T) {
    const dt = new Date(Math.round((serial - T.k1) * T.k2));
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return da;
}
export function inner$excelSerialToIso$da$$step(dt) {
    const da = String(dt.getUTCDate()).padStart(2, '0');
    return da;
}

export const SIGS = {
  inner$excelSerialToIso$dt: [{"name":"serial","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$excelSerialToIso$mo: [{"name":"serial","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$excelSerialToIso$mo$$step: [{"name":"dt","d":{"t":"date"},"opt":false}],
  inner$excelSerialToIso$da: [{"name":"serial","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$excelSerialToIso$da$$step: [{"name":"dt","d":{"t":"date"},"opt":false}],
};
