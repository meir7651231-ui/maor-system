// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/regression/regression-panel.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$RegressionPanel$map$failed(result) {
    const failed = result.checks.filter((c) => !c.pass).length;
    return failed;
}
export function inner$RegressionPanel$map$ok(result) {
    const failed = result.checks.filter((c) => !c.pass).length;
    const ok = failed === 0;
    return ok;
}
export function inner$RegressionPanel$map$ok$$step(failed) {
    const ok = failed === 0;
    return ok;
}

export const SIGS = {
  inner$RegressionPanel$map$failed: [{"name":"result","d":{"t":"any"},"opt":false}],
  inner$RegressionPanel$map$ok: [{"name":"result","d":{"t":"any"},"opt":false}],
  inner$RegressionPanel$map$ok$$step: [{"name":"failed","d":{"t":"any"},"opt":false}],
};
