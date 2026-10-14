// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:test_telegram.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$request$on$response(body) {
    const response = JSON.parse(body);
    return response;
}

export const SIGS = {
  inner$request$on$response: [{"name":"body","d":{"t":"str"},"opt":false}],
};
