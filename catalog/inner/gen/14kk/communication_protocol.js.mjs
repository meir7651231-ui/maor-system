// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:communication_protocol.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const TELEGRAM_CHAT_ID = '7578765494';
export function inner$SmartCommunicationProtocol$sendTelegramMessage$Promise$data(message) {
    const data = JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
    });
    return data;
}
export function inner$SmartCommunicationProtocol$sendTelegramMessage$Promise$request$on$result(body) {
    const result = JSON.parse(body);
    return result;
}
export function inner$SmartCommunicationProtocol$detectChanges$protocolFiles(files) {
    const protocolFiles = files.filter(f => f.includes('protocol.js'));
    return protocolFiles;
}
export function inner$SmartCommunicationProtocol$detectChanges$taskFiles(files) {
    const taskFiles = files.filter(f => f.includes('task') || f.includes('todo'));
    return taskFiles;
}
export function inner$SmartCommunicationProtocol$checkProtocolStatus$healthScore(active, total) {
    const healthScore = Math.round((active / total) * 100);
    return healthScore;
}
export function inner$SmartCommunicationProtocol$generateProtocolSummary$activeCount(protocols) {
    const activeCount = protocols.filter(p => p.status.includes('✅')).length;
    return activeCount;
}
export function inner$SmartCommunicationProtocol$generateProtocolSummary$healthScore(protocols, totalCount) {
    const activeCount = protocols.filter(p => p.status.includes('✅')).length;
    const healthScore = Math.round((activeCount / totalCount) * 100);
    return healthScore;
}
export function inner$SmartCommunicationProtocol$generateProtocolSummary$healthScore$$step(activeCount, totalCount) {
    const healthScore = Math.round((activeCount / totalCount) * 100);
    return healthScore;
}
export function inner$SmartCommunicationProtocol$checkFileStatus$size(stats) {
    const size = (stats.size / 1024).toFixed(2);
    return size;
}

export const SIGS = {
  inner$SmartCommunicationProtocol$sendTelegramMessage$Promise$data: [{"name":"message","d":{"t":"any"},"opt":false}],
  inner$SmartCommunicationProtocol$sendTelegramMessage$Promise$request$on$result: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SmartCommunicationProtocol$detectChanges$protocolFiles: [{"name":"files","d":{"t":"any"},"opt":false}],
  inner$SmartCommunicationProtocol$detectChanges$taskFiles: [{"name":"files","d":{"t":"any"},"opt":false}],
  inner$SmartCommunicationProtocol$checkProtocolStatus$healthScore: [{"name":"active","d":{"t":"num"},"opt":false},{"name":"total","d":{"t":"num"},"opt":false}],
  inner$SmartCommunicationProtocol$generateProtocolSummary$activeCount: [{"name":"protocols","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["file",{"t":"str"},false],["purpose",{"t":"str"},false],["status",{"t":"str"},false],["details",{"t":"str"},false]]}},"opt":false}],
  inner$SmartCommunicationProtocol$generateProtocolSummary$healthScore: [{"name":"protocols","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["file",{"t":"str"},false],["purpose",{"t":"str"},false],["status",{"t":"str"},false],["details",{"t":"str"},false]]}},"opt":false},{"name":"totalCount","d":{"t":"num"},"opt":false}],
  inner$SmartCommunicationProtocol$generateProtocolSummary$healthScore$$step: [{"name":"activeCount","d":{"t":"num"},"opt":false},{"name":"totalCount","d":{"t":"num"},"opt":false}],
  inner$SmartCommunicationProtocol$checkFileStatus$size: [{"name":"stats","d":{"t":"any"},"opt":false}],
};
