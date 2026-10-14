// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/purify.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DIRS = [
    { dir: 'dart', data: 'dart-data', lang: 'dart' },
    { dir: 'dart-maor', data: 'dart-data-maor', lang: 'dart' },
    { dir: 'atoms', data: 'atoms-data', lang: 'js' },
];
const MIN = 4;
function findDataBlocks(src) {
    const blocks = [];
    // Dart: const Map<..> _x = { ; JS: const X = { / [
    const re = /^(?:\s*)((?:const|final)\s+(?:[A-Za-z_][\w<>,?\s]*\s+)?)([A-Za-z_]\w*)\s*=\s*(?:const\s*)?([{[])/gm;
    let m;
    while ((m = re.exec(src)) !== null) {
        const open = m[3];
        const close = open === '{' ? '}' : ']';
        // התאמת-סוגריים מהמיקום של הפותח
        let i = m.index + m[0].length - 1;
        let depth = 0, end = -1, inStr = false, q = '';
        for (; i < src.length; i++) {
            const c = src[i];
            if (inStr) {
                if (c === q && src[i - 1] !== '\\')
                    inStr = false;
                continue;
            }
            if (c === '"' || c === "'") {
                inStr = true;
                q = c;
                continue;
            }
            if (c === open)
                depth++;
            else if (c === close) {
                depth--;
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
        }
        if (end < 0)
            continue;
        const body = src.slice(m.index, end + 1);
        // ספירת-ערכים: פריטי-מפה 'k': v  או פריטי-רשימה 'x',
        const entries = (body.match(/['"][^'"]{1,}['"]\s*:/g) || []).length
            || (body.match(/['"][^'"]{1,}['"]\s*,/g) || []).length;
        if (entries >= MIN) {
            const startLine = src.slice(0, m.index).split('\n').length;
            const endLine = src.slice(0, end).split('\n').length;
            blocks.push({ name: m[2], decl: m[1].trim(), open, startLine, endLine, entries, span: [m.index, end + 1], body });
        }
    }
    return blocks;
}
function pubName(n) { const b = n.replace(/^_/, ''); return 'k' + b[0].toUpperCase() + b.slice(1); }
function addNamedParam(src, typeDecl, name) {
    // מזהה פונקציית-top-level (עמודה-0) עם איזון-סוגריים אמיתי — תומך גוף-חץ (=>) ו-async,
    // ופרמטרים מקוננים (String Function(String) x). מדלג על מילות-מפתח ומתודות-מחלקה (מוזחות).
    const KW = new Set(['if', 'for', 'while', 'switch', 'return', 'const', 'final', 'var', 'class', 'enum', 'import', 'export', 'assert', 'new', 'void', 'get', 'set', 'typedef', 'extension', 'mixin', 'part']);
    const re = /^(?:[A-Za-z_][\w<>,?.\s]*\s+)?([a-zA-Z_]\w*)\s*\(/gm;
    let m;
    while ((m = re.exec(src)) !== null) {
        const fn = m[1];
        if (KW.has(fn))
            continue;
        // איזון-סוגריים מה-( בסוף-ההתאמה (מדלג נכון על פרמטרים מקוננים)
        let open = m.index + m[0].length - 1, depth = 0, j = open, inStr = false, q = '';
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
                depth++;
            else if (c === ')') {
                depth--;
                if (depth === 0)
                    break;
            }
        }
        if (j >= src.length)
            continue;
        const close = j;
        let k = close + 1;
        while (k < src.length && /\s/.test(src[k]))
            k++;
        // אחרי ה-) חייב לבוא גוף-פונקציה: { , => , async/sync — אחרת זו קריאה/הצהרה, לא הגדרה
        if (!(src[k] === '{' || src.startsWith('=>', k) || /^(async|sync)\b/.test(src.slice(k, k + 8))))
            continue;
        const params = src.slice(open + 1, close);
        const decl = `required ${typeDecl} ${name}`;
        let newParams;
        if (/\{/.test(params)) {
            newParams = params.replace(/\}(\s*)$/, `, ${decl},}$1`);
            if (newParams === params)
                newParams = params.replace(/\{/, `{${decl}, `);
        }
        else {
            newParams = params.trim() ? `${params}, {${decl}}` : `{${decl}}`;
        }
        return { src: src.slice(0, open + 1) + newParams + src.slice(close), fn };
    }
    return null;
}
export function inner$findDataBlocks$close(open) {
    const close = open === '{' ? '}' : ']';
    return close;
}
export function inner$findDataBlocks$i(m) {
    let i = m.index + m[0].length - 1;
    return i;
}
export function inner$findDataBlocks$body(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    const body = src.slice(m.index, end + 1);
    return body;
}
export function inner$findDataBlocks$body$$step(src, m, end) {
    const body = src.slice(m.index, end + 1);
    return body;
}
export function inner$findDataBlocks$entries(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    const body = src.slice(m.index, end + 1);
    const entries = (body.match(/['"][^'"]{1,}['"]\s*:/g) || []).length
        || (body.match(/['"][^'"]{1,}['"]\s*,/g) || []).length;
    return entries;
}
export function inner$findDataBlocks$entries$$step(body) {
    const entries = (body.match(/['"][^'"]{1,}['"]\s*:/g) || []).length
        || (body.match(/['"][^'"]{1,}['"]\s*,/g) || []).length;
    return entries;
}
export function inner$findDataBlocks$startLine(src, m) {
    const startLine = src.slice(0, m.index).split('\n').length;
    return startLine;
}
export function inner$findDataBlocks$endLine(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    const endLine = src.slice(0, end).split('\n').length;
    return endLine;
}
export function inner$findDataBlocks$endLine$$step(src, end) {
    const endLine = src.slice(0, end).split('\n').length;
    return endLine;
}
export function inner$scan$blocks(src) {
    const blocks = findDataBlocks(src);
    return blocks;
}
export function inner$scan$d(r) {
    const d = r.file.split('/')[0];
    return d;
}
export function inner$scan$bs(r) {
    const bs = r.blocks.map(b => `${b.name}[${b.entries}]`).join(' · ');
    return bs;
}
export function inner$pubName$b(n) {
    const b = n.replace(/^_/, '');
    return b;
}
export function inner$addNamedParam$open(m) {
    let open = m.index + m[0].length - 1;
    return open;
}
export function inner$addNamedParam$k(close) {
    let k = close + 1;
    return k;
}
export function inner$addNamedParam$params(src, m, close) {
    let open = m.index + m[0].length - 1;
    const params = src.slice(open + 1, close);
    return params;
}
export function inner$addNamedParam$params$$step(src, open, close) {
    const params = src.slice(open + 1, close);
    return params;
}
export function inner$addNamedParam$decl(typeDecl, name) {
    const decl = `required ${typeDecl} ${name}`;
    return decl;
}
export function inner$injectNamedArg$call(fn, dotted) {
    const call = new RegExp((dotted ? '\\.\\s*' : '\\b') + fn + '\\s*\\(', 'g');
    return call;
}
export function inner$injectNamedArg$j(m) {
    let j = m.index + m[0].length;
    return j;
}
export function inner$injectNamedArg$after(src, m) {
    let depth = 1;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
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
export function inner$extract$dir(rel) {
    const [dir] = rel.split('/');
    return dir;
}
export function inner$extract$cfg(rel) {
    const [dir] = rel.split('/');
    const cfg = DIRS.find(d => d.dir === dir);
    return cfg;
}
export function inner$extract$cfg$$step(dir) {
    const cfg = DIRS.find(d => d.dir === dir);
    return cfg;
}
export function inner$extract$blocks(src0) {
    const blocks = findDataBlocks(src0);
    return blocks;
}
export function inner$extract$m(baseName, csrc) {
    const m = new RegExp(`import ['"][^'"]*/${baseName}\\.(dart|mjs)['"](?:\\s+as\\s+(\\w+))?`).exec(csrc);
    return m;
}
export function inner$extract$proofCandidates(cf) {
    const proofCandidates = [cf.replace(/\.dart$/, '-proof.dart'), 'board-proof.dart'];
    return proofCandidates;
}
export function inner$extract$typeM(b) {
    const typeM = /(?:const|final)\s+([A-Za-z_][\w<>,?\s]*?)\s+[A-Za-z_]\w*\s*=/.exec(b.decl + ' =');
    return typeM;
}
export function inner$extract$typeDecl(b) {
    const typeM = /(?:const|final)\s+([A-Za-z_][\w<>,?\s]*?)\s+[A-Za-z_]\w*\s*=/.exec(b.decl + ' =');
    const typeDecl = typeM ? typeM[1].trim() : (b.open === '{' ? 'Map<String, dynamic>' : 'List<dynamic>');
    return typeDecl;
}
export function inner$extract$typeDecl$$step(b, typeM) {
    const typeDecl = typeM ? typeM[1].trim() : (b.open === '{' ? 'Map<String, dynamic>' : 'List<dynamic>');
    return typeDecl;
}
export function inner$extract$lit(src0, b) {
    const lit = src0.slice(src0.indexOf(b.open === '{' ? '{' : '[', b.span[0]), b.span[1]);
    return lit;
}
export function inner$extract$pub(b) {
    const pub = pubName(b.name);
    return pub;
}
export function inner$extract$ext(rel) {
    const [dir] = rel.split('/');
    const cfg = DIRS.find(d => d.dir === dir);
    const ext = cfg.lang === 'js' ? 'mjs' : 'dart';
    return ext;
}
export function inner$extract$ext$$step(cfg) {
    const ext = cfg.lang === 'js' ? 'mjs' : 'dart';
    return ext;
}
export function inner$extract$dataRel(rel, base) {
    const [dir] = rel.split('/');
    const cfg = DIRS.find(d => d.dir === dir);
    const ext = cfg.lang === 'js' ? 'mjs' : 'dart';
    const dataRel = `${cfg.data}/${base}.${ext}`;
    return dataRel;
}
export function inner$extract$dataRel$$step(cfg, ext, base) {
    const dataRel = `${cfg.data}/${base}.${ext}`;
    return dataRel;
}
export function inner$extract$dataHdr(rel) {
    const dataHdr = `// 🗄️ דאטה · חולץ מ-${rel} ע"י machtzev/purity/purify.mjs. נערך בלי לגעת במנוע.\n`;
    return dataHdr;
}
export function inner$extract$dataContent(rel, src0, b) {
    const [dir] = rel.split('/');
    const cfg = DIRS.find(d => d.dir === dir);
    const lit = src0.slice(src0.indexOf(b.open === '{' ? '{' : '[', b.span[0]), b.span[1]);
    const pub = pubName(b.name);
    const dataHdr = `// 🗄️ דאטה · חולץ מ-${rel} ע"י machtzev/purity/purify.mjs. נערך בלי לגעת במנוע.\n`;
    const dataContent = cfg.lang === 'js'
        ? `${dataHdr}export const ${pub} = ${lit};\n`
        : `${dataHdr}const ${pub} = ${lit};\n// re-export שם-המקור לנוחות-הזרקה:\nfinal ${b.name.replace(/^_/, '')} = ${pub};\n`;
    return dataContent;
}
export function inner$extract$dataContent$$step(cfg, b, lit, pub, dataHdr) {
    const dataContent = cfg.lang === 'js'
        ? `${dataHdr}export const ${pub} = ${lit};\n`
        : `${dataHdr}const ${pub} = ${lit};\n// re-export שם-המקור לנוחות-הזרקה:\nfinal ${b.name.replace(/^_/, '')} = ${pub};\n`;
    return dataContent;
}
export function inner$extract$atom(src0, b, stmtEnd) {
    let atom = (src0.slice(0, b.span[0]) + src0.slice(stmtEnd)).replace(/\n{3,}/g, '\n\n');
    return atom;
}
export function inner$extract$paramName(b) {
    const paramName = b.name.replace(/^_/, '');
    return paramName;
}
export function inner$extract$res(b, atom) {
    const typeM = /(?:const|final)\s+([A-Za-z_][\w<>,?\s]*?)\s+[A-Za-z_]\w*\s*=/.exec(b.decl + ' =');
    const typeDecl = typeM ? typeM[1].trim() : (b.open === '{' ? 'Map<String, dynamic>' : 'List<dynamic>');
    const paramName = b.name.replace(/^_/, '');
    const res = addNamedParam(atom, typeDecl, paramName);
    return res;
}
export function inner$extract$res$$step(typeDecl, atom, paramName) {
    const res = addNamedParam(atom, typeDecl, paramName);
    return res;
}
export function inner$extract$testRel(rel) {
    const [dir] = rel.split('/');
    const cfg = DIRS.find(d => d.dir === dir);
    const testRel = rel.replace(/\.(dart|mjs)$/, cfg.lang === 'js' ? '.test.$1'.replace('$1', 'mjs') : '_test.dart');
    return testRel;
}
export function inner$extract$testRel$$step(rel, cfg) {
    const testRel = rel.replace(/\.(dart|mjs)$/, cfg.lang === 'js' ? '.test.$1'.replace('$1', 'mjs') : '_test.dart');
    return testRel;
}
export function inner$extract$dataImport(rel, b, base) {
    const [dir] = rel.split('/');
    const cfg = DIRS.find(d => d.dir === dir);
    const pub = pubName(b.name);
    const dataImport = cfg.lang === 'js'
        ? `import { ${pub} } from '../${cfg.data}/${base}.mjs';\n`
        : `import '../${cfg.data}/${base}.dart';\n`;
    return dataImport;
}
export function inner$extract$dataImport$$step(cfg, pub, base) {
    const dataImport = cfg.lang === 'js'
        ? `import { ${pub} } from '../${cfg.data}/${base}.mjs';\n`
        : `import '../${cfg.data}/${base}.dart';\n`;
    return dataImport;
}
export function inner$extract$proofs(consumers) {
    const proofs = [...new Set(consumers.flatMap(c => c.proofs))];
    return proofs;
}
export function inner$findDataBlocks$i$$after_loop(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    return i;
}
export function inner$findDataBlocks$depth$$after_loop(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    return depth;
}
export function inner$findDataBlocks$end$$after_loop(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    return end;
}
export function inner$findDataBlocks$inStr$$after_loop(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    return inStr;
}
export function inner$findDataBlocks$q$$after_loop(src, m, open) {
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length - 1;
    let depth = 0;
    let end = -1;
    let inStr = false;
    let q = '';
    for (; i < src.length; i++) {
        const c = src[i];
        if (inStr) {
            if (c === q && src[i - 1] !== '\\')
                inStr = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inStr = true;
            q = c;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    return q;
}
export function inner$addNamedParam$depth$$after_loop(src, m) {
    let open = m.index + m[0].length - 1;
    let depth = 0;
    let j = open;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return depth;
}
export function inner$addNamedParam$j$$after_loop(src, m) {
    let open = m.index + m[0].length - 1;
    let depth = 0;
    let j = open;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return j;
}
export function inner$addNamedParam$inStr$$after_loop(src, m) {
    let open = m.index + m[0].length - 1;
    let depth = 0;
    let j = open;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return inStr;
}
export function inner$addNamedParam$q$$after_loop(src, m) {
    let open = m.index + m[0].length - 1;
    let depth = 0;
    let j = open;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return q;
}
export function inner$injectNamedArg$depth$$after_loop(src, m) {
    let depth = 1;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return depth;
}
export function inner$injectNamedArg$j$$after_loop(src, m) {
    let depth = 1;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return j;
}
export function inner$injectNamedArg$inStr$$after_loop(src, m) {
    let depth = 1;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return inStr;
}
export function inner$injectNamedArg$q$$after_loop(src, m) {
    let depth = 1;
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
            depth++;
        else if (c === ')') {
            depth--;
            if (depth === 0)
                break;
        }
    }
    return q;
}

export const SIGS = {
  inner$findDataBlocks$close: [{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$i: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$findDataBlocks$body: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$body$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"end","d":{"t":"num"},"opt":false}],
  inner$findDataBlocks$entries: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$entries$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$findDataBlocks$startLine: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$findDataBlocks$endLine: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$endLine$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"end","d":{"t":"num"},"opt":false}],
  inner$scan$blocks: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$scan$d: [{"name":"r","d":{"t":"obj","p":[["file",{"t":"str"},false],["blocks",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["entries",{"t":"any"},false],["lines",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$scan$bs: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$pubName$b: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$addNamedParam$open: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$addNamedParam$k: [{"name":"close","d":{"t":"num"},"opt":false}],
  inner$addNamedParam$params: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$addNamedParam$params$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$addNamedParam$decl: [{"name":"typeDecl","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$call: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"dotted","d":{"t":"bool"},"opt":false}],
  inner$injectNamedArg$j: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$after: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$after$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$extract$dir: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$extract$cfg: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$extract$cfg$$step: [{"name":"dir","d":{"t":"any"},"opt":false}],
  inner$extract$blocks: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$extract$m: [{"name":"baseName","d":{"t":"any"},"opt":false},{"name":"csrc","d":{"t":"any"},"opt":false}],
  inner$extract$proofCandidates: [{"name":"cf","d":{"t":"any"},"opt":false}],
  inner$extract$typeM: [{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$extract$typeDecl: [{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$extract$typeDecl$$step: [{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false},{"name":"typeM","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$extract$lit: [{"name":"src0","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$extract$pub: [{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$extract$ext: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$extract$ext$$step: [{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["dir",{"t":"str"},false],["data",{"t":"str"},false],["lang",{"t":"str"},false]]}]},"opt":false}],
  inner$extract$dataRel: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$extract$dataRel$$step: [{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["dir",{"t":"str"},false],["data",{"t":"str"},false],["lang",{"t":"str"},false]]}]},"opt":false},{"name":"ext","d":{"t":"lit","v":["dart","mjs"]},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$extract$dataHdr: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$extract$dataContent: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"src0","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$extract$dataContent$$step: [{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["dir",{"t":"str"},false],["data",{"t":"str"},false],["lang",{"t":"str"},false]]}]},"opt":false},{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false},{"name":"lit","d":{"t":"any"},"opt":false},{"name":"pub","d":{"t":"str"},"opt":false},{"name":"dataHdr","d":{"t":"str"},"opt":false}],
  inner$extract$atom: [{"name":"src0","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false},{"name":"stmtEnd","d":{"t":"num"},"opt":false}],
  inner$extract$paramName: [{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false}],
  inner$extract$res: [{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false},{"name":"atom","d":{"t":"any"},"opt":false}],
  inner$extract$res$$step: [{"name":"typeDecl","d":{"t":"str"},"opt":false},{"name":"atom","d":{"t":"any"},"opt":false},{"name":"paramName","d":{"t":"str"},"opt":false}],
  inner$extract$testRel: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$extract$testRel$$step: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["dir",{"t":"str"},false],["data",{"t":"str"},false],["lang",{"t":"str"},false]]}]},"opt":false}],
  inner$extract$dataImport: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"obj","p":[["name",{"t":"str"},false],["decl",{"t":"str"},false],["open",{"t":"str"},false],["startLine",{"t":"any"},false],["endLine",{"t":"any"},false],["entries",{"t":"any"},false],["span",{"t":"arr","of":{"t":"num"}},false],["body",{"t":"any"},false]]},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$extract$dataImport$$step: [{"name":"cfg","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["dir",{"t":"str"},false],["data",{"t":"str"},false],["lang",{"t":"str"},false]]}]},"opt":false},{"name":"pub","d":{"t":"str"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$extract$proofs: [{"name":"consumers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$findDataBlocks$i$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$depth$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$end$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$inStr$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$findDataBlocks$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"str"},"opt":false}],
  inner$addNamedParam$depth$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$addNamedParam$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$addNamedParam$inStr$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$addNamedParam$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$depth$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$inStr$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$injectNamedArg$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
