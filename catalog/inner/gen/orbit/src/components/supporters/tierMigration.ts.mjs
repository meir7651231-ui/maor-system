// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/tierMigration.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const MS_DAY = 86_400_000;
const TIER_RANK = { 'זהב': 4, 'כסף': 3, 'ארד': 2, 'רדומה': 1 };
function rScore(days) { return days <= 30 ? 350 : days <= 90 ? 280 : days <= 180 ? 200 : days <= 365 ? 120 : 40; }
function fScore(c) { return c >= 10 ? 300 : c >= 5 ? 230 : c >= 3 ? 160 : c >= 2 ? 100 : 50; }
function mScore(t) { return t >= 5000 ? 350 : t >= 2000 ? 280 : t >= 1000 ? 210 : t >= 500 ? 140 : t >= 100 ? 80 : 40; }
function shiftMonths(iso, monthsBack) {
    const y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    const tot = y * 12 + (m - 1) - monthsBack;
    const ny = Math.floor(tot / 12), nm = (tot % 12) + 1;
    const maxD = new Date(ny, nm, 0).getDate(); // היום-האחרון של חודש-היעד (דטרמיניסטי)
    const nd = Math.min(d, maxD);
    return ny + '-' + String(nm).padStart(2, '0') + '-' + String(nd).padStart(2, '0');
}
export function inner$tierAsOf$cut(asOfIso) {
    const cut = asOfIso.slice(0, 10);
    return cut;
}
export function inner$tierAsOf$asMs(asOfIso) {
    const cut = asOfIso.slice(0, 10);
    const asMs = Date.parse(cut + 'T12:00:00');
    return asMs;
}
export function inner$tierAsOf$asMs$$step(cut) {
    const asMs = Date.parse(cut + 'T12:00:00');
    return asMs;
}
export function inner$tierAsOf$take$d(date) {
    const d = date.slice(0, 10);
    return d;
}
export function inner$tierAsOf$days(asOfIso, last) {
    const cut = asOfIso.slice(0, 10);
    const asMs = Date.parse(cut + 'T12:00:00');
    const days = last ? Math.floor((asMs - Date.parse(last + 'T12:00:00')) / MS_DAY) : 99999;
    return days;
}
export function inner$tierAsOf$days$$step(asMs, last) {
    const days = last ? Math.floor((asMs - Date.parse(last + 'T12:00:00')) / MS_DAY) : 99999;
    return days;
}
export function inner$tierAsOf$score(asOfIso, count, ils, last) {
    const cut = asOfIso.slice(0, 10);
    const asMs = Date.parse(cut + 'T12:00:00');
    const days = last ? Math.floor((asMs - Date.parse(last + 'T12:00:00')) / MS_DAY) : 99999;
    const score = rScore(days) + fScore(count) + mScore(ils);
    return score;
}
export function inner$tierAsOf$score$$step(count, ils, days) {
    const score = rScore(days) + fScore(count) + mScore(ils);
    return score;
}
export function inner$shiftMonths$y(iso) {
    const y = +iso.slice(0, 4);
    return y;
}
export function inner$shiftMonths$m(iso) {
    const m = +iso.slice(5, 7);
    return m;
}
export function inner$shiftMonths$d(iso) {
    const d = +iso.slice(8, 10);
    return d;
}
export function inner$shiftMonths$tot(iso, monthsBack) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const tot = y * 12 + (m - 1) - monthsBack;
    return tot;
}
export function inner$shiftMonths$tot$$step(monthsBack, y, m) {
    const tot = y * 12 + (m - 1) - monthsBack;
    return tot;
}
export function inner$shiftMonths$ny(iso, monthsBack) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const tot = y * 12 + (m - 1) - monthsBack;
    const ny = Math.floor(tot / 12);
    return ny;
}
export function inner$shiftMonths$ny$$step(tot) {
    const ny = Math.floor(tot / 12);
    return ny;
}
export function inner$shiftMonths$nm(iso, monthsBack) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const tot = y * 12 + (m - 1) - monthsBack;
    const nm = (tot % 12) + 1;
    return nm;
}
export function inner$shiftMonths$nm$$step(tot) {
    const nm = (tot % 12) + 1;
    return nm;
}
export function inner$shiftMonths$maxD(iso, monthsBack) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const tot = y * 12 + (m - 1) - monthsBack;
    const ny = Math.floor(tot / 12);
    const nm = (tot % 12) + 1;
    const maxD = new Date(ny, nm, 0).getDate();
    return maxD;
}
export function inner$shiftMonths$maxD$$step(ny, nm) {
    const maxD = new Date(ny, nm, 0).getDate();
    return maxD;
}
export function inner$shiftMonths$nd(iso, monthsBack) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const d = +iso.slice(8, 10);
    const tot = y * 12 + (m - 1) - monthsBack;
    const ny = Math.floor(tot / 12);
    const nm = (tot % 12) + 1;
    const maxD = new Date(ny, nm, 0).getDate();
    const nd = Math.min(d, maxD);
    return nd;
}
export function inner$shiftMonths$nd$$step(d, maxD) {
    const nd = Math.min(d, maxD);
    return nd;
}
export function inner$tierMigration$fromIso(todayIso, monthsBack) {
    const fromIso = shiftMonths(todayIso.slice(0, 10), monthsBack);
    return fromIso;
}
export function inner$tierMigration$diff(to, from) {
    const diff = TIER_RANK[to] - TIER_RANK[from];
    return diff;
}
export function inner$tierMigration$key(to, from) {
    const key = from + '→' + to;
    return key;
}
export function inner$tierMigration$row(flowMap, to, from) {
    const key = from + '→' + to;
    const row = flowMap.get(key);
    return row;
}
export function inner$tierMigration$row$$step(flowMap, key) {
    const row = flowMap.get(key);
    return row;
}
export function inner$tierMigration$flows(flowMap) {
    const flows = [...flowMap.values()].sort((a, b) => b.count - a.count);
    return flows;
}

