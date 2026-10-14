// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:archive/final-bridge-v1.3.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function analyzeMemory(mem) {
    const stats = { errors: 0, slow: 0, failures: 0 };
    for (const m of mem) {
        if (m.status === 'error')
            stats.errors++;
        if (m.duration > 5000)
            stats.slow++;
        if (m.stage === 'command_fail')
            stats.failures++;
    }
    return stats;
}
function parseIntent(text) {
    if (text.includes('רענון זיכרון'))
        return 'memory_refresh';
    if (text.includes('איפה אנחנו'))
        return 'status';
    if (text.startsWith('!') || /^[a-z]+(\s|$)/.test(text)) {
        return 'terminal';
    }
    return 'ai';
}
export function inner$log$line(step, msg, timestamp) {
    const line = `[${timestamp}] [${step}] ${msg}`;
    return line;
}
export function inner$makeRequest$Promise$get$on$result(data) {
    const result = JSON.parse(data);
    return result;
}
export function inner$getUpdates$offset(lastUpdateId) {
    const offset = lastUpdateId > 0 ? lastUpdateId + 1 : 0;
    return offset;
}
export function inner$handleAuth$code(text) {
    const code = text.split(' ')[1];
    return code;
}
export function inner$runAI$stats(mem) {
    const stats = analyzeMemory(mem);
    return stats;
}
export function inner$executeTask$stats(mem) {
    const stats = analyzeMemory(mem);
    return stats;
}
export function inner$worker$stats(mem) {
    const stats = analyzeMemory(mem);
    return stats;
}
export function inner$processMessages$intent(messageText) {
    const intent = parseIntent(messageText);
    return intent;
}
export function inner$sendResponses$messageHash(bridge) {
    const messageHash = `${bridge.chatId}_${bridge.output.substring(0, 50)}`;
    return messageHash;
}
export function inner$init$id(data) {
    const id = parseInt(data.trim());
    return id;
}
export function inner$analyzeMemory$stats$$after_loop(mem) {
    const stats = { errors: 0, slow: 0, failures: 0 };
    for (const m of mem) {
        if (m.status === 'error')
            stats.errors++;
        if (m.duration > 5000)
            stats.slow++;
        if (m.stage === 'command_fail')
            stats.failures++;
    }
    return stats;
}

export const SIGS = {
  inner$log$line: [{"name":"step","d":{"t":"any"},"opt":false},{"name":"msg","d":{"t":"any"},"opt":false},{"name":"timestamp","d":{"t":"str"},"opt":false}],
  inner$makeRequest$Promise$get$on$result: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$offset: [{"name":"lastUpdateId","d":{"t":"num"},"opt":false}],
  inner$handleAuth$code: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$runAI$stats: [{"name":"mem","d":{"t":"any"},"opt":false}],
  inner$executeTask$stats: [{"name":"mem","d":{"t":"any"},"opt":false}],
  inner$worker$stats: [{"name":"mem","d":{"t":"any"},"opt":false}],
  inner$processMessages$intent: [{"name":"messageText","d":{"t":"any"},"opt":false}],
  inner$sendResponses$messageHash: [{"name":"bridge","d":{"t":"any"},"opt":false}],
  inner$init$id: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$analyzeMemory$stats$$after_loop: [{"name":"mem","d":{"t":"any"},"opt":false}],
};
