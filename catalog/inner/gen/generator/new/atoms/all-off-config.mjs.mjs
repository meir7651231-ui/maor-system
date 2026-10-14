// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/all-off-config.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$allOffConfig$modules$$after_loop(allModules) {
    const modules = {};
    for (const m of allModules)
        modules[m] = false;
    return modules;
}

export const SIGS = {
  inner$allOffConfig$modules$$after_loop: [{"name":"allModules","d":{"t":"any"},"opt":false}],
};