export const SIGS = {
  inner$tierAsOf$cut: [{"name":"asOfIso","d":{"t":"str"},"opt":false}],
  inner$tierAsOf$asMs: [{"name":"asOfIso","d":{"t":"str"},"opt":false}],
  inner$tierAsOf$asMs$$step: [{"name":"cut","d":{"t":"str"},"opt":false}],
  inner$tierAsOf$take$d: [{"name":"date","d":{"t":"str"},"opt":false}],
  inner$tierAsOf$days: [{"name":"asOfIso","d":{"t":"str"},"opt":false},{"name":"last","d":{"t":"str"},"opt":false}],
  inner$tierAsOf$days$$step: [{"name":"asMs","d":{"t":"num"},"opt":false},{"name":"last","d":{"t":"str"},"opt":false}],
  inner$tierAsOf$score: [{"name":"asOfIso","d":{"t":"str"},"opt":false},{"name":"count","d":{"t":"num"},"opt":false},{"name":"ils","d":{"t":"num"},"opt":false},{"name":"last","d":{"t":"str"},"opt":false}],
  inner$tierAsOf$score$$step: [{"name":"count","d":{"t":"num"},"opt":false},{"name":"ils","d":{"t":"num"},"opt":false},{"name":"days","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$shiftMonths$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$shiftMonths$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$shiftMonths$tot: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"monthsBack","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$tot$$step: [{"name":"monthsBack","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$ny: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"monthsBack","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$ny$$step: [{"name":"tot","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$nm: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"monthsBack","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$nm$$step: [{"name":"tot","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$maxD: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"monthsBack","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$maxD$$step: [{"name":"ny","d":{"t":"num"},"opt":false},{"name":"nm","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$nd: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"monthsBack","d":{"t":"num"},"opt":false}],
  inner$shiftMonths$nd$$step: [{"name":"d","d":{"t":"num"},"opt":false},{"name":"maxD","d":{"t":"num"},"opt":false}],
  inner$tierMigration$fromIso: [{"name":"todayIso","d":{"t":"str"},"opt":false},{"name":"monthsBack","d":{"t":"num"},"opt":false}],
  inner$tierMigration$diff: [{"name":"to","d":{"t":"or","of":[{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},{"t":"null"}]},"opt":false},{"name":"from","d":{"t":"or","of":[{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},{"t":"null"}]},"opt":false}],
  inner$tierMigration$key: [{"name":"to","d":{"t":"or","of":[{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},{"t":"null"}]},"opt":false},{"name":"from","d":{"t":"or","of":[{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},{"t":"null"}]},"opt":false}],
  inner$tierMigration$row: [{"name":"flowMap","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"TierFlow","p":[["from",{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},false],["to",{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},false],["count",{"t":"num"},false]]}},"opt":false},{"name":"to","d":{"t":"or","of":[{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},{"t":"null"}]},"opt":false},{"name":"from","d":{"t":"or","of":[{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},{"t":"null"}]},"opt":false}],
  inner$tierMigration$row$$step: [{"name":"flowMap","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"TierFlow","p":[["from",{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},false],["to",{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},false],["count",{"t":"num"},false]]}},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
  inner$tierMigration$flows: [{"name":"flowMap","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"TierFlow","p":[["from",{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},false],["to",{"t":"lit","v":["זהב","כסף","ארד","רדומה"]},false],["count",{"t":"num"},false]]}},"opt":false}],
};
