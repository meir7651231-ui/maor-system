// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:get_chat_id_fixed.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$getUpdates$request$on$response(data) {
    const response = JSON.parse(data);
    return response;
}
export function inner$getUpdates$request$on$forEach$date(update) {
    const date = new Date(update.message.date * 1000).toLocaleString('he-IL');
    return date;
}
export function inner$getUpdates$request$on$latestChatId(data) {
    const response = JSON.parse(data);
    const latestChatId = response.result[response.result.length - 1].message.chat.id;
    return latestChatId;
}
export function inner$getUpdates$request$on$latestChatId$$step(response) {
    const latestChatId = response.result[response.result.length - 1].message.chat.id;
    return latestChatId;
}

export const SIGS = {
  inner$getUpdates$request$on$response: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$request$on$forEach$date: [{"name":"update","d":{"t":"any"},"opt":false}],
  inner$getUpdates$request$on$latestChatId: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$request$on$latestChatId$$step: [{"name":"response","d":{"t":"any"},"opt":false}],
};
