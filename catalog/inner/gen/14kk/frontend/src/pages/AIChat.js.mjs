// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:frontend/src/pages/AIChat.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AIChat$generateAIResponse$messageLower(userMessage) {
    const messageLower = userMessage.toLowerCase();
    return messageLower;
}

export const SIGS = {
  inner$AIChat$generateAIResponse$messageLower: [{"name":"userMessage","d":{"t":"any"},"opt":false}],
};
