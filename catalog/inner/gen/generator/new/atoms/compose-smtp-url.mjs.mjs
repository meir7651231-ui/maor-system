// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/compose-smtp-url.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$composeSmtpUrl$em(email) {
    const em = email.trim();
    return em;
}
export function inner$composeSmtpUrl$pw(password) {
    const pw = password.trim();
    return pw;
}
export function inner$composeSmtpUrl$h(host) {
    const h = host.trim();
    return h;
}
export function inner$composeSmtpUrl$scheme(host, T) {
    const h = host.trim();
    const scheme = /:465$/.test(h) ? T.k1 : T.k2;
    return scheme;
}
export function inner$composeSmtpUrl$scheme$$step(T, h) {
    const scheme = /:465$/.test(h) ? T.k1 : T.k2;
    return scheme;
}

export const SIGS = {
  inner$composeSmtpUrl$em: [{"name":"email","d":{"t":"any"},"opt":false}],
  inner$composeSmtpUrl$pw: [{"name":"password","d":{"t":"any"},"opt":false}],
  inner$composeSmtpUrl$h: [{"name":"host","d":{"t":"any"},"opt":false}],
  inner$composeSmtpUrl$scheme: [{"name":"host","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$composeSmtpUrl$scheme$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
};
