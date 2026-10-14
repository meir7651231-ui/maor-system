// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/site.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildSite$entry(ns) {
    const entry = `gen_app_${ns}_main.dart`;
    return entry;
}
export function inner$buildSite$outDir(slug) {
    const outDir = `build/gen-${slug}`;
    return outDir;
}

export const SIGS = {
  inner$buildSite$entry: [{"name":"ns","d":{"t":"any"},"opt":false}],
  inner$buildSite$outDir: [{"name":"slug","d":{"t":"any"},"opt":false}],
};
