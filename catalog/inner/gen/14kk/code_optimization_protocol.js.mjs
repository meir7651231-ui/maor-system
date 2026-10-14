// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:code_optimization_protocol.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CodeOptimizationProtocol$checkDuplicates$lines(content) {
    const lines = content.split('\n');
    return lines;
}
export function inner$CodeOptimizationProtocol$checkDuplicates$forEach$trimmed(line) {
    const trimmed = line.trim();
    return trimmed;
}
export function inner$CodeOptimizationProtocol$optimizeFile$originalLines(optimized) {
    const originalLines = optimized.split('\n');
    return originalLines;
}
export function inner$CodeOptimizationProtocol$optimizeFile$newLines(optimized) {
    const originalLines = optimized.split('\n');
    const newLines = originalLines.map(line => line.trimEnd());
    return newLines;
}
export function inner$CodeOptimizationProtocol$optimizeFile$newLines$$step(originalLines) {
    const newLines = originalLines.map(line => line.trimEnd());
    return newLines;
}
export function inner$CodeOptimizationProtocol$optimizeFile$originalEmptyLines(optimized) {
    const originalEmptyLines = (optimized.match(/\n\s*\n\s*\n/g) || []).length;
    return originalEmptyLines;
}
export function inner$CodeOptimizationProtocol$optimizeFile$newEmptyLines(optimized) {
    const newEmptyLines = (optimized.match(/\n\s*\n\s*\n/g) || []).length;
    return newEmptyLines;
}
export function inner$CodeOptimizationProtocol$fixJavaScriptSyntax$missingSemicolons(content) {
    const missingSemicolons = content.match(/^[^\/\n]*\w+\s*$/gm);
    return missingSemicolons;
}
export function inner$CodeOptimizationProtocol$fixJavaScriptSyntax$duplicateSemicolons(content) {
    const duplicateSemicolons = content.match(/;/g);
    return duplicateSemicolons;
}
export function inner$CodeOptimizationProtocol$cleanupJavaScriptFile$consoleLogs(content) {
    const consoleLogs = content.match(/console\.log/g);
    return consoleLogs;
}
export function inner$CodeOptimizationProtocol$cleanupJavaScriptFile$lines(content) {
    const lines = content.split('\n');
    return lines;
}
export function inner$CodeOptimizationProtocol$cleanupJavaScriptFile$deadCode(content) {
    const deadCode = content.match(/\/\*\s*TODO.*?\*\/|\/\/.*TODO/g);
    return deadCode;
}
export function inner$CodeOptimizationProtocol$cleanupJavaScriptFile$lines_L277(content) {
    const lines = content.split('\n');
    return lines;
}

export const SIGS = {
  inner$CodeOptimizationProtocol$checkDuplicates$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$checkDuplicates$forEach$trimmed: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$optimizeFile$originalLines: [{"name":"optimized","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$optimizeFile$newLines: [{"name":"optimized","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$optimizeFile$newLines$$step: [{"name":"originalLines","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$optimizeFile$originalEmptyLines: [{"name":"optimized","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$optimizeFile$newEmptyLines: [{"name":"optimized","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$fixJavaScriptSyntax$missingSemicolons: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$fixJavaScriptSyntax$duplicateSemicolons: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$cleanupJavaScriptFile$consoleLogs: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$cleanupJavaScriptFile$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$cleanupJavaScriptFile$deadCode: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$CodeOptimizationProtocol$cleanupJavaScriptFile$lines_L277: [{"name":"content","d":{"t":"any"},"opt":false}],
};
