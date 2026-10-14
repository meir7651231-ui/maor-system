// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sign-up.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$signUp$code(e) {
    const code = (e?.code ?? '').toString();
    return code;
}

export const SIGS = {
  inner$signUp$code: [{"name":"e","d":{"t":"any"},"opt":false}],
};
