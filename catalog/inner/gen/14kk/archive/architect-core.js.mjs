// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:archive/architect-core.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const COMMAND_PATTERNS = {
    // פקודות מערכת
    SYSTEM_STATUS: ['סטטוס', 'status', 'מה קורה', 'מצב'],
    LIST_FILES: ['dir', 'ls', 'רשימת קבצים', 'קבצים'],
    FIND_FILE: ['find', 'חפש', 'מצא'],
    READ_FILE: ['read', 'קרא', 'פתח'],
    // פקודות פיתוח
    GIT_STATUS: ['git status', 'מצב גיט'],
    RUN_COMMAND: ['!'],
    // שאלות ושיחה
    HOW_ARE_YOU: ['מי המנצח', 'how are you', 'איך אתה'],
    WHATS_UP: ['מה קורה', 'what\'s up', 'מה חדש'],
    OK: ['אוקיי', 'ok', 'בסדר', 'טוב']
};
function identifyIntent(message) {
    const text = message.toLowerCase();
    // בדיקת פקודות ישירות
    if (text.startsWith('!')) {
        return { type: 'TERMINAL', command: text.substring(1) };
    }
    // בדיקת דפוסים
    for (const [intent, patterns] of Object.entries(COMMAND_PATTERNS)) {
        if (patterns.some(pattern => text.includes(pattern))) {
            return { type: intent, original: message };
        }
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
