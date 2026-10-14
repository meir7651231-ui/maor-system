// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-chat-server.js — לא לערוך ביד.
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
        expertise: "API key management, system connections, coordination"
    },
    {
        id: "architect",
        name: "Architect",
        tagline: "System Architect & Deployment Solver",
        color: "#10b981",
        avatar: "🏗️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "System architecture, deployment strategies, structural design"
    },
    {
        id: "editor",
        name: "Editor",
        tagline: "Code Writer & Fixer in VS Code",
        color: "#f59e0b",
        avatar: "✏️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "Code editing, debugging, VS Code integration"
    },
    {
        id: "datadoc",
        name: "DataDoc",
        tagline: "Data Analyst & Information Preparer",
        color: "#ec4899",
        avatar: "📊",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "Data analysis, documentation, information management"
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
        expertise: "Quality assurance, automated testing, bug detection"
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
        expertise: "UI animations, transitions, performance optimization"
    },
    {
        id: "optimax",
        name: "OptiMax",
        tagline: "RAM Optimization & Performance",
        color: "#ef4444",
        avatar: "⚡",
        provider: "gemini1",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        role: "Performance & cloud",
        expertise: "Memory management, performance tuning, resource optimization"
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
        expertise: "Fashion trends, market analysis, style recommendations"
    },
    {
        id: "vision3d",
        name: "Vision3D",
        tagline: "Image Processing & 3D Modeling",
        color: "#ea580c",
        avatar: "👁️",
        provider: "gemini3",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent",
        model: "gemini-pro-vision",
        role: "Performance & cloud",
        expertise: "Image processing, 3D modeling, virtual try-on features"
    },
    {
        id: "chromamind",
        name: "ChromaMind",
        tagline: "Color & Styling Expert",
        color: "#92400e",
        avatar: "🎨",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Color theory, styling, fashion design"
    },
    {
        id: "searchflow",
        name: "SearchFlow",
        tagline: "Internal Search Engine & Navigation",
        color: "#059669",
        avatar: "🔍",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Search algorithms, navigation, information retrieval"
    },
    {
        id: "docugen",
        name: "DocuGen",
        tagline: "Code Documentation & TEAM_DIRECTORY.md",
        color: "#6b7280",
        avatar: "📝",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Technical documentation, code comments, team coordination"
    },
    {
        id: "supportbot",
        name: "SupportBot",
        tagline: "Customer Service Agent",
        color: "#0891b2",
        avatar: "💬",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Customer support, user assistance, problem resolution"
    },
    {
        id: "securityx",
        name: "SecurityX",
        tagline: "Code & Key Security Monitor",
        color: "#16a34a",
        avatar: "🔒",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Security monitoring, data protection, vulnerability assessment"
    },
    {
        id: "scaleup",
        name: "ScaleUp",
        tagline: "Multi-User Scalability",
        color: "#1e40af",
        avatar: "📈",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "System scaling, load balancing, performance optimization"
    },
    {
        id: "insightly",
        name: "Insightly",
        tagline: "User Behavior Analysis",
        color: "#d1d5db",
        avatar: "🔍",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "User analytics, behavior patterns, insights generation"
    },
    {
        id: "styleguide",
        name: "StyleGuide",
        tagline: "Design Compliance Verifier",
        color: "#a855f7",
        avatar: "🎯",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Design standards, compliance verification, style enforcement"
    }
];
export function inner$communicateWithAgent$Promise$systemPrompt(agent) {
    const systemPrompt = `You are ${agent.name}, ${agent.tagline}. Your expertise: ${agent.expertise}. You are a highly capable AI assistant that can build complete websites independently. You have full development capabilities. Be helpful, professional, and provide detailed responses in English.`;
    return systemPrompt;
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
    const fallbackResponse = "Hello! I'm " + agent.name + ", your " + agent.tagline + ". I specialize in " + agent.expertise + " and have full development capabilities. I can build complete websites and handle any technical challenge. How can I help you?";
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse(agent) {
    const fallbackResponse = "Hello! I'm " + agent.name + ", your " + agent.tagline + ". I specialize in " + agent.expertise + " and have full development capabilities. I can build complete websites and handle any technical challenge. How can I help you?";
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse_L362(agent) {
    const fallbackResponse = "Hello! I'm " + agent.name + ", your " + agent.tagline + ". I specialize in " + agent.expertise + " and have full development capabilities. I can build complete websites and handle any technical challenge. How can I help you?";
    return fallbackResponse;
}
export function inner$post$agent(agentId) {
    const agent = AGENTS.find(a => a.id === agentId);
    return agent;
}

export const SIGS = {
  inner$communicateWithAgent$Promise$systemPrompt: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$fullContext: [{"name":"context","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse_L362: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$post$agent: [{"name":"agentId","d":{"t":"any"},"opt":false}],
};
