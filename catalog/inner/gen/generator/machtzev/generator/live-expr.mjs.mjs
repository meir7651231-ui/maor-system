// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/live-expr.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const levelOf = (live, v) => (v == null || isNaN(v) ? null : (live.thresholds || [live.high, live.mid]).filter((t) => v >= t).length);
const liveThreshold = (live) => (live.kind === 'eq' ? live.value : live.kind === 'age' ? live.days : live.kind === 'ageMin' ? live.minutes : live.n);
const liveWin = (live, rs) => (live.window ? `${rs}.where((r) => _ageMin(r['__at'] ?? '') <= ${live.window}).toList()` : rs);
function liveAggSample(live, rows, fi) { const vals = rows.map((r) => parseFloat(r[fi])).filter((v) => !isNaN(v)); if (live.agg === 'count')
    return rows.length; if (!vals.length)
    return null; const sum = vals.reduce((a, b) => a + b, 0); return live.agg === 'sum' ? sum : sum / vals.length; }
export function inner$exprJs$v(t, row) {
    const v = parseFloat(row[t.fi]);
    return v;
}
export function inner$liveGroupsSample$key(live, fi, bi, r) {
    const key = live.kind === 'levels' ? String(levelOf(live, parseFloat(r[fi])) ?? '') : String(r[bi] || '').trim();
    return key;
}
export function inner$liveGroupsSample$map$v(live, fi, rs) {
    const v = liveAggSample(live, rs, fi);
    return v;
}
export function inner$liveHit$t(live) {
    const t = liveThreshold(live);
    return t;
}
export function inner$liveSetExpr$w(live, rs) {
    const w = liveWin(live, rs);
    return w;
}
export function inner$trendAt$mx(pts, n) {
    const mx = pts.reduce((a, p) => a + p[0], 0) / n;
    return mx;
}
export function inner$trendAt$my(pts, n) {
    const my = pts.reduce((a, p) => a + p[1], 0) / n;
    return my;
}
export function inner$trendAt$b(pts, n) {
    const mx = pts.reduce((a, p) => a + p[0], 0) / n;
    const my = pts.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0;
    let sxx = 0;
    for (const [x, y] of pts) {
        sxy += (x - mx) * (y - my);
        sxx += (x - mx) * (x - mx);
    }
    const b = sxx === 0 ? 0 : sxy / sxx;
    return b;
}
export function inner$trendAt$b$$step(sxy, sxx) {
    const b = sxx === 0 ? 0 : sxy / sxx;
    return b;
}
export function inner$liveAggSample$vals(rows, fi) {
    const vals = rows.map((r) => parseFloat(r[fi])).filter((v) => !isNaN(v));
    return vals;
}
export function inner$liveAggSample$sum(rows, fi) {
    const vals = rows.map((r) => parseFloat(r[fi])).filter((v) => !isNaN(v));
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum;
}
export function inner$liveAggSample$sum$$step(vals) {
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum;
}
export function inner$liveSample$t(raw) {
    const t = String(raw || '').trim();
    return t;
}
export function inner$liveSample$d(raw) {
    const t = String(raw || '').trim();
    const d = Date.parse(t.replace(' ', 'T'));
    return d;
}
export function inner$liveSample$d$$step(t) {
    const d = Date.parse(t.replace(' ', 'T'));
    return d;
}
export function inner$liveSample$v(raw) {
    const v = parseFloat(raw);
    return v;
}
export function inner$liveSample$t_L102(raw) {
    const t = String(raw || '').trim();
    return t;
}
export function inner$liveSample$d_L102(raw) {
    const t = String(raw || '').trim();
    let d = Date.parse(t);
    return d;
}
export function inner$liveSample$d_L102$$step(t) {
    let d = Date.parse(t);
    return d;
}
export function inner$liveSample$m(raw) {
    const t = String(raw || '').trim();
    const m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    return m;
}
export function inner$liveSample$m$$step(t) {
    const m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    return m;
}
export function inner$trendAt$sxy$$after_loop(pts, n) {
    const mx = pts.reduce((a, p) => a + p[0], 0) / n;
    const my = pts.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0;
    let sxx = 0;
    for (const [x, y] of pts) {
        sxy += (x - mx) * (y - my);
        sxx += (x - mx) * (x - mx);
    }
    return sxy;
}
export function inner$trendAt$sxx$$after_loop(pts, n) {
    const mx = pts.reduce((a, p) => a + p[0], 0) / n;
    const my = pts.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0;
    let sxx = 0;
    for (const [x, y] of pts) {
        sxy += (x - mx) * (y - my);
        sxx += (x - mx) * (x - mx);
    }
    return sxx;
}

export const SIGS = {
  inner$exprJs$v: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"row","d":{"t":"any"},"opt":false}],
  inner$liveGroupsSample$key: [{"name":"live","d":{"t":"any"},"opt":false},{"name":"fi","d":{"t":"any"},"opt":false},{"name":"bi","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$liveGroupsSample$map$v: [{"name":"live","d":{"t":"any"},"opt":false},{"name":"fi","d":{"t":"any"},"opt":false},{"name":"rs","d":{"t":"any"},"opt":false}],
  inner$liveHit$t: [{"name":"live","d":{"t":"any"},"opt":false}],
  inner$liveSetExpr$w: [{"name":"live","d":{"t":"any"},"opt":false},{"name":"rs","d":{"t":"any"},"opt":false}],
  inner$trendAt$mx: [{"name":"pts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendAt$my: [{"name":"pts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendAt$b: [{"name":"pts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendAt$b$$step: [{"name":"sxy","d":{"t":"num"},"opt":false},{"name":"sxx","d":{"t":"num"},"opt":false}],
  inner$liveAggSample$vals: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"fi","d":{"t":"any"},"opt":false}],
  inner$liveAggSample$sum: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"fi","d":{"t":"any"},"opt":false}],
  inner$liveAggSample$sum$$step: [{"name":"vals","d":{"t":"any"},"opt":false}],
  inner$liveSample$t: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$liveSample$d: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$liveSample$d$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$liveSample$v: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$liveSample$t_L102: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$liveSample$d_L102: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$liveSample$d_L102$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$liveSample$m: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$liveSample$m$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$trendAt$sxy$$after_loop: [{"name":"pts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$trendAt$sxx$$after_loop: [{"name":"pts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
};
