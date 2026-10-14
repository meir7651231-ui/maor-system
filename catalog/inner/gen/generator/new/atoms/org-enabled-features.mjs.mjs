// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/org-enabled-features.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$orgEnabledFeatures$filter$isRealModule(allModules, f) {
    const isRealModule = allModules.includes(f.module);
    return isRealModule;
}

export const SIGS = {
  inner$orgEnabledFeatures$filter$isRealModule: [{"name":"allModules","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
};
