// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:mvp/simple-mvp.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SimpleAssetManagerMVP$createUser$on$name(body) {
    const { name, email, telegramId } = JSON.parse(body);
    return name;
}
export function inner$SimpleAssetManagerMVP$createUser$on$email(body) {
    const { name, email, telegramId } = JSON.parse(body);
    return email;
}
export function inner$SimpleAssetManagerMVP$createUser$on$telegramId(body) {
    const { name, email, telegramId } = JSON.parse(body);
    return telegramId;
}
export function inner$SimpleAssetManagerMVP$createAsset$on$userId(body) {
    const { userId, name, type, value, description } = JSON.parse(body);
    return userId;
}
export function inner$SimpleAssetManagerMVP$createAsset$on$name(body) {
    const { userId, name, type, value, description } = JSON.parse(body);
    return name;
}
export function inner$SimpleAssetManagerMVP$createAsset$on$type(body) {
    const { userId, name, type, value, description } = JSON.parse(body);
    return type;
}
export function inner$SimpleAssetManagerMVP$createAsset$on$value(body) {
    const { userId, name, type, value, description } = JSON.parse(body);
    return value;
}
export function inner$SimpleAssetManagerMVP$createAsset$on$description(body) {
    const { userId, name, type, value, description } = JSON.parse(body);
    return description;
}
export function inner$SimpleAssetManagerMVP$getAssets$response(userAssets) {
    const response = {
        assets: userAssets,
        total: userAssets.length,
        totalValue: userAssets.reduce((sum, asset) => sum + asset.value, 0)
    };
    return response;
}
export function inner$SimpleAssetManagerMVP$handleChat$on$userId(body) {
    const { userId, message, source } = JSON.parse(body);
    return userId;
}
export function inner$SimpleAssetManagerMVP$handleChat$on$message(body) {
    const { userId, message, source } = JSON.parse(body);
    return message;
}
export function inner$SimpleAssetManagerMVP$handleChat$on$source(body) {
    const { userId, message, source } = JSON.parse(body);
    return source;
}
export function inner$SimpleAssetManagerMVP$generateAIResponse$lowerMessage(message) {
    const lowerMessage = message.toLowerCase();
    return lowerMessage;
}
export function inner$SimpleAssetManagerMVP$calculateConfidence$matches(message, keywords) {
    const matches = keywords.filter(word => message.includes(word)).length;
    return matches;
}
export function inner$SimpleAssetManagerMVP$extractEntities$numbers(message) {
    const numbers = message.match(/\d+/g);
    return numbers;
}
export function inner$SimpleAssetManagerMVP$learnFromInteraction$lowerMessage(message) {
    const lowerMessage = message.toLowerCase();
    return lowerMessage;
}
export function inner$SimpleAssetManagerMVP$generateStatusResponse$hours(uptime) {
    const hours = Math.floor(uptime / 60);
    return hours;
}
export function inner$SimpleAssetManagerMVP$generateStatusResponse$minutes(uptime) {
    const minutes = uptime % 60;
    return minutes;
}
export function inner$SimpleAssetManagerMVP$generateContextualResponse$lastInteraction(contextMemory) {
    const lastInteraction = contextMemory.history[contextMemory.history.length - 1];
    return lastInteraction;
}
export function inner$SimpleAssetManagerMVP$handleTelegramWebhook$on$update(body) {
    const update = JSON.parse(body);
    return update;
}
export function inner$SimpleAssetManagerMVP$getActivityStats$oneDayAgo(now) {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return oneDayAgo;
}
export function inner$SimpleAssetManagerMVP$getActivityStats$oneWeekAgo(now) {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return oneWeekAgo;
}

export const SIGS = {
  inner$SimpleAssetManagerMVP$createUser$on$name: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$createUser$on$email: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$createUser$on$telegramId: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$createAsset$on$userId: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$createAsset$on$name: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$createAsset$on$type: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$createAsset$on$value: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$createAsset$on$description: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$getAssets$response: [{"name":"userAssets","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$SimpleAssetManagerMVP$handleChat$on$userId: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$handleChat$on$message: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$handleChat$on$source: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$generateAIResponse$lowerMessage: [{"name":"message","d":{"t":"any"},"opt":false}],
  inner$SimpleAssetManagerMVP$calculateConfidence$matches: [{"name":"message","d":{"t":"any"},"opt":false},{"name":"keywords","d":{"t":"any"},"opt":false}],
  inner$SimpleAssetManagerMVP$extractEntities$numbers: [{"name":"message","d":{"t":"any"},"opt":false}],
  inner$SimpleAssetManagerMVP$learnFromInteraction$lowerMessage: [{"name":"message","d":{"t":"any"},"opt":false}],
  inner$SimpleAssetManagerMVP$generateStatusResponse$hours: [{"name":"uptime","d":{"t":"num"},"opt":false}],
  inner$SimpleAssetManagerMVP$generateStatusResponse$minutes: [{"name":"uptime","d":{"t":"num"},"opt":false}],
  inner$SimpleAssetManagerMVP$generateContextualResponse$lastInteraction: [{"name":"contextMemory","d":{"t":"any"},"opt":false}],
  inner$SimpleAssetManagerMVP$handleTelegramWebhook$on$update: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerMVP$getActivityStats$oneDayAgo: [{"name":"now","d":{"t":"date"},"opt":false}],
  inner$SimpleAssetManagerMVP$getActivityStats$oneWeekAgo: [{"name":"now","d":{"t":"date"},"opt":false}],
};
