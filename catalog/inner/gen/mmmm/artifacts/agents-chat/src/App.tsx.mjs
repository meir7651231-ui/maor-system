// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/agents-chat/src/App.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$Home$activeAgent(agents, activeAgentId) {
    const activeAgent = agents.find((a) => a.id === activeAgentId);
    return activeAgent;
}
export function inner$Home$currentMessages(activeAgentId, history) {
    const currentMessages = activeAgentId ? (history[activeAgentId] || []) : [];
    return currentMessages;
}
export function inner$Home$handleSend$lines(streamBuffer) {
    const lines = streamBuffer.split("\n");
    return lines;
}
export function inner$Home$handleSend$dataStr(line) {
    const dataStr = line.slice(6);
    return dataStr;
}
export function inner$Home$handleSend$data(line) {
    const dataStr = line.slice(6);
    const data = JSON.parse(dataStr);
    return data;
}
export function inner$Home$handleSend$data$$step(dataStr) {
    const data = JSON.parse(dataStr);
    return data;
}
export function inner$Home$map$isActive(activeAgentId, agent) {
    const isActive = agent.id === activeAgentId;
    return isActive;
}

export const SIGS = {
  inner$Home$activeAgent: [{"name":"agents","d":{"t":"any"},"opt":false},{"name":"activeAgentId","d":{"t":"any"},"opt":false}],
  inner$Home$currentMessages: [{"name":"activeAgentId","d":{"t":"any"},"opt":false},{"name":"history","d":{"t":"any"},"opt":false}],
  inner$Home$handleSend$lines: [{"name":"streamBuffer","d":{"t":"str"},"opt":false}],
  inner$Home$handleSend$dataStr: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$Home$handleSend$data: [{"name":"line","d":{"t":"str"},"opt":false}],
  inner$Home$handleSend$data$$step: [{"name":"dataStr","d":{"t":"str"},"opt":false}],
  inner$Home$map$isActive: [{"name":"activeAgentId","d":{"t":"any"},"opt":false},{"name":"agent","d":{"t":"any"},"opt":false}],
};
