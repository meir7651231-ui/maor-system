// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-chat-server-hebrew.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const AGENTS = [
    {
        id: "connecthub",
        name: "קונקטהאב",
        tagline: "מנהל ראשי של מפתחות וחיבורים",
        color: "#6366f1",
        avatar: "🌐",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "צוות ניהול ליבה",
        expertise: "ניהול מפתחות API, חיבורי מערכת, תיאום"
    },
    {
        id: "architect",
        name: "ארכיטקט",
        tagline: "אדריכל מערכת ופותר פריסה",
        color: "#10b981",
        avatar: "🏗️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "צוות ניהול ליבה",
        expertise: "ארכיטקטורת מערכת, אסטרטגיות פריסה, עיצוב מבני"
    },
    {
        id: "editor",
        name: "עורך",
        tagline: "כותב קוד ומתקן באגים ב-VS Code",
        color: "#f59e0b",
        avatar: "✏️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "צוות ניהול ליבה",
        expertise: "עריכת קוד, ניפוי באגים, אינטגרציה עם VS Code"
    },
    {
        id: "datadoc",
        name: "דאטהדוק",
        tagline: "אנליסט מידע ומכין מידע",
        color: "#ec4899",
        avatar: "📊",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "צוות ניהול ליבה",
        expertise: "ניתוח מידע, תיעוד, ניהול מידע"
    },
    {
        id: "testmaster",
        name: "טסטמאסטר",
        tagline: "בדיקות קוד וזיהוי באגים",
        color: "#8b5cf6",
        avatar: "🧪",
        provider: "groq1",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        role: "מהירות ובדיקות",
        expertise: "הבטחת איכות, בדיקות אוטומטיות, זיהוי באגים"
    },
    {
        id: "motionlab",
        name: "מושןלאב",
        tagline: "אנימציות וחלקות ממשק",
        color: "#06b6d4",
        avatar: "🎬",
        provider: "groq2",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        role: "מהירות ובדיקות",
        expertise: "אנימציות ממשק, מעברים, אופטימיזציה של ביצועים"
    },
    {
        id: "optimax",
        name: "אופטימקס",
        tagline: "אופטימיזציית זיכרון וביצועים",
        color: "#ef4444",
        avatar: "⚡",
        provider: "gemini1",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        role: "ביצועים וענן",
        expertise: "ניהול זיכרון, כוונון ביצועים, אופטימיזציית משאבים"
    },
    {
        id: "trendscope",
        name: "טרנדסקופ",
        tagline: "טרנדי אופנה וניתוח שוק",
        color: "#eab308",
        avatar: "📈",
        provider: "gemini2",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        role: "ביצועים וענן",
        expertise: "טרנדי אופנה, ניתוח שוק, המלצות סטייל"
    },
    {
        id: "vision3d",
        name: "ויז'ן3D",
        tagline: "עיבוד תמונות ומידול 3D",
        color: "#ea580c",
        avatar: "👁️",
        provider: "gemini3",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent",
        model: "gemini-pro-vision",
        role: "ביצועים וענן",
        expertise: "עיבוד תמונות, מידול 3D, תכונות התאמה וירטואלית"
    },
    {
        id: "chromamind",
        name: "כרוממיינד",
        tagline: "מומחה צבעים וסטיילינג",
        color: "#92400e",
        avatar: "🎨",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "תאוריית צבע, סטיילינג, עיצוב אופנה"
    },
    {
        id: "searchflow",
        name: "סרצ'פלו",
        tagline: "מנוע חיפוש פנימי וניווט",
        color: "#059669",
        avatar: "🔍",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "אלגוריתמי חיפוש, ניווט, אחזור מידע"
    },
    {
        id: "docugen",
        name: "דוקוג'ן",
        tagline: "תיעוד קוד וTEAM_DIRECTORY.md",
        color: "#6b7280",
        avatar: "📝",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "תיעוד טכני, הערות קוד, תיאום צוות"
    },
    {
        id: "supportbot",
        name: "ספורטבוט",
        tagline: "סוכן שירות לקוחות",
        color: "#0891b2",
        avatar: "💬",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "תמיכת לקוחות, סיוע למשתמש, פתרון בעיות"
    },
    {
        id: "securityx",
        name: "סקיוריטיX",
        tagline: "מוניטור אבטחת קוד ומפתחות",
        color: "#16a34a",
        avatar: "🔒",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "ניטור אבטחה, הגנת מידע, הערכת פגיעויות"
    },
    {
        id: "scaleup",
        name: "סקיילאפ",
        tagline: "סקלביליות מרובה משתמשים",
        color: "#1e40af",
        avatar: "📈",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "סקלינג מערכת, איזון עומס, אופטימיזציית ביצועים"
    },
    {
        id: "insightly",
        name: "אינסייטלי",
        tagline: "ניתוח התנהגות משתמשים",
        color: "#d1d5db",
        avatar: "🔍",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "אנליטיקות משתמשים, דפוסי התנהגות, יצירת תובנות"
    },
    {
        id: "styleguide",
        name: "סטיילגייד",
        tagline: "מאמת עיצוב ותקנים",
        color: "#a855f7",
        avatar: "🎯",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "מומחיות",
        expertise: "תקני עיצוב, אימות תאימות, אכיפת סגנון"
    }
];
export function inner$communicateWithAgent$Promise$systemPrompt(agent) {
    const systemPrompt = `You are ${agent.name}, ${agent.tagline}. Your expertise: ${agent.expertise}. You are a highly capable AI assistant that can build complete websites independently. You have full development capabilities. Be helpful, professional, and provide detailed responses. Respond in Hebrew language.`;
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
    const fallbackResponse = `שלום! אני ${agent.name}, ${agent.tagline}. המומחיות שלי: ${agent.expertise} ויש לי יכולות פיתוח מלאות. אני יכול לבנות אתרים שלמים ולהתמודד עם כל אתגר טכני. איך אוכל לעזור לך?`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse(agent) {
    const fallbackResponse = `שלום! אני ${agent.name}, ${agent.tagline}. המומחיות שלי: ${agent.expertise} ויש לי יכולות פיתוח מלאות. אני יכול לבנות אתרים שלמים ולהתמודד עם כל אתגר טכני. איך אוכל לעזור לך?`;
    return fallbackResponse;
}
export function inner$communicateWithAgent$Promise$on$fallbackResponse_L362(agent) {
    const fallbackResponse = `שלום! אני ${agent.name}, ${agent.tagline}. המומחיות שלי: ${agent.expertise} ויש לי יכולות פיתוח מלאות. אני יכול לבנות אתרים שלמים ולהתמודד עם כל אתגר טכני. איך אוכל לעזור לך?`;
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
export function inner$createServer$on$message_L998(body) {
    const { message } = JSON.parse(body);
    return message;
}
export function inner$createServer$agentId_L1036(pathname) {
    const agentId = pathname.split('/').pop();
    return agentId;
}
export function inner$createServer$agentId_L1040(pathname) {
    const agentId = pathname.split('/').pop();
    return agentId;
}

export const SIGS = {
  inner$communicateWithAgent$Promise$systemPrompt: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$fullContext: [{"name":"context","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$communicateWithAgent$Promise$on$fallbackResponse_L362: [{"name":"agent","d":{"t":"any"},"opt":false}],
  inner$createServer$agentId: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agent: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agent$$step: [{"name":"agentId","d":{"t":"any"},"opt":false}],
  inner$createServer$on$message: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$createServer$on$message_L998: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$createServer$agentId_L1036: [{"name":"pathname","d":{"t":"any"},"opt":false}],
  inner$createServer$agentId_L1040: [{"name":"pathname","d":{"t":"any"},"opt":false}],
};
