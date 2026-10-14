// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/mutation-dart-check.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DEF = { int: '0', double: '0.0', num: '0', String: "''", bool: 'false', dynamic: 'null', Object: 'null' };
const hollowVal = (ret) => { const t = ret.trim(); if (t === 'void')
    return 'return;'; if (t.endsWith('?'))
    return 'return null;'; if (DEF[t] !== undefined)
    return `return ${DEF[t]};`; if (/^(List|Iterable)\b/.test(t))
    return 'return const [];'; if (/^(Map|Set)\b/.test(t))
    return 'return const {};'; return null; };
const skipLiteral = (src, i) => {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
        const e = src.indexOf('\n', i);
        return e < 0 ? src.length : e;
    }
    if (c === '/' && src[i + 1] === '*') {
        const e = src.indexOf('*/', i + 2);
        return e < 0 ? src.length : e + 2;
    }
    if (c === "'" || c === '"') {
        const triple = src.startsWith(c.repeat(3), i);
        const q = triple ? c.repeat(3) : c;
        let j = i + q.length;
        while (j < src.length) {
            if (src[j] === '\\') {
                j += 2;
                continue;
            }
            if (src.startsWith(q, j))
                return j + q.length;
            j++;
        }
        return src.length;
    }
    return -1;
};
const matchParen = (src, i) => { let d = 0, j = i; while (j < src.length) {
    const s = skipLiteral(src, j);
    if (s >= 0) {
        j = s;
        continue;
    }
    if (src[j] === '(')
        d++;
    else if (src[j] === ')') {
        d--;
        if (!d)
            return j;
    }
    j++;
} return -1; };
const matchBrace = (src, i) => { let d = 0, j = i; while (j < src.length) {
    const s = skipLiteral(src, j);
    if (s >= 0) {
        j = s;
        continue;
    }
    if (src[j] === '{')
        d++;
    else if (src[j] === '}') {
        d--;
        if (!d)
            return j;
    }
    j++;
} return -1; };
const HEAD_RE = /^([A-Za-z_][\w<>,?\s]*?)\s+([a-z_][\w]*)(<[^>]*>)?\s*\(/gm;
export function inner$opt$i(argv, k) {
    const i = argv.indexOf(k);
    return i;
}
export function inner$hollowVal$t(ret) {
    const t = ret.trim();
    return t;
}
export function inner$skipLiteral$e(src, i) {
    const e = src.indexOf('\n', i);
    return e;
}
export function inner$skipLiteral$e_L42(src, i) {
    const e = src.indexOf('*/', i + 2);
    return e;
}
export function inner$skipLiteral$triple(src, i, c) {
    const triple = src.startsWith(c.repeat(3), i);
    return triple;
}
export function inner$skipLiteral$q(src, i, c) {
    const triple = src.startsWith(c.repeat(3), i);
    const q = triple ? c.repeat(3) : c;
    return q;
}
export function inner$skipLiteral$q$$step(c, triple) {
    const q = triple ? c.repeat(3) : c;
    return q;
}
export function inner$skipLiteral$j(src, i, c) {
    const triple = src.startsWith(c.repeat(3), i);
    const q = triple ? c.repeat(3) : c;
    let j = i + q.length;
    return j;
}
export function inner$skipLiteral$j$$step(i, q) {
    let j = i + q.length;
    return j;
}
export function inner$matchParen$s(src, j) {
    const s = skipLiteral(src, j);
    return s;
}
export function inner$matchBrace$s(src, j) {
    const s = skipLiteral(src, j);
    return s;
}
export function inner$hollow$ret(m) {
    const ret = m[1].trim();
    return ret;
}
export function inner$hollow$close(src, m) {
    const close = matchParen(src, m.index + m[0].length - 1);
    return close;
}
export function inner$hollow$rest(src, m) {
    const close = matchParen(src, m.index + m[0].length - 1);
    const rest = src.slice(close + 1, close + 40);
    return rest;
}
export function inner$hollow$rest$$step(src, close) {
    const rest = src.slice(close + 1, close + 40);
    return rest;
}
export function inner$hollow$after(src, m) {
    const close = matchParen(src, m.index + m[0].length - 1);
    const rest = src.slice(close + 1, close + 40);
    const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
    return after;
}
export function inner$hollow$after$$step(rest) {
    const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
    return after;
}
export function inner$hollow$val(m) {
    const ret = m[1].trim();
    const val = hollowVal(ret);
    return val;
}
export function inner$hollow$val$$step(ret) {
    const val = hollowVal(ret);
    return val;
}
export function inner$hollow$bodyStart(src, m) {
    const close = matchParen(src, m.index + m[0].length - 1);
    const rest = src.slice(close + 1, close + 40);
    const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
    const bodyStart = close + 1 + after[0].length;
    return bodyStart;
}
export function inner$hollow$bodyStart$$step(close, after) {
    const bodyStart = close + 1 + after[0].length;
    return bodyStart;
}
export function inner$hollow$bodyEnd(src, m) {
    const close = matchParen(src, m.index + m[0].length - 1);
    const rest = src.slice(close + 1, close + 40);
    const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
    const bodyStart = close + 1 + after[0].length;
    const bodyEnd = matchBrace(src, bodyStart - 1);
    return bodyEnd;
}
export function inner$hollow$bodyEnd$$step(src, bodyStart) {
    const bodyEnd = matchBrace(src, bodyStart - 1);
    return bodyEnd;
}
export function inner$hollow$s(src, j) {
    const s = skipLiteral(src, j);
    return s;
}
export function inner$hollow$e(src, j) {
    const e = src[j] === '(' ? matchParen(src, j) : src[j] === '{' ? matchBrace(src, j) : src.indexOf(']', j);
    return e;
}
export function inner$hollow$out$$after_loop(src) {
    let out = '';
    let last = 0;
    let n = 0;
    let unparsed = 0;
    let pub = 0;
    for (const m of src.matchAll(HEAD_RE)) {
        if (m.index < last)
            continue;
        const ret = m[1].trim();
        if (/^(return|else|if|for|while|switch|class|enum|new|await|throw|case|typedef|extension|mixin|final|const|var)$/.test(ret) || /\b(class|enum)\b/.test(ret))
            continue;
        const close = matchParen(src, m.index + m[0].length - 1);
        if (close < 0) {
            unparsed++;
            continue;
        }
        const rest = src.slice(close + 1, close + 40);
        const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
        if (!after)
            continue; // הצהרה בלבד / חתימה-של-מתודה בתוך מחלקה ⇒ לא פונקציה-עליונה
        const val = hollowVal(ret);
        if (val === null) {
            unparsed++;
            continue;
        }
        const bodyStart = close + 1 + after[0].length;
        if (after[2] === '{') {
            const bodyEnd = matchBrace(src, bodyStart - 1);
            if (bodyEnd < 0) {
                unparsed++;
                continue;
            }
            out += src.slice(last, bodyStart - 1) + `{ ${val} }`;
            last = bodyEnd + 1;
        }
        else {
            let j = bodyStart;
            while (j < src.length) {
                const s = skipLiteral(src, j);
                if (s >= 0) {
                    j = s;
                    continue;
                }
                if (src[j] === '(' || src[j] === '{' || src[j] === '[') {
                    const e = src[j] === '(' ? matchParen(src, j) : src[j] === '{' ? matchBrace(src, j) : src.indexOf(']', j);
                    if (e < 0)
                        break;
                    j = e + 1;
                    continue;
                }
                if (src[j] === ';')
                    break;
                j++;
            }
            out += src.slice(last, bodyStart - after[0].length) + ` { ${val} }`;
            last = j + 1;
        }
        n++;
        if (!m[2].startsWith('_'))
            pub++;
    }
    return out;
}
export function inner$hollow$last$$after_loop(src) {
    let out = '';
    let last = 0;
    let n = 0;
    let unparsed = 0;
    let pub = 0;
    for (const m of src.matchAll(HEAD_RE)) {
        if (m.index < last)
            continue;
        const ret = m[1].trim();
        if (/^(return|else|if|for|while|switch|class|enum|new|await|throw|case|typedef|extension|mixin|final|const|var)$/.test(ret) || /\b(class|enum)\b/.test(ret))
            continue;
        const close = matchParen(src, m.index + m[0].length - 1);
        if (close < 0) {
            unparsed++;
            continue;
        }
        const rest = src.slice(close + 1, close + 40);
        const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
        if (!after)
            continue; // הצהרה בלבד / חתימה-של-מתודה בתוך מחלקה ⇒ לא פונקציה-עליונה
        const val = hollowVal(ret);
        if (val === null) {
            unparsed++;
            continue;
        }
        const bodyStart = close + 1 + after[0].length;
        if (after[2] === '{') {
            const bodyEnd = matchBrace(src, bodyStart - 1);
            if (bodyEnd < 0) {
                unparsed++;
                continue;
            }
            out += src.slice(last, bodyStart - 1) + `{ ${val} }`;
            last = bodyEnd + 1;
        }
        else {
            let j = bodyStart;
            while (j < src.length) {
                const s = skipLiteral(src, j);
                if (s >= 0) {
                    j = s;
                    continue;
                }
                if (src[j] === '(' || src[j] === '{' || src[j] === '[') {
                    const e = src[j] === '(' ? matchParen(src, j) : src[j] === '{' ? matchBrace(src, j) : src.indexOf(']', j);
                    if (e < 0)
                        break;
                    j = e + 1;
                    continue;
                }
                if (src[j] === ';')
                    break;
                j++;
            }
            out += src.slice(last, bodyStart - after[0].length) + ` { ${val} }`;
            last = j + 1;
        }
        n++;
        if (!m[2].startsWith('_'))
            pub++;
    }
    return last;
}
export function inner$hollow$n$$after_loop(src) {
    let out = '';
    let last = 0;
    let n = 0;
    let unparsed = 0;
    let pub = 0;
    for (const m of src.matchAll(HEAD_RE)) {
        if (m.index < last)
            continue;
        const ret = m[1].trim();
        if (/^(return|else|if|for|while|switch|class|enum|new|await|throw|case|typedef|extension|mixin|final|const|var)$/.test(ret) || /\b(class|enum)\b/.test(ret))
            continue;
        const close = matchParen(src, m.index + m[0].length - 1);
        if (close < 0) {
            unparsed++;
            continue;
        }
        const rest = src.slice(close + 1, close + 40);
        const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
        if (!after)
            continue; // הצהרה בלבד / חתימה-של-מתודה בתוך מחלקה ⇒ לא פונקציה-עליונה
        const val = hollowVal(ret);
        if (val === null) {
            unparsed++;
            continue;
        }
        const bodyStart = close + 1 + after[0].length;
        if (after[2] === '{') {
            const bodyEnd = matchBrace(src, bodyStart - 1);
            if (bodyEnd < 0) {
                unparsed++;
                continue;
            }
            out += src.slice(last, bodyStart - 1) + `{ ${val} }`;
            last = bodyEnd + 1;
        }
        else {
            let j = bodyStart;
            while (j < src.length) {
                const s = skipLiteral(src, j);
                if (s >= 0) {
                    j = s;
                    continue;
                }
                if (src[j] === '(' || src[j] === '{' || src[j] === '[') {
                    const e = src[j] === '(' ? matchParen(src, j) : src[j] === '{' ? matchBrace(src, j) : src.indexOf(']', j);
                    if (e < 0)
                        break;
                    j = e + 1;
                    continue;
                }
                if (src[j] === ';')
                    break;
                j++;
            }
            out += src.slice(last, bodyStart - after[0].length) + ` { ${val} }`;
            last = j + 1;
        }
        n++;
        if (!m[2].startsWith('_'))
            pub++;
    }
    return n;
}
export function inner$hollow$unparsed$$after_loop(src) {
    let out = '';
    let last = 0;
    let n = 0;
    let unparsed = 0;
    let pub = 0;
    for (const m of src.matchAll(HEAD_RE)) {
        if (m.index < last)
            continue;
        const ret = m[1].trim();
        if (/^(return|else|if|for|while|switch|class|enum|new|await|throw|case|typedef|extension|mixin|final|const|var)$/.test(ret) || /\b(class|enum)\b/.test(ret))
            continue;
        const close = matchParen(src, m.index + m[0].length - 1);
        if (close < 0) {
            unparsed++;
            continue;
        }
        const rest = src.slice(close + 1, close + 40);
        const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
        if (!after)
            continue; // הצהרה בלבד / חתימה-של-מתודה בתוך מחלקה ⇒ לא פונקציה-עליונה
        const val = hollowVal(ret);
        if (val === null) {
            unparsed++;
            continue;
        }
        const bodyStart = close + 1 + after[0].length;
        if (after[2] === '{') {
            const bodyEnd = matchBrace(src, bodyStart - 1);
            if (bodyEnd < 0) {
                unparsed++;
                continue;
            }
            out += src.slice(last, bodyStart - 1) + `{ ${val} }`;
            last = bodyEnd + 1;
        }
        else {
            let j = bodyStart;
            while (j < src.length) {
                const s = skipLiteral(src, j);
                if (s >= 0) {
                    j = s;
                    continue;
                }
                if (src[j] === '(' || src[j] === '{' || src[j] === '[') {
                    const e = src[j] === '(' ? matchParen(src, j) : src[j] === '{' ? matchBrace(src, j) : src.indexOf(']', j);
                    if (e < 0)
                        break;
                    j = e + 1;
                    continue;
                }
                if (src[j] === ';')
                    break;
                j++;
            }
            out += src.slice(last, bodyStart - after[0].length) + ` { ${val} }`;
            last = j + 1;
        }
        n++;
        if (!m[2].startsWith('_'))
            pub++;
    }
    return unparsed;
}
export function inner$hollow$pub$$after_loop(src) {
    let out = '';
    let last = 0;
    let n = 0;
    let unparsed = 0;
    let pub = 0;
    for (const m of src.matchAll(HEAD_RE)) {
        if (m.index < last)
            continue;
        const ret = m[1].trim();
        if (/^(return|else|if|for|while|switch|class|enum|new|await|throw|case|typedef|extension|mixin|final|const|var)$/.test(ret) || /\b(class|enum)\b/.test(ret))
            continue;
        const close = matchParen(src, m.index + m[0].length - 1);
        if (close < 0) {
            unparsed++;
            continue;
        }
        const rest = src.slice(close + 1, close + 40);
        const after = rest.match(/^\s*(async\s*\*?|sync\s*\*?)?\s*(\{|=>)/);
        if (!after)
            continue; // הצהרה בלבד / חתימה-של-מתודה בתוך מחלקה ⇒ לא פונקציה-עליונה
        const val = hollowVal(ret);
        if (val === null) {
            unparsed++;
            continue;
        }
        const bodyStart = close + 1 + after[0].length;
        if (after[2] === '{') {
            const bodyEnd = matchBrace(src, bodyStart - 1);
            if (bodyEnd < 0) {
                unparsed++;
                continue;
            }
            out += src.slice(last, bodyStart - 1) + `{ ${val} }`;
            last = bodyEnd + 1;
        }
        else {
            let j = bodyStart;
            while (j < src.length) {
                const s = skipLiteral(src, j);
                if (s >= 0) {
                    j = s;
                    continue;
                }
                if (src[j] === '(' || src[j] === '{' || src[j] === '[') {
                    const e = src[j] === '(' ? matchParen(src, j) : src[j] === '{' ? matchBrace(src, j) : src.indexOf(']', j);
                    if (e < 0)
                        break;
                    j = e + 1;
                    continue;
                }
                if (src[j] === ';')
                    break;
                j++;
            }
            out += src.slice(last, bodyStart - after[0].length) + ` { ${val} }`;
            last = j + 1;
        }
        n++;
        if (!m[2].startsWith('_'))
            pub++;
    }
    return pub;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$hollowVal$t: [{"name":"ret","d":{"t":"any"},"opt":false}],
  inner$skipLiteral$e: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$skipLiteral$e_L42: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$skipLiteral$triple: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$skipLiteral$q: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$skipLiteral$q$$step: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"triple","d":{"t":"any"},"opt":false}],
  inner$skipLiteral$j: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$skipLiteral$j$$step: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"q","d":{"t":"any"},"opt":false}],
  inner$matchParen$s: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$matchBrace$s: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$hollow$ret: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hollow$close: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hollow$rest: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hollow$rest$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$hollow$after: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hollow$after$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$hollow$val: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hollow$val$$step: [{"name":"ret","d":{"t":"any"},"opt":false}],
  inner$hollow$bodyStart: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hollow$bodyStart$$step: [{"name":"close","d":{"t":"num"},"opt":false},{"name":"after","d":{"t":"any"},"opt":false}],
  inner$hollow$bodyEnd: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hollow$bodyEnd$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"bodyStart","d":{"t":"num"},"opt":false}],
  inner$hollow$s: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$hollow$e: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$hollow$out$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$hollow$last$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$hollow$n$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$hollow$unparsed$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$hollow$pub$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
};
