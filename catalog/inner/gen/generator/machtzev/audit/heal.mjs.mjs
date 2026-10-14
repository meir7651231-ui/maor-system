// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/audit/heal.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$diffKeys$evaluate$w(ia, ib) {
    const w = Math.max(ia.width, ib.width);
    return w;
}
export function inner$diffKeys$evaluate$h(ia, ib) {
    const h = Math.max(ia.height, ib.height);
    return h;
}
export function inner$diffKeys$evaluate$n(ia, ib) {
    const w = Math.max(ia.width, ib.width);
    const h = Math.max(ia.height, ib.height);
    const n = w * h;
    return n;
}
export function inner$diffKeys$evaluate$n$$step(w, h) {
    const n = w * h;
    return n;
}
export function inner$diffKeys$evaluate$g(A, B, i) {
    const g = Math.abs((A[i] * .299 + A[i + 1] * .587 + A[i + 2] * .114) - (B[i] * .299 + B[i + 1] * .587 + B[i + 2] * .114));
    return g;
}
export function inner$diffKeys$evaluate$m$$after_loop(A, B) {
    let m = 0;
    for (let i = 0; i < A.length; i += 4) {
        const g = Math.abs((A[i] * .299 + A[i + 1] * .587 + A[i + 2] * .114) - (B[i] * .299 + B[i + 1] * .587 + B[i + 2] * .114));
        if (g > 32)
            m++;
    }
    return m;
}

export const SIGS = {
  inner$diffKeys$evaluate$w: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffKeys$evaluate$h: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffKeys$evaluate$n: [{"name":"ia","d":{"t":"any"},"opt":false},{"name":"ib","d":{"t":"any"},"opt":false}],
  inner$diffKeys$evaluate$n$$step: [{"name":"w","d":{"t":"num"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$diffKeys$evaluate$g: [{"name":"A","d":{"t":"any"},"opt":false},{"name":"B","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$diffKeys$evaluate$m$$after_loop: [{"name":"A","d":{"t":"any"},"opt":false},{"name":"B","d":{"t":"any"},"opt":false}],
};
