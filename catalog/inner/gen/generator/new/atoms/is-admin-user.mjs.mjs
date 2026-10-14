// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/is-admin-user.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isAdminUser$e(email) {
    const e = email.trim().toLowerCase();
    return e;
}

export const SIGS = {
  inner$isAdminUser$e: [{"name":"email","d":{"t":"any"},"opt":false}],
};
