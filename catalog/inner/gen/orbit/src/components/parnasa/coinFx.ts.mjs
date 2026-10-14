// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/coinFx.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const T3 = (x, y, s) => `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
export function inner$st$s(TS, el) {
    let s = TS.get(el);
    return s;
}
export function inner$cnRim$r(s) {
    const r = s / 2;
    return r;
}
export function inner$cnRim$th(s) {
    const th = Math.max(3, s * 0.075);
    return th;
}
export function inner$cnRim$w(s) {
    const r = s / 2;
    const N = 30;
    const w = (2 * Math.PI * r) / N + 0.9;
    return w;
}
export function inner$cnRim$w$$step(r) {
    const N = 30;
    const w = (2 * Math.PI * r) / N + 0.9;
    return w;
}
export function inner$cnRim$a(i) {
    const N = 30;
    const a = (i * 360) / N;
    return a;
}
export function inner$cnRim$L(i) {
    const N = 30;
    const a = (i * 360) / N;
    const L = 0.5 + 0.5 * Math.cos(((a - 315) * Math.PI) / 180);
    return L;
}
export function inner$cnRim$L$$step(a) {
    const L = 0.5 + 0.5 * Math.cos(((a - 315) * Math.PI) / 180);
    return L;
}
export function inner$cnConfetti$dx(a, v) {
    const dx = Math.cos(a) * v;
    return dx;
}
export function inner$cnConfetti$dy(a, v) {
    const dy = Math.sin(a) * v;
    return dy;
}
export function inner$cnFlip$from(toBack) {
    const from = toBack ? 0 : 180;
    return from;
}
export function inner$cnFlip$to(toBack) {
    const to = toBack ? 180 : 360;
    return to;
}
export function inner$cnFly$es(sr, S0) {
    const es = Math.max(0.12, (sr.width * 0.74) / S0);
    return es;
}
export function inner$cnFly$slotMid(sr) {
    const slotMid = sr.top + sr.height / 2;
    return slotMid;
}
export function inner$cnFly$ex(sr, r, S0) {
    const ex = sr.left + sr.width / 2 - (r.left + S0 / 2);
    return ex;
}
export function inner$cnFly$ey(sr, r, S0) {
    const es = Math.max(0.12, (sr.width * 0.74) / S0);
    const slotMid = sr.top + sr.height / 2;
    const ey = slotMid - (S0 * es) / 2 - 1 - (r.top + S0 / 2);
    return ey;
}
export function inner$cnFly$ey$$step(r, S0, es, slotMid) {
    const ey = slotMid - (S0 * es) / 2 - 1 - (r.top + S0 / 2);
    return ey;
}
export function inner$cnFly$cx(sr, r, S0) {
    const ex = sr.left + sr.width / 2 - (r.left + S0 / 2);
    const cx = ex * 0.35 + (ex > 0 ? -30 : 30);
    return cx;
}
export function inner$cnFly$cx$$step(ex) {
    const cx = ex * 0.35 + (ex > 0 ? -30 : 30);
    return cx;
}
export function inner$cnFly$cy(sr, r, S0) {
    const es = Math.max(0.12, (sr.width * 0.74) / S0);
    const slotMid = sr.top + sr.height / 2;
    const ey = slotMid - (S0 * es) / 2 - 1 - (r.top + S0 / 2);
    const cy = Math.min(0, ey) - 70;
    return cy;
}
export function inner$cnFly$cy$$step(ey) {
    const cy = Math.min(0, ey) - 70;
    return cy;
}
export function inner$cnFly$frames() {
    const frames = [{ transform: T3(0, 0, 1) }, { transform: T3(0, -12, 1.08), offset: 0.12 }];
    return frames;
}
export function inner$cnFly$t(i) {
    const t = i / 16;
    return t;
}
export function inner$cnFly$u(i) {
    const t = i / 16;
    const u = 1 - t;
    return u;
}
export function inner$cnFly$u$$step(t) {
    const u = 1 - t;
    return u;
}
export function inner$cnFly$x(sr, r, S0, i) {
    const ex = sr.left + sr.width / 2 - (r.left + S0 / 2);
    const cx = ex * 0.35 + (ex > 0 ? -30 : 30);
    const t = i / 16;
    const u = 1 - t;
    const x = 2 * u * t * cx + t * t * ex;
    return x;
}
export function inner$cnFly$x$$step(ex, cx, t, u) {
    const x = 2 * u * t * cx + t * t * ex;
    return x;
}
export function inner$cnFly$y(sr, r, S0, i) {
    const es = Math.max(0.12, (sr.width * 0.74) / S0);
    const slotMid = sr.top + sr.height / 2;
    const ey = slotMid - (S0 * es) / 2 - 1 - (r.top + S0 / 2);
    const cy = Math.min(0, ey) - 70;
    const t = i / 16;
    const u = 1 - t;
    const y = u * u * -12 + 2 * u * t * cy + t * t * ey;
    return y;
}
export function inner$cnFly$y$$step(ey, cy, t, u) {
    const y = u * u * -12 + 2 * u * t * cy + t * t * ey;
    return y;
}
export function inner$cnFly$s(sr, S0, i) {
    const es = Math.max(0.12, (sr.width * 0.74) / S0);
    const t = i / 16;
    const s = 1.08 + (es - 1.08) * (t * t * (3 - 2 * t));
    return s;
}
export function inner$cnFly$s$$step(es, t) {
    const s = 1.08 + (es - 1.08) * (t * t * (3 - 2 * t));
    return s;
}
export function inner$cnFly$cL(sr) {
    const cL = sr.left - 6;
    return cL;
}
export function inner$cnFly$cT(sr) {
    const slotMid = sr.top + sr.height / 2;
    const cT = slotMid - 80;
    return cT;
}
export function inner$cnFly$cT$$step(slotMid) {
    const cT = slotMid - 80;
    return cT;
}
export function inner$foundCoins$setTimeout$x0(from) {
    const x0 = from.left + from.width / 2 - 14;
    return x0;
}
export function inner$foundCoins$setTimeout$dx(from, to) {
    const x0 = from.left + from.width / 2 - 14;
    const dx = to.left + to.width / 2 - 14 - x0;
    return dx;
}
export function inner$foundCoins$setTimeout$dx$$step(to, x0) {
    const dx = to.left + to.width / 2 - 14 - x0;
    return dx;
}
export function inner$foundCoins$setTimeout$dy(to, y0) {
    const dy = to.top - y0 - 10;
    return dy;
}
export function inner$foundCoins$setTimeout$cx(from, to, i) {
    const x0 = from.left + from.width / 2 - 14;
    const dx = to.left + to.width / 2 - 14 - x0;
    const cx = dx * 0.3 + (i % 2 ? -60 : 60);
    return cx;
}
export function inner$foundCoins$setTimeout$cx$$step(i, dx) {
    const cx = dx * 0.3 + (i % 2 ? -60 : 60);
    return cx;
}
export function inner$foundCoins$setTimeout$cy(to, y0) {
    const dy = to.top - y0 - 10;
    const cy = Math.min(dy, 0) - 80;
    return cy;
}
export function inner$foundCoins$setTimeout$cy$$step(dy) {
    const cy = Math.min(dy, 0) - 80;
    return cy;
}
export function inner$foundCoins$setTimeout$t(j) {
    const t = j / 14;
    return t;
}
export function inner$foundCoins$setTimeout$u(j) {
    const t = j / 14;
    const u = 1 - t;
    return u;
}
export function inner$foundCoins$setTimeout$u$$step(t) {
    const u = 1 - t;
    return u;
}
export function inner$wireCoinGrid$paint$forEach$cx(r) {
    const cx = r.left + r.width / 2;
    return cx;
}
export function inner$wireCoinGrid$paint$forEach$cy(r) {
    const cy = r.top + r.height / 2;
    return cy;
}
export function inner$wireCoinGrid$paint$forEach$dx(px, r) {
    const cx = r.left + r.width / 2;
    const dx = px - cx;
    return dx;
}
export function inner$wireCoinGrid$paint$forEach$dx$$step(px, cx) {
    const dx = px - cx;
    return dx;
}
export function inner$wireCoinGrid$paint$forEach$dy(py, r) {
    const cy = r.top + r.height / 2;
    const dy = py - cy;
    return dy;
}
export function inner$wireCoinGrid$paint$forEach$dy$$step(py, cy) {
    const dy = py - cy;
    return dy;
}
export function inner$wireCoinGrid$paint$forEach$dist(px, py, r) {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy) || 1;
    return dist;
}
export function inner$wireCoinGrid$paint$forEach$dist$$step(dx, dy) {
    const dist = Math.hypot(dx, dy) || 1;
    return dist;
}
export function inner$wireCoinGrid$paint$forEach$f(px, py, r) {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const f = Math.max(0, 1 - dist / 260);
    return f;
}
export function inner$wireCoinGrid$paint$forEach$f$$step(dist) {
    const f = Math.max(0, 1 - dist / 260);
    return f;
}
export function inner$wireCoinGrid$paint$forEach$k(px, py, r) {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, dist / (r.width * 1.4));
    return k;
}
export function inner$wireCoinGrid$paint$forEach$k$$step(r, dist) {
    const k = Math.min(1, dist / (r.width * 1.4));
    return k;
}
export function inner$cnFly$frames$$after_loop(sr, r, S0) {
    const es = Math.max(0.12, (sr.width * 0.74) / S0);
    const slotMid = sr.top + sr.height / 2;
    const ex = sr.left + sr.width / 2 - (r.left + S0 / 2);
    const ey = slotMid - (S0 * es) / 2 - 1 - (r.top + S0 / 2);
    const cx = ex * 0.35 + (ex > 0 ? -30 : 30);
    const cy = Math.min(0, ey) - 70;
    const frames = [{ transform: T3(0, 0, 1) }, { transform: T3(0, -12, 1.08), offset: 0.12 }];
    for (let i = 1; i <= 16; i++) {
        const t = i / 16;
        const u = 1 - t;
        const x = 2 * u * t * cx + t * t * ex;
        const y = u * u * -12 + 2 * u * t * cy + t * t * ey;
        const s = 1.08 + (es - 1.08) * (t * t * (3 - 2 * t));
        frames.push({ transform: T3(x, y, s), offset: 0.12 + 0.88 * t });
    }
    return frames;
}
export function inner$foundCoins$setTimeout$fr$$after_loop(from, to, i, y0) {
    const x0 = from.left + from.width / 2 - 14;
    const dx = to.left + to.width / 2 - 14 - x0;
    const dy = to.top - y0 - 10;
    const cx = dx * 0.3 + (i % 2 ? -60 : 60);
    const cy = Math.min(dy, 0) - 80;
    const fr = [];
    for (let j = 0; j <= 14; j++) {
        const t = j / 14;
        const u = 1 - t;
        fr.push({ transform: `translate(${(2 * u * t * cx + t * t * dx).toFixed(1)}px,${(2 * u * t * cy + t * t * dy).toFixed(1)}px) rotateY(${t * 720}deg) scale(${(1.2 - 0.7 * t).toFixed(2)})`, offset: t });
    }
    return fr;
}

