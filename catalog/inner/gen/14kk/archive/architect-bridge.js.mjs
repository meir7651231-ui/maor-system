// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:archive/architect-bridge.js — לא לערוך ביד.
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
export function inner$processCommand$executeCommand$response(terminalCommand, output) {
    const response = `🔧 **Command Executed:** !${terminalCommand}\n\n${output}`;
    return response;
}
export function inner$processCommand$executeCommand$filePath(output) {
    const filePath = output.split('\n')[0].trim();
    return filePath;
}
export function inner$processCommand$executeCommand$executeCommand$response(filePath, fileContent) {
    const response = `📄 **Found File:** ${filePath}\n\n**First 10 lines:**\n${fileContent}`;
    return response;
}
export function inner$processCommand$executeCommand$executeCommand$response_L141(gitOutput, dirOutput) {
    const response = `📊 **Project Status:**\n\n**Git Status:**\n${gitOutput}\n**Directory:**\n${dirOutput}`;
    return response;
}
export function inner$startArchitectBridge$checkBridge$sendMessage$errorMsg(error) {
    const errorMsg = `System Error: Failed to deliver response\n\nError: ${error.message}\n\nPlease check the terminal for details.`;
    return errorMsg;
}

export const SIGS = {
  inner$makeRequest$get$on$result: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$offset: [{"name":"lastUpdateId","d":{"t":"num"},"opt":false}],
  inner$processCommand$terminalCommand: [{"name":"command","d":{"t":"any"},"opt":false}],
  inner$processCommand$executeCommand$response: [{"name":"terminalCommand","d":{"t":"any"},"opt":false},{"name":"output","d":{"t":"any"},"opt":false}],
  inner$processCommand$executeCommand$filePath: [{"name":"output","d":{"t":"any"},"opt":false}],
  inner$processCommand$executeCommand$executeCommand$response: [{"name":"filePath","d":{"t":"any"},"opt":false},{"name":"fileContent","d":{"t":"any"},"opt":false}],
  inner$processCommand$executeCommand$executeCommand$response_L141: [{"name":"gitOutput","d":{"t":"any"},"opt":false},{"name":"dirOutput","d":{"t":"any"},"opt":false}],
  inner$startArchitectBridge$checkBridge$sendMessage$errorMsg: [{"name":"error","d":{"t":"any"},"opt":false}],
};
