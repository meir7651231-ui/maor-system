// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:connecthub-master.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const AGENTS = [
    {
        id: "atlas",
        name: "Atlas",
        tagline: "General Intelligence",
        color: "#6366f1",
        avatar: "🌐",
        model: "openai/gpt-4o"
    },
    {
        id: "nexus",
        name: "Nexus",
        tagline: "Code & Engineering",
        color: "#10b981",
        avatar: "⚡",
        model: "anthropic/claude-3.5-sonnet"
    },
    {
        id: "sage",
        name: "Sage",
        tagline: "Research & Analysis",
        color: "#f59e0b",
        avatar: "🔍",
        model: "google/gemini-2.0-flash-exp"
    },
    {
        id: "spark",
        name: "Spark",
        tagline: "Creative Writing",
        color: "#ec4899",
        avatar: "✨",
        model: "openai/gpt-4o"
    },
    {
        id: "oracle",
        name: "Oracle",
        tagline: "Strategy & Business",
        color: "#8b5cf6",
        avatar: "📊",
        model: "anthropic/claude-3.5-sonnet"
    },
    {
        id: "luna",
        name: "Luna",
        tagline: "Psychology & Mental Health",
        color: "#06b6d4",
        avatar: "🧠",
        model: "openai/gpt-4o"
    },
    {
        id: "phoenix",
        name: "Phoenix",
        tagline: "Health & Fitness",
        color: "#ef4444",
        avatar: "🔥",
        model: "google/gemini-2.0-flash-exp"
    },
    {
        id: "quantum",
        name: "Quantum",
        tagline: "Science & Physics",
        color: "#eab308",
        avatar: "⚛️",
        model: "anthropic/claude-3.5-sonnet"
    },
    {
        id: "echo",
        name: "Echo",
        tagline: "Language & Translation",
        color: "#059669",
        avatar: "🗣️",
        model: "google/gemini-2.0-flash-exp"
    },
    {
        id: "rhythm",
        name: "Rhythm",
        tagline: "Music & Audio",
        color: "#ea580c",
        avatar: "🎵",
        model: "openai/gpt-4o"
    },
    {
        id: "canvas",
        name: "Canvas",
        tagline: "Art & Design",
        color: "#92400e",
        avatar: "🎨",
        model: "openai/gpt-4o"
    },
    {
        id: "cortex",
        name: "Cortex",
        tagline: "Neuroscience & Cognition",
        color: "#6b7280",
        avatar: "🧬",
        model: "anthropic/claude-3.5-sonnet"
    },
    {
        id: "voyager",
        name: "Voyager",
        tagline: "Travel & Culture",
        color: "#0891b2",
        avatar: "✈️",
        model: "google/gemini-2.0-flash-exp"
    },
    {
        id: "bloom",
        name: "Bloom",
        tagline: "Nature & Environment",
        color: "#16a34a",
        avatar: "🌿",
        model: "openai/gpt-4o"
    },
    {
        id: "matrix",
        name: "Matrix",
        tagline: "Mathematics & Logic",
        color: "#1e40af",
        avatar: "🔢",
        model: "anthropic/claude-3.5-sonnet"
    },
    {
        id: "zen",
        name: "Zen",
        tagline: "Mindfulness & Meditation",
        color: "#d1d5db",
        avatar: "🧘",
        model: "openai/gpt-4o"
    },
    {
        id: "nova",
        name: "Nova",
        tagline: "Space & Astronomy",
        color: "#a855f7",
        avatar: "🌟",
        model: "google/gemini-2.0-flash-exp"
    }
];
export function inner$testAgentViaConnectHub$Promise$data(agent) {
    const question = "Hello! Please introduce yourself briefly and confirm you're working through ConnectHub with your assigned AI model.";
    const data = JSON.stringify({
        model: agent.model,
        messages: [
            {
                role: "system",
                content: `You are ${agent.name}, ${agent.tagline}. You are connected through ConnectHub, the ultimate AI router.`
            },
            {
                role: "user",
                content: question
            }
        ],
        max_tokens: 100,
        temperature: 0.7
    });
    return data;
}
export function inner$testAgentViaConnectHub$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}
export function inner$testAllAgentsViaConnectHub$providers() {
    const providers = {
        'OpenAI GPT-4o': AGENTS.filter(a => a.model.includes('gpt-4o')).length,
        'Anthropic Claude-3.5': AGENTS.filter(a => a.model.includes('claude-3.5')).length,
        'Google Gemini-2.0': AGENTS.filter(a => a.model.includes('gemini-2.0')).length
    };
    return providers;
}

export const SIGS = {
  inner$testAgentViaConnectHub$Promise$data: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$testAgentViaConnectHub$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$testAllAgentsViaConnectHub$providers: [],
};
