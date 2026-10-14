// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:test_auth.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$request$on$response(data) {
    const response = JSON.parse(data);
    return response;
}

export const SIGS = {
  inner$request$on$response: [{"name":"data","d":{"t":"str"},"opt":false}],
};
