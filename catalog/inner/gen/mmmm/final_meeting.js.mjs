// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:final_meeting.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$getRequestDetails$systemPrompt(agent) {
    const systemPrompt = `You are ${agent.name}. Introduce yourself and state your function concisely.`;
    return systemPrompt;
}
export function inner$communicateWithAgent$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}

export const SIGS = {
  inner$getRequestDetails$systemPrompt: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
};
