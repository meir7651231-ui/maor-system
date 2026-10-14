// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/integer-in-words.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$integerInWords$millions(n, T) {
    const millions = Math.floor(n / T.k6);
    return millions;
}
export function inner$integerInWords$thousands(n, T) {
    const thousands = Math.floor((n % T.k6) / T.k7);
    return thousands;
}
export function inner$integerInWords$rest(n, T) {
    const rest = n % T.k7;
    return rest;
}

export const SIGS = {
  inner$integerInWords$millions: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$integerInWords$thousands: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$integerInWords$rest: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
