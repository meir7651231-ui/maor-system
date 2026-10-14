// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:unused_files_backup/telegram-bot.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$makeRequest$get$on$result(data) {
    const result = JSON.parse(data);
    return result;
}
export function inner$getUpdates$offset(lastUpdateId) {
    const offset = lastUpdateId > 0 ? lastUpdateId + 1 : -1;
    return offset;
}
export function inner$startBot$checkMessages$getUpdates$update(result) {
    const update = result.result[result.result.length - 1];
    return update;
}

export const SIGS = {
  inner$makeRequest$get$on$result: [{"name":"data","d":{"t":"str"},"opt":false}],
  inner$getUpdates$offset: [{"name":"lastUpdateId","d":{"t":"num"},"opt":false}],
  inner$startBot$checkMessages$getUpdates$update: [{"name":"result","d":{"t":"any"},"opt":false}],
};
