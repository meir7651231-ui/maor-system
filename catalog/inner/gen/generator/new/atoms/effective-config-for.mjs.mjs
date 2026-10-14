// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/effective-config-for.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$effectiveConfigFor$modules$$after_loop(orgConfig, ov) {
    const modules = { ...orgConfig.modules };
    for (const [m, v] of Object.entries(ov.modules ?? {}))
        if (v === false)
            modules[m] = false;
    return modules;
}
export function inner$effectiveConfigFor$features$$after_loop(orgConfig, grantable, ov) {
    const features = { ...orgConfig.features };
    for (const [k, v] of Object.entries(ov.features ?? {})) {
        if (v === false)
            features[k] = false;
        else if (v === true && grantable.has(k))
            features[k] = true; // הדלקה פר-עובד
    }
    return features;
}

export const SIGS = {
  inner$effectiveConfigFor$modules$$after_loop: [{"name":"orgConfig","d":{"t":"any"},"opt":false},{"name":"ov","d":{"t":"any"},"opt":false}],
  inner$effectiveConfigFor$features$$after_loop: [{"name":"orgConfig","d":{"t":"any"},"opt":false},{"name":"grantable","d":{"t":"any"},"opt":false},{"name":"ov","d":{"t":"any"},"opt":false}],
};
