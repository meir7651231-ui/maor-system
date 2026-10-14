// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/shelf-lift.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$resolveConstImport$f(projectConsts, name) {
    const f = projectConsts.get(name);
    return f;
}
export function inner$resolveConstImport$dm(name, src2) {
    const dm = src2.match(new RegExp('(^|\\n)(const|final)\\s+(?:[A-Za-z_][\\w<>,? ]*?\\s+)?' + name + '\\s*='));
    return dm;
}
export function inner$resolveConstImport$end(name, src2) {
    const dm = src2.match(new RegExp('(^|\\n)(const|final)\\s+(?:[A-Za-z_][\\w<>,? ]*?\\s+)?' + name + '\\s*='));
    const end = src2.indexOf(';', dm.index);
    return end;
}
export function inner$resolveConstImport$end$$step(src2, dm) {
    const end = src2.indexOf(';', dm.index);
    return end;
}
export function inner$fileDecls$line(src, m) {
    const line = src.indexOf(';', m.index);
    return line;
}
export function inner$fileDecls$j(src, m) {
    let j = src.indexOf('(', m.index + m[0].length - 1);
    return j;
}
export function inner$fileDecls$after(src, m) {
    let j = src.indexOf('(', m.index + m[0].length - 1);
    let d = 0;
    for (; j < src.length; j++) {
        const c = src[j];
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const after = src.slice(j + 1).match(/^\s*(=>|\{|async)/);
    return after;
}
export function inner$fileDecls$after$$step(src, j) {
    const after = src.slice(j + 1).match(/^\s*(=>|\{|async)/);
    return after;
}
export function inner$fileDecls$full(src, m, end) {
    const full = src.slice(m.index, end + 1).trim();
    return full;
}
export function inner$fileDecls$typedefs$$after_loop(src) {
    const typedefs = new Map();
    for (const m of src.matchAll(/(?:^|\n)typedef\s+([A-Za-z0-9_]+)[^;]*;/g)) {
        typedefs.set(m[1], m[0].trim());
    }
    return typedefs;
}
export function inner$fileDecls$j$$after_loop(src, m) {
    let j = src.indexOf('(', m.index + m[0].length - 1);
    let d = 0;
    for (; j < src.length; j++) {
        const c = src[j];
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}
export function inner$fileDecls$d$$after_loop(src, m) {
    let j = src.indexOf('(', m.index + m[0].length - 1);
    let d = 0;
    for (; j < src.length; j++) {
        const c = src[j];
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}

export const SIGS = {
  inner$resolveConstImport$f: [{"name":"projectConsts","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$resolveConstImport$dm: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src2","d":{"t":"any"},"opt":false}],
  inner$resolveConstImport$end: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src2","d":{"t":"any"},"opt":false}],
  inner$resolveConstImport$end$$step: [{"name":"src2","d":{"t":"any"},"opt":false},{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$fileDecls$line: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$fileDecls$j: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$fileDecls$after: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$fileDecls$after$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$fileDecls$full: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"end","d":{"t":"num"},"opt":false}],
  inner$fileDecls$typedefs$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$fileDecls$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$fileDecls$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
