// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/gen-join-code.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$genJoinCode$x(seed, T) {
    let h = T.k1;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, T.k2);
    }
    let x = h >>> 0;
    return x;
}
export function inner$genJoinCode$x$$step(h) {
    let x = h >>> 0;
    return x;
}
export function inner$genJoinCode$h$$after_loop(seed, T) {
    let h = T.k1;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, T.k2);
    }
    return h;
}
export function inner$genJoinCode$out$$after_loop(seed, T) {
    let h = T.k1;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, T.k2);
    }
    let out = '';
    let x = h >>> 0;
    for (let i = 0; i < 8; i++) {
        out += (x % T.k3).toString(T.k3);
        x = Math.floor(x / T.k3) || (h >>> 0) + i + 1;
    }
    return out;
}
export function inner$genJoinCode$x$$after_loop(seed, T) {
    let h = T.k1;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, T.k2);
    }
    let out = '';
    let x = h >>> 0;
    for (let i = 0; i < 8; i++) {
        out += (x % T.k3).toString(T.k3);
        x = Math.floor(x / T.k3) || (h >>> 0) + i + 1;
    }
    return x;
}

export const SIGS = {
  inner$genJoinCode$x: [{"name":"seed","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$genJoinCode$x$$step: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$genJoinCode$h$$after_loop: [{"name":"seed","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$genJoinCode$out$$after_loop: [{"name":"seed","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$genJoinCode$x$$after_loop: [{"name":"seed","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
