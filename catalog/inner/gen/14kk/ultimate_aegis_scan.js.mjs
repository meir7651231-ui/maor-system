// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:ultimate_aegis_scan.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$detectIssues$openBrackets(content) {
    const openBrackets = (content.match(/{/g) || []).length;
    return openBrackets;
}
export function inner$detectIssues$closeBrackets(content) {
    const closeBrackets = (content.match(/}/g) || []).length;
    return closeBrackets;
}
export function inner$detectIssues$openParens(content) {
    const openParens = (content.match(/\(/g) || []).length;
    return openParens;
}
export function inner$detectIssues$closeParens(content) {
    const closeParens = (content.match(/\)/g) || []).length;
    return closeParens;
}
export function inner$detectIssues$openSqBrackets(content) {
    const openSqBrackets = (content.match(/\[/g) || []).length;
    return openSqBrackets;
}
export function inner$detectIssues$closeSqBrackets(content) {
    const closeSqBrackets = (content.match(/\]/g) || []).length;
    return closeSqBrackets;
}
export function inner$detectIssues$lines(content) {
    const lines = content.split('\n');
    return lines;
}
export function inner$detectIssues$longLines(content) {
    const lines = content.split('\n');
    const longLines = lines.filter(line => line.length > 120);
    return longLines;
}
export function inner$detectIssues$longLines$$step(lines) {
    const longLines = lines.filter(line => line.length > 120);
    return longLines;
}
export function inner$detectIssues$functionMatches(content) {
    const functionMatches = content.match(/function\s+(\w+)/g);
    return functionMatches;
}
export function inner$detectIssues$functionNames(content) {
    const functionMatches = content.match(/function\s+(\w+)/g);
    const functionNames = functionMatches.map(m => m.replace('function ', ''));
    return functionNames;
}
export function inner$detectIssues$functionNames$$step(functionMatches) {
    const functionNames = functionMatches.map(m => m.replace('function ', ''));
    return functionNames;
}
export function inner$detectIssues$duplicates(content) {
    const functionMatches = content.match(/function\s+(\w+)/g);
    const functionNames = functionMatches.map(m => m.replace('function ', ''));
    const duplicates = functionNames.filter((name, index) => functionNames.indexOf(name) !== index);
    return duplicates;
}
export function inner$detectIssues$duplicates$$step(functionNames) {
    const duplicates = functionNames.filter((name, index) => functionNames.indexOf(name) !== index);
    return duplicates;
}
export function inner$forEach$displayIssues(issuesByType, type) {
    const displayIssues = issuesByType[type].slice(0, 10);
    return displayIssues;
}

export const SIGS = {
  inner$detectIssues$openBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$closeBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$openParens: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$closeParens: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$openSqBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$closeSqBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$longLines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$longLines$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$detectIssues$functionMatches: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$functionNames: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$functionNames$$step: [{"name":"functionMatches","d":{"t":"any"},"opt":false}],
  inner$detectIssues$duplicates: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$duplicates$$step: [{"name":"functionNames","d":{"t":"any"},"opt":false}],
  inner$forEach$displayIssues: [{"name":"issuesByType","d":{"t":"obj","n":"issuesByType","p":[]},"opt":false},{"name":"type","d":{"t":"str"},"opt":false}],
};
