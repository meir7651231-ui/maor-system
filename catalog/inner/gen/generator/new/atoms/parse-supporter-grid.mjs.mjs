// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/parse-supporter-grid.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const g = (r, i) => (i >= 0 ? (r[i] ?? '').trim() : '');
export function inner$parseSupporterGrid$hdrIdx(rows, supNameKeys, T) {
    const hdrIdx = rows
        .slice(0, T.k27)
        .findIndex((r) => r.some((h) => supNameKeys.some((k) => (h ?? '').includes(k))));
    return hdrIdx;
}
export function inner$parseSupporterGrid$header(rows, supNameKeys, T) {
    const hdrIdx = rows
        .slice(0, T.k27)
        .findIndex((r) => r.some((h) => supNameKeys.some((k) => (h ?? '').includes(k))));
    const header = (hdrIdx >= 0 ? rows[hdrIdx] : rows[0]).map((h) => (h ?? '').trim());
    return header;
}
export function inner$parseSupporterGrid$header$$step(rows, hdrIdx) {
    const header = (hdrIdx >= 0 ? rows[hdrIdx] : rows[0]).map((h) => (h ?? '').trim());
    return header;
}
export function inner$parseSupporterGrid$start(rows, supNameKeys, T) {
    const hdrIdx = rows
        .slice(0, T.k27)
        .findIndex((r) => r.some((h) => supNameKeys.some((k) => (h ?? '').includes(k))));
    let start = hdrIdx >= 0 ? hdrIdx + 1 : 1;
    return start;
}
export function inner$parseSupporterGrid$start$$step(hdrIdx) {
    let start = hdrIdx >= 0 ? hdrIdx + 1 : 1;
    return start;
}
export function inner$parseSupporterGrid$name(iName, r) {
    const name = g(r, iName);
    return name;
}
export function inner$parseSupporterGrid$row(iName, iPhone, iEmail, iId, iAddr, iCat, iFor, r) {
    const name = g(r, iName);
    const row = {
        name,
        phone: g(r, iPhone),
        email: g(r, iEmail),
        idNum: g(r, iId),
        address: g(r, iAddr),
        cat: g(r, iCat),
        forWho: g(r, iFor),
    };
    return row;
}
export function inner$parseSupporterGrid$row$$step(iPhone, iEmail, iId, iAddr, iCat, iFor, r, name) {
    const row = {
        name,
        phone: g(r, iPhone),
        email: g(r, iEmail),
        idNum: g(r, iId),
        address: g(r, iAddr),
        cat: g(r, iCat),
        forWho: g(r, iFor),
    };
    return row;
}
export function inner$parseSupporterGrid$amount(T, iAmount, r) {
    const amount = Math.round(Number(g(r, iAmount).replace(/[^\d.-]/g, '')) * T.k28) / T.k28;
    return amount;
}
export function inner$parseSupporterGrid$rawDate(iTxDate, r) {
    const rawDate = g(r, iTxDate).split(' ')[0];
    return rawDate;
}
export function inner$parseSupporterGrid$pays(iPays, r) {
    const pays = Number(g(r, iPays));
    return pays;
}

export const SIGS = {
  inner$parseSupporterGrid$hdrIdx: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"supNameKeys","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$header: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"supNameKeys","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$header$$step: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"hdrIdx","d":{"t":"num"},"opt":false}],
  inner$parseSupporterGrid$start: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"supNameKeys","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$start$$step: [{"name":"hdrIdx","d":{"t":"num"},"opt":false}],
  inner$parseSupporterGrid$name: [{"name":"iName","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$row: [{"name":"iName","d":{"t":"any"},"opt":false},{"name":"iPhone","d":{"t":"any"},"opt":false},{"name":"iEmail","d":{"t":"any"},"opt":false},{"name":"iId","d":{"t":"any"},"opt":false},{"name":"iAddr","d":{"t":"any"},"opt":false},{"name":"iCat","d":{"t":"any"},"opt":false},{"name":"iFor","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$row$$step: [{"name":"iPhone","d":{"t":"any"},"opt":false},{"name":"iEmail","d":{"t":"any"},"opt":false},{"name":"iId","d":{"t":"any"},"opt":false},{"name":"iAddr","d":{"t":"any"},"opt":false},{"name":"iCat","d":{"t":"any"},"opt":false},{"name":"iFor","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$amount: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"iAmount","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$rawDate: [{"name":"iTxDate","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$parseSupporterGrid$pays: [{"name":"iPays","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
};
