// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purify-dart.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HEB = /[֐-׿]/;
function dartStrings(src) {
    const out = [];
    let i = 0, inLine = false, inBlock = false;
    while (i < src.length) {
        const ch = src[i];
        if (inLine) {
            if (ch === '\n')
                inLine = false;
            i++;
            continue;
        }
        if (inBlock) {
            if (ch === '*' && src[i + 1] === '/') {
                inBlock = false;
                i += 2;
                continue;
            }
            i++;
            continue;
        }
        if (ch === '/' && src[i + 1] === '/') {
            inLine = true;
            i += 2;
            continue;
        }
        if (ch === '/' && src[i + 1] === '*') {
            inBlock = true;
            i += 2;
            continue;
        }
        if (ch === "'" || ch === '"') {
            const raw = src[i - 1] === 'r';
            const q = ch;
            const start = raw ? i - 1 : i;
            let j = i + 1;
            const segs = [];
            let cur = '';
            for (; j < src.length; j++) {
                const c = src[j];
                if (c === '\n')
                    break; // מחרוזת-Dart חד-שורתית
                if (!raw && c === '\\') {
                    cur += c + (src[j + 1] ?? '');
                    j++;
                    continue;
                }
                if (c === q)
                    break;
                if (!raw && c === '$') {
                    if (src[j + 1] === '{') {
                        let d = 1, k = j + 2;
                        for (; k < src.length && d; k++) {
                            if (src[k] === '{')
                                d++;
                            else if (src[k] === '}')
                                d--;
                        }
                        if (cur) {
                            segs.push({ type: 'txt', s: cur });
                            cur = '';
                        }
                        segs.push({ type: 'interp', s: src.slice(j, k) });
                        j = k - 1;
                        continue;
                    }
                    const idm = src.slice(j + 1).match(/^[A-Za-z_]\w*/);
                    if (idm) {
                        if (cur) {
                            segs.push({ type: 'txt', s: cur });
                            cur = '';
                        }
                        segs.push({ type: 'interp', s: '$' + idm[0] });
                        j += idm[0].length;
                        continue;
                    }
                }
                cur += c;
            }
            if (cur)
                segs.push({ type: 'txt', s: cur });
            out.push({ start, end: j + 1, quote: q, raw, segs, full: src.slice(start, j + 1) });
            i = j + 1;
            continue;
        }
        i++;
    }
    return out;
}
const unesc = (s) => s.replace(/\\(.)/g, (_, c) => c === 'n' ? '\n' : c === 't' ? '\t' : c === 'r' ? '\r' : c);
const dEsc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$').replace(/\n/g, '\\n');
function parseDartLit(txt) {
    let t = txt.trim().replace(/^const\s+/, '').replace(/^<[^>]*>\s*/, '');
    t = t.replace(/,\s*([\]}])/g, '$1'); // פסיק-זנב
    // המרת-גרשיים: '...' ⇒ "..." עם טיפול-בריחות
    let out = '', q = null;
    for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (q === "'") {
            if (c === '\\') {
                const n = t[i + 1];
                out += n === "'" ? "'" : '\\' + n;
                i++;
                continue;
            }
            if (c === '"') {
                out += '\\"';
                continue;
            }
            if (c === "'") {
                q = null;
                out += '"';
                continue;
            }
            out += c;
            continue;
        }
        if (c === "'") {
            q = "'";
            out += '"';
            continue;
        }
        out += c;
    }
    try {
        return JSON.parse(out);
    }
    catch {
        return null;
    }
}
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function valueIndex(sockets) {
    const idx = new Map();
    for (const { name, value } of sockets) {
        if (typeof value === 'string')
            idx.set(value, name);
        else if (Array.isArray(value)) {
            // רשימה מעורבת ⇒ List<dynamic> ⇒ cast-מפורש (strict-casts ב-CI אוסר dynamic⇒String שקט)
            const allStr = value.every(x => typeof x === 'string');
            value.forEach((v, i) => { if (typeof v === 'string' && !idx.has(v))
                idx.set(v, allStr ? `${name}[${i}]` : `(${name}[${i}] as String)`); });
        }
        else if (value && typeof value === 'object') {
            const allStr = Object.values(value).every(x => typeof x === 'string');
            for (const [k, v] of Object.entries(value))
                if (typeof v === 'string' && !idx.has(v))
                    idx.set(v, allStr ? `${name}['${k}']!` : `(${name}['${k}'] as String)`);
        }
    }
    return idx;
}
const dartType = (v) => {
    if (typeof v === 'string')
        return 'String';
    if (typeof v === 'number')
        return 'num';
    if (typeof v === 'boolean')
        return 'bool';
    if (Array.isArray(v)) {
        if (!v.length)
            return 'List<dynamic>';
        const ts = new Set(v.map(dartType)); // רקורסיבי: רשימת-זוגות ⇒ List<List<String>>
        return ts.size === 1 ? `List<${[...ts][0]}>` : 'List<dynamic>';
    }
    const vs = Object.values(v || {});
    if (!vs.length)
        return 'Map<String, dynamic>';
    const ts = new Set(vs.map(dartType));
    return ts.size === 1 ? `Map<String, ${[...ts][0]}>` : 'Map<String, dynamic>';
};
const dartVal = (v) => v === null ? 'null'
    : typeof v === 'string' ? "'" + dEsc(v) + "'"
        : typeof v === 'number' || typeof v === 'boolean' ? String(v)
            : Array.isArray(v) ? '[' + v.map(dartVal).join(', ') + ']'
                : '{' + Object.entries(v).map(([k, x]) => "'" + dEsc(k) + "': " + dartVal(x)).join(', ') + '}';
