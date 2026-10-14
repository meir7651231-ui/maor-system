// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/smtpUrl.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$smtpHostFor$at(email) {
    const at = email.lastIndexOf('@');
    return at;
}
export function inner$smtpHostFor$domain(email) {
    const at = email.lastIndexOf('@');
    const domain = email.slice(at + 1).trim().toLowerCase();
    return domain;
}
export function inner$smtpHostFor$domain$$step(email, at) {
    const domain = email.slice(at + 1).trim().toLowerCase();
    return domain;
}
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
export function inner$composeSmtpUrl$scheme(host) {
    const h = host.trim();
    const scheme = /:465$/.test(h) ? 'smtps' : 'smtp';
    return scheme;
}
export function inner$composeSmtpUrl$scheme$$step(h) {
    const scheme = /:465$/.test(h) ? 'smtps' : 'smtp';
    return scheme;
}

export const SIGS = {
  inner$smtpHostFor$at: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$smtpHostFor$domain: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$smtpHostFor$domain$$step: [{"name":"email","d":{"t":"str"},"opt":false},{"name":"at","d":{"t":"num"},"opt":false}],
  inner$composeSmtpUrl$em: [{"name":"email","d":{"t":"str"},"opt":false}],
  inner$composeSmtpUrl$pw: [{"name":"password","d":{"t":"str"},"opt":false}],
  inner$composeSmtpUrl$h: [{"name":"host","d":{"t":"str"},"opt":false}],
  inner$composeSmtpUrl$scheme: [{"name":"host","d":{"t":"str"},"opt":false}],
  inner$composeSmtpUrl$scheme$$step: [{"name":"h","d":{"t":"str"},"opt":false}],
};
