// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/shape.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const NUM = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
function tableShape(ent) {
    const rows = ent.examples || [];
    const keys = new Set(rows.map((r) => String(r[0] || '').trim()).filter(Boolean));
    return ent.fields.map((f, i) => {
        const vals = rows.map((r) => String(r[i] ?? '').trim());
        const ne = vals.filter(Boolean);
        const kind = i === 0 ? 'key' : ne.length && ne.every((v) => NUM.test(v)) ? 'num' : ne.length && ne.every((v) => keys.has(v)) ? 'ref' : new Set(ne).size < ne.length ? 'shared' : 'text';
        return { i, label: f.label, kind };
    });
}
function dartParams(src, fn) {
    const m = src.match(new RegExp(`^[\\w<>, ?]+\\s+${fn}\\(`, 'm'));
    if (!m)
        return null;
    let d = 0, cur = '';
    const out = [];
    for (let i = m.index + m[0].length; i < src.length; i++) {
        const ch = src[i];
        if (ch === ')' && d === 0) {
            if (cur.trim())
                out.push(cur.trim());
            return out.map((x) => x.replace(/\s+/g, ' '));
        }
        if ('(<'.includes(ch))
            d++;
        else if (')>'.includes(ch))
            d--;
        if (ch === ',' && d === 0) {
            out.push(cur.trim());
            cur = '';
        }
        else
            cur += ch;
    }
    return null;
}
const SHAPED = (c) => c.kind === 'num' || c.kind === 'ref' || c.kind === 'shared';
const cellOf = (v) => (Array.isArray(v) ? v.join(', ') : v === true ? '✓' : v === false ? '' : v == null ? '' : String(v));
function layoutOf(out) {
    if (Array.isArray(out) && out.length && out.every(Array.isArray))
        return { listKey: null, rows: out.map((g) => ({ group: g })), scalars: [], groups: true }; // קבוצות (אשכולות) ⇒ שורה לכל קבוצה
    if (Array.isArray(out))
        return { listKey: null, rows: out, scalars: [] };
    if (out && typeof out === 'object') {
        const lk = Object.keys(out).find((k) => Array.isArray(out[k]) && out[k].every((x) => x && typeof x === 'object'));
        return { listKey: lk || null, rows: lk ? out[lk] : [], scalars: Object.keys(out).filter((k) => k !== lk && (typeof out[k] !== 'object' || out[k] === null)) };
    }
    return { listKey: null, rows: [], scalars: [] };
}
const lit = (v) => "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$') + "'";
const cell = (m) => (m.kind === 'num' ? null : m.list ? `'${m.k}': [(r[${lit(m.label)}] ?? '').trim()].where((x) => x.isNotEmpty).toList()` : `'${m.k}': (r[${lit(m.label)}] ?? '').trim()`);
const sockCell = (s) => (s.t === 'list' ? `'${s.k}': [(r[${lit(s.label)}] ?? '').trim()].where((x) => x.isNotEmpty).toList()` : s.t === 'num' ? `'${s.k}': num.tryParse((r[${lit(s.label)}] ?? '').trim()) ?? 0` : s.t === 'bool' ? `'${s.k}': (r[${lit(s.label)}] ?? '').trim().isNotEmpty` : `'${s.k}': (r[${lit(s.label)}] ?? '').trim()`);
function linkShape(parent, child) {
    const pk = new Set((parent.examples || []).map((r) => String(r[0] || '').trim()).filter(Boolean));
    return child.fields.map((f, i) => {
        const ne = (child.examples || []).map((r) => String(r[i] ?? '').trim()).filter(Boolean);
        return { i, label: f.label, kind: i === 0 ? 'key' : ne.length && ne.every((v) => pk.has(v)) ? 'xref' : ne.length && ne.every((v) => NUM.test(v)) ? 'num' : 'text' };
    });
}
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
export function inner$tableShape$keys(ent) {
    const rows = ent.examples || [];
    const keys = new Set(rows.map((r) => String(r[0] || '').trim()).filter(Boolean));
    return keys;
}
export function inner$tableShape$keys$$step(rows) {
    const keys = new Set(rows.map((r) => String(r[0] || '').trim()).filter(Boolean));
    return keys;
}
export function inner$tableShape$map$vals(rows, i) {
    const vals = rows.map((r) => String(r[i] ?? '').trim());
    return vals;
}
export function inner$tableShape$map$ne(rows, i) {
    const vals = rows.map((r) => String(r[i] ?? '').trim());
    const ne = vals.filter(Boolean);
    return ne;
}
export function inner$tableShape$map$ne$$step(vals) {
    const ne = vals.filter(Boolean);
    return ne;
}
export function inner$tableShape$map$kind(rows, keys, i) {
    const vals = rows.map((r) => String(r[i] ?? '').trim());
    const ne = vals.filter(Boolean);
    const kind = i === 0 ? 'key' : ne.length && ne.every((v) => NUM.test(v)) ? 'num' : ne.length && ne.every((v) => keys.has(v)) ? 'ref' : new Set(ne).size < ne.length ? 'shared' : 'text';
    return kind;
}
export function inner$tableShape$map$kind$$step(keys, i, ne) {
    const kind = i === 0 ? 'key' : ne.length && ne.every((v) => NUM.test(v)) ? 'num' : ne.length && ne.every((v) => keys.has(v)) ? 'ref' : new Set(ne).size < ne.length ? 'shared' : 'text';
    return kind;
}
export function inner$rowAtoms$base(f) {
    const base = f.replace('.contract.md', '');
    return base;
}
export function inner$rowAtoms$m(c) {
    const m = c.match(/\*\*קלט:\*\*([\s\S]{0,400}?)\*\*פלט/);
    return m;
}
export function inner$rowAtoms$br(c) {
    const m = c.match(/\*\*קלט:\*\*([\s\S]{0,400}?)\*\*פלט/);
    const br = m[1].match(/\{([^{}]+)\}/);
    return br;
}
export function inner$rowAtoms$br$$step(m) {
    const br = m[1].match(/\{([^{}]+)\}/);
    return br;
}
export function inner$rowAtoms$keys(c) {
    const m = c.match(/\*\*קלט:\*\*([\s\S]{0,400}?)\*\*פלט/);
    const br = m[1].match(/\{([^{}]+)\}/);
    const keys = br[1].split(',').map((s) => s.trim().replace(/[‏‎]/g, '')).map((s) => s.match(/^(\w+)(\?)?(\[\])?$/)).filter(Boolean).map((k) => ({ k: k[1], opt: !!k[2], list: !!k[3] }));
    return keys;
}
export function inner$rowAtoms$keys$$step(br) {
    const keys = br[1].split(',').map((s) => s.trim().replace(/[‏‎]/g, '')).map((s) => s.match(/^(\w+)(\?)?(\[\])?$/)).filter(Boolean).map((k) => ({ k: k[1], opt: !!k[2], list: !!k[3] }));
    return keys;
}
export function inner$rowAtoms$params(fn, dsrc) {
    const params = dartParams(dsrc, fn);
    return params;
}
export function inner$rowAtoms$one(fn, dsrc) {
    const params = dartParams(dsrc, fn);
    const one = params.length === 1 && /^(List|Iterable|dynamic|Object)/.test(params[0]);
    return one;
}
export function inner$rowAtoms$one$$step(params) {
    const one = params.length === 1 && /^(List|Iterable|dynamic|Object)/.test(params[0]);
    return one;
}
export function inner$rowAtoms$sockets(fn, dsrc) {
    const params = dartParams(dsrc, fn);
    const sockets = params.length > 1 && /^(List|Iterable)/.test(params[0]) ? params.slice(1).map((p) => p.match(/^(String|List<String>|num|int|double|bool)\??\s+Function\((?:dynamic|Object\??|Map[^)]*)(?:\s+\w+)?\)\s+\w+$/)) : null;
    return sockets;
}
export function inner$rowAtoms$sockets$$step(params) {
    const sockets = params.length > 1 && /^(List|Iterable)/.test(params[0]) ? params.slice(1).map((p) => p.match(/^(String|List<String>|num|int|double|bool)\??\s+Function\((?:dynamic|Object\??|Map[^)]*)(?:\s+\w+)?\)\s+\w+$/)) : null;
    return sockets;
}
export function inner$rowAtoms$sock(fn, dsrc) {
    const params = dartParams(dsrc, fn);
    const sockets = params.length > 1 && /^(List|Iterable)/.test(params[0]) ? params.slice(1).map((p) => p.match(/^(String|List<String>|num|int|double|bool)\??\s+Function\((?:dynamic|Object\??|Map[^)]*)(?:\s+\w+)?\)\s+\w+$/)) : null;
    const sock = sockets && sockets.every(Boolean) && sockets.length <= 3 ? sockets.map((m) => ({ t: m[1] === 'List<String>' ? 'list' : m[1] === 'String' ? 'str' : m[1] === 'bool' ? 'bool' : 'num' })) : null;
    return sock;
}
export function inner$rowAtoms$sock$$step(sockets) {
    const sock = sockets && sockets.every(Boolean) && sockets.length <= 3 ? sockets.map((m) => ({ t: m[1] === 'List<String>' ? 'list' : m[1] === 'String' ? 'str' : m[1] === 'bool' ? 'bool' : 'num' })) : null;
    return sock;
}
export function inner$dartParams$m(src, fn) {
    const m = src.match(new RegExp(`^[\\w<>, ?]+\\s+${fn}\\(`, 'm'));
    return m;
}
export function inner$dartParams$i(src, fn) {
    const m = src.match(new RegExp(`^[\\w<>, ?]+\\s+${fn}\\(`, 'm'));
    let i = m.index + m[0].length;
    return i;
}
export function inner$dartParams$i$$step(m) {
    let i = m.index + m[0].length;
    return i;
}
export function inner$sockVal$fn$v(col, r) {
    const v = String(r[col.i] ?? '').trim();
    return v;
}
export function inner$conv$fn$v(col, r) {
    const v = String(r[col.i] ?? '').trim();
    return v;
}
export function inner$search$shape(ent) {
    const shape = tableShape(ent);
    return shape;
}
export function inner$search$ex(ent) {
    const ex = ent.examples.filter((r) => String(r[0] || '').trim());
    return ex;
}
export function inner$search$run$j(o) {
    const j = JSON.stringify(o);
    return j;
}
export function inner$search$fn0(twins, a) {
    const fn0 = twins.get(a.name);
    return fn0;
}
export function inner$search$opts(ent, a) {
    const shape = tableShape(ent);
    const S = a.sockets || [];
    const opts = [...a.keys.map((k) => [...shape.flatMap((c) => (c.kind === 'ref' ? [{ c, list: true }, { c, list: false }] : [{ c, list: k.list }])), ...(k.opt ? [null] : [])]),
        ...S.map((s) => shape.filter((c) => c.kind !== 'key' && (s.t !== 'num' || c.kind === 'num')).map((c) => ({ c, sock: s.t })))];
    return opts;
}
export function inner$search$opts$$step(shape, a, S) {
    const opts = [...a.keys.map((k) => [...shape.flatMap((c) => (c.kind === 'ref' ? [{ c, list: true }, { c, list: false }] : [{ c, list: k.list }])), ...(k.opt ? [null] : [])]),
        ...S.map((s) => shape.filter((c) => c.kind !== 'key' && (s.t !== 'num' || c.kind === 'num')).map((c) => ({ c, sock: s.t })))];
    return opts;
}
export function inner$search$combos(ent, a) {
    const shape = tableShape(ent);
    const S = a.sockets || [];
    const opts = [...a.keys.map((k) => [...shape.flatMap((c) => (c.kind === 'ref' ? [{ c, list: true }, { c, list: false }] : [{ c, list: k.list }])), ...(k.opt ? [null] : [])]),
        ...S.map((s) => shape.filter((c) => c.kind !== 'key' && (s.t !== 'num' || c.kind === 'num')).map((c) => ({ c, sock: s.t })))];
    const combos = opts.reduce((acc, o) => acc.flatMap((x) => o.map((y) => [...x, y])), [[]]).slice(0, 4000);
    return combos;
}
export function inner$search$combos$$step(opts) {
    const combos = opts.reduce((acc, o) => acc.flatMap((x) => o.map((y) => [...x, y])), [[]]).slice(0, 4000);
    return combos;
}
export function inner$search$used(mp) {
    const used = [...new Set(mp.filter(Boolean).map((x) => x.c))];
    return used;
}
export function inner$search$shaped(mp) {
    const used = [...new Set(mp.filter(Boolean).map((x) => x.c))];
    const shaped = used.filter(SHAPED);
    return shaped;
}
export function inner$search$shaped$$step(used) {
    const shaped = used.filter(SHAPED);
    return shaped;
}
export function inner$search$every$alt(ex, c) {
    const alt = ex.map((r, ri) => r.map((v, i) => (i !== c.i ? v : c.kind === 'num' ? String((Number(v) || 0) + 7) : c.kind === 'shared' ? (v ? `${v}·${ri}` : '') : '')));
    return alt;
}
export function inner$search$score(mp) {
    const used = [...new Set(mp.filter(Boolean).map((x) => x.c))];
    const shaped = used.filter(SHAPED);
    const score = used.length * 10 + shaped.length * 5 + mp.filter(Boolean).length;
    return score;
}
export function inner$search$score$$step(mp, used, shaped) {
    const score = used.length * 10 + shaped.length * 5 + mp.filter(Boolean).length;
    return score;
}
export function inner$layoutOf$lk(out) {
    const lk = Object.keys(out).find((k) => Array.isArray(out[k]) && out[k].every((x) => x && typeof x === 'object'));
    return lk;
}
export function inner$emit$nums(shp) {
    const nums = shp.map.filter((m) => m.kind === 'num');
    return nums;
}
export function inner$emit$rowExpr(shp, entSlug) {
    const nums = shp.map.filter((m) => m.kind === 'num');
    const S = shp.sockets || [];
    const rowExpr = `appStore.records('${entSlug}').map((r) => <String, dynamic>{${shp.map.filter((m) => m.kind !== 'num').map(cell).join(', ')}${nums.length ? ', ' : ''}${nums.map((m) => `if (num.tryParse((r[${lit(m.label)}] ?? '').trim()) != null) '${m.k}': num.tryParse((r[${lit(m.label)}] ?? '').trim())!`).join(', ')}${S.length ? ', ' + S.map(sockCell).join(', ') : ''}}).toList()`;
    return rowExpr;
}
export function inner$emit$rowExpr$$step(shp, entSlug, nums, S) {
    const rowExpr = `appStore.records('${entSlug}').map((r) => <String, dynamic>{${shp.map.filter((m) => m.kind !== 'num').map(cell).join(', ')}${nums.length ? ', ' : ''}${nums.map((m) => `if (num.tryParse((r[${lit(m.label)}] ?? '').trim()) != null) '${m.k}': num.tryParse((r[${lit(m.label)}] ?? '').trim())!`).join(', ')}${S.length ? ', ' + S.map(sockCell).join(', ') : ''}}).toList()`;
    return rowExpr;
}
export function inner$emit$L(shp) {
    const L = layoutOf(shp.out);
    return L;
}
export function inner$emit$keys0(shp) {
    const L = layoutOf(shp.out);
    const keys0 = L.rows.length ? Object.keys(L.rows[0]).filter((k) => L.rows.every((r) => typeof r[k] !== 'object' || r[k] === null || Array.isArray(r[k]))) : [];
    return keys0;
}
export function inner$emit$keys0$$step(L) {
    const keys0 = L.rows.length ? Object.keys(L.rows[0]).filter((k) => L.rows.every((r) => typeof r[k] !== 'object' || r[k] === null || Array.isArray(r[k]))) : [];
    return keys0;
}
export function inner$emit$cols(shp) {
    const L = layoutOf(shp.out);
    const keys0 = L.rows.length ? Object.keys(L.rows[0]).filter((k) => L.rows.every((r) => typeof r[k] !== 'object' || r[k] === null || Array.isArray(r[k]))) : [];
    const cols = keys0.filter((k, i) => !keys0.slice(0, i).some((j) => L.rows.every((r) => cellOf(r[j]) === cellOf(r[k]))));
    return cols;
}
export function inner$emit$cols$$step(L, keys0) {
    const cols = keys0.filter((k, i) => !keys0.slice(0, i).some((j) => L.rows.every((r) => cellOf(r[j]) === cellOf(r[k]))));
    return cols;
}
export function inner$emit$itemsExpr(shp) {
    const L = layoutOf(shp.out);
    const itemsExpr = L.groups ? `(res as List).map((g) => <String, dynamic>{'group': g}).toList()` : L.listKey ? `((res['${L.listKey}'] ?? const []) as List).cast<Map>()` : `(res as List).cast<Map>()`;
    return itemsExpr;
}
export function inner$emit$itemsExpr$$step(L) {
    const itemsExpr = L.groups ? `(res as List).map((g) => <String, dynamic>{'group': g}).toList()` : L.listKey ? `((res['${L.listKey}'] ?? const []) as List).cast<Map>()` : `(res as List).cast<Map>()`;
    return itemsExpr;
}
export function inner$emit$test(shp, cls, slug, title, pkg, seedSlug, exp) {
    const test = seedSlug ? [`// 🎯 מבחן-קבלה (חיפוש לפי צורה): הדוגמאות של הבעלים ⇒ מה ש-${shp.atom} החזיר עליהן (תאום-JS) חייב להופיע במסך. חולל; אל תערוך.`,
        `import 'package:flutter/material.dart';`, `import 'package:flutter_test/flutter_test.dart';`, `import 'package:${pkg}/genesis/dart-gen-bs/gen_${seedSlug}.dart';`, `import 'package:${pkg}/genesis/dart-gen-bs/gen_${slug}.dart';`,
        'void main() {', `  testWidgets(${lit(`צורה: ${title} ⇒ ${shp.atom}`)}, (tester) async {`, '    seedExamples();', `    await tester.pumpWidget(const MaterialApp(home: ${cls}()));`, '    await tester.pump();',
        ...exp.map((t) => `    expect(find.text(${lit(t)}), findsWidgets, reason: ${lit(`${shp.atom} על הדוגמאות החזיר «${t}»`)});`), '  });', '}', ''].join('\n') : null;
    return test;
}
export function inner$linkShape$pk(parent) {
    const pk = new Set((parent.examples || []).map((r) => String(r[0] || '').trim()).filter(Boolean));
    return pk;
}
export function inner$linkShape$map$ne(child, i) {
    const ne = (child.examples || []).map((r) => String(r[i] ?? '').trim()).filter(Boolean);
    return ne;
}
export function inner$searchLinked$keys(parent) {
    const keys = parent.examples.map((r) => String(r[0] || '').trim()).filter(Boolean);
    return keys;
}
export function inner$searchLinked$nums(text) {
    const nums = [...String(text).matchAll(/(?<![\d.])(\d+(?:\.\d+)?)(?![\d.])/g)].map((m) => +m[1]);
    return nums;
}
export function inner$searchLinked$words(text) {
    const words = String(text).split(/\s+/).filter(Boolean);
    return words;
}
export function inner$searchLinked$isWithin(text, within) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const isWithin = words.some((w) => within.includes(w));
    return isWithin;
}
export function inner$searchLinked$isWithin$$step(within, words) {
    const isWithin = words.some((w) => within.includes(w));
    return isWithin;
}
export function inner$searchLinked$shape(parent, child) {
    const shape = linkShape(parent, child);
    return shape;
}
export function inner$searchLinked$xs(parent, child) {
    const shape = linkShape(parent, child);
    const xs = shape.filter((c) => c.kind === 'xref');
    return xs;
}
export function inner$searchLinked$xs$$step(shape) {
    const xs = shape.filter((c) => c.kind === 'xref');
    return xs;
}
export function inner$searchLinked$ns(parent, child) {
    const shape = linkShape(parent, child);
    const ns = shape.filter((c) => c.kind === 'num');
    return ns;
}
export function inner$searchLinked$ns$$step(shape) {
    const ns = shape.filter((c) => c.kind === 'num');
    return ns;
}
export function inner$searchLinked$rows(child) {
    const rows = child.examples.filter((r) => String(r[0] || '').trim());
    return rows;
}
export function inner$searchLinked$vals(child, c) {
    const rows = child.examples.filter((r) => String(r[0] || '').trim());
    const vals = rows.map((r) => Number(String(r[c.i] ?? '').trim()));
    return vals;
}
export function inner$searchLinked$vals$$step(rows, c) {
    const vals = rows.map((r) => Number(String(r[c.i] ?? '').trim()));
    return vals;
}
export function inner$searchLinked$b(a) {
    let b = a + 1;
    return b;
}
export function inner$searchLinked$linked(per) {
    const linked = [...new Set(per.map((t) => t.child.label))];
    return linked;
}
export function inner$searchLinked$cands(per) {
    const cands = [...per.map((t) => [t])];
    return cands;
}
export function inner$searchLinked$b_L160(a) {
    let b = a + 1;
    return b;
}
export function inner$searchLinked$j(out) {
    const j = JSON.stringify(out);
    return j;
}
export function inner$searchLinked$every$every$rows(t, u) {
    const rows = t.rows.map((r, ri) => r.map((v, i) => (i !== u.i ? v : u === (t.filt || {}).col ? String((Number(v) || 0) <= t.filt.v ? t.filt.v + 1 : t.filt.v - 1) /* עמודת-התנאי: כל שורה עוברת לצד השני של הסף */ : u.kind === 'num' ? String((Number(v) || 0) + 7 * (ri + 1)) : '')));
    return rows;
}
export function inner$searchLinked$usedNums(terms) {
    const usedNums = terms.filter((t) => t.filt).length;
    return usedNums;
}
export function inner$searchLinked$score(text, per, terms) {
    const nums = [...String(text).matchAll(/(?<![\d.])(\d+(?:\.\d+)?)(?![\d.])/g)].map((m) => +m[1]);
    const usedNums = terms.filter((t) => t.filt).length;
    const score = terms.length * 20 + usedNums * 15 * Math.min(1, nums.length) + terms.filter((t) => t.op === 'net').length * 5 + terms.filter((t) => t.filt && t.filt === (per.find((p) => p.filt && p.filt.col === t.filt.col) || {}).filt).length;
    return score;
}
export function inner$searchLinked$score$$step(nums, per, terms, usedNums) {
    const score = terms.length * 20 + usedNums * 15 * Math.min(1, nums.length) + terms.filter((t) => t.op === 'net').length * 5 + terms.filter((t) => t.filt && t.filt === (per.find((p) => p.filt && p.filt.col === t.filt.col) || {}).filt).length;
    return score;
}
export function inner$searchLinked$m(want, results) {
    const m = results.filter((r) => r.out.every((o) => want[o.key] === undefined || Math.abs(want[o.key] - o.value) < 1e-9) && Object.keys(want).every((k) => r.out.some((o) => o.key === k)));
    return m;
}
export function inner$emitLinked$head(shp) {
    const terms = shp.calc.terms || [{ child: shp.child, ...shp.calc }];
    const head = terms.map((t) => (t.op === 'net' ? `${t.child}.${t.n}: ${t.to} − ${t.from}` : `${t.child}.${t.n}: ${t.to}`) + (t.filt ? ` (${t.filt.col} ${t.filt.cmp === 'le' ? '≤' : '≥'} ${t.filt.v})` : '')).join(' + ');
    return head;
}
export function inner$emitLinked$head$$step(terms) {
    const head = terms.map((t) => (t.op === 'net' ? `${t.child}.${t.n}: ${t.to} − ${t.from}` : `${t.child}.${t.n}: ${t.to}`) + (t.filt ? ` (${t.filt.col} ${t.filt.cmp === 'le' ? '≤' : '≥'} ${t.filt.v})` : '')).join(' + ');
    return head;
}
export function inner$emitLinked$exp(shp) {
    const exp = [...new Set(shp.out.flatMap((o) => [o.key, fmt(o.value)]))];
    return exp;
}
export function inner$searchLinked$cands$$after_loop(per) {
    const cands = [...per.map((t) => [t])];
    for (let a = 0; a < per.length; a++)
        for (let b = a + 1; b < per.length; b++)
            if (per[a].child !== per[b].child)
                cands.push([per[a], per[b]]);
    return cands;
}

