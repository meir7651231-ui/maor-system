// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:lib/integrations-openai-ai-server/src/batch/utils.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isRateLimitError$errorMsg(error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return errorMsg;
}

export const SIGS = {
  inner$isRateLimitError$errorMsg: [{"name":"error","d":{"t":"any"},"opt":false}],
};
