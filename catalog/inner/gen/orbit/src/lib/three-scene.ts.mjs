// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/three-scene.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const beat = (x) => Math.exp(-x * x * 62) + 0.5 * Math.exp(-(x - 0.26) * (x - 0.26) * 62);
export function inner$mountBrainScene$y(i) {
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    return y;
}
export function inner$mountBrainScene$rad(i) {
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    return rad;
}
export function inner$mountBrainScene$rad$$step(y) {
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    return rad;
}
export function inner$mountBrainScene$th(i) {
    const th = i * 2.399963229;
    return th;
}
export function inner$mountBrainScene$x(i) {
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963229;
    const x = Math.cos(th) * rad;
    return x;
}
export function inner$mountBrainScene$x$$step(rad, th) {
    const x = Math.cos(th) * rad;
    return x;
}
export function inner$mountBrainScene$z(i) {
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963229;
    const z = Math.sin(th) * rad;
    return z;
}
export function inner$mountBrainScene$z$$step(rad, th) {
    const z = Math.sin(th) * rad;
    return z;
}
export function inner$mountBrainScene$rr(i) {
    const R = 1.34;
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963229;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const rr = R * (1 + 0.12 * Math.sin(x * 4.3 + y * 3.1) * Math.cos(z * 3.6 + y * 2.2));
    return rr;
}
export function inner$mountBrainScene$rr$$step(y, x, z) {
    const R = 1.34;
    const rr = R * (1 + 0.12 * Math.sin(x * 4.3 + y * 3.1) * Math.cos(z * 3.6 + y * 2.2));
    return rr;
}
export function inner$mountBrainScene$vx(i) {
    const R = 1.34;
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963229;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const rr = R * (1 + 0.12 * Math.sin(x * 4.3 + y * 3.1) * Math.cos(z * 3.6 + y * 2.2));
    const vx = x * rr;
    return vx;
}
export function inner$mountBrainScene$vx$$step(x, rr) {
    const vx = x * rr;
    return vx;
}
export function inner$mountBrainScene$vy(i) {
    const R = 1.34;
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963229;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const rr = R * (1 + 0.12 * Math.sin(x * 4.3 + y * 3.1) * Math.cos(z * 3.6 + y * 2.2));
    const vy = y * rr * 0.92;
    return vy;
}
export function inner$mountBrainScene$vy$$step(y, rr) {
    const vy = y * rr * 0.92;
    return vy;
}
export function inner$mountBrainScene$vz(i) {
    const R = 1.34;
    const SEED = 430;
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963229;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const rr = R * (1 + 0.12 * Math.sin(x * 4.3 + y * 3.1) * Math.cos(z * 3.6 + y * 2.2));
    const vz = z * rr;
    return vz;
}
export function inner$mountBrainScene$vz$$step(z, rr) {
    const vz = z * rr;
    return vz;
}
export function inner$mountBrainScene$npos(M) {
    const npos = new Float32Array(M * 3);
    return npos;
}
export function inner$mountBrainScene$key(i, j) {
    const key = Math.min(i, j) + '_' + Math.max(i, j);
    return key;
}
export function inner$mountBrainScene$a(i) {
    const a = -i * 0.07;
    return a;
}
export function inner$mountBrainScene$s(i) {
    const s = Math.max(0.02, 0.088 - i * 0.007);
    return s;
}
export function inner$mountBrainScene$pa() {
    const PN = 90;
    const pa = new Float32Array(PN * 3);
    return pa;
}
export function inner$mountBrainScene$sa() {
    const SN = 300;
    const sa = new Float32Array(SN * 3);
    return sa;
}
export function inner$mountBrainScene$loop$ph(t) {
    const ph = (t % 1.5) / 1.5;
    return ph;
}
export function inner$mountBrainScene$loop$pulse(pulseAmt, t) {
    const ph = (t % 1.5) / 1.5;
    const pulse = Math.min(1, beat(ph)) * pulseAmt;
    return pulse;
}
export function inner$mountBrainScene$loop$pulse$$step(pulseAmt, ph) {
    const pulse = Math.min(1, beat(ph)) * pulseAmt;
    return pulse;
}

export const SIGS = {
  inner$mountBrainScene$y: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$rad: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$rad$$step: [{"name":"y","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$th: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$x: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$x$$step: [{"name":"rad","d":{"t":"num"},"opt":false},{"name":"th","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$z: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$z$$step: [{"name":"rad","d":{"t":"num"},"opt":false},{"name":"th","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$rr: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$rr$$step: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"x","d":{"t":"num"},"opt":false},{"name":"z","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$vx: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$vx$$step: [{"name":"x","d":{"t":"num"},"opt":false},{"name":"rr","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$vy: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$vy$$step: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"rr","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$vz: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$vz$$step: [{"name":"z","d":{"t":"num"},"opt":false},{"name":"rr","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$npos: [{"name":"M","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$key: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$a: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$s: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$pa: [],
  inner$mountBrainScene$sa: [],
  inner$mountBrainScene$loop$ph: [{"name":"t","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$loop$pulse: [{"name":"pulseAmt","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$mountBrainScene$loop$pulse$$step: [{"name":"pulseAmt","d":{"t":"num"},"opt":false},{"name":"ph","d":{"t":"num"},"opt":false}],
};
