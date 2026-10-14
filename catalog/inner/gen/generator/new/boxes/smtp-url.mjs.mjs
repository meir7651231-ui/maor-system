// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/smtp-url.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildSmtpAccount$em(email) {
    const em = String(email ?? '');
    return em;
}
export function inner$buildSmtpAccount$pw(password) {
    const pw = String(password ?? '');
    return pw;
}
export function inner$buildSmtpAccount$mh(manualHost) {
    const mh = String(manualHost ?? '');
    return mh;
}

export const SIGS = {
  inner$buildSmtpAccount$em: [{"name":"email","d":{"t":"any"},"opt":false}],
  inner$buildSmtpAccount$pw: [{"name":"password","d":{"t":"any"},"opt":false}],
  inner$buildSmtpAccount$mh: [{"name":"manualHost","d":{"t":"any"},"opt":false}],
};
