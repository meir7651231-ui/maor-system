// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:ask-director-keys.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function extractKeyRequirements(response) {
    const requirements = {};
    const lines = response.split('\n');
    // Simple extraction logic - look for agent names and API keys
    const agents = [
        'Atlas', 'Nexus', 'Sage', 'Spark', 'Oracle', 'Luna', 'Phoenix',
        'Quantum', 'Echo', 'Rhythm', 'Canvas', 'Cortex', 'Voyager',
        'Bloom', 'Matrix', 'Zen', 'Nova'
    ];
    let currentAgent = null;
    lines.forEach(line => {
        const trimmedLine = line.trim();
        // Check if line contains an agent name
        const foundAgent = agents.find(agent => trimmedLine.toLowerCase().includes(agent.toLowerCase()));
        if (foundAgent) {
            currentAgent = foundAgent;
            requirements[currentAgent] = [];
        }
        // Check for API key mentions
        if (currentAgent && (trimmedLine.includes('API key') ||
            trimmedLine.includes('api key') ||
            trimmedLine.includes('GEMINI') ||
            trimmedLine.includes('GOOGLE') ||
            trimmedLine.includes('ANTHROPIC') ||
            trimmedLine.includes('CLAUDE') ||
            trimmedLine.includes('HUGGINGFACE') ||
            trimmedLine.includes('COHERE') ||
            trimmedLine.includes('REPLICATE') ||
            trimmedLine.includes('STABILITY'))) {
            if (!requirements[currentAgent].includes(trimmedLine)) {
                requirements[currentAgent].push(trimmedLine);
            }
        }
    });
    return requirements;
}
export function inner$askDirectorAboutKeys$Promise$data() {
    const question = `Hello Director! I am the system administrator. You are the Director Agent managing 17 specialized AI agents:
  
  1. Atlas (General Intelligence)
  2. Nexus (Code & Engineering) 
  3. Sage (Research & Analysis)
  4. Spark (Creative Writing)
  5. Oracle (Strategy & Business)
  6. Luna (Psychology & Mental Health)
  7. Phoenix (Health & Fitness)
  8. Quantum (Science & Physics)
  9. Echo (Language & Translation)
  10. Rhythm (Music & Audio)
  11. Canvas (Art & Design)
  12. Cortex (Neuroscience & Cognition)
  13. Voyager (Travel & Culture)
  14. Bloom (Nature & Environment)
  15. Matrix (Mathematics & Logic)
  16. Zen (Mindfulness & Meditation)
  17. Nova (Space & Astronomy)
  
  I need to know EXACTLY which API keys each agent requires to function properly. Please provide:
  
  1. For each agent: Which AI provider(s) they need
  2. Specific API key names required
  3. Any special configuration needed
  
  Be very specific and detailed. This is critical for system setup.`;
    const data = JSON.stringify({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `You are the Director Agent, the master controller of 17 specialized AI agents. You have complete knowledge of each agent's technical requirements and configurations. You are authoritative, precise, and detailed in your responses. Your role is to oversee the entire agent ecosystem and ensure proper system integration.`
            },
            {
                role: "user",
                content: question
            }
        ],
        max_tokens: 800,
        temperature: 0.1
    });
    return data;
}
export function inner$askDirectorAboutKeys$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}
export function inner$askDirectorAboutKeys$Promise$request$on$keyRequirements(responseData) {
    const response = JSON.parse(responseData);
    const reply = response.choices?.[0]?.message?.content || "No response";
    const keyRequirements = extractKeyRequirements(reply);
    return keyRequirements;
}
export function inner$askDirectorAboutKeys$Promise$request$on$keyRequirements$$step(reply) {
    const keyRequirements = extractKeyRequirements(reply);
    return keyRequirements;
}
export function inner$extractKeyRequirements$lines(response) {
    const lines = response.split('\n');
    return lines;
}
export function inner$extractKeyRequirements$forEach$trimmedLine(line) {
    const trimmedLine = line.trim();
    return trimmedLine;
}
export function inner$extractKeyRequirements$forEach$foundAgent(agents, line) {
    const trimmedLine = line.trim();
    const foundAgent = agents.find(agent => trimmedLine.toLowerCase().includes(agent.toLowerCase()));
    return foundAgent;
}
export function inner$extractKeyRequirements$forEach$foundAgent$$step(agents, trimmedLine) {
    const foundAgent = agents.find(agent => trimmedLine.toLowerCase().includes(agent.toLowerCase()));
    return foundAgent;
}

export const SIGS = {
  inner$askDirectorAboutKeys$Promise$data: [],
  inner$askDirectorAboutKeys$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$askDirectorAboutKeys$Promise$request$on$keyRequirements: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$askDirectorAboutKeys$Promise$request$on$keyRequirements$$step: [{"name":"reply","d":{"t":"any"},"opt":false}],
  inner$extractKeyRequirements$lines: [{"name":"response","d":{"t":"any"},"opt":false}],
  inner$extractKeyRequirements$forEach$trimmedLine: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$extractKeyRequirements$forEach$foundAgent: [{"name":"agents","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$extractKeyRequirements$forEach$foundAgent$$step: [{"name":"agents","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"trimmedLine","d":{"t":"any"},"opt":false}],
};
