// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:unused_files_backup/watchdog.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isProcessRunning$Promise$exec$isRunning(stdout) {
    const isRunning = stdout.includes('ProcessId') && stdout.length > 20;
    return isRunning;
}

export const SIGS = {
  inner$isProcessRunning$Promise$exec$isRunning: [{"name":"stdout","d":{"t":"any"},"opt":false}],
};
