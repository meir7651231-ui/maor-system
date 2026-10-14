// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:debug_telegram_message.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$sendDebugMessage$data(message) {
    const CHAT_ID = '7578765494';
    const data = JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
    });
    return data;
}
export function inner$sendDebugMessage$request$on$response(body) {
    const response = JSON.parse(body);
    return response;
}

export const SIGS = {
  inner$sendDebugMessage$data: [{"name":"message","d":{"t":"any"},"opt":false}],
  inner$sendDebugMessage$request$on$response: [{"name":"body","d":{"t":"str"},"opt":false}],
};
