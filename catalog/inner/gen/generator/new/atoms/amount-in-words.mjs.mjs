// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/amount-in-words.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$amountInWords$words0_999$h(T, n) {
    const h = Math.floor(n / T.k22);
    return h;
}
export function inner$amountInWords$words0_999$rem(T, n) {
    const rem = n % T.k22;
    return rem;
}
export function inner$amountInWords$words0_999$t(T, n) {
    const rem = n % T.k22;
    const t = Math.floor(rem / T.k23);
    return t;
}
export function inner$amountInWords$words0_999$t$$step(T, rem) {
    const t = Math.floor(rem / T.k23);
    return t;
}
export function inner$amountInWords$words0_999$u(T, n) {
    const rem = n % T.k22;
    const u = rem % T.k23;
    return u;
}
export function inner$amountInWords$words0_999$u$$step(T, rem) {
    const u = rem % T.k23;
    return u;
}
export function inner$amountInWords$agorotWords$t(T, n) {
    const t = Math.floor(n / T.k23);
    return t;
}
export function inner$amountInWords$agorotWords$u(T, n) {
    const u = n % T.k23;
    return u;
}
export function inner$amountInWords$joinHeb$w(words) {
    const w = words.filter(Boolean);
    return w;
}
export function inner$amountInWords$integerInWords$millions(T, n) {
    const millions = Math.floor(n / T.k26);
    return millions;
}
export function inner$amountInWords$integerInWords$thousands(T, n) {
    const thousands = Math.floor((n % T.k26) / T.k27);
    return thousands;
}
export function inner$amountInWords$integerInWords$rest(T, n) {
    const rest = n % T.k27;
    return rest;
}
export function inner$amountInWords$shekelWord(currency, T) {
    const shekelWord = currency === '$' ? { one: T.k13, many: T.k14, agName: T.k15 } : { one: T.k16, many: T.k17, agName: T.k18 };
    return shekelWord;
}
export function inner$amountInWords$whole(amount) {
    let whole = Math.floor(amount);
    return whole;
}
export function inner$amountInWords$agorot(amount, T, whole) {
    let agorot = Math.round((amount - whole) * T.k22);
    return agorot;
}

export const SIGS = {
  inner$amountInWords$words0_999$h: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$words0_999$rem: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$words0_999$t: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$words0_999$t$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"rem","d":{"t":"num"},"opt":false}],
  inner$amountInWords$words0_999$u: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$words0_999$u$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"rem","d":{"t":"num"},"opt":false}],
  inner$amountInWords$agorotWords$t: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$agorotWords$u: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$joinHeb$w: [{"name":"words","d":{"t":"any"},"opt":false}],
  inner$amountInWords$integerInWords$millions: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$integerInWords$thousands: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$integerInWords$rest: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$shekelWord: [{"name":"currency","d":{"t":"str"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$amountInWords$whole: [{"name":"amount","d":{"t":"num"},"opt":false}],
  inner$amountInWords$agorot: [{"name":"amount","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"whole","d":{"t":"num"},"opt":false}],
};
