// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/lock.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function cooldownForFails(fails) {
    return fails >= 5 ? 30000 : fails >= 4 ? 15000 : fails >= 3 ? 5000 : 0;
}
export function inner$pbkdf2Pin$salt(saltHex) {
    const salt = new Uint8Array((saltHex.match(/../g) ?? []).map((h) => parseInt(h, 16)));
    return salt;
}
export function inner$verifyPin$saltHex(hash) {
    const [, saltHex, digest] = hash.split(':');
    return saltHex;
}
export function inner$verifyPin$digest(hash) {
    const [, saltHex, digest] = hash.split(':');
    return digest;
}
export function inner$readPinFails$p(raw) {
    const p = raw ? JSON.parse(raw) : null;
    return p;
}
export function inner$notePinFail$n(cur) {
    const n = cur.n + 1;
    return n;
}
export function inner$notePinFail$st(now, cur) {
    const n = cur.n + 1;
    const st = { n, until: now + cooldownForFails(n) };
    return st;
}
export function inner$notePinFail$st$$step(now, n) {
    const st = { n, until: now + cooldownForFails(n) };
    return st;
}

export const SIGS = {
  inner$pbkdf2Pin$salt: [{"name":"saltHex","d":{"t":"str"},"opt":false}],
  inner$verifyPin$saltHex: [{"name":"hash","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$verifyPin$digest: [{"name":"hash","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$readPinFails$p: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$notePinFail$n: [{"name":"cur","d":{"t":"obj","n":"PinFails","p":[["n",{"t":"num"},false],["until",{"t":"num"},false]]},"opt":false}],
  inner$notePinFail$st: [{"name":"now","d":{"t":"num"},"opt":false},{"name":"cur","d":{"t":"obj","n":"PinFails","p":[["n",{"t":"num"},false],["until",{"t":"num"},false]]},"opt":false}],
  inner$notePinFail$st$$step: [{"name":"now","d":{"t":"num"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
};
