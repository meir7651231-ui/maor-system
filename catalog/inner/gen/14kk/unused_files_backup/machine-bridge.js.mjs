// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:unused_files_backup/machine-bridge.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$makeRequest$get$on$result(data) {
    const result = JSON.parse(data);
    return result;
}
export function inner$getUpdates$offset(lastUpdateId) {
    const offset = lastUpdateId > 0 ? lastUpdateId + 1 : -1;
    return offset;
}
export function inner$processCommand$terminalCommand(command) {
    const terminalCommand = command.substring(1);
    return terminalCommand;
}
export function inner$processCommand$executeCommand$filePath(output) {
    const filePath = output.split('\n')[0].trim();
    return filePath;
}

export const SIGS = {
  inner$makeRequest$get$on$result: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$offset: [{"name":"lastUpdateId","d":{"t":"num"},"opt":false}],
  inner$processCommand$terminalCommand: [{"name":"command","d":{"t":"any"},"opt":false}],
  inner$processCommand$executeCommand$filePath: [{"name":"output","d":{"t":"any"},"opt":false}],
};
