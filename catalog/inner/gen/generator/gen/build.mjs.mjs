// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$logMd$L(r) {
    const L = [`# ${r.app} — יומן-בנייה`, '', `מדף: ${r.meta.shelf} אטומים (${r.meta.fns} פונקציות) · זמן: ${r.meta.ms}ms · נבנה: ${r.meta.built}`, ''];
    return L;
}

export const SIGS = {
  inner$logMd$L: [{"name":"r","d":{"t":"any"},"opt":false}],
};
