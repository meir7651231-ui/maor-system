// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/functions.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const BUILTIN = new Set(['return', 'const', 'function', 'await', 'if', 'for', 'while', 'switch', 'String', 'Number', 'Math', 'Object', 'Array', 'JSON', 'Boolean', 'Date', 'Set', 'Map', 'List', 'Iterable', 'console', 'push', 'slice', 'filter', 'map', 'some', 'every', 'includes', 'replace', 'replaceAll', 'match', 'split', 'join', 'trim', 'sort', 'reduce', 'forEach', 'indexOf', 'startsWith', 'endsWith', 'toLowerCase', 'toUpperCase', 'test', 'exec', 'round', 'floor', 'ceil', 'abs', 'min', 'max', 'sqrt', 'pow', 'keys', 'values', 'entries', 'parse', 'stringify', 'from', 'isArray', 'find', 'findIndex', 'where', 'firstWhere', 'any', 'fold', 'expand', 'toList', 'toSet', 'toMap', 'contains', 'flat', 'concat', 'padStart', 'padEnd', 'padLeft', 'padRight', 'charAt', 'codeUnitAt', 'substring', 'localeCompare', 'toFixed', 'toStringAsFixed', 'toLocaleString', 'toString', 'add', 'addAll', 'has', 'get', 'put', 'set', 'delete', 'remove', 'elementAt', 'isEmpty', 'isNotEmpty', 'asMap']);
export function inner$dartSigAt$head(l) {
    const head = l.match(/^(?: {2})?(?:static\s+)?(?:[A-Za-z_$][A-Za-z0-9_$]*(?:<[^;{}]*?>)?[?]?(?:\s*\[\])?\s+)+([a-zA-Z_$][A-Za-z0-9_$]*)\s*(?:<[^;{}]*?>)?\s*\(/);
    return head;
}
export function inner$dartSigAt$col(l) {
    let col = l.indexOf('(');
    return col;
}
export function inner$dartSigAt$s(lines, i, l, j) {
    let col = l.indexOf('(');
    const s = j === i ? lines[j].slice(col) : lines[j];
    return s;
}
export function inner$dartSigAt$s$$step(lines, i, j, col) {
    const s = j === i ? lines[j].slice(col) : lines[j];
    return s;
}
export function inner$dartSigAt$tail(lines, i, l) {
    let depth = 0;
    let started = false;
    let j = i;
    let col = l.indexOf('(');
    for (; j < lines.length && j < i + 40; j++) {
        const s = j === i ? lines[j].slice(col) : lines[j];
        for (const ch of s) {
            if (ch === '(') {
                depth++;
                started = true;
            }
            else if (ch === ')') {
                depth--;
            }
        }
        if (started && depth <= 0)
            break;
    }
    const tail = (lines[j] || '') + ' ' + (lines[j + 1] || '');
    return tail;
}
export function inner$dartSigAt$tail$$step(lines, j) {
    const tail = (lines[j] || '') + ' ' + (lines[j + 1] || '');
    return tail;
}
export function inner$jsSigAt$m(lines, i) {
    const m = lines[i].match(/^export\s+(?:async\s+)?(?:function\*?|const)\s+([A-Za-z0-9_$]+)/);
    return m;
}
export function inner$forEach$end(lines, marks, idx) {
    const end = idx + 1 < marks.length ? marks[idx + 1][0] - 1 : lines.length;
    return end;
}
export function inner$forEach$body(lines, marks, start, idx) {
    const end = idx + 1 < marks.length ? marks[idx + 1][0] - 1 : lines.length;
    const body = lines.slice(start - 1, end).join('\n');
    return body;
}
export function inner$forEach$body$$step(lines, start, end) {
    const body = lines.slice(start - 1, end).join('\n');
    return body;
}
export function inner$forEach$calls(lines, marks, start, idx) {
    const end = idx + 1 < marks.length ? marks[idx + 1][0] - 1 : lines.length;
    const body = lines.slice(start - 1, end).join('\n');
    const calls = [...new Set([...body.matchAll(/\b([a-z][A-Za-z0-9_]{3,})\(/g)].map(m => m[1])
            .filter(c => !BUILTIN.has(c)))].slice(0, 12);
    return calls;
}
export function inner$forEach$calls$$step(body) {
    const calls = [...new Set([...body.matchAll(/\b([a-z][A-Za-z0-9_]{3,})\(/g)].map(m => m[1])
            .filter(c => !BUILTIN.has(c)))].slice(0, 12);
    return calls;
}
export function inner$dartSigAt$depth$$after_loop(lines, i, l) {
    let depth = 0;
    let started = false;
    let j = i;
    let col = l.indexOf('(');
    for (; j < lines.length && j < i + 40; j++) {
        const s = j === i ? lines[j].slice(col) : lines[j];
        for (const ch of s) {
            if (ch === '(') {
                depth++;
                started = true;
            }
            else if (ch === ')') {
                depth--;
            }
        }
        if (started && depth <= 0)
            break;
    }
    return depth;
}
export function inner$dartSigAt$started$$after_loop(lines, i, l) {
    let depth = 0;
    let started = false;
    let j = i;
    let col = l.indexOf('(');
    for (; j < lines.length && j < i + 40; j++) {
        const s = j === i ? lines[j].slice(col) : lines[j];
        for (const ch of s) {
            if (ch === '(') {
                depth++;
                started = true;
            }
            else if (ch === ')') {
                depth--;
            }
        }
        if (started && depth <= 0)
            break;
    }
    return started;
}
export function inner$dartSigAt$j$$after_loop(lines, i, l) {
    let depth = 0;
    let started = false;
    let j = i;
    let col = l.indexOf('(');
    for (; j < lines.length && j < i + 40; j++) {
        const s = j === i ? lines[j].slice(col) : lines[j];
        for (const ch of s) {
            if (ch === '(') {
                depth++;
                started = true;
            }
            else if (ch === ')') {
                depth--;
            }
        }
        if (started && depth <= 0)
            break;
    }
    return j;
}

export const SIGS = {
  inner$dartSigAt$head: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$col: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$s: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$s$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false},{"name":"col","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$tail: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$tail$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$jsSigAt$m: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$forEach$end: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"marks","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$forEach$body: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"marks","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$forEach$body$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"end","d":{"t":"any"},"opt":false}],
  inner$forEach$calls: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"marks","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"start","d":{"t":"num"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$forEach$calls$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$depth$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$started$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
  inner$dartSigAt$j$$after_loop: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"any"},"opt":false}],
};
