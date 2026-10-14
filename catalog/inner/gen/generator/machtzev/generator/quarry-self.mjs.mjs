// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/quarry-self.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const isMarker = (l) => /^\s*\/\/ ═══/.test(l);
const isTop = (l) => /^(export\s+)?(async\s+)?(function|const|let|class)\s+\w+/.test(l);
export function inner$quarry$lines(src) {
    const lines = src.split('\n');
    return lines;
}
export function inner$quarry$map$code(lines, a, b) {
    const code = lines.slice(a, b);
    return code;
}
export function inner$quarry$map$mk(lines, a, b) {
    const code = lines.slice(a, b);
    const mk = code.find(isMarker);
    return mk;
}
export function inner$quarry$map$mk$$step(code) {
    const mk = code.find(isMarker);
    return mk;
}
export function inner$quarry$map$m(lines, a, b) {
    const code = lines.slice(a, b);
    const mk = code.find(isMarker);
    const m = mk && mk.match(/═══\s*(.+?)\s*=\s*(.+?)\s*$/);
    return m;
}
export function inner$quarry$map$m$$step(mk) {
    const m = mk && mk.match(/═══\s*(.+?)\s*=\s*(.+?)\s*$/);
    return m;
}
export function inner$quarry$map$head(lines, a, b) {
    const code = lines.slice(a, b);
    const head = code.find((l) => isTop(l)) || '';
    return head;
}
export function inner$quarry$map$head$$step(code) {
    const head = code.find((l) => isTop(l)) || '';
    return head;
}
export function inner$quarry$cuts$$after_loop(src) {
    const lines = src.split('\n');
    const cuts = [];
    for (let i = 1; i < lines.length; i++)
        if (isMarker(lines[i]) || isTop(lines[i])) {
            if (isTop(lines[i]) && i > 0 && isMarker(lines[i - 1]))
                continue;
            cuts.push(i);
        }
    return cuts;
}

export const SIGS = {
  inner$quarry$lines: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$quarry$map$code: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$quarry$map$mk: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$quarry$map$mk$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$map$m: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$quarry$map$m$$step: [{"name":"mk","d":{"t":"any"},"opt":false}],
  inner$quarry$map$head: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$quarry$map$head$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$quarry$cuts$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
};
