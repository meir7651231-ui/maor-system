// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/lib-pwa.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$applyOrgManifest$name(config) {
    const name = (config.orgName || '').trim();
    return name;
}

export const SIGS = {
  inner$applyOrgManifest$name: [{"name":"config","d":{"t":"any"},"opt":false}],
};
