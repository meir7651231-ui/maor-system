// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:services/telegram-bot-service.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$TelegramBotService$setWebhook$data(webhookUrl) {
    const data = JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'inline_query', 'chat_member']
    });
    return data;
}
export function inner$TelegramBotService$sendAssetsMessage$message(assetsResponse) {
    const assets = assetsResponse.assets || [];
    let message = `📈 הנכסים שלם (${assets.length} נכסים):\n\n`;
    return message;
}
export function inner$TelegramBotService$sendAssetsMessage$message$$step(assets) {
    let message = `📈 הנכסים שלם (${assets.length} נכסים):\n\n`;
    return message;
}
export function inner$TelegramBotService$sendAssetsMessage$forEach$valueFormatted(asset) {
    const valueFormatted = asset.value.toLocaleString('he-IL');
    return valueFormatted;
}
export function inner$TelegramBotService$searchAssets$results(query) {
    const results = [
        {
            type: 'article',
            id: '1',
            title: 'חיפוש נכסים',
            input_message_content: {
                message_text: `חיפוש נכסים עבור: ${query}`
            },
            description: 'חפש נכסים במערכת'
        }
    ];
    return results;
}
export function inner$TelegramBotService$makeRequest$Promise$request$on$response(body) {
    const response = JSON.parse(body);
    return response;
}

export const SIGS = {
  inner$TelegramBotService$setWebhook$data: [{"name":"webhookUrl","d":{"t":"any"},"opt":false}],
  inner$TelegramBotService$sendAssetsMessage$message: [{"name":"assetsResponse","d":{"t":"any"},"opt":false}],
  inner$TelegramBotService$sendAssetsMessage$message$$step: [{"name":"assets","d":{"t":"any"},"opt":false}],
  inner$TelegramBotService$sendAssetsMessage$forEach$valueFormatted: [{"name":"asset","d":{"t":"any"},"opt":false}],
  inner$TelegramBotService$searchAssets$results: [{"name":"query","d":{"t":"any"},"opt":false}],
  inner$TelegramBotService$makeRequest$Promise$request$on$response: [{"name":"body","d":{"t":"str"},"opt":false}],
};
