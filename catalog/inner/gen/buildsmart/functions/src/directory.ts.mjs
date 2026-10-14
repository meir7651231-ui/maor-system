// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/directory.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pickName$at(email) {
    const at = email.indexOf("@");
    return at;
}

export const SIGS = {
  inner$pickName$at: [{"name":"email","d":{"t":"str"},"opt":false}],
};
