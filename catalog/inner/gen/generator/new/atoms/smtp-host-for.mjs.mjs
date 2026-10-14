// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/smtp-host-for.mjs — לא לערוך ביד.
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

export const SIGS = {
  inner$smtpHostFor$at: [{"name":"email","d":{"t":"any"},"opt":false}],
  inner$smtpHostFor$domain: [{"name":"email","d":{"t":"any"},"opt":false}],
  inner$smtpHostFor$domain$$step: [{"name":"email","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"num"},"opt":false}],
};
