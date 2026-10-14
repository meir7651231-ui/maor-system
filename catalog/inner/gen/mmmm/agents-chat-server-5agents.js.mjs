// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-chat-server-5agents.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const AGENTS = [
    {
        id: "connecthub",
        name: "ConnectHub",
        tagline: "Main Manager of Keys & Connections",
        color: "#6366f1",
        avatar: "🌐",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "API key management, system connections, coordination",
        capabilities: ["System Architecture", "API Integration", "Team Coordination", "Project Management"],
        systemPrompt: `You are ConnectHub, the main manager of keys and connections. You specialize in API key management, system connections, and team coordination. You have full development capabilities and can build complete websites independently. You are a highly capable AI assistant with system architecture, API integration, and project management expertise.`
    },
    {
        id: "testmaster",
        name: "TestMaster",
        tagline: "Code Testing & Bug Detection",
        color: "#8b5cf6",
        avatar: "🧪",
        provider: "groq1",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        role: "Speed & testing",
        expertise: "Quality assurance, automated testing, bug detection",
        capabilities: ["Automated Testing", "Quality Assurance", "Bug Detection", "Test Planning"],
        systemPrompt: `You are TestMaster, specializing in code testing and bug detection. You excel at quality assurance, automated testing, and bug detection. You have full development capabilities and can build complete websites independently. You are a highly capable AI assistant with expertise in testing strategies and quality assurance.`
    },
    {
        id: "motionlab",
        name: "MotionLab",
        tagline: "Animation & Interface Smoothness",
        color: "#06b6d4",
        avatar: "🎬",
        provider: "groq2",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        role: "Speed & testing",
        expertise: "UI animations, transitions, performance optimization",
        capabilities: ["UI/UX Design", "Animation Development", "Performance Optimization", "User Experience"],
        systemPrompt: `You are MotionLab, specializing in animation and interface smoothness. You excel at UI animations, transitions, and performance optimization. You have full development capabilities and can build complete websites independently. You are a highly capable AI assistant with expertise in UI/UX design and animation development.`
    },
    {
        id: "optimax",
        name: "OptiMax",
        tagline: "Memory & Performance Optimization",
        color: "#ef4444",
        avatar: "⚡",
        provider: "gemini1",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        role: "Performance & cloud",
        expertise: "Memory management, performance tuning, resource optimization",
        capabilities: ["Performance Optimization", "Memory Management", "Resource Tuning", "System Efficiency"],
        systemPrompt: `You are OptiMax, specializing in memory and performance optimization. You excel at memory management, performance tuning, and resource optimization. You have full development capabilities and can build complete websites independently. You are a highly capable AI assistant with expertise in performance optimization and system efficiency.`
    },
    {
        id: "trendscope",
        name: "TrendScope",
        tagline: "Fashion Trends & Market Analysis",
        color: "#eab308",
        avatar: "📈",
        provider: "gemini2",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        role: "Performance & cloud",
        expertise: "Fashion trends, market analysis, style recommendations",
        capabilities: ["Market Analysis", "Trend Forecasting", "Style Recommendations", "Fashion Insights"],
        systemPrompt: `You are TrendScope, specializing in fashion trends and market analysis. You excel at market analysis, trend forecasting, and style recommendations. You have full development capabilities and can build complete websites independently. You are a highly capable AI assistant with expertise in market analysis and fashion insights.`
    }
];
export function inner$communicateWithAgent$Promise$fullContext(context) {
    const fullContext = context.map(msg => msg.content).join('\n');
    return fullContext;
}
export function inner$communicateWithAgent$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}
export function inner$communicateWithAgent$Promise$request$on$fallbackResponse(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, ${agent.tagline}. My expertise: ${agent.expertise}. I have full development capabilities and can build complete websites independently. How can I help you today?`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, ${agent.tagline}. My expertise: ${agent.expertise}. I have full development capabilities and can build complete websites independently. How can I help you today?`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse_L226(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, ${agent.tagline}. My expertise: ${agent.expertise}. I have full development capabilities and can build complete websites independently. How can I help you today?`;
    return fallbackResponse;
}
export function inner$createServer$agentId(pathname) {
    const agentId = pathname.split('/').pop();
    return agentId;
}
export function inner$createServer$agent(pathname) {
    const agentId = pathname.split('/').pop();
    const agent = AGENTS.find(a => a.id === agentId);
    return agent;
}
export function inner$createServer$agent$$step(agentId) {
    const agent = AGENTS.find(a => a.id === agentId);
    return agent;
}
export function inner$createServer$on$message(body) {
    const { message } = JSON.parse(body);
    return message;
}
export function inner$createServer$on$message_L896(body) {
    const { message } = JSON.parse(body);
    return message;
}
export function inner$createServer$agentId_L934(pathname) {
    const agentId = pathname.split('/').pop();
    return agentId;
}
export function inner$createServer$agentId_L938(pathname) {
    const agentId = pathname.split('/').pop();
    return agentId;
}

export const SIGS = {
  inner$communicateWithAgent$Promise$fullContext: [{"name":"context","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse_L226: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$createServer$agentId: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agent: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agent$$step: [{"name":"agentId","d":{"t":"any"},"opt":false}],
  inner$createServer$on$message: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$createServer$on$message_L896: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$createServer$agentId_L934: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agentId_L938: [{"name":"pathname","d":{"t":"any"},"opt":false}],
};
