// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:full_aegis_scan.js — לא לערוך ביד.
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

export const SIGS = {
  inner$detectIssues$openBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$closeBrackets: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$openParens: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$closeParens: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$lines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$longLines: [{"name":"content","d":{"t":"any"},"opt":false}],
  inner$detectIssues$longLines$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
};