export const SIGS = {
  inner$tableShape$keys: [{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$tableShape$keys$$step: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$tableShape$map$vals: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$tableShape$map$ne: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$tableShape$map$ne$$step: [{"name":"vals","d":{"t":"any"},"opt":false}],
  inner$tableShape$map$kind: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"keys","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$tableShape$map$kind$$step: [{"name":"keys","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"any"},"opt":false},{"name":"ne","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$base: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$m: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$br: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$br$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$keys: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$keys$$step: [{"name":"br","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$params: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"dsrc","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$one: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"dsrc","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$one$$step: [{"name":"params","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"str"}}]},"opt":false}],
  inner$rowAtoms$sockets: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"dsrc","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$sockets$$step: [{"name":"params","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"str"}}]},"opt":false}],
  inner$rowAtoms$sock: [{"name":"fn","d":{"t":"any"},"opt":false},{"name":"dsrc","d":{"t":"any"},"opt":false}],
  inner$rowAtoms$sock$$step: [{"name":"sockets","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]}}]},"opt":false}],
  inner$dartParams$m: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$dartParams$i: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"fn","d":{"t":"any"},"opt":false}],
  inner$dartParams$i$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$sockVal$fn$v: [{"name":"col","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$conv$fn$v: [{"name":"col","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$search$shape: [{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$search$ex: [{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$search$run$j: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$search$fn0: [{"name":"twins","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$search$opts: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$search$opts$$step: [{"name":"shape","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"any"},"opt":false}],
  inner$search$combos: [{"name":"ent","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$search$combos$$step: [{"name":"opts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$search$used: [{"name":"mp","d":{"t":"any"},"opt":false}],
  inner$search$shaped: [{"name":"mp","d":{"t":"any"},"opt":false}],
  inner$search$shaped$$step: [{"name":"used","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$search$every$alt: [{"name":"ex","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$search$score: [{"name":"mp","d":{"t":"any"},"opt":false}],
  inner$search$score$$step: [{"name":"mp","d":{"t":"any"},"opt":false},{"name":"used","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"shaped","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$layoutOf$lk: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$emit$nums: [{"name":"shp","d":{"t":"any"},"opt":false}],
  inner$emit$rowExpr: [{"name":"shp","d":{"t":"any"},"opt":false},{"name":"entSlug","d":{"t":"any"},"opt":false}],
  inner$emit$rowExpr$$step: [{"name":"shp","d":{"t":"any"},"opt":false},{"name":"entSlug","d":{"t":"any"},"opt":false},{"name":"nums","d":{"t":"any"},"opt":false},{"name":"S","d":{"t":"any"},"opt":false}],
  inner$emit$L: [{"name":"shp","d":{"t":"any"},"opt":false}],
  inner$emit$keys0: [{"name":"shp","d":{"t":"any"},"opt":false}],
  inner$emit$keys0$$step: [{"name":"L","d":{"t":"or","of":[{"t":"obj","p":[["listKey",{"t":"null"},false],["rows",{"t":"arr","of":{"t":"obj","p":[["group",{"t":"arr","of":{"t":"any"}},false]]}},false],["scalars",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"bool"},false]]},{"t":"obj","p":[["listKey",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["rows",{"t":"any"},false],["scalars",{"t":"arr","of":{"t":"str"}},false],["groups",{"t":"undef"},true]]}]},"opt":false}],
  inner$emit$cols: [{"name":"shp","d":{"t":"any"},"opt":false}],
  inner$emit$cols$$step: [{"name":"L","d":{"t":"or","of":[{"t":"obj","p":[["listKey",{"t":"null"},false],["rows",{"t":"arr","of":{"t":"obj","p":[["group",{"t":"arr","of":{"t":"any"}},false]]}},false],["scalars",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"bool"},false]]},{"t":"obj","p":[["listKey",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["rows",{"t":"any"},false],["scalars",{"t":"arr","of":{"t":"str"}},false],["groups",{"t":"undef"},true]]}]},"opt":false},{"name":"keys0","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$emit$itemsExpr: [{"name":"shp","d":{"t":"any"},"opt":false}],
  inner$emit$itemsExpr$$step: [{"name":"L","d":{"t":"or","of":[{"t":"obj","p":[["listKey",{"t":"null"},false],["rows",{"t":"arr","of":{"t":"obj","p":[["group",{"t":"arr","of":{"t":"any"}},false]]}},false],["scalars",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"bool"},false]]},{"t":"obj","p":[["listKey",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["rows",{"t":"any"},false],["scalars",{"t":"arr","of":{"t":"str"}},false],["groups",{"t":"undef"},true]]}]},"opt":false}],
  inner$emit$test: [{"name":"shp","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"slug","d":{"t":"str"},"opt":false},{"name":"title","d":{"t":"any"},"opt":false},{"name":"pkg","d":{"t":"str"},"opt":false},{"name":"seedSlug","d":{"t":"null"},"opt":false},{"name":"exp","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$linkShape$pk: [{"name":"parent","d":{"t":"any"},"opt":false}],
  inner$linkShape$map$ne: [{"name":"child","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$searchLinked$keys: [{"name":"parent","d":{"t":"any"},"opt":false}],
  inner$searchLinked$nums: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$searchLinked$words: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$searchLinked$isWithin: [{"name":"text","d":{"t":"str"},"opt":false},{"name":"within","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$searchLinked$isWithin$$step: [{"name":"within","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"words","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$searchLinked$shape: [{"name":"parent","d":{"t":"any"},"opt":false},{"name":"child","d":{"t":"any"},"opt":false}],
  inner$searchLinked$xs: [{"name":"parent","d":{"t":"any"},"opt":false},{"name":"child","d":{"t":"any"},"opt":false}],
  inner$searchLinked$xs$$step: [{"name":"shape","d":{"t":"any"},"opt":false}],
  inner$searchLinked$ns: [{"name":"parent","d":{"t":"any"},"opt":false},{"name":"child","d":{"t":"any"},"opt":false}],
  inner$searchLinked$ns$$step: [{"name":"shape","d":{"t":"any"},"opt":false}],
  inner$searchLinked$rows: [{"name":"child","d":{"t":"any"},"opt":false}],
  inner$searchLinked$vals: [{"name":"child","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$searchLinked$vals$$step: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$searchLinked$b: [{"name":"a","d":{"t":"num"},"opt":false}],
  inner$searchLinked$linked: [{"name":"per","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$searchLinked$cands: [{"name":"per","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$searchLinked$b_L160: [{"name":"a","d":{"t":"num"},"opt":false}],
  inner$searchLinked$j: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$searchLinked$every$every$rows: [{"name":"t","d":{"t":"or","of":[{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["from",{"t":"any"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false]]},{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false],["from",{"t":"undef"},true]]}]},"opt":false},{"name":"u","d":{"t":"any"},"opt":false}],
  inner$searchLinked$usedNums: [{"name":"terms","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["from",{"t":"any"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false]]},{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false],["from",{"t":"undef"},true]]}]}},"opt":false}],
  inner$searchLinked$score: [{"name":"text","d":{"t":"str"},"opt":false},{"name":"per","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"terms","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["from",{"t":"any"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false]]},{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false],["from",{"t":"undef"},true]]}]}},"opt":false}],
  inner$searchLinked$score$$step: [{"name":"nums","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"per","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"terms","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["from",{"t":"any"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false]]},{"t":"obj","p":[["child",{"t":"any"},false],["rows",{"t":"any"},false],["op",{"t":"str"},false],["to",{"t":"any"},false],["n",{"t":"any"},false],["filt",{"t":"null"},false],["from",{"t":"undef"},true]]}]}},"opt":false},{"name":"usedNums","d":{"t":"num"},"opt":false}],
  inner$searchLinked$m: [{"name":"want","d":{"t":"null"},"opt":false},{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$emitLinked$head: [{"name":"shp","d":{"t":"any"},"opt":false}],
  inner$emitLinked$head$$step: [{"name":"terms","d":{"t":"any"},"opt":false}],
  inner$emitLinked$exp: [{"name":"shp","d":{"t":"any"},"opt":false}],
  inner$searchLinked$cands$$after_loop: [{"name":"per","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
