// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/cover.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const LOGIC_OPS = new Set(['predicate', 'measure', 'aggregate', 'format', 'collection', 'lines', 'summary', 'selection', 'temporal', 'effect', 'transform']);
const tier = (file) => /^dart-ui-bs\/ds\//.test(file) ? 2 : /^dart-ui-bs\/premium\//.test(file) ? 1.5 : /^dart-ui-bs\/(auto|screens__)/.test(file) ? 0 : 1;
function scoreDisplay(a, need, goalRank) {
    const prov = new Set(a.sockets);
    const hit = need.filter((n) => prov.has(n)).length;
    const extra = a.sockets.filter((s) => !need.includes(s)).length;
    const gr = goalRank.get(a.id) ?? goalRank.get(a.id.split('@')[0]);
    return hit * 10 - extra * 1.5 + (gr != null ? Math.max(0, 6 - gr) : 0) + tier(a.file) - (a.unindexed ? 0.1 : 0);
}
const heOnly = (s) => (s || '').replace(/[A-Za-z0-9_./:()+⊕§·—\-\[\]{}]+/g, ' ').replace(/\s+/g, ' ').trim();
const OPFAM = { magnitude: 'stat', headline: 'stat', hero: 'stat', ratio: 'ratio', compare: 'bars', diff: 'stat', fact: 'fact', group: 'group', identity: 'identity', action: 'action', search: 'field', filter: 'filter', switch: 'switch', alert: 'alert', table: 'table', panel: 'panel', timeline: 'timeline', empty: 'empty', trend: 'trend', ring: 'stat', gauge: 'stat', bars: 'bars', avatar: 'identity', expand: 'expand', field: 'field', enumfield: 'field', board: 'board', primary: 'action',
    match: 'transform', predicate: 'predicate', serialize: 'transform', role: 'format', grant: 'predicate', expiry: 'collection', capital: 'measure', queue: 'collection', progress: 'summary', sheet: 'transform', makeup: 'collection', balance: 'measure', paidstatus: 'format', hok: 'collection', clash: 'format', slots: 'collection', block: 'format', holiday: 'format', weekly: 'collection', sessions: 'collection', enrol: 'measure', wait: 'collection', byteacher: 'collection', whoami: 'format', cert: 'format', contact: 'format', recipients: 'collection', template: 'format', parse: 'collection', trendengine: 'summary' };
