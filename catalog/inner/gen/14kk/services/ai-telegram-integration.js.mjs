// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:services/ai-telegram-integration.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AITelegramIntegration$loadContextMemory$bridge(data) {
    const bridge = JSON.parse(data);
    return bridge;
}
export function inner$AITelegramIntegration$analyzeIntent$lowerMessage(message) {
    const lowerMessage = message.toLowerCase();
    return lowerMessage;
}
export function inner$AITelegramIntegration$analyzeProtocols$protocols(files) {
    const protocols = files.filter(file => file.includes('protocol')).length;
    return protocols;
}
export function inner$AITelegramIntegration$performMaintenance$hoursSinceLastActivity(now, context) {
    const hoursSinceLastActivity = (now - context.lastActivity) / (1000 * 60 * 60);
    return hoursSinceLastActivity;
}

export const SIGS = {
  inner$AITelegramIntegration$loadContextMemory$bridge: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$AITelegramIntegration$analyzeIntent$lowerMessage: [{"name":"message","d":{"t":"any"},"opt":false}],
  inner$AITelegramIntegration$analyzeProtocols$protocols: [{"name":"files","d":{"t":"any"},"opt":false}],
  inner$AITelegramIntegration$performMaintenance$hoursSinceLastActivity: [{"name":"now","d":{"t":"date"},"opt":false},{"name":"context","d":{"t":"any"},"opt":false}],
};
