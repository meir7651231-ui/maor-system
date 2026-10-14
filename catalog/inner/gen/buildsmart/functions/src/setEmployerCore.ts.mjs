// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/setEmployerCore.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$parseSetEmployerInput$trimmed(employerUid) {
    const trimmed = employerUid.trim();
    return trimmed;
}

export const SIGS = {
  inner$parseSetEmployerInput$trimmed: [{"name":"employerUid","d":{"t":"any"},"opt":false}],
};
