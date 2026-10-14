// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/purify-engine.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const isStaticLit = (expr) => {
    const noStr = expr.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
    return !/[A-Za-z_$][\w$]*/.test(noStr.replace(/\b(true|false|null)\b/g, ''));
};
const balanced = (s, i) => {
    const open = s[i], close = { '[': ']', '{': '}', '(': ')' }[open];
    let d = 0, j = i, str = null;
    for (; j < s.length; j++) {
        const c = s[j];
        if (str) {
            if (c === '\\')
                j++;
            else if (c === str)
                str = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            str = c;
            continue;
        }
        if (c === open)
            d++;
        else if (c === close && --d === 0)
            return j;
    }
    return -1;
};
function fnSpans(src, fns) {
    // טווח-גוף לכל פונקציה-מיוצאת: מהחתימה עד סוגר-הגוף
    const spans = [];
    for (const fn of fns) {
        const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
        if (!sm)
            return null;
        const po = src.indexOf('(', sm.index + sm[0].length - 1);
        const pc = balanced(src, po);
        if (pc < 0)
            return null;
        const ob = src.indexOf('{', pc);
        const arrowExpr = src.slice(pc + 1, ob < 0 ? pc + 1 : ob).trim();
        if (ob < 0 || (arrowExpr !== '' && arrowExpr !== '=>')) {
            // גוף-ביטוי (arrow ללא-בלוק): הטווח עד ; ברמת-אפס
            let d = 0, q = pc + 1, stq = null;
            for (; q < src.length; q++) {
                const c = src[q];
                if (stq) {
                    if (c === '\\')
                        q++;
                    else if (c === stq)
                        stq = null;
                    continue;
                }
                if (c === "'" || c === '"' || c === '`')
                    stq = c;
                else if ('([{'.includes(c))
                    d++;
                else if (')]}'.includes(c)) {
                    if (d === 0)
                        break;
                    d--;
                }
                else if (c === ';' && d === 0)
                    break;
            }
            spans.push({ fn, sig: sm.index, po, pc, end: q });
            continue;
        }
        const oe = balanced(src, ob);
        if (oe < 0)
            return null;
        spans.push({ fn, sig: sm.index, po, pc, end: oe });
    }
    return spans;
}
const magic = (txt) => {
    const val = parseFloat(txt.replace(/_/g, ''));
    return /^-?[\d_]+(\.\d+)?$/.test(txt) && val >= 10 && !(Number.isInteger(val) && (val & (val - 1)) === 0);
};
export function inner$isStaticLit$noStr(expr) {
    const noStr = expr.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
    return noStr;
}
export function inner$fnSpans$sm(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    return sm;
}
export function inner$fnSpans$po(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    return po;
}
export function inner$fnSpans$po$$step(src, sm) {
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    return po;
}
export function inner$fnSpans$pc(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    return pc;
}
export function inner$fnSpans$pc$$step(src, po) {
    const pc = balanced(src, po);
    return pc;
}
export function inner$fnSpans$ob(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    const ob = src.indexOf('{', pc);
    return ob;
}
export function inner$fnSpans$ob$$step(src, pc) {
    const ob = src.indexOf('{', pc);
    return ob;
}
export function inner$fnSpans$arrowExpr(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    const ob = src.indexOf('{', pc);
    const arrowExpr = src.slice(pc + 1, ob < 0 ? pc + 1 : ob).trim();
    return arrowExpr;
}
export function inner$fnSpans$arrowExpr$$step(src, pc, ob) {
    const arrowExpr = src.slice(pc + 1, ob < 0 ? pc + 1 : ob).trim();
    return arrowExpr;
}
export function inner$fnSpans$q(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    let q = pc + 1;
    return q;
}
export function inner$fnSpans$q$$step(pc) {
    let q = pc + 1;
    return q;
}
export function inner$fnSpans$oe(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    const ob = src.indexOf('{', pc);
    const oe = balanced(src, ob);
    return oe;
}
export function inner$fnSpans$oe$$step(src, ob) {
    const oe = balanced(src, ob);
    return oe;
}
export function inner$eligible$code(src) {
    const code = strip(src);
    return code;
}
export function inner$eligible$fns(src) {
    const code = strip(src);
    const fns = [...code.matchAll(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/g)].map(m => m[1] || m[2]);
    return fns;
}
export function inner$eligible$fns$$step(code) {
    const fns = [...code.matchAll(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/g)].map(m => m[1] || m[2]);
    return fns;
}
export function inner$eligible$spans(src) {
    const code = strip(src);
    const fns = [...code.matchAll(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/g)].map(m => m[1] || m[2]);
    const spans = fnSpans(src, fns);
    return spans;
}
export function inner$eligible$spans$$step(src, fns) {
    const spans = fnSpans(src, fns);
    return spans;
}
export function inner$eligible$start(m) {
    const start = m.index + m[0].length;
    return start;
}
export function inner$eligible$sm2(src, m) {
    const start = m.index + m[0].length;
    const sm2 = src.slice(start).match(/^(-?\d[\d._]*(?:e-?\d+)?|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")\s*;/);
    return sm2;
}
export function inner$eligible$sm2$$step(src, start) {
    const sm2 = src.slice(start).match(/^(-?\d[\d._]*(?:e-?\d+)?|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")\s*;/);
    return sm2;
}
export function inner$eligible$semi(src, m) {
    const start = m.index + m[0].length;
    const semi = src.indexOf(';', start);
    return semi;
}
export function inner$eligible$semi$$step(src, start) {
    const semi = src.indexOf(';', start);
    return semi;
}
export function inner$eligible$lit(src, m, end) {
    const start = m.index + m[0].length;
    const lit = src.slice(start, end + 1);
    return lit;
}
export function inner$eligible$lit$$step(src, start, end) {
    const lit = src.slice(start, end + 1);
    return lit;
}
export function inner$appendArgAtCalls$mask(src) {
    const mask = src.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, m => 'x'.repeat(m.length))
        .replace(/\/\*[\s\S]*?\*\//g, m => 'x'.repeat(m.length))
        .replace(/\/\/[^\n]*/g, m => 'x'.repeat(m.length));
    return mask;
}
export function inner$appendArgAtCalls$importSpans(src) {
    const mask = src.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, m => 'x'.repeat(m.length))
        .replace(/\/\*[\s\S]*?\*\//g, m => 'x'.repeat(m.length))
        .replace(/\/\/[^\n]*/g, m => 'x'.repeat(m.length));
    const importSpans = [...mask.matchAll(/import[\s\S]*?from\s*x+\s*;|import\s*x+\s*;/g)]
        .map(m => [m.index, m.index + m[0].length]);
    return importSpans;
}
export function inner$appendArgAtCalls$importSpans$$step(mask) {
    const importSpans = [...mask.matchAll(/import[\s\S]*?from\s*x+\s*;|import\s*x+\s*;/g)]
        .map(m => [m.index, m.index + m[0].length]);
    return importSpans;
}
export function inner$appendArgAtCalls$j(fn, m) {
    let j = m.index + fn.length;
    return j;
}
export function inner$appendArgAtCalls$close(src, po) {
    const close = balanced(src, po);
    return close;
}
export function inner$appendArgAtCalls$inner(src, po) {
    const close = balanced(src, po);
    const inner = src.slice(po + 1, close);
    return inner;
}
export function inner$appendArgAtCalls$inner$$step(src, po, close) {
    const inner = src.slice(po + 1, close);
    return inner;
}
export function inner$findExistingData$st(m) {
    const st = m.index + m[0].length - 1;
    return st;
}
export function inner$findExistingData$en(t, m) {
    const st = m.index + m[0].length - 1;
    const en = balanced(t, st);
    return en;
}
export function inner$findExistingData$en$$step(t, st) {
    const en = balanced(t, st);
    return en;
}
export function inner$purifyOne$base(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    return base;
}
export function inner$purifyOne$dataBase(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-data';
    return dataBase;
}
export function inner$purifyOne$dataBase$$step(base) {
    const dataBase = base + '-data';
    return dataBase;
}
export function inner$purifyOne$names(cand) {
    const names = cand.consts.map(c => c.name);
    return names;
}
export function inner$purifyOne$spans2(cand, mech) {
    const spans2 = fnSpans(mech, cand.fns);
    return spans2;
}
export function inner$purifyOne$params(mech, sp) {
    const params = mech.slice(sp.po + 1, sp.pc).trim();
    return params;
}
export function inner$purifyOne$newConsts(cand) {
    const newConsts = cand.consts.filter(c => !c.existing);
    return newConsts;
}
export function inner$purifyOne$dataSrc(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-data';
    const newConsts = cand.consts.filter(c => !c.existing);
    const dataSrc = `/** אטום-דאטה · ${dataBase} — הדאטה שחולצה מ-${base} (מנוע-הטיהור, הכרעה 19). חוזה: ${dataBase}.contract.md */\n` +
        newConsts.map(c => `export const ${c.name} = ${c.lit};`).join('\n') + '\n';
    return dataSrc;
}
export function inner$purifyOne$dataSrc$$step(base, dataBase, newConsts) {
    const dataSrc = `/** אטום-דאטה · ${dataBase} — הדאטה שחולצה מ-${base} (מנוע-הטיהור, הכרעה 19). חוזה: ${dataBase}.contract.md */\n` +
        newConsts.map(c => `export const ${c.name} = ${c.lit};`).join('\n') + '\n';
    return dataSrc;
}
export function inner$purifyOne$contract(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-data';
    const contract = `# חוזה · ${dataBase}\nאטום-דאטה שחולץ מכנית מ-${base} על-ידי מנוע-הטיהור (הכרעה 19: קבועים ושמות-דומיין = דאטה).\nהמנגנון ${base} מקבל אותו כפרמטר-שקע; הקוראים מזריקים. צורת-דאטה טהורה — אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyOne$contract$$step(base, dataBase) {
    const contract = `# חוזה · ${dataBase}\nאטום-דאטה שחולץ מכנית מ-${base} על-ידי מנוע-הטיהור (הכרעה 19: קבועים ושמות-דומיין = דאטה).\nהמנגנון ${base} מקבל אותו כפרמטר-שקע; הקוראים מזריקים. צורת-דאטה טהורה — אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyOne$im(cand, t) {
    const base = cand.file.replace(/\.mjs$/, '');
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['\"])([^'\"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return im;
}
export function inner$purifyOne$im$$step(base, t) {
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['\"])([^'\"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return im;
}
export function inner$purifyOne$alias(fn) {
    const alias = `__pure_${fn}`;
    return alias;
}
export function inner$purifyOne$wre(fn) {
    const alias = `__pure_${fn}`;
    const wre = new RegExp(`(const \\w+ = \\(\\.\\.\\.a\\) => ${alias}\\(\\.\\.\\.a,[^\\n]*)\\);`);
    return wre;
}
export function inner$purifyOne$wre$$step(alias) {
    const wre = new RegExp(`(const \\w+ = \\(\\.\\.\\.a\\) => ${alias}\\(\\.\\.\\.a,[^\\n]*)\\);`);
    return wre;
}
export function inner$purifyOne$spec(braces, fn) {
    const spec = braces.match(new RegExp(`\\b${fn}\\b(\\s+as\\s+(\\w+))?`));
    return spec;
}
export function inner$purifyOne$pad(arity, fn) {
    const pad = `...Array(Math.max(0, ${arity[fn]} - a.length)).fill(undefined)`;
    return pad;
}
export function inner$purifyOne$home(cand, c) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-data';
    const home = c.existing ? c.existing.file : dataBase + '.mjs';
    return home;
}
export function inner$purifyOne$home$$step(dataBase, c) {
    const home = c.existing ? c.existing.file : dataBase + '.mjs';
    return home;
}
export function inner$purifyOne$exp(c) {
    const exp = c.existing ? c.existing.name : c.name;
    return exp;
}
export function inner$purifyOne$adj(cp) {
    const adj = cp.replace(/\.mjs$/, '.test.mjs');
    return adj;
}
export function inner$purifyOne$cnt(nu) {
    const cnt = (nu.match(/from '\.\.\/atoms\//g) || []).length;
    return cnt;
}
export function inner$purifyOne$patched(nu, at) {
    const cnt = (nu.match(/from '\.\.\/atoms\//g) || []).length;
    const patched = at.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyOne$patched$$step(at, cnt) {
    const patched = at.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyOne$mkData(cand) {
    const newConsts = cand.consts.filter(c => !c.existing);
    const mkData = newConsts.length > 0;
    return mkData;
}
export function inner$purifyOne$mkData$$step(newConsts) {
    const mkData = newConsts.length > 0;
    return mkData;
}
export function inner$purifyOne$adj_L271(pp) {
    const adj = pp.replace(/\.mjs$/, '.test.mjs');
    return adj;
}
export function inner$collectStringSites$pushTplChunk$raw(src, n, at) {
    const raw = src.slice(at, n.end);
    return raw;
}
export function inner$collectStringSites$pushTplChunk$suffix(src, n, at) {
    const raw = src.slice(at, n.end);
    const suffix = raw.endsWith('${') ? '${' : '`';
    return suffix;
}
export function inner$collectStringSites$pushTplChunk$suffix$$step(raw) {
    const suffix = raw.endsWith('${') ? '${' : '`';
    return suffix;
}
export function inner$eligibleStrings$code(src) {
    const code = strip(src);
    return code;
}
export function inner$eligibleStrings$fns(src) {
    const code = strip(src);
    const fns = [...code.matchAll(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/g)].map(m => m[1] || m[2]);
    return fns;
}
export function inner$eligibleStrings$fns$$step(code) {
    const fns = [...code.matchAll(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/g)].map(m => m[1] || m[2]);
    return fns;
}
export function inner$eligibleStrings$sigAt(src, fn) {
    const sigAt = src.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    return sigAt;
}
export function inner$replaceInlineSnap$m(t, aliasRe) {
    const m = t.match(new RegExp('const (' + aliasRe + ') = \\{'));
    return m;
}
export function inner$replaceInlineSnap$ob(t, aliasRe) {
    const m = t.match(new RegExp('const (' + aliasRe + ') = \\{'));
    const ob = t.indexOf('{', m.index);
    return ob;
}
export function inner$replaceInlineSnap$ob$$step(t, m) {
    const ob = t.indexOf('{', m.index);
    return ob;
}
export function inner$replaceInlineSnap$end(t, aliasRe) {
    const m = t.match(new RegExp('const (' + aliasRe + ') = \\{'));
    const ob = t.indexOf('{', m.index);
    let d = 0;
    let j = ob;
    let str = null;
    for (; j < t.length; j++) {
        const c = t[j];
        if (str) {
            if (c === '\\')
                j++;
            else if (c === str)
                str = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            str = c;
            continue;
        }
        if (c === '{')
            d++;
        else if (c === '}' && --d === 0)
            break;
    }
    const end = t[j + 1] === ';' ? j + 2 : j + 1;
    return end;
}
export function inner$replaceInlineSnap$end$$step(t, j) {
    const end = t[j + 1] === ';' ? j + 2 : j + 1;
    return end;
}
export function inner$purifyStrings$base(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    return base;
}
export function inner$purifyStrings$dataBase(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    return dataBase;
}
export function inner$purifyStrings$dataBase$$step(base) {
    const dataBase = base + '-strings';
    return dataBase;
}
export function inner$purifyStrings$CONST(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    return CONST;
}
export function inner$purifyStrings$CONST$$step(base) {
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    return CONST;
}
export function inner$purifyStrings$sigm(cand) {
    const sigm = cand.src.match(new RegExp(`export\\s+(?:const\\s+${cand.fn}\\s*=\\s*(?:async\\s*)?|function\\s+${cand.fn}\\s*)\\(([^)]*)\\)`));
    return sigm;
}
export function inner$purifyStrings$lastP(cand) {
    const sigm = cand.src.match(new RegExp(`export\\s+(?:const\\s+${cand.fn}\\s*=\\s*(?:async\\s*)?|function\\s+${cand.fn}\\s*)\\(([^)]*)\\)`));
    const lastP = sigm ? sigm[1].split(',').pop().trim() : '';
    return lastP;
}
export function inner$purifyStrings$lastP$$step(sigm) {
    const lastP = sigm ? sigm[1].split(',').pop().trim() : '';
    return lastP;
}
export function inner$purifyStrings$ref(cand, priorKeys, tParam, st) {
    const keys = new Map(priorKeys);
    for (const st of cand.sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const ref = `${tParam}.${keys.get(st.v)}`;
    return ref;
}
export function inner$purifyStrings$ref$$step(tParam, keys, st) {
    const ref = `${tParam}.${keys.get(st.v)}`;
    return ref;
}
export function inner$purifyStrings$sig(cand) {
    const sig = new RegExp(`(export\\s+(?:const\\s+${cand.fn}\\s*=\\s*(?:async\\s*)?|function\\s+${cand.fn}\\s*))\\(`);
    return sig;
}
export function inner$purifyStrings$sm(cand, mech) {
    const sig = new RegExp(`(export\\s+(?:const\\s+${cand.fn}\\s*=\\s*(?:async\\s*)?|function\\s+${cand.fn}\\s*))\\(`);
    const sm = mech.match(sig);
    return sm;
}
export function inner$purifyStrings$sm$$step(mech, sig) {
    const sm = mech.match(sig);
    return sm;
}
export function inner$purifyStrings$po(cand, mech) {
    const sig = new RegExp(`(export\\s+(?:const\\s+${cand.fn}\\s*=\\s*(?:async\\s*)?|function\\s+${cand.fn}\\s*))\\(`);
    const sm = mech.match(sig);
    const po = mech.indexOf('(', sm.index + sm[1].length - 1);
    return po;
}
export function inner$purifyStrings$po$$step(mech, sm) {
    const po = mech.indexOf('(', sm.index + sm[1].length - 1);
    return po;
}
export function inner$purifyStrings$pc(cand, mech) {
    const sig = new RegExp(`(export\\s+(?:const\\s+${cand.fn}\\s*=\\s*(?:async\\s*)?|function\\s+${cand.fn}\\s*))\\(`);
    const sm = mech.match(sig);
    const po = mech.indexOf('(', sm.index + sm[1].length - 1);
    const pc = balanced(mech, po);
    return pc;
}
export function inner$purifyStrings$pc$$step(mech, po) {
    const pc = balanced(mech, po);
    return pc;
}
export function inner$purifyStrings$params(cand, mech) {
    const sig = new RegExp(`(export\\s+(?:const\\s+${cand.fn}\\s*=\\s*(?:async\\s*)?|function\\s+${cand.fn}\\s*))\\(`);
    const sm = mech.match(sig);
    const po = mech.indexOf('(', sm.index + sm[1].length - 1);
    const pc = balanced(mech, po);
    const params = mech.slice(po + 1, pc).trim();
    return params;
}
export function inner$purifyStrings$params$$step(mech, po, pc) {
    const params = mech.slice(po + 1, pc).trim();
    return params;
}
export function inner$purifyStrings$litObj(cand, priorKeys) {
    const keys = new Map(priorKeys);
    for (const st of cand.sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const litObj = '{\n' + [...keys].map(([v, k]) => `  ${k}: ${JSON.stringify(v).replace(/\u2028|\u2029/g, '')},`).join('\n') + '\n}';
    return litObj;
}
export function inner$purifyStrings$litObj$$step(keys) {
    const litObj = '{\n' + [...keys].map(([v, k]) => `  ${k}: ${JSON.stringify(v).replace(/\u2028|\u2029/g, '')},`).join('\n') + '\n}';
    return litObj;
}
export function inner$purifyStrings$dataSrc(cand, priorKeys) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const keys = new Map(priorKeys);
    for (const st of cand.sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const litObj = '{\n' + [...keys].map(([v, k]) => `  ${k}: ${JSON.stringify(v).replace(/\u2028|\u2029/g, '')},`).join('\n') + '\n}';
    const dataSrc = `/** אטום-דאטה · ${dataBase} — מחרוזות-התצוגה/דומיין שחולצו מ-${base} (מנוע-הטיהור v3, הכרעה 19). חוזה: ${dataBase}.contract.md */\nexport const ${CONST} = ${litObj};\n`;
    return dataSrc;
}
export function inner$purifyStrings$dataSrc$$step(base, dataBase, CONST, litObj) {
    const dataSrc = `/** אטום-דאטה · ${dataBase} — מחרוזות-התצוגה/דומיין שחולצו מ-${base} (מנוע-הטיהור v3, הכרעה 19). חוזה: ${dataBase}.contract.md */\nexport const ${CONST} = ${litObj};\n`;
    return dataSrc;
}
export function inner$purifyStrings$contract(cand, tParam) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const contract = `# חוזה · ${dataBase}\nמחרוזות-דאטה (עברית/דומיין) שחולצו מכנית מהמנגנון ${base} (הכרעה 19: שמות ומשמעות = דאטה).\nהמנגנון מקבל אותן כטבלת-שקע ${tParam}; הקוראים כורכים דרך העטיפה. אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyStrings$contract$$step(base, dataBase, tParam) {
    const contract = `# חוזה · ${dataBase}\nמחרוזות-דאטה (עברית/דומיין) שחולצו מכנית מהמנגנון ${base} (הכרעה 19: שמות ומשמעות = דאטה).\nהמנגנון מקבל אותן כטבלת-שקע ${tParam}; הקוראים כורכים דרך העטיפה. אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyStrings$test(cand, priorKeys) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const keys = new Map(priorKeys);
    for (const st of cand.sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const test = `// בדיקת-צילום · ${dataBase} — המחרוזות שחולצו זהות ביט-אחר-ביט למקור.\nimport { ${CONST} } from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify(${CONST}), ${JSON.stringify(JSON.stringify(Object.fromEntries([...keys].map(([v, k]) => [k, v]))))});\nconsole.log('OK ${dataBase}');\n`;
    return test;
}
export function inner$purifyStrings$test$$step(dataBase, CONST, keys) {
    const test = `// בדיקת-צילום · ${dataBase} — המחרוזות שחולצו זהות ביט-אחר-ביט למקור.\nimport { ${CONST} } from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify(${CONST}), ${JSON.stringify(JSON.stringify(Object.fromEntries([...keys].map(([v, k]) => [k, v]))))});\nconsole.log('OK ${dataBase}');\n`;
    return test;
}
export function inner$purifyStrings$im(cand, t) {
    const base = cand.file.replace(/\.mjs$/, '');
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['\"])([^'\"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return im;
}
export function inner$purifyStrings$im$$step(base, t) {
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['\"])([^'\"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return im;
}
export function inner$purifyStrings$alias(cand) {
    const alias = `__pure_${cand.fn}`;
    return alias;
}
export function inner$purifyStrings$wre(cand) {
    const alias = `__pure_${cand.fn}`;
    const wre = new RegExp(`(const \\w+ = \\(\\.\\.\\.a\\) => ${alias}\\(\\.\\.\\.a,[^\\n]*)\\);`);
    return wre;
}
export function inner$purifyStrings$wre$$step(alias) {
    const wre = new RegExp(`(const \\w+ = \\(\\.\\.\\.a\\) => ${alias}\\(\\.\\.\\.a,[^\\n]*)\\);`);
    return wre;
}
export function inner$purifyStrings$dAlias2(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const dAlias2 = `__d_${cand.fn}_${CONST}`;
    return dAlias2;
}
export function inner$purifyStrings$dAlias2$$step(cand, CONST) {
    const dAlias2 = `__d_${cand.fn}_${CONST}`;
    return dAlias2;
}
export function inner$purifyStrings$home2(cand, existing) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const home2 = existing ? existing.file : dataBase + '.mjs';
    return home2;
}
export function inner$purifyStrings$home2$$step(dataBase, existing) {
    const home2 = existing ? existing.file : dataBase + '.mjs';
    return home2;
}
export function inner$purifyStrings$exp2(cand, existing) {
    const base = cand.file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const exp2 = existing ? existing.name : CONST;
    return exp2;
}
export function inner$purifyStrings$exp2$$step(CONST, existing) {
    const exp2 = existing ? existing.name : CONST;
    return exp2;
}
export function inner$purifyStrings$spec(cand, t) {
    const base = cand.file.replace(/\.mjs$/, '');
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['\"])([^'\"]*\\/${base}\\.mjs)\\2\\s*;?`));
    const spec = im[1].match(new RegExp(`\\b${cand.fn}\\b(\\s+as\\s+(\\w+))?`));
    return spec;
}
export function inner$purifyStrings$spec$$step(cand, im) {
    const spec = im[1].match(new RegExp(`\\b${cand.fn}\\b(\\s+as\\s+(\\w+))?`));
    return spec;
}
export function inner$purifyStrings$newBraces(cand, t) {
    const base = cand.file.replace(/\.mjs$/, '');
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['\"])([^'\"]*\\/${base}\\.mjs)\\2\\s*;?`));
    const alias = `__pure_${cand.fn}`;
    const spec = im[1].match(new RegExp(`\\b${cand.fn}\\b(\\s+as\\s+(\\w+))?`));
    const newBraces = im[1].replace(spec[0], `${cand.fn} as ${alias}`);
    return newBraces;
}
export function inner$purifyStrings$newBraces$$step(cand, im, alias, spec) {
    const newBraces = im[1].replace(spec[0], `${cand.fn} as ${alias}`);
    return newBraces;
}
export function inner$purifyStrings$pad(origArity) {
    const pad = `...Array(Math.max(0, ${origArity} - a.length)).fill(undefined)`;
    return pad;
}
export function inner$purifyStrings$dAlias(cand) {
    const base = cand.file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const dAlias = `__d_${cand.fn}_${CONST}`;
    return dAlias;
}
export function inner$purifyStrings$dAlias$$step(cand, CONST) {
    const dAlias = `__d_${cand.fn}_${CONST}`;
    return dAlias;
}
export function inner$purifyStrings$wrap(cand, origArity, t) {
    const base = cand.file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['\"])([^'\"]*\\/${base}\\.mjs)\\2\\s*;?`));
    const alias = `__pure_${cand.fn}`;
    const spec = im[1].match(new RegExp(`\\b${cand.fn}\\b(\\s+as\\s+(\\w+))?`));
    const local = spec[2] || cand.fn;
    const pad = `...Array(Math.max(0, ${origArity} - a.length)).fill(undefined)`;
    const dAlias = `__d_${cand.fn}_${CONST}`;
    const wrap = `const ${local} = (...a) => ${alias}(...a, ${pad}, ${dAlias});`;
    return wrap;
}
export function inner$purifyStrings$wrap$$step(alias, local, pad, dAlias) {
    const wrap = `const ${local} = (...a) => ${alias}(...a, ${pad}, ${dAlias});`;
    return wrap;
}
export function inner$purifyStrings$home(cand, existing) {
    const base = cand.file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const home = existing ? existing.file : dataBase + '.mjs';
    return home;
}
export function inner$purifyStrings$home$$step(dataBase, existing) {
    const home = existing ? existing.file : dataBase + '.mjs';
    return home;
}
export function inner$purifyStrings$exp(cand, existing) {
    const base = cand.file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const exp = existing ? existing.name : CONST;
    return exp;
}
export function inner$purifyStrings$exp$$step(CONST, existing) {
    const exp = existing ? existing.name : CONST;
    return exp;
}
export function inner$purifyStrings$adj(cp) {
    const adj = cp.replace(/\.mjs$/, '.test.mjs');
    return adj;
}
export function inner$purifyStrings$cnt(nu) {
    const cnt = (nu.match(/from '\.\.\/atoms\//g) || []).length;
    return cnt;
}
export function inner$purifyStrings$patched(nu, at) {
    const cnt = (nu.match(/from '\.\.\/atoms\//g) || []).length;
    const patched = at.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyStrings$patched$$step(at, cnt) {
    const patched = at.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyStrings$adj_L499(pp) {
    const adj = pp.replace(/\.mjs$/, '.test.mjs');
    return adj;
}
export function inner$nestHelpers$code(src) {
    const code = strip(src);
    return code;
}
export function inner$nestHelpers$exps(src) {
    const code = strip(src);
    const exps = [...code.matchAll(/export\s+(?:const|function|let|var|\{)/g)];
    return exps;
}
export function inner$nestHelpers$exps$$step(code) {
    const exps = [...code.matchAll(/export\s+(?:const|function|let|var|\{)/g)];
    return exps;
}
export function inner$nestHelpers$fm(src) {
    const code = strip(src);
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    return fm;
}
export function inner$nestHelpers$fm$$step(code) {
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    return fm;
}
export function inner$nestHelpers$noCom(src) {
    const noCom = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    return noCom;
}
export function inner$nestHelpers$hasData(src) {
    const noCom = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const hasData = /['"][^'"\n]*[\u0590-\u05FF]/.test(noCom) || /['"][^'"\n]*[a-zA-Z]{3,}[^'"\n]*['"]/.test(noCom) || /(?:^|\n)[ \t]*const\s+\w+\s*=\s*[\[{]/.test(noCom);
    return hasData;
}
export function inner$nestHelpers$hasData$$step(noCom) {
    const hasData = /['"][^'"\n]*[\u0590-\u05FF]/.test(noCom) || /['"][^'"\n]*[a-zA-Z]{3,}[^'"\n]*['"]/.test(noCom) || /(?:^|\n)[ \t]*const\s+\w+\s*=\s*[\[{]/.test(noCom);
    return hasData;
}
export function inner$nestHelpers$sigAt(src) {
    const code = strip(src);
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    const fn = fm[1] || fm[2];
    const sigAt = src.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    return sigAt;
}
export function inner$nestHelpers$sigAt$$step(src, fn) {
    const sigAt = src.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    return sigAt;
}
export function inner$nestHelpers$at(m) {
    const at = m.index + (m[0].startsWith('\n') ? 1 : 0);
    return at;
}
export function inner$nestHelpers$ob(src, declRe) {
    const ob = src.indexOf('{', declRe.lastIndex);
    return ob;
}
export function inner$nestHelpers$sig2(src, helpers) {
    const code = strip(src);
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    const fn = fm[1] || fm[2];
    let out = src;
    for (const h of [...helpers].sort((a, b) => b.at - a.at))
        out = out.slice(0, h.at) + out.slice(h.end + (out[h.end] === '\n' ? 1 : 0));
    const sig2 = out.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    return sig2;
}
export function inner$nestHelpers$sig2$$step(fn, out) {
    const sig2 = out.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    return sig2;
}
export function inner$nestHelpers$po(src, helpers) {
    const code = strip(src);
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    const fn = fm[1] || fm[2];
    let out = src;
    for (const h of [...helpers].sort((a, b) => b.at - a.at))
        out = out.slice(0, h.at) + out.slice(h.end + (out[h.end] === '\n' ? 1 : 0));
    const sig2 = out.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    const po = out.indexOf('(', sig2);
    return po;
}
export function inner$nestHelpers$po$$step(out, sig2) {
    const po = out.indexOf('(', sig2);
    return po;
}
export function inner$nestHelpers$pc(src, helpers) {
    const code = strip(src);
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    const fn = fm[1] || fm[2];
    let out = src;
    for (const h of [...helpers].sort((a, b) => b.at - a.at))
        out = out.slice(0, h.at) + out.slice(h.end + (out[h.end] === '\n' ? 1 : 0));
    const sig2 = out.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    const po = out.indexOf('(', sig2);
    const pc = balanced(out, po);
    return pc;
}
export function inner$nestHelpers$pc$$step(out, po) {
    const pc = balanced(out, po);
    return pc;
}
export function inner$nestHelpers$ob_L570(src, helpers) {
    const code = strip(src);
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    const fn = fm[1] || fm[2];
    let out = src;
    for (const h of [...helpers].sort((a, b) => b.at - a.at))
        out = out.slice(0, h.at) + out.slice(h.end + (out[h.end] === '\n' ? 1 : 0));
    const sig2 = out.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    const po = out.indexOf('(', sig2);
    const pc = balanced(out, po);
    const ob = out.indexOf('{', pc);
    return ob;
}
export function inner$nestHelpers$ob_L570$$step(out, pc) {
    const ob = out.indexOf('{', pc);
    return ob;
}
export function inner$nestHelpers$arrowAt(src, helpers) {
    const code = strip(src);
    const fm = code.match(/export\s+(?:const\s+(\w+)\s*=\s*(?:async\s*)?\(|function\s+(\w+)\s*\()/);
    const fn = fm[1] || fm[2];
    let out = src;
    for (const h of [...helpers].sort((a, b) => b.at - a.at))
        out = out.slice(0, h.at) + out.slice(h.end + (out[h.end] === '\n' ? 1 : 0));
    const sig2 = out.search(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=|function\\s+${fn}\\s*\\()`));
    const po = out.indexOf('(', sig2);
    const pc = balanced(out, po);
    const arrowAt = out.slice(pc, pc + 12).match(/^\)\s*(?:=>)?/);
    return arrowAt;
}
export function inner$nestHelpers$arrowAt$$step(out, pc) {
    const arrowAt = out.slice(pc, pc + 12).match(/^\)\s*(?:=>)?/);
    return arrowAt;
}
export function inner$nestHelpers$nested(helpers) {
    const nested = '\n  // 🪺 עוזרים קוננו פנימה (מנוע-הטיהור v4) — שקעי-הדאטה נראים להם דרך הסגירה\n' +
        helpers.map(h => '  ' + h.text.replace(/\n/g, '\n  ')).join('\n') + '\n';
    return nested;
}
export function inner$purifyBox$base(file) {
    const base = file.replace(/\.mjs$/, '');
    return base;
}
export function inner$purifyBox$dataBase(file) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-terms';
    return dataBase;
}
export function inner$purifyBox$dataBase$$step(base) {
    const dataBase = base + '-terms';
    return dataBase;
}
export function inner$purifyBox$CONST(file) {
    const base = file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_TERMS';
    return CONST;
}
export function inner$purifyBox$CONST$$step(base) {
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_TERMS';
    return CONST;
}
export function inner$purifyBox$ref(file, priorKeys, sites, st) {
    const base = file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_TERMS';
    const keys = new Map(priorKeys);
    for (const st of sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const ref = `${CONST}.${keys.get(st.v)}`;
    return ref;
}
export function inner$purifyBox$ref$$step(CONST, keys, st) {
    const ref = `${CONST}.${keys.get(st.v)}`;
    return ref;
}
export function inner$purifyBox$lastIm(out) {
    const lastIm = [...out.matchAll(/^import[^\n]*$/gm)].pop();
    return lastIm;
}
export function inner$purifyBox$imLine(file) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-terms';
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_TERMS';
    const imLine = `import { ${CONST} } from '../atoms/${dataBase}.mjs';`;
    return imLine;
}
export function inner$purifyBox$imLine$$step(dataBase, CONST) {
    const imLine = `import { ${CONST} } from '../atoms/${dataBase}.mjs';`;
    return imLine;
}
export function inner$purifyBox$litObj(priorKeys, sites) {
    const keys = new Map(priorKeys);
    for (const st of sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const litObj = '{\n' + [...keys].map(([v, k]) => `  ${k}: ${JSON.stringify(v)},`).join('\n') + '\n}';
    return litObj;
}
export function inner$purifyBox$litObj$$step(keys) {
    const litObj = '{\n' + [...keys].map(([v, k]) => `  ${k}: ${JSON.stringify(v)},`).join('\n') + '\n}';
    return litObj;
}
export function inner$purifyBox$dataSrc(file, priorKeys, sites) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-terms';
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_TERMS';
    const keys = new Map(priorKeys);
    for (const st of sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const litObj = '{\n' + [...keys].map(([v, k]) => `  ${k}: ${JSON.stringify(v)},`).join('\n') + '\n}';
    const dataSrc = `/** אטום-דאטה · ${dataBase} — מונחי-התצוגה של קופסת-${base} (מנוע-הטיהור v6, הכרעה 19). חוזה: ${dataBase}.contract.md */\nexport const ${CONST} = ${litObj};\n`;
    return dataSrc;
}
export function inner$purifyBox$dataSrc$$step(base, dataBase, CONST, litObj) {
    const dataSrc = `/** אטום-דאטה · ${dataBase} — מונחי-התצוגה של קופסת-${base} (מנוע-הטיהור v6, הכרעה 19). חוזה: ${dataBase}.contract.md */\nexport const ${CONST} = ${litObj};\n`;
    return dataSrc;
}
export function inner$purifyBox$contract(file) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-terms';
    const contract = `# חוזה · ${dataBase}\nמונחי-תצוגה עבריים שחולצו מכנית מקופסת-${base} (הכרעה 19: המשמעות = דאטה; הקופסה מחווטת).\nהקופסה מייבאת ישירות (קופסה⇐אטום מותר). אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyBox$contract$$step(base, dataBase) {
    const contract = `# חוזה · ${dataBase}\nמונחי-תצוגה עבריים שחולצו מכנית מקופסת-${base} (הכרעה 19: המשמעות = דאטה; הקופסה מחווטת).\nהקופסה מייבאת ישירות (קופסה⇐אטום מותר). אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyBox$test(file, priorKeys, sites) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-terms';
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_TERMS';
    const keys = new Map(priorKeys);
    for (const st of sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const test = `// בדיקת-צילום · ${dataBase} — המונחים זהים ביט-אחר-ביט למקור.\nimport { ${CONST} } from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify(${CONST}), ${JSON.stringify(JSON.stringify(Object.fromEntries([...keys].map(([v, k]) => [k, v]))))});\nconsole.log('OK ${dataBase}');\n`;
    return test;
}
export function inner$purifyBox$test$$step(dataBase, CONST, keys) {
    const test = `// בדיקת-צילום · ${dataBase} — המונחים זהים ביט-אחר-ביט למקור.\nimport { ${CONST} } from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify(${CONST}), ${JSON.stringify(JSON.stringify(Object.fromEntries([...keys].map(([v, k]) => [k, v]))))});\nconsole.log('OK ${dataBase}');\n`;
    return test;
}
export function inner$purifyBox$cnt(out) {
    const cnt = (out.match(/from '\.\.\/atoms\//g) || []).length;
    return cnt;
}
export function inner$purifyBox$patched(out, at) {
    const cnt = (out.match(/from '\.\.\/atoms\//g) || []).length;
    let patched = at.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyBox$patched$$step(at, cnt) {
    let patched = at.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyBox$tok(v) {
    const tok = `'${v.replace(/\\/g, '\\\\')}'`;
    return tok;
}
export function inner$purifyBox$after(patched, v, idx) {
    const tok = `'${v.replace(/\\/g, '\\\\')}'`;
    const after = patched.slice(idx + tok.length).match(/^\s*(\S)/);
    return after;
}
export function inner$purifyBox$after$$step(patched, tok, idx) {
    const after = patched.slice(idx + tok.length).match(/^\s*(\S)/);
    return after;
}
export function inner$purifyBox$snap(file, priorKeys, sites) {
    const base = file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_TERMS';
    const keys = new Map(priorKeys);
    for (const st of sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    const litObj = '{\n' + [...keys].map(([v, k]) => `  ${k}: ${JSON.stringify(v)},`).join('\n') + '\n}';
    const snap = `const ${CONST} = ${litObj};   // צילום-מקומי (מנוע-הטיהור v6 — מגני-המקור עודכנו לצורה החדשה)\n`;
    return snap;
}
export function inner$purifyBox$snap$$step(CONST, litObj) {
    const snap = `const ${CONST} = ${litObj};   // צילום-מקומי (מנוע-הטיהור v6 — מגני-המקור עודכנו לצורה החדשה)\n`;
    return snap;
}
export function inner$purifyBox$db(patched) {
    const db = patched.match(/^\/\*[\s\S]*?\*\/\n/);
    return db;
}
export function inner$purifyBoxConsts$base(file) {
    const base = file.replace(/\.mjs$/, '');
    return base;
}
export function inner$purifyBoxConsts$magic$val(txt) {
    const val = parseFloat(txt.replace(/_/g, ''));
    return val;
}
export function inner$purifyBoxConsts$val(m) {
    const val = m[2].trim();
    return val;
}
export function inner$purifyBoxConsts$isNum(m) {
    const val = m[2].trim();
    const isNum = magic(val);
    return isNum;
}
export function inner$purifyBoxConsts$isNum$$step(val) {
    const isNum = magic(val);
    return isNum;
}
export function inner$purifyBoxConsts$dataBase(file) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-wiring-data';
    return dataBase;
}
export function inner$purifyBoxConsts$dataBase$$step(base) {
    const dataBase = base + '-wiring-data';
    return dataBase;
}
export function inner$purifyBoxConsts$names(src) {
    const decls = [];
    for (const m of src.matchAll(/(?:^|\n)const\s+([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+);[^\n]*/g)) {
        const name = m[1], val = m[2].trim();
        const isNum = magic(val);
        if (!isNum)
            continue; // מחרוזות = שיפוט-משמעות (חוק-6/יד)
        if (/חוק-6|פרוטוקול-חיצוני/.test(src.slice(Math.max(0, m.index - 160), m.index + m[0].length)))
            continue;
        decls.push({ name, val, at: m.index, len: m[0].length, txt: m[0] });
    }
    const names = decls.map(d => d.name);
    return names;
}
export function inner$purifyBoxConsts$names$$step(decls) {
    const names = decls.map(d => d.name);
    return names;
}
export function inner$purifyBoxConsts$lastIm(src) {
    const lastIm = [...src.matchAll(/^import[^\n]*$/gm)].pop();
    return lastIm;
}
export function inner$purifyBoxConsts$prior(priorSrc) {
    const prior = priorSrc ? [...priorSrc.matchAll(/export const (\w+)/g)].map(x => x[1]) : [];
    return prior;
}
export function inner$purifyBoxConsts$imLine(file, src, priorSrc) {
    const base = file.replace(/\.mjs$/, '');
    const decls = [];
    for (const m of src.matchAll(/(?:^|\n)const\s+([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+);[^\n]*/g)) {
        const name = m[1], val = m[2].trim();
        const isNum = magic(val);
        if (!isNum)
            continue; // מחרוזות = שיפוט-משמעות (חוק-6/יד)
        if (/חוק-6|פרוטוקול-חיצוני/.test(src.slice(Math.max(0, m.index - 160), m.index + m[0].length)))
            continue;
        decls.push({ name, val, at: m.index, len: m[0].length, txt: m[0] });
    }
    const dataBase = base + '-wiring-data';
    const names = decls.map(d => d.name);
    const prior = priorSrc ? [...priorSrc.matchAll(/export const (\w+)/g)].map(x => x[1]) : [];
    const imLine = `import { ${[...new Set([...prior, ...names])].join(', ')} } from '../atoms/${dataBase}.mjs';`;
    return imLine;
}
export function inner$purifyBoxConsts$imLine$$step(dataBase, names, prior) {
    const imLine = `import { ${[...new Set([...prior, ...names])].join(', ')} } from '../atoms/${dataBase}.mjs';`;
    return imLine;
}
export function inner$purifyBoxConsts$exports(src, priorSrc) {
    const decls = [];
    for (const m of src.matchAll(/(?:^|\n)const\s+([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+);[^\n]*/g)) {
        const name = m[1], val = m[2].trim();
        const isNum = magic(val);
        if (!isNum)
            continue; // מחרוזות = שיפוט-משמעות (חוק-6/יד)
        if (/חוק-6|פרוטוקול-חיצוני/.test(src.slice(Math.max(0, m.index - 160), m.index + m[0].length)))
            continue;
        decls.push({ name, val, at: m.index, len: m[0].length, txt: m[0] });
    }
    const exports = (priorSrc ? priorSrc.replace(/\/\*\*[\s\S]*?\*\/\n/, '').trim() + '\n' : '')
        + decls.map(d => `export const ${d.name} = ${d.val};`).join('\n') + '\n';
    return exports;
}
export function inner$purifyBoxConsts$exports$$step(decls, priorSrc) {
    const exports = (priorSrc ? priorSrc.replace(/\/\*\*[\s\S]*?\*\/\n/, '').trim() + '\n' : '')
        + decls.map(d => `export const ${d.name} = ${d.val};`).join('\n') + '\n';
    return exports;
}
export function inner$purifyBoxConsts$dataSrc(file, src, priorSrc) {
    const base = file.replace(/\.mjs$/, '');
    const decls = [];
    for (const m of src.matchAll(/(?:^|\n)const\s+([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+);[^\n]*/g)) {
        const name = m[1], val = m[2].trim();
        const isNum = magic(val);
        if (!isNum)
            continue; // מחרוזות = שיפוט-משמעות (חוק-6/יד)
        if (/חוק-6|פרוטוקול-חיצוני/.test(src.slice(Math.max(0, m.index - 160), m.index + m[0].length)))
            continue;
        decls.push({ name, val, at: m.index, len: m[0].length, txt: m[0] });
    }
    const dataBase = base + '-wiring-data';
    const exports = (priorSrc ? priorSrc.replace(/\/\*\*[\s\S]*?\*\/\n/, '').trim() + '\n' : '')
        + decls.map(d => `export const ${d.name} = ${d.val};`).join('\n') + '\n';
    const dataSrc = `/** אטום-דאטה · ${dataBase} — קבועי-החיווט של קופסת-${base} (מנוע-הטיהור v7, הכרעה 19). חוזה: ${dataBase}.contract.md\n *  מהות-המוצא: קבועי חיווט של קופסת ${base.replace(/-/g, ' ')} */\n${exports}`;
    return dataSrc;
}
export function inner$purifyBoxConsts$dataSrc$$step(base, dataBase, exports) {
    const dataSrc = `/** אטום-דאטה · ${dataBase} — קבועי-החיווט של קופסת-${base} (מנוע-הטיהור v7, הכרעה 19). חוזה: ${dataBase}.contract.md\n *  מהות-המוצא: קבועי חיווט של קופסת ${base.replace(/-/g, ' ')} */\n${exports}`;
    return dataSrc;
}
export function inner$purifyBoxConsts$contract(file) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-wiring-data';
    const contract = `# חוזה · ${dataBase}\nקבועי-חיווט (מספרי-קסם/מחרוזות-דומיין מנוימים) שהורמו מכנית מקופסת-${base} (הכרעה 19).\nהקופסה מייבאת ישירות (קופסה⇐אטום מותר). אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyBoxConsts$contract$$step(base, dataBase) {
    const contract = `# חוזה · ${dataBase}\nקבועי-חיווט (מספרי-קסם/מחרוזות-דומיין מנוימים) שהורמו מכנית מקופסת-${base} (הכרעה 19).\nהקופסה מייבאת ישירות (קופסה⇐אטום מותר). אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyBoxConsts$testSrc(file, src, priorSrc) {
    const base = file.replace(/\.mjs$/, '');
    const decls = [];
    for (const m of src.matchAll(/(?:^|\n)const\s+([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+);[^\n]*/g)) {
        const name = m[1], val = m[2].trim();
        const isNum = magic(val);
        if (!isNum)
            continue; // מחרוזות = שיפוט-משמעות (חוק-6/יד)
        if (/חוק-6|פרוטוקול-חיצוני/.test(src.slice(Math.max(0, m.index - 160), m.index + m[0].length)))
            continue;
        decls.push({ name, val, at: m.index, len: m[0].length, txt: m[0] });
    }
    const dataBase = base + '-wiring-data';
    const names = decls.map(d => d.name);
    const prior = priorSrc ? [...priorSrc.matchAll(/export const (\w+)/g)].map(x => x[1]) : [];
    const allNames = [...new Set([...prior, ...names])];
    const testSrc = `// בדיקת-צילום · ${dataBase} — הערכים זהים ביט-אחר-ביט למקור בקופסה.\nimport * as D from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify([${allNames.map(n2 => 'D.' + n2).join(', ')}]), JSON.stringify(${'['}${allNames.map(n2 => `__V_${n2}`).join(', ')}]));\nconsole.log('OK ${dataBase}');\n`
        .replace(new RegExp(allNames.map(n2 => `__V_${n2}`).join('|'), 'g'), (mm) => {
        const nm = mm.slice(4);
        const d = decls.find(x => x.name === nm);
        if (d)
            return d.val;
        const pm = priorSrc && priorSrc.match(new RegExp(`export const ${nm} = ([^;]+);`));
        return pm ? pm[1] : 'undefined';
    });
    return testSrc;
}
export function inner$purifyBoxConsts$testSrc$$step(decls, dataBase, priorSrc, allNames) {
    const testSrc = `// בדיקת-צילום · ${dataBase} — הערכים זהים ביט-אחר-ביט למקור בקופסה.\nimport * as D from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify([${allNames.map(n2 => 'D.' + n2).join(', ')}]), JSON.stringify(${'['}${allNames.map(n2 => `__V_${n2}`).join(', ')}]));\nconsole.log('OK ${dataBase}');\n`
        .replace(new RegExp(allNames.map(n2 => `__V_${n2}`).join('|'), 'g'), (mm) => {
        const nm = mm.slice(4);
        const d = decls.find(x => x.name === nm);
        if (d)
            return d.val;
        const pm = priorSrc && priorSrc.match(new RegExp(`export const ${nm} = ([^;]+);`));
        return pm ? pm[1] : 'undefined';
    });
    return testSrc;
}
export function inner$purifyBoxConsts$replace$nm(mm) {
    const nm = mm.slice(4);
    return nm;
}
export function inner$purifyBoxConsts$replace$d(decls, mm) {
    const nm = mm.slice(4);
    const d = decls.find(x => x.name === nm);
    return d;
}
export function inner$purifyBoxConsts$replace$d$$step(decls, nm) {
    const d = decls.find(x => x.name === nm);
    return d;
}
export function inner$purifyBoxConsts$replace$pm(priorSrc, mm) {
    const nm = mm.slice(4);
    const pm = priorSrc && priorSrc.match(new RegExp(`export const ${nm} = ([^;]+);`));
    return pm;
}
export function inner$purifyBoxConsts$replace$pm$$step(priorSrc, nm) {
    const pm = priorSrc && priorSrc.match(new RegExp(`export const ${nm} = ([^;]+);`));
    return pm;
}
export function inner$purifyBoxConsts$pats(d) {
    const pats = [`src.includes("const ${d.name} = ${d.val};")`, `src.includes('const ${d.name} = ${d.val};')`, `src.includes("${d.name} = ${d.val}")`, `src.includes('${d.name} = ${d.val}')`];
    return pats;
}
export function inner$fnSpans$d$$after_loop(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    let d = 0;
    let q = pc + 1;
    let stq = null;
    for (; q < src.length; q++) {
        const c = src[q];
        if (stq) {
            if (c === '\\')
                q++;
            else if (c === stq)
                stq = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`')
            stq = c;
        else if ('([{'.includes(c))
            d++;
        else if (')]}'.includes(c)) {
            if (d === 0)
                break;
            d--;
        }
        else if (c === ';' && d === 0)
            break;
    }
    return d;
}
export function inner$fnSpans$q$$after_loop(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    let d = 0;
    let q = pc + 1;
    let stq = null;
    for (; q < src.length; q++) {
        const c = src[q];
        if (stq) {
            if (c === '\\')
                q++;
            else if (c === stq)
                stq = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`')
            stq = c;
        else if ('([{'.includes(c))
            d++;
        else if (')]}'.includes(c)) {
            if (d === 0)
                break;
            d--;
        }
        else if (c === ';' && d === 0)
            break;
    }
    return q;
}
export function inner$fnSpans$stq$$after_loop(src, fn) {
    const sm = src.match(new RegExp(`export\\s+(?:const\\s+${fn}\\s*=\\s*(?:async\\s*)?|function\\s+${fn}\\s*)\\(`));
    const po = src.indexOf('(', sm.index + sm[0].length - 1);
    const pc = balanced(src, po);
    let d = 0;
    let q = pc + 1;
    let stq = null;
    for (; q < src.length; q++) {
        const c = src[q];
        if (stq) {
            if (c === '\\')
                q++;
            else if (c === stq)
                stq = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`')
            stq = c;
        else if ('([{'.includes(c))
            d++;
        else if (')]}'.includes(c)) {
            if (d === 0)
                break;
            d--;
        }
        else if (c === ';' && d === 0)
            break;
    }
    return stq;
}
export function inner$eligible$consts$$after_loop(src) {
    const code = strip(src);
    const consts = [];
    for (const m of src.matchAll(/(?:^|\n)([ \t]*)const\s+([A-Za-z_$][\w$]*)\s*=\s*(?=[\[{]|-?\d|['"])/g)) {
        const start = m.index + m[0].length;
        let end;
        if ('[{'.includes(src[start])) {
            end = balanced(src, start);
            if (end < 0 || src[end + 1] !== ';')
                continue;
        }
        else {
            const sm2 = src.slice(start).match(/^(-?\d[\d._]*(?:e-?\d+)?|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")\s*;/);
            if (!sm2)
                continue;
            end = start + sm2[1].length - 1;
            if (src[end + 1] !== ';') {
                const semi = src.indexOf(';', start);
                if (src.slice(start, semi).trim() !== sm2[1])
                    continue;
                end = semi - 1;
            }
        }
        const lit = src.slice(start, end + 1);
        if (!isStaticLit(lit) || lit.length < 2)
            continue;
        if (new RegExp(`\\b${m[2]}\\s*\\.\\s*(push|pop|shift|unshift|splice|sort|reverse|fill)\\b|\\b${m[2]}\\s*\\[[^\\]]*\\]\\s*(=|\\+\\+|--|\\+=|-=)|\\b${m[2]}\\s*(=|\\+\\+|--)|(\\+\\+|--)\\s*${m[2]}\\b|Object\\.(assign|defineProperty)\\(\\s*${m[2]}\\b|delete\\s+${m[2]}\\b`).test(code.slice(code.indexOf(m[2]) + 1)))
            continue;
        consts.push({ name: m[2], lit, declStart: m.index + (m[0].startsWith('\n') ? 1 : 0), declEnd: end + 2 });
    }
    return consts;
}
export function inner$replaceInlineSnap$d$$after_loop(t, aliasRe) {
    const m = t.match(new RegExp('const (' + aliasRe + ') = \\{'));
    const ob = t.indexOf('{', m.index);
    let d = 0;
    let j = ob;
    let str = null;
    for (; j < t.length; j++) {
        const c = t[j];
        if (str) {
            if (c === '\\')
                j++;
            else if (c === str)
                str = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            str = c;
            continue;
        }
        if (c === '{')
            d++;
        else if (c === '}' && --d === 0)
            break;
    }
    return d;
}
export function inner$replaceInlineSnap$j$$after_loop(t, aliasRe) {
    const m = t.match(new RegExp('const (' + aliasRe + ') = \\{'));
    const ob = t.indexOf('{', m.index);
    let d = 0;
    let j = ob;
    let str = null;
    for (; j < t.length; j++) {
        const c = t[j];
        if (str) {
            if (c === '\\')
                j++;
            else if (c === str)
                str = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            str = c;
            continue;
        }
        if (c === '{')
            d++;
        else if (c === '}' && --d === 0)
            break;
    }
    return j;
}
export function inner$replaceInlineSnap$str$$after_loop(t, aliasRe) {
    const m = t.match(new RegExp('const (' + aliasRe + ') = \\{'));
    const ob = t.indexOf('{', m.index);
    let d = 0;
    let j = ob;
    let str = null;
    for (; j < t.length; j++) {
        const c = t[j];
        if (str) {
            if (c === '\\')
                j++;
            else if (c === str)
                str = null;
            continue;
        }
        if (c === "'" || c === '"' || c === '`') {
            str = c;
            continue;
        }
        if (c === '{')
            d++;
        else if (c === '}' && --d === 0)
            break;
    }
    return str;
}
export function inner$purifyStrings$keys$$after_loop(cand, priorKeys) {
    const keys = new Map(priorKeys);
    for (const st of cand.sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    return keys;
}
export function inner$nestHelpers$d$$after_loop(src, declRe) {
    let d = 0;
    let q = declRe.lastIndex;
    let stq = null;
    for (; q < src.length; q++) {
        const c = src[q];
        if (stq) {
            if (c === '\\')
                q++;
            else if (c === stq)
                stq = null;
            continue;
        }
        if (c === "'" || c === '\"' || c === '`')
            stq = c;
        else if ('([{'.includes(c))
            d++;
        else if (')]}'.includes(c))
            d--;
        else if (c === ';' && d === 0)
            break;
    }
    return d;
}
export function inner$nestHelpers$q$$after_loop(src, declRe) {
    let d = 0;
    let q = declRe.lastIndex;
    let stq = null;
    for (; q < src.length; q++) {
        const c = src[q];
        if (stq) {
            if (c === '\\')
                q++;
            else if (c === stq)
                stq = null;
            continue;
        }
        if (c === "'" || c === '\"' || c === '`')
            stq = c;
        else if ('([{'.includes(c))
            d++;
        else if (')]}'.includes(c))
            d--;
        else if (c === ';' && d === 0)
            break;
    }
    return q;
}
export function inner$nestHelpers$stq$$after_loop(src, declRe) {
    let d = 0;
    let q = declRe.lastIndex;
    let stq = null;
    for (; q < src.length; q++) {
        const c = src[q];
        if (stq) {
            if (c === '\\')
                q++;
            else if (c === stq)
                stq = null;
            continue;
        }
        if (c === "'" || c === '\"' || c === '`')
            stq = c;
        else if ('([{'.includes(c))
            d++;
        else if (')]}'.includes(c))
            d--;
        else if (c === ';' && d === 0)
            break;
    }
    return stq;
}
export function inner$nestHelpers$out$$after_loop(src, helpers) {
    let out = src;
    for (const h of [...helpers].sort((a, b) => b.at - a.at))
        out = out.slice(0, h.at) + out.slice(h.end + (out[h.end] === '\n' ? 1 : 0));
    return out;
}
export function inner$purifyBox$keys$$after_loop(priorKeys, sites) {
    const keys = new Map(priorKeys);
    for (const st of sites)
        if (!keys.has(st.v))
            keys.set(st.v, 'k' + (keys.size + 1));
    return keys;
}
export function inner$purifyBoxConsts$decls$$after_loop(src) {
    const decls = [];
    for (const m of src.matchAll(/(?:^|\n)const\s+([A-Z][A-Z0-9_]*)\s*=\s*([^;\n]+);[^\n]*/g)) {
        const name = m[1], val = m[2].trim();
        const isNum = magic(val);
        if (!isNum)
            continue; // מחרוזות = שיפוט-משמעות (חוק-6/יד)
        if (/חוק-6|פרוטוקול-חיצוני/.test(src.slice(Math.max(0, m.index - 160), m.index + m[0].length)))
            continue;
        decls.push({ name, val, at: m.index, len: m[0].length, txt: m[0] });
    }
    return decls;
}

export const SIGS = {
  inner$isStaticLit$noStr: [{"name":"expr","d":{"t":"any"},"opt":false}],
  inner$fnSpans$sm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$po: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$po$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"sm","d":{"t":"any"},"opt":false}],
  inner$fnSpans$pc: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$pc$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"po","d":{"t":"any"},"opt":false}],
  inner$fnSpans$ob: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$ob$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"pc","d":{"t":"any"},"opt":false}],
  inner$fnSpans$arrowExpr: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$arrowExpr$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"pc","d":{"t":"num"},"opt":false},{"name":"ob","d":{"t":"num"},"opt":false}],
  inner$fnSpans$q: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$q$$step: [{"name":"pc","d":{"t":"num"},"opt":false}],
  inner$fnSpans$oe: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$oe$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"ob","d":{"t":"any"},"opt":false}],
  inner$eligible$code: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$eligible$fns: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$eligible$fns$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$eligible$spans: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$eligible$spans$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$eligible$start: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$eligible$sm2: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$eligible$sm2$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"any"},"opt":false}],
  inner$eligible$semi: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$eligible$semi$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"any"},"opt":false}],
  inner$eligible$lit: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"end","d":{"t":"num"},"opt":false}],
  inner$eligible$lit$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"any"},"opt":false},{"name":"end","d":{"t":"num"},"opt":false}],
  inner$appendArgAtCalls$mask: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$appendArgAtCalls$importSpans: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$appendArgAtCalls$importSpans$$step: [{"name":"mask","d":{"t":"any"},"opt":false}],
  inner$appendArgAtCalls$j: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$appendArgAtCalls$close: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"po","d":{"t":"any"},"opt":false}],
  inner$appendArgAtCalls$inner: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"po","d":{"t":"num"},"opt":false}],
  inner$appendArgAtCalls$inner$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"po","d":{"t":"num"},"opt":false},{"name":"close","d":{"t":"any"},"opt":false}],
  inner$findExistingData$st: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$findExistingData$en: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$findExistingData$en$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"num"},"opt":false}],
  inner$purifyOne$base: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyOne$dataBase: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyOne$dataBase$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyOne$names: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyOne$spans2: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"mech","d":{"t":"any"},"opt":false}],
  inner$purifyOne$params: [{"name":"mech","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"obj","p":[["fn",{"t":"any"},false],["sig",{"t":"any"},false],["po",{"t":"any"},false],["pc",{"t":"any"},false],["end",{"t":"any"},false]]},"opt":false}],
  inner$purifyOne$newConsts: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyOne$dataSrc: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyOne$dataSrc$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"newConsts","d":{"t":"any"},"opt":false}],
  inner$purifyOne$contract: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyOne$contract$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false}],
  inner$purifyOne$im: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyOne$im$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyOne$alias: [{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyOne$wre: [{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyOne$wre$$step: [{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$purifyOne$spec: [{"name":"braces","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyOne$pad: [{"name":"arity","d":{"t":"obj","n":"arity","p":[]},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyOne$home: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$purifyOne$home$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$purifyOne$exp: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$purifyOne$adj: [{"name":"cp","d":{"t":"any"},"opt":false}],
  inner$purifyOne$cnt: [{"name":"nu","d":{"t":"any"},"opt":false}],
  inner$purifyOne$patched: [{"name":"nu","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$purifyOne$patched$$step: [{"name":"at","d":{"t":"any"},"opt":false},{"name":"cnt","d":{"t":"any"},"opt":false}],
  inner$purifyOne$mkData: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyOne$mkData$$step: [{"name":"newConsts","d":{"t":"any"},"opt":false}],
  inner$purifyOne$adj_L271: [{"name":"pp","d":{"t":"any"},"opt":false}],
  inner$collectStringSites$pushTplChunk$raw: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$collectStringSites$pushTplChunk$suffix: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$collectStringSites$pushTplChunk$suffix$$step: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$eligibleStrings$code: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$eligibleStrings$fns: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$eligibleStrings$fns$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$eligibleStrings$sigAt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$m: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$ob: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$ob$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$end: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$end$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$purifyStrings$base: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$dataBase: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$dataBase$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$CONST: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$CONST$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$sigm: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$lastP: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$lastP$$step: [{"name":"sigm","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$ref: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tParam","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$ref$$step: [{"name":"tParam","d":{"t":"any"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"st","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$sig: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$sm: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"mech","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$sm$$step: [{"name":"mech","d":{"t":"any"},"opt":false},{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$po: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"mech","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$po$$step: [{"name":"mech","d":{"t":"any"},"opt":false},{"name":"sm","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$pc: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"mech","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$pc$$step: [{"name":"mech","d":{"t":"any"},"opt":false},{"name":"po","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$params: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"mech","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$params$$step: [{"name":"mech","d":{"t":"any"},"opt":false},{"name":"po","d":{"t":"num"},"opt":false},{"name":"pc","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$litObj: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyStrings$litObj$$step: [{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyStrings$dataSrc: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyStrings$dataSrc$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"litObj","d":{"t":"str"},"opt":false}],
  inner$purifyStrings$contract: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"tParam","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$contract$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"tParam","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$test: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyStrings$test$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyStrings$im: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$im$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$alias: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$wre: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$wre$$step: [{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$purifyStrings$dAlias2: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$dAlias2$$step: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false}],
  inner$purifyStrings$home2: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$home2$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$exp2: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$exp2$$step: [{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$spec: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$spec$$step: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"im","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$newBraces: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$newBraces$$step: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"im","d":{"t":"any"},"opt":false},{"name":"alias","d":{"t":"str"},"opt":false},{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$pad: [{"name":"origArity","d":{"t":"num"},"opt":false}],
  inner$purifyStrings$dAlias: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$dAlias$$step: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false}],
  inner$purifyStrings$wrap: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"origArity","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$wrap$$step: [{"name":"alias","d":{"t":"str"},"opt":false},{"name":"local","d":{"t":"any"},"opt":false},{"name":"pad","d":{"t":"str"},"opt":false},{"name":"dAlias","d":{"t":"str"},"opt":false}],
  inner$purifyStrings$home: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$home$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$exp: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$exp$$step: [{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["file",{"t":"any"},false],["name",{"t":"any"},false]]}]},"opt":false}],
  inner$purifyStrings$adj: [{"name":"cp","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$cnt: [{"name":"nu","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$patched: [{"name":"nu","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$patched$$step: [{"name":"at","d":{"t":"any"},"opt":false},{"name":"cnt","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$adj_L499: [{"name":"pp","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$code: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$exps: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$exps$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$fm: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$fm$$step: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$noCom: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$hasData: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$hasData$$step: [{"name":"noCom","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$sigAt: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$sigAt$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$at: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$ob: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"declRe","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$sig2: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"helpers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$nestHelpers$sig2$$step: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"out","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$po: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"helpers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$nestHelpers$po$$step: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"sig2","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$pc: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"helpers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$nestHelpers$pc$$step: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"po","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$ob_L570: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"helpers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$nestHelpers$ob_L570$$step: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"pc","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$arrowAt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"helpers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$nestHelpers$arrowAt$$step: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"pc","d":{"t":"num"},"opt":false}],
  inner$nestHelpers$nested: [{"name":"helpers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBox$base: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBox$dataBase: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBox$dataBase$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyBox$CONST: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBox$CONST$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyBox$ref: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"st","d":{"t":"any"},"opt":false}],
  inner$purifyBox$ref$$step: [{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"st","d":{"t":"any"},"opt":false}],
  inner$purifyBox$lastIm: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$purifyBox$imLine: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBox$imLine$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false}],
  inner$purifyBox$litObj: [{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBox$litObj$$step: [{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyBox$dataSrc: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBox$dataSrc$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"litObj","d":{"t":"str"},"opt":false}],
  inner$purifyBox$contract: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBox$contract$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false}],
  inner$purifyBox$test: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBox$test$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyBox$cnt: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$purifyBox$patched: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$purifyBox$patched$$step: [{"name":"at","d":{"t":"any"},"opt":false},{"name":"cnt","d":{"t":"any"},"opt":false}],
  inner$purifyBox$tok: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$purifyBox$after: [{"name":"patched","d":{"t":"any"},"opt":false},{"name":"v","d":{"t":"any"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$purifyBox$after$$step: [{"name":"patched","d":{"t":"any"},"opt":false},{"name":"tok","d":{"t":"str"},"opt":false},{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$purifyBox$snap: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBox$snap$$step: [{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"litObj","d":{"t":"str"},"opt":false}],
  inner$purifyBox$db: [{"name":"patched","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$base: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$magic$val: [{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$val: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$isNum: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$isNum$$step: [{"name":"val","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$dataBase: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$dataBase$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$names: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$names$$step: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBoxConsts$lastIm: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$prior: [{"name":"priorSrc","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$imLine: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"priorSrc","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$imLine$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"names","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"prior","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBoxConsts$exports: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"priorSrc","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$exports$$step: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"priorSrc","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$dataSrc: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"priorSrc","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$dataSrc$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"exports","d":{"t":"str"},"opt":false}],
  inner$purifyBoxConsts$contract: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$contract$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false}],
  inner$purifyBoxConsts$testSrc: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"priorSrc","d":{"t":"any"},"opt":false}],
  inner$purifyBoxConsts$testSrc$$step: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"priorSrc","d":{"t":"any"},"opt":false},{"name":"allNames","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBoxConsts$replace$nm: [{"name":"mm","d":{"t":"str"},"opt":false}],
  inner$purifyBoxConsts$replace$d: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"mm","d":{"t":"str"},"opt":false}],
  inner$purifyBoxConsts$replace$d$$step: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$purifyBoxConsts$replace$pm: [{"name":"priorSrc","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"str"},"opt":false}],
  inner$purifyBoxConsts$replace$pm$$step: [{"name":"priorSrc","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$purifyBoxConsts$pats: [{"name":"d","d":{"t":"obj","p":[["name",{"t":"any"},false],["val",{"t":"any"},false],["at",{"t":"any"},false],["len",{"t":"any"},false],["txt",{"t":"any"},false]]},"opt":false}],
  inner$fnSpans$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$fnSpans$stq$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$eligible$consts$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$d$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$j$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$str$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$purifyStrings$keys$$after_loop: [{"name":"cand","d":{"t":"any"},"opt":false},{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$nestHelpers$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"declRe","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"declRe","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$stq$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"declRe","d":{"t":"any"},"opt":false}],
  inner$nestHelpers$out$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"helpers","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBox$keys$$after_loop: [{"name":"priorKeys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyBoxConsts$decls$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
};
