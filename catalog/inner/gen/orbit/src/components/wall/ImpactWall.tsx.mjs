// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/wall/ImpactWall.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;
export function inner$ImpactWall$dash(data) {
    const ringP = data.pct ?? 1;
    const dash = `${(RING_C * ringP).toFixed(1)} ${RING_C.toFixed(1)}`;
    return dash;
}
export function inner$ImpactWall$dash$$step(ringP) {
    const dash = `${(RING_C * ringP).toFixed(1)} ${RING_C.toFixed(1)}`;
    return dash;
}
export function inner$ImpactWall$useMemo$max(vals) {
    const max = Math.max(1, ...vals);
    return max;
}
export function inner$ImpactWall$useMemo$step(vals) {
    const W = 600;
    const step = vals.length > 1 ? W / (vals.length - 1) : W;
    return step;
}
export function inner$ImpactWall$useMemo$pts(vals) {
    const W = 600;
    const H = 190;
    const top = 18;
    const bottom = 14;
    const max = Math.max(1, ...vals);
    const step = vals.length > 1 ? W / (vals.length - 1) : W;
    const pts = vals.map((v, i) => [i * step, H - bottom - (v / max) * (H - top - bottom)]);
    return pts;
}
export function inner$ImpactWall$useMemo$pts$$step(vals, max, step) {
    const H = 190;
    const top = 18;
    const bottom = 14;
    const pts = vals.map((v, i) => [i * step, H - bottom - (v / max) * (H - top - bottom)]);
    return pts;
}
export function inner$ImpactWall$useMemo$line(vals) {
    const W = 600;
    const H = 190;
    const top = 18;
    const bottom = 14;
    const max = Math.max(1, ...vals);
    const step = vals.length > 1 ? W / (vals.length - 1) : W;
    const pts = vals.map((v, i) => [i * step, H - bottom - (v / max) * (H - top - bottom)]);
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    return line;
}
export function inner$ImpactWall$useMemo$line$$step(pts) {
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    return line;
}
export function inner$ImpactWall$useMemo$area(vals) {
    const W = 600;
    const H = 190;
    const top = 18;
    const bottom = 14;
    const max = Math.max(1, ...vals);
    const step = vals.length > 1 ? W / (vals.length - 1) : W;
    const pts = vals.map((v, i) => [i * step, H - bottom - (v / max) * (H - top - bottom)]);
    const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const area = `${line} L${W} ${H} L0 ${H} Z`;
    return area;
}
export function inner$ImpactWall$useMemo$area$$step(line) {
    const W = 600;
    const H = 190;
    const area = `${line} L${W} ${H} L0 ${H} Z`;
    return area;
}
export function inner$ImpactWall$useMemo$end(vals) {
    const W = 600;
    const H = 190;
    const top = 18;
    const bottom = 14;
    const max = Math.max(1, ...vals);
    const step = vals.length > 1 ? W / (vals.length - 1) : W;
    const pts = vals.map((v, i) => [i * step, H - bottom - (v / max) * (H - top - bottom)]);
    const end = pts[pts.length - 1] ?? [W, H - bottom];
    return end;
}
export function inner$ImpactWall$useMemo$end$$step(pts) {
    const W = 600;
    const H = 190;
    const bottom = 14;
    const end = pts[pts.length - 1] ?? [W, H - bottom];
    return end;
}
export function inner$ImpactWall$timeStr(now) {
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return timeStr;
}

export const SIGS = {
  inner$ImpactWall$dash: [{"name":"data","d":{"t":"obj","n":"WallData","p":[["raisedThisYear",{"t":"num"},false],["goal",{"t":"num"},false],["pct",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["goalLine",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["kpisRight",{"t":"arr","of":{"t":"obj","n":"WallKpi","p":[["icon",{"t":"str"},false],["value",{"t":"str"},false],["label",{"t":"str"},false],["badge",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["kpisLeft",{"t":"arr","of":{"t":"obj","n":"WallKpi","p":[["icon",{"t":"str"},false],["value",{"t":"str"},false],["label",{"t":"str"},false],["badge",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["podium",{"t":"obj","n":"WallPodium","p":[["rows",{"t":"arr","of":{"t":"obj","n":"WallPodiumRow","p":[["name",{"t":"str"},false],["sub",{"t":"str"},false],["amount",{"t":"num"},false],["supporterId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["othersCount",{"t":"num"},false],["othersAmount",{"t":"num"},false],["scopeLabel",{"t":"str"},false]]},false],["pulse",{"t":"obj","n":"WallPulse","p":[["values",{"t":"arr","of":{"t":"num"}},false],["startLabel",{"t":"str"},false],["endLabel",{"t":"str"},false]]},false],["miniKpis",{"t":"arr","of":{"t":"obj","n":"WallMiniKpi","p":[["value",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["week",{"t":"arr","of":{"t":"obj","n":"WallWeekRow","p":[["key",{"t":"str"},false],["hd",{"t":"str"},false],["title",{"t":"str"},false],["sub",{"t":"str"},false],["emoji",{"t":"str"},false]]}},false],["ticker",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$ImpactWall$dash$$step: [{"name":"ringP","d":{"t":"num"},"opt":false}],
  inner$ImpactWall$useMemo$max: [{"name":"vals","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$ImpactWall$useMemo$step: [{"name":"vals","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$ImpactWall$useMemo$pts: [{"name":"vals","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$ImpactWall$useMemo$pts$$step: [{"name":"vals","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"max","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$ImpactWall$useMemo$line: [{"name":"vals","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$ImpactWall$useMemo$line$$step: [{"name":"pts","d":{"t":"arr","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}},"opt":false}],
  inner$ImpactWall$useMemo$area: [{"name":"vals","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$ImpactWall$useMemo$area$$step: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$ImpactWall$useMemo$end: [{"name":"vals","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$ImpactWall$useMemo$end$$step: [{"name":"pts","d":{"t":"arr","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}},"opt":false}],
  inner$ImpactWall$timeStr: [{"name":"now","d":{"t":"date"},"opt":false}],
};
