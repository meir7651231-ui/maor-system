// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:test_telegram_no_emoji.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CHAT_ID = '7578765494';
export function inner$request$on$response(body) {
    const response = JSON.parse(body);
    return response;
}
export function inner$testWithTextEmojis$data2(messageWithTextEmojis) {
    const data2 = JSON.stringify({
        chat_id: CHAT_ID,
        text: messageWithTextEmojis,
        parse_mode: undefined // בלי Markdown
    });
    return data2;
}
export function inner$testWithTextEmojis$request$on$response(body) {
    const response = JSON.parse(body);
    return response;
}

export const SIGS = {
  inner$request$on$response: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$testWithTextEmojis$data2: [{"name":"messageWithTextEmojis","d":{"t":"str"},"opt":false}],
  inner$testWithTextEmojis$request$on$response: [{"name":"body","d":{"t":"str"},"opt":false}],
};
