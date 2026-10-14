// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:archive/architect-core-final.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function identifyIntent(message) {
    const text = message.toLowerCase();
    if (text.startsWith('!')) {
        return { type: 'TERMINAL', command: text.substring(1) };
    }
    if (text.includes('סטטוס') || text.includes('status') || text.includes('מה קורה') || text.includes('מצב')) {
        return { type: 'SYSTEM_STATUS', original: message };
    }
    if (text.includes('dir') || text.includes('ls') || text.includes('רשימת קבצים') || text.includes('קבצים')) {
        return { type: 'LIST_FILES', original: message };
    }
    if (text.includes('find') && text.includes('activate-bot-00002.js')) {
        return { type: 'FIND_FILE', original: message };
    }
    if (text.includes('read') && text.includes('unified-bridge.js')) {
        return { type: 'READ_FILE', original: message };
    }
    if (text.includes('מי המנצח') || text.includes('how are you') || text.includes('איך אתה')) {
        return { type: 'HOW_ARE_YOU', original: message };
    }
    if (text.includes('מה קורה') || text.includes('what\'s up') || text.includes('מה חדש')) {
        return { type: 'WHATS_UP', original: message };
    }
    if (text.includes('אוקיי') || text.includes('ok') || text.includes('בסדר') || text.includes('טוב')) {
        return { type: 'OK', original: message };
    }
    return { type: 'CHAT', original: message };
}
export function inner$makeRequest$get$on$result(data) {
    const result = JSON.parse(data);
    return result;
}
export function inner$getUpdates$offset(lastUpdateId) {
    const offset = lastUpdateId > 0 ? lastUpdateId + 1 : -1;
    return offset;
}
export function inner$identifyIntent$text(message) {
    const text = message.toLowerCase();
    return text;
}
export function inner$processIntent$executeCommand$filePath(output) {
    const filePath = output.split('\n')[0].trim();
    return filePath;
}
export function inner$checkMessages$getUpdates$forEach$intent(messageText) {
    const intent = identifyIntent(messageText);
    return intent;
}

export const SIGS = {
  inner$makeRequest$get$on$result: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$offset: [{"name":"lastUpdateId","d":{"t":"num"},"opt":false}],
  inner$identifyIntent$text: [{"name":"message","d":{"t":"any"},"opt":false}],
  inner$processIntent$executeCommand$filePath: [{"name":"output","d":{"t":"any"},"opt":false}],
  inner$checkMessages$getUpdates$forEach$intent: [{"name":"messageText","d":{"t":"any"},"opt":false}],
};