export const SIGS = {
  inner$st$s: [{"name":"TS","d":{"t":"obj","n":"WeakMap","p":[["delete",{"t":"fn"},false],["get",{"t":"fn"},false],["has",{"t":"fn"},false],["set",{"t":"fn"},false]]},"opt":false},{"name":"el","d":{"t":"any"},"opt":false}],
  inner$cnRim$r: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$cnRim$th: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$cnRim$w: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$cnRim$w$$step: [{"name":"r","d":{"t":"num"},"opt":false}],
  inner$cnRim$a: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cnRim$L: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cnRim$L$$step: [{"name":"a","d":{"t":"num"},"opt":false}],
  inner$cnConfetti$dx: [{"name":"a","d":{"t":"num"},"opt":false},{"name":"v","d":{"t":"num"},"opt":false}],
  inner$cnConfetti$dy: [{"name":"a","d":{"t":"num"},"opt":false},{"name":"v","d":{"t":"num"},"opt":false}],
  inner$cnFlip$from: [{"name":"toBack","d":{"t":"bool"},"opt":false}],
  inner$cnFlip$to: [{"name":"toBack","d":{"t":"bool"},"opt":false}],
  inner$cnFly$es: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false}],
  inner$cnFly$slotMid: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$cnFly$ex: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false}],
  inner$cnFly$ey: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false}],
  inner$cnFly$ey$$step: [{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false},{"name":"es","d":{"t":"num"},"opt":false},{"name":"slotMid","d":{"t":"num"},"opt":false}],
  inner$cnFly$cx: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false}],
  inner$cnFly$cx$$step: [{"name":"ex","d":{"t":"num"},"opt":false}],
  inner$cnFly$cy: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false}],
  inner$cnFly$cy$$step: [{"name":"ey","d":{"t":"num"},"opt":false}],
  inner$cnFly$frames: [],
  inner$cnFly$t: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cnFly$u: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cnFly$u$$step: [{"name":"t","d":{"t":"num"},"opt":false}],
  inner$cnFly$x: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cnFly$x$$step: [{"name":"ex","d":{"t":"num"},"opt":false},{"name":"cx","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"u","d":{"t":"num"},"opt":false}],
  inner$cnFly$y: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cnFly$y$$step: [{"name":"ey","d":{"t":"num"},"opt":false},{"name":"cy","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false},{"name":"u","d":{"t":"num"},"opt":false}],
  inner$cnFly$s: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$cnFly$s$$step: [{"name":"es","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$cnFly$cL: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$cnFly$cT: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$cnFly$cT$$step: [{"name":"slotMid","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$x0: [{"name":"from","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$foundCoins$setTimeout$dx: [{"name":"from","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"to","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$foundCoins$setTimeout$dx$$step: [{"name":"to","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"x0","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$dy: [{"name":"to","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"y0","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$cx: [{"name":"from","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"to","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$cx$$step: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"dx","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$cy: [{"name":"to","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"y0","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$cy$$step: [{"name":"dy","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$t: [{"name":"j","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$u: [{"name":"j","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$u$$step: [{"name":"t","d":{"t":"num"},"opt":false}],
  inner$wireCoinGrid$paint$forEach$cx: [{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$wireCoinGrid$paint$forEach$cy: [{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$wireCoinGrid$paint$forEach$dx: [{"name":"px","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$wireCoinGrid$paint$forEach$dx$$step: [{"name":"px","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"cx","d":{"t":"num"},"opt":false}],
  inner$wireCoinGrid$paint$forEach$dy: [{"name":"py","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$wireCoinGrid$paint$forEach$dy$$step: [{"name":"py","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"cy","d":{"t":"num"},"opt":false}],
  inner$wireCoinGrid$paint$forEach$dist: [{"name":"px","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"py","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$wireCoinGrid$paint$forEach$dist$$step: [{"name":"dx","d":{"t":"num"},"opt":false},{"name":"dy","d":{"t":"num"},"opt":false}],
  inner$wireCoinGrid$paint$forEach$f: [{"name":"px","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"py","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$wireCoinGrid$paint$forEach$f$$step: [{"name":"dist","d":{"t":"num"},"opt":false}],
  inner$wireCoinGrid$paint$forEach$k: [{"name":"px","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"py","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false}],
  inner$wireCoinGrid$paint$forEach$k$$step: [{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"dist","d":{"t":"num"},"opt":false}],
  inner$cnFly$frames$$after_loop: [{"name":"sr","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"r","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"S0","d":{"t":"num"},"opt":false}],
  inner$foundCoins$setTimeout$fr$$after_loop: [{"name":"from","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"to","d":{"t":"obj","n":"DOMRect","p":[["height",{"t":"num"},false],["width",{"t":"num"},false],["x",{"t":"num"},false],["y",{"t":"num"},false],["bottom",{"t":"num"},false],["left",{"t":"num"},false],["right",{"t":"num"},false],["top",{"t":"num"},false],["toJSON",{"t":"fn"},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"y0","d":{"t":"num"},"opt":false}],
};
