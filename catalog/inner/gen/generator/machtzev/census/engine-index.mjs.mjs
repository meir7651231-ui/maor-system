// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/census/engine-index.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const BOILER = /^(#!|(?:\/\/|#)\s*[═─=-]{3,}|\/\*|\*\/|\*\s*$|set -[a-z]+)/;
function purposeFromHeader(src) {
    // Python: ‏docstring-המודול הוא **המטרה המוצהרת** (כמו כותרת-הבלוק ב-mjs)
    const ds = src.match(/^\s*(?:"""|''')([\s\S]{2,600}?)(?:"""|''')/);
    // 🔴 היה כאן `/[א-ת]/` — דרישת-עברית שזרקה **67 מנועים מתועדים באנגלית**
    // (‏minisql · buildsmart/functions · scripts). תיעוד הוא תיעוד בכל שפה;
    // הסינון צריך להיות על **בוילרפלייט**, לא על אלפבית (נמדד).
    if (ds && ds[1].trim().replace(/[\s─═=*-]+/g, '').length >= 12)
        return ds[1].replace(/\s+/g, ' ').trim().slice(0, 420);
    const lines = src.split('\n');
    const buf = [];
    for (const raw of lines.slice(0, 40)) {
        const l = raw.trim();
        if (!l) {
            if (buf.length)
                break;
            continue;
        }
        if (/^(import|export|const|let|function|class)\b/.test(l))
            break;
        if (BOILER.test(l))
            continue;
        const t = l.replace(/^\/\/\s?/, '').replace(/^#\s?/, '').replace(/^\*\s?/, '').replace(/^\/\*\*?\s?/, '').trim();
        if (t)
            buf.push(t);
        if (buf.join(' ').length > 400)
            break;
    }
    const text = buf.join(' ').replace(/\s+/g, ' ').trim();
    // אותו תיקון: מספיק תוכן-אמת (בלי קווי-הפרדה), בכל שפה
    if (!text || text.replace(/[\s─═=*-]+/g, '').length < 12)
        return null;
    return text.slice(0, 420);
}
const uniq = (a) => [...new Set(a)].filter(Boolean);
const W = (x) => String(x).toLowerCase().split(/[^a-z0-9\u0590-\u05FF]+/).filter((w) => w.length >= 2);
const GEN_ENTRY = [
    'machtzev/generator/app-ds.mjs', 'machtzev/generator/regen.mjs', 'machtzev/generator/ship.mjs',
    'machtzev/generator/genesis-gen.mjs', 'machtzev/generator/app-from-sentences.mjs', 'machtzev/generator/balagan.mjs',
];
export function inner$directionOf$m(src) {
    const m = String(src).slice(0, 6000).match(/⇄\s*כיוון:\s*([^\n]*?)\s*⇒\s*([^\n·]*?)\s*·\s*הפוך:\s*([^\n]*)/);
    return m;
}
export function inner$directionOf$rv(src) {
    const m = String(src).slice(0, 6000).match(/⇄\s*כיוון:\s*([^\n]*?)\s*⇒\s*([^\n·]*?)\s*·\s*הפוך:\s*([^\n]*)/);
    const rv = m[3].trim();
    return rv;
}
export function inner$directionOf$rv$$step(m) {
    const rv = m[3].trim();
    return rv;
}
export function inner$purposeFromHeader$ds(src) {
    const ds = src.match(/^\s*(?:"""|''')([\s\S]{2,600}?)(?:"""|''')/);
    return ds;
}
export function inner$purposeFromHeader$lines(src) {
    const lines = src.split('\n');
    return lines;
}
export function inner$purposeFromHeader$l(raw) {
    const l = raw.trim();
    return l;
}
export function inner$purposeFromHeader$t(raw) {
    const l = raw.trim();
    const t = l.replace(/^\/\/\s?/, '').replace(/^#\s?/, '').replace(/^\*\s?/, '').replace(/^\/\*\*?\s?/, '').trim();
    return t;
}
export function inner$purposeFromHeader$t$$step(l) {
    const t = l.replace(/^\/\/\s?/, '').replace(/^#\s?/, '').replace(/^\*\s?/, '').replace(/^\/\*\*?\s?/, '').trim();
    return t;
}
export function inner$purposeFromHeader$text(src) {
    const lines = src.split('\n');
    const buf = [];
    for (const raw of lines.slice(0, 40)) {
        const l = raw.trim();
        if (!l) {
            if (buf.length)
                break;
            continue;
        }
        if (/^(import|export|const|let|function|class)\b/.test(l))
            break;
        if (BOILER.test(l))
            continue;
        const t = l.replace(/^\/\/\s?/, '').replace(/^#\s?/, '').replace(/^\*\s?/, '').replace(/^\/\*\*?\s?/, '').trim();
        if (t)
            buf.push(t);
        if (buf.join(' ').length > 400)
            break;
    }
    const text = buf.join(' ').replace(/\s+/g, ' ').trim();
    return text;
}
export function inner$purposeFromHeader$text$$step(buf) {
    const text = buf.join(' ').replace(/\s+/g, ' ').trim();
    return text;
}
export function inner$indexRows$c(l) {
    const c = l.split('|');
    return c;
}
export function inner$indexRows$files(l) {
    const c = l.split('|');
    const files = [...String(c[1] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    return files;
}
export function inner$indexRows$files$$step(c) {
    const files = [...String(c[1] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    return files;
}
export function inner$build$d(m) {
    const d = m[1].replace(/^\.\//, '');
    return d;
}
export function inner$build$lit(m) {
    const lit = m[1].match(/['"`]([A-Za-z0-9_./-]+)['"`]/);
    return lit;
}
export function inner$build$d_L236(m) {
    const lit = m[1].match(/['"`]([A-Za-z0-9_./-]+)['"`]/);
    const d = lit[1].replace(/^\.\//, '').replace(/\/$/, '');
    return d;
}
export function inner$build$d_L236$$step(lit) {
    const d = lit[1].replace(/^\.\//, '').replace(/\/$/, '');
    return d;
}
export function inner$build$fromMach(p) {
    const fromMach = p.replace(/^machtzev\//, '');
    return fromMach;
}
export function inner$build$row(IDX, p, base) {
    const fromMach = p.replace(/^machtzev\//, '');
    const row = IDX.find((r) => r.files.some((f) => f === fromMach || f === base || f.endsWith('/' + base)));
    return row;
}
export function inner$build$row$$step(IDX, base, fromMach) {
    const row = IDX.find((r) => r.files.some((f) => f === fromMach || f === base || f.endsWith('/' + base)));
    return row;
}
export function inner$build$head(src) {
    const head = purposeFromHeader(src);
    return head;
}
export function inner$build$purpose(IDX, p, src, base, res) {
    const fromMach = p.replace(/^machtzev\//, '');
    const row = IDX.find((r) => r.files.some((f) => f === fromMach || f === base || f.endsWith('/' + base)));
    const head = purposeFromHeader(src);
    const purpose = head || (row ? row.purpose : null) || (res ? res.purpose : null);
    return purpose;
}
export function inner$build$purpose$$step(row, head, res) {
    const purpose = head || (row ? row.purpose : null) || (res ? res.purpose : null);
    return purpose;
}
export function inner$build$purposeFrom(IDX, p, src, base, res) {
    const fromMach = p.replace(/^machtzev\//, '');
    const row = IDX.find((r) => r.files.some((f) => f === fromMach || f === base || f.endsWith('/' + base)));
    const head = purposeFromHeader(src);
    const purposeFrom = head ? 'כותרת-הקובץ' : row ? 'INDEX.md' : res ? 'נחקר (+evidence)' : null;
    return purposeFrom;
}
export function inner$build$purposeFrom$$step(row, head, res) {
    const purposeFrom = head ? 'כותרת-הקובץ' : row ? 'INDEX.md' : res ? 'נחקר (+evidence)' : null;
    return purposeFrom;
}
export function inner$build$asPolice(p) {
    const fromMach = p.replace(/^machtzev\//, '');
    const asPolice = p.startsWith('machtzev/') ? fromMach : p.startsWith('yeshiva/') ? '../' + p : null;
    return asPolice;
}
export function inner$build$asPolice$$step(p, fromMach) {
    const asPolice = p.startsWith('machtzev/') ? fromMach : p.startsWith('yeshiva/') ? '../' + p : null;
    return asPolice;
}
export function inner$build$g(police, p) {
    const fromMach = p.replace(/^machtzev\//, '');
    const asPolice = p.startsWith('machtzev/') ? fromMach : p.startsWith('yeshiva/') ? '../' + p : null;
    const g = asPolice ? police.match(new RegExp(`gate(?:Dirty)?\\('([a-z-]+)',\\s*'${asPolice.replace(/[.\/]/g, (c) => '\\' + c)}'`)) : null;
    return g;
}
export function inner$build$g$$step(police, asPolice) {
    const g = asPolice ? police.match(new RegExp(`gate(?:Dirty)?\\('([a-z-]+)',\\s*'${asPolice.replace(/[.\/]/g, (c) => '\\' + c)}'`)) : null;
    return g;
}
export function inner$build$gate(police, p) {
    const fromMach = p.replace(/^machtzev\//, '');
    const asPolice = p.startsWith('machtzev/') ? fromMach : p.startsWith('yeshiva/') ? '../' + p : null;
    const g = asPolice ? police.match(new RegExp(`gate(?:Dirty)?\\('([a-z-]+)',\\s*'${asPolice.replace(/[.\/]/g, (c) => '\\' + c)}'`)) : null;
    const gate = g ? g[1] : null;
    return gate;
}
export function inner$build$gate$$step(g) {
    const gate = g ? g[1] : null;
    return gate;
}
export function inner$build$gateRow(police, gates, p) {
    const fromMach = p.replace(/^machtzev\//, '');
    const asPolice = p.startsWith('machtzev/') ? fromMach : p.startsWith('yeshiva/') ? '../' + p : null;
    const g = asPolice ? police.match(new RegExp(`gate(?:Dirty)?\\('([a-z-]+)',\\s*'${asPolice.replace(/[.\/]/g, (c) => '\\' + c)}'`)) : null;
    const gate = g ? g[1] : null;
    const gateRow = gate && new RegExp(`^${gate}\\t`, 'm').test(gates);
    return gateRow;
}
export function inner$build$gateRow$$step(gates, gate) {
    const gateRow = gate && new RegExp(`^${gate}\\t`, 'm').test(gates);
    return gateRow;
}
export function inner$build$byPath(engines) {
    const byPath = new Map(engines.map((e) => [e.file, e]));
    return byPath;
}
export function inner$build$t(engines, tgt) {
    const byPath = new Map(engines.map((e) => [e.file, e]));
    const t = byPath.get(tgt);
    return t;
}
export function inner$build$t$$step(byPath, tgt) {
    const t = byPath.get(tgt);
    return t;
}
export function inner$findDirection$m(q) {
    const m = String(q).split(/\s*⇒\s*/);
    return m;
}
export function inner$findDirection$hit$A(a) {
    const A = W(a);
    return A;
}
export function inner$findDirection$hit$B(b) {
    const B = W(b);
    return B;
}
export function inner$find$docs(engines) {
    const docs = engines.filter((e) => e.purpose);
    return docs;
}
export function inner$find$out(k, scored) {
    const out = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
    return out;
}
export function inner$find$blind(engines) {
    const docs = engines.filter((e) => e.purpose);
    const blind = engines.length - docs.length;
    return blind;
}
export function inner$find$blind$$step(engines, docs) {
    const blind = engines.length - docs.length;
    return blind;
}
export function inner$connected$byFile(engines) {
    const byFile = new Map(engines.map((e) => [e.file, e]));
    return byFile;
}
export function inner$connected$entries(engines, extraEntry) {
    const byFile = new Map(engines.map((e) => [e.file, e]));
    const entries = uniq([...GEN_ENTRY, ...extraEntry]).filter((x) => byFile.has(x));
    return entries;
}
export function inner$connected$entries$$step(extraEntry, byFile) {
    const entries = uniq([...GEN_ENTRY, ...extraEntry]).filter((x) => byFile.has(x));
    return entries;
}
export function inner$connected$b(e) {
    const b = e.file.replace(/^machtzev\//, '');
    return b;
}
export function inner$connected$none(engines, extraEntry, forward) {
    const byFile = new Map(engines.map((e) => [e.file, e]));
    const entries = uniq([...GEN_ENTRY, ...extraEntry]).filter((x) => byFile.has(x));
    const reverse = new Map();
    for (const ent of entries) {
        const seen = new Set([ent]);
        const q = [ent];
        while (q.length) {
            const c = q.shift();
            for (const parent of (byFile.get(c)?.importedBy || [])) {
                if (seen.has(parent))
                    continue;
                seen.add(parent);
                q.push(parent);
                if (!reverse.has(parent))
                    reverse.set(parent, ent);
            }
        }
    }
    const none = new Set(engines.filter((e) => !forward.has(e.file) && !reverse.has(e.file)).map((e) => e.file));
    return none;
}
export function inner$connected$none$$step(engines, forward, reverse) {
    const none = new Set(engines.filter((e) => !forward.has(e.file) && !reverse.has(e.file)).map((e) => e.file));
    return none;
}
export function inner$purposeFromHeader$buf$$after_loop(src) {
    const lines = src.split('\n');
    const buf = [];
    for (const raw of lines.slice(0, 40)) {
        const l = raw.trim();
        if (!l) {
            if (buf.length)
                break;
            continue;
        }
        if (/^(import|export|const|let|function|class)\b/.test(l))
            break;
        if (BOILER.test(l))
            continue;
        const t = l.replace(/^\/\/\s?/, '').replace(/^#\s?/, '').replace(/^\*\s?/, '').replace(/^\/\*\*?\s?/, '').trim();
        if (t)
            buf.push(t);
        if (buf.join(' ').length > 400)
            break;
    }
    return buf;
}
export function inner$indexRows$rows$$after_loop(md) {
    const rows = [];
    for (const l of md.split('\n')) {
        if (!/^\|\s*`/.test(l))
            continue;
        const c = l.split('|');
        const files = [...String(c[1] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
        rows.push({ files, purpose: String(c[2] || '').trim() });
    }
    return rows;
}
export function inner$connected$reverse$$after_loop(engines, extraEntry) {
    const byFile = new Map(engines.map((e) => [e.file, e]));
    const entries = uniq([...GEN_ENTRY, ...extraEntry]).filter((x) => byFile.has(x));
    const reverse = new Map();
    for (const ent of entries) {
        const seen = new Set([ent]);
        const q = [ent];
        while (q.length) {
            const c = q.shift();
            for (const parent of (byFile.get(c)?.importedBy || [])) {
                if (seen.has(parent))
                    continue;
                seen.add(parent);
                q.push(parent);
                if (!reverse.has(parent))
                    reverse.set(parent, ent);
            }
        }
    }
    return reverse;
}

export const SIGS = {
  inner$directionOf$m: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$directionOf$rv: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$directionOf$rv$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$purposeFromHeader$ds: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$purposeFromHeader$lines: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$purposeFromHeader$l: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$purposeFromHeader$t: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$purposeFromHeader$t$$step: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$purposeFromHeader$text: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$purposeFromHeader$text$$step: [{"name":"buf","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$indexRows$c: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$indexRows$files: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$indexRows$files$$step: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$build$d: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$build$lit: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$build$d_L236: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$build$d_L236$$step: [{"name":"lit","d":{"t":"any"},"opt":false}],
  inner$build$fromMach: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$build$row: [{"name":"IDX","d":{"t":"arr","of":{"t":"obj","p":[["files",{"t":"arr","of":{"t":"str"}},false],["purpose",{"t":"str"},false]]}},"opt":false},{"name":"p","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
  inner$build$row$$step: [{"name":"IDX","d":{"t":"arr","of":{"t":"obj","p":[["files",{"t":"arr","of":{"t":"str"}},false],["purpose",{"t":"str"},false]]}},"opt":false},{"name":"base","d":{"t":"any"},"opt":false},{"name":"fromMach","d":{"t":"any"},"opt":false}],
  inner$build$head: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$build$purpose: [{"name":"IDX","d":{"t":"arr","of":{"t":"obj","p":[["files",{"t":"arr","of":{"t":"str"}},false],["purpose",{"t":"str"},false]]}},"opt":false},{"name":"p","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false},{"name":"res","d":{"t":"any"},"opt":false}],
  inner$build$purpose$$step: [{"name":"row","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["files",{"t":"arr","of":{"t":"str"}},false],["purpose",{"t":"str"},false]]}]},"opt":false},{"name":"head","d":{"t":"any"},"opt":false},{"name":"res","d":{"t":"any"},"opt":false}],
  inner$build$purposeFrom: [{"name":"IDX","d":{"t":"arr","of":{"t":"obj","p":[["files",{"t":"arr","of":{"t":"str"}},false],["purpose",{"t":"str"},false]]}},"opt":false},{"name":"p","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false},{"name":"res","d":{"t":"any"},"opt":false}],
  inner$build$purposeFrom$$step: [{"name":"row","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["files",{"t":"arr","of":{"t":"str"}},false],["purpose",{"t":"str"},false]]}]},"opt":false},{"name":"head","d":{"t":"any"},"opt":false},{"name":"res","d":{"t":"any"},"opt":false}],
  inner$build$asPolice: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$build$asPolice$$step: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"fromMach","d":{"t":"any"},"opt":false}],
  inner$build$g: [{"name":"police","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$build$g$$step: [{"name":"police","d":{"t":"any"},"opt":false},{"name":"asPolice","d":{"t":"any"},"opt":false}],
  inner$build$gate: [{"name":"police","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$build$gate$$step: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$build$gateRow: [{"name":"police","d":{"t":"any"},"opt":false},{"name":"gates","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$build$gateRow$$step: [{"name":"gates","d":{"t":"any"},"opt":false},{"name":"gate","d":{"t":"any"},"opt":false}],
  inner$build$byPath: [{"name":"engines","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$build$t: [{"name":"engines","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"tgt","d":{"t":"any"},"opt":false}],
  inner$build$t$$step: [{"name":"byPath","d":{"t":"map","k":{"t":"any"},"v":{"t":"obj","p":[["file",{"t":"any"},false],["lang",{"t":"str"},false],["lines",{"t":"any"},false],["purpose",{"t":"any"},false],["purposeFrom",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["direction",{"t":"any"},false],["exports",{"t":"arr","of":{"t":"any"}},false],["cli",{"t":"arr","of":{"t":"any"}},false],["writes",{"t":"arr","of":{"t":"any"}},false],["reads",{"t":"arr","of":{"t":"any"}},false],["imports",{"t":"arr","of":{"t":"any"}},false],["importsDyn",{"t":"arr","of":{"t":"any"}},false],["importedBy",{"t":"arr","of":{"t":"undef"}},false],["gate",{"t":"any"},false],["gateRegistered",{"t":"bool"},false],["calledByName",{"t":"arr","of":{"t":"any"}},false],["runnable",{"t":"bool"},false],["inIndexMd",{"t":"bool"},false]]}},"opt":false},{"name":"tgt","d":{"t":"any"},"opt":false}],
  inner$findDirection$m: [{"name":"q","d":{"t":"any"},"opt":false}],
  inner$findDirection$hit$A: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$findDirection$hit$B: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$find$docs: [{"name":"engines","d":{"t":"any"},"opt":false}],
  inner$find$out: [{"name":"k","d":{"t":"num"},"opt":false},{"name":"scored","d":{"t":"any"},"opt":false}],
  inner$find$blind: [{"name":"engines","d":{"t":"any"},"opt":false}],
  inner$find$blind$$step: [{"name":"engines","d":{"t":"any"},"opt":false},{"name":"docs","d":{"t":"any"},"opt":false}],
  inner$connected$byFile: [{"name":"engines","d":{"t":"any"},"opt":false}],
  inner$connected$entries: [{"name":"engines","d":{"t":"any"},"opt":false},{"name":"extraEntry","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$connected$entries$$step: [{"name":"extraEntry","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"byFile","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$connected$b: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$connected$none: [{"name":"engines","d":{"t":"any"},"opt":false},{"name":"extraEntry","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"forward","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$connected$none$$step: [{"name":"engines","d":{"t":"any"},"opt":false},{"name":"forward","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"reverse","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$purposeFromHeader$buf$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$indexRows$rows$$after_loop: [{"name":"md","d":{"t":"any"},"opt":false}],
  inner$connected$reverse$$after_loop: [{"name":"engines","d":{"t":"any"},"opt":false},{"name":"extraEntry","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
