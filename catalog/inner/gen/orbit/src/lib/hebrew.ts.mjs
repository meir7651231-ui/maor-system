// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/hebrew.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$gem$s(n) {
    const H = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    let s = H[Math.floor(n / 100)] || '';
    return s;
}
export function inner$gem$s$$step(n, H) {
    let s = H[Math.floor(n / 100)] || '';
    return s;
}
export function inner$gem$r(n) {
    const r = n % 100;
    return r;
}
export function inner$scanHebYear$hit(hebYearScan, hebYear) {
    const hit = hebYearScan.get(hebYear);
    return hit;
}
export function inner$scanHebYear$gy(hebYear) {
    const gy = hebYear - 3761;
    return gy;
}
export function inner$hebAnnualEq$qi(query, seq) {
    const qi = seq.indexOf(query.month);
    return qi;
}
export function inner$hebAnnualEq$prev(query, seq) {
    const qi = seq.indexOf(query.month);
    const prev = qi > 0 ? seq[qi - 1] : null;
    return prev;
}
export function inner$hebAnnualEq$prev$$step(seq, qi) {
    const prev = qi > 0 ? seq[qi - 1] : null;
    return prev;
}
export function inner$hebAnnualEq$prevMatches(anchor, query, seq) {
    const qi = seq.indexOf(query.month);
    const prev = qi > 0 ? seq[qi - 1] : null;
    const prevMatches = prev === anchor.month || (anchor.month === 'Adar I' && prev === 'Adar');
    return prevMatches;
}
export function inner$hebAnnualEq$prevMatches$$step(anchor, prev) {
    const prevMatches = prev === anchor.month || (anchor.month === 'Adar I' && prev === 'Adar');
    return prevMatches;
}
export function inner$hebPartsOfIso$hp(hpCacheShared, iso) {
    let hp = hpCacheShared.get(iso);
    return hp;
}
export function inner$hebDateFull$d(iso) {
    const d = new Date(iso.slice(0, 10) + 'T12:00:00');
    return d;
}
export function inner$holidayOf$dow(d) {
    const dow = d.getDay();
    return dow;
}
export function inner$holidayOf$key(p) {
    const key = `${p.month} ${p.day}`;
    return key;
}

export const SIGS = {
  inner$gem$s: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$gem$s$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"H","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$gem$r: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$scanHebYear$hit: [{"name":"hebYearScan","d":{"t":"map","k":{"t":"num"},"v":{"t":"obj","p":[["seq",{"t":"arr","of":{"t":"str"}},false],["has30",{"t":"set","of":{"t":"str"}},false]]}},"opt":false},{"name":"hebYear","d":{"t":"num"},"opt":false}],
  inner$scanHebYear$gy: [{"name":"hebYear","d":{"t":"num"},"opt":false}],
  inner$hebAnnualEq$qi: [{"name":"query","d":{"t":"obj","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"seq","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$hebAnnualEq$prev: [{"name":"query","d":{"t":"obj","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"seq","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$hebAnnualEq$prev$$step: [{"name":"seq","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"qi","d":{"t":"num"},"opt":false}],
  inner$hebAnnualEq$prevMatches: [{"name":"anchor","d":{"t":"obj","p":[["day",{"t":"num"},false],["month",{"t":"str"},false]]},"opt":false},{"name":"query","d":{"t":"obj","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false},{"name":"seq","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$hebAnnualEq$prevMatches$$step: [{"name":"anchor","d":{"t":"obj","p":[["day",{"t":"num"},false],["month",{"t":"str"},false]]},"opt":false},{"name":"prev","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$hebPartsOfIso$hp: [{"name":"hpCacheShared","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"HebParts","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"num"},false]]}},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$hebDateFull$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$holidayOf$dow: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$holidayOf$key: [{"name":"p","d":{"t":"obj","n":"HebParts","p":[["day",{"t":"num"},false],["month",{"t":"str"},false],["year",{"t":"num"},false]]},"opt":false}],
};
