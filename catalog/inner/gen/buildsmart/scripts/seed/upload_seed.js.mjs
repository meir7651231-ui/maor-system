// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:scripts/seed/upload_seed.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fn$ids(docs) {
    const ids = Object.keys(docs);
    return ids;
}

export const SIGS = {
  inner$fn$ids: [{"name":"docs","d":{"t":"any"},"opt":false}],
};
