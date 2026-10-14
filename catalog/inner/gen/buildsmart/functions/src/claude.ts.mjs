// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/claude.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const kDefaultModel = "claude-haiku-4-5-20251001";
const kAllowedModels = new Set([
    kDefaultModel, // haiku 4.5 — the cheap default
    "claude-sonnet-4-6", // the only stronger tier this app may opt into
]);
const kDefaultMaxTokens = 1024;
const kMaxTokensCap = 2048;
export function inner$enforceRateLimit$runTransaction$windowStart(cur) {
    const windowStart = typeof cur?.windowStart === "number" ? cur.windowStart : 0;
    return windowStart;
}
export function inner$enforceRateLimit$runTransaction$count(cur) {
    const count = typeof cur?.count === "number" ? cur.count : 0;
    return count;
}
export function inner$onCall$prompt(request) {
    const data = (request.data ?? {});
    const prompt = typeof data.prompt === "string" ? data.prompt.trim() : "";
    return prompt;
}
export function inner$onCall$prompt$$step(data) {
    const prompt = typeof data.prompt === "string" ? data.prompt.trim() : "";
    return prompt;
}
export function inner$onCall$system(request) {
    const data = (request.data ?? {});
    const system = typeof data.system === "string" && data.system.length > 0
        ? data.system
        : undefined;
    return system;
}
export function inner$onCall$system$$step(data) {
    const system = typeof data.system === "string" && data.system.length > 0
        ? data.system
        : undefined;
    return system;
}
export function inner$onCall$model(request) {
    const data = (request.data ?? {});
    const model = typeof data.model === "string" && kAllowedModels.has(data.model)
        ? data.model
        : kDefaultModel;
    return model;
}
export function inner$onCall$model$$step(data) {
    const model = typeof data.model === "string" && kAllowedModels.has(data.model)
        ? data.model
        : kDefaultModel;
    return model;
}
export function inner$onCall$maxTokens(request) {
    const data = (request.data ?? {});
    const maxTokens = typeof data.maxTokens === "number" &&
        Number.isFinite(data.maxTokens) &&
        data.maxTokens > 0
        ? Math.min(Math.round(data.maxTokens), kMaxTokensCap)
        : kDefaultMaxTokens;
    return maxTokens;
}
export function inner$onCall$maxTokens$$step(data) {
    const maxTokens = typeof data.maxTokens === "number" &&
        Number.isFinite(data.maxTokens) &&
        data.maxTokens > 0
        ? Math.min(Math.round(data.maxTokens), kMaxTokensCap)
        : kDefaultMaxTokens;
    return maxTokens;
}
export function inner$onCall$text(msg) {
    const text = msg.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
    return text;
}

export const SIGS = {
  inner$enforceRateLimit$runTransaction$windowStart: [{"name":"cur","d":{"t":"any"},"opt":false}],
  inner$enforceRateLimit$runTransaction$count: [{"name":"cur","d":{"t":"any"},"opt":false}],
  inner$onCall$prompt: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$prompt$$step: [{"name":"data","d":{"t":"obj","n":"AskClaudeData","p":[["prompt",{"t":"any"},true],["system",{"t":"any"},true],["model",{"t":"any"},true],["maxTokens",{"t":"any"},true]]},"opt":false}],
  inner$onCall$system: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$system$$step: [{"name":"data","d":{"t":"obj","n":"AskClaudeData","p":[["prompt",{"t":"any"},true],["system",{"t":"any"},true],["model",{"t":"any"},true],["maxTokens",{"t":"any"},true]]},"opt":false}],
  inner$onCall$model: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$model$$step: [{"name":"data","d":{"t":"obj","n":"AskClaudeData","p":[["prompt",{"t":"any"},true],["system",{"t":"any"},true],["model",{"t":"any"},true],["maxTokens",{"t":"any"},true]]},"opt":false}],
  inner$onCall$maxTokens: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$maxTokens$$step: [{"name":"data","d":{"t":"obj","n":"AskClaudeData","p":[["prompt",{"t":"any"},true],["system",{"t":"any"},true],["model",{"t":"any"},true],["maxTokens",{"t":"any"},true]]},"opt":false}],
  inner$onCall$text: [{"name":"msg","d":{"t":"any"},"opt":false}],
};
