// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/intel.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const MS_DAY = 86_400_000;
function shiftIso(iso, days) {
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const dt = new Date(y, m - 1, d + Math.round(days), 12, 0, 0);
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const p2 = (n) => String(n).padStart(2, '0');
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    return dt.getFullYear() + '-' + p2(dt.getMonth() + 1) + '-' + p2(dt.getDate());
}
function dayDiff(iso, todayIso) {
    if (!iso)
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        return Infinity;
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const a = Date.parse(iso.slice(0, 10) + 'T12:00:00');
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const b = Date.parse(todayIso.slice(0, 10) + 'T12:00:00');
    if (Number.isNaN(a) || Number.isNaN(b))
        // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
        return Infinity;
    return Math.floor((b - a) / MS_DAY);
}
function monthsBefore(iso, todayIso) {
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    // YYYY-MM → שנה*12+חודש, הפרש שלם — זול ומדויק בלי פרסור-תאריך.
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const y = +iso.slice(0, 4), m = +iso.slice(5, 7);
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    const ty = +todayIso.slice(0, 4), tm = +todayIso.slice(5, 7);
    if (!y || !m || !ty || !tm)
        return -1;
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    return ty * 12 + tm - (y * 12 + m);
}
function rScore(days) {
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    return days <= 30 ? 350 : days <= 90 ? 280 : days <= 180 ? 200 : days <= 365 ? 120 : 40;
}
function mScore(tot) {
    // קבוע-מתמטי: יחידת-זמן/אינדקס/אחוז/חודש (מנגנון-ודאי)
    return tot >= 5000 ? 350 : tot >= 2000 ? 280 : tot >= 1000 ? 210 : tot >= 500 ? 140 : tot >= 100 ? 80 : 40;
}
export function inner$shiftIso$y(iso) {
    const y = +iso.slice(0, 4);
    return y;
}
export function inner$shiftIso$m(iso) {
    const m = +iso.slice(5, 7);
    return m;
}
export function inner$shiftIso$d(iso) {
    const d = +iso.slice(8, 10);
    return d;
}
export function inner$shiftIso$dt(iso, days) {
    const y = +iso.slice(0, 4);
    const m = +iso.slice(5, 7);
    const d = +iso.slice(8, 10);
    const dt = new Date(y, m - 1, d + Math.round(days), 12, 0, 0);
    return dt;
}
export function inner$shiftIso$dt$$step(days, y, m, d) {
    const dt = new Date(y, m - 1, d + Math.round(days), 12, 0, 0);
    return dt;
}
export function inner$dayDiff$a(iso) {
    const a = Date.parse(iso.slice(0, 10) + 'T12:00:00');
    return a;
}
export function inner$dayDiff$b(todayIso) {
    const b = Date.parse(todayIso.slice(0, 10) + 'T12:00:00');
    return b;
}
export function inner$monthsBefore$y(iso) {
    const y = +iso.slice(0, 4);
    return y;
}
export function inner$monthsBefore$m(iso) {
    const m = +iso.slice(5, 7);
    return m;
}
export function inner$monthsBefore$ty(todayIso) {
    const ty = +todayIso.slice(0, 4);
    return ty;
}
export function inner$monthsBefore$tm(todayIso) {
    const tm = +todayIso.slice(5, 7);
    return tm;
}
export function inner$donorScan$take$v(rate, amount, cur) {
    const v = (cur || '₪') === '$' ? amount * rate : amount;
    return v;
}
export function inner$donorScan$take$mb(todayIso, date) {
    const mb = monthsBefore(date, todayIso);
    return mb;
}
export function inner$rfmFromScan$days(scan, todayIso) {
    const days = scan.last ? dayDiff(scan.last, todayIso) : 99999;
    return days;
}
export function inner$rfmFromScan$r(scan, todayIso) {
    const days = scan.last ? dayDiff(scan.last, todayIso) : 99999;
    const r = rScore(days);
    return r;
}
export function inner$rfmFromScan$r$$step(days) {
    const r = rScore(days);
    return r;
}
export function inner$rfmFromScan$m(scan) {
    const m = mScore(scan.ils);
    return m;
}
export function inner$churnFromScan$daysSince(scan, todayIso) {
    const daysSince = dayDiff(scan.last, todayIso);
    return daysSince;
}
export function inner$churnFromScan$span(scan) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    return span;
}
export function inner$churnFromScan$cadence(scan, M) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    return cadence;
}
export function inner$churnFromScan$cadence$$step(scan, span, M) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    return cadence;
}
export function inner$churnFromScan$expected(scan, M) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    const expected = Math.max(M.m7, cadence * 1.5);
    return expected;
}
export function inner$churnFromScan$expected$$step(cadence, M) {
    const expected = Math.max(M.m7, cadence * 1.5);
    return expected;
}
export function inner$churnFromScan$ratio(scan, todayIso, M) {
    const daysSince = dayDiff(scan.last, todayIso);
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    const expected = Math.max(M.m7, cadence * 1.5);
    const ratio = daysSince / expected;
    return ratio;
}
export function inner$churnFromScan$ratio$$step(daysSince, expected) {
    const ratio = daysSince / expected;
    return ratio;
}
export function inner$forecastFromScan$avg(scan) {
    const avg = Math.round(scan.ils / scan.count);
    return avg;
}
export function inner$forecastFromScan$span(scan) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    return span;
}
export function inner$forecastFromScan$cadence(scan, M) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    return cadence;
}
export function inner$forecastFromScan$cadence$$step(scan, span, M) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    return cadence;
}
export function inner$forecastFromScan$dueIso(scan, M) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    const dueIso = shiftIso(scan.last, cadence);
    return dueIso;
}
export function inner$forecastFromScan$dueIso$$step(scan, cadence) {
    const dueIso = shiftIso(scan.last, cadence);
    return dueIso;
}
export function inner$forecastFromScan$daysSince(scan, todayIso) {
    const daysSince = dayDiff(scan.last, todayIso);
    return daysSince;
}
export function inner$forecastFromScan$overdue(scan, todayIso, M) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    const daysSince = dayDiff(scan.last, todayIso);
    const overdue = cadence > 0 ? Math.max(0, daysSince / cadence - 1) : 0;
    return overdue;
}
export function inner$forecastFromScan$overdue$$step(cadence, daysSince) {
    const overdue = cadence > 0 ? Math.max(0, daysSince / cadence - 1) : 0;
    return overdue;
}
export function inner$forecastFromScan$confidence(scan, todayIso, M) {
    const span = scan.first && scan.first !== scan.last ? dayDiff(scan.first, scan.last) : 0;
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : M.m6;
    const daysSince = dayDiff(scan.last, todayIso);
    const overdue = cadence > 0 ? Math.max(0, daysSince / cadence - 1) : 0;
    const confidence = Math.max(M.m8, Math.min(M.m9, Math.round(M.m7 + scan.count * 7 - overdue * M.m10)));
    return confidence;
}
export function inner$forecastFromScan$confidence$$step(scan, overdue, M) {
    const confidence = Math.max(M.m8, Math.min(M.m9, Math.round(M.m7 + scan.count * 7 - overdue * M.m10)));
    return confidence;
}
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
export function inner$trendFromScan$pct(mo, n) {
    const h = Math.floor(n / 2);
    let older = 0;
    let newer = 0;
    for (let i = 0; i < h; i++)
        older += mo[i];
    for (let i = n - h; i < n; i++)
        newer += mo[i];
    const pct = older === 0 ? 100 : Math.round(((newer - older) / older) * 100);
    return pct;
}
export function inner$trendFromScan$pct$$step(older, newer) {
    const pct = older === 0 ? 100 : Math.round(((newer - older) / older) * 100);
    return pct;
}
export function inner$trendFromScan$dir(mo, n, S) {
    const h = Math.floor(n / 2);
    let older = 0;
    let newer = 0;
    for (let i = 0; i < h; i++)
        older += mo[i];
    for (let i = n - h; i < n; i++)
        newer += mo[i];
    const pct = older === 0 ? 100 : Math.round(((newer - older) / older) * 100);
    const dir = pct > 8 ? 'up' : pct < -8 ? S.k1 : S.k0;
    return dir;
}
export function inner$trendFromScan$dir$$step(pct, S) {
    const dir = pct > 8 ? 'up' : pct < -8 ? S.k1 : S.k0;
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
  inner$shiftIso$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$shiftIso$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$shiftIso$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$shiftIso$dt: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"days","d":{"t":"num"},"opt":false}],
  inner$shiftIso$dt$$step: [{"name":"days","d":{"t":"num"},"opt":false},{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
  inner$dayDiff$a: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$dayDiff$b: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$monthsBefore$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$monthsBefore$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$monthsBefore$ty: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$monthsBefore$tm: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$donorScan$take$v: [{"name":"rate","d":{"t":"num"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false},{"name":"cur","d":{"t":"any"},"opt":false}],
  inner$donorScan$take$mb: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"date","d":{"t":"any"},"opt":false}],
  inner$rfmFromScan$days: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$rfmFromScan$r: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$rfmFromScan$r$$step: [{"name":"days","d":{"t":"num"},"opt":false}],
  inner$rfmFromScan$m: [{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$churnFromScan$daysSince: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$churnFromScan$span: [{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$churnFromScan$cadence: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$churnFromScan$cadence$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$churnFromScan$expected: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$churnFromScan$expected$$step: [{"name":"cadence","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$churnFromScan$ratio: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$churnFromScan$ratio$$step: [{"name":"daysSince","d":{"t":"num"},"opt":false},{"name":"expected","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$avg: [{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$forecastFromScan$span: [{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$forecastFromScan$cadence: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$forecastFromScan$cadence$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$forecastFromScan$dueIso: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$forecastFromScan$dueIso$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"cadence","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$daysSince: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$forecastFromScan$overdue: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$forecastFromScan$overdue$$step: [{"name":"cadence","d":{"t":"num"},"opt":false},{"name":"daysSince","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$confidence: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$forecastFromScan$confidence$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"overdue","d":{"t":"num"},"opt":false},{"name":"M","d":{"t":"obj","p":[["m0",{"t":"num"},false],["m1",{"t":"num"},false],["m2",{"t":"num"},false],["m3",{"t":"num"},false],["m4",{"t":"num"},false],["m5",{"t":"num"},false],["m6",{"t":"num"},false],["m7",{"t":"num"},false],["m8",{"t":"num"},false],["m9",{"t":"num"},false],["m10",{"t":"num"},false]]},"opt":false}],
  inner$trendFromScan$h: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$i: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$i$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$pct: [{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$pct$$step: [{"name":"older","d":{"t":"num"},"opt":false},{"name":"newer","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$dir: [{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false},{"name":"S","d":{"t":"obj","p":[["k0",{"t":"str"},false],["k1",{"t":"str"},false]]},"opt":false}],
  inner$trendFromScan$dir$$step: [{"name":"pct","d":{"t":"num"},"opt":false},{"name":"S","d":{"t":"obj","p":[["k0",{"t":"str"},false],["k1",{"t":"str"},false]]},"opt":false}],
  inner$trendFromScan$older$$after_loop: [{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendFromScan$newer$$after_loop: [{"name":"mo","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
};
