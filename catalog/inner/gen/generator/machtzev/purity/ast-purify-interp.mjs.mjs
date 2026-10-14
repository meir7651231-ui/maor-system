// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/ast-purify-interp.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DATADIR = { 'dart': 'dart-data', 'dart-maor': 'dart-data-maor', 'atoms': 'atoms-data' };
export function inner$injectNamedArg$re(fn, dotted) {
    const re = new RegExp((dotted ? '\\.\\s*' : '\\b') + fn + '\\s*(?:<[^>]*>)?\\s*\\(', 'g');
    return re;
}
export function inner$injectNamedArg$j(m) {
    let j = m.index + m[0].length;
    return j;
}
export function inner$injectNamedArg$after(src, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < src.length; j++) {
        const c = src[j];
        if (inStr) {
            if (c === q && src[j - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (d === 0)
                break;
        }
    }
    const after = src.slice(j + 1).replace(/^\s*/, '');
    return after;
}
export function inner$injectNamedArg$after$$step(src, j) {
    const after = src.slice(j + 1).replace(/^\s*/, '');
    return after;
}
export function inner$injectNamedArg$b(src, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < src.length; j++) {
        const c = src[j];
        if (inStr) {
            if (c === q && src[j - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (d === 0)
                break;
        }
    }
    let b = j - 1;
    return b;
}
export function inner$injectNamedArg$b$$step(j) {
    let b = j - 1;
    return b;
}
export function inner$injectNamedArg$sep(src, val, b) {
    const sep = src[b] === '(' ? `term: ${val}` : src[b] === ',' ? ` term: ${val}` : `, term: ${val}`;
    return sep;
}
export function inner$purify$dir(rel) {
    const [dir] = rel.split('/');
    return dir;
}
export function inner$purify$dataRel(rel, base) {
    const [dir] = rel.split('/');
    const dataRel = `${DATADIR[dir]}/${base}-terms.dart`;
    return dataRel;
}
export function inner$purify$dataRel$$step(dir, base) {
    const dataRel = `${DATADIR[dir]}/${base}-terms.dart`;
    return dataRel;
}
export function inner$purify$newEntries(res, dataSrc0) {
    const newEntries = Object.entries(res.terms)
        .filter(([k]) => !new RegExp(`'${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\s*:`).test(dataSrc0))
        .map(([k, v]) => `  '${k}': ${JSON.stringify(v).replace(/^"|"$/g, "'")},`);
    return newEntries;
}
export function inner$purify$err(e) {
    const err = ((e.stdout?.toString() || '') + (e.stderr?.toString() || '') || String(e)).slice(0, 300);
    return err;
}
export function inner$purify$dataRel_L68(rel, base) {
    const [dir] = rel.split('/');
    const dataRel = `${DATADIR[dir]}/${base}-terms.dart`;
    return dataRel;
}
export function inner$purify$dataRel_L68$$step(dir, base) {
    const dataRel = `${DATADIR[dir]}/${base}-terms.dart`;
    return dataRel;
}
export function inner$purify$entries(res) {
    const entries = Object.entries(res.terms).map(([k, v]) => `  '${k}': ${JSON.stringify(v).replace(/^"|"$/g, "'")},`).join('\n');
    return entries;
}
export function inner$purify$dataBody(rel, res) {
    const entries = Object.entries(res.terms).map(([k, v]) => `  '${k}': ${JSON.stringify(v).replace(/^"|"$/g, "'")},`).join('\n');
    const dataBody = `// 🗄️ שמות · חולצו מ-${rel} (מכונת-AST). מטרה→שם; מתחלף פר-וורטיקל.\nconst Map<String, String> kTerms = {\n${entries}\n};\n`;
    return dataBody;
}
export function inner$purify$dataBody$$step(rel, entries) {
    const dataBody = `// 🗄️ שמות · חולצו מ-${rel} (מכונת-AST). מטרה→שם; מתחלף פר-וורטיקל.\nconst Map<String, String> kTerms = {\n${entries}\n};\n`;
    return dataBody;
}
export function inner$purify$alias(base) {
    const alias = 'td_' + base.replace(/[^a-z0-9]/gi, '_');
    return alias;
}
export function inner$purify$imp(rel, base) {
    const [dir] = rel.split('/');
    const alias = 'td_' + base.replace(/[^a-z0-9]/gi, '_');
    const imp = `import '../${DATADIR[dir]}/${base}-terms.dart' as ${alias};\n`;
    return imp;
}
export function inner$purify$imp$$step(dir, base, alias) {
    const imp = `import '../${DATADIR[dir]}/${base}-terms.dart' as ${alias};\n`;
    return imp;
}
export function inner$purify$val(base) {
    const alias = 'td_' + base.replace(/[^a-z0-9]/gi, '_');
    const val = `(k)=>${alias}.kTerms[k]!`;
    return val;
}
export function inner$purify$val$$step(alias) {
    const val = `(k)=>${alias}.kTerms[k]!`;
    return val;
}
export function inner$purify$err_L109(e) {
    const err = ((e.stdout?.toString() || '') + (e.stderr?.toString() || '') || String(e)).slice(0, 400);
    return err;
}
export function inner$injectNamedArg$d$$after_loop(src, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < src.length; j++) {
        const c = src[j];
        if (inStr) {
            if (c === q && src[j - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (d === 0)
                break;
        }
    }
    return d;
}
export function inner$injectNamedArg$j$$after_loop(src, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < src.length; j++) {
        const c = src[j];
        if (inStr) {
            if (c === q && src[j - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (d === 0)
                break;
        }
    }
    return j;
}
export function inner$injectNamedArg$inStr$$after_loop(src, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < src.length; j++) {
        const c = src[j];
        if (inStr) {
            if (c === q && src[j - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (d === 0)
                break;
        }
    }
    return inStr;
}
export function inner$injectNamedArg$q$$after_loop(src, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < src.length; j++) {
        const c = src[j];
        if (inStr) {
            if (c === q && src[j - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (d === 0)
                break;
        }
    }
    return q;
}

export const SIGS = {
  inner$injectNamedArg$re: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"dotted","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$j: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$after: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$after$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$injectNamedArg$b: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$b$$step: [{"name":"j","d":{"t":"num"},"opt":false}],
  inner$injectNamedArg$sep: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"val","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$purify$dir: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$purify$dataRel: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$dataRel$$step: [{"name":"dir","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$newEntries: [{"name":"res","d":{"t":"any"},"opt":false},{"name":"dataSrc0","d":{"t":"any"},"opt":false}],
  inner$purify$err: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$purify$dataRel_L68: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$dataRel_L68$$step: [{"name":"dir","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$entries: [{"name":"res","d":{"t":"any"},"opt":false}],
  inner$purify$dataBody: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"res","d":{"t":"any"},"opt":false}],
  inner$purify$dataBody$$step: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"entries","d":{"t":"str"},"opt":false}],
  inner$purify$alias: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$imp: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$imp$$step: [{"name":"dir","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$purify$val: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$val$$step: [{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$purify$err_L109: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$inStr$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
