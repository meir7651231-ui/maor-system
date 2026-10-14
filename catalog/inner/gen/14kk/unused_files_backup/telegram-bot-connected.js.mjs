// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:unused_files_backup/telegram-bot-connected.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function identifyIntent(messageText) {
    if (messageText.startsWith('!') || /^[a-z]+(\s|$)/.test(messageText)) {
        return 'terminal_command';
    }
    else {
        return 'ai_instruction';
    }
}
export function inner$makeRequest$get$on$result(data) {
    const result = JSON.parse(data);
    return result;
}
export function inner$getUpdates$offset(lastUpdateId) {
    const offset = lastUpdateId > 0 ? lastUpdateId + 1 : -1;
    return offset;
}
export function inner$startMessageProcessing$checkMessages$getUpdates$forEach$intent(messageText) {
    const intent = identifyIntent(messageText);
    return intent;
}
export function inner$startMessageProcessing$checkBridge$sendMessage$errorMsg(error) {
    const errorMsg = `System Error: Failed to deliver response\n\nError: ${error.message}\n\nPlease check the terminal for details.`;
    return errorMsg;
}

export const SIGS = {
  inner$makeRequest$get$on$result: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$offset: [{"name":"lastUpdateId","d":{"t":"num"},"opt":false}],
  inner$startMessageProcessing$checkMessages$getUpdates$forEach$intent: [{"name":"messageText","d":{"t":"any"},"opt":false}],
  inner$startMessageProcessing$checkBridge$sendMessage$errorMsg: [{"name":"error","d":{"t":"any"},"opt":false}],
};