export function inner$fn$m(src) {
    const m = src.match(/const FAKERS = new Set\(\[([^\]]*)\]\)/);
    return m;
}
export function inner$fn$raw(src) {
    const m = src.match(/const FAKERS = new Set\(\[([^\]]*)\]\)/);
    const raw = m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
    return raw;
}
export function inner$fn$raw$$step(m) {
    const raw = m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
    return raw;
}
export function inner$scoreDisplay$hit(a, need) {
    const prov = new Set(a.sockets);
    const hit = need.filter((n) => prov.has(n)).length;
    return hit;
}
export function inner$scoreDisplay$hit$$step(need, prov) {
    const hit = need.filter((n) => prov.has(n)).length;
    return hit;
}
export function inner$scoreDisplay$extra(a, need) {
    const extra = a.sockets.filter((s) => !need.includes(s)).length;
    return extra;
}
export function inner$scoreDisplay$gr(a, goalRank) {
    const gr = goalRank.get(a.id) ?? goalRank.get(a.id.split('@')[0]);
    return gr;
}
export function inner$cover$ranked(need, goalRank, cands) {
    const ranked = cands.map((a) => ({ a, s: scoreDisplay(a, need, goalRank) })).sort((x, y) => y.s - x.s || x.a.sockets.length - y.a.sockets.length || x.a.id.localeCompare(y.a.id));
    return ranked;
}
export function inner$cover$adds(need, covered, a) {
    const adds = need.filter((n) => !covered.has(n) && a.sockets.includes(n));
    return adds;
}
export function inner$cover$missing(need, covered) {
    const missing = need.filter((n) => !covered.has(n));
    return missing;
}
export function inner$coverLogic$flagsNeed(need) {
    const flagsNeed = need.filter((n) => ['temporal', 'ho', 'listIn'].includes(n));
    return flagsNeed;
}
export function inner$coverLogic$chosen(ranked) {
    const chosen = ranked.slice(0, 1).map((x) => x.a.id);
    return chosen;
}
export function inner$coverLogic$blind(LOGIC) {
    const blind = LOGIC.filter((a) => !a.st.length).length;
    return blind;
}
export function inner$coverLogic$tie(ranked) {
    const tie = ranked.filter((x) => ranked.length && x.s === ranked[0].s).length;
    return tie;
}
export function inner$coverLogic$noGoalEvidence(ranked) {
    const noGoalEvidence = ranked.length > 0 && ranked[0].g === 0;
    return noGoalEvidence;
}
export function inner$parseAtomTable$body(src) {
    const body = src.slice(src.indexOf('const ATOM = {'), src.indexOf('};', src.indexOf('const ATOM = {')));
    return body;
}
export function inner$parseAtomTable$particles(src) {
    const particles = [...src.matchAll(/\{ id: '([^']+)',\s*name: '((?:[^'\\]|\\.)*)',\s*f: \{ kind: '([^']+)'[^}]*?expr: '((?:[^'\\]|\\.)*)'/g)].map((m) => ({ id: m[1], name: m[2], kind: m[3], expr: m[4] }));
    return particles;
}
export function inner$parseAtomTable$m(line) {
    const m = line.match(/^\s*(\w+):\s*\{\s*atom:\s*'([^']+)',\s*seam:\s*'([^']*)'\s*\}\s*,?\s*(?:\/\/\s*(.*))?$/);
    return m;
}
export function inner$parseAtomTable$sockets(seam) {
    const sockets = [...seam.matchAll(/\b(?:this\.)?([a-z][A-Za-z]{2,})\b/g)].map((x) => x[1]).filter((s) => !/^(dart|maor|premium|ds|required|screens|dashboard|screen|lists|feedback|actions|dataviz|surfaces|int|num)$/.test(s) && !/\.dart$/.test(s));
    return sockets;
}
export function inner$map$atomEntry(byId, r) {
    const atomEntry = byId.get(r.atom) || [...byId.values()].find((a) => a.id.split('@')[0] === r.atom);
    return atomEntry;
}
export function inner$map$isLogic(byId, r) {
    const fam = OPFAM[r.op] || r.op;
    const atomEntry = byId.get(r.atom) || [...byId.values()].find((a) => a.id.split('@')[0] === r.atom);
    const isLogic = atomEntry ? atomEntry.layer === 'logic' : LOGIC_OPS.has(fam);
    return isLogic;
}
export function inner$map$isLogic$$step(fam, atomEntry) {
    const isLogic = atomEntry ? atomEntry.layer === 'logic' : LOGIC_OPS.has(fam);
    return isLogic;
}
export function inner$map$need(byId, r) {
    const fam = OPFAM[r.op] || r.op;
    const atomEntry = byId.get(r.atom) || [...byId.values()].find((a) => a.id.split('@')[0] === r.atom);
    const isLogic = atomEntry ? atomEntry.layer === 'logic' : LOGIC_OPS.has(fam);
    const need = isLogic ? [] : r.sockets.filter((s) => atomEntry ? atomEntry.sockets.includes(s) : true);
    return need;
}
export function inner$map$need$$step(r, atomEntry, isLogic) {
    const need = isLogic ? [] : r.sockets.filter((s) => atomEntry ? atomEntry.sockets.includes(s) : true);
    return need;
}
export function inner$map$got(c) {
    const got = c.atoms.map((x) => x.split('@')[0]);
    return got;
}
export function inner$map$alts(c) {
    const alts = (c.alts || []).map((x) => x.split('@')[0]);
    return alts;
}
export function inner$parseAtomTable$whys$$after_loop(src) {
    const whys = {};
    for (const m of src.matchAll(/\{\s*op:\s*'(\w+)'[^}]*?why:\s*'((?:[^'\\]|\\.)*)'/g))
        whys[m[1]] = (whys[m[1]] || '') + ' ' + m[2];
    return whys;
}
export function inner$parseAtomTable$kindOps$$after_loop(src) {
    const kindOps = {};
    for (const m of src.matchAll(/if \(f\.kind === '([^']+)'\)[^\n]*?\n?[^\n]*?return \[([\s\S]*?)\];/g))
        kindOps[m[1]] = [...m[2].matchAll(/op:\s*'(\w+)'/g)].map((x) => x[1]);
    return kindOps;
}
export function inner$parseAtomTable$goalsByOp$$after_loop(src) {
    const kindOps = {};
    for (const m of src.matchAll(/if \(f\.kind === '([^']+)'\)[^\n]*?\n?[^\n]*?return \[([\s\S]*?)\];/g))
        kindOps[m[1]] = [...m[2].matchAll(/op:\s*'(\w+)'/g)].map((x) => x[1]);
    const particles = [...src.matchAll(/\{ id: '([^']+)',\s*name: '((?:[^'\\]|\\.)*)',\s*f: \{ kind: '([^']+)'[^}]*?expr: '((?:[^'\\]|\\.)*)'/g)].map((m) => ({ id: m[1], name: m[2], kind: m[3], expr: m[4] }));
    const goalsByOp = {};
    for (const p of particles)
        for (const op of (kindOps[p.kind] || []))
            goalsByOp[op] = (goalsByOp[op] || '') + ' ' + p.name + ' ' + p.expr;
    return goalsByOp;
}
export function inner$parseAtomTable$rows$$after_loop(src) {
    const body = src.slice(src.indexOf('const ATOM = {'), src.indexOf('};', src.indexOf('const ATOM = {')));
    const whys = {};
    for (const m of src.matchAll(/\{\s*op:\s*'(\w+)'[^}]*?why:\s*'((?:[^'\\]|\\.)*)'/g))
        whys[m[1]] = (whys[m[1]] || '') + ' ' + m[2];
    const kindOps = {};
    for (const m of src.matchAll(/if \(f\.kind === '([^']+)'\)[^\n]*?\n?[^\n]*?return \[([\s\S]*?)\];/g))
        kindOps[m[1]] = [...m[2].matchAll(/op:\s*'(\w+)'/g)].map((x) => x[1]);
    const particles = [...src.matchAll(/\{ id: '([^']+)',\s*name: '((?:[^'\\]|\\.)*)',\s*f: \{ kind: '([^']+)'[^}]*?expr: '((?:[^'\\]|\\.)*)'/g)].map((m) => ({ id: m[1], name: m[2], kind: m[3], expr: m[4] }));
    const goalsByOp = {};
    for (const p of particles)
        for (const op of (kindOps[p.kind] || []))
            goalsByOp[op] = (goalsByOp[op] || '') + ' ' + p.name + ' ' + p.expr;
    const rows = [];
    for (const line of body.split('\n')) {
        const m = line.match(/^\s*(\w+):\s*\{\s*atom:\s*'([^']+)',\s*seam:\s*'([^']*)'\s*\}\s*,?\s*(?:\/\/\s*(.*))?$/);
        if (!m)
            continue;
        const [, op, atom, seam, comment = ''] = m;
        const sockets = [...seam.matchAll(/\b(?:this\.)?([a-z][A-Za-z]{2,})\b/g)].map((x) => x[1]).filter((s) => !/^(dart|maor|premium|ds|required|screens|dashboard|screen|lists|feedback|actions|dataviz|surfaces|int|num)$/.test(s) && !/\.dart$/.test(s));
        rows.push({ op, atom, seam, goal: heOnly((goalsByOp[op] || '') + ' ' + (whys[op] || '') + ' ' + comment + ' ' + seam), sockets: [...new Set(sockets)].slice(0, 5) });
    }
    return rows;
}

export const SIGS = {
  inner$fn$m: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$fn$raw: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$fn$raw$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$scoreDisplay$hit: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"need","d":{"t":"any"},"opt":false}],
  inner$scoreDisplay$hit$$step: [{"name":"need","d":{"t":"any"},"opt":false},{"name":"prov","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$scoreDisplay$extra: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"need","d":{"t":"any"},"opt":false}],
  inner$scoreDisplay$gr: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"goalRank","d":{"t":"any"},"opt":false}],
  inner$cover$ranked: [{"name":"need","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"goalRank","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"cands","d":{"t":"any"},"opt":false}],
  inner$cover$adds: [{"name":"need","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"covered","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$cover$missing: [{"name":"need","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"covered","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$coverLogic$flagsNeed: [{"name":"need","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$coverLogic$chosen: [{"name":"ranked","d":{"t":"any"},"opt":false}],
  inner$coverLogic$blind: [{"name":"LOGIC","d":{"t":"any"},"opt":false}],
  inner$coverLogic$tie: [{"name":"ranked","d":{"t":"any"},"opt":false}],
  inner$coverLogic$noGoalEvidence: [{"name":"ranked","d":{"t":"any"},"opt":false}],
  inner$parseAtomTable$body: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseAtomTable$particles: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseAtomTable$m: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseAtomTable$sockets: [{"name":"seam","d":{"t":"any"},"opt":false}],
  inner$map$atomEntry: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"obj","p":[["op",{"t":"any"},false],["atom",{"t":"any"},false],["seam",{"t":"any"},false],["goal",{"t":"any"},false],["sockets",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$map$isLogic: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"obj","p":[["op",{"t":"any"},false],["atom",{"t":"any"},false],["seam",{"t":"any"},false],["goal",{"t":"any"},false],["sockets",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$map$isLogic$$step: [{"name":"fam","d":{"t":"any"},"opt":false},{"name":"atomEntry","d":{"t":"any"},"opt":false}],
  inner$map$need: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"obj","p":[["op",{"t":"any"},false],["atom",{"t":"any"},false],["seam",{"t":"any"},false],["goal",{"t":"any"},false],["sockets",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$map$need$$step: [{"name":"r","d":{"t":"obj","p":[["op",{"t":"any"},false],["atom",{"t":"any"},false],["seam",{"t":"any"},false],["goal",{"t":"any"},false],["sockets",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"atomEntry","d":{"t":"any"},"opt":false},{"name":"isLogic","d":{"t":"bool"},"opt":false}],
  inner$map$got: [{"name":"c","d":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"any"},false],["need",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"any"},false],["alts",{"t":"any"},false],["composed",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"str"}},false],["ok",{"t":"bool"},false]]},{"t":"obj","p":[["op",{"t":"any"},false],["need",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"arr","of":{"t":"any"}},false],["alts",{"t":"any"},false],["composed",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"any"}},false],["ok",{"t":"bool"},false]]}]},"opt":false}],
  inner$map$alts: [{"name":"c","d":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"any"},false],["need",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"any"},false],["alts",{"t":"any"},false],["composed",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"str"}},false],["ok",{"t":"bool"},false]]},{"t":"obj","p":[["op",{"t":"any"},false],["need",{"t":"arr","of":{"t":"any"}},false],["atoms",{"t":"arr","of":{"t":"any"}},false],["alts",{"t":"any"},false],["composed",{"t":"bool"},false],["missing",{"t":"arr","of":{"t":"any"}},false],["ok",{"t":"bool"},false]]}]},"opt":false}],
  inner$parseAtomTable$whys$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseAtomTable$kindOps$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseAtomTable$goalsByOp$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseAtomTable$rows$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
};
