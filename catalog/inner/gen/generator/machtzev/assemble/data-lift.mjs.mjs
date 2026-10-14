// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/data-lift.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ANY_LIT = /'(?:[^'\\\n]|\\.)*'/g;
const maskLits = (s) => s.replace(ANY_LIT, (m) => "'" + 'x'.repeat(m.length - 2) + "'");
const FLUTTER_POS = { Text: ['label'], SelectableText: ['label'], CfgText: ['id', 'fallback'] };
function splitTemplate(v) {
    const parts = [];
    let txt = '';
    for (let i = 0; i < v.length; i++) {
        const c = v[i];
        if (c === '\\') {
            txt += c + (v[i + 1] || '');
            i++;
            continue;
        }
        if (c !== '$') {
            txt += c;
            continue;
        }
        if (v[i + 1] === '{') {
            let d = 0, j = i + 1;
            for (; j < v.length; j++) {
                if (v[j] === "'")
                    return null;
                if (v[j] === '{')
                    d++;
                else if (v[j] === '}') {
                    d--;
                    if (!d)
                        break;
                }
            }
            if (d)
                return null;
            const hole = v.slice(i, j + 1);
            if (/[֐-׿]/.test(hole))
                return null;
            if (txt)
                parts.push({ t: 'txt', s: txt });
            txt = '';
            parts.push({ t: 'hole', s: hole });
            i = j;
        }
        else {
            const im = v.slice(i + 1).match(/^[a-zA-Z_]\w*/);
            if (!im) {
                txt += c;
                continue;
            }
            if (txt)
                parts.push({ t: 'txt', s: txt });
            txt = '';
            parts.push({ t: 'hole', s: '$' + im[0] });
            i += im[0].length;
        }
    }
    if (txt)
        parts.push({ t: 'txt', s: txt });
    return parts;
}
export function inner$resolveFnImport$dm(name, src) {
    const dm = src.match(new RegExp('(^|\\n)[A-Za-z][A-Za-z_<>,? ]+ ' + name + '\\('));
    return dm;
}
export function inner$resolveConstImport$f(projectConsts, name) {
    const f = projectConsts.get(name);
    return f;
}
export function inner$resolveConstImport$dm(name, src2) {
    const dm = src2.match(new RegExp('(^|\\n)(?:const\\s+|final\\s+)?(?:[A-Za-z_][\\w<>,? ]*?\\s+)?(?:get\\s+)?' + name + '\\s*[={]'));
    return dm;
}
export function inner$resolveConstImport$end(name, src2) {
    const dm = src2.match(new RegExp('(^|\\n)(?:const\\s+|final\\s+)?(?:[A-Za-z_][\\w<>,? ]*?\\s+)?(?:get\\s+)?' + name + '\\s*[={]'));
    const end = src2.indexOf(';', dm.index);
    return end;
}
export function inner$resolveConstImport$end$$step(src2, dm) {
    const end = src2.indexOf(';', dm.index);
    return end;
}
export function inner$modelFields$m(name, src) {
    const m = src.match(new RegExp('class\\s+' + name + '\\b[^{]*\\{'));
    return m;
}
export function inner$ctorPositionals$m(name, body) {
    const m = body.match(new RegExp('(?:const\\s+)?' + name + '\\s*\\('));
    return m;
}
export function inner$ctorPositionals$j(name, body) {
    const m = body.match(new RegExp('(?:const\\s+)?' + name + '\\s*\\('));
    let j = body.indexOf('(', m.index);
    return j;
}
export function inner$ctorPositionals$j$$step(body, m) {
    let j = body.indexOf('(', m.index);
    return j;
}
export function inner$ctorPositionals$plist(name, body, open) {
    const m = body.match(new RegExp('(?:const\\s+)?' + name + '\\s*\\('));
    let d = 0;
    let j = body.indexOf('(', m.index);
    for (; j < body.length; j++) {
        const c = body[j];
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const plist = body.slice(open + 1, j);
    return plist;
}
export function inner$ctorPositionals$plist$$step(body, j, open) {
    const plist = body.slice(open + 1, j);
    return plist;
}
export function inner$purposeOf$k(litStart) {
    let k = litStart - 1;
    return k;
}
export function inner$purposeOf$inv(scan, k) {
    const inv = scan.slice(0, k).match(/([A-Za-z_][\w.]*)\s*$/);
    return inv;
}
export function inner$purposeOf$invName(scan, k) {
    const inv = scan.slice(0, k).match(/([A-Za-z_][\w.]*)\s*$/);
    const invName = inv[1].split('.')[0];
    return invName;
}
export function inner$purposeOf$invName$$step(inv) {
    const invName = inv[1].split('.')[0];
    return invName;
}
export function inner$purposeOf$idx(scan, litStart, commas, k) {
    let named = 0;
    for (const nm of scan.slice(k + 1, litStart).matchAll(/[({,]\s*[a-zA-Z_]\w*\s*:/g))
        named++;
    const idx = Math.max(0, commas - named);
    return idx;
}
export function inner$purposeOf$idx$$step(commas, named) {
    const idx = Math.max(0, commas - named);
    return idx;
}
export function inner$purposeOf$params(scan, ctorIndex, k) {
    const inv = scan.slice(0, k).match(/([A-Za-z_][\w.]*)\s*$/);
    const invName = inv[1].split('.')[0];
    const params = ctorIndex.get(invName) || FLUTTER_POS[invName];
    return params;
}
export function inner$purposeOf$params$$step(ctorIndex, invName) {
    const params = ctorIndex.get(invName) || FLUTTER_POS[invName];
    return params;
}
export function inner$splitTemplate$j(i) {
    let j = i + 1;
    return j;
}
export function inner$splitTemplate$hole(v, i, j) {
    const hole = v.slice(i, j + 1);
    return hole;
}
export function inner$splitTemplate$im(v, i) {
    const im = v.slice(i + 1).match(/^[a-zA-Z_]\w*/);
    return im;
}
export function inner$untangle$vs(m) {
    const vs = m.index + m[0].length;
    return vs;
}
export function inner$untangle$head(scan, m) {
    const vs = m.index + m[0].length;
    const head = scan.slice(vs, vs + 24);
    return head;
}
export function inner$untangle$head$$step(scan, vs) {
    const head = scan.slice(vs, vs + 24);
    return head;
}
export function inner$untangle$oneArg(scan, m) {
    const vs = m.index + m[0].length;
    const head = scan.slice(vs, vs + 24);
    const oneArg = /^\(\s*\w+\s*\)\s*(=>|\{|async)/.test(head);
    return oneArg;
}
export function inner$untangle$oneArg$$step(head) {
    const oneArg = /^\(\s*\w+\s*\)\s*(=>|\{|async)/.test(head);
    return oneArg;
}
export function inner$untangle$methRef(scan, m) {
    const vs = m.index + m[0].length;
    const methRef = /^_[a-z]\w*\s*[,)\]]/.test(scan.slice(vs));
    return methRef;
}
export function inner$untangle$methRef$$step(scan, vs) {
    const methRef = /^_[a-z]\w*\s*[,)\]]/.test(scan.slice(vs));
    return methRef;
}
export function inner$untangle$val(scan, m) {
    const vs = m.index + m[0].length;
    let d = 0;
    let j = vs;
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            d++;
        else if (c === ')' || c === ']' || c === '}') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    let val = scan.slice(vs, j);
    return val;
}
export function inner$untangle$val$$step(scan, vs, j) {
    let val = scan.slice(vs, j);
    return val;
}
export function inner$untangle$vlen(scan, m) {
    const vs = m.index + m[0].length;
    let d = 0;
    let j = vs;
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            d++;
        else if (c === ')' || c === ']' || c === '}') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    let vlen = j - vs;
    return vlen;
}
export function inner$untangle$vlen$$step(vs, j) {
    let vlen = j - vs;
    return vlen;
}
export function inner$untangle$mr(scan, m) {
    const vs = m.index + m[0].length;
    const mr = scan.slice(vs).match(/^_[a-z]\w*/);
    return mr;
}
export function inner$untangle$mr$$step(scan, vs) {
    const mr = scan.slice(vs).match(/^_[a-z]\w*/);
    return mr;
}
export function inner$untangle$n(seen, base) {
    let n = (seen.get(base) || 0) + 1;
    return n;
}
export function inner$untangle$prop(seen, base) {
    let n = (seen.get(base) || 0) + 1;
    const prop = n === 1 ? base : base + n;
    return prop;
}
export function inner$untangle$prop$$step(base, n) {
    const prop = n === 1 ? base : base + n;
    return prop;
}
export function inner$untangle$replace$t(providerType, pv) {
    const t = providerType.get(pv);
    return t;
}
export function inner$untangle$replace$v(pv) {
    const v = pv.replace(/Provider$/, '').replace(/^_/, '');
    return v;
}
export function inner$untangle$uses(sc, nm2) {
    const uses = [...sc.matchAll(new RegExp('\\b' + nm2 + '\\b', 'g'))].length;
    return uses;
}
export function inner$untangle$start(dm) {
    const start = dm.index + 1;
    return start;
}
export function inner$untangle$mb(out, dm, b2) {
    const start = dm.index + 1;
    const mb = out.slice(start, start + out.slice(start).indexOf(b2) + b2.length);
    return mb;
}
export function inner$untangle$mb$$step(out, start, b2) {
    const mb = out.slice(start, start + out.slice(start).indexOf(b2) + b2.length);
    return mb;
}
export function inner$hoistStrings$scan(masked) {
    const scan = maskLits(masked);
    return scan;
}
export function inner$hoistStrings$lits(masked) {
    const runs = [];
    let cur = null;
    for (const m of [...masked.matchAll(ANY_LIT)]) {
        if (cur && /^\s*$/.test(masked.slice(cur.end, m.index))) {
            cur.end = m.index + m[0].length;
            cur.parts.push(m[0]);
        }
        else {
            cur = { start: m.index, end: m.index + m[0].length, parts: [m[0]] };
            runs.push(cur);
        }
    }
    const lits = runs.map(r => ({ ...r, value: r.parts.map(p => p.slice(1, -1)).join('') })).filter(r => /[֐-׿]/.test(r.value));
    return lits;
}
export function inner$hoistStrings$lits$$step(runs) {
    const lits = runs.map(r => ({ ...r, value: r.parts.map(p => p.slice(1, -1)).join('') })).filter(r => /[֐-׿]/.test(r.value));
    return lits;
}
export function inner$hoistStrings$takeName$n(seen, name) {
    let n = (seen.get(name) || 0) + 1;
    return n;
}
export function inner$hoistStrings$k(m) {
    let k = m.start - 1;
    return k;
}
export function inner$hoistStrings$argPrefix(masked, m) {
    const scan = maskLits(masked);
    let d = 0;
    let k = m.start - 1;
    for (; k >= 0; k--) {
        const c = scan[k];
        if (c === ')' || c === ']' || c === '}')
            d++;
        else if (c === '(' || c === '[' || c === '{') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    const argPrefix = scan.slice(k + 1, m.start);
    return argPrefix;
}
export function inner$hoistStrings$argPrefix$$step(scan, m, k) {
    const argPrefix = scan.slice(k + 1, m.start);
    return argPrefix;
}
export function inner$hoistStrings$nm(masked, m) {
    const scan = maskLits(masked);
    let d = 0;
    let k = m.start - 1;
    for (; k >= 0; k--) {
        const c = scan[k];
        if (c === ')' || c === ']' || c === '}')
            d++;
        else if (c === '(' || c === '[' || c === '{') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    const argPrefix = scan.slice(k + 1, m.start);
    const nm = argPrefix.match(/^\s*([a-zA-Z_]\w*)\s*:/);
    return nm;
}
export function inner$hoistStrings$nm$$step(argPrefix) {
    const nm = argPrefix.match(/^\s*([a-zA-Z_]\w*)\s*:/);
    return nm;
}
export function inner$hoistStrings$dp(masked, m) {
    const scan = maskLits(masked);
    let d = 0;
    let k = m.start - 1;
    for (; k >= 0; k--) {
        const c = scan[k];
        if (c === ')' || c === ']' || c === '}')
            d++;
        else if (c === '(' || c === '[' || c === '{') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    const argPrefix = scan.slice(k + 1, m.start);
    const dp = argPrefix.match(/this\.([a-zA-Z_]\w*)\s*=\s*$/);
    return dp;
}
export function inner$hoistStrings$dp$$step(argPrefix) {
    const dp = argPrefix.match(/this\.([a-zA-Z_]\w*)\s*=\s*$/);
    return dp;
}
export function inner$hoistStrings$wantsConst(fb, masked, m, name, isDefault) {
    const scan = maskLits(masked);
    const wantsConst = fb && (!name || (/=\s*$/.test(scan.slice(0, m.start)) && !isDefault));
    return wantsConst;
}
export function inner$hoistStrings$wantsConst$$step(fb, scan, m, name, isDefault) {
    const wantsConst = fb && (!name || (/=\s*$/.test(scan.slice(0, m.start)) && !isDefault));
    return wantsConst;
}
export function inner$hoistStrings$parts(m) {
    const parts = splitTemplate(m.value);
    return parts;
}
export function inner$hoistStrings$eq(out, e) {
    const eq = out.lastIndexOf('=', e.start);
    return eq;
}
export function inner$stripConstOn$propWord(propNames) {
    const propWord = new RegExp('\\b(' + propNames.join('|') + ')\\b');
    return propWord;
}
export function inner$stripConstOn$end(out, dm) {
    const end = out.indexOf(';', dm.index);
    return end;
}
export function inner$stripConstOn$rel(out, cm) {
    const rel = out.slice(cm.index).search(/[([]/);
    return rel;
}
export function inner$stripConstOn$open(out, cm) {
    const rel = out.slice(cm.index).search(/[([]/);
    const open = cm.index + rel;
    return open;
}
export function inner$stripConstOn$open$$step(cm, rel) {
    const open = cm.index + rel;
    return open;
}
export function inner$stripConstOn$closeCh(openCh) {
    const closeCh = openCh === '(' ? ')' : ']';
    return closeCh;
}
export function inner$flattenModels$fdecl(R, code) {
    const fdecl = code.match(new RegExp('final\\s+' + R + '\\??\\s+([a-zA-Z_]\\w*)\\s*;'));
    return fdecl;
}
export function inner$flattenModels$before(scan, um) {
    const before = scan.slice(Math.max(0, um.index - 8), um.index);
    return before;
}
export function inner$flattenModels$after(v, scan, um) {
    const after = scan.slice(um.index + v.length);
    return after;
}
export function inner$flattenModels$mm(v, scan, um) {
    const after = scan.slice(um.index + v.length);
    const mm = after.match(/^\.([a-zA-Z_]\w*)/);
    return mm;
}
export function inner$flattenModels$mm$$step(after) {
    const mm = after.match(/^\.([a-zA-Z_]\w*)/);
    return mm;
}
export function inner$flattenModels$t(v, mf, scan, um) {
    const after = scan.slice(um.index + v.length);
    const mm = after.match(/^\.([a-zA-Z_]\w*)/);
    const t = mf.get(mm[1]);
    return t;
}
export function inner$flattenModels$t$$step(mf, mm) {
    const t = mf.get(mm[1]);
    return t;
}
export function inner$injectProps$props(allProps) {
    const props = allProps.filter(p => !p.isDefault);
    return props;
}
export function inner$injectProps$decls(allProps) {
    const props = allProps.filter(p => !p.isDefault);
    const decls = props.map(p => `  final ${p.type || 'String'} ${p.prop};`).join('\n');
    return decls;
}
export function inner$injectProps$decls$$step(props) {
    const decls = props.map(p => `  final ${p.type || 'String'} ${p.prop};`).join('\n');
    return decls;
}
export function inner$injectProps$params(allProps) {
    const props = allProps.filter(p => !p.isDefault);
    const params = props.map(p => 'required this.' + p.prop).join(', ');
    return params;
}
export function inner$injectProps$params$$step(props) {
    const params = props.map(p => 'required this.' + p.prop).join(', ');
    return params;
}
export function inner$injectProps$ctorRe(cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    return ctorRe;
}
export function inner$injectProps$cm(body, cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    return cm;
}
export function inner$injectProps$cm$$step(body, ctorRe) {
    const cm = body.match(ctorRe);
    return cm;
}
export function inner$injectProps$j(body, cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    let j = body.indexOf('(', cm.index);
    return j;
}
export function inner$injectProps$j$$step(body, cm) {
    let j = body.indexOf('(', cm.index);
    return j;
}
export function inner$injectProps$plist(body, cls, open) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    let d = 0;
    let j = body.indexOf('(', cm.index);
    let inS = 0;
    for (; j < body.length; j++) {
        const c = body[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const plist = body.slice(open + 1, j);
    return plist;
}
export function inner$injectProps$plist$$step(body, j, open) {
    const plist = body.slice(open + 1, j);
    return plist;
}
export function inner$injectProps$end(body, cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    let d = 0;
    let j = body.indexOf('(', cm.index);
    let inS = 0;
    for (; j < body.length; j++) {
        const c = body[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    let end = body.indexOf(';', j);
    return end;
}
export function inner$injectProps$end$$step(body, j) {
    let end = body.indexOf(';', j);
    return end;
}
export function inner$injectProps$brace(body, cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    let d = 0;
    let j = body.indexOf('(', cm.index);
    let inS = 0;
    for (; j < body.length; j++) {
        const c = body[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const brace = body.indexOf('{', j);
    return brace;
}
export function inner$injectProps$brace$$step(body, j) {
    const brace = body.indexOf('{', j);
    return brace;
}
export function inner$injectProps$openBrace(body) {
    const openBrace = body.indexOf('{');
    return openBrace;
}
export function inner$threadProps$invRe(target) {
    const invRe = new RegExp('\\b' + target.name + '\\s*\\(', 'g');
    return invRe;
}
export function inner$threadProps$j(scan, m) {
    let j = scan.indexOf('(', m.index);
    return j;
}
export function inner$threadProps$argText(scan, m, open) {
    let d = 0;
    let j = scan.indexOf('(', m.index);
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const argText = scan.slice(open + 1, j);
    return argText;
}
export function inner$threadProps$argText$$step(scan, j, open) {
    const argText = scan.slice(open + 1, j);
    return argText;
}
export function inner$threadProps$seg$mm(argText, a, b) {
    const mm = argText.slice(a, b).match(/^\s*([a-zA-Z_]\w*)\s*:/);
    return mm;
}
export function inner$threadProps$missing(target, given) {
    const missing = target.allProps.filter(p => !given.has(p));
    return missing;
}
export function inner$threadProps$tt(scan, m, open) {
    let d = 0;
    let j = scan.indexOf('(', m.index);
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const argText = scan.slice(open + 1, j);
    const tt = argText.replace(/\s+$/, '');
    return tt;
}
export function inner$threadProps$tt$$step(argText) {
    const tt = argText.replace(/\s+$/, '');
    return tt;
}
export function inner$threadProps$insert(target, scan, m, open, given) {
    let d = 0;
    let j = scan.indexOf('(', m.index);
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    const argText = scan.slice(open + 1, j);
    const missing = target.allProps.filter(p => !given.has(p));
    const tt = argText.replace(/\s+$/, '');
    const insert = (!tt ? '' : tt.endsWith(',') ? ' ' : ', ') + missing.map(p => `${p}: ${p}`).join(', ');
    return insert;
}
export function inner$threadProps$insert$$step(missing, tt) {
    const insert = (!tt ? '' : tt.endsWith(',') ? ' ' : ', ') + missing.map(p => `${p}: ${p}`).join(', ');
    return insert;
}
export function inner$hoistAllConst$replace$parts(v) {
    const parts = splitTemplate(v);
    return parts;
}
export function inner$ctorPositionals$d$$after_loop(name, body) {
    const m = body.match(new RegExp('(?:const\\s+)?' + name + '\\s*\\('));
    let d = 0;
    let j = body.indexOf('(', m.index);
    for (; j < body.length; j++) {
        const c = body[j];
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
export function inner$ctorPositionals$j$$after_loop(name, body) {
    const m = body.match(new RegExp('(?:const\\s+)?' + name + '\\s*\\('));
    let d = 0;
    let j = body.indexOf('(', m.index);
    for (; j < body.length; j++) {
        const c = body[j];
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
export function inner$purposeOf$named$$after_loop(scan, litStart, k) {
    let named = 0;
    for (const nm of scan.slice(k + 1, litStart).matchAll(/[({,]\s*[a-zA-Z_]\w*\s*:/g))
        named++;
    return named;
}
export function inner$untangle$d$$after_loop(scan, m) {
    const vs = m.index + m[0].length;
    let d = 0;
    let j = vs;
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            d++;
        else if (c === ')' || c === ']' || c === '}') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    return d;
}
export function inner$untangle$j$$after_loop(scan, m) {
    const vs = m.index + m[0].length;
    let d = 0;
    let j = vs;
    for (; j < scan.length; j++) {
        const c = scan[j];
        if (c === '(' || c === '[' || c === '{')
            d++;
        else if (c === ')' || c === ']' || c === '}') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    return j;
}
export function inner$hoistStrings$runs$$after_loop(masked) {
    const runs = [];
    let cur = null;
    for (const m of [...masked.matchAll(ANY_LIT)]) {
        if (cur && /^\s*$/.test(masked.slice(cur.end, m.index))) {
            cur.end = m.index + m[0].length;
            cur.parts.push(m[0]);
        }
        else {
            cur = { start: m.index, end: m.index + m[0].length, parts: [m[0]] };
            runs.push(cur);
        }
    }
    return runs;
}
export function inner$hoistStrings$cur$$after_loop(masked) {
    const runs = [];
    let cur = null;
    for (const m of [...masked.matchAll(ANY_LIT)]) {
        if (cur && /^\s*$/.test(masked.slice(cur.end, m.index))) {
            cur.end = m.index + m[0].length;
            cur.parts.push(m[0]);
        }
        else {
            cur = { start: m.index, end: m.index + m[0].length, parts: [m[0]] };
            runs.push(cur);
        }
    }
    return cur;
}
export function inner$hoistStrings$d$$after_loop(masked, m) {
    const scan = maskLits(masked);
    let d = 0;
    let k = m.start - 1;
    for (; k >= 0; k--) {
        const c = scan[k];
        if (c === ')' || c === ']' || c === '}')
            d++;
        else if (c === '(' || c === '[' || c === '{') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    return d;
}
export function inner$hoistStrings$k$$after_loop(masked, m) {
    const scan = maskLits(masked);
    let d = 0;
    let k = m.start - 1;
    for (; k >= 0; k--) {
        const c = scan[k];
        if (c === ')' || c === ']' || c === '}')
            d++;
        else if (c === '(' || c === '[' || c === '{') {
            if (!d)
                break;
            d--;
        }
        else if (c === ',' && !d)
            break;
    }
    return k;
}
export function inner$stripConstOn$d$$after_loop(out, cm, openCh) {
    const rel = out.slice(cm.index).search(/[([]/);
    const open = cm.index + rel;
    const closeCh = openCh === '(' ? ')' : ']';
    let d = 0;
    let j = open;
    let inS = 0;
    for (; j < out.length; j++) {
        const c = out[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === openCh)
            d++;
        else if (c === closeCh) {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$stripConstOn$j$$after_loop(out, cm, openCh) {
    const rel = out.slice(cm.index).search(/[([]/);
    const open = cm.index + rel;
    const closeCh = openCh === '(' ? ')' : ']';
    let d = 0;
    let j = open;
    let inS = 0;
    for (; j < out.length; j++) {
        const c = out[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === openCh)
            d++;
        else if (c === closeCh) {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}
export function inner$stripConstOn$inS$$after_loop(out, cm, openCh) {
    const rel = out.slice(cm.index).search(/[([]/);
    const open = cm.index + rel;
    const closeCh = openCh === '(' ? ')' : ']';
    let d = 0;
    let j = open;
    let inS = 0;
    for (; j < out.length; j++) {
        const c = out[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === openCh)
            d++;
        else if (c === closeCh) {
            d--;
            if (!d)
                break;
        }
    }
    return inS;
}
export function inner$injectProps$d$$after_loop(body, cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    let d = 0;
    let j = body.indexOf('(', cm.index);
    let inS = 0;
    for (; j < body.length; j++) {
        const c = body[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return d;
}
export function inner$injectProps$j$$after_loop(body, cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    let d = 0;
    let j = body.indexOf('(', cm.index);
    let inS = 0;
    for (; j < body.length; j++) {
        const c = body[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return j;
}
export function inner$injectProps$inS$$after_loop(body, cls) {
    const ctorRe = new RegExp('(const\\s+)?' + cls + '\\s*\\(');
    const cm = body.match(ctorRe);
    let d = 0;
    let j = body.indexOf('(', cm.index);
    let inS = 0;
    for (; j < body.length; j++) {
        const c = body[j];
        if (inS) {
            if (c === '\\')
                j++;
            else if (c === "'")
                inS = 0;
            continue;
        }
        if (c === "'")
            inS = 1;
        else if (c === '(')
            d++;
        else if (c === ')') {
            d--;
            if (!d)
                break;
        }
    }
    return inS;
}
export function inner$threadProps$d$$after_loop(scan, m) {
    let d = 0;
    let j = scan.indexOf('(', m.index);
    for (; j < scan.length; j++) {
        const c = scan[j];
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
export function inner$threadProps$j$$after_loop(scan, m) {
    let d = 0;
    let j = scan.indexOf('(', m.index);
    for (; j < scan.length; j++) {
        const c = scan[j];
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

export const SIGS = {
  inner$resolveFnImport$dm: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$resolveConstImport$f: [{"name":"projectConsts","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$resolveConstImport$dm: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src2","d":{"t":"any"},"opt":false}],
  inner$resolveConstImport$end: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src2","d":{"t":"any"},"opt":false}],
  inner$resolveConstImport$end$$step: [{"name":"src2","d":{"t":"any"},"opt":false},{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$modelFields$m: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$ctorPositionals$m: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$ctorPositionals$j: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$ctorPositionals$j$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$ctorPositionals$plist: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$ctorPositionals$plist$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$purposeOf$k: [{"name":"litStart","d":{"t":"num"},"opt":false}],
  inner$purposeOf$inv: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$purposeOf$invName: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$purposeOf$invName$$step: [{"name":"inv","d":{"t":"any"},"opt":false}],
  inner$purposeOf$idx: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"litStart","d":{"t":"any"},"opt":false},{"name":"commas","d":{"t":"num"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$purposeOf$idx$$step: [{"name":"commas","d":{"t":"num"},"opt":false},{"name":"named","d":{"t":"num"},"opt":false}],
  inner$purposeOf$params: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"ctorIndex","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$purposeOf$params$$step: [{"name":"ctorIndex","d":{"t":"any"},"opt":false},{"name":"invName","d":{"t":"any"},"opt":false}],
  inner$splitTemplate$j: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$splitTemplate$hole: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$splitTemplate$im: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$untangle$vs: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$head: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$head$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"vs","d":{"t":"num"},"opt":false}],
  inner$untangle$oneArg: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$oneArg$$step: [{"name":"head","d":{"t":"any"},"opt":false}],
  inner$untangle$methRef: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$methRef$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"vs","d":{"t":"any"},"opt":false}],
  inner$untangle$val: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$val$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"vs","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$untangle$vlen: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$vlen$$step: [{"name":"vs","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$untangle$mr: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$mr$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"vs","d":{"t":"any"},"opt":false}],
  inner$untangle$n: [{"name":"seen","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$untangle$prop: [{"name":"seen","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$untangle$prop$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$untangle$replace$t: [{"name":"providerType","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"pv","d":{"t":"any"},"opt":false}],
  inner$untangle$replace$v: [{"name":"pv","d":{"t":"any"},"opt":false}],
  inner$untangle$uses: [{"name":"sc","d":{"t":"any"},"opt":false},{"name":"nm2","d":{"t":"any"},"opt":false}],
  inner$untangle$start: [{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$untangle$mb: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"dm","d":{"t":"any"},"opt":false},{"name":"b2","d":{"t":"any"},"opt":false}],
  inner$untangle$mb$$step: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"any"},"opt":false},{"name":"b2","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$scan: [{"name":"masked","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$lits: [{"name":"masked","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$lits$$step: [{"name":"runs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$hoistStrings$takeName$n: [{"name":"seen","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$k: [{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$hoistStrings$argPrefix: [{"name":"masked","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$hoistStrings$argPrefix$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$hoistStrings$nm: [{"name":"masked","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$hoistStrings$nm$$step: [{"name":"argPrefix","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$dp: [{"name":"masked","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$hoistStrings$dp$$step: [{"name":"argPrefix","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$wantsConst: [{"name":"fb","d":{"t":"any"},"opt":false},{"name":"masked","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"isDefault","d":{"t":"bool"},"opt":false}],
  inner$hoistStrings$wantsConst$$step: [{"name":"fb","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"isDefault","d":{"t":"bool"},"opt":false}],
  inner$hoistStrings$parts: [{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$hoistStrings$eq: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"or","of":[{"t":"obj","p":[["start",{"t":"any"},false],["len",{"t":"num"},false],["text",{"t":"any"},false],["isDefault",{"t":"undef"},true]]},{"t":"obj","p":[["start",{"t":"any"},false],["len",{"t":"num"},false],["text",{"t":"str"},false],["isDefault",{"t":"bool"},false]]}]},"opt":false}],
  inner$stripConstOn$propWord: [{"name":"propNames","d":{"t":"any"},"opt":false}],
  inner$stripConstOn$end: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"dm","d":{"t":"any"},"opt":false}],
  inner$stripConstOn$rel: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$stripConstOn$open: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$stripConstOn$open$$step: [{"name":"cm","d":{"t":"any"},"opt":false},{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$stripConstOn$closeCh: [{"name":"openCh","d":{"t":"any"},"opt":false}],
  inner$flattenModels$fdecl: [{"name":"R","d":{"t":"any"},"opt":false},{"name":"code","d":{"t":"any"},"opt":false}],
  inner$flattenModels$before: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"um","d":{"t":"any"},"opt":false}],
  inner$flattenModels$after: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false},{"name":"um","d":{"t":"any"},"opt":false}],
  inner$flattenModels$mm: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false},{"name":"um","d":{"t":"any"},"opt":false}],
  inner$flattenModels$mm$$step: [{"name":"after","d":{"t":"any"},"opt":false}],
  inner$flattenModels$t: [{"name":"v","d":{"t":"any"},"opt":false},{"name":"mf","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false},{"name":"um","d":{"t":"any"},"opt":false}],
  inner$flattenModels$t$$step: [{"name":"mf","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$injectProps$props: [{"name":"allProps","d":{"t":"any"},"opt":false}],
  inner$injectProps$decls: [{"name":"allProps","d":{"t":"any"},"opt":false}],
  inner$injectProps$decls$$step: [{"name":"props","d":{"t":"any"},"opt":false}],
  inner$injectProps$params: [{"name":"allProps","d":{"t":"any"},"opt":false}],
  inner$injectProps$params$$step: [{"name":"props","d":{"t":"any"},"opt":false}],
  inner$injectProps$ctorRe: [{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$injectProps$cm: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$injectProps$cm$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"ctorRe","d":{"t":"any"},"opt":false}],
  inner$injectProps$j: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$injectProps$j$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$injectProps$plist: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$injectProps$plist$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$injectProps$end: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$injectProps$end$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$injectProps$brace: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$injectProps$brace$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$injectProps$openBrace: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$threadProps$invRe: [{"name":"target","d":{"t":"any"},"opt":false}],
  inner$threadProps$j: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$threadProps$argText: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$threadProps$argText$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$threadProps$seg$mm: [{"name":"argText","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$threadProps$missing: [{"name":"target","d":{"t":"any"},"opt":false},{"name":"given","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$threadProps$tt: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false}],
  inner$threadProps$tt$$step: [{"name":"argText","d":{"t":"any"},"opt":false}],
  inner$threadProps$insert: [{"name":"target","d":{"t":"any"},"opt":false},{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"open","d":{"t":"num"},"opt":false},{"name":"given","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$threadProps$insert$$step: [{"name":"missing","d":{"t":"any"},"opt":false},{"name":"tt","d":{"t":"any"},"opt":false}],
  inner$hoistAllConst$replace$parts: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$ctorPositionals$d$$after_loop: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$ctorPositionals$j$$after_loop: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$purposeOf$named$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"litStart","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$untangle$d$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$untangle$j$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$runs$$after_loop: [{"name":"masked","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$cur$$after_loop: [{"name":"masked","d":{"t":"any"},"opt":false}],
  inner$hoistStrings$d$$after_loop: [{"name":"masked","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$hoistStrings$k$$after_loop: [{"name":"masked","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["value",{"t":"str"},false],["start",{"t":"any"},false],["end",{"t":"any"},false],["parts",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$stripConstOn$d$$after_loop: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"any"},"opt":false}],
  inner$stripConstOn$j$$after_loop: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"any"},"opt":false}],
  inner$stripConstOn$inS$$after_loop: [{"name":"out","d":{"t":"any"},"opt":false},{"name":"cm","d":{"t":"any"},"opt":false},{"name":"openCh","d":{"t":"any"},"opt":false}],
  inner$injectProps$d$$after_loop: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$injectProps$j$$after_loop: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$injectProps$inS$$after_loop: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$threadProps$d$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$threadProps$j$$after_loop: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
