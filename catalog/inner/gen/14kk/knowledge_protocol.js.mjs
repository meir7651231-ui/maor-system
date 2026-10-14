// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:knowledge_protocol.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AssetAnalyzer$scanConnections$apiMatches(content) {
    const apiMatches = content.match(/https?:\/\/[^\s'"]+/g);
    return apiMatches;
}
export function inner$AssetAnalyzer$scanConnections$dbMatches(content) {
    const dbMatches = content.match(/(mongodb|mysql|postgres|redis|sqlite)/gi);
    return dbMatches;
}
export function inner$AssetAnalyzer$scanConnections$serviceMatches(content) {
    const serviceMatches = content.match(/(telegram|discord|slack|github|google)/gi);
    return serviceMatches;
}
export function inner$AssetAnalyzer$extractFunctions$funcMatches(content) {
    const funcMatches = content.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(/g);
    return funcMatches;
}
export function inner$AssetAnalyzer$extractFunctions$forEach$funcName(match) {
    const funcName = match.replace(/function\s+|const\s+|=\s*\(.*/g, '');
    return funcName;
}
export function inner$AssetAnalyzer$extractFunctions$funcMatches_L252(content) {
    const funcMatches = content.match(/def\s+(\w+)/g);
    return funcMatches;
}
export function inner$AssetAnalyzer$extractFunctions$forEach$funcName_L255(match) {
    const funcName = match.replace(/def\s+/, '');
    return funcName;
}
export function inner$AssetAnalyzer$extractImports$importMatches(content) {
    const importMatches = content.match(/require\s*\(['"]([^'"]+)['"]\)|import.*from\s*['"]([^'"]+)['"]/g);
    return importMatches;
}
export function inner$AssetAnalyzer$extractImports$forEach$module(match) {
    const module = match.match(/(['"])([^'"]+)\1/);
    return module;
}
export function inner$AssetAnalyzer$extractImports$importMatches_L277(content) {
    const importMatches = content.match(/import\s+(\w+)|from\s+(\w+)\s+import/g);
    return importMatches;
}
export function inner$AssetAnalyzer$extractImports$forEach$module_L280(match) {
    const module = match.replace(/import\s+|from\s+|import.*/g, '');
    return module;
}
export function inner$AssetAnalyzer$detectSecrets$forEach$matches(content, pattern) {
    const matches = content.match(pattern);
    return matches;
}
export function inner$AssetAnalyzer$detectSecrets$forEach$forEach$secret(match) {
    const secret = match.match(/['"]([^'"]+)['"]/);
    return secret;
}
export function inner$AssetAnalyzer$analyzeComplexity$lines(content) {
    const lines = content.split('\n');
    return lines;
}
export function inner$AssetAnalyzer$calculateCyclomaticComplexity$forEach$matches(content, pattern) {
    const matches = content.match(pattern);
    return matches;
}
export function inner$AssetAnalyzer$calculateCognitiveComplexity$lines(content) {
    const lines = content.split('\n');
    return lines;
}
export function inner$AssetAnalyzer$calculateMaintainabilityIndex$lines(content) {
    const lines = content.split('\n').length;
    return lines;
}
export function inner$AssetAnalyzer$calculateReadability$words(content) {
    const words = content.split(/\s+/).length;
    return words;
}
export function inner$AssetAnalyzer$calculateReadability$sentences(content) {
    const sentences = content.split(/[.!?]+/).length;
    return sentences;
}
export function inner$AssetAnalyzer$calculateReadability$avgWordsPerSentence(content) {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    return avgWordsPerSentence;
}
export function inner$AssetAnalyzer$calculateReadability$avgWordsPerSentence$$step(words, sentences) {
    const avgWordsPerSentence = words / sentences;
    return avgWordsPerSentence;
}
export function inner$AssetAnalyzer$calculateReadability$readability(content) {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    const readability = Math.max(0, 100 - avgWordsPerSentence * 2);
    return readability;
}
export function inner$AssetAnalyzer$calculateReadability$readability$$step(avgWordsPerSentence) {
    const readability = Math.max(0, 100 - avgWordsPerSentence * 2);
    return readability;
}
export function inner$AssetAnalyzer$calculateModularity$classes(content) {
    const classes = (content.match(/class\s+\w+/g) || []).length;
    return classes;
}
export function inner$AssetAnalyzer$calculateDocumentation$docLines(content) {
    const docLines = content.split('\n').filter(line => line.trim().startsWith('//') ||
        line.trim().startsWith('#') ||
        line.includes('/**') ||
        line.includes('/*')).length;
    return docLines;
}
export function inner$AssetAnalyzer$calculateDocumentation$totalLines(content) {
    const totalLines = content.split('\n').length;
    return totalLines;
}
export function inner$AssetAnalyzer$calculateErrorHandling$tryBlocks(content) {
    const tryBlocks = (content.match(/try\s*{/g) || []).length;
    return tryBlocks;
}
export function inner$AssetAnalyzer$calculateErrorHandling$catchBlocks(content) {
    const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
    return catchBlocks;
}
export function inner$AssetAnalyzer$calculateStructureQuality$avgFunctionLength(content, functions) {
    const avgFunctionLength = content.length / Math.max(1, functions.length);
    return avgFunctionLength;
}
export function inner$AssetAnalyzer$analyzeInputValidation$validation(content) {
    const validation = content.includes('validate') || content.includes('sanitize') || content.includes('escape');
    return validation;
}
export function inner$AssetAnalyzer$analyzeAuthentication$auth(content) {
    const auth = content.includes('auth') || content.includes('login') || content.includes('token');
    return auth;
}
export function inner$AssetAnalyzer$analyzeEncryption$encryption(content) {
    const encryption = content.includes('encrypt') || content.includes('hash') || content.includes('crypto');
    return encryption;
}
export function inner$AssetAnalyzer$analyzeAccessControl$access(content) {
    const access = content.includes('permission') || content.includes('role') || content.includes('access');
    return access;
}
export function inner$AssetAnalyzer$analyzeAuditTrail$audit(content) {
    const audit = content.includes('log') || content.includes('audit') || content.includes('track');
    return audit;
}
export function inner$AssetAnalyzer$calculateEfficiency$lines(content) {
    const lines = content.split('\n').length;
    return lines;
}
export function inner$AssetAnalyzer$calculateScalability$asyncOps(content) {
    const asyncOps = (content.match(/async|await|Promise/g) || []).length;
    return asyncOps;
}
export function inner$AssetAnalyzer$estimateMemoryUsage$variables(content) {
    const variables = (content.match(/const|let|var/g) || []).length;
    return variables;
}
export function inner$AssetAnalyzer$estimateCpuUsage$loops(content) {
    const loops = (content.match(/for|while|do/g) || []).length;
    return loops;
}
export function inner$AssetAnalyzer$estimateLatency$apiCalls(content) {
    const apiCalls = (content.match(/fetch|axios|request/g) || []).length;
    return apiCalls;
}
export function inner$AssetAnalyzer$estimateThroughput$asyncOps(content) {
    const asyncOps = (content.match(/async|await/g) || []).length;
    return asyncOps;
}
export function inner$AssetAnalyzer$assessNovelty$found(content) {
    const uniqueTerms = ['blockchain', 'ai', 'machine', 'learning', 'neural', 'quantum'];
    const found = uniqueTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessNovelty$found$$step(content, uniqueTerms) {
    const found = uniqueTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessCreativity$patterns(content) {
    const patterns = content.split('\n').length;
    return patterns;
}
export function inner$AssetAnalyzer$assessTechnologicalAdvancement$found(content) {
    const techTerms = ['advanced', 'cutting-edge', 'state-of-the-art', 'innovative', 'revolutionary'];
    const found = techTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessTechnologicalAdvancement$found$$step(content, techTerms) {
    const found = techTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$estimateMarketSize$found(content) {
    const marketTerms = ['market', 'users', 'customers', 'clients'];
    const found = marketTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$estimateMarketSize$found$$step(content, marketTerms) {
    const found = marketTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$estimateRevenue$found(content) {
    const revenueTerms = ['price', 'cost', 'revenue', 'profit', 'income'];
    const found = revenueTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$estimateRevenue$found$$step(content, revenueTerms) {
    const found = revenueTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessMarketFit$found(content) {
    const marketTerms = ['user', 'customer', 'need', 'problem', 'solution'];
    const found = marketTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessMarketFit$found$$step(content, marketTerms) {
    const found = marketTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessCompetitiveAdvantage$found(content) {
    const advantageTerms = ['unique', 'better', 'faster', 'cheaper', 'easier'];
    const found = advantageTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessCompetitiveAdvantage$found$$step(content, advantageTerms) {
    const found = advantageTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessSustainability$found(content) {
    const sustainabilityTerms = ['sustainable', 'eco', 'green', 'renewable'];
    const found = sustainabilityTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}
export function inner$AssetAnalyzer$assessSustainability$found$$step(content, sustainabilityTerms) {
    const found = sustainabilityTerms.filter(term => content.toLowerCase().includes(term));
    return found;
}

export const SIGS = {
  inner$AssetAnalyzer$scanConnections$apiMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$scanConnections$dbMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$scanConnections$serviceMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractFunctions$funcMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractFunctions$forEach$funcName: [{"name":"match","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractFunctions$funcMatches_L252: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractFunctions$forEach$funcName_L255: [{"name":"match","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractImports$importMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractImports$forEach$module: [{"name":"match","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractImports$importMatches_L277: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$extractImports$forEach$module_L280: [{"name":"match","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$detectSecrets$forEach$matches: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"pattern","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$detectSecrets$forEach$forEach$secret: [{"name":"match","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$analyzeComplexity$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateCyclomaticComplexity$forEach$matches: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"pattern","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateCognitiveComplexity$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateMaintainabilityIndex$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateReadability$words: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateReadability$sentences: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateReadability$avgWordsPerSentence: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateReadability$avgWordsPerSentence$$step: [{"name":"words","d":{"t":"num"},"opt":false},{"name":"sentences","d":{"t":"num"},"opt":false}],
  inner$AssetAnalyzer$calculateReadability$readability: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateReadability$readability$$step: [{"name":"avgWordsPerSentence","d":{"t":"num"},"opt":false}],
  inner$AssetAnalyzer$calculateModularity$classes: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateDocumentation$docLines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateDocumentation$totalLines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateErrorHandling$tryBlocks: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateErrorHandling$catchBlocks: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateStructureQuality$avgFunctionLength: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"functions","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$AssetAnalyzer$analyzeInputValidation$validation: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$analyzeAuthentication$auth: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$analyzeEncryption$encryption: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$analyzeAccessControl$access: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$analyzeAuditTrail$audit: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateEfficiency$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$calculateScalability$asyncOps: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$estimateMemoryUsage$variables: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$estimateCpuUsage$loops: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$estimateLatency$apiCalls: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$estimateThroughput$asyncOps: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$assessNovelty$found: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$assessNovelty$found$$step: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"uniqueTerms","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$AssetAnalyzer$assessCreativity$patterns: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$assessTechnologicalAdvancement$found: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$assessTechnologicalAdvancement$found$$step: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"techTerms","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$AssetAnalyzer$estimateMarketSize$found: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$estimateMarketSize$found$$step: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"marketTerms","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$AssetAnalyzer$estimateRevenue$found: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$estimateRevenue$found$$step: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"revenueTerms","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$AssetAnalyzer$assessMarketFit$found: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$assessMarketFit$found$$step: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"marketTerms","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$AssetAnalyzer$assessCompetitiveAdvantage$found: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$assessCompetitiveAdvantage$found$$step: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"advantageTerms","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$AssetAnalyzer$assessSustainability$found: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AssetAnalyzer$assessSustainability$found$$step: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"sustainabilityTerms","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
