// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/retarget.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HEB = '[\\u0590-\\u05FF]';
function swapTerms(code, src, dst) {
    if (!src || !dst)
        return { code, swaps: 0 };
    const pairs = [[src.plural, dst.plural], [src.singular, dst.singular]].filter(([a, b]) => a && b && a !== b);
    let swaps = 0;
    const out = code.split('\n').map((l) => {
        const i = l.indexOf('//');
        const head = i >= 0 ? l.slice(0, i) : l, tail = i >= 0 ? l.slice(i) : '';
        const h = head.replace(/'(?:[^'\\]|\\.)*'/g, (lit) => { let x = lit; for (const [a, b] of pairs)
            x = x.replace(new RegExp(`(?<!${HEB})([הולבמשכ]?)${a}(?!${HEB})`, 'g'), (m, pre) => { swaps++; return pre + b; }); return x; });
        return h + tail;
    }).join('\n');
    return { code: out, swaps };
}
const cat = (t) => /^Id/.test(t) ? 'Id' : /IsoDate/.test(t) ? 'IsoDate' : /TimeHM/.test(t) ? 'TimeHM' : /^number/.test(t) ? 'number' : /^boolean/.test(t) ? 'boolean' : /^string/.test(t) ? 'string' : /\[\]$/.test(t) ? 'list' : /^Record</.test(t) ? 'map' : (/'/.test(t) || /^[A-Z]\w+$/.test(t)) ? 'enum' : 'other';
const guess = (v) => /^'\d{4}-\d{2}-\d{2}'$/.test(v) ? 'IsoDate' : /^'\d{2}:\d{2}'$/.test(v) ? 'TimeHM' : /^'[a-z]{1,3}\d+'$/.test(v) ? 'Id' : /^'/.test(v) ? 'string' : /^(true|false)$/.test(v) ? 'boolean' : /^-?\d/.test(v) ? 'number' : /^\[/.test(v) ? 'list' : /^\{/.test(v) ? 'map' : /^null$/.test(v) ? 'null' : '?';
const chanKind = (n) => /(^|[_-])(mail|email)([_-]|$)|mail/i.test(n) ? 'email' : /(^|[_-])(phone|tel|mobile|wa|whatsapp)([_-]|$)|phone/i.test(n) ? 'phone' : null;
const stemOf = (m) => m.replace(/^schoolos_?/, '').replace(/\.dart$/, '') || 'inventory';
function seedLists(src) {
    const out = [];
    const re = /(?:static const (\w+) = <Map<String, dynamic>>\[|'(\w+)': (?:<Map<String, dynamic>>)?\[)\s*\n(\s*)\{/g;
    for (const m of src.matchAll(re)) {
        const name = m[1] || m[2];
        let d = 0, i = m.index + m[0].lastIndexOf('[');
        for (let j = i; j < src.length; j++) {
            if (src[j] === '[')
                d++;
            else if (src[j] === ']') {
                d--;
                if (d === 0) {
                    out.push({ name, body: src.slice(i + 1, j), depth: m[3].length });
                    break;
                }
            }
        }
    }
    return out.filter((l) => l.name !== 'roleDefs');
}
function primaryKeys(src, module = '') {
    const lists = seedLists(src).map((l) => {
        const seen = new Map();
        for (const row of l.body.split('\n'))
            for (const kv of row.matchAll(/'([a-zA-Z_]\w*)':\s*((?:'(?:[^'\\]|\\.)*'|[^,}\]]+))/g)) {
                const t = guess(kv[2].trim());
                if (!seen.has(kv[1]) || seen.get(kv[1]) === 'null')
                    seen.set(kv[1], t);
            }
        const keys = [...seen].map(([key, type]) => ({ key, type }));
        const refd = keys.filter((k) => new RegExp(`\\['${k.key}'\\]`).test(src)).length;
        const rows = l.body.split('\n').filter((x) => /^\s*\{/.test(x)).length;
        return { name: l.name, keys, refd, rows };
    }).filter((l) => l.keys.length);
    if (!lists.length)
        return { name: null, keys: [] };
    const stem = stemOf(module).toLowerCase();
    lists.sort((a, b) => b.refd - a.refd || (b.name.toLowerCase() === stem) - (a.name.toLowerCase() === stem) || b.rows - a.rows);
    return { name: lists[0].name, keys: lists[0].keys, candidates: lists.map((l) => `${l.name}(${l.refd}/${l.keys.length})`) };
}
function balancedClose(s, open) { let d = 0; for (let k = open; k < s.length; k++) {
    if (s[k] === '(')
        d++;
    else if (s[k] === ')') {
        d--;
        if (d === 0)
            return k;
    }
} return -1; }
function splitTopArgs(s) { const parts = []; let d = 0, start = 0; for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if ('([{'.includes(ch))
        d++;
    else if (')]}'.includes(ch))
        d--;
    else if (ch === ',' && d === 0) {
        parts.push(s.slice(start, k));
        start = k + 1;
    }
} if (s.slice(start).trim())
    parts.push(s.slice(start)); return parts.map((x) => x.trim()); }
const blank = (n) => Array.from({ length: n }, () => "''");
const qd = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`;
const profile = (arr) => { const p = {}; for (const c of arr)
    p[c] = (p[c] || 0) + 1; return p; };
export function inner$termsFor$rows(TERMS, entity) {
    const rows = TERMS.filter((t) => t.entity === entity);
    return rows;
}
export function inner$termsFor$sing(TERMS, entity) {
    const rows = TERMS.filter((t) => t.entity === entity);
    const sing = rows.find((t) => !/s$/.test(t.key) && !/Of$/.test(t.key)) || rows[0];
    return sing;
}
export function inner$termsFor$sing$$step(rows) {
    const sing = rows.find((t) => !/s$/.test(t.key) && !/Of$/.test(t.key)) || rows[0];
    return sing;
}
export function inner$termsFor$plur(TERMS, entity) {
    const rows = TERMS.filter((t) => t.entity === entity);
    const plur = rows.find((t) => /s$/.test(t.key));
    return plur;
}
export function inner$termsFor$plur$$step(rows) {
    const plur = rows.find((t) => /s$/.test(t.key));
    return plur;
}
export function inner$sourceTerms$stem(module) {
    const stem = stemOf(module).toLowerCase();
    return stem;
}
export function inner$sourceTerms$sing(module) {
    const stem = stemOf(module).toLowerCase();
    const sing = stem.replace(/s$/, '');
    return sing;
}
export function inner$sourceTerms$sing$$step(stem) {
    const sing = stem.replace(/s$/, '');
    return sing;
}
export function inner$sourceTerms$rows(TERMS, module) {
    const stem = stemOf(module).toLowerCase();
    const sing = stem.replace(/s$/, '');
    const rows = TERMS.filter((t) => t.key === 'entity.' + sing || t.key === 'entity.' + stem);
    return rows;
}
export function inner$sourceTerms$rows$$step(TERMS, stem, sing) {
    const rows = TERMS.filter((t) => t.key === 'entity.' + sing || t.key === 'entity.' + stem);
    return rows;
}
export function inner$sourceTerms$s1(TERMS, module) {
    const stem = stemOf(module).toLowerCase();
    const sing = stem.replace(/s$/, '');
    const rows = TERMS.filter((t) => t.key === 'entity.' + sing || t.key === 'entity.' + stem);
    const s1 = rows.find((t) => t.key === 'entity.' + sing) || rows[0];
    return s1;
}
export function inner$sourceTerms$s1$$step(sing, rows) {
    const s1 = rows.find((t) => t.key === 'entity.' + sing) || rows[0];
    return s1;
}
export function inner$sourceTerms$p1(TERMS, module) {
    const stem = stemOf(module).toLowerCase();
    const sing = stem.replace(/s$/, '');
    const rows = TERMS.filter((t) => t.key === 'entity.' + sing || t.key === 'entity.' + stem);
    const p1 = rows.find((t) => t.key === 'entity.' + stem && stem !== sing);
    return p1;
}
export function inner$sourceTerms$p1$$step(stem, sing, rows) {
    const p1 = rows.find((t) => t.key === 'entity.' + stem && stem !== sing);
    return p1;
}
export function inner$swapTerms$pairs(src, dst) {
    const pairs = [[src.plural, dst.plural], [src.singular, dst.singular]].filter(([a, b]) => a && b && a !== b);
    return pairs;
}
export function inner$swapTerms$map$i(l) {
    const i = l.indexOf('//');
    return i;
}
export function inner$swapTerms$map$head(l) {
    const i = l.indexOf('//');
    const head = i >= 0 ? l.slice(0, i) : l;
    return head;
}
export function inner$swapTerms$map$head$$step(l, i) {
    const head = i >= 0 ? l.slice(0, i) : l;
    return head;
}
export function inner$swapTerms$map$tail(l) {
    const i = l.indexOf('//');
    const tail = i >= 0 ? l.slice(i) : '';
    return tail;
}
export function inner$swapTerms$map$tail$$step(l, i) {
    const tail = i >= 0 ? l.slice(i) : '';
    return tail;
}
export function inner$seedLists$i(m) {
    let i = m.index + m[0].lastIndexOf('[');
    return i;
}
export function inner$primaryKeys$lists(src) {
    const lists = seedLists(src).map((l) => {
        const seen = new Map();
        for (const row of l.body.split('\n'))
            for (const kv of row.matchAll(/'([a-zA-Z_]\w*)':\s*((?:'(?:[^'\\]|\\.)*'|[^,}\]]+))/g)) {
                const t = guess(kv[2].trim());
                if (!seen.has(kv[1]) || seen.get(kv[1]) === 'null')
                    seen.set(kv[1], t);
            }
        const keys = [...seen].map(([key, type]) => ({ key, type }));
        const refd = keys.filter((k) => new RegExp(`\\['${k.key}'\\]`).test(src)).length;
        const rows = l.body.split('\n').filter((x) => /^\s*\{/.test(x)).length;
        return { name: l.name, keys, refd, rows };
    }).filter((l) => l.keys.length);
    return lists;
}
export function inner$primaryKeys$map$t(kv) {
    const t = guess(kv[2].trim());
    return t;
}
export function inner$primaryKeys$map$keys(l) {
    const seen = new Map();
    for (const row of l.body.split('\n'))
        for (const kv of row.matchAll(/'([a-zA-Z_]\w*)':\s*((?:'(?:[^'\\]|\\.)*'|[^,}\]]+))/g)) {
            const t = guess(kv[2].trim());
            if (!seen.has(kv[1]) || seen.get(kv[1]) === 'null')
                seen.set(kv[1], t);
        }
    const keys = [...seen].map(([key, type]) => ({ key, type }));
    return keys;
}
export function inner$primaryKeys$map$keys$$step(seen) {
    const keys = [...seen].map(([key, type]) => ({ key, type }));
    return keys;
}
export function inner$primaryKeys$map$refd(src, l) {
    const seen = new Map();
    for (const row of l.body.split('\n'))
        for (const kv of row.matchAll(/'([a-zA-Z_]\w*)':\s*((?:'(?:[^'\\]|\\.)*'|[^,}\]]+))/g)) {
            const t = guess(kv[2].trim());
            if (!seen.has(kv[1]) || seen.get(kv[1]) === 'null')
                seen.set(kv[1], t);
        }
    const keys = [...seen].map(([key, type]) => ({ key, type }));
    const refd = keys.filter((k) => new RegExp(`\\['${k.key}'\\]`).test(src)).length;
    return refd;
}
export function inner$primaryKeys$map$refd$$step(src, keys) {
    const refd = keys.filter((k) => new RegExp(`\\['${k.key}'\\]`).test(src)).length;
    return refd;
}
export function inner$primaryKeys$map$rows(l) {
    const rows = l.body.split('\n').filter((x) => /^\s*\{/.test(x)).length;
    return rows;
}
export function inner$primaryKeys$stem(module) {
    const stem = stemOf(module).toLowerCase();
    return stem;
}
export function inner$mapKeys$f(fields, used, k) {
    const f = fields.find((x) => x.n === k.key && !used.has(x.n));
    return f;
}
export function inner$mapKeys$ck(k) {
    const ck = chanKind(k.key);
    return ck;
}
export function inner$mapKeys$f_L94(fields, used, k) {
    const ck = chanKind(k.key);
    const f = fields.find((x) => x.chan === ck && !used.has(x.n));
    return f;
}
export function inner$mapKeys$f_L94$$step(fields, used, ck) {
    const f = fields.find((x) => x.chan === ck && !used.has(x.n));
    return f;
}
export function inner$mapKeys$cands(fields, used, k) {
    const cands = fields.filter((x) => x.cat === k.type && !used.has(x.n) && !x.chan);
    return cands;
}
export function inner$callArgs$i(open) {
    let i = open + 1;
    return i;
}
export function inner$callArgs$push$t(cur) {
    const t = cur.trim();
    return t;
}
export function inner$callArgs$push$m(cur) {
    const t = cur.trim();
    const m = /^([a-zA-Z_]\w*):\s*([\s\S]*)$/.exec(t);
    return m;
}
export function inner$callArgs$push$m$$step(t) {
    const m = /^([a-zA-Z_]\w*):\s*([\s\S]*)$/.exec(t);
    return m;
}
export function inner$parentWidget$i(idx) {
    let i = idx - 1;
    return i;
}
export function inner$parentWidget$skipStrBack$j(k) {
    let j = k - 1;
    return j;
}
export function inner$parentWidget$j(i) {
    let j = i - 1;
    return j;
}
export function inner$parentWidget$m(code, j) {
    const m = /(\w+)\s*$/.exec(code.slice(Math.max(0, j - 40), j));
    return m;
}
export function inner$chipHelpers$by(c) {
    const by = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    return by;
}
export function inner$chipHelpers$r(body) {
    const r = body.indexOf('return FilterChipPill(');
    return r;
}
export function inner$chipHelpers$by_L149(c) {
    const by = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    return by;
}
export function inner$chipHelpers$locals(body) {
    const r = body.indexOf('return FilterChipPill(');
    const locals = [...body.slice(0, r).matchAll(/final\s+(?:\w+\s+)?(\w+)\s*=\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]);
    return locals;
}
export function inner$chipHelpers$locals$$step(body, r) {
    const locals = [...body.slice(0, r).matchAll(/final\s+(?:\w+\s+)?(\w+)\s*=\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]);
    return locals;
}
export function inner$chipRecord$by(cc) {
    const by = cc ? Object.fromEntries(cc.args.filter((a) => a.name).map((a) => [a.name, a.expr])) : {};
    return by;
}
export function inner$chipRecord$m(call) {
    const m = /^(\w+)\(/.exec(call);
    return m;
}
export function inner$chipRecord$close(call) {
    const m = /^(\w+)\(/.exec(call);
    const close = balancedClose(call, m[0].length - 1);
    return close;
}
export function inner$chipRecord$close$$step(call, m) {
    const close = balancedClose(call, m[0].length - 1);
    return close;
}
export function inner$chipRecord$args(call) {
    const m = /^(\w+)\(/.exec(call);
    const close = balancedClose(call, m[0].length - 1);
    const args = splitTopArgs(call.slice(m[0].length, close));
    return args;
}
export function inner$chipRecord$args$$step(call, m, close) {
    const args = splitTopArgs(call.slice(m[0].length, close));
    return args;
}
export function inner$skinPass$k(mm) {
    let k = mm.index + mm[0].length;
    return k;
}
export function inner$skinPass$body(code, mm) {
    let k = mm.index + mm[0].length;
    let d = 0;
    for (; k < code.length; k++) {
        const ch = code[k];
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    const body = code.slice(mm.index + mm[0].length, k);
    return body;
}
export function inner$skinPass$body$$step(code, mm, k) {
    const body = code.slice(mm.index + mm[0].length, k);
    return body;
}
export function inner$skinPass$wrapRe(code) {
    const wrapHelpers = {};
    for (const mm of code.matchAll(/Widget\s+(\w+)\(List<Widget>\s+(\w+)(?:,\s*\{[^}]*\})?\)\s*=>/g)) {
        let k = mm.index + mm[0].length, d = 0;
        for (; k < code.length; k++) {
            const ch = code[k];
            if ('([{'.includes(ch))
                d++;
            else if (')]}'.includes(ch))
                d--;
            else if (ch === ';' && d === 0)
                break;
        }
        const body = code.slice(mm.index + mm[0].length, k);
        if (/\bWrap\(/.test(body) && new RegExp(`children:\\s*${mm[2]}\\b`).test(body))
            wrapHelpers[mm[1]] = true;
    }
    const wrapRe = new RegExp(`\\b(Wrap|Row${Object.keys(wrapHelpers).map((k) => '|' + k).join('')})\\(`, 'g');
    return wrapRe;
}
export function inner$skinPass$wrapRe$$step(wrapHelpers) {
    const wrapRe = new RegExp(`\\b(Wrap|Row${Object.keys(wrapHelpers).map((k) => '|' + k).join('')})\\(`, 'g');
    return wrapRe;
}
export function inner$skinPass$hit(code, m) {
    const hit = m.exec(code);
    return hit;
}
export function inner$skinPass$cm0(code, i, j) {
    const cm0 = /const\s+$/.exec(code.slice(i, j));
    return cm0;
}
export function inner$skinPass$j0(code, i, j) {
    const cm0 = /const\s+$/.exec(code.slice(i, j));
    const j0 = cm0 ? j - cm0[0].length : j;
    return j0;
}
export function inner$skinPass$j0$$step(j, cm0) {
    const j0 = cm0 ? j - cm0[0].length : j;
    return j0;
}
export function inner$skinPass$ch(code, m, c) {
    const wrapHelpers = {};
    for (const mm of code.matchAll(/Widget\s+(\w+)\(List<Widget>\s+(\w+)(?:,\s*\{[^}]*\})?\)\s*=>/g)) {
        let k = mm.index + mm[0].length, d = 0;
        for (; k < code.length; k++) {
            const ch = code[k];
            if ('([{'.includes(ch))
                d++;
            else if (')]}'.includes(ch))
                d--;
            else if (ch === ';' && d === 0)
                break;
        }
        const body = code.slice(mm.index + mm[0].length, k);
        if (/\bWrap\(/.test(body) && new RegExp(`children:\\s*${mm[2]}\\b`).test(body))
            wrapHelpers[mm[1]] = true;
    }
    const hit = m.exec(code);
    const isHelper = !!wrapHelpers[hit[1]];
    const ch = isHelper ? c.args.find((a) => !a.name) : c.args.find((a) => a.name === 'children');
    return ch;
}
export function inner$skinPass$ch$$step(c, isHelper) {
    const ch = isHelper ? c.args.find((a) => !a.name) : c.args.find((a) => a.name === 'children');
    return ch;
}
export function inner$skinPass$list(code, m, c) {
    const wrapHelpers = {};
    for (const mm of code.matchAll(/Widget\s+(\w+)\(List<Widget>\s+(\w+)(?:,\s*\{[^}]*\})?\)\s*=>/g)) {
        let k = mm.index + mm[0].length, d = 0;
        for (; k < code.length; k++) {
            const ch = code[k];
            if ('([{'.includes(ch))
                d++;
            else if (')]}'.includes(ch))
                d--;
            else if (ch === ';' && d === 0)
                break;
        }
        const body = code.slice(mm.index + mm[0].length, k);
        if (/\bWrap\(/.test(body) && new RegExp(`children:\\s*${mm[2]}\\b`).test(body))
            wrapHelpers[mm[1]] = true;
    }
    const hit = m.exec(code);
    const isHelper = !!wrapHelpers[hit[1]];
    const ch = isHelper ? c.args.find((a) => !a.name) : c.args.find((a) => a.name === 'children');
    const list = ch && /^\[[\s\S]*\]$/.test(ch.expr.trim()) ? ch.expr.trim().slice(1, -1) : null;
    return list;
}
export function inner$skinPass$list$$step(ch) {
    const list = ch && /^\[[\s\S]*\]$/.test(ch.expr.trim()) ? ch.expr.trim().slice(1, -1) : null;
    return list;
}
export function inner$skinPass$toRec$call(p) {
    let call = p.trim();
    return call;
}
export function inner$skinPass$toRec$o(call) {
    const o = call.indexOf('(');
    return o;
}
export function inner$skinPass$toRec$e(call) {
    const o = call.indexOf('(');
    const e = balancedClose(call, o);
    return e;
}
export function inner$skinPass$toRec$e$$step(call, o) {
    const e = balancedClose(call, o);
    return e;
}
export function inner$skinPass$chipsW(sk, recs) {
    const chipsW = `Builder(builder: (_) { final chips = <(String, bool, VoidCallback)>[${recs.join(', ')}]; return ${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [for (final ch in chips) [ch.$1]], selected: <int>{for (final (k, ch) in chips.indexed) if (ch.$2) k}, onSelect: (k) => chips[k].$3()); })`;
    return chipsW;
}
export function inner$skinPass$named(code, m, c) {
    const wrapHelpers = {};
    for (const mm of code.matchAll(/Widget\s+(\w+)\(List<Widget>\s+(\w+)(?:,\s*\{[^}]*\})?\)\s*=>/g)) {
        let k = mm.index + mm[0].length, d = 0;
        for (; k < code.length; k++) {
            const ch = code[k];
            if ('([{'.includes(ch))
                d++;
            else if (')]}'.includes(ch))
                d--;
            else if (ch === ';' && d === 0)
                break;
        }
        const body = code.slice(mm.index + mm[0].length, k);
        if (/\bWrap\(/.test(body) && new RegExp(`children:\\s*${mm[2]}\\b`).test(body))
            wrapHelpers[mm[1]] = true;
    }
    const hit = m.exec(code);
    const isHelper = !!wrapHelpers[hit[1]];
    const named = isHelper ? c.args.filter((a) => a.name).map((a) => `, ${a.name}: ${a.expr}`).join('') : '';
    return named;
}
export function inner$skinPass$named$$step(c, isHelper) {
    const named = isHelper ? c.args.filter((a) => a.name).map((a) => `, ${a.name}: ${a.expr}`).join('') : '';
    return named;
}
export function inner$skinPass$j(code, ds, i) {
    const j = code.indexOf(ds + '(', i);
    return j;
}
export function inner$skinPass$byName(c) {
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    return byName;
}
export function inner$skinPass$cm(code, ds, i) {
    const j = code.indexOf(ds + '(', i);
    const cm = /const\s+$/.exec(code.slice(i, j));
    return cm;
}
export function inner$skinPass$cm$$step(code, i, j) {
    const cm = /const\s+$/.exec(code.slice(i, j));
    return cm;
}
export function inner$skinPass$j0_L237(code, ds, i) {
    const j = code.indexOf(ds + '(', i);
    const cm = /const\s+$/.exec(code.slice(i, j));
    const j0 = cm ? j - cm[0].length : j;
    return j0;
}
export function inner$skinPass$j0_L237$$step(j, cm) {
    const j0 = cm ? j - cm[0].length : j;
    return j0;
}
export function inner$skinPass$f(skin, role) {
    const sk = skin && skin[role];
    const f = blank(sk.slots);
    return f;
}
export function inner$skinPass$f$$step(sk) {
    const f = blank(sk.slots);
    return f;
}
export function inner$skinPass$kids(c) {
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const kids = `[${byName.trailing ? `Align(alignment: Alignment.centerLeft, child: ${byName.trailing}), ` : ''}...${byName.children}]`;
    return kids;
}
export function inner$skinPass$kids$$step(byName) {
    const kids = `[${byName.trailing ? `Align(alignment: Alignment.centerLeft, child: ${byName.trailing}), ` : ''}...${byName.children}]`;
    return kids;
}
export function inner$skinPass$f_L257(skin, role) {
    const sk = skin && skin[role];
    const f = blank(sk.slots);
    return f;
}
export function inner$skinPass$f_L257$$step(sk) {
    const f = blank(sk.slots);
    return f;
}
export function inner$skinPass$f_L265(skin, role) {
    const sk = skin && skin[role];
    const f = blank(sk.slots);
    return f;
}
export function inner$skinPass$f_L265$$step(sk) {
    const f = blank(sk.slots);
    return f;
}
export function inner$skinPass$cells(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const cells = [byName.title, byName.time, byName.body ? `(${byName.body}) ?? ''` : null].filter(Boolean).slice(0, sk.itemSlots);
    return cells;
}
export function inner$skinPass$cells$$step(sk, byName) {
    const cells = [byName.title, byName.time, byName.body ? `(${byName.body}) ?? ''` : null].filter(Boolean).slice(0, sk.itemSlots);
    return cells;
}
export function inner$skinPass$inner(code, ds, i, c) {
    const j = code.indexOf(ds + '(', i);
    const inner = code.slice(j, c.end + 1).replace(/\)$/, ', bare: true)');
    return inner;
}
export function inner$skinPass$inner$$step(code, j, c) {
    const inner = code.slice(j, c.end + 1).replace(/\)$/, ', bare: true)');
    return inner;
}
export function inner$skinPass$f_L282(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = sk.slots ? `fields: [${Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx && byName.label ? byName.label : "''")).join(', ')}], ` : '';
    return f;
}
export function inner$skinPass$f_L282$$step(sk, byName) {
    const f = sk.slots ? `fields: [${Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx && byName.label ? byName.label : "''")).join(', ')}], ` : '';
    return f;
}
export function inner$skinPass$st(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const st = sk.stateIds && sk.stateIds.includes('empty') && sk.stateIds.includes('filled') && byName.value ? `state: (${byName.value}).toString().trim().isEmpty ? ${sk.cls}State.empty : ${sk.cls}State.filled, ` : '';
    return st;
}
export function inner$skinPass$st$$step(sk, byName) {
    const st = sk.stateIds && sk.stateIds.includes('empty') && sk.stateIds.includes('filled') && byName.value ? `state: (${byName.value}).toString().trim().isEmpty ? ${sk.cls}State.empty : ${sk.cls}State.filled, ` : '';
    return st;
}
export function inner$skinPass$f_L293(skin, role) {
    const sk = skin && skin[role];
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? 'g.title' : "''"));
    return f;
}
export function inner$skinPass$f_L293$$step(sk) {
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? 'g.title' : "''"));
    return f;
}
export function inner$skinPass$f_L302(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = sk.slots ? `fields: [${Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx && byName.title ? byName.title : "''")).join(', ')}], ` : '';
    return f;
}
export function inner$skinPass$f_L302$$step(sk, byName) {
    const f = sk.slots ? `fields: [${Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx && byName.title ? byName.title : "''")).join(', ')}], ` : '';
    return f;
}
export function inner$skinPass$f_L307(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName.title : k === sk.subIdx ? byName.subtitle : "''"));
    return f;
}
export function inner$skinPass$f_L307$$step(sk, byName) {
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName.title : k === sk.subIdx ? byName.subtitle : "''"));
    return f;
}
export function inner$skinPass$hdr(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName.title : k === sk.subIdx ? byName.subtitle : "''"));
    const hdr = `${sk.cls}(fields: [${f.join(', ')}]${sk.hasItems ? ', items: const <List<String>>[]' : ''})`;
    return hdr;
}
export function inner$skinPass$hdr$$step(sk, f) {
    const hdr = `${sk.cls}(fields: [${f.join(', ')}]${sk.hasItems ? ', items: const <List<String>>[]' : ''})`;
    return hdr;
}
export function inner$skinPass$rest(c) {
    const rest = c.args.filter((a) => a.name !== 'children').map((a) => (a.name ? `${a.name}: ${a.expr}` : a.expr));
    return rest;
}
export function inner$skinPass$f_L317(skin, role, c, mainK, subK) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName[mainK] : (k === sk.subIdx && subK && byName[subK]) ? byName[subK] : "''"));
    return f;
}
export function inner$skinPass$f_L317$$step(sk, byName, mainK, subK) {
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName[mainK] : (k === sk.subIdx && subK && byName[subK]) ? byName[subK] : "''"));
    return f;
}
export function inner$skinPass$forgedT(skin, role, c, mainK, subK) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName[mainK] : (k === sk.subIdx && subK && byName[subK]) ? byName[subK] : "''"));
    const forgedT = sk.variantMap && byName.tone != null
        ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]], variants: ${/^\d+$/.test(byName.tone.trim()) ? `const <int>[${sk.variantMap[(+byName.tone) % sk.variantMap.length]}]` : `[const <int>[${sk.variantMap.join(', ')}][(${byName.tone}) % ${sk.variantMap.length}]]`})` // טון-ליטרלי ⇒ אינדקס בזמן-חילול (נשאר const-תקין בתוך const Align(…))
        : sk.variantMap ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]])` : `${sk.cls}(fields: [${f.join(', ')}])`;
    return forgedT;
}
export function inner$skinPass$forgedT$$step(sk, byName, mainK, f) {
    const forgedT = sk.variantMap && byName.tone != null
        ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]], variants: ${/^\d+$/.test(byName.tone.trim()) ? `const <int>[${sk.variantMap[(+byName.tone) % sk.variantMap.length]}]` : `[const <int>[${sk.variantMap.join(', ')}][(${byName.tone}) % ${sk.variantMap.length}]]`})` // טון-ליטרלי ⇒ אינדקס בזמן-חילול (נשאר const-תקין בתוך const Align(…))
        : sk.variantMap ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]])` : `${sk.cls}(fields: [${f.join(', ')}])`;
    return forgedT;
}
export function inner$skinPass$inner_L323(skin, role, c, mainK, subK, tap) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName[mainK] : (k === sk.subIdx && subK && byName[subK]) ? byName[subK] : "''"));
    const forgedT = sk.variantMap && byName.tone != null
        ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]], variants: ${/^\d+$/.test(byName.tone.trim()) ? `const <int>[${sk.variantMap[(+byName.tone) % sk.variantMap.length]}]` : `[const <int>[${sk.variantMap.join(', ')}][(${byName.tone}) % ${sk.variantMap.length}]]`})` // טון-ליטרלי ⇒ אינדקס בזמן-חילול (נשאר const-תקין בתוך const Align(…))
        : sk.variantMap ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]])` : `${sk.cls}(fields: [${f.join(', ')}])`;
    const inner = tap ? `GestureDetector(behavior: HitTestBehavior.opaque, onTap: ${byName.onTap || 'null'}, child: ${forgedT})` : forgedT;
    return inner;
}
export function inner$skinPass$inner_L323$$step(byName, tap, forgedT) {
    const inner = tap ? `GestureDetector(behavior: HitTestBehavior.opaque, onTap: ${byName.onTap || 'null'}, child: ${forgedT})` : forgedT;
    return inner;
}
export function inner$skinPass$boxed(skin, role, c, mainK, subK, tap, parentT) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName[mainK] : (k === sk.subIdx && subK && byName[subK]) ? byName[subK] : "''"));
    const forgedT = sk.variantMap && byName.tone != null
        ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]], variants: ${/^\d+$/.test(byName.tone.trim()) ? `const <int>[${sk.variantMap[(+byName.tone) % sk.variantMap.length]}]` : `[const <int>[${sk.variantMap.join(', ')}][(${byName.tone}) % ${sk.variantMap.length}]]`})` // טון-ליטרלי ⇒ אינדקס בזמן-חילול (נשאר const-תקין בתוך const Align(…))
        : sk.variantMap ? `${sk.cls}(${sk.bare ? 'bare: true, ' : ''}items: [[${byName[mainK]}]])` : `${sk.cls}(fields: [${f.join(', ')}])`;
    const inner = tap ? `GestureDetector(behavior: HitTestBehavior.opaque, onTap: ${byName.onTap || 'null'}, child: ${forgedT})` : forgedT;
    const boxed = parentT === 'Row' ? `Flexible(child: ${inner})` : inner;
    return boxed;
}
export function inner$skinPass$boxed$$step(parentT, inner) {
    const boxed = parentT === 'Row' ? `Flexible(child: ${inner})` : inner;
    return boxed;
}
export function inner$skinPass$f2(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const f2 = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName.title : k === sk.subIdx ? byName.sub : "''"));
    return f2;
}
export function inner$skinPass$f2$$step(sk, byName) {
    const f2 = Array.from({ length: sk.slots }, (_, k) => (k === sk.titleIdx ? byName.title : k === sk.subIdx ? byName.sub : "''"));
    return f2;
}
export function inner$skinPass$fields(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const fields = Array.from({ length: sk.slots }, (_, k) => (k === sk.valueIdx ? byName.value : k === sk.labelIdx ? byName.label : "''"));
    return fields;
}
export function inner$skinPass$fields$$step(sk, byName) {
    const fields = Array.from({ length: sk.slots }, (_, k) => (k === sk.valueIdx ? byName.value : k === sk.labelIdx ? byName.label : "''"));
    return fields;
}
export function inner$skinPass$forged(skin, role, c) {
    const sk = skin && skin[role];
    const byName = Object.fromEntries(c.args.filter((a) => a.name).map((a) => [a.name, a.expr]));
    const fields = Array.from({ length: sk.slots }, (_, k) => (k === sk.valueIdx ? byName.value : k === sk.labelIdx ? byName.label : "''"));
    const forged = `${sk.cls}(fields: [${fields.join(', ')}])`;
    return forged;
}
export function inner$skinPass$forged$$step(sk, fields) {
    const forged = `${sk.cls}(fields: [${fields.join(', ')}])`;
    return forged;
}
export function inner$skinPass$lines(code) {
    const lines = code.split('\n');
    return lines;
}
export function inner$skinPass$li(lines) {
    const li = lines.reduce((a, l, k) => (/^import '/.test(l) ? k : a), -1);
    return li;
}
export function inner$retarget$pk(module, src) {
    const pk = primaryKeys(src, module);
    return pk;
}
export function inner$retarget$k(module) {
    const k = module.replace(/\.dart$/, '');
    return k;
}
export function inner$retarget$ren(map) {
    const ren = map.filter((x) => x.dst && x.dst !== x.src);
    return ren;
}
export function inner$retarget$E(entity) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    return E;
}
export function inner$retarget$eLower(entity) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const eLower = E.toLowerCase();
    return eLower;
}
export function inner$retarget$eLower$$step(E) {
    const eLower = E.toLowerCase();
    return eLower;
}
export function inner$retarget$stemSing(module) {
    const stemSing = stemOf(module).replace(/s$/, '').toLowerCase();
    return stemSing;
}
export function inner$retarget$map$i(l) {
    const i = l.indexOf('//');
    return i;
}
export function inner$retarget$map$head(l) {
    const i = l.indexOf('//');
    const head = i >= 0 ? l.slice(0, i) : l;
    return head;
}
export function inner$retarget$map$head$$step(l, i) {
    const head = i >= 0 ? l.slice(0, i) : l;
    return head;
}
export function inner$retarget$map$tail(l) {
    const i = l.indexOf('//');
    const tail = i >= 0 ? l.slice(i) : '';
    return tail;
}
export function inner$retarget$map$tail$$step(l, i) {
    const tail = i >= 0 ? l.slice(i) : '';
    return tail;
}
export function inner$retarget$classes(code) {
    const classes = [...new Set([...code.matchAll(/^(?:abstract\s+)?class\s+(\w+)/gm)].map((m) => m[1]))];
    return classes;
}
export function inner$retarget$pub(code) {
    const classes = [...new Set([...code.matchAll(/^(?:abstract\s+)?class\s+(\w+)/gm)].map((m) => m[1]))];
    const pub = classes.find((c) => /Screen$/.test(c) && !/^_/.test(c));
    return pub;
}
export function inner$retarget$pub$$step(classes) {
    const pub = classes.find((c) => /Screen$/.test(c) && !/^_/.test(c));
    return pub;
}
export function inner$retarget$stem(code) {
    const classes = [...new Set([...code.matchAll(/^(?:abstract\s+)?class\s+(\w+)/gm)].map((m) => m[1]))];
    const pub = classes.find((c) => /Screen$/.test(c) && !/^_/.test(c));
    const stem = pub ? pub.replace(/Screen$/, '') : null;
    return stem;
}
export function inner$retarget$stem$$step(pub) {
    const stem = pub ? pub.replace(/Screen$/, '') : null;
    return stem;
}
export function inner$retarget$clsMap(entity, code) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const classes = [...new Set([...code.matchAll(/^(?:abstract\s+)?class\s+(\w+)/gm)].map((m) => m[1]))];
    const pub = classes.find((c) => /Screen$/.test(c) && !/^_/.test(c));
    const stem = pub ? pub.replace(/Screen$/, '') : null;
    const clsMap = stem ? classes.filter((c) => c.includes(stem)).map((c) => [c, c.replace(stem, E)]) : [];
    return clsMap;
}
export function inner$retarget$clsMap$$step(E, classes, stem) {
    const clsMap = stem ? classes.filter((c) => c.includes(stem)).map((c) => [c, c.replace(stem, E)]) : [];
    return clsMap;
}
export function inner$retarget$srcE(srcT) {
    const srcE = srcT ? srcT.name : null;
    return srcE;
}
export function inner$retarget$sw(code, srcT, dstT) {
    const sw = swapTerms(code, srcT, dstT);
    return sw;
}
export function inner$retarget$coreFile(entity) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const eLower = E.toLowerCase();
    const coreFile = `gen_core_${eLower}.dart`;
    return coreFile;
}
export function inner$retarget$coreFile$$step(eLower) {
    const coreFile = `gen_core_${eLower}.dart`;
    return coreFile;
}
export function inner$retarget$lines(code) {
    const lines = code.split('\n');
    return lines;
}
export function inner$retarget$lastImp(lines) {
    const lastImp = lines.reduce((a, l, i) => (/^import '/.test(l) ? i : a), -1);
    return lastImp;
}
export function inner$retarget$need(entity) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const eLower = E.toLowerCase();
    const coreFile = `gen_core_${eLower}.dart`;
    const need = [`import '${coreFile}'; // G6c · הגרעין-מהסכמה של ${E} (מצבים · מעבר · חוקים · ערוצים)`];
    return need;
}
export function inner$retarget$need$$step(E, coreFile) {
    const need = [`import '${coreFile}'; // G6c · הגרעין-מהסכמה של ${E} (מצבים · מעבר · חוקים · ערוצים)`];
    return need;
}
export function inner$retarget$ret(lines) {
    const ret = lines.findIndex((l) => /^\s+return DsScaffold\(/.test(l));
    return ret;
}
export function inner$retarget$ch(lines) {
    const ret = lines.findIndex((l) => /^\s+return DsScaffold\(/.test(l));
    const ch = ret >= 0 ? lines.findIndex((l, i) => i > ret && /^\s+children: \[/.test(l)) : -1;
    return ch;
}
export function inner$retarget$ch$$step(lines, ret) {
    const ch = ret >= 0 ? lines.findIndex((l, i) => i > ret && /^\s+children: \[/.test(l)) : -1;
    return ch;
}
export function inner$retarget$ind(lines) {
    const ret = lines.findIndex((l) => /^\s+return DsScaffold\(/.test(l));
    const ch = ret >= 0 ? lines.findIndex((l, i) => i > ret && /^\s+children: \[/.test(l)) : -1;
    const ind = (lines[ch].match(/^\s+/) || [''])[0] + '  ';
    return ind;
}
export function inner$retarget$ind$$step(lines, ch) {
    const ind = (lines[ch].match(/^\s+/) || [''])[0] + '  ';
    return ind;
}
export function inner$retarget$stHead(entity, lines) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const stHead = lines.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen> \\{`).test(l));
    return stHead;
}
export function inner$retarget$stHead$$step(E, lines) {
    const stHead = lines.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen> \\{`).test(l));
    return stHead;
}
export function inner$retarget$pn(lines) {
    const pn = lines.findIndex((l) => /^\s+void _openPanel\(Map<String, dynamic> \w+\) \{/.test(l));
    return pn;
}
export function inner$retarget$pv(lines) {
    const pn = lines.findIndex((l) => /^\s+void _openPanel\(Map<String, dynamic> \w+\) \{/.test(l));
    const pv = lines[pn].match(/Map<String, dynamic> (\w+)\)/)[1];
    return pv;
}
export function inner$retarget$pv$$step(lines, pn) {
    const pv = lines[pn].match(/Map<String, dynamic> (\w+)\)/)[1];
    return pv;
}
export function inner$retarget$hasAct(lines) {
    const pn = lines.findIndex((l) => /^\s+void _openPanel\(Map<String, dynamic> \w+\) \{/.test(l));
    const hasAct = lines.slice(pn, pn + 14).some((l) => /void act\(/.test(l));
    return hasAct;
}
export function inner$retarget$hasAct$$step(lines, pn) {
    const hasAct = lines.slice(pn, pn + 14).some((l) => /void act\(/.test(l));
    return hasAct;
}
export function inner$retarget$ch_L402(lines) {
    const pn = lines.findIndex((l) => /^\s+void _openPanel\(Map<String, dynamic> \w+\) \{/.test(l));
    const ch = lines.findIndex((l, i) => i > pn && i < pn + 60 && /children: \[/.test(l));
    return ch;
}
export function inner$retarget$ch_L402$$step(lines, pn) {
    const ch = lines.findIndex((l, i) => i > pn && i < pn + 60 && /children: \[/.test(l));
    return ch;
}
export function inner$retarget$ind_L404(lines) {
    const pn = lines.findIndex((l) => /^\s+void _openPanel\(Map<String, dynamic> \w+\) \{/.test(l));
    const ch = lines.findIndex((l, i) => i > pn && i < pn + 60 && /children: \[/.test(l));
    const ind = (lines[ch].match(/^\s+/) || [''])[0] + '  ';
    return ind;
}
export function inner$retarget$ind_L404$$step(lines, ch) {
    const ind = (lines[ch].match(/^\s+/) || [''])[0] + '  ';
    return ind;
}
export function inner$retarget$apply(lines) {
    const pn = lines.findIndex((l) => /^\s+void _openPanel\(Map<String, dynamic> \w+\) \{/.test(l));
    const pv = lines[pn].match(/Map<String, dynamic> (\w+)\)/)[1];
    const hasAct = lines.slice(pn, pn + 14).some((l) => /void act\(/.test(l));
    const apply = hasAct ? `act(() => _coreState['\${${pv}['id']}'] = nx)` : `setState(() => _coreState['\${${pv}['id']}'] = nx)`;
    return apply;
}
export function inner$retarget$apply$$step(pv, hasAct) {
    const apply = hasAct ? `act(() => _coreState['\${${pv}['id']}'] = nx)` : `setState(() => _coreState['\${${pv}['id']}'] = nx)`;
    return apply;
}
export function inner$retarget$li(lines) {
    const li = lines.reduce((a, l, i) => (/^import '/.test(l) ? i : a), -1);
    return li;
}
export function inner$retarget$lines_L427(code) {
    const lines = code.split('\n');
    return lines;
}
export function inner$retarget$ci(lines) {
    const ci = lines.findIndex((l) => /^\s+static final List<Map<String, Object\?>> columnDefs = <Map<String, Object\?>>\[/.test(l));
    return ci;
}
export function inner$retarget$ind_L430(lines) {
    const ci = lines.findIndex((l) => /^\s+static final List<Map<String, Object\?>> columnDefs = <Map<String, Object\?>>\[/.test(l));
    const ind = (lines[ci].match(/^\s+/) || [''])[0] + '  ';
    return ind;
}
export function inner$retarget$ind_L430$$step(lines, ci) {
    const ind = (lines[ci].match(/^\s+/) || [''])[0] + '  ';
    return ind;
}
export function inner$retarget$mappedDst(map) {
    const mappedDst = new Set(map.filter((x) => x.dst).map((x) => x.dst));
    return mappedDst;
}
export function inner$retarget$lines_L442(code) {
    const lines = code.split('\n');
    return lines;
}
export function inner$retarget$clsAt$m(lines, j) {
    const m = /^(?:abstract\s+)?class\s+(\w+)/.exec(lines[j]);
    return m;
}
export function inner$retarget$a(code, pn) {
    const lines = code.split('\n');
    const a = lines.findIndex((l) => new RegExp(`^\\s+static const ${pn} = <Map<String, dynamic>>\\[`).test(l));
    return a;
}
export function inner$retarget$a$$step(lines, pn) {
    const a = lines.findIndex((l) => new RegExp(`^\\s+static const ${pn} = <Map<String, dynamic>>\\[`).test(l));
    return a;
}
export function inner$retarget$b(code, pn) {
    const lines = code.split('\n');
    const b = lines.findIndex((l) => new RegExp(`^\\s+'${pn}': (?:<Map<String, dynamic>>)?\\[`).test(l));
    return b;
}
export function inner$retarget$b$$step(lines, pn) {
    const b = lines.findIndex((l) => new RegExp(`^\\s+'${pn}': (?:<Map<String, dynamic>>)?\\[`).test(l));
    return b;
}
export function inner$retarget$dbi(code) {
    const lines = code.split('\n');
    const dbi = lines.findIndex((l) => /^\s+static Map<String, dynamic> db = seed\(\);/.test(l));
    return dbi;
}
export function inner$retarget$dbi$$step(lines) {
    const dbi = lines.findIndex((l) => /^\s+static Map<String, dynamic> db = seed\(\);/.test(l));
    return dbi;
}
export function inner$retarget$m1(code, j) {
    const lines = code.split('\n');
    const m1 = /^\s+(\w+): \[$/.exec(lines[j]);
    return m1;
}
export function inner$retarget$m1$$step(lines, j) {
    const m1 = /^\s+(\w+): \[$/.exec(lines[j]);
    return m1;
}
export function inner$retarget$m2(code, j) {
    const lines = code.split('\n');
    const m2 = /^\s+static const (\w+) = (\w+)\($/.exec(lines[j]);
    return m2;
}
export function inner$retarget$m2$$step(lines, j) {
    const m2 = /^\s+static const (\w+) = (\w+)\($/.exec(lines[j]);
    return m2;
}
export function inner$retarget$numGetters(code) {
    const numGetters = new Set([...code.matchAll(/^\s+static (?:int|double|num) get (\w+)/gm)].map((m) => m[1]));
    return numGetters;
}
export function inner$retarget$row(m) {
    const row = { key: m[4], value: m[2], label: m[5], tone: m[6] ? 'danger' : 'plain', atom: m[1], isHero: m[1] === 'StatHero' };
    return row;
}
export function inner$retarget$prev(byKey, m) {
    const prev = byKey.get(m[4]);
    return prev;
}
export function inner$retarget$hero(code) {
    const numGetters = new Set([...code.matchAll(/^\s+static (?:int|double|num) get (\w+)/gm)].map((m) => m[1]));
    const metrics = [];
    const byKey = new Map();
    for (const m of code.matchAll(/(BareStat|StatHero)\(value: '(\$\{(_\w+)\.(\w+)\}[^'\n]*)', label: '([^'\n]*)'(, inkColor: \3\.\4 > 0 \? _danger)?/g)) {
        if (!numGetters.has(m[4]))
            continue;
        const row = { key: m[4], value: m[2], label: m[5], tone: m[6] ? 'danger' : 'plain', atom: m[1], isHero: m[1] === 'StatHero' };
        const prev = byKey.get(m[4]);
        if (!prev) {
            byKey.set(m[4], row);
            metrics.push(row);
        }
        else {
            if (prev.atom === 'StatHero' && row.atom === 'BareStat') {
                prev.label = row.label;
                prev.tone = row.tone;
                prev.value = row.value;
            }
            if (row.isHero)
                prev.isHero = true;
            if (row.tone === 'danger')
                prev.tone = 'danger';
        }
    }
    const hero = metrics.find((x) => x.isHero) || metrics.find((x) => x.tone === 'danger') || metrics[0] || null;
    return hero;
}
export function inner$retarget$hero$$step(metrics) {
    const hero = metrics.find((x) => x.isHero) || metrics.find((x) => x.tone === 'danger') || metrics[0] || null;
    return hero;
}
export function inner$retarget$heroHow(code) {
    const numGetters = new Set([...code.matchAll(/^\s+static (?:int|double|num) get (\w+)/gm)].map((m) => m[1]));
    const metrics = [];
    const byKey = new Map();
    for (const m of code.matchAll(/(BareStat|StatHero)\(value: '(\$\{(_\w+)\.(\w+)\}[^'\n]*)', label: '([^'\n]*)'(, inkColor: \3\.\4 > 0 \? _danger)?/g)) {
        if (!numGetters.has(m[4]))
            continue;
        const row = { key: m[4], value: m[2], label: m[5], tone: m[6] ? 'danger' : 'plain', atom: m[1], isHero: m[1] === 'StatHero' };
        const prev = byKey.get(m[4]);
        if (!prev) {
            byKey.set(m[4], row);
            metrics.push(row);
        }
        else {
            if (prev.atom === 'StatHero' && row.atom === 'BareStat') {
                prev.label = row.label;
                prev.tone = row.tone;
                prev.value = row.value;
            }
            if (row.isHero)
                prev.isHero = true;
            if (row.tone === 'danger')
                prev.tone = 'danger';
        }
    }
    const hero = metrics.find((x) => x.isHero) || metrics.find((x) => x.tone === 'danger') || metrics[0] || null;
    const heroHow = !hero ? 'אין מדדים ⇒ count' : hero.isHero ? 'ה-StatHero של הזהב (המטרה המוצהרת)' : hero.tone === 'danger' ? 'המדד הראשון שהזהב צובע-סכנה כשאינו-אפס' : 'אין StatHero/מדד-סכנה ⇒ המדד הראשון';
    return heroHow;
}
export function inner$retarget$heroHow$$step(hero) {
    const heroHow = !hero ? 'אין מדדים ⇒ count' : hero.isHero ? 'ה-StatHero של הזהב (המטרה המוצהרת)' : hero.tone === 'danger' ? 'המדד הראשון שהזהב צובע-סכנה כשאינו-אפס' : 'אין StatHero/מדד-סכנה ⇒ המדד הראשון';
    return heroHow;
}
export function inner$retarget$label(entity, dt) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const label = dt ? (dt.plural || dt.singular) : E;
    return label;
}
export function inner$retarget$label$$step(E, dt) {
    const label = dt ? (dt.plural || dt.singular) : E;
    return label;
}
export function inner$retarget$ls(code) {
    const ls = code.split('\n');
    return ls;
}
export function inner$retarget$gi(ls, mt) {
    const gi = ls.findIndex((l) => new RegExp(`^\\s+static int get ${mt.key} => `).test(l));
    return gi;
}
export function inner$retarget$body(ls, mt) {
    const gi = ls.findIndex((l) => new RegExp(`^\\s+static int get ${mt.key} => `).test(l));
    const body = ls[gi].replace(/^\s+static int get \w+ => /, '').replace(/;\s*(\/\/.*)?$/, '');
    return body;
}
export function inner$retarget$body$$step(ls, gi) {
    const body = ls[gi].replace(/^\s+static int get \w+ => /, '').replace(/;\s*(\/\/.*)?$/, '');
    return body;
}
export function inner$retarget$m(ls, mt) {
    const gi = ls.findIndex((l) => new RegExp(`^\\s+static int get ${mt.key} => `).test(l));
    const body = ls[gi].replace(/^\s+static int get \w+ => /, '').replace(/;\s*(\/\/.*)?$/, '');
    const m = /^(.+)\.where\((.+)\)\.length$/.exec(body);
    return m;
}
export function inner$retarget$m$$step(body) {
    const m = /^(.+)\.where\((.+)\)\.length$/.exec(body);
    return m;
}
export function inner$retarget$ind_L485(ls, mt) {
    const gi = ls.findIndex((l) => new RegExp(`^\\s+static int get ${mt.key} => `).test(l));
    const ind = (ls[gi].match(/^\s+/) || [''])[0];
    return ind;
}
export function inner$retarget$ind_L485$$step(ls, gi) {
    const ind = (ls[gi].match(/^\s+/) || [''])[0];
    return ind;
}
export function inner$retarget$idKey(map) {
    const idKey = (map.find((x) => x.src === 'id') || {}).dst || 'id';
    return idKey;
}
export function inner$retarget$ls_L494(code) {
    const ls = code.split('\n');
    return ls;
}
export function inner$retarget$di(code) {
    const ls = code.split('\n');
    const di = ls.findIndex((l) => /^\s+static Map<String, dynamic> db = seed\(\);/.test(l));
    return di;
}
export function inner$retarget$di$$step(ls) {
    const di = ls.findIndex((l) => /^\s+static Map<String, dynamic> db = seed\(\);/.test(l));
    return di;
}
export function inner$retarget$bi(code) {
    const ls = code.split('\n');
    const bi = ls.findIndex((l) => /^\s+static List<Map<String, dynamic>> _build\(\) \{/.test(l));
    return bi;
}
export function inner$retarget$bi$$step(ls) {
    const bi = ls.findIndex((l) => /^\s+static List<Map<String, dynamic>> _build\(\) \{/.test(l));
    return bi;
}
export function inner$retarget$j(code) {
    const ls = code.split('\n');
    const bi = ls.findIndex((l) => /^\s+static List<Map<String, dynamic>> _build\(\) \{/.test(l));
    let j = bi + 1;
    return j;
}
export function inner$retarget$j$$step(bi) {
    let j = bi + 1;
    return j;
}
export function inner$retarget$m_L497(code, j) {
    const ls = code.split('\n');
    const m = /for \(final \w+ in \((\w+)\['(\w+)'\] as List\)/.exec(ls[j]);
    return m;
}
export function inner$retarget$m_L497$$step(ls, j) {
    const m = /for \(final \w+ in \((\w+)\['(\w+)'\] as List\)/.exec(ls[j]);
    return m;
}
export function inner$retarget$ti(code) {
    const ls = code.split('\n');
    const ti = ls.findIndex((l, k) => /_table\(/.test(l) && k > 0 && /_mode == (\d+)\)/.test(ls[k - 1]));
    return ti;
}
export function inner$retarget$ti$$step(ls) {
    const ti = ls.findIndex((l, k) => /_table\(/.test(l) && k > 0 && /_mode == (\d+)\)/.test(ls[k - 1]));
    return ti;
}
export function inner$retarget$n(code) {
    const ls = code.split('\n');
    const ti = ls.findIndex((l, k) => /_table\(/.test(l) && k > 0 && /_mode == (\d+)\)/.test(ls[k - 1]));
    const n = +/_mode == (\d+)\)/.exec(ls[ti - 1])[1];
    return n;
}
export function inner$retarget$n$$step(ls, ti) {
    const n = +/_mode == (\d+)\)/.exec(ls[ti - 1])[1];
    return n;
}
export function inner$retarget$sw_L501(code) {
    const ls = code.split('\n');
    const sw = ls.find((l) => /SegmentedSwitch\(items: const \[([^\]]+)\], selected: _mode/.test(l));
    return sw;
}
export function inner$retarget$sw_L501$$step(ls) {
    const sw = ls.find((l) => /SegmentedSwitch\(items: const \[([^\]]+)\], selected: _mode/.test(l));
    return sw;
}
export function inner$retarget$items(code) {
    const ls = code.split('\n');
    const sw = ls.find((l) => /SegmentedSwitch\(items: const \[([^\]]+)\], selected: _mode/.test(l));
    const items = [...(/SegmentedSwitch\(items: const \[([^\]]+)\], selected: _mode/.exec(sw)[1]).matchAll(/'([^']*)'/g)].map((m) => m[1]);
    return items;
}
export function inner$retarget$items$$step(sw) {
    const items = [...(/SegmentedSwitch\(items: const \[([^\]]+)\], selected: _mode/.exec(sw)[1]).matchAll(/'([^']*)'/g)].map((m) => m[1]);
    return items;
}
export function inner$retarget$rowsExpr(countExpr, countHow) {
    const rowsExpr = !countExpr ? null : countHow === 'static-const' ? countExpr.replace(/\.length$/, '')
        : countHow === 'seed-db' ? countExpr.replace(/^\(\((.+) as List\?\)\?\.length \?\? 0\)$/, '(($1 as List?) ?? const []).cast<Map<String, dynamic>>()')
            : countExpr.replace(/\.fold<int>\(0, \(n, m\) => n \+ \(\(m\['(\w+)'\] as List\?\)\?\.length \?\? 0\)\)$/, ".expand((m) => ((m['$1'] as List?) ?? const []).cast<Map<String, dynamic>>()).toList()");
    return rowsExpr;
}
export function inner$retarget$F(entity) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const F = `${E}Facts`;
    return F;
}
export function inner$retarget$F$$step(E) {
    const F = `${E}Facts`;
    return F;
}
export function inner$retarget$out(entity, map, code, reservedKeys, pn, countExpr, countHow, dt, rowsOfKeys, seedSeam) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const numGetters = new Set([...code.matchAll(/^\s+static (?:int|double|num) get (\w+)/gm)].map((m) => m[1]));
    const metrics = [];
    const byKey = new Map();
    for (const m of code.matchAll(/(BareStat|StatHero)\(value: '(\$\{(_\w+)\.(\w+)\}[^'\n]*)', label: '([^'\n]*)'(, inkColor: \3\.\4 > 0 \? _danger)?/g)) {
        if (!numGetters.has(m[4]))
            continue;
        const row = { key: m[4], value: m[2], label: m[5], tone: m[6] ? 'danger' : 'plain', atom: m[1], isHero: m[1] === 'StatHero' };
        const prev = byKey.get(m[4]);
        if (!prev) {
            byKey.set(m[4], row);
            metrics.push(row);
        }
        else {
            if (prev.atom === 'StatHero' && row.atom === 'BareStat') {
                prev.label = row.label;
                prev.tone = row.tone;
                prev.value = row.value;
            }
            if (row.isHero)
                prev.isHero = true;
            if (row.tone === 'danger')
                prev.tone = 'danger';
        }
    }
    const hero = metrics.find((x) => x.isHero) || metrics.find((x) => x.tone === 'danger') || metrics[0] || null;
    const heroHow = !hero ? 'אין מדדים ⇒ count' : hero.isHero ? 'ה-StatHero של הזהב (המטרה המוצהרת)' : hero.tone === 'danger' ? 'המדד הראשון שהזהב צובע-סכנה כשאינו-אפס' : 'אין StatHero/מדד-סכנה ⇒ המדד הראשון';
    const label = dt ? (dt.plural || dt.singular) : E;
    const idKey = (map.find((x) => x.src === 'id') || {}).dst || 'id';
    const rowsExpr = !countExpr ? null : countHow === 'static-const' ? countExpr.replace(/\.length$/, '')
        : countHow === 'seed-db' ? countExpr.replace(/^\(\((.+) as List\?\)\?\.length \?\? 0\)$/, '(($1 as List?) ?? const []).cast<Map<String, dynamic>>()')
            : countExpr.replace(/\.fold<int>\(0, \(n, m\) => n \+ \(\(m\['(\w+)'\] as List\?\)\?\.length \?\? 0\)\)$/, ".expand((m) => ((m['$1'] as List?) ?? const []).cast<Map<String, dynamic>>()).toList()");
    const F = `${E}Facts`;
    const out = ['', `// ═══ תפר-עובדות ציבורי (G9b · לרכזת-האפליקציה): ${F} — נגזרות-אמת של דאטה-המודול; כל ערך = ביטוי חי על הזרע/המנועים (§20-ג), אפס ליטרל-מומצא. מחולל: retarget.mjs ═══`,
        `class ${F} {`, `  static const String entity = ${qd(entity)};`,
        `  static const String label = ${qd(label)}; // ${dt ? 'מונח-הישות מ-entity-terms (דאטה)' : 'אין מונח ב-TERM_DEFS ⇒ שם-הישות (הצבה גלויה)'}`,
        countExpr ? `  static int get count => ${countExpr}; // רשומות הזרע-הראשי "${pn}" (${countHow})` : `  // count: הזרע-הראשי "${pn || '—'}" לא נמצא בצורת-הצהרה מוכרת — אין count (לא מומצא)`,
        `  static const List<Map<String, String>> metricDefs = <Map<String, String>>[${metrics.map((x) => `{'key': ${qd(x.key)}, 'label': ${qd(x.label)}, 'tone': ${qd(x.tone)}}`).join(', ')}]; // ${metrics.length} מדדים חצובים משורת-ה-KPI של הזהב (BareStat/StatHero ⇐ getter-סטטי מספרי)${metrics.length ? '' : ' — אין getter-סטטי בשורת-ה-KPI ⇒ ריק, לא מומצא'}`,
        `  static Map<String, String> get metrics => <String, String>{${metrics.map((x) => `${qd(x.key)}: '${x.value}'`).join(', ')}};`,
        `  static const String heroKey = ${qd(hero ? hero.key : 'count')}; // ${heroHow}`,
        `  static String get hero => metrics[heroKey] ?? ${countExpr ? "'$count'" : "'—'"};`,
        `  static String get heroLabel => ${hero ? qd(hero.label) : 'label'};`,
        ...(rowsExpr ? [`  static const String idKey = ${qd(idKey)}; // מפתח-המזהה בזרע (אחרי retarget)`,
            `  static List<Map<String, dynamic>> get rows => ${rowsExpr}; // כל רשומות הזרע-הראשי (${countHow})`,
            `  static Map<String, dynamic>? byId(String id) { for (final r in [for (final k in const <String>[${rowsOfKeys.map((x) => qd(x.key)).join(', ')}]) ...heroRows(k), ...rows]) { if ('${'$'}{r[idKey] ?? r['id']}' == id) return r; } return null; } // שורות-המדד קודם (הן מסוג-הרשומה שהפאנל צורך — בזהב-התלמידים הפאנל פותח תלמיד, הזרע-הראשי-לפי-מפתחות הוא families), ואז הזרע-הראשי`] : [`  // rows/byId: אין זרע-ראשי בצורה מוכרת ⇒ אין תפר-כניסה לפי מזהה`]),
        `  static List<Map<String, dynamic>> heroRows(String key) { switch (key) { ${rowsOfKeys.map((x) => `case ${qd(x.key)}: return ${x.cls}.rowsOf_${x.key};`).join(' ')} default: return const []; } } // G10a · ${rowsOfKeys.length} מדדים עם שורות (צורת X.where(P).length)`,
        rowsExpr ? `  static String? get heroFirstId { final r = heroRows(heroKey); return r.isEmpty ? null : '${'$'}{r.first[idKey]}'; } // הרשומה-הראשונה של ה-hero — יעד-הקפיצה מהרכזת` : `  static String? get heroFirstId => null;`,
        ...(seedSeam ? [`  // G10b-ב · תפר-הזרקה (חוק-6: הדאטה מוזרקת, לא מומצאת): seed() = זרע-ההצבה של הזהב · seedList/rowList = היכן רשומת-המסך חיה (מצורת _build()) · reservedColumns = עמודות-מקום-שמור של G5h`,
            `  static Map<String, dynamic> seed() => ${seedSeam.cls}.seed();`,
            `  static const String seedList = ${qd(seedSeam.list)};`,
            `  static const String? rowList = ${seedSeam.rowList ? qd(seedSeam.rowList) : 'null'}; // null ⇒ רשומת-המסך = רשומת-הזרע עצמה`,
            `  static const List<String> reservedColumns = <String>[${reservedKeys.map(qd).join(', ')}];`,
            `  static const String? tableView = ${seedSeam.tableLabel ? qd(seedSeam.tableLabel) : 'null'}; // תווית-המבט שמגלה את הטבלה (null ⇒ הטבלה תמיד גלויה)`] : []),
        '}', ''];
    return out;
}
export function inner$retarget$out$$step(entity, reservedKeys, pn, countExpr, countHow, metrics, hero, heroHow, dt, label, rowsOfKeys, idKey, seedSeam, rowsExpr, F) {
    const out = ['', `// ═══ תפר-עובדות ציבורי (G9b · לרכזת-האפליקציה): ${F} — נגזרות-אמת של דאטה-המודול; כל ערך = ביטוי חי על הזרע/המנועים (§20-ג), אפס ליטרל-מומצא. מחולל: retarget.mjs ═══`,
        `class ${F} {`, `  static const String entity = ${qd(entity)};`,
        `  static const String label = ${qd(label)}; // ${dt ? 'מונח-הישות מ-entity-terms (דאטה)' : 'אין מונח ב-TERM_DEFS ⇒ שם-הישות (הצבה גלויה)'}`,
        countExpr ? `  static int get count => ${countExpr}; // רשומות הזרע-הראשי "${pn}" (${countHow})` : `  // count: הזרע-הראשי "${pn || '—'}" לא נמצא בצורת-הצהרה מוכרת — אין count (לא מומצא)`,
        `  static const List<Map<String, String>> metricDefs = <Map<String, String>>[${metrics.map((x) => `{'key': ${qd(x.key)}, 'label': ${qd(x.label)}, 'tone': ${qd(x.tone)}}`).join(', ')}]; // ${metrics.length} מדדים חצובים משורת-ה-KPI של הזהב (BareStat/StatHero ⇐ getter-סטטי מספרי)${metrics.length ? '' : ' — אין getter-סטטי בשורת-ה-KPI ⇒ ריק, לא מומצא'}`,
        `  static Map<String, String> get metrics => <String, String>{${metrics.map((x) => `${qd(x.key)}: '${x.value}'`).join(', ')}};`,
        `  static const String heroKey = ${qd(hero ? hero.key : 'count')}; // ${heroHow}`,
        `  static String get hero => metrics[heroKey] ?? ${countExpr ? "'$count'" : "'—'"};`,
        `  static String get heroLabel => ${hero ? qd(hero.label) : 'label'};`,
        ...(rowsExpr ? [`  static const String idKey = ${qd(idKey)}; // מפתח-המזהה בזרע (אחרי retarget)`,
            `  static List<Map<String, dynamic>> get rows => ${rowsExpr}; // כל רשומות הזרע-הראשי (${countHow})`,
            `  static Map<String, dynamic>? byId(String id) { for (final r in [for (final k in const <String>[${rowsOfKeys.map((x) => qd(x.key)).join(', ')}]) ...heroRows(k), ...rows]) { if ('${'$'}{r[idKey] ?? r['id']}' == id) return r; } return null; } // שורות-המדד קודם (הן מסוג-הרשומה שהפאנל צורך — בזהב-התלמידים הפאנל פותח תלמיד, הזרע-הראשי-לפי-מפתחות הוא families), ואז הזרע-הראשי`] : [`  // rows/byId: אין זרע-ראשי בצורה מוכרת ⇒ אין תפר-כניסה לפי מזהה`]),
        `  static List<Map<String, dynamic>> heroRows(String key) { switch (key) { ${rowsOfKeys.map((x) => `case ${qd(x.key)}: return ${x.cls}.rowsOf_${x.key};`).join(' ')} default: return const []; } } // G10a · ${rowsOfKeys.length} מדדים עם שורות (צורת X.where(P).length)`,
        rowsExpr ? `  static String? get heroFirstId { final r = heroRows(heroKey); return r.isEmpty ? null : '${'$'}{r.first[idKey]}'; } // הרשומה-הראשונה של ה-hero — יעד-הקפיצה מהרכזת` : `  static String? get heroFirstId => null;`,
        ...(seedSeam ? [`  // G10b-ב · תפר-הזרקה (חוק-6: הדאטה מוזרקת, לא מומצאת): seed() = זרע-ההצבה של הזהב · seedList/rowList = היכן רשומת-המסך חיה (מצורת _build()) · reservedColumns = עמודות-מקום-שמור של G5h`,
            `  static Map<String, dynamic> seed() => ${seedSeam.cls}.seed();`,
            `  static const String seedList = ${qd(seedSeam.list)};`,
            `  static const String? rowList = ${seedSeam.rowList ? qd(seedSeam.rowList) : 'null'}; // null ⇒ רשומת-המסך = רשומת-הזרע עצמה`,
            `  static const List<String> reservedColumns = <String>[${reservedKeys.map(qd).join(', ')}];`,
            `  static const String? tableView = ${seedSeam.tableLabel ? qd(seedSeam.tableLabel) : 'null'}; // תווית-המבט שמגלה את הטבלה (null ⇒ הטבלה תמיד גלויה)`] : []),
        '}', ''];
    return out;
}
export function inner$retarget$ls_L533(code) {
    const ls = code.split('\n');
    return ls;
}
export function inner$retarget$ci_L534(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const ci = ls.findIndex((l) => new RegExp(`^\\s+const ${E}Screen\\(\\{`).test(l));
    return ci;
}
export function inner$retarget$ci_L534$$step(E, ls) {
    const ci = ls.findIndex((l) => new RegExp(`^\\s+const ${E}Screen\\(\\{`).test(l));
    return ci;
}
export function inner$retarget$si(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    return si;
}
export function inner$retarget$si$$step(E, ls) {
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    return si;
}
export function inner$retarget$open(entity) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const F = `${E}Facts`;
    const open = [`    final p0 = widget.initialPanelId == null ? null : ${F}.byId(widget.initialPanelId!); // G10a`,
        `    if (p0 != null) WidgetsBinding.instance.addPostFrameCallback((_) { if (mounted) _openPanel(p0); });`];
    return open;
}
export function inner$retarget$open$$step(F) {
    const open = [`    final p0 = widget.initialPanelId == null ? null : ${F}.byId(widget.initialPanelId!); // G10a`,
        `    if (p0 != null) WidgetsBinding.instance.addPostFrameCallback((_) { if (mounted) _openPanel(p0); });`];
    return open;
}
export function inner$retarget$j_L543(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    let j = si + 1;
    return j;
}
export function inner$retarget$j_L543$$step(si) {
    let j = si + 1;
    return j;
}
export function inner$retarget$sup(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    let ii = -1;
    for (let j = si + 1; j < ls.length && !/^class /.test(ls[j]); j++)
        if (/^\s+void initState\(\) \{/.test(ls[j])) {
            ii = j;
            break;
        }
    const sup = ls.findIndex((l, k) => k > ii && /^\s+super\.initState\(\);/.test(l));
    return sup;
}
export function inner$retarget$sup$$step(ls, ii) {
    const sup = ls.findIndex((l, k) => k > ii && /^\s+super\.initState\(\);/.test(l));
    return sup;
}
export function inner$retarget$ls_L554(code) {
    const ls = code.split('\n');
    return ls;
}
export function inner$retarget$ci_L555(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const ci = ls.findIndex((l) => new RegExp(`^\\s+const ${E}Screen\\(\\{`).test(l));
    return ci;
}
export function inner$retarget$ci_L555$$step(E, ls) {
    const ci = ls.findIndex((l) => new RegExp(`^\\s+const ${E}Screen\\(\\{`).test(l));
    return ci;
}
export function inner$retarget$si_L556(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    return si;
}
export function inner$retarget$si_L556$$step(E, ls) {
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    return si;
}
export function inner$retarget$vi(ls) {
    const vi = ls.findIndex((l) => /^\s+final visible = .+;\s*(\/\/.*)?$/.test(l));
    return vi;
}
export function inner$retarget$stHead_L558(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    const stHead = si >= 0 ? ls.findIndex((l, k) => k > si && /^\s+(void initState\(\) \{|@override)/.test(l)) : -1;
    return stHead;
}
export function inner$retarget$stHead_L558$$step(ls, si) {
    const stHead = si >= 0 ? ls.findIndex((l, k) => k > si && /^\s+(void initState\(\) \{|@override)/.test(l)) : -1;
    return stHead;
}
export function inner$retarget$ii(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    const ii = ls.findIndex((l, k) => k > si && /^\s+void initState\(\) \{/.test(l));
    return ii;
}
export function inner$retarget$ii$$step(ls, si) {
    const ii = ls.findIndex((l, k) => k > si && /^\s+void initState\(\) \{/.test(l));
    return ii;
}
export function inner$retarget$sup_L564(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    const ii = ls.findIndex((l, k) => k > si && /^\s+void initState\(\) \{/.test(l));
    const sup = ii >= 0 ? ls.findIndex((l, k) => k > ii && /^\s+super\.initState\(\);/.test(l)) : -1;
    return sup;
}
export function inner$retarget$sup_L564$$step(ls, ii) {
    const sup = ii >= 0 ? ls.findIndex((l, k) => k > ii && /^\s+super\.initState\(\);/.test(l)) : -1;
    return sup;
}
export function inner$retarget$vi2(ls) {
    const vi2 = ls.findIndex((l) => /^\s+final visible = .+;\s*(\/\/.*)?$/.test(l));
    return vi2;
}
export function inner$retarget$ind_L569(vl) {
    const ind = (vl.match(/^\s+/) || [''])[0];
    return ind;
}
export function inner$retarget$ri(ls) {
    const vi2 = ls.findIndex((l) => /^\s+final visible = .+;\s*(\/\/.*)?$/.test(l));
    const ri = ls.findIndex((l, k) => k > vi2 && /^\s+return DsScaffold\($/.test(l));
    return ri;
}
export function inner$retarget$ri$$step(ls, vi2) {
    const ri = ls.findIndex((l, k) => k > vi2 && /^\s+return DsScaffold\($/.test(l));
    return ri;
}
export function inner$retarget$chi(ls) {
    const vi2 = ls.findIndex((l) => /^\s+final visible = .+;\s*(\/\/.*)?$/.test(l));
    const ri = ls.findIndex((l, k) => k > vi2 && /^\s+return DsScaffold\($/.test(l));
    const chi = ri >= 0 ? ls.findIndex((l, k) => k > ri && /^\s+children: \[\s*$/.test(l)) : -1;
    return chi;
}
export function inner$retarget$chi$$step(ls, ri) {
    const chi = ri >= 0 ? ls.findIndex((l, k) => k > ri && /^\s+children: \[\s*$/.test(l)) : -1;
    return chi;
}
export function inner$retarget$bind(ls) {
    const vi2 = ls.findIndex((l) => /^\s+final visible = .+;\s*(\/\/.*)?$/.test(l));
    const ri = ls.findIndex((l, k) => k > vi2 && /^\s+return DsScaffold\($/.test(l));
    const chi = ri >= 0 ? ls.findIndex((l, k) => k > ri && /^\s+children: \[\s*$/.test(l)) : -1;
    const bind = (ls[chi].match(/^\s+/) || [''])[0] + '  ';
    return bind;
}
export function inner$retarget$bind$$step(ls, chi) {
    const bind = (ls[chi].match(/^\s+/) || [''])[0] + '  ';
    return bind;
}
export function inner$retarget$ls_L588(code) {
    const ls = code.split('\n');
    return ls;
}
export function inner$retarget$li_L588(ls) {
    const li = ls.reduce((a, l, i) => (/^import '/.test(l) ? i : a), -1);
    return li;
}
export function inner$cosine$ks(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    return ks;
}
export function inner$pickModule$names(fields) {
    const names = new Set(fields.map((f) => f.n));
    return names;
}
export function inner$pickModule$ep(fields) {
    const ep = profile(fields.map((f) => cat(f.t)));
    return ep;
}
export function inner$arg$i(k, process) {
    const i = process.argv.indexOf(k);
    return i;
}
export function inner$seedLists$out$$after_loop(src, re) {
    const out = [];
    for (const m of src.matchAll(re)) {
        const name = m[1] || m[2];
        let d = 0, i = m.index + m[0].lastIndexOf('[');
        for (let j = i; j < src.length; j++) {
            if (src[j] === '[')
                d++;
            else if (src[j] === ']') {
                d--;
                if (d === 0) {
                    out.push({ name, body: src.slice(i + 1, j), depth: m[3].length });
                    break;
                }
            }
        }
    }
    return out;
}
export function inner$primaryKeys$map$seen$$after_loop(l) {
    const seen = new Map();
    for (const row of l.body.split('\n'))
        for (const kv of row.matchAll(/'([a-zA-Z_]\w*)':\s*((?:'(?:[^'\\]|\\.)*'|[^,}\]]+))/g)) {
            const t = guess(kv[2].trim());
            if (!seen.has(kv[1]) || seen.get(kv[1]) === 'null')
                seen.set(kv[1], t);
        }
    return seen;
}
export function inner$skinPass$wrapHelpers$$after_loop(code) {
    const wrapHelpers = {};
    for (const mm of code.matchAll(/Widget\s+(\w+)\(List<Widget>\s+(\w+)(?:,\s*\{[^}]*\})?\)\s*=>/g)) {
        let k = mm.index + mm[0].length, d = 0;
        for (; k < code.length; k++) {
            const ch = code[k];
            if ('([{'.includes(ch))
                d++;
            else if (')]}'.includes(ch))
                d--;
            else if (ch === ';' && d === 0)
                break;
        }
        const body = code.slice(mm.index + mm[0].length, k);
        if (/\bWrap\(/.test(body) && new RegExp(`children:\\s*${mm[2]}\\b`).test(body))
            wrapHelpers[mm[1]] = true;
    }
    return wrapHelpers;
}
export function inner$skinPass$k$$after_loop(code, mm) {
    let k = mm.index + mm[0].length;
    let d = 0;
    for (; k < code.length; k++) {
        const ch = code[k];
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return k;
}
export function inner$skinPass$d$$after_loop(code, mm) {
    let k = mm.index + mm[0].length;
    let d = 0;
    for (; k < code.length; k++) {
        const ch = code[k];
        if ('([{'.includes(ch))
            d++;
        else if (')]}'.includes(ch))
            d--;
        else if (ch === ';' && d === 0)
            break;
    }
    return d;
}
export function inner$retarget$arg$$after_loop(code, pn) {
    const lines = code.split('\n');
    const b = lines.findIndex((l) => new RegExp(`^\\s+'${pn}': (?:<Map<String, dynamic>>)?\\[`).test(l));
    let arg = null;
    let inst = null;
    for (let j = b; j >= 0; j--) {
        const m1 = /^\s+(\w+): \[$/.exec(lines[j]);
        if (m1 && !arg)
            arg = m1[1];
        const m2 = /^\s+static const (\w+) = (\w+)\($/.exec(lines[j]);
        if (m2) {
            inst = m2;
            break;
        }
    }
    return arg;
}
export function inner$retarget$inst$$after_loop(code, pn) {
    const lines = code.split('\n');
    const b = lines.findIndex((l) => new RegExp(`^\\s+'${pn}': (?:<Map<String, dynamic>>)?\\[`).test(l));
    let arg = null;
    let inst = null;
    for (let j = b; j >= 0; j--) {
        const m1 = /^\s+(\w+): \[$/.exec(lines[j]);
        if (m1 && !arg)
            arg = m1[1];
        const m2 = /^\s+static const (\w+) = (\w+)\($/.exec(lines[j]);
        if (m2) {
            inst = m2;
            break;
        }
    }
    return inst;
}
export function inner$retarget$metrics$$after_loop(code) {
    const numGetters = new Set([...code.matchAll(/^\s+static (?:int|double|num) get (\w+)/gm)].map((m) => m[1]));
    const metrics = [];
    const byKey = new Map();
    for (const m of code.matchAll(/(BareStat|StatHero)\(value: '(\$\{(_\w+)\.(\w+)\}[^'\n]*)', label: '([^'\n]*)'(, inkColor: \3\.\4 > 0 \? _danger)?/g)) {
        if (!numGetters.has(m[4]))
            continue;
        const row = { key: m[4], value: m[2], label: m[5], tone: m[6] ? 'danger' : 'plain', atom: m[1], isHero: m[1] === 'StatHero' };
        const prev = byKey.get(m[4]);
        if (!prev) {
            byKey.set(m[4], row);
            metrics.push(row);
        }
        else {
            if (prev.atom === 'StatHero' && row.atom === 'BareStat') {
                prev.label = row.label;
                prev.tone = row.tone;
                prev.value = row.value;
            }
            if (row.isHero)
                prev.isHero = true;
            if (row.tone === 'danger')
                prev.tone = 'danger';
        }
    }
    return metrics;
}
export function inner$retarget$byKey$$after_loop(code) {
    const numGetters = new Set([...code.matchAll(/^\s+static (?:int|double|num) get (\w+)/gm)].map((m) => m[1]));
    const metrics = [];
    const byKey = new Map();
    for (const m of code.matchAll(/(BareStat|StatHero)\(value: '(\$\{(_\w+)\.(\w+)\}[^'\n]*)', label: '([^'\n]*)'(, inkColor: \3\.\4 > 0 \? _danger)?/g)) {
        if (!numGetters.has(m[4]))
            continue;
        const row = { key: m[4], value: m[2], label: m[5], tone: m[6] ? 'danger' : 'plain', atom: m[1], isHero: m[1] === 'StatHero' };
        const prev = byKey.get(m[4]);
        if (!prev) {
            byKey.set(m[4], row);
            metrics.push(row);
        }
        else {
            if (prev.atom === 'StatHero' && row.atom === 'BareStat') {
                prev.label = row.label;
                prev.tone = row.tone;
                prev.value = row.value;
            }
            if (row.isHero)
                prev.isHero = true;
            if (row.tone === 'danger')
                prev.tone = 'danger';
        }
    }
    return byKey;
}
export function inner$retarget$ii$$after_loop(entity, ls) {
    const E = entity.replace(/[^A-Za-z0-9]/g, '');
    const si = ls.findIndex((l) => new RegExp(`^class _${E}ScreenState extends State<${E}Screen>`).test(l));
    let ii = -1;
    for (let j = si + 1; j < ls.length && !/^class /.test(ls[j]); j++)
        if (/^\s+void initState\(\) \{/.test(ls[j])) {
            ii = j;
            break;
        }
    return ii;
}
export function inner$profile$p$$after_loop(arr) {
    const p = {};
    for (const c of arr)
        p[c] = (p[c] || 0) + 1;
    return p;
}
export function inner$cosine$d$$after_loop(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    let d = 0;
    let na = 0;
    let nb = 0;
    for (const k of ks) {
        d += (a[k] || 0) * (b[k] || 0);
        na += (a[k] || 0) ** 2;
        nb += (b[k] || 0) ** 2;
    }
    return d;
}
export function inner$cosine$na$$after_loop(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    let d = 0;
    let na = 0;
    let nb = 0;
    for (const k of ks) {
        d += (a[k] || 0) * (b[k] || 0);
        na += (a[k] || 0) ** 2;
        nb += (b[k] || 0) ** 2;
    }
    return na;
}
export function inner$cosine$nb$$after_loop(a, b) {
    const ks = new Set([...Object.keys(a), ...Object.keys(b)]);
    let d = 0;
    let na = 0;
    let nb = 0;
    for (const k of ks) {
        d += (a[k] || 0) * (b[k] || 0);
        na += (a[k] || 0) ** 2;
        nb += (b[k] || 0) ** 2;
    }
    return nb;
}

export const SIGS = {
  inner$termsFor$rows: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$termsFor$sing: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$termsFor$sing$$step: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$termsFor$plur: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$termsFor$plur$$step: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$stem: [{"name":"module","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$sing: [{"name":"module","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$sing$$step: [{"name":"stem","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$rows: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$rows$$step: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"stem","d":{"t":"any"},"opt":false},{"name":"sing","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$s1: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$s1$$step: [{"name":"sing","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$p1: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false}],
  inner$sourceTerms$p1$$step: [{"name":"stem","d":{"t":"any"},"opt":false},{"name":"sing","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$swapTerms$pairs: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"dst","d":{"t":"any"},"opt":false}],
  inner$swapTerms$map$i: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$swapTerms$map$head: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$swapTerms$map$head$$step: [{"name":"l","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$swapTerms$map$tail: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$swapTerms$map$tail$$step: [{"name":"l","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$seedLists$i: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$primaryKeys$lists: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$primaryKeys$map$t: [{"name":"kv","d":{"t":"any"},"opt":false}],
  inner$primaryKeys$map$keys: [{"name":"l","d":{"t":"obj","p":[["name",{"t":"any"},false],["body",{"t":"any"},false],["depth",{"t":"any"},false]]},"opt":false}],
  inner$primaryKeys$map$keys$$step: [{"name":"seen","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$primaryKeys$map$refd: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"obj","p":[["name",{"t":"any"},false],["body",{"t":"any"},false],["depth",{"t":"any"},false]]},"opt":false}],
  inner$primaryKeys$map$refd$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"keys","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"any"},false],["type",{"t":"any"},false]]}},"opt":false}],
  inner$primaryKeys$map$rows: [{"name":"l","d":{"t":"obj","p":[["name",{"t":"any"},false],["body",{"t":"any"},false],["depth",{"t":"any"},false]]},"opt":false}],
  inner$primaryKeys$stem: [{"name":"module","d":{"t":"str"},"opt":false}],
  inner$mapKeys$f: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["n",{"t":"str"},false],["cat",{"t":"str"},false],["t",{"t":"str"},false],["chan",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$mapKeys$ck: [{"name":"k","d":{"t":"any"},"opt":false}],
  inner$mapKeys$f_L94: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["n",{"t":"str"},false],["cat",{"t":"str"},false],["t",{"t":"str"},false],["chan",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$mapKeys$f_L94$$step: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["n",{"t":"str"},false],["cat",{"t":"str"},false],["t",{"t":"str"},false],["chan",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"ck","d":{"t":"or","of":[{"t":"lit","v":["phone","email"]},{"t":"null"}]},"opt":false}],
  inner$mapKeys$cands: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["n",{"t":"str"},false],["cat",{"t":"str"},false],["t",{"t":"str"},false],["chan",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false},{"name":"used","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$callArgs$i: [{"name":"open","d":{"t":"num"},"opt":false}],
  inner$callArgs$push$t: [{"name":"cur","d":{"t":"str"},"opt":false}],
  inner$callArgs$push$m: [{"name":"cur","d":{"t":"str"},"opt":false}],
  inner$callArgs$push$m$$step: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$parentWidget$i: [{"name":"idx","d":{"t":"num"},"opt":false}],
  inner$parentWidget$skipStrBack$j: [{"name":"k","d":{"t":"num"},"opt":false}],
  inner$parentWidget$j: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$parentWidget$m: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$chipHelpers$by: [{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$chipHelpers$r: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$chipHelpers$by_L149: [{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$chipHelpers$locals: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$chipHelpers$locals$$step: [{"name":"body","d":{"t":"str"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$chipRecord$by: [{"name":"cc","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$chipRecord$m: [{"name":"call","d":{"t":"any"},"opt":false}],
  inner$chipRecord$close: [{"name":"call","d":{"t":"any"},"opt":false}],
  inner$chipRecord$close$$step: [{"name":"call","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$chipRecord$args: [{"name":"call","d":{"t":"any"},"opt":false}],
  inner$chipRecord$args$$step: [{"name":"call","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false},{"name":"close","d":{"t":"any"},"opt":false}],
  inner$skinPass$k: [{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$skinPass$body: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$skinPass$body$$step: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$skinPass$wrapRe: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$skinPass$wrapRe$$step: [{"name":"wrapHelpers","d":{"t":"obj","n":"wrapHelpers","p":[]},"opt":false}],
  inner$skinPass$hit: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$skinPass$cm0: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$skinPass$j0: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
  inner$skinPass$j0$$step: [{"name":"j","d":{"t":"num"},"opt":false},{"name":"cm0","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$skinPass$ch: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$ch$$step: [{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"isHelper","d":{"t":"bool"},"opt":false}],
  inner$skinPass$list: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$list$$step: [{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$skinPass$toRec$call: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$skinPass$toRec$o: [{"name":"call","d":{"t":"any"},"opt":false}],
  inner$skinPass$toRec$e: [{"name":"call","d":{"t":"any"},"opt":false}],
  inner$skinPass$toRec$e$$step: [{"name":"call","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
  inner$skinPass$chipsW: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"recs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$skinPass$named: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$named$$step: [{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"isHelper","d":{"t":"bool"},"opt":false}],
  inner$skinPass$j: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"ds","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$skinPass$byName: [{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$cm: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"ds","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$skinPass$cm$$step: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$skinPass$j0_L237: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"ds","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$skinPass$j0_L237$$step: [{"name":"j","d":{"t":"num"},"opt":false},{"name":"cm","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$skinPass$f: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false}],
  inner$skinPass$f$$step: [{"name":"sk","d":{"t":"any"},"opt":false}],
  inner$skinPass$kids: [{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$kids$$step: [{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$f_L257: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false}],
  inner$skinPass$f_L257$$step: [{"name":"sk","d":{"t":"any"},"opt":false}],
  inner$skinPass$f_L265: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false}],
  inner$skinPass$f_L265$$step: [{"name":"sk","d":{"t":"any"},"opt":false}],
  inner$skinPass$cells: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$cells$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$inner: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"ds","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$inner$$step: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$f_L282: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$f_L282$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$st: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$st$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$f_L293: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false}],
  inner$skinPass$f_L293$$step: [{"name":"sk","d":{"t":"any"},"opt":false}],
  inner$skinPass$f_L302: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$f_L302$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$f_L307: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$f_L307$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$hdr: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$hdr$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$skinPass$rest: [{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$f_L317: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"mainK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"subK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$skinPass$f_L317$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false},{"name":"mainK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"subK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$skinPass$forgedT: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"mainK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"subK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$skinPass$forgedT$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false},{"name":"mainK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"f","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$skinPass$inner_L323: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"mainK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"subK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"tap","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$skinPass$inner_L323$$step: [{"name":"byName","d":{"t":"any"},"opt":false},{"name":"tap","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"forgedT","d":{"t":"str"},"opt":false}],
  inner$skinPass$boxed: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"mainK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"subK","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"tap","d":{"t":"or","of":[{"t":"bool"},{"t":"null"},{"t":"str"}]},"opt":false},{"name":"parentT","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$skinPass$boxed$$step: [{"name":"parentT","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"inner","d":{"t":"str"},"opt":false}],
  inner$skinPass$f2: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$f2$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$fields: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$fields$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"byName","d":{"t":"any"},"opt":false}],
  inner$skinPass$forged: [{"name":"skin","d":{"t":"any"},"opt":false},{"name":"role","d":{"t":"str"},"opt":false},{"name":"c","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["end",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$skinPass$forged$$step: [{"name":"sk","d":{"t":"any"},"opt":false},{"name":"fields","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$skinPass$lines: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$skinPass$li: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$pk: [{"name":"module","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$retarget$k: [{"name":"module","d":{"t":"any"},"opt":false}],
  inner$retarget$ren: [{"name":"map","d":{"t":"arr","of":{"t":"obj","p":[["src",{"t":"any"},false],["dst",{"t":"null"},false],["how",{"t":"str"},false],["srcType",{"t":"any"},false],["dstType",{"t":"null"},false]]}},"opt":false}],
  inner$retarget$E: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$retarget$eLower: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$retarget$eLower$$step: [{"name":"E","d":{"t":"any"},"opt":false}],
  inner$retarget$stemSing: [{"name":"module","d":{"t":"any"},"opt":false}],
  inner$retarget$map$i: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$retarget$map$head: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$retarget$map$head$$step: [{"name":"l","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$retarget$map$tail: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$retarget$map$tail$$step: [{"name":"l","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$retarget$classes: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$pub: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$pub$$step: [{"name":"classes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$retarget$stem: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$stem$$step: [{"name":"pub","d":{"t":"any"},"opt":false}],
  inner$retarget$clsMap: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$clsMap$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"classes","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"stem","d":{"t":"any"},"opt":false}],
  inner$retarget$srcE: [{"name":"srcT","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["by",{"t":"str"},false],["name",{"t":"any"},false],["singular",{"t":"any"},false],["plural",{"t":"any"},false]]},{"t":"obj","p":[["singular",{"t":"any"},false],["plural",{"t":"any"},false],["forms",{"t":"arr","of":{"t":"any"}},false],["by",{"t":"str"},false],["name",{"t":"str"},false]]}]},"opt":false}],
  inner$retarget$sw: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"srcT","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["by",{"t":"str"},false],["name",{"t":"any"},false],["singular",{"t":"any"},false],["plural",{"t":"any"},false]]},{"t":"obj","p":[["singular",{"t":"any"},false],["plural",{"t":"any"},false],["forms",{"t":"arr","of":{"t":"any"}},false],["by",{"t":"str"},false],["name",{"t":"str"},false]]}]},"opt":false},{"name":"dstT","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["singular",{"t":"any"},false],["plural",{"t":"any"},false],["forms",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$retarget$coreFile: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$retarget$coreFile$$step: [{"name":"eLower","d":{"t":"any"},"opt":false}],
  inner$retarget$lines: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$lastImp: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$need: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$retarget$need$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"coreFile","d":{"t":"str"},"opt":false}],
  inner$retarget$ret: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$ch: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$ch$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"ret","d":{"t":"num"},"opt":false}],
  inner$retarget$ind: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$ind$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$retarget$stHead: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$stHead$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$pn: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$pv: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$pv$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$retarget$hasAct: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$hasAct$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"num"},"opt":false}],
  inner$retarget$ch_L402: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$ch_L402$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"num"},"opt":false}],
  inner$retarget$ind_L404: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$ind_L404$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"ch","d":{"t":"any"},"opt":false}],
  inner$retarget$apply: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$apply$$step: [{"name":"pv","d":{"t":"any"},"opt":false},{"name":"hasAct","d":{"t":"any"},"opt":false}],
  inner$retarget$li: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$lines_L427: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$ci: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$ind_L430: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$ind_L430$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"any"},"opt":false}],
  inner$retarget$mappedDst: [{"name":"map","d":{"t":"arr","of":{"t":"obj","p":[["src",{"t":"any"},false],["dst",{"t":"null"},false],["how",{"t":"str"},false],["srcType",{"t":"any"},false],["dstType",{"t":"null"},false]]}},"opt":false}],
  inner$retarget$lines_L442: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$clsAt$m: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$retarget$a: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$retarget$a$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$retarget$b: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$retarget$b$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$retarget$dbi: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$dbi$$step: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$retarget$m1: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$retarget$m1$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$retarget$m2: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$retarget$m2$$step: [{"name":"lines","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$retarget$numGetters: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$row: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$retarget$prev: [{"name":"byKey","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$retarget$hero: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$hero$$step: [{"name":"metrics","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$retarget$heroHow: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$heroHow$$step: [{"name":"hero","d":{"t":"obj","p":[["key",{"t":"any"},false],["value",{"t":"any"},false],["label",{"t":"any"},false],["tone",{"t":"str"},false],["atom",{"t":"any"},false],["isHero",{"t":"bool"},false]]},"opt":false}],
  inner$retarget$label: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"dt","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["singular",{"t":"any"},false],["plural",{"t":"any"},false],["forms",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$retarget$label$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"dt","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["singular",{"t":"any"},false],["plural",{"t":"any"},false],["forms",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$retarget$ls: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$gi: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"mt","d":{"t":"obj","p":[["key",{"t":"any"},false],["value",{"t":"any"},false],["label",{"t":"any"},false],["tone",{"t":"str"},false],["atom",{"t":"any"},false],["isHero",{"t":"bool"},false]]},"opt":false}],
  inner$retarget$body: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"mt","d":{"t":"obj","p":[["key",{"t":"any"},false],["value",{"t":"any"},false],["label",{"t":"any"},false],["tone",{"t":"str"},false],["atom",{"t":"any"},false],["isHero",{"t":"bool"},false]]},"opt":false}],
  inner$retarget$body$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"gi","d":{"t":"any"},"opt":false}],
  inner$retarget$m: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"mt","d":{"t":"obj","p":[["key",{"t":"any"},false],["value",{"t":"any"},false],["label",{"t":"any"},false],["tone",{"t":"str"},false],["atom",{"t":"any"},false],["isHero",{"t":"bool"},false]]},"opt":false}],
  inner$retarget$m$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$retarget$ind_L485: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"mt","d":{"t":"obj","p":[["key",{"t":"any"},false],["value",{"t":"any"},false],["label",{"t":"any"},false],["tone",{"t":"str"},false],["atom",{"t":"any"},false],["isHero",{"t":"bool"},false]]},"opt":false}],
  inner$retarget$ind_L485$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"gi","d":{"t":"any"},"opt":false}],
  inner$retarget$idKey: [{"name":"map","d":{"t":"arr","of":{"t":"obj","p":[["src",{"t":"any"},false],["dst",{"t":"null"},false],["how",{"t":"str"},false],["srcType",{"t":"any"},false],["dstType",{"t":"null"},false]]}},"opt":false}],
  inner$retarget$ls_L494: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$di: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$di$$step: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$bi: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$bi$$step: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$j: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$j$$step: [{"name":"bi","d":{"t":"num"},"opt":false}],
  inner$retarget$m_L497: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$retarget$m_L497$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"j","d":{"t":"any"},"opt":false}],
  inner$retarget$ti: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$ti$$step: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$n: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$n$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"ti","d":{"t":"num"},"opt":false}],
  inner$retarget$sw_L501: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$sw_L501$$step: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$items: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$items$$step: [{"name":"sw","d":{"t":"any"},"opt":false}],
  inner$retarget$rowsExpr: [{"name":"countExpr","d":{"t":"any"},"opt":false},{"name":"countHow","d":{"t":"any"},"opt":false}],
  inner$retarget$F: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$retarget$F$$step: [{"name":"E","d":{"t":"any"},"opt":false}],
  inner$retarget$out: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"map","d":{"t":"arr","of":{"t":"obj","p":[["src",{"t":"any"},false],["dst",{"t":"null"},false],["how",{"t":"str"},false],["srcType",{"t":"any"},false],["dstType",{"t":"null"},false]]}},"opt":false},{"name":"code","d":{"t":"any"},"opt":false},{"name":"reservedKeys","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false},{"name":"countExpr","d":{"t":"any"},"opt":false},{"name":"countHow","d":{"t":"any"},"opt":false},{"name":"dt","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["singular",{"t":"any"},false],["plural",{"t":"any"},false],["forms",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"rowsOfKeys","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"seedSeam","d":{"t":"any"},"opt":false}],
  inner$retarget$out$$step: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"reservedKeys","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false},{"name":"countExpr","d":{"t":"any"},"opt":false},{"name":"countHow","d":{"t":"any"},"opt":false},{"name":"metrics","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"hero","d":{"t":"obj","p":[["key",{"t":"any"},false],["value",{"t":"any"},false],["label",{"t":"any"},false],["tone",{"t":"str"},false],["atom",{"t":"any"},false],["isHero",{"t":"bool"},false]]},"opt":false},{"name":"heroHow","d":{"t":"lit","v":["אין מדדים ⇒ count","ה-StatHero של הזהב (המטרה המוצהרת)","המדד הראשון שהזהב צובע-סכנה כשאינו-אפס","אין StatHero/מדד-סכנה ⇒ המדד הראשון"]},"opt":false},{"name":"dt","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["singular",{"t":"any"},false],["plural",{"t":"any"},false],["forms",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"label","d":{"t":"any"},"opt":false},{"name":"rowsOfKeys","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"idKey","d":{"t":"lit","v":["id"]},"opt":false},{"name":"seedSeam","d":{"t":"any"},"opt":false},{"name":"rowsExpr","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"F","d":{"t":"str"},"opt":false}],
  inner$retarget$ls_L533: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$ci_L534: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$ci_L534$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$si: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$si$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$open: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$retarget$open$$step: [{"name":"F","d":{"t":"str"},"opt":false}],
  inner$retarget$j_L543: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$j_L543$$step: [{"name":"si","d":{"t":"num"},"opt":false}],
  inner$retarget$sup: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$sup$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"ii","d":{"t":"num"},"opt":false}],
  inner$retarget$ls_L554: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$ci_L555: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$ci_L555$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$si_L556: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$si_L556$$step: [{"name":"E","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$vi: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$stHead_L558: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$stHead_L558$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"si","d":{"t":"num"},"opt":false}],
  inner$retarget$ii: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$ii$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"si","d":{"t":"num"},"opt":false}],
  inner$retarget$sup_L564: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$sup_L564$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"ii","d":{"t":"num"},"opt":false}],
  inner$retarget$vi2: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$ind_L569: [{"name":"vl","d":{"t":"any"},"opt":false}],
  inner$retarget$ri: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$ri$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"vi2","d":{"t":"num"},"opt":false}],
  inner$retarget$chi: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$chi$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"ri","d":{"t":"num"},"opt":false}],
  inner$retarget$bind: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$retarget$bind$$step: [{"name":"ls","d":{"t":"any"},"opt":false},{"name":"chi","d":{"t":"any"},"opt":false}],
  inner$retarget$ls_L588: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$li_L588: [{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$cosine$ks: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$pickModule$names: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["e",{"t":"str"},false],["n",{"t":"str"},false],["o",{"t":"bool"},false],["t",{"t":"str"},false]]}},"opt":false}],
  inner$pickModule$ep: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["e",{"t":"str"},false],["n",{"t":"str"},false],["o",{"t":"bool"},false],["t",{"t":"str"},false]]}},"opt":false}],
  inner$arg$i: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$seedLists$out$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"re","d":{"t":"any"},"opt":false}],
  inner$primaryKeys$map$seen$$after_loop: [{"name":"l","d":{"t":"obj","p":[["name",{"t":"any"},false],["body",{"t":"any"},false],["depth",{"t":"any"},false]]},"opt":false}],
  inner$skinPass$wrapHelpers$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$skinPass$k$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$skinPass$d$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"mm","d":{"t":"any"},"opt":false}],
  inner$retarget$arg$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$retarget$inst$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false},{"name":"pn","d":{"t":"any"},"opt":false}],
  inner$retarget$metrics$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$byKey$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$retarget$ii$$after_loop: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"ls","d":{"t":"any"},"opt":false}],
  inner$profile$p$$after_loop: [{"name":"arr","d":{"t":"any"},"opt":false}],
  inner$cosine$d$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$cosine$na$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$cosine$nb$$after_loop: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
};
