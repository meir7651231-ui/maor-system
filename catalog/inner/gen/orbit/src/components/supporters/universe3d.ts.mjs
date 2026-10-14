// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/universe3d.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function hash01(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
}
export function inner$donorUniverse$map$theta(n) {
    const theta = n.angle * Math.PI * 2;
    return theta;
}
export function inner$donorUniverse$map$phi(n) {
    const phi = Math.acos(2 * hash01(n.id + '#p') - 1);
    return phi;
}
export function inner$donorUniverse$map$sinP(n) {
    const phi = Math.acos(2 * hash01(n.id + '#p') - 1);
    const sinP = Math.sin(phi);
    return sinP;
}
export function inner$donorUniverse$map$sinP$$step(phi) {
    const sinP = Math.sin(phi);
    return sinP;
}
export function inner$project$cy(yaw) {
    const cy = Math.cos(yaw);
    return cy;
}
export function inner$project$sy(yaw) {
    const sy = Math.sin(yaw);
    return sy;
}
export function inner$project$x1(p, yaw) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const x1 = p.x * cy - p.z * sy;
    return x1;
}
export function inner$project$x1$$step(p, cy, sy) {
    const x1 = p.x * cy - p.z * sy;
    return x1;
}
export function inner$project$z1(p, yaw) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const z1 = p.x * sy + p.z * cy;
    return z1;
}
export function inner$project$z1$$step(p, cy, sy) {
    const z1 = p.x * sy + p.z * cy;
    return z1;
}
export function inner$project$cx(pitch) {
    const cx = Math.cos(pitch);
    return cx;
}
export function inner$project$sx(pitch) {
    const sx = Math.sin(pitch);
    return sx;
}
export function inner$project$y1(p, yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const z1 = p.x * sy + p.z * cy;
    const cx = Math.cos(pitch);
    const sx = Math.sin(pitch);
    const y1 = p.y * cx - z1 * sx;
    return y1;
}
export function inner$project$y1$$step(p, z1, cx, sx) {
    const y1 = p.y * cx - z1 * sx;
    return y1;
}
export function inner$project$z2(p, yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const z1 = p.x * sy + p.z * cy;
    const cx = Math.cos(pitch);
    const sx = Math.sin(pitch);
    const z2 = p.y * sx + z1 * cx;
    return z2;
}
export function inner$project$z2$$step(p, z1, cx, sx) {
    const z2 = p.y * sx + z1 * cx;
    return z2;
}
export function inner$project$scale(p, yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const z1 = p.x * sy + p.z * cy;
    const cx = Math.cos(pitch);
    const sx = Math.sin(pitch);
    const z2 = p.y * sx + z1 * cx;
    const cam = 3;
    const scale = cam / (cam - z2);
    return scale;
}
export function inner$project$scale$$step(z2) {
    const cam = 3;
    const scale = cam / (cam - z2);
    return scale;
}
export function inner$project$rad(w, h) {
    const rad = Math.min(w, h) * 0.42;
    return rad;
}
export function inner$hash01$h$$after_loop(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h;
}

export const SIGS = {
  inner$donorUniverse$map$theta: [{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$donorUniverse$map$phi: [{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$donorUniverse$map$sinP: [{"name":"n","d":{"t":"obj","n":"ConstellationNode","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["angle",{"t":"num"},false],["radius",{"t":"num"},false],["size",{"t":"num"},false],["tier",{"t":"lit","v":["gold","silver","bronze","dormant"]},false],["atRisk",{"t":"bool"},false],["val",{"t":"num"},false],["churn",{"t":"num"},false]]},"opt":false}],
  inner$donorUniverse$map$sinP$$step: [{"name":"phi","d":{"t":"num"},"opt":false}],
  inner$project$cy: [{"name":"yaw","d":{"t":"num"},"opt":false}],
  inner$project$sy: [{"name":"yaw","d":{"t":"num"},"opt":false}],
  inner$project$x1: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"yaw","d":{"t":"num"},"opt":false}],
  inner$project$x1$$step: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"cy","d":{"t":"num"},"opt":false},{"name":"sy","d":{"t":"num"},"opt":false}],
  inner$project$z1: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"yaw","d":{"t":"num"},"opt":false}],
  inner$project$z1$$step: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"cy","d":{"t":"num"},"opt":false},{"name":"sy","d":{"t":"num"},"opt":false}],
  inner$project$cx: [{"name":"pitch","d":{"t":"num"},"opt":false}],
  inner$project$sx: [{"name":"pitch","d":{"t":"num"},"opt":false}],
  inner$project$y1: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"yaw","d":{"t":"num"},"opt":false},{"name":"pitch","d":{"t":"num"},"opt":false}],
  inner$project$y1$$step: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"z1","d":{"t":"num"},"opt":false},{"name":"cx","d":{"t":"num"},"opt":false},{"name":"sx","d":{"t":"num"},"opt":false}],
  inner$project$z2: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"yaw","d":{"t":"num"},"opt":false},{"name":"pitch","d":{"t":"num"},"opt":false}],
  inner$project$z2$$step: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"z1","d":{"t":"num"},"opt":false},{"name":"cx","d":{"t":"num"},"opt":false},{"name":"sx","d":{"t":"num"},"opt":false}],
  inner$project$scale: [{"name":"p","d":{"t":"obj","p":[["x",{"t":"num"},false],["y",{"t":"num"},false],["z",{"t":"num"},false]]},"opt":false},{"name":"yaw","d":{"t":"num"},"opt":false},{"name":"pitch","d":{"t":"num"},"opt":false}],
  inner$project$scale$$step: [{"name":"z2","d":{"t":"num"},"opt":false}],
  inner$project$rad: [{"name":"w","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$hash01$h$$after_loop: [{"name":"s","d":{"t":"str"},"opt":false}],
};
