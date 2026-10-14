// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-17-simple.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$testAgent$Promise$data(agent) {
    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: `You are ${agent.name}, ${agent.tagline}. ${agent.description || 'A specialized AI agent.'}`
            },
            {
                role: "user",
                content: "Hello! Please introduce yourself briefly in one sentence."
            }
        ],
        max_tokens: 50,
        temperature: 0.7
    });
    return data;
}
export function inner$testAgent$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}

export const SIGS = {
  inner$testAgent$Promise$data: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$testAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
};
