// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:services/business-integrations.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SlackIntegration$sendNotification$messages(data) {
    const messages = {
        alert: `🚨 ALERT: ${data.message}`,
        success: `✅ SUCCESS: ${data.message}`,
        info: `ℹ️ INFO: ${data.message}`,
        report: `📊 REPORT: ${data.message}`
    };
    return messages;
}
export function inner$SlackIntegration$sendNotification$channel(type) {
    const channel = type === 'report' ? '#reports' : '#alerts';
    return channel;
}

export const SIGS = {
  inner$SlackIntegration$sendNotification$messages: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$SlackIntegration$sendNotification$channel: [{"name":"type","d":{"t":"any"},"opt":false}],
};
