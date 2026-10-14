// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:meeting.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$getRequestDetails$systemPrompt(agent) {
    const systemPrompt = `You are ${agent.name}. Be concise, introduce yourself, and state your primary function.`;
    return systemPrompt;
}
export function inner$communicateWithAgent$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}
export function inner$communicateWithAgent$Promise$request$on$reply(agent, responseData) {
    const response = JSON.parse(responseData);
    const reply = agent.provider.startsWith('gemini')
        ? response.candidates?.[0]?.content?.parts?.[0]?.text
        : response.choices?.[0]?.message?.content;
    return reply;
}
export function inner$communicateWithAgent$Promise$request$on$reply$$step(agent, response) {
    const reply = agent.provider.startsWith('gemini')
        ? response.candidates?.[0]?.content?.parts?.[0]?.text
        : response.choices?.[0]?.message?.content;
    return reply;
}

export const SIGS = {
  inner$getRequestDetails$systemPrompt: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$reply: [{"name":"agent","d":{"t":"any"},"opt":false},{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$reply$$step: [{"name":"agent","d":{"t":"any"},"opt":false},{"name":"response","d":{"t":"any"},"opt":false}],
};
