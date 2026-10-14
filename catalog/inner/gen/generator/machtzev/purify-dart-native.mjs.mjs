// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purify-dart-native.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const balance = (s, i, open, close) => {
    let d = 1, q = null;
    for (let j = i; j < s.length; j++) {
        const ch = s[j];
        if (q) {
            if (ch === '\n' && q !== '`')
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if (ch === open)
            d++;
        else if (ch === close) {
            d--;
            if (!d)
                return j;
        }
    }
    return -1;
};
const pub = (n) => n.replace(/^_+/, '');
export function inner$fn$i(process) {
    const i = process.argv.indexOf('--only');
    return i;
}
export function inner$hebOutsideRegexp$c(code) {
    const c = code.replace(/RegExp\(\s*r?('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g, "RegExp('");
    return c;
}
export function inner$repair$lineStart(m) {
    const lineStart = m.index === 0 ? 0 : m.index + 1;
    return lineStart;
}
export function inner$repair$vStart(m) {
    const vStart = m.index + m[0].length;
    return vStart;
}
export function inner$repair$init(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const init = src.slice(vStart, j);
    return init;
}
export function inner$repair$init$$step(src, vStart, j) {
    const init = src.slice(vStart, j);
    return init;
}
export function inner$repair$whole(src, m) {
    const lineStart = m.index === 0 ? 0 : m.index + 1;
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const whole = src.slice(lineStart, j + 1);
    return whole;
}
export function inner$repair$whole$$step(src, lineStart, j) {
    const whole = src.slice(lineStart, j + 1);
    return whole;
}
export function inner$repair$tm(head) {
    const tm = head.match(/^(?:const|final)\s+([\w<>,()?\[\] ]+?)\s+[\w$]+\s*=\s*$/);
    return tm;
}
export function inner$repair$type(head) {
    const tm = head.match(/^(?:const|final)\s+([\w<>,()?\[\] ]+?)\s+[\w$]+\s*=\s*$/);
    let type = tm ? tm[1].trim() : null;
    return type;
}
export function inner$repair$type$$step(tm) {
    let type = tm ? tm[1].trim() : null;
    return type;
}
export function inner$repair$it(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const init = src.slice(vStart, j);
    const it = init.trim().replace(/^const\s+/, '');
    return it;
}
export function inner$repair$it$$step(init) {
    const it = init.trim().replace(/^const\s+/, '');
    return it;
}
export function inner$repair$gm(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const init = src.slice(vStart, j);
    const it = init.trim().replace(/^const\s+/, '');
    const gm = it.match(/^<([^>]+)>\s*([\[{])/);
    return gm;
}
export function inner$repair$gm$$step(it) {
    const gm = it.match(/^<([^>]+)>\s*([\[{])/);
    return gm;
}
export function inner$repair$args(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const init = src.slice(vStart, j);
    const it = init.trim().replace(/^const\s+/, '');
    const gm = it.match(/^<([^>]+)>\s*([\[{])/);
    const args = gm[1].split(',').map(x => x.trim());
    return args;
}
export function inner$repair$args$$step(gm) {
    const args = gm[1].split(',').map(x => x.trim());
    return args;
}
export function inner$repair$localClasses(src) {
    const localClasses = [...src.matchAll(/(?:^|\n)(?:abstract\s+)?(?:class|enum)\s+(\w+)/g)].map(x => x[1]);
    return localClasses;
}
export function inner$repair$classTyped(src, decls) {
    const localClasses = [...src.matchAll(/(?:^|\n)(?:abstract\s+)?(?:class|enum)\s+(\w+)/g)].map(x => x[1]);
    const classTyped = decls.filter(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    return classTyped;
}
export function inner$repair$classTyped$$step(decls, localClasses) {
    const classTyped = decls.filter(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    return classTyped;
}
export function inner$repair$needAtomImport(src, decls) {
    const localClasses = [...src.matchAll(/(?:^|\n)(?:abstract\s+)?(?:class|enum)\s+(\w+)/g)].map(x => x[1]);
    const classTyped = decls.filter(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    const needAtomImport = classTyped.length > 0;
    return needAtomImport;
}
export function inner$repair$needAtomImport$$step(classTyped) {
    const needAtomImport = classTyped.length > 0;
    return needAtomImport;
}
export function inner$repair$moved(decls) {
    const moved = new Set(decls.map(d => d.name));
    return moved;
}
export function inner$repair$lineStart_L124(m4) {
    const lineStart = m4.index === 0 ? 0 : m4.index + 1;
    return lineStart;
}
export function inner$repair$referencedByMoved(decls, nm) {
    const referencedByMoved = decls.some(d => new RegExp(`(?<![\\w$])${nm}(?![\\w$])`).test(d.init));
    return referencedByMoved;
}
export function inner$repair$vProbe(src, m4) {
    const vProbe = src.slice(m4.index + m4[0].length, m4.index + m4[0].length + 400);
    return vProbe;
}
export function inner$repair$referencesMoved(src, decls, m4) {
    const vProbe = src.slice(m4.index + m4[0].length, m4.index + m4[0].length + 400);
    const referencesMoved = decls.some(d => new RegExp(`(?<![\\w$])${d.name}(?![\\w$])`).test(vProbe));
    return referencesMoved;
}
export function inner$repair$referencesMoved$$step(decls, vProbe) {
    const referencesMoved = decls.some(d => new RegExp(`(?<![\\w$])${d.name}(?![\\w$])`).test(vProbe));
    return referencesMoved;
}
export function inner$repair$vStart_L131(m4) {
    const vStart = m4.index + m4[0].length;
    return vStart;
}
export function inner$repair$initX(src, m4) {
    const vStart = m4.index + m4[0].length;
    let j2 = vStart;
    let d2 = 0;
    let q2 = null;
    for (; j2 < src.length; j2++) {
        const ch = src[j2];
        if (q2) {
            if (ch === '\n')
                q2 = null;
            else if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q2 = ch;
            continue;
        }
        if (ch === '(' || ch === '[' || ch === '{')
            d2++;
        if (ch === ')' || ch === ']' || ch === '}')
            d2--;
        if (ch === ';' && d2 <= 0)
            break;
    }
    const initX = src.slice(vStart, j2).trim();
    return initX;
}
export function inner$repair$initX$$step(src, vStart, j2) {
    const initX = src.slice(vStart, j2).trim();
    return initX;
}
export function inner$repair$tmX(headX) {
    const tmX = headX.match(/^(?:const|final)\s+([\w<>,()?\[\] ]+?)\s+[\w$]+\s*=\s*$/);
    return tmX;
}
export function inner$repair$needAtomImport2(src, decls) {
    const localClasses = [...src.matchAll(/(?:^|\n)(?:abstract\s+)?(?:class|enum)\s+(\w+)/g)].map(x => x[1]);
    const classTyped = decls.filter(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    const needAtomImport = classTyped.length > 0;
    const needAtomImport2 = needAtomImport || decls.some(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    return needAtomImport2;
}
export function inner$repair$needAtomImport2$$step(decls, localClasses, needAtomImport) {
    const needAtomImport2 = needAtomImport || decls.some(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    return needAtomImport2;
}
export function inner$repair$nameMap(decls) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    return nameMap;
}
export function inner$repair$atomImport(base, src, decls) {
    const localClasses = [...src.matchAll(/(?:^|\n)(?:abstract\s+)?(?:class|enum)\s+(\w+)/g)].map(x => x[1]);
    const classTyped = decls.filter(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    const needAtomImport = classTyped.length > 0;
    const needAtomImport2 = needAtomImport || decls.some(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    const atomImport = (typeof needAtomImport2 !== 'undefined' && needAtomImport2) ? `import '../dart/${base}.dart';\n` : '';
    return atomImport;
}
export function inner$repair$atomImport$$step(base, needAtomImport2) {
    const atomImport = (typeof needAtomImport2 !== 'undefined' && needAtomImport2) ? `import '../dart/${base}.dart';\n` : '';
    return atomImport;
}
export function inner$repair$dataSrc(base, src, decls) {
    const localClasses = [...src.matchAll(/(?:^|\n)(?:abstract\s+)?(?:class|enum)\s+(\w+)/g)].map(x => x[1]);
    const classTyped = decls.filter(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    const needAtomImport = classTyped.length > 0;
    const needAtomImport2 = needAtomImport || decls.some(d => localClasses.some(c => new RegExp(`(?<![\\w$])${c}(?![\\w$])`).test(d.type + ' ' + d.init)));
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const atomImport = (typeof needAtomImport2 !== 'undefined' && needAtomImport2) ? `import '../dart/${base}.dart';\n` : '';
    const dataSrc = atomImport + `// 🗄️ דאטה · מילוני-${base} — הורמו מהאטום ע"י purify-dart-native (הכרעת-בעלים "עד\n// מאה אחוז": אפס-דאטה במנגנון). מוזרקים לאטום כשקעים-שמיים; שינוי-מילון = עריכה כאן.\n// מקור-ערכים: new/dart/${base}.dart (verbatim).\n` +
        decls.map(d => {
            let init = d.init;
            for (const [from, to] of nameMap)
                if (from !== to)
                    init = init.replace(new RegExp(`(?<![\\w$])${from}(?![\\w$])`, 'g'), to);
            const kw = d.whole.trimStart().startsWith('final') ? 'final' : 'const';
            return `${kw} ${d.type === 'dynamic' ? '' : d.type + ' '}${pub(d.name)} = ${init};`;
        }).join('\n') + '\n';
    return dataSrc;
}
export function inner$repair$dataSrc$$step(base, decls, nameMap, atomImport) {
    const dataSrc = atomImport + `// 🗄️ דאטה · מילוני-${base} — הורמו מהאטום ע"י purify-dart-native (הכרעת-בעלים "עד\n// מאה אחוז": אפס-דאטה במנגנון). מוזרקים לאטום כשקעים-שמיים; שינוי-מילון = עריכה כאן.\n// מקור-ערכים: new/dart/${base}.dart (verbatim).\n` +
        decls.map(d => {
            let init = d.init;
            for (const [from, to] of nameMap)
                if (from !== to)
                    init = init.replace(new RegExp(`(?<![\\w$])${from}(?![\\w$])`, 'g'), to);
            const kw = d.whole.trimStart().startsWith('final') ? 'final' : 'const';
            return `${kw} ${d.type === 'dynamic' ? '' : d.type + ' '}${pub(d.name)} = ${init};`;
        }).join('\n') + '\n';
    return dataSrc;
}
export function inner$repair$map$kw(d) {
    const kw = d.whole.trimStart().startsWith('final') ? 'final' : 'const';
    return kw;
}
export function inner$repair$names(decls) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    return names;
}
export function inner$repair$names$$step(nameMap) {
    const names = [...nameMap.values()];
    return names;
}
export function inner$repair$open(m) {
    const open = m.index + m[0].length - 1;
    return open;
}
export function inner$repair$close(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$repair$close$$step(src, open) {
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$repair$bm(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bm = src.slice(close + 1).match(/\{|=>/);
    return bm;
}
export function inner$repair$bm$$step(src, close) {
    const bm = src.slice(close + 1).match(/\{|=>/);
    return bm;
}
export function inner$repair$bs(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bm = src.slice(close + 1).match(/\{|=>/);
    const bs = close + 1 + bm.index;
    return bs;
}
export function inner$repair$bs$$step(close, bm) {
    const bs = close + 1 + bm.index;
    return bs;
}
export function inner$repair$be(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bm = src.slice(close + 1).match(/\{|=>/);
    const bs = close + 1 + bm.index;
    const be = src[bs] === '{' ? balance(src, bs + 1, '{', '}') : src.indexOf(';', bs);
    return be;
}
export function inner$repair$be$$step(src, bs) {
    const be = src[bs] === '{' ? balance(src, bs + 1, '{', '}') : src.indexOf(';', bs);
    return be;
}
export function inner$repair$body(src, f) {
    const body = src.slice(f.bs, f.be + 1);
    return body;
}
export function inner$repair$set(src, decls, f) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    const body = src.slice(f.bs, f.be + 1);
    const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
    return set;
}
export function inner$repair$set$$step(names, body) {
    const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
    return set;
}
export function inner$repair$body_L205(src, f) {
    const body = src.slice(f.bs, f.be + 1);
    return body;
}
export function inner$repair$typeOf(decls) {
    const typeOf = new Map(decls.map(d => [pub(d.name), d.type]));
    return typeOf;
}
export function inner$repair$need(src, decls, fns, f) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    const uses = new Map();
    for (const f of fns) {
        const body = src.slice(f.bs, f.be + 1);
        const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
        uses.set(f.name, set);
    }
    const need = [...uses.get(f.name)];
    return need;
}
export function inner$repair$need$$step(uses, f) {
    const need = [...uses.get(f.name)];
    return need;
}
export function inner$repair$sigTxt(src, f) {
    const sigTxt = src.slice(f.open, f.close + 1);
    return sigTxt;
}
export function inner$repair$ins(src, decls, fns, f) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    const uses = new Map();
    for (const f of fns) {
        const body = src.slice(f.bs, f.be + 1);
        const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
        uses.set(f.name, set);
    }
    const typeOf = new Map(decls.map(d => [pub(d.name), d.type]));
    const need = [...uses.get(f.name)];
    const ins = need.map(n => `required ${typeOf.get(n) === 'dynamic' ? 'dynamic' : typeOf.get(n)} ${n}`).join(', ');
    return ins;
}
export function inner$repair$ins$$step(typeOf, need) {
    const ins = need.map(n => `required ${typeOf.get(n) === 'dynamic' ? 'dynamic' : typeOf.get(n)} ${n}`).join(', ');
    return ins;
}
export function inner$repair$braceClose(src, f) {
    const sigTxt = src.slice(f.open, f.close + 1);
    const braceClose = sigTxt.lastIndexOf('}');
    return braceClose;
}
export function inner$repair$braceClose$$step(sigTxt) {
    const braceClose = sigTxt.lastIndexOf('}');
    return braceClose;
}
export function inner$repair$abs(src, f) {
    const sigTxt = src.slice(f.open, f.close + 1);
    const braceClose = sigTxt.lastIndexOf('}');
    const abs = f.open + braceClose;
    return abs;
}
export function inner$repair$abs$$step(f, braceClose) {
    const abs = f.open + braceClose;
    return abs;
}
export function inner$repair$innerTrim(src, f) {
    const sigTxt = src.slice(f.open, f.close + 1);
    const innerTrim = sigTxt.slice(1, -1).replace(/[,\s]+$/, '');
    return innerTrim;
}
export function inner$repair$innerTrim$$step(sigTxt) {
    const innerTrim = sigTxt.slice(1, -1).replace(/[,\s]+$/, '');
    return innerTrim;
}
export function inner$repair$pre(src, f) {
    const sigTxt = src.slice(f.open, f.close + 1);
    const innerTrim = sigTxt.slice(1, -1).replace(/[,\s]+$/, '');
    const pre = src.slice(0, f.open + 1) + innerTrim;
    return pre;
}
export function inner$repair$pre$$step(src, f, innerTrim) {
    const pre = src.slice(0, f.open + 1) + innerTrim;
    return pre;
}
export function inner$repair$spliceNamed$re2(callee) {
    const re2 = new RegExp(`(?<![\\w.$])${callee}\\(`, 'g');
    return re2;
}
export function inner$repair$spliceNamed$open(mm) {
    const open = mm.index + mm[0].length - 1;
    return open;
}
export function inner$repair$spliceNamed$close(txt, mm) {
    const open = mm.index + mm[0].length - 1;
    const close = balance(txt, open + 1, '(', ')');
    return close;
}
export function inner$repair$spliceNamed$close$$step(txt, open) {
    const close = balance(txt, open + 1, '(', ')');
    return close;
}
export function inner$repair$spliceNamed$inner(txt, mm) {
    const open = mm.index + mm[0].length - 1;
    const close = balance(txt, open + 1, '(', ')');
    const inner = txt.slice(open + 1, close);
    return inner;
}
export function inner$repair$spliceNamed$inner$$step(txt, open, close) {
    const inner = txt.slice(open + 1, close);
    return inner;
}
export function inner$repair$spliceNamed$add(need) {
    const add = need.map(n => `${n}: ${n}`).join(', ');
    return add;
}
export function inner$repair$spliceNamed$sep(txt, mm) {
    const open = mm.index + mm[0].length - 1;
    const close = balance(txt, open + 1, '(', ')');
    const inner = txt.slice(open + 1, close);
    const sep = !inner.trim() ? '' : /,\s*$/.test(inner) ? ' ' : ', ';
    return sep;
}
export function inner$repair$spliceNamed$sep$$step(inner) {
    const sep = !inner.trim() ? '' : /,\s*$/.test(inner) ? ' ' : ', ';
    return sep;
}
export function inner$repair$need_L251(src, decls, fns, f) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    const uses = new Map();
    for (const f of fns) {
        const body = src.slice(f.bs, f.be + 1);
        const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
        uses.set(f.name, set);
    }
    const need = [...uses.get(f.name)];
    return need;
}
export function inner$repair$need_L251$$step(uses, f) {
    const need = [...uses.get(f.name)];
    return need;
}
export function inner$repair$dm(src, f) {
    const dm = src.match(new RegExp(`(?:^|\\n)[\\w<>,()?\\[\\] ]+?\\s${f.name}\\s*(?:<[\\w, ]+>)?\\s*\\(`));
    return dm;
}
export function inner$repair$defOpen(src, f) {
    const dm = src.match(new RegExp(`(?:^|\\n)[\\w<>,()?\\[\\] ]+?\\s${f.name}\\s*(?:<[\\w, ]+>)?\\s*\\(`));
    const defOpen = dm ? dm.index + dm[0].length - 1 : -1;
    return defOpen;
}
export function inner$repair$defOpen$$step(dm) {
    const defOpen = dm ? dm.index + dm[0].length - 1 : -1;
    return defOpen;
}
export function inner$repair$defClose(src, f) {
    const dm = src.match(new RegExp(`(?:^|\\n)[\\w<>,()?\\[\\] ]+?\\s${f.name}\\s*(?:<[\\w, ]+>)?\\s*\\(`));
    const defOpen = dm ? dm.index + dm[0].length - 1 : -1;
    const defClose = defOpen >= 0 ? balance(src, defOpen + 1, '(', ')') : -1;
    return defClose;
}
export function inner$repair$defClose$$step(src, defOpen) {
    const defClose = defOpen >= 0 ? balance(src, defOpen + 1, '(', ')') : -1;
    return defClose;
}
export function inner$repair$alias(base) {
    const alias = 'td_' + base;
    return alias;
}
export function inner$repair$lines(test) {
    const lines = test.split('\n');
    return lines;
}
export function inner$repair$ii(lines) {
    const ii = lines.findIndex(l => l.startsWith('import '));
    return ii;
}
export function inner$repair$need_L270(src, decls, fns, f) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    const uses = new Map();
    for (const f of fns) {
        const body = src.slice(f.bs, f.be + 1);
        const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
        uses.set(f.name, set);
    }
    const need = [...uses.get(f.name)];
    return need;
}
export function inner$repair$need_L270$$step(uses, f) {
    const need = [...uses.get(f.name)];
    return need;
}
export function inner$repair$re3(f) {
    const re3 = new RegExp(`(?<![\\w.$])${f.name}\\(`, 'g');
    return re3;
}
export function inner$repair$open_L275(mm) {
    const open = mm.index + mm[0].length - 1;
    return open;
}
export function inner$repair$close_L276(test, mm) {
    const open = mm.index + mm[0].length - 1;
    const close = balance(test, open + 1, '(', ')');
    return close;
}
export function inner$repair$close_L276$$step(test, open) {
    const close = balance(test, open + 1, '(', ')');
    return close;
}
export function inner$repair$inner(test, mm) {
    const open = mm.index + mm[0].length - 1;
    const close = balance(test, open + 1, '(', ')');
    const inner = test.slice(open + 1, close);
    return inner;
}
export function inner$repair$inner$$step(test, open, close) {
    const inner = test.slice(open + 1, close);
    return inner;
}
export function inner$repair$add(base, src, decls, fns, f) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    const uses = new Map();
    for (const f of fns) {
        const body = src.slice(f.bs, f.be + 1);
        const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
        uses.set(f.name, set);
    }
    const alias = 'td_' + base;
    const need = [...uses.get(f.name)];
    const add = need.map(n => `${n}: ${alias}.${n}`).join(', ');
    return add;
}
export function inner$repair$add$$step(alias, need) {
    const add = need.map(n => `${n}: ${alias}.${n}`).join(', ');
    return add;
}
export function inner$repair$sep(test, mm) {
    const open = mm.index + mm[0].length - 1;
    const close = balance(test, open + 1, '(', ')');
    const inner = test.slice(open + 1, close);
    const sep = !inner.trim() ? '' : /,\s*$/.test(inner) ? ' ' : ', ';
    return sep;
}
export function inner$repair$sep$$step(inner) {
    const sep = !inner.trim() ? '' : /,\s*$/.test(inner) ? ' ' : ', ';
    return sep;
}
export function inner$repair$pn(d) {
    const pn = pub(d.name);
    return pn;
}
export function inner$repair$j$$after_loop(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    return j;
}
export function inner$repair$d$$after_loop(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    return d;
}
export function inner$repair$q$$after_loop(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    return q;
}
export function inner$repair$d3$$after_loop(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const init = src.slice(vStart, j);
    const it = init.trim().replace(/^const\s+/, '');
    let d3 = 0;
    let q3 = null;
    let isMap = false;
    for (let k3 = 1; k3 < it.length; k3++) {
        const c3 = it[k3];
        if (q3) {
            if (c3 === '\\')
                k3++;
            else if (c3 === q3)
                q3 = null;
            continue;
        }
        if (c3 === "'" || c3 === '"') {
            q3 = c3;
            continue;
        }
        if ('([{'.includes(c3))
            d3++;
        if (')]}'.includes(c3)) {
            if (c3 === '}' && d3 === 0)
                break;
            d3--;
        }
        if (c3 === ':' && d3 === 0) {
            isMap = true;
            break;
        }
    }
    return d3;
}
export function inner$repair$q3$$after_loop(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const init = src.slice(vStart, j);
    const it = init.trim().replace(/^const\s+/, '');
    let d3 = 0;
    let q3 = null;
    let isMap = false;
    for (let k3 = 1; k3 < it.length; k3++) {
        const c3 = it[k3];
        if (q3) {
            if (c3 === '\\')
                k3++;
            else if (c3 === q3)
                q3 = null;
            continue;
        }
        if (c3 === "'" || c3 === '"') {
            q3 = c3;
            continue;
        }
        if ('([{'.includes(c3))
            d3++;
        if (')]}'.includes(c3)) {
            if (c3 === '}' && d3 === 0)
                break;
            d3--;
        }
        if (c3 === ':' && d3 === 0) {
            isMap = true;
            break;
        }
    }
    return q3;
}
export function inner$repair$isMap$$after_loop(src, m) {
    const vStart = m.index + m[0].length;
    let j = vStart;
    let d = 0;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\n' && q !== "'''")
                q = null;
            else if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{<'.includes(ch) && ch !== '<')
            d++;
        if ('([{'.includes(ch)) { } // spacer
        if (ch === '(' || ch === '[' || ch === '{') { } // counted above once
        if (ch === ')' || ch === ']' || ch === '}')
            d--;
        if (ch === ';' && d <= 0)
            break;
    }
    const init = src.slice(vStart, j);
    const it = init.trim().replace(/^const\s+/, '');
    let d3 = 0;
    let q3 = null;
    let isMap = false;
    for (let k3 = 1; k3 < it.length; k3++) {
        const c3 = it[k3];
        if (q3) {
            if (c3 === '\\')
                k3++;
            else if (c3 === q3)
                q3 = null;
            continue;
        }
        if (c3 === "'" || c3 === '"') {
            q3 = c3;
            continue;
        }
        if ('([{'.includes(c3))
            d3++;
        if (')]}'.includes(c3)) {
            if (c3 === '}' && d3 === 0)
                break;
            d3--;
        }
        if (c3 === ':' && d3 === 0) {
            isMap = true;
            break;
        }
    }
    return isMap;
}
export function inner$repair$j2$$after_loop(src, m4) {
    const vStart = m4.index + m4[0].length;
    let j2 = vStart;
    let d2 = 0;
    let q2 = null;
    for (; j2 < src.length; j2++) {
        const ch = src[j2];
        if (q2) {
            if (ch === '\n')
                q2 = null;
            else if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q2 = ch;
            continue;
        }
        if (ch === '(' || ch === '[' || ch === '{')
            d2++;
        if (ch === ')' || ch === ']' || ch === '}')
            d2--;
        if (ch === ';' && d2 <= 0)
            break;
    }
    return j2;
}
export function inner$repair$d2$$after_loop(src, m4) {
    const vStart = m4.index + m4[0].length;
    let j2 = vStart;
    let d2 = 0;
    let q2 = null;
    for (; j2 < src.length; j2++) {
        const ch = src[j2];
        if (q2) {
            if (ch === '\n')
                q2 = null;
            else if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q2 = ch;
            continue;
        }
        if (ch === '(' || ch === '[' || ch === '{')
            d2++;
        if (ch === ')' || ch === ']' || ch === '}')
            d2--;
        if (ch === ';' && d2 <= 0)
            break;
    }
    return d2;
}
export function inner$repair$q2$$after_loop(src, m4) {
    const vStart = m4.index + m4[0].length;
    let j2 = vStart;
    let d2 = 0;
    let q2 = null;
    for (; j2 < src.length; j2++) {
        const ch = src[j2];
        if (q2) {
            if (ch === '\n')
                q2 = null;
            else if (ch === '\\')
                j2++;
            else if (ch === q2)
                q2 = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q2 = ch;
            continue;
        }
        if (ch === '(' || ch === '[' || ch === '{')
            d2++;
        if (ch === ')' || ch === ']' || ch === '}')
            d2--;
        if (ch === ';' && d2 <= 0)
            break;
    }
    return q2;
}
export function inner$repair$map$init$$after_loop(nameMap, d) {
    let init = d.init;
    for (const [from, to] of nameMap)
        if (from !== to)
            init = init.replace(new RegExp(`(?<![\\w$])${from}(?![\\w$])`, 'g'), to);
    return init;
}
export function inner$repair$uses$$after_loop(src, decls, fns) {
    const nameMap = new Map(decls.map(d => [d.name, pub(d.name)]));
    const names = [...nameMap.values()];
    const uses = new Map();
    for (const f of fns) {
        const body = src.slice(f.bs, f.be + 1);
        const set = new Set(names.filter(n => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(body)));
        uses.set(f.name, set);
    }
    return uses;
}

export const SIGS = {
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$hebOutsideRegexp$c: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$repair$lineStart: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$vStart: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$init: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$init$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"vStart","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$repair$whole: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$whole$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"lineStart","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$repair$tm: [{"name":"head","d":{"t":"str"},"opt":false}],
  inner$repair$type: [{"name":"head","d":{"t":"str"},"opt":false}],
  inner$repair$type$$step: [{"name":"tm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$repair$it: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$it$$step: [{"name":"init","d":{"t":"any"},"opt":false}],
  inner$repair$gm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$gm$$step: [{"name":"it","d":{"t":"any"},"opt":false}],
  inner$repair$args: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$args$$step: [{"name":"gm","d":{"t":"any"},"opt":false}],
  inner$repair$localClasses: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$repair$classTyped: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$classTyped$$step: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"localClasses","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$needAtomImport: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$needAtomImport$$step: [{"name":"classTyped","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["init",{"t":"any"},false],["whole",{"t":"any"},false],["start",{"t":"num"},false],["end",{"t":"num"},false]]}},"opt":false}],
  inner$repair$moved: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$lineStart_L124: [{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$referencedByMoved: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$repair$vProbe: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$referencesMoved: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$referencesMoved$$step: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"vProbe","d":{"t":"any"},"opt":false}],
  inner$repair$vStart_L131: [{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$initX: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$initX$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"vStart","d":{"t":"num"},"opt":false},{"name":"j2","d":{"t":"num"},"opt":false}],
  inner$repair$tmX: [{"name":"headX","d":{"t":"str"},"opt":false}],
  inner$repair$needAtomImport2: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$needAtomImport2$$step: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"localClasses","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"needAtomImport","d":{"t":"bool"},"opt":false}],
  inner$repair$nameMap: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$atomImport: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$atomImport$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"needAtomImport2","d":{"t":"bool"},"opt":false}],
  inner$repair$dataSrc: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$dataSrc$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"nameMap","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false},{"name":"atomImport","d":{"t":"str"},"opt":false}],
  inner$repair$map$kw: [{"name":"d","d":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["init",{"t":"any"},false],["whole",{"t":"any"},false],["start",{"t":"num"},false],["end",{"t":"num"},false]]},"opt":false}],
  inner$repair$names: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$names$$step: [{"name":"nameMap","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false}],
  inner$repair$open: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$close: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$close$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$repair$bm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$bm$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$repair$bs: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$bs$$step: [{"name":"close","d":{"t":"num"},"opt":false},{"name":"bm","d":{"t":"any"},"opt":false}],
  inner$repair$be: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$be$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"bs","d":{"t":"num"},"opt":false}],
  inner$repair$body: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$set: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$set$$step: [{"name":"names","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$repair$body_L205: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$typeOf: [{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$need: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$need$$step: [{"name":"uses","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$sigTxt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$ins: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$ins$$step: [{"name":"typeOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"str"}},"opt":false},{"name":"need","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$braceClose: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$braceClose$$step: [{"name":"sigTxt","d":{"t":"any"},"opt":false}],
  inner$repair$abs: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$abs$$step: [{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false},{"name":"braceClose","d":{"t":"any"},"opt":false}],
  inner$repair$innerTrim: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$innerTrim$$step: [{"name":"sigTxt","d":{"t":"any"},"opt":false}],
  inner$repair$pre: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$pre$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false},{"name":"innerTrim","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$re2: [{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$open: [{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$close: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$close$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$repair$spliceNamed$inner: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$inner$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false},{"name":"close","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$add: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$sep: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$spliceNamed$sep$$step: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$repair$need_L251: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$need_L251$$step: [{"name":"uses","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$dm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$defOpen: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$defOpen$$step: [{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$repair$defClose: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$defClose$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"defOpen","d":{"t":"num"},"opt":false}],
  inner$repair$alias: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$repair$lines: [{"name":"test","d":{"t":"any"},"opt":false}],
  inner$repair$ii: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$repair$need_L270: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$need_L270$$step: [{"name":"uses","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$re3: [{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$open_L275: [{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$close_L276: [{"name":"test","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$close_L276$$step: [{"name":"test","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$repair$inner: [{"name":"test","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$inner$$step: [{"name":"test","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false},{"name":"close","d":{"t":"any"},"opt":false}],
  inner$repair$add: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"str"},false],["open",{"t":"num"},false],["close",{"t":"any"},false],["bs",{"t":"any"},false],["be",{"t":"any"},false]]},"opt":false}],
  inner$repair$add$$step: [{"name":"alias","d":{"t":"str"},"opt":false},{"name":"need","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$repair$sep: [{"name":"test","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$repair$sep$$step: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$repair$pn: [{"name":"d","d":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["init",{"t":"any"},false],["whole",{"t":"any"},false],["start",{"t":"num"},false],["end",{"t":"num"},false]]},"opt":false}],
  inner$repair$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$d3$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$q3$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$isMap$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$repair$j2$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$d2$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$q2$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m4","d":{"t":"any"},"opt":false}],
  inner$repair$map$init$$after_loop: [{"name":"nameMap","d":{"t":"map","k":{"t":"str"},"v":{"t":"any"}},"opt":false},{"name":"d","d":{"t":"obj","p":[["name",{"t":"str"},false],["type",{"t":"str"},false],["init",{"t":"any"},false],["whole",{"t":"any"},false],["start",{"t":"num"},false],["end",{"t":"num"},false]]},"opt":false}],
  inner$repair$uses$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"decls","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fns","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
