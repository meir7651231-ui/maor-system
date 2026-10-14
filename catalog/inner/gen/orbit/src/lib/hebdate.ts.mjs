// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/hebdate.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const MONTHS = [
    ['Tishri', 'תשרי'],
    ['Heshvan', 'חשוון'],
    ['Kislev', 'כסלו'],
    ['Tevet', 'טבת'],
    ['Shevat', 'שבט'],
    ['Adar', 'אדר'],
    ['Adar I', 'אדר א׳'],
    ['Adar II', 'אדר ב׳'],
    ['Nisan', 'ניסן'],
    ['Iyar', 'אייר'],
    ['Sivan', 'סיוון'],
    ['Tamuz', 'תמוז'],
    ['Av', 'אב'],
    ['Elul', 'אלול'],
];
function monthHeOf(en) {
    return MONTHS.find((m) => m[0] === en)?.[1] ?? '';
}
function monthEnOf(he) {
    return MONTHS.find((m) => m[1] === he)?.[0] ?? null;
}
export function inner$hebToIsoEn$gy(hebYear) {
    const gy = hebYear - 3761;
    return gy;
}
export function inner$hebToIsoEn$d(hebYear, i) {
    const gy = hebYear - 3761;
    const d = new Date(gy, 7, 1 + i, 12);
    return d;
}
export function inner$hebToIsoEn$d$$step(gy, i) {
    const d = new Date(gy, 7, 1 + i, 12);
    return d;
}
export function inner$isHebLeapYear$hit(leapCache, hebYear) {
    const hit = leapCache.get(hebYear);
    return hit;
}
export function inner$hebToIso$en(monthHe) {
    const en = monthEnOf(monthHe);
    return en;
}
export function inner$isoToHebParts$d(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d;
}
export function inner$isoToHebParts$monthHe(p) {
    const monthHe = monthHeOf(p.month);
    return monthHe;
}
export function inner$validateHebMonthNames$gy(hebYear) {
    const gy = hebYear - 3761;
    return gy;
}

export const SIGS = {
  inner$hebToIsoEn$gy: [{"name":"hebYear","d":{"t":"num"},"opt":false}],
  inner$hebToIsoEn$d: [{"name":"hebYear","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$hebToIsoEn$d$$step: [{"name":"gy","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$isHebLeapYear$hit: [{"name":"leapCache","d":{"t":"map","k":{"t":"num"},"v":{"t":"bool"}},"opt":false},{"name":"hebYear","d":{"t":"num"},"opt":false}],
  inner$hebToIso$en: [{"name":"monthHe","d":{"t":"str"},"opt":false}],
  inner$isoToHebParts$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$isoToHebParts$monthHe: [{"name":"p","d":{"t":"obj","n":"HebParts","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"num"},false]]},"opt":false}],
  inner$validateHebMonthNames$gy: [{"name":"hebYear","d":{"t":"num"},"opt":false}],
};
