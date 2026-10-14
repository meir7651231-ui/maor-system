// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/store/app-settings.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$load$p(raw) {
    const p = JSON.parse(raw);
    return p;
}

export const SIGS = {
  inner$load$p: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
};