function balance(s, start, open, close) {
    let d = 1, q = null;
    for (let j = start; j < s.length; j++) {
        const ch = s[j];
        if (q) {
            if (ch === '\n') {
                q = null;
            }
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
}
function splitTopArgs(s) {
    const out = [];
    let d = 0, q = null, cur = '';
    for (let j = 0; j < s.length; j++) {
        const ch = s[j];
        if (q) {
            cur += ch;
            if (ch === '\\') {
                cur += s[j + 1] ?? '';
                j++;
            }
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            cur += ch;
            continue;
        }
        // '=>' איננו סוגר-גנרי: '>' נספר רק כשאינו חלק מחץ-למבדה (התו-הקודם '=')
        if ('([{'.includes(ch) || (ch === '<' && /[\w>]/.test(s[j - 1] ?? '')))
            d++;
        if (')]}'.includes(ch) || (ch === '>' && s[j - 1] !== '=' && d > 0 && /[\w>?]/.test(s[j - 1] ?? '')))
            d--;
        if (ch === ',' && d === 0) {
            out.push(cur.trim());
            cur = '';
            continue;
        }
        cur += ch;
    }
    if (cur.trim())
        out.push(cur.trim());
    return out;
}
export function inner$fn$i(process) {
    const i = process.argv.indexOf('--limit');
    return i;
}
export function inner$fn$i_L21(process) {
    const i = process.argv.indexOf('--only');
    return i;
}
export function inner$jsSockets$decls(js) {
    const decls = [
        ...js.matchAll(/export (?:async )?function (\w+)\s*\(([^)]*)\)/g),
        ...js.matchAll(/export const (\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g),
    ];
    return decls;
}
export function inner$jsSockets$wm(tt, fn) {
    const wm = tt.match(new RegExp(`__pure_${fn}\\(\\.\\.\\.a,\\s*\\.\\.\\.Array\\(Math\\.max\\([^)]*\\)\\)\\.fill\\(undefined\\),\\s*([^)]+)\\)`))
        || tt.match(new RegExp(`__pure_${fn}\\(\\s*(__d_[\\w$]+(?:\\s*,\\s*__d_[\\w$]+)*)\\s*\\)`));
    return wm;
}
export function inner$jsSockets$socketNames(tt, fn) {
    const wm = tt.match(new RegExp(`__pure_${fn}\\(\\.\\.\\.a,\\s*\\.\\.\\.Array\\(Math\\.max\\([^)]*\\)\\)\\.fill\\(undefined\\),\\s*([^)]+)\\)`))
        || tt.match(new RegExp(`__pure_${fn}\\(\\s*(__d_[\\w$]+(?:\\s*,\\s*__d_[\\w$]+)*)\\s*\\)`));
    const socketNames = wm[1].split(',').map(x => x.trim());
    return socketNames;
}
export function inner$jsSockets$socketNames$$step(wm) {
    const socketNames = wm[1].split(',').map(x => x.trim());
    return socketNames;
}
export function inner$jsSockets$cm(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    return cm;
}
export function inner$jsSockets$j(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    let j = cm.index + cm[0].length;
    return j;
}
export function inner$jsSockets$j$$step(cm) {
    let j = cm.index + cm[0].length;
    return j;
}
export function inner$jsSockets$names(sig, vals) {
    const names = sig.slice(sig.length - vals.length);
    return names;
}
export function inner$dartStrings$raw(src, i) {
    const raw = src[i - 1] === 'r';
    return raw;
}
export function inner$dartStrings$start(src, i) {
    const raw = src[i - 1] === 'r';
    const start = raw ? i - 1 : i;
    return start;
}
export function inner$dartStrings$start$$step(i, raw) {
    const start = raw ? i - 1 : i;
    return start;
}
export function inner$dartStrings$j(i) {
    let j = i + 1;
    return j;
}
export function inner$dartStrings$k(j) {
    let k = j + 2;
    return k;
}
export function inner$dartStrings$idm(src, j) {
    const idm = src.slice(j + 1).match(/^[A-Za-z_]\w*/);
    return idm;
}
export function inner$parseDartLit$t(txt) {
    let t = txt.trim().replace(/^const\s+/, '').replace(/^<[^>]*>\s*/, '');
    return t;
}
export function inner$parseDartLit$n(t, i) {
    const n = t[i + 1];
    return n;
}
export function inner$valueIndex$allStr(value) {
    const allStr = value.every(x => typeof x === 'string');
    return allStr;
}
export function inner$valueIndex$allStr_L164(value) {
    const allStr = Object.values(value).every(x => typeof x === 'string');
    return allStr;
}
export function inner$dartType$ts(v) {
    const ts = new Set(v.map(dartType));
    return ts;
}
export function inner$dartType$vs(v) {
    const vs = Object.values(v || {});
    return vs;
}
export function inner$dartType$ts_L181(v) {
    const vs = Object.values(v || {});
    const ts = new Set(vs.map(dartType));
    return ts;
}
export function inner$dartType$ts_L181$$step(vs) {
    const ts = new Set(vs.map(dartType));
    return ts;
}
export function inner$spliceCalls$re(callee) {
    const re = new RegExp(`(?<![\\w.])${callee}(?:<[\\w, ]+>)?\\(`, 'g');
    return re;
}
export function inner$spliceCalls$open(m) {
    const open = m.index + m[0].length - 1;
    return open;
}
export function inner$spliceCalls$close(txt, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(txt, open + 1, '(', ')');
    return close;
}
export function inner$spliceCalls$close$$step(txt, open) {
    const close = balance(txt, open + 1, '(', ')');
    return close;
}
export function inner$spliceCalls$parts(txt, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(txt, open + 1, '(', ')');
    const parts = splitTopArgs(txt.slice(open + 1, close));
    return parts;
}
export function inner$spliceCalls$parts$$step(txt, open, close) {
    const parts = splitTopArgs(txt.slice(open + 1, close));
    return parts;
}
export function inner$spliceCalls$pos(insertPos, parts) {
    const pos = insertPos === null || insertPos > parts.length ? parts.length : insertPos;
    return pos;
}
export function inner$purifyFile$st(cm) {
    const st = cm.index + cm[0].length;
    return st;
}
export function inner$purifyFile$litTxt(src, cm) {
    const st = cm.index + cm[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    const litTxt = src.slice(st, j);
    return litTxt;
}
export function inner$purifyFile$litTxt$$step(src, st, j) {
    const litTxt = src.slice(st, j);
    return litTxt;
}
export function inner$purifyFile$val(src, cm) {
    const st = cm.index + cm[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    const litTxt = src.slice(st, j);
    const val = parseDartLit(litTxt);
    return val;
}
export function inner$purifyFile$val$$step(litTxt) {
    const val = parseDartLit(litTxt);
    return val;
}
export function inner$purifyFile$hit(src, merged, cm) {
    const st = cm.index + cm[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    const litTxt = src.slice(st, j);
    const val = parseDartLit(litTxt);
    const hit = merged.find(s => deepEq(s.value, val));
    return hit;
}
export function inner$purifyFile$hit$$step(merged, val) {
    const hit = merged.find(s => deepEq(s.value, val));
    return hit;
}
export function inner$purifyFile$idx(merged) {
    const idx = valueIndex(merged);
    return idx;
}
export function inner$purifyFile$strs(src) {
    const strs = dartStrings(src).filter(s => HEB.test(s.full));
    return strs;
}
export function inner$purifyFile$whole(st) {
    const whole = st.segs.map(x => x.s).join('');
    return whole;
}
export function inner$purifyFile$plain(st) {
    const plain = st.segs.every(x => x.type === 'txt');
    return plain;
}
export function inner$purifyFile$whole_L289(st) {
    const whole = unesc(st.segs.map(x => x.s).join(''));
    return whole;
}
export function inner$purifyFile$map$val(x) {
    const val = unesc(x.s);
    return val;
}
export function inner$purifyFile$sockRe(merged) {
    const sockRe = new RegExp(`(?<![\\w'$])(${merged.map(s => s.name).join('|')})(?![\\w'$])`);
    return sockRe;
}
export function inner$purifyFile$isInsideFn$open(m) {
    const open = m.index + m[0].length - 1;
    return open;
}
export function inner$purifyFile$isInsideFn$close(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$purifyFile$isInsideFn$close$$step(src, open) {
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$purifyFile$isInsideFn$bm(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bm = src.slice(close + 1, close + 30).match(/\{/);
    return bm;
}
export function inner$purifyFile$isInsideFn$bm$$step(src, close) {
    const bm = src.slice(close + 1, close + 30).match(/\{/);
    return bm;
}
export function inner$purifyFile$isInsideFn$bs(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bs = close + 1 + src.slice(close + 1).indexOf('{');
    return bs;
}
export function inner$purifyFile$isInsideFn$bs$$step(src, close) {
    const bs = close + 1 + src.slice(close + 1).indexOf('{');
    return bs;
}
export function inner$purifyFile$isInsideFn$be(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bs = close + 1 + src.slice(close + 1).indexOf('{');
    const be = balance(src, bs + 1, '{', '}');
    return be;
}
export function inner$purifyFile$isInsideFn$be$$step(src, bs) {
    const be = balance(src, bs + 1, '{', '}');
    return be;
}
export function inner$purifyFile$declStart(cm) {
    const declStart = cm.index + (cm[0].startsWith('\n') ? 1 : 0);
    return declStart;
}
export function inner$purifyFile$j(cm) {
    let j = cm.index + cm[0].length;
    return j;
}
export function inner$purifyFile$declTxt(src, cm) {
    const declStart = cm.index + (cm[0].startsWith('\n') ? 1 : 0);
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    const declTxt = src.slice(declStart, j + 1);
    return declTxt;
}
export function inner$purifyFile$declTxt$$step(src, declStart, j) {
    const declTxt = src.slice(declStart, j + 1);
    return declTxt;
}
export function inner$purifyFile$finalDecl(src, cm) {
    const declStart = cm.index + (cm[0].startsWith('\n') ? 1 : 0);
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    const declTxt = src.slice(declStart, j + 1);
    const finalDecl = declTxt.trim().replace(/\bconst\b/, 'final');
    return finalDecl;
}
export function inner$purifyFile$finalDecl$$step(declTxt) {
    const finalDecl = declTxt.trim().replace(/\bconst\b/, 'final');
    return finalDecl;
}
export function inner$purifyFile$open(fm) {
    const open = fm.index + fm[0].length - 1;
    return open;
}
export function inner$purifyFile$close(src, fm) {
    const open = fm.index + fm[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$purifyFile$close$$step(src, open) {
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$purifyFile$bs(src, fm) {
    const open = fm.index + fm[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bs = close + 1 + src.slice(close + 1).indexOf('{');
    return bs;
}
export function inner$purifyFile$bs$$step(src, close) {
    const bs = close + 1 + src.slice(close + 1).indexOf('{');
    return bs;
}
export function inner$purifyFile$be(src, fm) {
    const open = fm.index + fm[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const bs = close + 1 + src.slice(close + 1).indexOf('{');
    const be = balance(src, bs + 1, '{', '}');
    return be;
}
export function inner$purifyFile$be$$step(src, bs) {
    const be = balance(src, bs + 1, '{', '}');
    return be;
}
export function inner$purifyFile$needed(src, merged) {
    const needed = merged.filter(s => new RegExp(`(?<![\\w'$])${s.name}(?![\\w'$])`).test(src));
    return needed;
}
export function inner$purifyFile$fnSigs(src) {
    const fnSigs = [...src.matchAll(/(?:^|\n)(?:[A-Za-z_][\w<>,?\[\] ]*\s+)?([a-z_]\w*)\s*(?:<[\w, ]+>)?\s*\(/g)]
        .map(m => ({ name: m[1], open: m.index + m[0].length - 1 }))
        .filter(f => !['if', 'for', 'while', 'switch', 'return', 'assert', 'catch'].includes(f.name));
    return fnSigs;
}
export function inner$purifyFile$close_L370(src, f) {
    const close = balance(src, f.open + 1, '(', ')');
    return close;
}
export function inner$purifyFile$after(src, f) {
    const close = balance(src, f.open + 1, '(', ')');
    const after = src.slice(close + 1, close + 30);
    return after;
}
export function inner$purifyFile$after$$step(src, close) {
    const after = src.slice(close + 1, close + 30);
    return after;
}
export function inner$purifyFile$bm(src, f) {
    const close = balance(src, f.open + 1, '(', ')');
    const bm = src.slice(close + 1).match(/[{]|=>/);
    return bm;
}
export function inner$purifyFile$bm$$step(src, close) {
    const bm = src.slice(close + 1).match(/[{]|=>/);
    return bm;
}
export function inner$purifyFile$bs_L377(src, f) {
    const close = balance(src, f.open + 1, '(', ')');
    const bm = src.slice(close + 1).match(/[{]|=>/);
    const bs = close + 1 + bm.index;
    return bs;
}
export function inner$purifyFile$bs_L377$$step(close, bm) {
    const bs = close + 1 + bm.index;
    return bs;
}
export function inner$purifyFile$sigTxt(src, f) {
    const close = balance(src, f.open + 1, '(', ')');
    const sigTxt = src.slice(f.open, close + 1);
    return sigTxt;
}
export function inner$purifyFile$sigTxt$$step(src, f, close) {
    const sigTxt = src.slice(f.open, close + 1);
    return sigTxt;
}
export function inner$purifyFile$usesSock$r(fnInfo, fn) {
    const r = fnInfo.get(fn);
    return r;
}
export function inner$purifyFile$usesSock$body(src, fnInfo, fn) {
    const r = fnInfo.get(fn);
    const body = src.slice(r.bs, r.be + 1);
    return body;
}
export function inner$purifyFile$usesSock$body$$step(src, r) {
    const body = src.slice(r.bs, r.be + 1);
    return body;
}
export function inner$purifyFile$body(src, r) {
    const body = src.slice(r.bs, r.be + 1);
    return body;
}
export function inner$purifyFile$sigInner(src, r) {
    const sigInner = src.slice(r.open + 1, r.close);
    return sigInner;
}
export function inner$purifyFile$head(src, r) {
    const sigInner = src.slice(r.open + 1, r.close);
    let depth = 0;
    let brk = -1;
    for (let k = 0; k < sigInner.length; k++) {
        const c = sigInner[k];
        if ('({<'.includes(c))
            depth++;
        else if (')}>'.includes(c))
            depth--;
        else if ((c === '[' || c === '{') && depth === 0) {
            brk = k;
            break;
        }
    }
    const head = sigInner.slice(0, brk).replace(/[,\s]+$/, '');
    return head;
}
export function inner$purifyFile$head$$step(sigInner, brk) {
    const head = sigInner.slice(0, brk).replace(/[,\s]+$/, '');
    return head;
}
export function inner$purifyFile$sigTxt_L424(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    return sigTxt;
}
export function inner$purifyFile$feedCall$args(feedStyle, callee, socks) {
    const args = socks.map(s => feedStyle.get(callee) === 'named' ? `${s.name}: ${s.name}` : s.name);
    return args;
}
export function inner$purifyFile$r(fnInfo, callee) {
    const r = fnInfo.get(callee);
    return r;
}
export function inner$purifyFile$defStart(fnInfo, callee) {
    const r = fnInfo.get(callee);
    const defStart = r.open - (callee.length);
    return defStart;
}
export function inner$purifyFile$defStart$$step(callee, r) {
    const defStart = r.open - (callee.length);
    return defStart;
}
export function inner$purifyFile$before(src, fnInfo, callee) {
    const r = fnInfo.get(callee);
    const defStart = r.open - (callee.length);
    const before = src.slice(0, defStart);
    return before;
}
export function inner$purifyFile$before$$step(src, defStart) {
    const before = src.slice(0, defStart);
    return before;
}
export function inner$purifyFile$defAndAfter(src, fnInfo, callee) {
    const r = fnInfo.get(callee);
    const defStart = r.open - (callee.length);
    const defAndAfter = src.slice(defStart);
    return defAndAfter;
}
export function inner$purifyFile$defAndAfter$$step(src, defStart) {
    const defAndAfter = src.slice(defStart);
    return defAndAfter;
}
export function inner$purifyFile$defLine(src, fnInfo, callee) {
    const r = fnInfo.get(callee);
    const defStart = r.open - (callee.length);
    const defAndAfter = src.slice(defStart);
    const defLine = defAndAfter.slice(0, callee.length + 1);
    return defLine;
}
export function inner$purifyFile$defLine$$step(callee, defAndAfter) {
    const defLine = defAndAfter.slice(0, callee.length + 1);
    return defLine;
}
export function inner$purifyFile$rest(src, fnInfo, callee) {
    const r = fnInfo.get(callee);
    const defStart = r.open - (callee.length);
    const defAndAfter = src.slice(defStart);
    const rest = defAndAfter.slice(callee.length + 1);
    return rest;
}
export function inner$purifyFile$rest$$step(callee, defAndAfter) {
    const rest = defAndAfter.slice(callee.length + 1);
    return rest;
}
export function inner$purifyFile$refreshFns$open(m) {
    const open = m.index + m[0].length - 1;
    return open;
}
export function inner$purifyFile$refreshFns$close(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$purifyFile$refreshFns$close$$step(src, open) {
    const close = balance(src, open + 1, '(', ')');
    return close;
}
export function inner$purifyFile$refreshFns$sigTxt(src, m) {
    const open = m.index + m[0].length - 1;
    const close = balance(src, open + 1, '(', ')');
    const sigTxt = src.slice(open, close + 1);
    return sigTxt;
}
export function inner$purifyFile$refreshFns$sigTxt$$step(src, open, close) {
    const sigTxt = src.slice(open, close + 1);
    return sigTxt;
}
export function inner$purifyFile$sigTxt_L466(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    return sigTxt;
}
export function inner$purifyFile$braceClose(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const braceClose = sigTxt.lastIndexOf('}');
    return braceClose;
}
export function inner$purifyFile$braceClose$$step(sigTxt) {
    const braceClose = sigTxt.lastIndexOf('}');
    return braceClose;
}
export function inner$purifyFile$abs(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const braceClose = sigTxt.lastIndexOf('}');
    const abs = r.open + braceClose;
    return abs;
}
export function inner$purifyFile$abs$$step(r, braceClose) {
    const abs = r.open + braceClose;
    return abs;
}
export function inner$purifyFile$beforeBrace(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const braceClose = sigTxt.lastIndexOf('}');
    const abs = r.open + braceClose;
    const beforeBrace = src.slice(0, abs).replace(/[,\s]+$/, '');
    return beforeBrace;
}
export function inner$purifyFile$beforeBrace$$step(src, abs) {
    const beforeBrace = src.slice(0, abs).replace(/[,\s]+$/, '');
    return beforeBrace;
}
export function inner$purifyFile$ins(socks) {
    const ins = socks.map(s => `required ${dartType(s.value)} ${s.name}`).join(', ');
    return ins;
}
export function inner$purifyFile$inner(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const inner = sigTxt.slice(1, -1);
    return inner;
}
export function inner$purifyFile$inner$$step(sigTxt) {
    const inner = sigTxt.slice(1, -1);
    return inner;
}
export function inner$purifyFile$ins_L476(socks) {
    const ins = socks.map(s => `${dartType(s.value)} ${s.name}`).join(', ');
    return ins;
}
export function inner$purifyFile$head_L488(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const inner = sigTxt.slice(1, -1);
    let depth = 0;
    let brk = -1;
    for (let k = 0; k < inner.length; k++) {
        const c = inner[k];
        if ('({<'.includes(c))
            depth++;
        else if (')}>'.includes(c))
            depth--;
        else if (c === '[' && depth === 0) {
            brk = k;
            break;
        }
        else if (c === ']' && depth === 0)
            break;
    }
    const head = inner.slice(0, brk).replace(/[,\s]+$/, '');
    return head;
}
export function inner$purifyFile$head_L488$$step(inner, brk) {
    const head = inner.slice(0, brk).replace(/[,\s]+$/, '');
    return head;
}
export function inner$purifyFile$t2(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const inner = sigTxt.slice(1, -1);
    const t2 = inner.trim();
    return t2;
}
export function inner$purifyFile$t2$$step(inner) {
    const t2 = inner.trim();
    return t2;
}
export function inner$purifyFile$alias(base) {
    const alias = 'sk_' + base.replace(/-/g, '_');
    return alias;
}
export function inner$purifyFile$camel(base) {
    const camel = base.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    return camel;
}
export function inner$purifyFile$dataSrc(base, merged) {
    const camel = base.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    const dataSrc = `// 📚 אטום-דאטה · שקעי-${base} — חולץ ע"י purify-dart (מבצע-המאה) מאמת-הקרקע של בדיקת-ה-JS.\n// מהות-המוצא: ערכי-השקעים של ${camel} — זהים ביט-לביט לצד-ה-JS (new/atoms/${base}.test.mjs).\nconst _x = 0; // עוגן-קובץ\n${merged.map(s => `const ${dartType(s.value)} ${camel}_${s.name} = ${dartVal(s.value)};`).join('\n')}\n`.replace('const _x = 0; // עוגן-קובץ\n', '');
    return dataSrc;
}
export function inner$purifyFile$dataSrc$$step(base, merged, camel) {
    const dataSrc = `// 📚 אטום-דאטה · שקעי-${base} — חולץ ע"י purify-dart (מבצע-המאה) מאמת-הקרקע של בדיקת-ה-JS.\n// מהות-המוצא: ערכי-השקעים של ${camel} — זהים ביט-לביט לצד-ה-JS (new/atoms/${base}.test.mjs).\nconst _x = 0; // עוגן-קובץ\n${merged.map(s => `const ${dartType(s.value)} ${camel}_${s.name} = ${dartVal(s.value)};`).join('\n')}\n`.replace('const _x = 0; // עוגן-קובץ\n', '');
    return dataSrc;
}
export function inner$purifyFile$socks(merged, addedPerFn, fn, nset) {
    const socks = merged.filter(s => nset.has(s.name) && (addedPerFn.get(fn)?.has(s.name) ?? true));
    return socks;
}
export function inner$purifyFile$args(base, src, merged, fnInfo, addedPerFn, fn, nset) {
    const feedStyle = new Map();
    const insertAt = new Map();
    for (const [fn, r] of fnInfo) {
        feedStyle.set(fn, r.named ? 'named' : 'pos');
        const sigInner = src.slice(r.open + 1, r.close);
        let depth = 0, brk = -1;
        for (let k = 0; k < sigInner.length; k++) {
            const c = sigInner[k];
            if ('({<'.includes(c))
                depth++;
            else if (')}>'.includes(c))
                depth--;
            else if ((c === '[' || c === '{') && depth === 0) {
                brk = k;
                break;
            }
        }
        if (!r.named && brk >= 0) {
            const head = sigInner.slice(0, brk).replace(/[,\s]+$/, '');
            insertAt.set(fn, head ? splitTopArgs(head).length : 0);
        }
        else
            insertAt.set(fn, null);
    }
    const alias = 'sk_' + base.replace(/-/g, '_');
    const camel = base.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    const socks = merged.filter(s => nset.has(s.name) && (addedPerFn.get(fn)?.has(s.name) ?? true));
    const args = socks.map(s => feedStyle.get(fn) === 'named' ? `${s.name}: ${alias}.${camel}_${s.name}` : `${alias}.${camel}_${s.name}`);
    return args;
}
export function inner$purifyFile$args$$step(feedStyle, alias, camel, fn, socks) {
    const args = socks.map(s => feedStyle.get(fn) === 'named' ? `${s.name}: ${alias}.${camel}_${s.name}` : `${alias}.${camel}_${s.name}`);
    return args;
}
export function inner$litType$nn(vs) {
    const nn = vs.filter((v) => v !== 'null');
    return nn;
}
export function inner$litType$t(vs) {
    const nn = vs.filter((v) => v !== 'null');
    const t = nn.every((v) => /^'/.test(v)) ? 'String' : nn.every((v) => /^-?\d+$/.test(v)) ? 'int' : nn.every((v) => /^-?\d/.test(v)) ? 'double' : nn.every((v) => /^(true|false)$/.test(v)) ? 'bool' : 'Object';
    return t;
}
export function inner$litType$t$$step(nn) {
    const t = nn.every((v) => /^'/.test(v)) ? 'String' : nn.every((v) => /^-?\d+$/.test(v)) ? 'int' : nn.every((v) => /^-?\d/.test(v)) ? 'double' : nn.every((v) => /^(true|false)$/.test(v)) ? 'bool' : 'Object';
    return t;
}
export function inner$jsSockets$d$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < tt.length; j++) {
        const ch = tt[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return d;
}
export function inner$jsSockets$j$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < tt.length; j++) {
        const ch = tt[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return j;
}
export function inner$jsSockets$q$$after_loop(tt, nm) {
    const cm = tt.match(new RegExp(`const ${nm} = `));
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < tt.length; j++) {
        const ch = tt[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return q;
}
export function inner$dartStrings$d$$after_loop(src, j) {
    let d = 1;
    let k = j + 2;
    for (; k < src.length && d; k++) {
        if (src[k] === '{')
            d++;
        else if (src[k] === '}')
            d--;
    }
    return d;
}
export function inner$dartStrings$k$$after_loop(src, j) {
    let d = 1;
    let k = j + 2;
    for (; k < src.length && d; k++) {
        if (src[k] === '{')
            d++;
        else if (src[k] === '}')
            d--;
    }
    return k;
}
export function inner$parseDartLit$out$$after_loop(t) {
    let out = '';
    let q = null;
    for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (q === "'") {
            if (c === '\\') {
                const n = t[i + 1];
                out += n === "'" ? "'" : '\\' + n;
                i++;
                continue;
            }
            if (c === '"') {
                out += '\\"';
                continue;
            }
            if (c === "'") {
                q = null;
                out += '"';
                continue;
            }
            out += c;
            continue;
        }
        if (c === "'") {
            q = "'";
            out += '"';
            continue;
        }
        out += c;
    }
    return out;
}
export function inner$parseDartLit$q$$after_loop(t) {
    let out = '';
    let q = null;
    for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (q === "'") {
            if (c === '\\') {
                const n = t[i + 1];
                out += n === "'" ? "'" : '\\' + n;
                i++;
                continue;
            }
            if (c === '"') {
                out += '\\"';
                continue;
            }
            if (c === "'") {
                q = null;
                out += '"';
                continue;
            }
            out += c;
            continue;
        }
        if (c === "'") {
            q = "'";
            out += '"';
            continue;
        }
        out += c;
    }
    return q;
}
export function inner$purifyFile$d$$after_loop(src, cm) {
    const st = cm.index + cm[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return d;
}
export function inner$purifyFile$j$$after_loop(src, cm) {
    const st = cm.index + cm[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return j;
}
export function inner$purifyFile$q$$after_loop(src, cm) {
    const st = cm.index + cm[0].length;
    let d = 0;
    let j = st;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return q;
}
export function inner$purifyFile$d$$after_loop_L330(src, cm) {
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return d;
}
export function inner$purifyFile$j$$after_loop_L330(src, cm) {
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return j;
}
export function inner$purifyFile$q$$after_loop_L330(src, cm) {
    let d = 0;
    let j = cm.index + cm[0].length;
    let q = null;
    for (; j < src.length; j++) {
        const ch = src[j];
        if (q) {
            if (ch === '\\')
                j++;
            else if (ch === q)
                q = null;
            continue;
        }
        if (ch === "'" || ch === '"') {
            q = ch;
            continue;
        }
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return q;
}
export function inner$purifyFile$feedStyle$$after_loop(src, fnInfo) {
    const feedStyle = new Map();
    const insertAt = new Map();
    for (const [fn, r] of fnInfo) {
        feedStyle.set(fn, r.named ? 'named' : 'pos');
        const sigInner = src.slice(r.open + 1, r.close);
        let depth = 0, brk = -1;
        for (let k = 0; k < sigInner.length; k++) {
            const c = sigInner[k];
            if ('({<'.includes(c))
                depth++;
            else if (')}>'.includes(c))
                depth--;
            else if ((c === '[' || c === '{') && depth === 0) {
                brk = k;
                break;
            }
        }
        if (!r.named && brk >= 0) {
            const head = sigInner.slice(0, brk).replace(/[,\s]+$/, '');
            insertAt.set(fn, head ? splitTopArgs(head).length : 0);
        }
        else
            insertAt.set(fn, null);
    }
    return feedStyle;
}
export function inner$purifyFile$insertAt$$after_loop(src, fnInfo) {
    const feedStyle = new Map();
    const insertAt = new Map();
    for (const [fn, r] of fnInfo) {
        feedStyle.set(fn, r.named ? 'named' : 'pos');
        const sigInner = src.slice(r.open + 1, r.close);
        let depth = 0, brk = -1;
        for (let k = 0; k < sigInner.length; k++) {
            const c = sigInner[k];
            if ('({<'.includes(c))
                depth++;
            else if (')}>'.includes(c))
                depth--;
            else if ((c === '[' || c === '{') && depth === 0) {
                brk = k;
                break;
            }
        }
        if (!r.named && brk >= 0) {
            const head = sigInner.slice(0, brk).replace(/[,\s]+$/, '');
            insertAt.set(fn, head ? splitTopArgs(head).length : 0);
        }
        else
            insertAt.set(fn, null);
    }
    return insertAt;
}
export function inner$purifyFile$depth$$after_loop(src, r) {
    const sigInner = src.slice(r.open + 1, r.close);
    let depth = 0;
    let brk = -1;
    for (let k = 0; k < sigInner.length; k++) {
        const c = sigInner[k];
        if ('({<'.includes(c))
            depth++;
        else if (')}>'.includes(c))
            depth--;
        else if ((c === '[' || c === '{') && depth === 0) {
            brk = k;
            break;
        }
    }
    return depth;
}
export function inner$purifyFile$brk$$after_loop(src, r) {
    const sigInner = src.slice(r.open + 1, r.close);
    let depth = 0;
    let brk = -1;
    for (let k = 0; k < sigInner.length; k++) {
        const c = sigInner[k];
        if ('({<'.includes(c))
            depth++;
        else if (')}>'.includes(c))
            depth--;
        else if ((c === '[' || c === '{') && depth === 0) {
            brk = k;
            break;
        }
    }
    return brk;
}
export function inner$purifyFile$depth$$after_loop_L479(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const inner = sigTxt.slice(1, -1);
    let depth = 0;
    let brk = -1;
    for (let k = 0; k < inner.length; k++) {
        const c = inner[k];
        if ('({<'.includes(c))
            depth++;
        else if (')}>'.includes(c))
            depth--;
        else if (c === '[' && depth === 0) {
            brk = k;
            break;
        }
        else if (c === ']' && depth === 0)
            break;
    }
    return depth;
}
export function inner$purifyFile$brk$$after_loop_L479(src, r) {
    const sigTxt = src.slice(r.open, r.close + 1);
    const inner = sigTxt.slice(1, -1);
    let depth = 0;
    let brk = -1;
    for (let k = 0; k < inner.length; k++) {
        const c = inner[k];
        if ('({<'.includes(c))
            depth++;
        else if (')}>'.includes(c))
            depth--;
        else if (c === '[' && depth === 0) {
            brk = k;
            break;
        }
        else if (c === ']' && depth === 0)
            break;
    }
    return brk;
}

export const SIGS = {
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$fn$i_L21: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$jsSockets$decls: [{"name":"js","d":{"t":"any"},"opt":false}],
  inner$jsSockets$wm: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$jsSockets$socketNames: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$jsSockets$socketNames$$step: [{"name":"wm","d":{"t":"any"},"opt":false}],
  inner$jsSockets$cm: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$jsSockets$j: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$jsSockets$j$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$jsSockets$names: [{"name":"sig","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"vals","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$dartStrings$raw: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$dartStrings$start: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$dartStrings$start$$step: [{"name":"i","d":{"t":"num"},"opt":false},{"name":"raw","d":{"t":"bool"},"opt":false}],
  inner$dartStrings$j: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$dartStrings$k: [{"name":"j","d":{"t":"num"},"opt":false}],
  inner$dartStrings$idm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$parseDartLit$t: [{"name":"txt","d":{"t":"any"},"opt":false}],
  inner$parseDartLit$n: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$valueIndex$allStr: [{"name":"value","d":{"t":"any"},"opt":false}],
  inner$valueIndex$allStr_L164: [{"name":"value","d":{"t":"any"},"opt":false}],
  inner$dartType$ts: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartType$vs: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartType$ts_L181: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartType$ts_L181$$step: [{"name":"vs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$spliceCalls$re: [{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$spliceCalls$open: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$spliceCalls$close: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$spliceCalls$close$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$spliceCalls$parts: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$spliceCalls$parts$$step: [{"name":"txt","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false},{"name":"close","d":{"t":"any"},"opt":false}],
  inner$spliceCalls$pos: [{"name":"insertPos","d":{"t":"num"},"opt":false},{"name":"parts","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$purifyFile$st: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$litTxt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$litTxt$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$purifyFile$val: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$val$$step: [{"name":"litTxt","d":{"t":"any"},"opt":false}],
  inner$purifyFile$hit: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$hit$$step: [{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"val","d":{"t":"any"},"opt":false}],
  inner$purifyFile$idx: [{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$strs: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$purifyFile$whole: [{"name":"st","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"num"},false],["quote",{"t":"any"},false],["raw",{"t":"bool"},false],["segs",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["s",{"t":"any"},false]]}},false],["full",{"t":"any"},false]]},"opt":false}],
  inner$purifyFile$plain: [{"name":"st","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"num"},false],["quote",{"t":"any"},false],["raw",{"t":"bool"},false],["segs",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["s",{"t":"any"},false]]}},false],["full",{"t":"any"},false]]},"opt":false}],
  inner$purifyFile$whole_L289: [{"name":"st","d":{"t":"obj","p":[["start",{"t":"num"},false],["end",{"t":"num"},false],["quote",{"t":"any"},false],["raw",{"t":"bool"},false],["segs",{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["s",{"t":"any"},false]]}},false],["full",{"t":"any"},false]]},"opt":false}],
  inner$purifyFile$map$val: [{"name":"x","d":{"t":"obj","p":[["type",{"t":"str"},false],["s",{"t":"any"},false]]},"opt":false}],
  inner$purifyFile$sockRe: [{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$isInsideFn$open: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$isInsideFn$close: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$isInsideFn$close$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$purifyFile$isInsideFn$bm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$isInsideFn$bm$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$purifyFile$isInsideFn$bs: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$isInsideFn$bs$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$purifyFile$isInsideFn$be: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$isInsideFn$be$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"bs","d":{"t":"num"},"opt":false}],
  inner$purifyFile$declStart: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$j: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$declTxt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$declTxt$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"declStart","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$purifyFile$finalDecl: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$finalDecl$$step: [{"name":"declTxt","d":{"t":"any"},"opt":false}],
  inner$purifyFile$open: [{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$close: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$close$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$purifyFile$bs: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$bs$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$purifyFile$be: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$be$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"bs","d":{"t":"num"},"opt":false}],
  inner$purifyFile$needed: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$fnSigs: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$purifyFile$close_L370: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["open",{"t":"num"},false]]},"opt":false}],
  inner$purifyFile$after: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["open",{"t":"num"},false]]},"opt":false}],
  inner$purifyFile$after$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$purifyFile$bm: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["open",{"t":"num"},false]]},"opt":false}],
  inner$purifyFile$bm$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$purifyFile$bs_L377: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["open",{"t":"num"},false]]},"opt":false}],
  inner$purifyFile$bs_L377$$step: [{"name":"close","d":{"t":"num"},"opt":false},{"name":"bm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$sigTxt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["open",{"t":"num"},false]]},"opt":false}],
  inner$purifyFile$sigTxt$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["name",{"t":"any"},false],["open",{"t":"num"},false]]},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$purifyFile$usesSock$r: [{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyFile$usesSock$body: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyFile$usesSock$body$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$body: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$sigInner: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$head: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$head$$step: [{"name":"sigInner","d":{"t":"any"},"opt":false},{"name":"brk","d":{"t":"num"},"opt":false}],
  inner$purifyFile$sigTxt_L424: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$feedCall$args: [{"name":"feedStyle","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"callee","d":{"t":"any"},"opt":false},{"name":"socks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$r: [{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$purifyFile$defStart: [{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$purifyFile$defStart$$step: [{"name":"callee","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$before: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$purifyFile$before$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"defStart","d":{"t":"num"},"opt":false}],
  inner$purifyFile$defAndAfter: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$purifyFile$defAndAfter$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"defStart","d":{"t":"num"},"opt":false}],
  inner$purifyFile$defLine: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$purifyFile$defLine$$step: [{"name":"callee","d":{"t":"any"},"opt":false},{"name":"defAndAfter","d":{"t":"any"},"opt":false}],
  inner$purifyFile$rest: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"callee","d":{"t":"any"},"opt":false}],
  inner$purifyFile$rest$$step: [{"name":"callee","d":{"t":"any"},"opt":false},{"name":"defAndAfter","d":{"t":"any"},"opt":false}],
  inner$purifyFile$refreshFns$open: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$refreshFns$close: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$refreshFns$close$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$purifyFile$refreshFns$sigTxt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$purifyFile$refreshFns$sigTxt$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false},{"name":"close","d":{"t":"num"},"opt":false}],
  inner$purifyFile$sigTxt_L466: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$braceClose: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$braceClose$$step: [{"name":"sigTxt","d":{"t":"any"},"opt":false}],
  inner$purifyFile$abs: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$abs$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"braceClose","d":{"t":"any"},"opt":false}],
  inner$purifyFile$beforeBrace: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$beforeBrace$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"abs","d":{"t":"any"},"opt":false}],
  inner$purifyFile$ins: [{"name":"socks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$inner: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$inner$$step: [{"name":"sigTxt","d":{"t":"any"},"opt":false}],
  inner$purifyFile$ins_L476: [{"name":"socks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$head_L488: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$head_L488$$step: [{"name":"inner","d":{"t":"any"},"opt":false},{"name":"brk","d":{"t":"num"},"opt":false}],
  inner$purifyFile$t2: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$t2$$step: [{"name":"inner","d":{"t":"any"},"opt":false}],
  inner$purifyFile$alias: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyFile$camel: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyFile$dataSrc: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$dataSrc$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"camel","d":{"t":"any"},"opt":false}],
  inner$purifyFile$socks: [{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"addedPerFn","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false},{"name":"nset","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$args: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"merged","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"addedPerFn","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false},{"name":"nset","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$purifyFile$args$$step: [{"name":"feedStyle","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"alias","d":{"t":"str"},"opt":false},{"name":"camel","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false},{"name":"socks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$litType$nn: [{"name":"vs","d":{"t":"any"},"opt":false}],
  inner$litType$t: [{"name":"vs","d":{"t":"any"},"opt":false}],
  inner$litType$t$$step: [{"name":"nn","d":{"t":"any"},"opt":false}],
  inner$jsSockets$d$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$jsSockets$j$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$jsSockets$q$$after_loop: [{"name":"tt","d":{"t":"any"},"opt":false},{"name":"nm","d":{"t":"any"},"opt":false}],
  inner$dartStrings$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$dartStrings$k$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$parseDartLit$out$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$parseDartLit$q$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyFile$d$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$j$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$q$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$d$$after_loop_L330: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$j$$after_loop_L330: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$q$$after_loop_L330: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$purifyFile$feedStyle$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyFile$insertAt$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fnInfo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyFile$depth$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$brk$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$depth$$after_loop_L479: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$purifyFile$brk$$after_loop_L479: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
};
