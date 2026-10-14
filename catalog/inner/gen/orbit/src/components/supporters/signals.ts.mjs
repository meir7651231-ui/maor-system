// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/signals.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$donorSignals$total(ev) {
    const total = ev.reduce((a, e) => a + e.ils, 0);
    return total;
}
export function inner$donorSignals$last(ev) {
    const last = ev[ev.length - 1];
    return last;
}
export function inner$donorSignals$prev(ev) {
    const prev = ev.slice(0, -1);
    return prev;
}
export function inner$donorSignals$prevAvg(ev) {
    const prev = ev.slice(0, -1);
    const prevAvg = prev.reduce((a, e) => a + e.ils, 0) / prev.length;
    return prevAvg;
}
export function inner$donorSignals$prevAvg$$step(prev) {
    const prevAvg = prev.reduce((a, e) => a + e.ils, 0) / prev.length;
    return prevAvg;
}
export function inner$donorSignals$pct(ev) {
    const last = ev[ev.length - 1];
    const prev = ev.slice(0, -1);
    const prevAvg = prev.reduce((a, e) => a + e.ils, 0) / prev.length;
    const pct = Math.round((1 - last.ils / prevAvg) * 100);
    return pct;
}
export function inner$donorSignals$pct$$step(last, prevAvg) {
    const pct = Math.round((1 - last.ils / prevAvg) * 100);
    return pct;
}
export function inner$donorSignals$mult(ev) {
    const last = ev[ev.length - 1];
    const prev = ev.slice(0, -1);
    const prevAvg = prev.reduce((a, e) => a + e.ils, 0) / prev.length;
    const mult = (last.ils / prevAvg).toFixed(1);
    return mult;
}
export function inner$donorSignals$mult$$step(last, prevAvg) {
    const mult = (last.ils / prevAvg).toFixed(1);
    return mult;
}

export const SIGS = {
  inner$donorSignals$total: [{"name":"ev","d":{"t":"arr","of":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]}},"opt":false}],
  inner$donorSignals$last: [{"name":"ev","d":{"t":"arr","of":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]}},"opt":false}],
  inner$donorSignals$prev: [{"name":"ev","d":{"t":"arr","of":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]}},"opt":false}],
  inner$donorSignals$prevAvg: [{"name":"ev","d":{"t":"arr","of":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]}},"opt":false}],
  inner$donorSignals$prevAvg$$step: [{"name":"prev","d":{"t":"arr","of":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]}},"opt":false}],
  inner$donorSignals$pct: [{"name":"ev","d":{"t":"arr","of":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]}},"opt":false}],
  inner$donorSignals$pct$$step: [{"name":"last","d":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]},"opt":false},{"name":"prevAvg","d":{"t":"num"},"opt":false}],
  inner$donorSignals$mult: [{"name":"ev","d":{"t":"arr","of":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]}},"opt":false}],
  inner$donorSignals$mult$$step: [{"name":"last","d":{"t":"obj","n":"Ev","p":[["date",{"t":"str"},false],["ils",{"t":"num"},false]]},"opt":false},{"name":"prevAvg","d":{"t":"num"},"opt":false}],
};
