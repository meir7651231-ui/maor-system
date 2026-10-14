// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:development_progress_plan.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$DevelopmentProgressPlan$analyzeCurrentState$jsFiles(files) {
    const jsFiles = files.filter(f => f.endsWith('.js'));
    return jsFiles;
}
export function inner$DevelopmentProgressPlan$analyzeCurrentState$jsonFiles(files) {
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    return jsonFiles;
}
export function inner$DevelopmentProgressPlan$analyzeCurrentState$mdFiles(files) {
    const mdFiles = files.filter(f => f.endsWith('.md'));
    return mdFiles;
}

export const SIGS = {
  inner$DevelopmentProgressPlan$analyzeCurrentState$jsFiles: [{"name":"files","d":{"t":"any"},"opt":false}],
  inner$DevelopmentProgressPlan$analyzeCurrentState$jsonFiles: [{"name":"files","d":{"t":"any"},"opt":false}],
  inner$DevelopmentProgressPlan$analyzeCurrentState$mdFiles: [{"name":"files","d":{"t":"any"},"opt":false}],
};
