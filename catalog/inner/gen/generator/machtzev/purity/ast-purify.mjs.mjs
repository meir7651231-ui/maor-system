// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/ast-purify.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DATADIR = { 'dart': 'dart-data', 'dart-maor': 'dart-data-maor', 'atoms': 'atoms-data' };
const dartStr = (v) => "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$').replace(/\n/g, '\\n').replace(/\r/g, '') + "'";
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
export function inner$purify$entries(res) {
    const entries = Object.entries(res.terms).map(([k, v]) => `  '${k}': ${dartStr(v)},`).join('\n');
    return entries;
}
export function inner$purify$dataBody(rel, res) {
    const entries = Object.entries(res.terms).map(([k, v]) => `  '${k}': ${dartStr(v)},`).join('\n');
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
export function inner$purify$closeCh(openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    return closeCh;
}
export function inner$purify$j3(mD) {
    let j3 = mD.index + mD[0].length;
    return j3;
}
export function inner$purify$po(s4, mK) {
    const po = s4.indexOf('(', mK.index);
    return po;
}
export function inner$purify$j4(s4, mK) {
    const po = s4.indexOf('(', mK.index);
    let j4 = po + 1;
    return j4;
}
export function inner$purify$j4$$step(po) {
    let j4 = po + 1;
    return j4;
}
export function inner$purify$closeCh_L127(openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    return closeCh;
}
export function inner$purify$j2(mC) {
    let j2 = mC.index + mC[0].length;
    return j2;
}
export function inner$purify$entryFns(res) {
    const entryFns = res.fns && res.fns.length ? res.fns : [res.fn];
    return entryFns;
}
export function inner$purify$err(e) {
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
export function inner$purify$d3$$after_loop(s3, mD, openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    let d3 = 1;
    let j3 = mD.index + mD[0].length;
    let q3 = null;
    for (; j3 < s3.length && d3; j3++) {
        const c3 = s3[j3];
        if (q3) {
            if (c3 === '\\')
                j3++;
            else if (c3 === q3)
                q3 = null;
            continue;
        }
        if (c3 === "'" || c3 === '"') {
            q3 = c3;
            continue;
        }
        if (c3 === openCh)
            d3++;
        else if (c3 === closeCh)
            d3--;
    }
    return d3;
}
export function inner$purify$j3$$after_loop(s3, mD, openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    let d3 = 1;
    let j3 = mD.index + mD[0].length;
    let q3 = null;
    for (; j3 < s3.length && d3; j3++) {
        const c3 = s3[j3];
        if (q3) {
            if (c3 === '\\')
                j3++;
            else if (c3 === q3)
                q3 = null;
            continue;
        }
        if (c3 === "'" || c3 === '"') {
            q3 = c3;
            continue;
        }
        if (c3 === openCh)
            d3++;
        else if (c3 === closeCh)
            d3--;
    }
    return j3;
}
export function inner$purify$q3$$after_loop(s3, mD, openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    let d3 = 1;
    let j3 = mD.index + mD[0].length;
    let q3 = null;
    for (; j3 < s3.length && d3; j3++) {
        const c3 = s3[j3];
        if (q3) {
            if (c3 === '\\')
                j3++;
            else if (c3 === q3)
                q3 = null;
            continue;
        }
        if (c3 === "'" || c3 === '"') {
            q3 = c3;
            continue;
        }
        if (c3 === openCh)
            d3++;
        else if (c3 === closeCh)
            d3--;
    }
    return q3;
}
export function inner$purify$d4$$after_loop(s4, mK) {
    const po = s4.indexOf('(', mK.index);
    let d4 = 1;
    let j4 = po + 1;
    let q4 = null;
    for (; j4 < s4.length && d4; j4++) {
        const c4 = s4[j4];
        if (q4) {
            if (c4 === '\\')
                j4++;
            else if (c4 === q4)
                q4 = null;
            continue;
        }
        if (c4 === "'" || c4 === '"') {
            q4 = c4;
            continue;
        }
        if (c4 === '(')
            d4++;
        else if (c4 === ')')
            d4--;
    }
    return d4;
}
export function inner$purify$j4$$after_loop(s4, mK) {
    const po = s4.indexOf('(', mK.index);
    let d4 = 1;
    let j4 = po + 1;
    let q4 = null;
    for (; j4 < s4.length && d4; j4++) {
        const c4 = s4[j4];
        if (q4) {
            if (c4 === '\\')
                j4++;
            else if (c4 === q4)
                q4 = null;
            continue;
        }
        if (c4 === "'" || c4 === '"') {
            q4 = c4;
            continue;
        }
        if (c4 === '(')
            d4++;
        else if (c4 === ')')
            d4--;
    }
    return j4;
}
export function inner$purify$q4$$after_loop(s4, mK) {
    const po = s4.indexOf('(', mK.index);
    let d4 = 1;
    let j4 = po + 1;
    let q4 = null;
    for (; j4 < s4.length && d4; j4++) {
        const c4 = s4[j4];
        if (q4) {
            if (c4 === '\\')
                j4++;
            else if (c4 === q4)
                q4 = null;
            continue;
        }
        if (c4 === "'" || c4 === '"') {
            q4 = c4;
            continue;
        }
        if (c4 === '(')
            d4++;
        else if (c4 === ')')
            d4--;
    }
    return q4;
}
export function inner$purify$d2$$after_loop(s2, mC, openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    let d2 = 1;
    let j2 = mC.index + mC[0].length;
    let q2 = null;
    for (; j2 < s2.length && d2; j2++) {
        const c2 = s2[j2];
        if (q2) {
            if (c2 === '\\')
                j2++;
            else if (c2 === q2)
                q2 = null;
            continue;
        }
        if (c2 === "'" || c2 === '"') {
            q2 = c2;
            continue;
        }
        if (c2 === openCh)
            d2++;
        else if (c2 === closeCh)
            d2--;
    }
    return d2;
}
export function inner$purify$j2$$after_loop(s2, mC, openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    let d2 = 1;
    let j2 = mC.index + mC[0].length;
    let q2 = null;
    for (; j2 < s2.length && d2; j2++) {
        const c2 = s2[j2];
        if (q2) {
            if (c2 === '\\')
                j2++;
            else if (c2 === q2)
                q2 = null;
            continue;
        }
        if (c2 === "'" || c2 === '"') {
            q2 = c2;
            continue;
        }
        if (c2 === openCh)
            d2++;
        else if (c2 === closeCh)
            d2--;
    }
    return j2;
}
export function inner$purify$q2$$after_loop(s2, mC, openCh) {
    const closeCh = openCh === '[' ? ']' : '}';
    let d2 = 1;
    let j2 = mC.index + mC[0].length;
    let q2 = null;
    for (; j2 < s2.length && d2; j2++) {
        const c2 = s2[j2];
        if (q2) {
            if (c2 === '\\')
                j2++;
            else if (c2 === q2)
                q2 = null;
            continue;
        }
        if (c2 === "'" || c2 === '"') {
            q2 = c2;
            continue;
        }
        if (c2 === openCh)
            d2++;
        else if (c2 === closeCh)
            d2--;
    }
    return q2;
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
  inner$purify$entries: [{"name":"res","d":{"t":"any"},"opt":false}],
  inner$purify$dataBody: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"res","d":{"t":"any"},"opt":false}],
  inner$purify$dataBody$$step: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"entries","d":{"t":"str"},"opt":false}],
  inner$purify$alias: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$imp: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$imp$$step: [{"name":"dir","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$purify$val: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purify$val$$step: [{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$purify$closeCh: [{"name":"openCh","d":{"t":"str"},"opt":false}],
  inner$purify$j3: [{"name":"mD","d":{"t":"any"},"opt":false}],
  inner$purify$po: [{"name":"s4","d":{"t":"any"},"opt":false},{"name":"mK","d":{"t":"any"},"opt":false}],
  inner$purify$j4: [{"name":"s4","d":{"t":"any"},"opt":false},{"name":"mK","d":{"t":"any"},"opt":false}],
  inner$purify$j4$$step: [{"name":"po","d":{"t":"num"},"opt":false}],
  inner$purify$closeCh_L127: [{"name":"openCh","d":{"t":"str"},"opt":false}],
  inner$purify$j2: [{"name":"mC","d":{"t":"any"},"opt":false}],
  inner$purify$entryFns: [{"name":"res","d":{"t":"any"},"opt":false}],
  inner$purify$err: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$inStr$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purify$d3$$after_loop: [{"name":"s3","d":{"t":"any"},"opt":false},{"name":"mD","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"str"},"opt":false}],
  inner$purify$j3$$after_loop: [{"name":"s3","d":{"t":"any"},"opt":false},{"name":"mD","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"str"},"opt":false}],
  inner$purify$q3$$after_loop: [{"name":"s3","d":{"t":"any"},"opt":false},{"name":"mD","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"str"},"opt":false}],
  inner$purify$d4$$after_loop: [{"name":"s4","d":{"t":"any"},"opt":false},{"name":"mK","d":{"t":"any"},"opt":false}],
  inner$purify$j4$$after_loop: [{"name":"s4","d":{"t":"any"},"opt":false},{"name":"mK","d":{"t":"any"},"opt":false}],
  inner$purify$q4$$after_loop: [{"name":"s4","d":{"t":"any"},"opt":false},{"name":"mK","d":{"t":"any"},"opt":false}],
  inner$purify$d2$$after_loop: [{"name":"s2","d":{"t":"any"},"opt":false},{"name":"mC","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"str"},"opt":false}],
  inner$purify$j2$$after_loop: [{"name":"s2","d":{"t":"any"},"opt":false},{"name":"mC","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"str"},"opt":false}],
  inner$purify$q2$$after_loop: [{"name":"s2","d":{"t":"any"},"opt":false},{"name":"mC","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"str"},"opt":false}],
};
