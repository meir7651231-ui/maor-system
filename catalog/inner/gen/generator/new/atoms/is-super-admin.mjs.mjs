// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/is-super-admin.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isSuperAdmin$e(email) {
    const e = (email || '').trim().toLowerCase();
    return e;
}

export const SIGS = {
  inner$isSuperAdmin$e: [{"name":"email","d":{"t":"any"},"opt":false}],
};
