// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/intel-trend-from-scan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$trendFromScan$h(n) {
    const h = Math.floor(n / 2);
    return h;
}
export function inner$trendFromScan$i(n) {
    const h = Math.floor(n / 2);
    let i = n - h;
    return i;
}
export function inner$trendFromScan$i$$step(n, h) {
    let i = n - h;
    return i;
}
export function inner$trendFromScan$pct(T, mo, n) {
    const h = Math.floor(n / 2);
    let older = 0;
    let newer = 0;
    for (let i = 0; i < h; i++)
        older += mo[i];
    for (let i = n - h; i < n; i++)
        newer += mo[i];
    const pct = older === 0 ? T.k3 : Math.round(((newer - older) / older) * T.k3);
    return pct;
}
export function inner$trendFromScan$pct$$step(T, older, newer) {
    const pct = older === 0 ? T.k3 : Math.round(((newer - older) / older) * T.k3);
    return pct;
}
export function inner$trendFromScan$dir(T, mo, n) {
    const h = Math.floor(n / 2);
    let older = 0;
    let newer = 0;
    for (let i = 0; i < h; i++)
        older += mo[i];
    for (let i = n - h; i < n; i++)
        newer += mo[i];
    const pct = older === 0 ? T.k3 : Math.round(((newer - older) / older) * T.k3);
    const dir = pct > 8 ? 'up' : pct < -8 ? T.k2 : T.k1;
    return dir;
}
export function inner$trendFromScan$dir$$step(T, pct) {
    const dir = pct > 8 ? 'up' : pct < -8 ? T.k2 : T.k1;
    return dir;
}
export function inner$trendFromScan$older$$after_loop(mo, n) {
    const h = Math.floor(n / 2);
    let older = 0;
    for (let i = 0; i < h; i++)
        older += mo[i];
    return older;
}
export function inner$trendFromScan$newer$$after_loop(mo, n) {
    const h = Math.floor(n / 2);
    let newer = 0;
    for (let i = n - h; i < n; i++)
        newer += mo[i];
    return newer;
}

export const SIGS = {
  inner$trendFromScan$h: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$i: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$i$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$pct: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$pct$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"older","d":{"t":"num"},"opt":false},{"name":"newer","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$dir: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$dir$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"pct","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$older$$after_loop: [{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$newer$$after_loop: [{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
};
