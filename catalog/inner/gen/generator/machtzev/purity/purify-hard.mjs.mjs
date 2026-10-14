// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/purify-hard.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const balancedIdx = (s, i) => {
    const open = s[i], close = { '(': ')', '{': '}', '[': ']' }[open];
    let d = 0, str = null;
    for (let j = i; j < s.length; j++) {
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
function replaceInlineSnap(t, aliasRe, litObj) {
    // רענון-צילום מאוזן: מאתרים 'const <alias> = {' ומחליפים עד הסוגר-התואם (לא רגקס-עצל)
    const m = t.match(new RegExp('const (' + aliasRe + ') = \\{'));
    if (!m)
        return null;
    const ob = t.indexOf('{', m.index);
    let d = 0, j = ob, str = null;
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
    if (j >= t.length)
        return null;
    const end = t[j + 1] === ';' ? j + 2 : j + 1;
    return t.slice(0, m.index) + 'const ' + m[1] + ' = ' + litObj + ';' + t.slice(end);
}
export function inner$model$isExp(ts, st) {
    const isExp = (st.modifiers || []).some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    return isExp;
}
export function inner$model$valueExports() {
    const exported = [];
    const valueExports = exported.filter(e => !e.isFn);
    return valueExports;
}
export function inner$model$valueExports$$step(exported) {
    const valueExports = exported.filter(e => !e.isFn);
    return valueExports;
}
export function inner$collectSites$walk$chunk$raw(src, t, at) {
    const raw = src.slice(at, t.end);
    return raw;
}
export function inner$collectSites$walk$chunk$suffix(src, t, at) {
    const raw = src.slice(at, t.end);
    const suffix = raw.endsWith('${') ? '${' : '`';
    return suffix;
}
export function inner$collectSites$walk$chunk$suffix$$step(raw) {
    const suffix = raw.endsWith('${') ? '${' : '`';
    return suffix;
}
export function inner$collectSites$walk$val(n) {
    const val = parseFloat(n.text.replace(/_/g, ''));
    return val;
}
export function inner$collectSites$walk$siteNode(n, p, neg) {
    const siteNode = neg ? p : n;
    return siteNode;
}
export function inner$callGraph$names(mo) {
    const names = new Set([...mo.exported, ...mo.helpers].filter(x => x.isFn).map(x => x.name));
    return names;
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
export function inner$purifyHard$base(file) {
    const base = file.replace(/\.mjs$/, '');
    return base;
}
export function inner$purifyHard$dataBase(file) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    return dataBase;
}
export function inner$purifyHard$dataBase$$step(base) {
    const dataBase = base + '-strings';
    return dataBase;
}
export function inner$purifyHard$valNeed(sites) {
    const valNeed = new Set(sites.filter(st => st.own.kind === 'val').map(st => st.own.name));
    return valNeed;
}
export function inner$purifyHard$walkU$ve(mo, n) {
    const ve = mo.valueExports.find(x => x.name === n.text);
    return ve;
}
export function inner$purifyHard$walkU$ex(mo, up) {
    const ex = mo.exported.find(e => e.node && up === e.node);
    return ex;
}
export function inner$purifyHard$walkU$hp(mo, up) {
    const hp = mo.helpers.find(h => h.node && up === h.node);
    return hp;
}
export function inner$purifyHard$walkR$ex(mo, up) {
    const ex = mo.exported.find(e => e.node && up === e.node);
    return ex;
}
export function inner$purifyHard$walkR$hp(mo, up) {
    const hp = mo.helpers.find(x => x.node && up === x.node);
    return hp;
}
export function inner$purifyHard$walkR$vv(mo, up) {
    const vv = (mo.valueExports || []).find(x => x.decl && up === x.decl);
    return vv;
}
export function inner$purifyHard$topOnly(sites) {
    const topOnly = sites.filter(st => st.own.kind === 'top');
    return topOnly;
}
export function inner$purifyHard$i(sites) {
    let i = sites.length - 1;
    return i;
}
export function inner$purifyHard$hh(mo, h) {
    const hh = mo.helpers.find(x => x.name === h);
    return hh;
}
export function inner$purifyHard$stack(calls, e) {
    const stack = [...(calls.get(e.name) || [])];
    return stack;
}
export function inner$purifyHard$e0(mo, expNeed) {
    const e0 = mo.exported.find(e => expNeed.has(e.name)) || mo.exported[0];
    return e0;
}
export function inner$purifyHard$eqAt(src, st) {
    const eqAt = src.lastIndexOf('=', st.at);
    return eqAt;
}
export function inner$purifyHard$widen$openAt(src, ps) {
    const openAt = src.lastIndexOf('(', ps.pos);
    return openAt;
}
export function inner$purifyHard$widen$closeAt(src, ps) {
    const openAt = src.lastIndexOf('(', ps.pos);
    const closeAt = balancedIdx(src, openAt);
    return closeAt;
}
export function inner$purifyHard$widen$closeAt$$step(src, openAt) {
    const closeAt = balancedIdx(src, openAt);
    return closeAt;
}
export function inner$purifyHard$widen$hasTrail(src, ps) {
    const hasTrail = src.slice(0, ps.end).trimEnd().endsWith(',');
    return hasTrail;
}
export function inner$purifyHard$ve(mo, vn) {
    const ve = mo.valueExports.find(x => x.name === vn);
    return ve;
}
export function inner$purifyHard$d(mo, vn) {
    const ve = mo.valueExports.find(x => x.name === vn);
    const d = ve.decl.declarationList.declarations.find(dd => dd.name.text === vn);
    return d;
}
export function inner$purifyHard$d$$step(vn, ve) {
    const d = ve.decl.declarationList.declarations.find(dd => dd.name.text === vn);
    return d;
}
export function inner$purifyHard$factory(vn) {
    const factory = 'make' + vn.charAt(0).toUpperCase() + vn.slice(1);
    return factory;
}
export function inner$purifyHard$CONST(file) {
    const base = file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    return CONST;
}
export function inner$purifyHard$CONST$$step(base) {
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    return CONST;
}
export function inner$purifyHard$litObj(keys, tblKeyOf) {
    const litObj = '{\n' + [...keys].map(([v, k]) => {
        const tb = typeof v === 'string' && v.startsWith('__tbl__') ? tblKeyOf.get(v.slice(7)) : null;
        return `  ${k}: ${JSON.stringify(tb ? tb.value : v)},`;
    }).join('\n') + '\n}';
    return litObj;
}
export function inner$purifyHard$map$tb(tblKeyOf, v) {
    const tb = typeof v === 'string' && v.startsWith('__tbl__') ? tblKeyOf.get(v.slice(7)) : null;
    return tb;
}
export function inner$purifyHard$dataSrc(file, keys, tblKeyOf) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const litObj = '{\n' + [...keys].map(([v, k]) => {
        const tb = typeof v === 'string' && v.startsWith('__tbl__') ? tblKeyOf.get(v.slice(7)) : null;
        return `  ${k}: ${JSON.stringify(tb ? tb.value : v)},`;
    }).join('\n') + '\n}';
    const dataSrc = `/** אטום-דאטה · ${dataBase} — מחרוזות-הדאטה של ${base} (מנוע-הקשיחים, הכרעה 19). חוזה: ${dataBase}.contract.md */\nexport const ${CONST} = ${litObj};\n`;
    return dataSrc;
}
export function inner$purifyHard$dataSrc$$step(base, dataBase, CONST, litObj) {
    const dataSrc = `/** אטום-דאטה · ${dataBase} — מחרוזות-הדאטה של ${base} (מנוע-הקשיחים, הכרעה 19). חוזה: ${dataBase}.contract.md */\nexport const ${CONST} = ${litObj};\n`;
    return dataSrc;
}
export function inner$purifyHard$contract(file, tParam) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const contract = `# חוזה · ${dataBase}\nמחרוזות-דאטה (עברית/דומיין — כולל מפתחות וברירות-מחדל) שחולצו מכנית מ-${base} (הכרעה 19).\nהמנגנון מקבל אותן בשקע ${tParam}, מושחל גם דרך עוזרי-הקובץ; הקוראים כורכים. אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyHard$contract$$step(base, dataBase, tParam) {
    const contract = `# חוזה · ${dataBase}\nמחרוזות-דאטה (עברית/דומיין — כולל מפתחות וברירות-מחדל) שחולצו מכנית מ-${base} (הכרעה 19).\nהמנגנון מקבל אותן בשקע ${tParam}, מושחל גם דרך עוזרי-הקובץ; הקוראים כורכים. אפס לוגיקה.\n\n## דוגמאות-זהב\nצילום-ערך ב-${dataBase}.test.mjs.\n`;
    return contract;
}
export function inner$purifyHard$testSrc(file, keys, tblKeyOf) {
    const base = file.replace(/\.mjs$/, '');
    const dataBase = base + '-strings';
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const testSrc = `// בדיקת-צילום · ${dataBase} — המחרוזות זהות ביט-אחר-ביט למקור.\nimport { ${CONST} } from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify(${CONST}), ${JSON.stringify(JSON.stringify(Object.fromEntries([...keys].map(([v, k]) => [k, (typeof v === 'string' && v.startsWith('__tbl__')) ? tblKeyOf.get(v.slice(7)).value : v]))))});\nconsole.log('OK ${dataBase}');\n`;
    return testSrc;
}
export function inner$purifyHard$testSrc$$step(dataBase, keys, tblKeyOf, CONST) {
    const testSrc = `// בדיקת-צילום · ${dataBase} — המחרוזות זהות ביט-אחר-ביט למקור.\nimport { ${CONST} } from './${dataBase}.mjs';\nimport assert from 'node:assert';\nassert.strictEqual(JSON.stringify(${CONST}), ${JSON.stringify(JSON.stringify(Object.fromEntries([...keys].map(([v, k]) => [k, (typeof v === 'string' && v.startsWith('__tbl__')) ? tblKeyOf.get(v.slice(7)).value : v]))))});\nconsole.log('OK ${dataBase}');\n`;
    return testSrc;
}
export function inner$purifyHard$dAlias(file) {
    const base = file.replace(/\.mjs$/, '');
    const dAlias = `__d_${base.replace(/-/g, '_')}_T`;
    return dAlias;
}
export function inner$purifyHard$dAlias$$step(base) {
    const dAlias = `__d_${base.replace(/-/g, '_')}_T`;
    return dAlias;
}
export function inner$purifyHard$im(file, t) {
    const base = file.replace(/\.mjs$/, '');
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['"])([^'"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return im;
}
export function inner$purifyHard$im$$step(base, t) {
    const im = t.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(['"])([^'"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return im;
}
export function inner$purifyHard$nsm(file, t) {
    const base = file.replace(/\.mjs$/, '');
    const nsm = t.match(new RegExp(`import\\s*\\*\\s*as\\s+(\\w+)\\s+from\\s*(['"])([^'"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return nsm;
}
export function inner$purifyHard$nsm$$step(base, t) {
    const nsm = t.match(new RegExp(`import\\s*\\*\\s*as\\s+(\\w+)\\s+from\\s*(['"])([^'"]*\\/${base}\\.mjs)\\2\\s*;?`));
    return nsm;
}
export function inner$purifyHard$hid(nsName) {
    const hid = `__ns_${nsName}`;
    return hid;
}
export function inner$purifyHard$usesFn(expNeed, t, nsName) {
    const usesFn = [...expNeed].some(fn => new RegExp(`\\b${nsName}\\.${fn}\\b`).test(t));
    return usesFn;
}
export function inner$purifyHard$renamed(file, t, nsName) {
    const base = file.replace(/\.mjs$/, '');
    const nsm = t.match(new RegExp(`import\\s*\\*\\s*as\\s+(\\w+)\\s+from\\s*(['"])([^'"]*\\/${base}\\.mjs)\\2\\s*;?`));
    const hid = `__ns_${nsName}`;
    const renamed = nsm[0].replace(new RegExp(`as\\s+${nsName}\\b`), `as ${hid}`);
    return renamed;
}
export function inner$purifyHard$renamed$$step(nsm, nsName, hid) {
    const renamed = nsm[0].replace(new RegExp(`as\\s+${nsName}\\b`), `as ${hid}`);
    return renamed;
}
export function inner$purifyHard$alias(factory) {
    const alias = `__pure_${factory}`;
    return alias;
}
export function inner$purifyHard$spec(braces, vn) {
    const spec = braces.match(new RegExp(`\\b${vn}\\b(\\s+as\\s+(\\w+))?`));
    return spec;
}
export function inner$purifyHard$alias_L457(fn) {
    const alias = `__pure_${fn}`;
    return alias;
}
export function inner$purifyHard$wre(fn) {
    const alias = `__pure_${fn}`;
    const wre = new RegExp(`(const \\w+ = \\(\\.\\.\\.a\\) => ${alias}\\(\\.\\.\\.a,[^\\n]*)\\);`);
    return wre;
}
export function inner$purifyHard$wre$$step(alias) {
    const wre = new RegExp(`(const \\w+ = \\(\\.\\.\\.a\\) => ${alias}\\(\\.\\.\\.a,[^\\n]*)\\);`);
    return wre;
}
export function inner$purifyHard$spec_L465(braces, fn) {
    const spec = braces.match(new RegExp(`\\b${fn}\\b(\\s+as\\s+(\\w+))?`));
    return spec;
}
export function inner$purifyHard$pad(arity, fn) {
    const pad = `...Array(Math.max(0, ${arity[fn]} - a.length)).fill(undefined)`;
    return pad;
}
export function inner$purifyHard$rp(file, keys, tblKeyOf, t) {
    const base = file.replace(/\.mjs$/, '');
    const CONST = base.replace(/-/g, '_').toUpperCase() + '_T';
    const litObj = '{\n' + [...keys].map(([v, k]) => {
        const tb = typeof v === 'string' && v.startsWith('__tbl__') ? tblKeyOf.get(v.slice(7)) : null;
        return `  ${k}: ${JSON.stringify(tb ? tb.value : v)},`;
    }).join('\n') + '\n}';
    const rp = replaceInlineSnap(t, `__d_[\\w]+_T|__d_\\w+_${CONST}`, litObj);
    return rp;
}
export function inner$purifyHard$rp$$step(CONST, litObj, t) {
    const rp = replaceInlineSnap(t, `__d_[\\w]+_T|__d_\\w+_${CONST}`, litObj);
    return rp;
}
export function inner$purifyHard$adj(cp) {
    const adj = cp.replace(/\.mjs$/, '.test.mjs');
    return adj;
}
export function inner$purifyHard$cnt(nu) {
    const cnt = (nu.match(/from '\.\.\/atoms\//g) || []).length;
    return cnt;
}
export function inner$purifyHard$patched(nu, at2) {
    const cnt = (nu.match(/from '\.\.\/atoms\//g) || []).length;
    const patched = at2.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyHard$patched$$step(at2, cnt) {
    const patched = at2.replace(/\.length === (\d+), 'מגן: (\d+) ייבואי-אטום([^']*)'/g, (mm, a2, b2, rest) => `.length === ${cnt}, 'מגן: ${cnt} ייבואי-אטום${rest.includes('הכרעה 19') ? rest : rest + ' — הכרעה 19'}'`);
    return patched;
}
export function inner$purifyHard$adj_L521(pp) {
    const adj = pp.replace(/\.mjs$/, '.test.mjs');
    return adj;
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

export const SIGS = {
  inner$model$isExp: [{"name":"ts","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"any"},"opt":false}],
  inner$model$valueExports: [],
  inner$model$valueExports$$step: [{"name":"exported","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$collectSites$walk$chunk$raw: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$collectSites$walk$chunk$suffix: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"at","d":{"t":"any"},"opt":false}],
  inner$collectSites$walk$chunk$suffix$$step: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$collectSites$walk$val: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$collectSites$walk$siteNode: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false},{"name":"neg","d":{"t":"any"},"opt":false}],
  inner$callGraph$names: [{"name":"mo","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$m: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$ob: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$ob$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$end: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$end$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$purifyHard$base: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyHard$dataBase: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyHard$dataBase$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyHard$valNeed: [{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyHard$walkU$ve: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$purifyHard$walkU$ex: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"up","d":{"t":"any"},"opt":false}],
  inner$purifyHard$walkU$hp: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"up","d":{"t":"any"},"opt":false}],
  inner$purifyHard$walkR$ex: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"up","d":{"t":"any"},"opt":false}],
  inner$purifyHard$walkR$hp: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"up","d":{"t":"any"},"opt":false}],
  inner$purifyHard$walkR$vv: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"up","d":{"t":"any"},"opt":false}],
  inner$purifyHard$topOnly: [{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyHard$i: [{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$purifyHard$hh: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$purifyHard$stack: [{"name":"calls","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$purifyHard$e0: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"expNeed","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$purifyHard$eqAt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"st","d":{"t":"any"},"opt":false}],
  inner$purifyHard$widen$openAt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"any"},"opt":false}],
  inner$purifyHard$widen$closeAt: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"any"},"opt":false}],
  inner$purifyHard$widen$closeAt$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"openAt","d":{"t":"any"},"opt":false}],
  inner$purifyHard$widen$hasTrail: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"any"},"opt":false}],
  inner$purifyHard$ve: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"vn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$d: [{"name":"mo","d":{"t":"obj","p":[["sf",{"t":"any"},false],["exported",{"t":"arr","of":{"t":"any"}},false],["valueExports",{"t":"arr","of":{"t":"any"}},false],["helpers",{"t":"arr","of":{"t":"any"}},false],["unsupported",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"vn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$d$$step: [{"name":"vn","d":{"t":"any"},"opt":false},{"name":"ve","d":{"t":"any"},"opt":false}],
  inner$purifyHard$factory: [{"name":"vn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$CONST: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyHard$CONST$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyHard$litObj: [{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tblKeyOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyHard$map$tb: [{"name":"tblKeyOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"v","d":{"t":"any"},"opt":false}],
  inner$purifyHard$dataSrc: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tblKeyOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyHard$dataSrc$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"litObj","d":{"t":"str"},"opt":false}],
  inner$purifyHard$contract: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"tParam","d":{"t":"any"},"opt":false}],
  inner$purifyHard$contract$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"tParam","d":{"t":"any"},"opt":false}],
  inner$purifyHard$testSrc: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tblKeyOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purifyHard$testSrc$$step: [{"name":"dataBase","d":{"t":"str"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tblKeyOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"CONST","d":{"t":"str"},"opt":false}],
  inner$purifyHard$dAlias: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$purifyHard$dAlias$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$purifyHard$im: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyHard$im$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyHard$nsm: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyHard$nsm$$step: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyHard$hid: [{"name":"nsName","d":{"t":"any"},"opt":false}],
  inner$purifyHard$usesFn: [{"name":"expNeed","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"nsName","d":{"t":"any"},"opt":false}],
  inner$purifyHard$renamed: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false},{"name":"nsName","d":{"t":"any"},"opt":false}],
  inner$purifyHard$renamed$$step: [{"name":"nsm","d":{"t":"any"},"opt":false},{"name":"nsName","d":{"t":"any"},"opt":false},{"name":"hid","d":{"t":"str"},"opt":false}],
  inner$purifyHard$alias: [{"name":"factory","d":{"t":"any"},"opt":false}],
  inner$purifyHard$spec: [{"name":"braces","d":{"t":"any"},"opt":false},{"name":"vn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$alias_L457: [{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$wre: [{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$wre$$step: [{"name":"alias","d":{"t":"str"},"opt":false}],
  inner$purifyHard$spec_L465: [{"name":"braces","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$pad: [{"name":"arity","d":{"t":"obj","n":"arity","p":[]},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$purifyHard$rp: [{"name":"file","d":{"t":"any"},"opt":false},{"name":"keys","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tblKeyOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyHard$rp$$step: [{"name":"CONST","d":{"t":"str"},"opt":false},{"name":"litObj","d":{"t":"str"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$purifyHard$adj: [{"name":"cp","d":{"t":"any"},"opt":false}],
  inner$purifyHard$cnt: [{"name":"nu","d":{"t":"any"},"opt":false}],
  inner$purifyHard$patched: [{"name":"nu","d":{"t":"any"},"opt":false},{"name":"at2","d":{"t":"any"},"opt":false}],
  inner$purifyHard$patched$$step: [{"name":"at2","d":{"t":"any"},"opt":false},{"name":"cnt","d":{"t":"any"},"opt":false}],
  inner$purifyHard$adj_L521: [{"name":"pp","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$d$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$j$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
  inner$replaceInlineSnap$str$$after_loop: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"aliasRe","d":{"t":"any"},"opt":false}],
};
