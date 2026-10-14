// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:check_protocol_activity.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ProtocolActivityChecker$checkCommunicationProtocol$timeDiff(report, now) {
    const reportTime = new Date(report.timestamp);
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkCommunicationProtocol$timeDiff$$step(reportTime, now) {
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkTelegramActivity$hasToken(envContent) {
    const hasToken = envContent.includes('TELEGRAM_BOT_TOKEN');
    return hasToken;
}
export function inner$ProtocolActivityChecker$checkTelegramActivity$hasChatId(envContent) {
    const hasChatId = envContent.includes('TELEGRAM_CHAT_ID');
    return hasChatId;
}
export function inner$ProtocolActivityChecker$checkTelegramActivity$timeDiff(report, now) {
    const lastMsgTime = new Date(report.lastTelegramMessage.timestamp);
    const timeDiff = (now - lastMsgTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkTelegramActivity$timeDiff$$step(lastMsgTime, now) {
    const timeDiff = (now - lastMsgTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkKnowledgeProtocol$timeDiff(report, now) {
    const reportTime = new Date(report.timestamp);
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkKnowledgeProtocol$timeDiff$$step(reportTime, now) {
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkConstructionProtocol$timeDiff(report, now) {
    const reportTime = new Date(report.timestamp);
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkConstructionProtocol$timeDiff$$step(reportTime, now) {
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkWorkManagerProtocol$timeDiff(report, now) {
    const reportTime = new Date(report.timestamp);
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkWorkManagerProtocol$timeDiff$$step(reportTime, now) {
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkOptimizationProtocol$timeDiff(report, now) {
    const reportTime = new Date(report.timestamp);
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$checkOptimizationProtocol$timeDiff$$step(reportTime, now) {
    const timeDiff = (now - reportTime) / 1000 / 60;
    return timeDiff;
}
export function inner$ProtocolActivityChecker$analyzeResults$forEach$icon(protocol) {
    const icon = protocol.status === 'active' ? '✅' :
        protocol.status === 'error' ? '❌' :
            protocol.status === 'missing' ? '❌' : '⚠️';
    return icon;
}

export const SIGS = {
  inner$ProtocolActivityChecker$checkCommunicationProtocol$timeDiff: [{"name":"report","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkCommunicationProtocol$timeDiff$$step: [{"name":"reportTime","d":{"t":"date"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkTelegramActivity$hasToken: [{"name":"envContent","d":{"t":"any"},"opt":false}],
  inner$ProtocolActivityChecker$checkTelegramActivity$hasChatId: [{"name":"envContent","d":{"t":"any"},"opt":false}],
  inner$ProtocolActivityChecker$checkTelegramActivity$timeDiff: [{"name":"report","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkTelegramActivity$timeDiff$$step: [{"name":"lastMsgTime","d":{"t":"date"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkKnowledgeProtocol$timeDiff: [{"name":"report","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkKnowledgeProtocol$timeDiff$$step: [{"name":"reportTime","d":{"t":"date"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkConstructionProtocol$timeDiff: [{"name":"report","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkConstructionProtocol$timeDiff$$step: [{"name":"reportTime","d":{"t":"date"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkWorkManagerProtocol$timeDiff: [{"name":"report","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkWorkManagerProtocol$timeDiff$$step: [{"name":"reportTime","d":{"t":"date"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkOptimizationProtocol$timeDiff: [{"name":"report","d":{"t":"any"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$checkOptimizationProtocol$timeDiff$$step: [{"name":"reportTime","d":{"t":"date"},"opt":false},{"name":"now","d":{"t":"date"},"opt":false}],
  inner$ProtocolActivityChecker$analyzeResults$forEach$icon: [{"name":"protocol","d":{"t":"any"},"opt":false}],
};
