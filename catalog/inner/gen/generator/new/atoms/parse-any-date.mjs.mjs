// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/parse-any-date.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$parseAnyDate$s(v) {
    const s = String(v || '').trim();
    return s;
}
export function inner$parseAnyDate$iso(v) {
    const s = String(v || '').trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return iso;
}
export function inner$parseAnyDate$iso$$step(s) {
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return iso;
}
export function inner$parseAnyDate$probe(v) {
    const s = String(v || '').trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const y = +iso[1];
    const mon = +iso[2];
    const day = +iso[3];
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$probe$$step(y, mon, day) {
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$m(v) {
    const s = String(v || '').trim();
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    return m;
}
export function inner$parseAnyDate$m$$step(s) {
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    return m;
}
export function inner$parseAnyDate$probe_L34(v, y) {
    const s = String(v || '').trim();
    const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    const day = +m[1];
    const mon = +m[2];
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$probe_L34$$step(day, mon, y) {
    const probe = new Date(Date.UTC(y, mon - 1, day));
    return probe;
}
export function inner$parseAnyDate$b(T) {
    const b = new Date(Date.UTC(T.k7, T.k8, T.k9));
    return b;
}

export const SIGS = {
  inner$parseAnyDate$s: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseAnyDate$iso: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseAnyDate$iso$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$probe: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseAnyDate$probe$$step: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"mon","d":{"t":"num"},"opt":false},{"name":"day","d":{"t":"num"},"opt":false}],
  inner$parseAnyDate$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$parseAnyDate$m$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$parseAnyDate$probe_L34: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$parseAnyDate$probe_L34$$step: [{"name":"day","d":{"t":"num"},"opt":false},{"name":"mon","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false}],
  inner$parseAnyDate$b: [{"name":"T","d":{"t":"any"},"opt":false}],
};
