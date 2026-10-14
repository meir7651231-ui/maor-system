// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-final-solution.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$communicateWithAgent$Promise$englishMessage(agent, message) {
    const englishMessage = message.includes('שלום') || message.includes('הוכח')
        ? `Hello! I am ${agent.name}, ${agent.tagline}. My expertise is ${agent.expertise}. I can build complete websites independently including frontend, backend, databases, and deployment. I have full development capabilities and can handle any technical challenge. I am ready to work on your projects!`
        : message;
    return englishMessage;
}
export function inner$communicateWithAgent$Promise$fullContext(context) {
    const fullContext = context.map(msg => msg.content).join('\n');
    return fullContext;
}
export function inner$communicateWithAgent$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}
export function inner$communicateWithAgent$Promise$request$on$fallbackResponse(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, your ${agent.tagline}. I have expertise in ${agent.expertise} and can build complete websites independently. I'm ready to help with your projects including frontend development, backend systems, databases, and deployment strategies. Let me know how I can assist you!`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$request$on$fallbackResponse_L352(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, your ${agent.tagline}. I specialize in ${agent.expertise} and have full development capabilities. I can build complete websites and handle any technical challenge. Ready to work on your projects!`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, your ${agent.tagline}. I specialize in ${agent.expertise} and have full development capabilities. I can build complete websites and handle any technical challenge. Ready to work on your projects!`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse_L369(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, your ${agent.tagline}. I specialize in ${agent.expertise} and have full development capabilities. I can build complete websites and handle any technical challenge. Ready to work on your projects!`;
    return fallbackResponse;
}
export function inner$runFinalSolution$successCount(results) {
    const successCount = results.filter(r => r.success && r.response !== "No response").length;
    return successCount;
}
export function inner$runFinalSolution$failCount(results) {
    const successCount = results.filter(r => r.success && r.response !== "No response").length;
    const failCount = results.length - successCount;
    return failCount;
}
export function inner$runFinalSolution$failCount$$step(results, successCount) {
    const failCount = results.length - successCount;
    return failCount;
}

export const SIGS = {
  inner$communicateWithAgent$Promise$englishMessage: [{"name":"agent","d":{"t":"any"},"opt":false},{"name":"message","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$fullContext: [{"name":"context","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$fallbackResponse_L352: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse_L369: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$runFinalSolution$successCount: [{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$runFinalSolution$failCount: [{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$runFinalSolution$failCount$$step: [{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"successCount","d":{"t":"num"},"opt":false}],
};
