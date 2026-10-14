// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:archive/final-bridge.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$KnowledgeGraph$updateMap$imports(content) {
    const imports = content.match(/from\s+['"](.+)['"]/g) || [];
    return imports;
}
export function inner$AutoFixerAgent$attemptFixes$backupPath(filePath) {
    const backupPath = `${filePath}.aegis.bak`;
    return backupPath;
}
export function inner$AegisSentinel$reviewFile$issues(results) {
    const issues = results.flatMap(r => r.status === 'fulfilled' ? r.value.issues || [] : []);
    return issues;
}
export function inner$AegisSentinel$intelligentSegment$lines(content) {
    const lines = content.split('\n');
    return lines;
}
export function inner$AegisSentinel$intelligentSegment$start(i) {
    const start = i + 1;
    return start;
}
export function inner$AegisSentinel$intelligentSegment$end(content, i) {
    const lines = content.split('\n');
    const segmentSize = 50;
    const end = Math.min(i + segmentSize, lines.length);
    return end;
}
export function inner$AegisSentinel$intelligentSegment$end$$step(lines, i) {
    const segmentSize = 50;
    const end = Math.min(i + segmentSize, lines.length);
    return end;
}
export function inner$AegisSentinel$intelligentSegment$segmentLines(content, i) {
    const lines = content.split('\n');
    const segmentSize = 50;
    const end = Math.min(i + segmentSize, lines.length);
    const segmentLines = lines.slice(i, end);
    return segmentLines;
}
export function inner$AegisSentinel$intelligentSegment$segmentLines$$step(lines, i, end) {
    const segmentLines = lines.slice(i, end);
    return segmentLines;
}
export function inner$AegisSentinel$safeParseAST$openBrackets(code) {
    const openBrackets = (code.match(/{/g) || []).length;
    return openBrackets;
}
export function inner$AegisSentinel$safeParseAST$closeBrackets(code) {
    const closeBrackets = (code.match(/}/g) || []).length;
    return closeBrackets;
}
export function inner$AegisSentinel$safeParseAST$openParens(code) {
    const openParens = (code.match(/\(/g) || []).length;
    return openParens;
}
export function inner$AegisSentinel$safeParseAST$closeParens(code) {
    const closeParens = (code.match(/\)/g) || []).length;
    return closeParens;
}
export function inner$ReviewAgent$analyze$openBrackets(content) {
    const openBrackets = (content.match(/{/g) || []).length;
    return openBrackets;
}
export function inner$ReviewAgent$analyze$closeBrackets(content) {
    const closeBrackets = (content.match(/}/g) || []).length;
    return closeBrackets;
}
export function inner$logStep$line(step, message, timestamp) {
    const line = `[${timestamp}] [${step}] ${message}`;
    return line;
}
export function inner$handleAuth$code(text) {
    const code = text.split(' ')[1];
    return code;
}
export function inner$loop$text(msg) {
    const text = msg.text.trim();
    return text;
}
export function inner$loop$hash(msg, chatId) {
    const text = msg.text.trim();
    const hash = `${chatId}:${text}`;
    return hash;
}
export function inner$loop$hash$$step(chatId, text) {
    const hash = `${chatId}:${text}`;
    return hash;
}
export function inner$generateResponse$response(responseFile) {
    const response = JSON.parse(responseFile);
    return response;
}
export function inner$SelfReviewingCode$segmentCode$start(i) {
    const start = i + 1;
    return start;
}
export function inner$SelfReviewingCode$checkSyntax$openBrackets(content) {
    const openBrackets = (content.match(/{/g) || []).length;
    return openBrackets;
}
export function inner$SelfReviewingCode$checkSyntax$closeBrackets(content) {
    const closeBrackets = (content.match(/}/g) || []).length;
    return closeBrackets;
}
export function inner$SelfReviewingCode$checkSyntax$openParens(content) {
    const openParens = (content.match(/\(/g) || []).length;
    return openParens;
}
export function inner$SelfReviewingCode$checkSyntax$closeParens(content) {
    const closeParens = (content.match(/\)/g) || []).length;
    return closeParens;
}
export function inner$SelfReviewingCode$checkSyntax$hasSemicolons(content) {
    const hasSemicolons = content.includes(';');
    return hasSemicolons;
}
export function inner$SelfReviewingCode$checkSyntax$hasQuotes(content) {
    const hasQuotes = content.includes('"') || content.includes("'");
    return hasQuotes;
}
export function inner$SelfReviewingCode$checkSyntax$singleQuotes(content) {
    const singleQuotes = (content.match(/'/g) || []).length;
    return singleQuotes;
}
export function inner$SelfReviewingCode$checkSyntax$doubleQuotes(content) {
    const doubleQuotes = (content.match(/"/g) || []).length;
    return doubleQuotes;
}
export function inner$SelfReviewingCode$checkLogic$hasFunctions(content) {
    const hasFunctions = content.includes('function');
    return hasFunctions;
}
export function inner$SelfReviewingCode$checkLogic$hasArrowFunctions(content) {
    const hasArrowFunctions = content.includes('=>');
    return hasArrowFunctions;
}
export function inner$SelfReviewingCode$checkLogic$hasAsync(content) {
    const hasAsync = content.includes('async');
    return hasAsync;
}
export function inner$SelfReviewingCode$checkLogic$hasCodeKeywords(content) {
    const hasCodeKeywords = content.includes('if') || content.includes('for') ||
        content.includes('while') || content.includes('return');
    return hasCodeKeywords;
}
export function inner$SelfReviewingCode$checkLogic$ifCount(content) {
    const ifCount = (content.match(/if\s*\(/g) || []).length;
    return ifCount;
}
export function inner$SelfReviewingCode$checkLogic$elseCount(content) {
    const elseCount = (content.match(/else/g) || []).length;
    return elseCount;
}
export function inner$SelfReviewingCode$checkLogic$hasTry(content) {
    const hasTry = content.includes('try');
    return hasTry;
}
export function inner$SelfReviewingCode$checkLogic$hasCatch(content) {
    const hasCatch = content.includes('catch');
    return hasCatch;
}
export function inner$SelfReviewingCode$checkStandards$hasComments(content) {
    const hasComments = content.includes('//');
    return hasComments;
}
export function inner$SelfReviewingCode$checkStandards$hasBlockComments(content) {
    const hasBlockComments = content.includes('/*');
    return hasBlockComments;
}
export function inner$SelfReviewingCode$checkStandards$hasConstants(content) {
    const hasConstants = content.includes('const');
    return hasConstants;
}
export function inner$SelfReviewingCode$checkStandards$hasLets(content) {
    const hasLets = content.includes('let');
    return hasLets;
}
export function inner$SelfReviewingCode$checkStandards$hasVars(content) {
    const hasVars = content.includes('var');
    return hasVars;
}
export function inner$SelfReviewingCode$checkStandards$lines(content) {
    const lines = content.split('\n');
    return lines;
}
export function inner$SelfReviewingCode$checkStandards$longLines(content) {
    const lines = content.split('\n');
    const longLines = lines.filter(line => line.length > 100);
    return longLines;
}
export function inner$SelfReviewingCode$checkStandards$longLines$$step(lines) {
    const longLines = lines.filter(line => line.length > 100);
    return longLines;
}
export function inner$SelfReviewingCode$checkStandards$trailingSpaces(content) {
    const lines = content.split('\n');
    const trailingSpaces = lines.filter(line => line.endsWith(' ') || line.endsWith('\t'));
    return trailingSpaces;
}
export function inner$SelfReviewingCode$checkStandards$trailingSpaces$$step(lines) {
    const trailingSpaces = lines.filter(line => line.endsWith(' ') || line.endsWith('\t'));
    return trailingSpaces;
}

export const SIGS = {
  inner$KnowledgeGraph$updateMap$imports: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AutoFixerAgent$attemptFixes$backupPath: [{"name":"filePath","d":{"t":"any"},"opt":false}],
  inner$AegisSentinel$reviewFile$issues: [{"name":"results","d":{"t":"tup","of":[{"t":"or","of":[{"t":"obj","n":"PromiseRejectedResult","p":[["status",{"t":"lit","v":["rejected"]},false],["reason",{"t":"any"},false]]},{"t":"obj","n":"PromiseFulfilledResult","p":[["status",{"t":"lit","v":["fulfilled"]},false],["value",{"t":"any"},false]]}]},{"t":"or","of":[{"t":"obj","n":"PromiseRejectedResult","p":[["status",{"t":"lit","v":["rejected"]},false],["reason",{"t":"any"},false]]},{"t":"obj","n":"PromiseFulfilledResult","p":[["status",{"t":"lit","v":["fulfilled"]},false],["value",{"t":"any"},false]]}]},{"t":"or","of":[{"t":"obj","n":"PromiseRejectedResult","p":[["status",{"t":"lit","v":["rejected"]},false],["reason",{"t":"any"},false]]},{"t":"obj","n":"PromiseFulfilledResult","p":[["status",{"t":"lit","v":["fulfilled"]},false],["value",{"t":"any"},false]]}]},{"t":"or","of":[{"t":"obj","n":"PromiseRejectedResult","p":[["status",{"t":"lit","v":["rejected"]},false],["reason",{"t":"any"},false]]},{"t":"obj","n":"PromiseFulfilledResult","p":[["status",{"t":"lit","v":["fulfilled"]},false],["value",{"t":"any"},false]]}]}]},"opt":false}],
  inner$AegisSentinel$intelligentSegment$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$AegisSentinel$intelligentSegment$start: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AegisSentinel$intelligentSegment$end: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AegisSentinel$intelligentSegment$end$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AegisSentinel$intelligentSegment$segmentLines: [{"name":"content","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$AegisSentinel$intelligentSegment$segmentLines$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"end","d":{"t":"num"},"opt":false}],
  inner$AegisSentinel$safeParseAST$openBrackets: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$AegisSentinel$safeParseAST$closeBrackets: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$AegisSentinel$safeParseAST$openParens: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$AegisSentinel$safeParseAST$closeParens: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$ReviewAgent$analyze$openBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$ReviewAgent$analyze$closeBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$logStep$line: [{"name":"step","d":{"t":"any"},"opt":false},{"name":"message","d":{"t":"any"},"opt":false},{"name":"timestamp","d":{"t":"str"},"opt":false}],
  inner$handleAuth$code: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$loop$text: [{"name":"msg","d":{"t":"any"},"opt":false}],
  inner$loop$hash: [{"name":"msg","d":{"t":"any"},"opt":false},{"name":"chatId","d":{"t":"any"},"opt":false}],
  inner$loop$hash$$step: [{"name":"chatId","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
  inner$generateResponse$response: [{"name":"responseFile","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$segmentCode$start: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$openBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$closeBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$openParens: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$closeParens: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$hasSemicolons: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$hasQuotes: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$singleQuotes: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkSyntax$doubleQuotes: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$hasFunctions: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$hasArrowFunctions: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$hasAsync: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$hasCodeKeywords: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$ifCount: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$elseCount: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$hasTry: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkLogic$hasCatch: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$hasComments: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$hasBlockComments: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$hasConstants: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$hasLets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$hasVars: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$longLines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$longLines$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$trailingSpaces: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$SelfReviewingCode$checkStandards$trailingSpaces$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
};
