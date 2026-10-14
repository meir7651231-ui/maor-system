// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:ask-agents-keys.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$askAgentAboutKeys$Promise$question(agent) {
    const question = `Hello ${agent.name}! I need to know which API keys you require to function properly. 
  
  Please tell me:
  1. Which AI provider(s) you need (OpenAI, Gemini, Anthropic, Claude, etc.)
  2. What specific API keys are required
  3. Any other configuration needed
  
  Be specific and concise. Just list the providers and keys needed.`;
    return question;
}
export function inner$askAgentAboutKeys$Promise$data(agent) {
    const question = `Hello ${agent.name}! I need to know which API keys you require to function properly. 
  
  Please tell me:
  1. Which AI provider(s) you need (OpenAI, Gemini, Anthropic, Claude, etc.)
  2. What specific API keys are required
  3. Any other configuration needed
  
  Be specific and concise. Just list the providers and keys needed.`;
    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: `You are ${agent.name}, ${agent.tagline}. You are a specialized AI agent. Answer honestly about your technical requirements.`
            },
            {
                role: "user",
                content: question
            }
        ],
        max_tokens: 150,
        temperature: 0.3
    });
    return data;
}
export function inner$askAgentAboutKeys$Promise$data$$step(agent, question) {
    const data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: `You are ${agent.name}, ${agent.tagline}. You are a specialized AI agent. Answer honestly about your technical requirements.`
            },
            {
                role: "user",
                content: question
            }
        ],
        max_tokens: 150,
        temperature: 0.3
    });
    return data;
}
export function inner$askAgentAboutKeys$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}
export function inner$askAllAgentsAboutKeys$forEach$response(result) {
    const response = result.response.toLowerCase();
    return response;
}

export const SIGS = {
  inner$askAgentAboutKeys$Promise$question: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$askAgentAboutKeys$Promise$data: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$askAgentAboutKeys$Promise$data$$step: [{"name":"agent","d":{"t":"any"},"opt":false},{"name":"question","d":{"t":"str"},"opt":false}],
  inner$askAgentAboutKeys$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$askAllAgentsAboutKeys$forEach$response: [{"name":"result","d":{"t":"any"},"opt":false}],
};
