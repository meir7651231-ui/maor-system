// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-17-all-working.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$testAgent$Promise$question(agent) {
    const question = `Hello! Please introduce yourself briefly and confirm you're working with your assigned provider (${agent.provider}) for your role: ${agent.role}.`;
    return question;
}
export function inner$testAgent$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}

export const SIGS = {
  inner$testAgent$Promise$question: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$testAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
};
