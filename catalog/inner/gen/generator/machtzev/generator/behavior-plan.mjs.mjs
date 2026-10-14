// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/behavior-plan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const heTok = (s) => [...String(s).matchAll(/[֐-׿][֐-׿"'\-״]{1,}/g)].map((m) => m[0].replace(/^["'\-]+|["'\-]+$/g, '')).filter((t) => t.length >= 2);
const parts = (t) => t.split(/[-\/·]/).filter((x) => x.length >= 2).map((x) => (x.length > 3 && /^[הובלמשכ]/.test(x) ? x.slice(1) : x));
const bag = (tokens) => new Set(tokens.flatMap((t) => [t, ...parts(t)]));
const TYPE_WORDS = /^(String|num|int|double|bool|dynamic|Object|DateTime|void|List|Map|Set|Iterable|Function)$/;
const stripName = (t) => { const m = String(t || '').trim().match(/^(.*?)\s+([A-Za-z_]\w*)$/); if (!m)
    return String(t || ''); return (/[>)?\]]$/.test(m[1]) || TYPE_WORDS.test(m[1])) ? m[1] : String(t || ''); };
const norm = (t) => stripName(String(t || 'dynamic')).replace(/\s+/g, '').replace(/\?$/, '');
const exprId = (v) => v.k === 'p' ? `p${v.i}` : v.k === 'c' ? v.dart : v.k === 't' ? 'now' : v.k === 'h' ? `?${v.name}` : v.k === 'w' ? 'w' : v.k === 'g' ? `if(${exprId(v.pred)}){${exprId(v.body)}}` : v.k === 'f' ? `λ${v.id}(${Array.from({ length: v.m }, (_, j) => '_').concat(v.args.map(exprId)).join(',')})` : `${v.id}(${v.args.map(exprId).join(',')})`;
const treeAtoms = (v) => (v.k === 'p' || v.k === 'c' || v.k === 't' || v.k === 'h' || v.k === 'w') ? [] : v.k === 'g' ? [...treeAtoms(v.pred), ...treeAtoms(v.body)] : [v, ...v.args.flatMap(treeAtoms)];
const leafKinds = (v) => v.k === 'a' || v.k === 'f' ? v.args.flatMap(leafKinds) : v.k === 'g' ? [...leafKinds(v.pred), ...leafKinds(v.body)] : [v.k];
const FNT = /^(.+?)\s+Function\((.*)\)$/;
const parseFnT = (t) => { const m = stripName(String(t || '')).replace(/\?$/, '').trim().match(FNT); return m ? { ret: m[1].trim(), params: m[2].trim() ? m[2].split(',').map((x) => x.trim().split(/\s+/)[0]) : [] } : null; };
const sumArgcOf = (v) => (v.k === 'p' || v.k === 'c' || v.k === 't' || v.k === 'h' || v.k === 'w') ? 0 : v.k === 'g' ? sumArgcOf(v.pred) + sumArgcOf(v.body) : v.args.reduce((s, a) => s + (a.k === 'c' ? 0 : 1) + sumArgcOf(a), 0);
const cvOf = (d) => { const s = String(d).trim(); if (/^'.*'$/.test(s))
    return s.slice(1, -1).replace(/\\'/g, "'"); if (/^-?\d+(\.\d+)?$/.test(s))
    return +s; if (s === 'true')
    return true; if (s === 'false')
    return false; if (s === 'null')
    return null; return s; };
const numFam = (t) => (/^(int|double|num)$/.test(t) ? 'num' : t);
const normNum = (t) => numFam(norm(t));
const sigOkBack = (c, need) => c.argc === need.params.length
    && c.params.every((p, i) => { const a = normNum(p), b = normNum(need.params[i]); return a === b || a === 'dynamic' || b === 'dynamic'; })
    && (normNum(c.ret) === normNum(need.ret) || normNum(c.ret) === 'dynamic' || normNum(need.ret) === 'dynamic');
const sigExact = (c, need) => c.argc === need.params.length && c.params.every((p, i) => norm(p) === norm(need.params[i])) && norm(c.ret) === norm(need.ret);
const PAIR_RE = /'([A-Za-z_][A-Za-z0-9_]*)'\s*:\s*('(?:[^'\\]|\\.)*'|-?\d+(?:\.\d+)?|true|false)/g;
const dqf = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
function needStructure(need) {
    const bad = [];
    if (!Array.isArray(need.params) || need.params.some((t) => !t || typeof t !== 'string'))
        bad.push('params אינו רשימת-טיפוסים');
    if (!need.ret || typeof need.ret !== 'string')
        bad.push('אין ret (טיפוס-התשובה)');
    if (!Array.isArray(need.examples) || !need.examples.length)
        bad.push('אין דוגמאות — בלי דוגמה אין הוכחה-בריצה (§20-ג)');
    else
        need.examples.forEach((ex, j) => { if (!Array.isArray(ex) || typeof ex[0] !== 'string' || typeof ex[1] !== 'string' || !ex[1].trim())
            bad.push(`דוגמה ${j}: חסר [קלט, בדיקה]`); });
    if (need.clock) {
        if (!need.clock.type)
            bad.push('שקע-שעון בלי type');
        (Array.isArray(need.examples) ? need.examples : []).forEach((ex, j) => { if (!(ex && ex[2] && ex[2].now))
            bad.push(`דוגמה ${j}: שקע-שעון הוצהר ואין now (ברירת-מחדל שקטה)`); });
    }
    if (need.world && !need.world.type)
        bad.push('שקע-עולם בלי type');
    if (need.human && !Array.isArray(need.human))
        bad.push('human אינו רשימת-שקעים');
    return bad;
}
export function inner$stripName$m(t) {
    const m = String(t || '').trim().match(/^(.*?)\s+([A-Za-z_]\w*)$/);
    return m;
}
export function inner$sigOk$every$a(p) {
    const a = norm(p);
    return a;
}
export function inner$sigOk$every$b(need, i) {
    const b = norm(need.params[i]);
    return b;
}
export function inner$normT$v(NORMT, t) {
    let v = NORMT.get(t);
    return v;
}
export function inner$normT$s(t) {
    const s = norm(t);
    return s;
}
export function inner$schemaKeys$e(SHAPE_OPS, entity) {
    const e = SHAPE_OPS.find((x) => x.entity === entity);
    return e;
}
export function inner$parseFnT$m(t) {
    const m = stripName(String(t || '')).replace(/\?$/, '').trim().match(FNT);
    return m;
}
export function inner$toCandidate$sumArgc(root) {
    const sumArgc = treeAtoms(root).reduce((s, n) => s + n.args.filter((a) => a.k !== 'c').length, 0);
    return sumArgc;
}
export function inner$streamTrees$atomsByRet$a(byRetMemo, w) {
    let a = byRetMemo.get(w);
    return a;
}
export function inner$streamTrees$fnT$f(fnTMemo, want) {
    let f = fnTMemo.get(want);
    return f;
}
export function inner$streamTrees$innerPlugsOf$a(plugMemo, k) {
    let a = plugMemo.get(k);
    return a;
}
export function inner$streamTrees$innerPlugs$ft(want) {
    const ft = parseFnT(want);
    return ft;
}
export function inner$streamTrees$lambdasOf$kk(cap, k) {
    const kk = k + '|' + cap;
    return kk;
}
export function inner$streamTrees$lambdasOf$a(lamMemo, cap, k) {
    const kk = k + '|' + cap;
    let a = lamMemo.get(kk);
    return a;
}
export function inner$streamTrees$lambdasOf$a$$step(lamMemo, kk) {
    let a = lamMemo.get(kk);
    return a;
}
export function inner$streamTrees$combos$a2(argc, c) {
    const a2 = argc + (c.k === 'c' ? 0 : 1);
    return a2;
}
export function inner$streamTrees$lambdas$ft(want) {
    const ft = parseFnT(want);
    return ft;
}
export function inner$streamTrees$lambdas$rest(g, m) {
    const rest = g.params.slice(m);
    return rest;
}
export function inner$streamTrees$fill$a2(argcAcc, sub) {
    const a2 = argcAcc + (sub.value.k === 'c' ? 0 : 1) + sub.argc;
    return a2;
}
export function inner$take$lim(keep) {
    const lim = keep === Infinity ? Infinity : keep + Math.max(keep >> 2, 256);
    return lim;
}
export function inner$take$ceil(pureRows, exactNodes) {
    const ceil = exactNodes * Math.max(1, ...pureRows.map((r) => r.argc));
    return ceil;
}
export function inner$take$sa(root) {
    const sa = sumArgcOf(root);
    return sa;
}
export function inner$take$id(root) {
    const id = exprId(root);
    return id;
}
export function inner$cvOf$s(d) {
    const s = String(d).trim();
    return s;
}
export function inner$valueSearch$requiredKinds(need) {
    const requiredKinds = [...(need.clock ? ['t'] : []), ...((need.human || []).length ? ['h'] : []), ...(need.world ? ['w'] : [])];
    return requiredKinds;
}
export function inner$valueSearch$leaves(need, P, CONSTS) {
    const leaves = [...P.map((t, i) => ({ node: { k: 'p', i }, type: t, nodes: 0, cost: 0, ps: [i] })),
        ...CONSTS.map((c) => ({ node: { k: 'c', dart: c.dart, type: c.type, cv: cvOf(c.dart) }, type: c.type, nodes: 0, cost: 0, ps: [] })),
        ...(need.clock ? [{ node: { k: 't' }, type: need.clock.type || 'String', nodes: 0, cost: 0, ps: [] }] : []),
        ...(need.human || []).map((h) => ({ node: { k: 'h', name: h.name, type: h.type }, type: h.type, nodes: 0, cost: 0, ps: [] })),
        ...(need.world ? [{ node: { k: 'w' }, type: need.world.type, nodes: 0, cost: 0, ps: [] }] : [])];
    return leaves;
}
export function inner$valueSearch$SOCK_LEAVES(need) {
    const SOCK_LEAVES = [...(need.clock ? [{ k: 't', type: need.clock.type || 'String' }] : []), ...(need.human || []).map((h) => ({ k: 'h', name: h.name, type: h.type })), ...(need.world ? [{ k: 'w', type: need.world.type }] : [])];
    return SOCK_LEAVES;
}
export function inner$valueSearch$plugsFor$ft(want) {
    const ft = parseFnT(want);
    return ft;
}
export function inner$valueSearch$plugsFor$inner$f2(w2) {
    const f2 = parseFnT(w2);
    return f2;
}
export function inner$valueSearch$plugsFor$capped(PLUG_CAP, out) {
    const capped = out.slice(0, PLUG_CAP);
    return capped;
}
export function inner$valueSearch$s(reach, k) {
    const s = new Set(reach[k - 1]);
    return s;
}
export function inner$valueSearch$pool(need, P, CONSTS) {
    const leaves = [...P.map((t, i) => ({ node: { k: 'p', i }, type: t, nodes: 0, cost: 0, ps: [i] })),
        ...CONSTS.map((c) => ({ node: { k: 'c', dart: c.dart, type: c.type, cv: cvOf(c.dart) }, type: c.type, nodes: 0, cost: 0, ps: [] })),
        ...(need.clock ? [{ node: { k: 't' }, type: need.clock.type || 'String', nodes: 0, cost: 0, ps: [] }] : []),
        ...(need.human || []).map((h) => ({ node: { k: 'h', name: h.name, type: h.type }, type: h.type, nodes: 0, cost: 0, ps: [] })),
        ...(need.world ? [{ node: { k: 'w' }, type: need.world.type, nodes: 0, cost: 0, ps: [] }] : [])];
    let pool = leaves.slice();
    return pool;
}
export function inner$valueSearch$pool$$step(leaves) {
    let pool = leaves.slice();
    return pool;
}
export function inner$valueSearch$fresh(need, P, CONSTS) {
    const leaves = [...P.map((t, i) => ({ node: { k: 'p', i }, type: t, nodes: 0, cost: 0, ps: [i] })),
        ...CONSTS.map((c) => ({ node: { k: 'c', dart: c.dart, type: c.type, cv: cvOf(c.dart) }, type: c.type, nodes: 0, cost: 0, ps: [] })),
        ...(need.clock ? [{ node: { k: 't' }, type: need.clock.type || 'String', nodes: 0, cost: 0, ps: [] }] : []),
        ...(need.human || []).map((h) => ({ node: { k: 'h', name: h.name, type: h.type }, type: h.type, nodes: 0, cost: 0, ps: [] })),
        ...(need.world ? [{ node: { k: 'w' }, type: need.world.type, nodes: 0, cost: 0, ps: [] }] : [])];
    let fresh = leaves.slice();
    return fresh;
}
export function inner$valueSearch$fresh$$step(leaves) {
    let fresh = leaves.slice();
    return fresh;
}
export function inner$valueSearch$i(usable) {
    let i = usable.length - 1;
    return i;
}
export function inner$valueSearch$jsOk(interp) {
    const jsOk = (interp.rows || []).filter((r) => r.x === 'js');
    return jsOk;
}
export function inner$valueSearch$jsIds(interp) {
    const jsOk = (interp.rows || []).filter((r) => r.x === 'js');
    const jsIds = new Set(jsOk.map((r) => r.id));
    return jsIds;
}
export function inner$valueSearch$jsIds$$step(jsOk) {
    const jsIds = new Set(jsOk.map((r) => r.id));
    return jsIds;
}
export function inner$valueSearch$roots(isVoid, usable, effects) {
    const roots = isVoid ? [...usable, ...effects] : usable;
    return roots;
}
export function inner$valueSearch$left(maxDepth, depth) {
    const left = maxDepth - depth;
    return left;
}
export function inner$valueSearch$prod(slots) {
    let prod = slots.reduce((n, s) => n * s.length, 1);
    return prod;
}
export function inner$valueSearch$n(slots) {
    const PROD = 20000;
    const n = Math.max(2, Math.floor(Math.pow(PROD, 1 / slots.length)));
    return n;
}
export function inner$valueSearch$nodes(args) {
    const nodes = 1 + args.reduce((n, x) => n + x.nodes, 0);
    return nodes;
}
export function inner$valueSearch$ps(args) {
    const ps = [...new Set(args.flatMap((x) => x.ps))];
    return ps;
}
export function inner$valueSearch$node(g, args) {
    const node = { k: 'a', id: g.id, file: g.file, args: args.map((x) => x.node) };
    return node;
}
export function inner$valueSearch$levelAll(capLevel, exprs) {
    const levelAll = exprs.slice(0, capLevel);
    return levelAll;
}
export function inner$valueSearch$level(capLevel, exprs) {
    const levelAll = exprs.slice(0, capLevel);
    const level = levelAll.slice();
    return level;
}
export function inner$valueSearch$level$$step(levelAll) {
    const level = levelAll.slice();
    return level;
}
export function inner$valueSearch$j(cands, process) {
    const j = cands.findIndex((c) => c.id === process.env.BP_WANT);
    return j;
}
export function inner$valueSearch$covers(P, e) {
    const covers = e.ps.length === P.length;
    return covers;
}
export function inner$valueSearch$usesAll(need, e) {
    const requiredKinds = [...(need.clock ? ['t'] : []), ...((need.human || []).length ? ['h'] : []), ...(need.world ? ['w'] : [])];
    const usesAll = requiredKinds.every((k) => leafKinds(e.node).includes(k));
    return usesAll;
}
export function inner$valueSearch$usesAll$$step(requiredKinds, e) {
    const usesAll = requiredKinds.every((k) => leafKinds(e.node).includes(k));
    return usesAll;
}
export function inner$valueSearch$jsNodes(interp, e) {
    const jsOk = (interp.rows || []).filter((r) => r.x === 'js');
    const jsIds = new Set(jsOk.map((r) => r.id));
    const jsNodes = treeAtoms(e.node).filter((n) => jsIds.has(n.id));
    return jsNodes;
}
export function inner$valueSearch$jsNodes$$step(jsIds, e) {
    const jsNodes = treeAtoms(e.node).filter((n) => jsIds.has(n.id));
    return jsNodes;
}
export function inner$valueSearch$direct(interp, e) {
    const jsOk = (interp.rows || []).filter((r) => r.x === 'js');
    const jsIds = new Set(jsOk.map((r) => r.id));
    const jsNodes = treeAtoms(e.node).filter((n) => jsIds.has(n.id));
    const direct = jsNodes.length === 1 && jsNodes[0] === e.node && e.node.args.every((a) => a.k === 'p' || a.k === 'c');
    return direct;
}
export function inner$valueSearch$direct$$step(e, jsNodes) {
    const direct = jsNodes.length === 1 && jsNodes[0] === e.node && e.node.args.every((a) => a.k === 'p' || a.k === 'c');
    return direct;
}
export function inner$valueSearch$glevel(capLevel, gs) {
    const glevel = gs.slice(0, capLevel);
    return glevel;
}
export function inner$valueSearch$top(wins) {
    const top = wins.slice(0, 8);
    return top;
}
export function inner$valueSearch$outs(wins, pr, p) {
    const top = wins.slice(0, 8);
    const outs = top.map((w) => JSON.stringify((pr[w.id] || {}).vals?.[p]));
    return outs;
}
export function inner$valueSearch$outs$$step(top, pr, p) {
    const outs = top.map((w) => JSON.stringify((pr[w.id] || {}).vals?.[p]));
    return outs;
}
export function inner$rowsFromDart$ret(m) {
    const ret = m[1].trim();
    return ret;
}
export function inner$rowsFromDart$params(m) {
    const params = m[3].trim() ? m[3].split(',').map((x) => x.trim().replace(/\s+\w+$/, '')) : [];
    return params;
}
export function inner$plan$rows(extraRows, rows0) {
    const rows = extraRows.length ? [...rows0, ...extraRows] : rows0;
    return rows;
}
export function inner$plan$needsIds(needs) {
    const needsIds = Object.keys(needs);
    return needsIds;
}
export function inner$plan$rowById(extraRows, rows0) {
    const rows = extraRows.length ? [...rows0, ...extraRows] : rows0;
    const rowById = new Map(rows.map((r) => [r.id, r]));
    return rowById;
}
export function inner$plan$rowById$$step(rows) {
    const rowById = new Map(rows.map((r) => [r.id, r]));
    return rowById;
}
export function inner$plan$scorerFor$demand(need) {
    const demand = bag(heTok(need.demand));
    return demand;
}
export function inner$plan$proveStream$slice(cands, i) {
    const BATCH = 120;
    const slice = cands.slice(i, i + BATCH);
    return slice;
}
export function inner$plan$cap2(need) {
    const CAP2 = 100000;
    const cap2 = need.reuse ? Math.min(CAP2, 5000) : CAP2;
    return cap2;
}
export function inner$plan$seenW(pool) {
    const seenW = new Set(pool.map((c) => c.id));
    return seenW;
}
export function inner$plan$map$nodes(c) {
    const nodes = c.nodes ?? (c.tree ? treeAtoms(c.tree).length : (c.chain ? c.chain.length : 1));
    return nodes;
}
export function inner$plan$map$sumArgc(P, c) {
    const sumArgc = c.sumArgc ?? (c.chain ? P.length + 1 : 0);
    return sumArgc;
}
export function inner$plan$map$file(c) {
    const file = c.chain ? c.chain[0].file : (c.tree ? treeAtoms(c.tree)[0].file : null);
    return file;
}
export function inner$plan$cands(singles, comps) {
    const cands = [...singles, ...comps]
        .sort((x, y) => (y.proven - x.proven) || (y.ok - x.ok) || ((x.chain || x.tree ? 1 : 0) - (y.chain || y.tree ? 1 : 0)) || (x.nodes - y.nodes) || (x.sumArgc - y.sumArgc) || (y.score - x.score) || (x.exact === y.exact ? (x.id < y.id ? -1 : 1) : x.exact ? -1 : 1));
    return cands;
}
export function inner$plan$ok(proofs, id, singles, comps) {
    const pf = proofs[id] || {};
    const cands = [...singles, ...comps]
        .sort((x, y) => (y.proven - x.proven) || (y.ok - x.ok) || ((x.chain || x.tree ? 1 : 0) - (y.chain || y.tree ? 1 : 0)) || (x.nodes - y.nodes) || (x.sumArgc - y.sumArgc) || (y.score - x.score) || (x.exact === y.exact ? (x.id < y.id ? -1 : 1) : x.exact ? -1 : 1));
    const top = cands[0] || null;
    const ok = top && (pf.error ? top.score > 0 : top.proven);
    return ok;
}
export function inner$plan$ok$$step(pf, top) {
    const ok = top && (pf.error ? top.score > 0 : top.proven);
    return ok;
}
export function inner$plan$doubt(proofs, id) {
    const pf = proofs[id] || {};
    const doubt = Object.entries(pf).filter(([k, v]) => v && v.unknown > 0 && v.ok + v.unknown === v.total).map(([k]) => k).slice(0, 5);
    return doubt;
}
export function inner$plan$doubt$$step(pf) {
    const doubt = Object.entries(pf).filter(([k, v]) => v && v.unknown > 0 && v.ok + v.unknown === v.total).map(([k]) => k).slice(0, 5);
    return doubt;
}
export function inner$plan$map$cell(need, c) {
    const cell = `${c.ok}/${need.examples ? need.examples.length : 0}`;
    return cell;
}
export function inner$plan$socketsUsed(proofs, id, singles, comps) {
    const pf = proofs[id] || {};
    const cands = [...singles, ...comps]
        .sort((x, y) => (y.proven - x.proven) || (y.ok - x.ok) || ((x.chain || x.tree ? 1 : 0) - (y.chain || y.tree ? 1 : 0)) || (x.nodes - y.nodes) || (x.sumArgc - y.sumArgc) || (y.score - x.score) || (x.exact === y.exact ? (x.id < y.id ? -1 : 1) : x.exact ? -1 : 1));
    const top = cands[0] || null;
    const ok = top && (pf.error ? top.score > 0 : top.proven);
    const socketsUsed = ok && top.tree ? [...new Set(leafKinds(top.tree))].filter((k) => k !== 'p').map((k) => ({ c: 'literal', t: 'clock', h: 'human', w: 'world' })[k] || k).concat(top.tree.k === 'g' ? ['guard'] : []).concat(top.crossLang && top.crossLang.length ? ['cross-language'] : []) : [];
    return socketsUsed;
}
export function inner$plan$socketsUsed$$step(top, ok) {
    const socketsUsed = ok && top.tree ? [...new Set(leafKinds(top.tree))].filter((k) => k !== 'p').map((k) => ({ c: 'literal', t: 'clock', h: 'human', w: 'world' })[k] || k).concat(top.tree.k === 'g' ? ['guard'] : []).concat(top.crossLang && top.crossLang.length ? ['cross-language'] : []) : [];
    return socketsUsed;
}
export function inner$forwardSigOf$f(atomId, rows) {
    const f = rows.find((r) => r.id === atomId);
    return f;
}
export function inner$sigOkBack$every$a(p) {
    const a = normNum(p);
    return a;
}
export function inner$sigOkBack$every$b(need, i) {
    const b = normNum(need.params[i]);
    return b;
}
export function inner$backwardNeeds$P(sig) {
    const P = sig.params.slice();
    return P;
}
export function inner$backwardNeeds$add$k(n) {
    const k = JSON.stringify([n.params, n.ret]);
    return k;
}
export function inner$backwardNeeds$forEach$params(P) {
    const params = P.slice();
    return params;
}
export function inner$backwardSearch$exact(need, c) {
    const exact = sigExact(c, need);
    return exact;
}
export function inner$backwardSearch$tag(need) {
    const tag = need.kind + '#' + need.target;
    return tag;
}
export function inner$backwardSearch$prev(byId, c) {
    const prev = byId.get(c.id);
    return prev;
}
export function inner$backwardSearch$cands(atomId, rows, needs) {
    const byId = new Map();
    for (const need of needs)
        for (const c of rows) {
            if (c.id === atomId || !sigOkBack(c, need))
                continue;
            const exact = sigExact(c, need);
            const tag = need.kind + '#' + need.target;
            const prev = byId.get(c.id);
            if (!prev)
                byId.set(c.id, { id: c.id, file: c.file, params: c.params, ret: c.ret, argc: c.argc, needs: [tag], exact });
            else {
                if (!prev.needs.includes(tag))
                    prev.needs.push(tag);
                prev.exact = prev.exact || exact;
            }
        }
    const cands = [...byId.values()];
    return cands;
}
export function inner$backwardSearch$cands$$step(byId) {
    const cands = [...byId.values()];
    return cands;
}
export function inner$backwardSearch$total(examples) {
    const total = examples ? examples.length : 0;
    return total;
}
export function inner$backwardSearch$candidates(atomId, examples, rows, needs, proof) {
    const byId = new Map();
    for (const need of needs)
        for (const c of rows) {
            if (c.id === atomId || !sigOkBack(c, need))
                continue;
            const exact = sigExact(c, need);
            const tag = need.kind + '#' + need.target;
            const prev = byId.get(c.id);
            if (!prev)
                byId.set(c.id, { id: c.id, file: c.file, params: c.params, ret: c.ret, argc: c.argc, needs: [tag], exact });
            else {
                if (!prev.needs.includes(tag))
                    prev.needs.push(tag);
                prev.exact = prev.exact || exact;
            }
        }
    const cands = [...byId.values()];
    const total = examples ? examples.length : 0;
    const candidates = cands.map((c) => ({ id: c.id, file: c.file, exact: c.exact, proven: proof[c.id] ? proof[c.id].ok === proof[c.id].total : false, ok: proof[c.id] ? proof[c.id].ok : 0, total, needs: c.needs }))
        .sort((x, y) => (y.proven - x.proven) || (y.ok - x.ok) || (y.exact - x.exact) || (x.id < y.id ? -1 : 1));
    return candidates;
}
export function inner$backwardSearch$candidates$$step(cands, proof, total) {
    const candidates = cands.map((c) => ({ id: c.id, file: c.file, exact: c.exact, proven: proof[c.id] ? proof[c.id].ok === proof[c.id].total : false, ok: proof[c.id] ? proof[c.id].ok : 0, total, needs: c.needs }))
        .sort((x, y) => (y.proven - x.proven) || (y.ok - x.ok) || (y.exact - x.exact) || (x.id < y.id ? -1 : 1));
    return candidates;
}
export function inner$fixturePool$rel(d, f) {
    const rel = `${d}/${f}`;
    return rel;
}
export function inner$fixturePool$keys(m) {
    const row = {};
    for (const p of m[0].matchAll(PAIR_RE))
        row[p[1]] = { dart: p[2], js: p[2][0] === "'" ? p[2].slice(1, -1).replace(/\\(.)/g, '$1') : p[2] === 'true' ? true : p[2] === 'false' ? false : Number(p[2]) };
    const keys = Object.keys(row);
    return keys;
}
export function inner$fixturePool$keys$$step(row) {
    const keys = Object.keys(row);
    return keys;
}
export function inner$fixtureRecords$keys(allow, r) {
    const keys = r.keys.filter((k) => allow.includes(k));
    return keys;
}
export function inner$goalExamples$numeric(d) {
    const numeric = d.kind === 'sumBy' || d.kind === 'avgBy' || d.kind === 'countBy';
    return numeric;
}
export function inner$goalExamples$srcs(fx) {
    const srcs = [...new Set(fx.rows.map((r) => r.src))];
    return srcs;
}
export function inner$goalExamples$at(fx) {
    const at = [0, Math.floor(fx.rows.length / 2), fx.rows.length - 1].filter((i, j, a) => a.indexOf(i) === j);
    return at;
}
export function inner$goalExamples$pick(fx) {
    const at = [0, Math.floor(fx.rows.length / 2), fx.rows.length - 1].filter((i, j, a) => a.indexOf(i) === j);
    const pick = at.map((i) => fx.rows[i]);
    return pick;
}
export function inner$goalExamples$pick$$step(fx, at) {
    const pick = at.map((i) => fx.rows[i]);
    return pick;
}
export function inner$goalExamples$keys(fx) {
    const at = [0, Math.floor(fx.rows.length / 2), fx.rows.length - 1].filter((i, j, a) => a.indexOf(i) === j);
    const pick = at.map((i) => fx.rows[i]);
    const keys = [...new Set(pick.flatMap((r) => r.keys))].filter((k) => pick.every((r) => r.row[k]));
    return keys;
}
export function inner$goalExamples$keys$$step(pick) {
    const keys = [...new Set(pick.flatMap((r) => r.keys))].filter((k) => pick.every((r) => r.row[k]));
    return keys;
}
export function inner$goalExamples$sum(fx) {
    const at = [0, Math.floor(fx.rows.length / 2), fx.rows.length - 1].filter((i, j, a) => a.indexOf(i) === j);
    const pick = at.map((i) => fx.rows[i]);
    const sum = pick.reduce((s, r) => s + r.v, 0);
    return sum;
}
export function inner$goalExamples$sum$$step(pick) {
    const sum = pick.reduce((s, r) => s + r.v, 0);
    return sum;
}
export function inner$goalExamples$now(fx) {
    const now = fx.rows[fx.rows.length - 1].v;
    return now;
}
export function inner$goalExamples$ctx0(fx) {
    const now = fx.rows[fx.rows.length - 1].v;
    const ctx0 = { now: dqf(now) };
    return ctx0;
}
export function inner$goalExamples$ctx0$$step(now) {
    const ctx0 = { now: dqf(now) };
    return ctx0;
}
export function inner$goalExamples$at_L637(fx) {
    const at = [0, Math.floor(fx.rows.length / 2), fx.rows.length - 1].filter((i, j, a) => a.indexOf(i) === j);
    return at;
}
export function inner$goalExamples$P0(fx) {
    const at = [0, Math.floor(fx.rows.length / 2), fx.rows.length - 1].filter((i, j, a) => a.indexOf(i) === j);
    const P0 = at.map((i) => fx.rows[i]);
    return P0;
}
export function inner$goalExamples$P0$$step(fx, at) {
    const P0 = at.map((i) => fx.rows[i]);
    return P0;
}
export function inner$goalExamples$keys_L653(P) {
    const keys = [...new Set(P.flatMap((r) => r.keys))].filter((k) => P.every((r) => r.row[k]));
    return keys;
}
export function inner$scanUnits$rel(s, f) {
    const rel = `${s.glob}/${f}`;
    return rel;
}
export function inner$scanUnits$forEach$t(l) {
    const t = l.trim();
    return t;
}
export function inner$rng$a(seed) {
    let a = seed >>> 0;
    return a;
}
export function inner$seededSample$r(seed) {
    const r = rng(seed);
    return r;
}
export function inner$seededSample$a(arr) {
    const a = arr.slice();
    return a;
}
export function inner$seededSample$i(a) {
    let i = a.length - 1;
    return i;
}
export function inner$hamtzaaNeeds$out(r) {
    const out = String(r.stdout || '').trim();
    return out;
}
export function inner$hamtzaaNeeds$rows(j) {
    const rows = Array.isArray(j) ? j : Array.isArray(j.rows) ? j.rows : Array.isArray(j.needs) ? j.needs : [];
    return rows;
}
export function inner$runGoal$goal(raw) {
    const goal = /^\s*\{/.test(raw) ? JSON.parse(raw) : { text: raw.split('\n').filter((l) => l.trim())[0] || '' };
    return goal;
}
export function inner$runGoal$text(raw) {
    const goal = /^\s*\{/.test(raw) ? JSON.parse(raw) : { text: raw.split('\n').filter((l) => l.trim())[0] || '' };
    const text = String(goal.text || '').trim();
    return text;
}
export function inner$runGoal$text$$step(goal) {
    const text = String(goal.text || '').trim();
    return text;
}
export function inner$runGoal$outRel(opts, ns) {
    const outRel = opts.out || `dart-gen-bs/gen_goal_${ns}.dart`;
    return outRel;
}
export function inner$runGoal$needs(raw) {
    const goal = /^\s*\{/.test(raw) ? JSON.parse(raw) : { text: raw.split('\n').filter((l) => l.trim())[0] || '' };
    let needs = goal.needs && Object.keys(goal.needs).length ? goal.needs : null;
    return needs;
}
export function inner$runGoal$needs$$step(goal) {
    let needs = goal.needs && Object.keys(goal.needs).length ? goal.needs : null;
    return needs;
}
export function inner$runGoal$hamBy(ham) {
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    return hamBy;
}
export function inner$runGoal$struct(need) {
    const struct = needStructure(need);
    return struct;
}
export function inner$runGoal$h(ham, id) {
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    const h = hamBy ? hamBy.get(id) : null;
    return h;
}
export function inner$runGoal$h$$step(hamBy, id) {
    const h = hamBy ? hamBy.get(id) : null;
    return h;
}
export function inner$runGoal$reasons(ham, id, need) {
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    const struct = needStructure(need);
    const h = hamBy ? hamBy.get(id) : null;
    const reasons = [...struct, ...(h && h.ok === false ? [`המצאה: ${(h.missing || []).join(', ') || 'אין מקור בקלט'}`] : [])];
    return reasons;
}
export function inner$runGoal$reasons$$step(struct, h) {
    const reasons = [...struct, ...(h && h.ok === false ? [`המצאה: ${(h.missing || []).join(', ') || 'אין מקור בקלט'}`] : [])];
    return reasons;
}
export function inner$runGoal$nRej(needs, ham) {
    const perNeed = {};
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    const rejected = {};
    for (const [id, need] of Object.entries(needs)) {
        const struct = needStructure(need);
        const h = hamBy ? hamBy.get(id) : null;
        const reasons = [...struct, ...(h && h.ok === false ? [`המצאה: ${(h.missing || []).join(', ') || 'אין מקור בקלט'}`] : [])];
        perNeed[id] = { id, shape: need.shape || null, demand: need.demand || null, hamtzaa: h ? (h.ok ? 'עבר' : 'נפסל') : (ham.available ? 'לא-נמדד' : 'לא-זמין'), hamtzaaSources: h ? (h.sources || []) : [], structure: struct, status: reasons.length ? 'נפסל' : 'ממתין', reason: reasons.join(' · ') || null };
        if (reasons.length)
            rejected[id] = reasons;
    }
    const nRej = Object.keys(rejected).length;
    return nRej;
}
export function inner$runGoal$nRej$$step(rejected) {
    const nRej = Object.keys(rejected).length;
    return nRej;
}
export function inner$runGoal$live(needs, ham) {
    const perNeed = {};
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    const rejected = {};
    for (const [id, need] of Object.entries(needs)) {
        const struct = needStructure(need);
        const h = hamBy ? hamBy.get(id) : null;
        const reasons = [...struct, ...(h && h.ok === false ? [`המצאה: ${(h.missing || []).join(', ') || 'אין מקור בקלט'}`] : [])];
        perNeed[id] = { id, shape: need.shape || null, demand: need.demand || null, hamtzaa: h ? (h.ok ? 'עבר' : 'נפסל') : (ham.available ? 'לא-נמדד' : 'לא-זמין'), hamtzaaSources: h ? (h.sources || []) : [], structure: struct, status: reasons.length ? 'נפסל' : 'ממתין', reason: reasons.join(' · ') || null };
        if (reasons.length)
            rejected[id] = reasons;
    }
    const live = Object.fromEntries(Object.entries(needs).filter(([id]) => !rejected[id]));
    return live;
}
export function inner$runGoal$live$$step(needs, rejected) {
    const live = Object.fromEntries(Object.entries(needs).filter(([id]) => !rejected[id]));
    return live;
}
export function inner$runGoal$open(needs, ham, merged) {
    const perNeed = {};
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    const rejected = {};
    for (const [id, need] of Object.entries(needs)) {
        const struct = needStructure(need);
        const h = hamBy ? hamBy.get(id) : null;
        const reasons = [...struct, ...(h && h.ok === false ? [`המצאה: ${(h.missing || []).join(', ') || 'אין מקור בקלט'}`] : [])];
        perNeed[id] = { id, shape: need.shape || null, demand: need.demand || null, hamtzaa: h ? (h.ok ? 'עבר' : 'נפסל') : (ham.available ? 'לא-נמדד' : 'לא-זמין'), hamtzaaSources: h ? (h.sources || []) : [], structure: struct, status: reasons.length ? 'נפסל' : 'ממתין', reason: reasons.join(' · ') || null };
        if (reasons.length)
            rejected[id] = reasons;
    }
    const live = Object.fromEntries(Object.entries(needs).filter(([id]) => !rejected[id]));
    let open = Object.keys(live).filter((id) => !merged[id].pick);
    return open;
}
export function inner$runGoal$open$$step(live, merged) {
    let open = Object.keys(live).filter((id) => !merged[id].pick);
    return open;
}
export function inner$runGoal$solved(merged, open) {
    const solved = open.filter((id) => merged[id].pick);
    return solved;
}
export function inner$runGoal$gained(reuse) {
    const gained = reuse.reduce((n, r) => n + (r.solved || 0), 0);
    return gained;
}
export function inner$runGoal$proofRel(opts, ns) {
    const outRel = opts.out || `dart-gen-bs/gen_goal_${ns}.dart`;
    const proofRel = outRel.replace(/\.dart$/, '_proof.dart');
    return proofRel;
}
export function inner$runGoal$proofRel$$step(outRel) {
    const proofRel = outRel.replace(/\.dart$/, '_proof.dart');
    return proofRel;
}
export function inner$runGoal$run$row(name, cmd, args, r, process) {
    const row = { name, cmd: [cmd === process.execPath ? 'node' : cmd, ...args].join(' '), status: r.status === 0 ? 'עבר' : 'כשל', out: String(r.stdout || r.stderr || '').trim().split('\n').slice(-4).join(' | ').slice(0, 300) };
    return row;
}
export function inner$runGoal$red(checks) {
    const red = checks.filter((c) => c.status === 'כשל');
    return red;
}
export function inner$runGoal$solved_L932(merged) {
    const solved = Object.values(merged).filter((p) => p.pick).length;
    return solved;
}
export function inner$runGoal$total(needs) {
    const total = Object.keys(needs).length;
    return total;
}
export function inner$opt$j(k, process) {
    const j = process.argv.indexOf(k);
    return j;
}
export function inner$opt$j_L964(k, process) {
    const j = process.argv.indexOf(k);
    return j;
}
export function inner$opt$j_L984(k, process) {
    const j = process.argv.indexOf(k);
    return j;
}
export function inner$valueSearch$plugsFor$pc$$after_loop(opts) {
    let pc = [[]];
    for (const o of opts) {
        const nx = [];
        for (const a of pc) {
            for (const c of o.slice(0, 60)) {
                nx.push([...a, c]);
                if (nx.length >= 200)
                    break;
            }
            if (nx.length >= 200)
                break;
        }
        pc = nx;
    }
    return pc;
}
export function inner$valueSearch$plugsFor$nx$$after_loop(pc, o) {
    const nx = [];
    for (const a of pc) {
        for (const c of o.slice(0, 60)) {
            nx.push([...a, c]);
            if (nx.length >= 200)
                break;
        }
        if (nx.length >= 200)
            break;
    }
    return nx;
}
export function inner$valueSearch$seen$$after_loop(cands) {
    const seen = new Set();
    const kept = [];
    let dup = 0;
    for (let i = 0; i < cands.length; i++) {
        if (seen.has(cands[i].id)) {
            dup++;
            continue;
        }
        seen.add(cands[i].id);
        kept.push(i);
    }
    return seen;
}
export function inner$valueSearch$kept$$after_loop(cands) {
    const seen = new Set();
    const kept = [];
    let dup = 0;
    for (let i = 0; i < cands.length; i++) {
        if (seen.has(cands[i].id)) {
            dup++;
            continue;
        }
        seen.add(cands[i].id);
        kept.push(i);
    }
    return kept;
}
export function inner$valueSearch$dup$$after_loop(cands) {
    const seen = new Set();
    const kept = [];
    let dup = 0;
    for (let i = 0; i < cands.length; i++) {
        if (seen.has(cands[i].id)) {
            dup++;
            continue;
        }
        seen.add(cands[i].id);
        kept.push(i);
    }
    return dup;
}
export function inner$rowsFromDart$out$$after_loop(relFile, src) {
    const out = [];
    for (const m of src.matchAll(/^([A-Za-z_][\w<>, ?]*?)\s+([a-zA-Z]\w*)\(([^)]*)\)\s*(?:=>|\{)/gm)) {
        const ret = m[1].trim();
        if (/^(import|export|class|final|const|var|return)$/.test(ret))
            continue;
        const params = m[3].trim() ? m[3].split(',').map((x) => x.trim().replace(/\s+\w+$/, '')) : [];
        out.push({ id: m[2], file: relFile, params, ret, argc: params.length, layer: 'logic', title: `התנהגות-מוכחת ${m[2]}`, titleTok: new Set(), bodyTok: new Set(), origin: relFile });
    }
    return out;
}
export function inner$backwardSearch$byId$$after_loop(atomId, rows, needs) {
    const byId = new Map();
    for (const need of needs)
        for (const c of rows) {
            if (c.id === atomId || !sigOkBack(c, need))
                continue;
            const exact = sigExact(c, need);
            const tag = need.kind + '#' + need.target;
            const prev = byId.get(c.id);
            if (!prev)
                byId.set(c.id, { id: c.id, file: c.file, params: c.params, ret: c.ret, argc: c.argc, needs: [tag], exact });
            else {
                if (!prev.needs.includes(tag))
                    prev.needs.push(tag);
                prev.exact = prev.exact || exact;
            }
        }
    return byId;
}
export function inner$fixturePool$row$$after_loop(m) {
    const row = {};
    for (const p of m[0].matchAll(PAIR_RE))
        row[p[1]] = { dart: p[2], js: p[2][0] === "'" ? p[2].slice(1, -1).replace(/\\(.)/g, '$1') : p[2] === 'true' ? true : p[2] === 'false' ? false : Number(p[2]) };
    return row;
}
export function inner$runGoal$perNeed$$after_loop(needs, ham) {
    const perNeed = {};
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    const rejected = {};
    for (const [id, need] of Object.entries(needs)) {
        const struct = needStructure(need);
        const h = hamBy ? hamBy.get(id) : null;
        const reasons = [...struct, ...(h && h.ok === false ? [`המצאה: ${(h.missing || []).join(', ') || 'אין מקור בקלט'}`] : [])];
        perNeed[id] = { id, shape: need.shape || null, demand: need.demand || null, hamtzaa: h ? (h.ok ? 'עבר' : 'נפסל') : (ham.available ? 'לא-נמדד' : 'לא-זמין'), hamtzaaSources: h ? (h.sources || []) : [], structure: struct, status: reasons.length ? 'נפסל' : 'ממתין', reason: reasons.join(' · ') || null };
        if (reasons.length)
            rejected[id] = reasons;
    }
    return perNeed;
}
export function inner$runGoal$rejected$$after_loop(needs, ham) {
    const perNeed = {};
    const hamBy = ham.available ? new Map(ham.rows.map((r) => [r.need, r])) : null;
    const rejected = {};
    for (const [id, need] of Object.entries(needs)) {
        const struct = needStructure(need);
        const h = hamBy ? hamBy.get(id) : null;
        const reasons = [...struct, ...(h && h.ok === false ? [`המצאה: ${(h.missing || []).join(', ') || 'אין מקור בקלט'}`] : [])];
        perNeed[id] = { id, shape: need.shape || null, demand: need.demand || null, hamtzaa: h ? (h.ok ? 'עבר' : 'נפסל') : (ham.available ? 'לא-נמדד' : 'לא-זמין'), hamtzaaSources: h ? (h.sources || []) : [], structure: struct, status: reasons.length ? 'נפסל' : 'ממתין', reason: reasons.join(' · ') || null };
        if (reasons.length)
            rejected[id] = reasons;
    }
    return rejected;
}

export const SIGS = {
  inner$stripName$m: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$sigOk$every$a: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$sigOk$every$b: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$normT$v: [{"name":"NORMT","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$normT$s: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$schemaKeys$e: [{"name":"SHAPE_OPS","d":{"t":"any"},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$parseFnT$m: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$toCandidate$sumArgc: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$streamTrees$atomsByRet$a: [{"name":"byRetMemo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$streamTrees$fnT$f: [{"name":"fnTMemo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"want","d":{"t":"any"},"opt":false}],
  inner$streamTrees$innerPlugsOf$a: [{"name":"plugMemo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"k","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$streamTrees$innerPlugs$ft: [{"name":"want","d":{"t":"any"},"opt":false}],
  inner$streamTrees$lambdasOf$kk: [{"name":"cap","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$streamTrees$lambdasOf$a: [{"name":"lamMemo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"cap","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$streamTrees$lambdasOf$a$$step: [{"name":"lamMemo","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"kk","d":{"t":"str"},"opt":false}],
  inner$streamTrees$combos$a2: [{"name":"argc","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$streamTrees$lambdas$ft: [{"name":"want","d":{"t":"any"},"opt":false}],
  inner$streamTrees$lambdas$rest: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false}],
  inner$streamTrees$fill$a2: [{"name":"argcAcc","d":{"t":"any"},"opt":false},{"name":"sub","d":{"t":"any"},"opt":false}],
  inner$take$lim: [{"name":"keep","d":{"t":"num"},"opt":false}],
  inner$take$ceil: [{"name":"pureRows","d":{"t":"any"},"opt":false},{"name":"exactNodes","d":{"t":"num"},"opt":false}],
  inner$take$sa: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$take$id: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$cvOf$s: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$valueSearch$requiredKinds: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$valueSearch$leaves: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"any"},"opt":false},{"name":"CONSTS","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$SOCK_LEAVES: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$valueSearch$plugsFor$ft: [{"name":"want","d":{"t":"any"},"opt":false}],
  inner$valueSearch$plugsFor$inner$f2: [{"name":"w2","d":{"t":"any"},"opt":false}],
  inner$valueSearch$plugsFor$capped: [{"name":"PLUG_CAP","d":{"t":"num"},"opt":false},{"name":"out","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$s: [{"name":"reach","d":{"t":"arr","of":{"t":"set","of":{"t":"any"}}},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$valueSearch$pool: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"any"},"opt":false},{"name":"CONSTS","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$pool$$step: [{"name":"leaves","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$fresh: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"any"},"opt":false},{"name":"CONSTS","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$fresh$$step: [{"name":"leaves","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$i: [{"name":"usable","d":{"t":"any"},"opt":false}],
  inner$valueSearch$jsOk: [{"name":"interp","d":{"t":"or","of":[{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"undef"},true],["dropped",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["error",{"t":"str"},false],["file",{"t":"any"},false],["dill",{"t":"undef"},true],["compileMs",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["dill",{"t":"any"},false],["file",{"t":"any"},false],["compileMs",{"t":"num"},false],["error",{"t":"undef"},true]]},{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$valueSearch$jsIds: [{"name":"interp","d":{"t":"or","of":[{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"undef"},true],["dropped",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["error",{"t":"str"},false],["file",{"t":"any"},false],["dill",{"t":"undef"},true],["compileMs",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["dill",{"t":"any"},false],["file",{"t":"any"},false],["compileMs",{"t":"num"},false],["error",{"t":"undef"},true]]},{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false}],
  inner$valueSearch$jsIds$$step: [{"name":"jsOk","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$roots: [{"name":"isVoid","d":{"t":"bool"},"opt":false},{"name":"usable","d":{"t":"any"},"opt":false},{"name":"effects","d":{"t":"any"},"opt":false}],
  inner$valueSearch$left: [{"name":"maxDepth","d":{"t":"num"},"opt":false},{"name":"depth","d":{"t":"num"},"opt":false}],
  inner$valueSearch$prod: [{"name":"slots","d":{"t":"any"},"opt":false}],
  inner$valueSearch$n: [{"name":"slots","d":{"t":"any"},"opt":false}],
  inner$valueSearch$nodes: [{"name":"args","d":{"t":"arr","of":{"t":"undef"}},"opt":false}],
  inner$valueSearch$ps: [{"name":"args","d":{"t":"arr","of":{"t":"undef"}},"opt":false}],
  inner$valueSearch$node: [{"name":"g","d":{"t":"any"},"opt":false},{"name":"args","d":{"t":"arr","of":{"t":"undef"}},"opt":false}],
  inner$valueSearch$levelAll: [{"name":"capLevel","d":{"t":"num"},"opt":false},{"name":"exprs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$level: [{"name":"capLevel","d":{"t":"num"},"opt":false},{"name":"exprs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$level$$step: [{"name":"levelAll","d":{"t":"arr","of":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]}},"opt":false}],
  inner$valueSearch$j: [{"name":"cands","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["file",{"t":"any"},false],["chain",{"t":"null"},false],["tree",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["argc",{"t":"any"},false],["nodes",{"t":"num"},false],["sumArgc",{"t":"num"},false],["root",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["isVoid",{"t":"bool"},false]]}},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$valueSearch$covers: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]},"opt":false}],
  inner$valueSearch$usesAll: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]},"opt":false}],
  inner$valueSearch$usesAll$$step: [{"name":"requiredKinds","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"e","d":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]},"opt":false}],
  inner$valueSearch$jsNodes: [{"name":"interp","d":{"t":"or","of":[{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"undef"},true],["dropped",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["error",{"t":"str"},false],["file",{"t":"any"},false],["dill",{"t":"undef"},true],["compileMs",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["dill",{"t":"any"},false],["file",{"t":"any"},false],["compileMs",{"t":"num"},false],["error",{"t":"undef"},true]]},{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"e","d":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]},"opt":false}],
  inner$valueSearch$jsNodes$$step: [{"name":"jsIds","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]},"opt":false}],
  inner$valueSearch$direct: [{"name":"interp","d":{"t":"or","of":[{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"undef"},true],["dropped",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["error",{"t":"str"},false],["file",{"t":"any"},false],["dill",{"t":"undef"},true],["compileMs",{"t":"undef"},true]]},{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false],["dill",{"t":"any"},false],["file",{"t":"any"},false],["compileMs",{"t":"num"},false],["error",{"t":"undef"},true]]},{"t":"obj","p":[["error",{"t":"str"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["dropped",{"t":"arr","of":{"t":"any"}},false]]}]},"opt":false},{"name":"e","d":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]},"opt":false}],
  inner$valueSearch$direct$$step: [{"name":"e","d":{"t":"obj","p":[["node",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["type",{"t":"any"},false],["nodes",{"t":"num"},false],["cost",{"t":"num"},false],["ps",{"t":"arr","of":{"t":"any"}},false],["isVoid",{"t":"bool"},false]]},"opt":false},{"name":"jsNodes","d":{"t":"any"},"opt":false}],
  inner$valueSearch$glevel: [{"name":"capLevel","d":{"t":"num"},"opt":false},{"name":"gs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$top: [{"name":"wins","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$valueSearch$outs: [{"name":"wins","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"pr","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$valueSearch$outs$$step: [{"name":"top","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["id",{"t":"any"},false],["file",{"t":"any"},false],["chain",{"t":"null"},false],["tree",{"t":"obj","p":[["k",{"t":"str"},false],["pred",{"t":"any"},false],["body",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false]]},false],["argc",{"t":"any"},false],["nodes",{"t":"any"},false],["sumArgc",{"t":"any"},false],["root",{"t":"obj","p":[["k",{"t":"str"},false],["pred",{"t":"any"},false],["body",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false]]},false],["isVoid",{"t":"bool"},false]]},{"t":"obj","p":[["parity",{"t":"any"},false],["vals",{"t":"any"},false],["crossLang",{"t":"any"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["chain",{"t":"null"},false],["tree",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["argc",{"t":"any"},false],["nodes",{"t":"num"},false],["sumArgc",{"t":"num"},false],["root",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["isVoid",{"t":"bool"},false]]}]}},"opt":false},{"name":"pr","d":{"t":"obj","n":"out","p":[]},"opt":false},{"name":"p","d":{"t":"num"},"opt":false}],
  inner$rowsFromDart$ret: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$rowsFromDart$params: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$plan$rows: [{"name":"extraRows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rows0","d":{"t":"any"},"opt":false}],
  inner$plan$needsIds: [{"name":"needs","d":{"t":"obj","p":[["week.start",{"t":"obj","p":[]},false],["iso.addDays",{"t":"obj","p":[]},false],["iso.daysSince",{"t":"obj","p":[]},false],["iso.inRange",{"t":"obj","p":[]},false],["task.overdue",{"t":"obj","p":[]},false],["time.toMin",{"t":"obj","p":[]},false],["time.minutesBetween",{"t":"obj","p":[]},false],["text.normSearch",{"t":"obj","p":[]},false],["name.norm",{"t":"obj","p":[]},false],["phone.digits",{"t":"obj","p":[]},false],["count.by",{"t":"obj","p":[]},false],["prefix.rule",{"t":"obj","p":[]},false],["money.fmt",{"t":"obj","p":[]},false],["search.exact",{"t":"obj","p":[]},false],["search.contains",{"t":"obj","p":[]},false],["text.distance",{"t":"obj","p":[]},false],["name.matches",{"t":"obj","p":[]},false],["heb.parts",{"t":"obj","p":[]},false],["heb.gem",{"t":"obj","p":[]},false],["phone.key",{"t":"obj","p":[]},false],["dup.groups",{"t":"obj","p":[]},false],["iso.monthKey",{"t":"obj","p":[]},false],["ics.escape",{"t":"obj","p":[]},false],["ics.fold",{"t":"obj","p":[]},false],["ics.build",{"t":"obj","p":[]},false],["csv.escape",{"t":"obj","p":[]},false],["csv.build",{"t":"obj","p":[]},false],["csv.parse",{"t":"obj","p":[]},false],["vcard.rows",{"t":"obj","p":[]},false],["heb.holidayOn",{"t":"obj","p":[]},false],["heb.holidaysAhead",{"t":"obj","p":[]},false],["heb.inputToIso",{"t":"obj","p":[]},false],["heb.partsOfIso",{"t":"obj","p":[]},false],["heb.toIsoEn",{"t":"obj","p":[]},false],["phone.format",{"t":"obj","p":[]},false],["stat.mode",{"t":"obj","p":[]},false],["iso.monthsAgo",{"t":"obj","p":[]},false],["a11y.clamp",{"t":"obj","p":[]},false],["a11y.step",{"t":"obj","p":[]},false],["iso.monthDay",{"t":"obj","p":[]},false]]},"opt":false}],
  inner$plan$rowById: [{"name":"extraRows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rows0","d":{"t":"any"},"opt":false}],
  inner$plan$rowById$$step: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$plan$scorerFor$demand: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$plan$proveStream$slice: [{"name":"cands","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$plan$cap2: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$plan$seenW: [{"name":"pool","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["id",{"t":"any"},false],["file",{"t":"any"},false],["chain",{"t":"null"},false],["tree",{"t":"any"},false],["argc",{"t":"any"},false],["nodes",{"t":"any"},false],["sumArgc",{"t":"any"},false],["root",{"t":"any"},false],["isVoid",{"t":"bool"},false]]},{"t":"obj","p":[["id",{"t":"str"},false],["file",{"t":"any"},false],["chain",{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["file",{"t":"any"},false]]}},false],["tree",{"t":"null"},false],["nodes",{"t":"any"},false],["sumArgc",{"t":"any"},false],["root",{"t":"any"},false],["argc",{"t":"undef"},true],["isVoid",{"t":"undef"},true]]}]}},"opt":false}],
  inner$plan$map$nodes: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$plan$map$sumArgc: [{"name":"P","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$plan$map$file: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$plan$cands: [{"name":"singles","d":{"t":"any"},"opt":false},{"name":"comps","d":{"t":"arr","of":{"t":"obj","p":[["parity",{"t":"any"},false],["crossLang",{"t":"any"},false],["id",{"t":"str"},false],["file",{"t":"any"},false],["chain",{"t":"any"},false],["tree",{"t":"any"},false],["nodes",{"t":"any"},false],["sumArgc",{"t":"any"},false],["score",{"t":"any"},false],["exact",{"t":"bool"},false],["proven",{"t":"bool"},false],["ok",{"t":"any"},false]]}},"opt":false}],
  inner$plan$ok: [{"name":"proofs","d":{"t":"obj","n":"proofs","p":[]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false},{"name":"singles","d":{"t":"any"},"opt":false},{"name":"comps","d":{"t":"arr","of":{"t":"obj","p":[["parity",{"t":"any"},false],["crossLang",{"t":"any"},false],["id",{"t":"str"},false],["file",{"t":"any"},false],["chain",{"t":"any"},false],["tree",{"t":"any"},false],["nodes",{"t":"any"},false],["sumArgc",{"t":"any"},false],["score",{"t":"any"},false],["exact",{"t":"bool"},false],["proven",{"t":"bool"},false],["ok",{"t":"any"},false]]}},"opt":false}],
  inner$plan$ok$$step: [{"name":"pf","d":{"t":"any"},"opt":false},{"name":"top","d":{"t":"any"},"opt":false}],
  inner$plan$doubt: [{"name":"proofs","d":{"t":"obj","n":"proofs","p":[]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$plan$doubt$$step: [{"name":"pf","d":{"t":"any"},"opt":false}],
  inner$plan$map$cell: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$plan$socketsUsed: [{"name":"proofs","d":{"t":"obj","n":"proofs","p":[]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false},{"name":"singles","d":{"t":"any"},"opt":false},{"name":"comps","d":{"t":"arr","of":{"t":"obj","p":[["parity",{"t":"any"},false],["crossLang",{"t":"any"},false],["id",{"t":"str"},false],["file",{"t":"any"},false],["chain",{"t":"any"},false],["tree",{"t":"any"},false],["nodes",{"t":"any"},false],["sumArgc",{"t":"any"},false],["score",{"t":"any"},false],["exact",{"t":"bool"},false],["proven",{"t":"bool"},false],["ok",{"t":"any"},false]]}},"opt":false}],
  inner$plan$socketsUsed$$step: [{"name":"top","d":{"t":"any"},"opt":false},{"name":"ok","d":{"t":"any"},"opt":false}],
  inner$forwardSigOf$f: [{"name":"atomId","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$sigOkBack$every$a: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$sigOkBack$every$b: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$backwardNeeds$P: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$backwardNeeds$add$k: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$backwardNeeds$forEach$params: [{"name":"P","d":{"t":"any"},"opt":false}],
  inner$backwardSearch$exact: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$backwardSearch$tag: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$backwardSearch$prev: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$backwardSearch$cands: [{"name":"atomId","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"null"},"opt":false},{"name":"needs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$backwardSearch$cands$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$backwardSearch$total: [{"name":"examples","d":{"t":"null"},"opt":false}],
  inner$backwardSearch$candidates: [{"name":"atomId","d":{"t":"any"},"opt":false},{"name":"examples","d":{"t":"null"},"opt":false},{"name":"rows","d":{"t":"null"},"opt":false},{"name":"needs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"proof","d":{"t":"obj","n":"proof","p":[]},"opt":false}],
  inner$backwardSearch$candidates$$step: [{"name":"cands","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"proof","d":{"t":"obj","n":"proof","p":[]},"opt":false},{"name":"total","d":{"t":"any"},"opt":false}],
  inner$fixturePool$rel: [{"name":"d","d":{"t":"str"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$fixturePool$keys: [{"name":"m","d":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$fixturePool$keys$$step: [{"name":"row","d":{"t":"obj","n":"row","p":[]},"opt":false}],
  inner$fixtureRecords$keys: [{"name":"allow","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$goalExamples$numeric: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$goalExamples$srcs: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$at: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$pick: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$pick$$step: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"at","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$goalExamples$keys: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$keys$$step: [{"name":"pick","d":{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},"opt":false}],
  inner$goalExamples$sum: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$sum$$step: [{"name":"pick","d":{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},"opt":false}],
  inner$goalExamples$now: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$ctx0: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$ctx0$$step: [{"name":"now","d":{"t":"any"},"opt":false}],
  inner$goalExamples$at_L637: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$P0: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false}],
  inner$goalExamples$P0$$step: [{"name":"fx","d":{"t":"obj","p":[["rows",{"t":"arr","of":{"t":"obj","p":[["keys",{"t":"any"},false],["row",{"t":"any"},false],["v",{"t":"any"},false],["src",{"t":"any"},false]]}},false],["allow",{"t":"any"},false],["why",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},"opt":false},{"name":"at","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$goalExamples$keys_L653: [{"name":"P","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$scanUnits$rel: [{"name":"s","d":{"t":"or","of":[{"t":"obj","p":[["src",{"t":"str"},false],["unit",{"t":"str"},false],["files",{"t":"arr","of":{"t":"str"}},false],["glob",{"t":"undef"},true]]},{"t":"obj","p":[["src",{"t":"str"},false],["unit",{"t":"str"},false],["glob",{"t":"str"},false],["files",{"t":"undef"},true]]}]},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$scanUnits$forEach$t: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$rng$a: [{"name":"seed","d":{"t":"any"},"opt":false}],
  inner$seededSample$r: [{"name":"seed","d":{"t":"any"},"opt":false}],
  inner$seededSample$a: [{"name":"arr","d":{"t":"any"},"opt":false}],
  inner$seededSample$i: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$hamtzaaNeeds$out: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$hamtzaaNeeds$rows: [{"name":"j","d":{"t":"any"},"opt":false}],
  inner$runGoal$goal: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$runGoal$text: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$runGoal$text$$step: [{"name":"goal","d":{"t":"any"},"opt":false}],
  inner$runGoal$outRel: [{"name":"opts","d":{"t":"obj","p":[]},"opt":false},{"name":"ns","d":{"t":"any"},"opt":false}],
  inner$runGoal$needs: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$runGoal$needs$$step: [{"name":"goal","d":{"t":"any"},"opt":false}],
  inner$runGoal$hamBy: [{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false}],
  inner$runGoal$struct: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$runGoal$h: [{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$runGoal$h$$step: [{"name":"hamBy","d":{"t":"or","of":[{"t":"null"},{"t":"map","k":{"t":"any"},"v":{"t":"any"}}]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$runGoal$reasons: [{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false},{"name":"need","d":{"t":"any"},"opt":false}],
  inner$runGoal$reasons$$step: [{"name":"struct","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$runGoal$nRej: [{"name":"needs","d":{"t":"any"},"opt":false},{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false}],
  inner$runGoal$nRej$$step: [{"name":"rejected","d":{"t":"obj","n":"rejected","p":[]},"opt":false}],
  inner$runGoal$live: [{"name":"needs","d":{"t":"any"},"opt":false},{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false}],
  inner$runGoal$live$$step: [{"name":"needs","d":{"t":"any"},"opt":false},{"name":"rejected","d":{"t":"obj","n":"rejected","p":[]},"opt":false}],
  inner$runGoal$open: [{"name":"needs","d":{"t":"any"},"opt":false},{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false},{"name":"merged","d":{"t":"obj","n":"merged","p":[]},"opt":false}],
  inner$runGoal$open$$step: [{"name":"live","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"merged","d":{"t":"obj","n":"merged","p":[]},"opt":false}],
  inner$runGoal$solved: [{"name":"merged","d":{"t":"obj","n":"merged","p":[]},"opt":false},{"name":"open","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$runGoal$gained: [{"name":"reuse","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$runGoal$proofRel: [{"name":"opts","d":{"t":"obj","p":[]},"opt":false},{"name":"ns","d":{"t":"any"},"opt":false}],
  inner$runGoal$proofRel$$step: [{"name":"outRel","d":{"t":"any"},"opt":false}],
  inner$runGoal$run$row: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"cmd","d":{"t":"any"},"opt":false},{"name":"args","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$runGoal$red: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$runGoal$solved_L932: [{"name":"merged","d":{"t":"obj","n":"merged","p":[]},"opt":false}],
  inner$runGoal$total: [{"name":"needs","d":{"t":"any"},"opt":false}],
  inner$opt$j: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$opt$j_L964: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$opt$j_L984: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$valueSearch$plugsFor$pc$$after_loop: [{"name":"opts","d":{"t":"any"},"opt":false}],
  inner$valueSearch$plugsFor$nx$$after_loop: [{"name":"pc","d":{"t":"arr","of":{"t":"arr","of":{"t":"undef"}}},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
  inner$valueSearch$seen$$after_loop: [{"name":"cands","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["file",{"t":"any"},false],["chain",{"t":"null"},false],["tree",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["argc",{"t":"any"},false],["nodes",{"t":"num"},false],["sumArgc",{"t":"num"},false],["root",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["isVoid",{"t":"bool"},false]]}},"opt":false}],
  inner$valueSearch$kept$$after_loop: [{"name":"cands","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["file",{"t":"any"},false],["chain",{"t":"null"},false],["tree",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["argc",{"t":"any"},false],["nodes",{"t":"num"},false],["sumArgc",{"t":"num"},false],["root",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["isVoid",{"t":"bool"},false]]}},"opt":false}],
  inner$valueSearch$dup$$after_loop: [{"name":"cands","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"any"},false],["file",{"t":"any"},false],["chain",{"t":"null"},false],["tree",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["argc",{"t":"any"},false],["nodes",{"t":"num"},false],["sumArgc",{"t":"num"},false],["root",{"t":"obj","p":[["k",{"t":"str"},false],["id",{"t":"any"},false],["file",{"t":"any"},false],["args",{"t":"arr","of":{"t":"any"}},false]]},false],["isVoid",{"t":"bool"},false]]}},"opt":false}],
  inner$rowsFromDart$out$$after_loop: [{"name":"relFile","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$backwardSearch$byId$$after_loop: [{"name":"atomId","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"null"},"opt":false},{"name":"needs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$fixturePool$row$$after_loop: [{"name":"m","d":{"t":"obj","n":"RegExpExecArray","p":[["index",{"t":"num"},false],["input",{"t":"str"},false],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]},"opt":false}],
  inner$runGoal$perNeed$$after_loop: [{"name":"needs","d":{"t":"any"},"opt":false},{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false}],
  inner$runGoal$rejected$$after_loop: [{"name":"needs","d":{"t":"any"},"opt":false},{"name":"ham","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"str"},false],["rows",{"t":"undef"},true],["cmd",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["rows",{"t":"arr","of":{"t":"any"}},false],["cmd",{"t":"str"},false],["reason",{"t":"undef"},true]]}]},"opt":false}],
};
