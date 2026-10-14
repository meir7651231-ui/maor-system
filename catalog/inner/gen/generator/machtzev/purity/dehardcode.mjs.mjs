// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/dehardcode.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HEB = /[\u0590-\u05FF]/;
const T = { 'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't', ' ': '-' };
function slug(s) { let o = ''; for (const c of s)
    o += (T[c] ?? ''); o = o.replace(/-+/g, '-').replace(/^-|-$/g, ''); return o || null; }
export function inner$dehardcode$dir(rel) {
    const [dir] = rel.split('/');
    return dir;
}
export function inner$dehardcode$lang(rel) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    return lang;
}
export function inner$dehardcode$lang$$step(dir) {
    const lang = dir === 'atoms' ? 'js' : 'dart';
    return lang;
}
export function inner$dehardcode$codeNoComments(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    return codeNoComments;
}
export function inner$dehardcode$k(s) {
    let k = slug(s);
    return k;
}
export function inner$dehardcode$atom(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    const terms = {};
    const key = {};
    const used = new Set();
    let i = 0;
    for (const s of lits) {
        let k = slug(s);
        if (!k || used.has(k))
            k = `t${i}`;
        used.add(k);
        key[s] = k;
        terms[k] = s;
        i++;
    }
    let atom = src0.replace(/'([^'\\]*)'/g, (full, inner) => HEB.test(inner) && key[inner] ? `term('${key[inner]}')` : full);
    return atom;
}
export function inner$dehardcode$atom$$step(src0, key) {
    let atom = src0.replace(/'([^'\\]*)'/g, (full, inner) => HEB.test(inner) && key[inner] ? `term('${key[inner]}')` : full);
    return atom;
}
export function inner$dehardcode$fm(atom, fnRe) {
    const fm = fnRe.exec(atom);
    return fm;
}
export function inner$dehardcode$decl(rel) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    const decl = lang === 'js' ? 'term' : 'required String Function(String) term';
    return decl;
}
export function inner$dehardcode$decl$$step(lang) {
    const decl = lang === 'js' ? 'term' : 'required String Function(String) term';
    return decl;
}
export function inner$dehardcode$np(rel, params) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    const decl = lang === 'js' ? 'term' : 'required String Function(String) term';
    let np = /\{/.test(params) ? params.replace(/\}(\s*)$/, `, ${decl},}$1`) : (params.trim() ? `${params}, {${decl}}` : `{${decl}}`);
    return np;
}
export function inner$dehardcode$np$$step(decl, params) {
    let np = /\{/.test(params) ? params.replace(/\}(\s*)$/, `, ${decl},}$1`) : (params.trim() ? `${params}, {${decl}}` : `{${decl}}`);
    return np;
}
export function inner$dehardcode$ext(rel) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    const ext = lang === 'js' ? 'mjs' : 'dart';
    return ext;
}
export function inner$dehardcode$ext$$step(lang) {
    const ext = lang === 'js' ? 'mjs' : 'dart';
    return ext;
}
export function inner$dehardcode$dataRel(rel, base) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    const dataDir = { 'dart': 'dart-data', 'dart-maor': 'dart-data-maor', 'atoms': 'atoms-data' }[dir];
    const ext = lang === 'js' ? 'mjs' : 'dart';
    const dataRel = `${dataDir}/${base}-terms.${ext}`;
    return dataRel;
}
export function inner$dehardcode$dataRel$$step(base, dataDir, ext) {
    const dataRel = `${dataDir}/${base}-terms.${ext}`;
    return dataRel;
}
export function inner$dehardcode$entries(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    const terms = {};
    const key = {};
    const used = new Set();
    let i = 0;
    for (const s of lits) {
        let k = slug(s);
        if (!k || used.has(k))
            k = `t${i}`;
        used.add(k);
        key[s] = k;
        terms[k] = s;
        i++;
    }
    const entries = Object.entries(terms).map(([k, v]) => `  '${k}': '${v}',`).join('\n');
    return entries;
}
export function inner$dehardcode$entries$$step(terms) {
    const entries = Object.entries(terms).map(([k, v]) => `  '${k}': '${v}',`).join('\n');
    return entries;
}
export function inner$dehardcode$dataBody(rel, src0) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    const terms = {};
    const key = {};
    const used = new Set();
    let i = 0;
    for (const s of lits) {
        let k = slug(s);
        if (!k || used.has(k))
            k = `t${i}`;
        used.add(k);
        key[s] = k;
        terms[k] = s;
        i++;
    }
    const entries = Object.entries(terms).map(([k, v]) => `  '${k}': '${v}',`).join('\n');
    const dataBody = lang === 'js'
        ? `// 🗄️ שמות · חולצו מ-${rel} (דה-הרדקוד). נערכים/מתחלפים פר-וורטיקל.\nexport const kTerms = {\n${entries}\n};\n`
        : `// 🗄️ שמות · חולצו מ-${rel} (דה-הרדקוד). נערכים/מתחלפים פר-וורטיקל.\nconst Map<String,String> kTerms = {\n${entries}\n};\n`;
    return dataBody;
}
export function inner$dehardcode$dataBody$$step(rel, lang, entries) {
    const dataBody = lang === 'js'
        ? `// 🗄️ שמות · חולצו מ-${rel} (דה-הרדקוד). נערכים/מתחלפים פר-וורטיקל.\nexport const kTerms = {\n${entries}\n};\n`
        : `// 🗄️ שמות · חולצו מ-${rel} (דה-הרדקוד). נערכים/מתחלפים פר-וורטיקל.\nconst Map<String,String> kTerms = {\n${entries}\n};\n`;
    return dataBody;
}
export function inner$dehardcode$testRel(rel) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    const testRel = lang === 'js' ? rel.replace(/\.mjs$/, '.test.mjs') : rel.replace(/\.dart$/, '_test.dart');
    return testRel;
}
export function inner$dehardcode$testRel$$step(rel, lang) {
    const testRel = lang === 'js' ? rel.replace(/\.mjs$/, '.test.mjs') : rel.replace(/\.dart$/, '_test.dart');
    return testRel;
}
export function inner$dehardcode$injectCall$re(fn, dotted) {
    const re = new RegExp((dotted ? '\\.\\s*' : '\\b') + fn + '\\s*\\(', 'g');
    return re;
}
export function inner$dehardcode$injectCall$j(m) {
    let j = m.index + m[0].length;
    return j;
}
export function inner$dehardcode$injectCall$after(s, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < s.length; j++) {
        const c = s[j];
        if (inStr) {
            if (c === q && s[j - 1] !== '\\')
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
    const after = s.slice(j + 1).replace(/^\s*/, '');
    return after;
}
export function inner$dehardcode$injectCall$after$$step(s, j) {
    const after = s.slice(j + 1).replace(/^\s*/, '');
    return after;
}
export function inner$dehardcode$injectCall$val(lang) {
    const val = lang === 'js' ? 'term: (k)=>kTerms[k]' : 'term: (k)=>kTerms[k]!';
    return val;
}
export function inner$dehardcode$imp(rel, base) {
    const [dir] = rel.split('/');
    const lang = dir === 'atoms' ? 'js' : 'dart';
    const dataDir = { 'dart': 'dart-data', 'dart-maor': 'dart-data-maor', 'atoms': 'atoms-data' }[dir];
    const imp = lang === 'js' ? `import { kTerms } from '../${dataDir}/${base}-terms.mjs';\n` : `import '../${dataDir}/${base}-terms.dart';\n`;
    return imp;
}
export function inner$dehardcode$imp$$step(lang, base, dataDir) {
    const imp = lang === 'js' ? `import { kTerms } from '../${dataDir}/${base}-terms.mjs';\n` : `import '../${dataDir}/${base}-terms.dart';\n`;
    return imp;
}
export function inner$dehardcode$lits$$after_loop(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    return lits;
}
export function inner$dehardcode$terms$$after_loop(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    const terms = {};
    const key = {};
    const used = new Set();
    let i = 0;
    for (const s of lits) {
        let k = slug(s);
        if (!k || used.has(k))
            k = `t${i}`;
        used.add(k);
        key[s] = k;
        terms[k] = s;
        i++;
    }
    return terms;
}
export function inner$dehardcode$key$$after_loop(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    const terms = {};
    const key = {};
    const used = new Set();
    let i = 0;
    for (const s of lits) {
        let k = slug(s);
        if (!k || used.has(k))
            k = `t${i}`;
        used.add(k);
        key[s] = k;
        terms[k] = s;
        i++;
    }
    return key;
}
export function inner$dehardcode$used$$after_loop(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    const terms = {};
    const key = {};
    const used = new Set();
    let i = 0;
    for (const s of lits) {
        let k = slug(s);
        if (!k || used.has(k))
            k = `t${i}`;
        used.add(k);
        key[s] = k;
        terms[k] = s;
        i++;
    }
    return used;
}
export function inner$dehardcode$i$$after_loop(src0) {
    const codeNoComments = src0.replace(/^\s*\/\/.*$/gm, '');
    const lits = new Set();
    for (const m of codeNoComments.matchAll(/'([^'\\]*)'/g))
        if (HEB.test(m[1]))
            lits.add(m[1]);
    const terms = {};
    const key = {};
    const used = new Set();
    let i = 0;
    for (const s of lits) {
        let k = slug(s);
        if (!k || used.has(k))
            k = `t${i}`;
        used.add(k);
        key[s] = k;
        terms[k] = s;
        i++;
    }
    return i;
}
export function inner$dehardcode$injectCall$d$$after_loop(s, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < s.length; j++) {
        const c = s[j];
        if (inStr) {
            if (c === q && s[j - 1] !== '\\')
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
export function inner$dehardcode$injectCall$j$$after_loop(s, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < s.length; j++) {
        const c = s[j];
        if (inStr) {
            if (c === q && s[j - 1] !== '\\')
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
export function inner$dehardcode$injectCall$inStr$$after_loop(s, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < s.length; j++) {
        const c = s[j];
        if (inStr) {
            if (c === q && s[j - 1] !== '\\')
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
export function inner$dehardcode$injectCall$q$$after_loop(s, m) {
    let d = 1;
    let j = m.index + m[0].length;
    let inStr = false;
    let q = '';
    for (; j < s.length; j++) {
        const c = s[j];
        if (inStr) {
            if (c === q && s[j - 1] !== '\\')
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
  inner$dehardcode$dir: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$dehardcode$lang: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$dehardcode$lang$$step: [{"name":"dir","d":{"t":"any"},"opt":false}],
  inner$dehardcode$codeNoComments: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$k: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$dehardcode$atom: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$atom$$step: [{"name":"src0","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"obj","n":"key","p":[]},"opt":false}],
  inner$dehardcode$fm: [{"name":"atom","d":{"t":"any"},"opt":false},{"name":"fnRe","d":{"t":"any"},"opt":false}],
  inner$dehardcode$decl: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$dehardcode$decl$$step: [{"name":"lang","d":{"t":"lit","v":["dart","js"]},"opt":false}],
  inner$dehardcode$np: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"params","d":{"t":"str"},"opt":false}],
  inner$dehardcode$np$$step: [{"name":"decl","d":{"t":"lit","v":["term","required String Function(String) term"]},"opt":false},{"name":"params","d":{"t":"str"},"opt":false}],
  inner$dehardcode$ext: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$dehardcode$ext$$step: [{"name":"lang","d":{"t":"lit","v":["dart","js"]},"opt":false}],
  inner$dehardcode$dataRel: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$dehardcode$dataRel$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataDir","d":{"t":"any"},"opt":false},{"name":"ext","d":{"t":"lit","v":["dart","mjs"]},"opt":false}],
  inner$dehardcode$entries: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$entries$$step: [{"name":"terms","d":{"t":"obj","n":"terms","p":[]},"opt":false}],
  inner$dehardcode$dataBody: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$dataBody$$step: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"lang","d":{"t":"lit","v":["dart","js"]},"opt":false},{"name":"entries","d":{"t":"str"},"opt":false}],
  inner$dehardcode$testRel: [{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$dehardcode$testRel$$step: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"lang","d":{"t":"lit","v":["dart","js"]},"opt":false}],
  inner$dehardcode$injectCall$re: [{"name":"fn","d":{"t":"str"},"opt":false},{"name":"dotted","d":{"t":"any"},"opt":false}],
  inner$dehardcode$injectCall$j: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$dehardcode$injectCall$after: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$dehardcode$injectCall$after$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$dehardcode$injectCall$val: [{"name":"lang","d":{"t":"lit","v":["dart","js"]},"opt":false}],
  inner$dehardcode$imp: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$dehardcode$imp$$step: [{"name":"lang","d":{"t":"lit","v":["dart","js"]},"opt":false},{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataDir","d":{"t":"any"},"opt":false}],
  inner$dehardcode$lits$$after_loop: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$terms$$after_loop: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$key$$after_loop: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$used$$after_loop: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$i$$after_loop: [{"name":"src0","d":{"t":"any"},"opt":false}],
  inner$dehardcode$injectCall$d$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$dehardcode$injectCall$j$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$dehardcode$injectCall$inStr$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$dehardcode$injectCall$q$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
