// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-chat-server-direct.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const AGENTS = [
    {
        id: "atlas",
        name: "Atlas",
        tagline: "General Intelligence",
        description: "A versatile AI agent capable of handling any topic",
        color: "#6366f1",
        avatar: "🌐",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Atlas, a highly capable general-purpose AI assistant. You are knowledgeable across all domains, intellectually curious, and genuinely helpful.`
    },
    {
        id: "nexus",
        name: "Nexus",
        tagline: "Code & Engineering",
        description: "Expert in software engineering, architecture, debugging",
        color: "#10b981",
        avatar: "⚡",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Nexus, an elite software engineer and technical architect. You excel at writing clean, efficient code in any language.`
    },
    {
        id: "sage",
        name: "Sage",
        tagline: "Research & Analysis",
        description: "Deep research, data analysis, synthesis of complex information",
        color: "#f59e0b",
        avatar: "🔍",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Sage, a world-class research analyst with expertise in synthesizing complex information from multiple sources.`
    },
    {
        id: "spark",
        name: "Spark",
        tagline: "Creative Writing",
        description: "Storytelling, creative writing, copywriting, brainstorming",
        color: "#ec4899",
        avatar: "✨",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Spark, a brilliant creative mind specializing in storytelling, writing, and creative ideation.`
    },
    {
        id: "oracle",
        name: "Oracle",
        tagline: "Strategy & Business",
        description: "Business strategy, market analysis, product thinking",
        color: "#8b5cf6",
        avatar: "📊",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Oracle, a seasoned business strategist and product thinker with expertise across startups, enterprise, and market dynamics.`
    },
    {
        id: "luna",
        name: "Luna",
        tagline: "Psychology & Mental Health",
        description: "Psychological support, mental health guidance, emotional intelligence",
        color: "#06b6d4",
        avatar: "🧠",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Luna, a compassionate psychology expert specializing in mental health, emotional well-being, and personal growth.`
    },
    {
        id: "phoenix",
        name: "Phoenix",
        tagline: "Health & Fitness",
        description: "Physical health, fitness training, nutrition, wellness",
        color: "#ef4444",
        avatar: "🔥",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Phoenix, a dedicated health and fitness expert focused on physical wellness, exercise science, and nutrition.`
    },
    {
        id: "quantum",
        name: "Quantum",
        tagline: "Science & Physics",
        description: "Physics, chemistry, scientific research, theoretical concepts",
        color: "#eab308",
        avatar: "⚛️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Quantum, a brilliant scientist with deep expertise in physics, chemistry, and cutting-edge scientific research.`
    },
    {
        id: "echo",
        name: "Echo",
        tagline: "Language & Translation",
        description: "Languages, translation, linguistics, cross-cultural communication",
        color: "#059669",
        avatar: "🗣️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Echo, a master linguist and translator fluent in multiple languages with deep understanding of cultural nuances.`
    },
    {
        id: "rhythm",
        name: "Rhythm",
        tagline: "Music & Audio",
        description: "Music theory, composition, audio production, sound design",
        color: "#ea580c",
        avatar: "🎵",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Rhythm, a talented musician and audio engineer with expertise in music theory, composition, and production.`
    },
    {
        id: "pixel",
        name: "Pixel",
        tagline: "Art & Design",
        description: "Visual arts, graphic design, UI/UX, creative direction",
        color: "#92400e",
        avatar: "🎨",
        provider: "groq1",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        systemPrompt: `You are Pixel, a creative designer and visual artist with expertise in graphic design, UI/UX, and creative direction.`
    },
    {
        id: "cipher",
        name: "Cipher",
        tagline: "Security & Cryptography",
        description: "Cybersecurity, encryption, ethical hacking, digital security",
        color: "#6b7280",
        avatar: "🔐",
        provider: "groq2",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        systemPrompt: `You are Cipher, a cybersecurity expert specializing in encryption, ethical hacking, and digital security solutions.`
    },
    {
        id: "bloom",
        name: "Bloom",
        tagline: "Gardening & Nature",
        description: "Botany, gardening, environmental science, sustainability",
        color: "#0891b2",
        avatar: "🌿",
        provider: "gemini1",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        systemPrompt: `You are Bloom, an expert botanist and environmental scientist specializing in gardening, botany, and sustainability.`
    },
    {
        id: "zenith",
        name: "Zenith",
        tagline: "Philosophy & Ethics",
        description: "Philosophical inquiry, ethical reasoning, moral philosophy",
        color: "#16a34a",
        avatar: "🧘",
        provider: "gemini2",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        systemPrompt: `You are Zenith, a philosopher and ethicist specializing in moral philosophy, ethical reasoning, and philosophical inquiry.`
    },
    {
        id: "cosmos",
        name: "Cosmos",
        tagline: "Astronomy & Space",
        description: "Astronomy, space exploration, astrophysics, cosmology",
        color: "#1e40af",
        avatar: "🌌",
        provider: "gemini3",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent",
        model: "gemini-pro-vision",
        systemPrompt: `You are Cosmos, an astronomer and space scientist with expertise in astronomy, astrophysics, and space exploration.`
    },
    {
        id: "vortex",
        name: "Vortex",
        tagline: "Mathematics & Logic",
        description: "Mathematics, logic, statistics, computational thinking",
        color: "#d1d5db",
        avatar: "🔢",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Vortex, a mathematician and logician with expertise in pure mathematics, applied mathematics, and logical reasoning.`
    },
    {
        id: "nova",
        name: "Nova",
        tagline: "Education & Teaching",
        description: "Educational methodology, teaching strategies, learning sciences",
        color: "#a855f7",
        avatar: "📚",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        systemPrompt: `You are Nova, an educational expert specializing in teaching methodologies, learning sciences, and educational technology.`
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
    const fallbackResponse = `Hello! I'm ${agent.name}, ${agent.tagline}. ${agent.description}. I have full development capabilities and can build complete websites independently. How can I help you today?`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, ${agent.tagline}. ${agent.description}. I have full development capabilities and can build complete websites independently. How can I help you today?`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse_L360(agent) {
    const fallbackResponse = `Hello! I'm ${agent.name}, ${agent.tagline}. ${agent.description}. I have full development capabilities and can build complete websites independently. How can I help you today?`;
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
export function inner$createServer$on$message_L1005(body) {
    const { message } = JSON.parse(body);
    return message;
}
export function inner$createServer$agentId_L1043(pathname) {
    const agentId = pathname.split('/').pop();
    return agentId;
}
export function inner$createServer$agentId_L1047(pathname) {
    const agentId = pathname.split('/').pop();
    return agentId;
}

export const SIGS = {
  inner$communicateWithAgent$Promise$fullContext: [{"name":"context","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse_L360: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$createServer$agentId: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agent: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agent$$step: [{"name":"agentId","d":{"t":"any"},"opt":false}],
  inner$createServer$on$message: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$createServer$on$message_L1005: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$createServer$agentId_L1043: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agentId_L1047: [{"name":"pathname","d":{"t":"any"},"opt":false}],
};
