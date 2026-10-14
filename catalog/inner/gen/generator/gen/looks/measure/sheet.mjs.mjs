// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/measure/sheet.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$map$keys(M, pg) {
    const keys = Object.keys(M.sites).filter(k => k.startsWith(pg.site + '·'));
    return keys;
}

export const SIGS = {
  inner$map$keys: [{"name":"M","d":{"t":"any"},"opt":false},{"name":"pg","d":{"t":"obj","p":[["file",{"t":"str"},false],["site",{"t":"str"},false],["shot",{"t":"str"},false]]},"opt":false}],
};
