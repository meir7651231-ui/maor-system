// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:mvp/asset-manager-mvp.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AssetManagerMVP$handleTelegramWebhook$telegramId(update) {
    const telegramId = update.message.from.id.toString();
    return telegramId;
}
export function inner$AssetManagerMVP$getActivityStats$oneDayAgo(now) {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return oneDayAgo;
}
export function inner$AssetManagerMVP$getActivityStats$oneWeekAgo(now) {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return oneWeekAgo;
}

export const SIGS = {
  inner$AssetManagerMVP$handleTelegramWebhook$telegramId: [{"name":"update","d":{"t":"any"},"opt":false}],
  inner$AssetManagerMVP$getActivityStats$oneDayAgo: [{"name":"now","d":{"t":"date"},"opt":false}],
  inner$AssetManagerMVP$getActivityStats$oneWeekAgo: [{"name":"now","d":{"t":"date"},"opt":false}],
};
