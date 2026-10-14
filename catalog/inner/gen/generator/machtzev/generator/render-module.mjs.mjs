// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/render-module.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const idsIn = (code) => new Set([...code.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((m) => m[1]));
const codeLine = (f) => f.lines.find((l) => l.trim().length && !/^\s*\/\//.test(l) && !/^\s*@override\s*$/.test(l)) || '';
const classLine = (f) => f.lines.find((l) => /^(abstract\s+)?class\s+\w+/.test(l)) || '';
const DART_KNOWN = new Set(['context', 'setState', 'widget', 'mounted', 'true', 'false', 'null', 'const', 'final', 'var', 'new', 'as', 'is', 'in', 'if', 'else', 'for', 'await', 'async', 'this', 'super', 'return', 'String', 'int', 'double', 'bool', 'num', 'List', 'Map', 'Set', 'Object', 'dynamic', 'void', 'print']);
const preludeLocals = (lines) => new Set(lines.flatMap((l) => [...l.matchAll(/^\s+(?:final|var|late|const)\s+(?:[\w<>?, ]+?\s+)?(\w+)\s*=/g)].map((m) => m[1]).concat([...l.matchAll(/^\s+(?:final|var)\s+\(?(\w+)(?:,\s*(\w+))*\)?\s*=/g)].flatMap((m) => m.slice(1).filter(Boolean)))));
const declaredInside = (site) => new Set([...site.matchAll(/\((\w+(?:,\s*\w+)*)\)\s*(?:=>|\{)/g)].flatMap((m) => m[1].split(/,\s*/)).concat([...site.matchAll(/for \(final (\w+) in/g)].map((m) => m[1])));
function siteResolvable(site, known, defIndex, importNames) {
    const local = declaredInside(site);
    for (const id of idsIn(site.replace(/'(?:[^'\\]|\\.)*'/g, "''"))) { // מחרוזות לא נספרות (אינטרפולציה ${…} נשארת — טוב: היא צורכת מזהים)
        if (/^[A-Z]/.test(id) || /^\d/.test(id) || DART_KNOWN.has(id) || local.has(id) || known.has(id) || defIndex.has(id) || importNames.has(id))
            continue;
        return false;
    }
    return true;
}
function preludeStatements(lines) {
    const out = [];
    let cur = [], depth = 0;
    for (const l of lines) {
        cur.push(l);
        for (const ch of l.replace(/'(?:[^'\\]|\\.)*'/g, '')) {
            if ('([{'.includes(ch))
                depth++;
            else if (')]}'.includes(ch))
                depth--;
        }
        if (depth <= 0 && /;\s*(\/\/.*)?$/.test(l) || (depth <= 0 && /^\s*\/\//.test(l) && cur.length === 1)) {
            out.push(cur);
            cur = [];
            depth = 0;
        }
    }
    if (cur.length)
        out.push(cur);
    return out;
}
function prunePrelude(preludeLines, usedText) {
    const stmts = preludeStatements(preludeLines).map((ls) => ({ ls, defs: [...preludeLocals(ls)], ids: idsIn(ls.join('\n').replace(/'(?:[^'\\]|\\.)*'/g, "''")), decl: ls.some((l) => /^\s+(?:final|var|late|const)\s/.test(l)) }));
    const need = new Set([...idsIn(usedText)]);
    const keep = new Set();
    let grew = true;
    while (grew) {
        grew = false;
        stmts.forEach((st, i) => { if (keep.has(i))
            return; if (!st.decl || st.defs.some((d) => need.has(d))) {
            keep.add(i);
            st.ids.forEach((x) => need.add(x));
            grew = true;
        } });
    }
    return { lines: stmts.filter((st, i) => keep.has(i)).flatMap((st) => st.ls), dropped: stmts.filter((st, i) => !keep.has(i)).flatMap((st) => st.defs) };
}
export function inner$siteResolvable$local(site) {
    const local = declaredInside(site);
    return local;
}
export function inner$importNamesOf$m(l) {
    const m = l.match(/^import '([^']+)'/);
    return m;
}
export function inner$prunePrelude$stmts(preludeLines) {
    const stmts = preludeStatements(preludeLines).map((ls) => ({ ls, defs: [...preludeLocals(ls)], ids: idsIn(ls.join('\n').replace(/'(?:[^'\\]|\\.)*'/g, "''")), decl: ls.some((l) => /^\s+(?:final|var|late|const)\s/.test(l)) }));
    return stmts;
}
export function inner$prunePrelude$need(usedText) {
    const need = new Set([...idsIn(usedText)]);
    return need;
}
export function inner$socketPlan$build(frags, cls) {
    const build = frags.find((f) => f.cls === cls && f.role === 'build');
    return build;
}
export function inner$socketPlan$preludeLinesAll(frags, cls, src) {
    const build = frags.find((f) => f.cls === cls && f.role === 'build');
    const preludeLinesAll = build && build.prelude ? src.slice(build.prelude[0], build.prelude[1]) : [];
    return preludeLinesAll;
}
export function inner$socketPlan$preludeLinesAll$$step(build, src) {
    const preludeLinesAll = build && build.prelude ? src.slice(build.prelude[0], build.prelude[1]) : [];
    return preludeLinesAll;
}
export function inner$socketPlan$known(preludeLines) {
    const known = preludeLocals(preludeLines);
    return known;
}
export function inner$socketPlan$candidates(frags, chosenSet, cls) {
    const candidates = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && (f.role === 'builder' || (f.role === 'member' && /^\s+List<Widget>\s+_\w+\(/.test(codeLine(f)))));
    return candidates;
}
export function inner$socketPlan$cl(f) {
    const cl = codeLine(f);
    return cl;
}
export function inner$socketPlan$m(f) {
    const cl = codeLine(f);
    const m = cl.match(/(?:Widget|List<Widget>)\s+(_\w+)\(([^)]*)\)/);
    return m;
}
export function inner$socketPlan$m$$step(cl) {
    const m = cl.match(/(?:Widget|List<Widget>)\s+(_\w+)\(([^)]*)\)/);
    return m;
}
export function inner$socketPlan$spread(f) {
    const cl = codeLine(f);
    const spread = /^\s+List<Widget>/.test(cl);
    return spread;
}
export function inner$socketPlan$spread$$step(cl) {
    const spread = /^\s+List<Widget>/.test(cl);
    return spread;
}
export function inner$socketPlan$hit(defIndex, importNames, preludeLines, pool, name) {
    const known = preludeLocals(preludeLines);
    const hit = (pool[name] || []).find((st) => siteResolvable(st, known, defIndex, importNames));
    return hit;
}
export function inner$socketPlan$hit$$step(defIndex, importNames, known, pool, name) {
    const hit = (pool[name] || []).find((st) => siteResolvable(st, known, defIndex, importNames));
    return hit;
}
export function inner$socketPlan$chosenText(frags, chosenSet, cls) {
    const chosenText = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && f.role !== 'build').map((f) => f.lines.join('\n')).join('\n');
    return chosenText;
}
export function inner$socketPlan$internal(frags, chosenSet, cls, defIndex, importNames, preludeLines, pool) {
    const known = preludeLocals(preludeLines);
    const sites = [];
    const unresolved = [];
    const candidates = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && (f.role === 'builder' || (f.role === 'member' && /^\s+List<Widget>\s+_\w+\(/.test(codeLine(f)))));
    for (const f of candidates) {
        const cl = codeLine(f);
        const m = cl.match(/(?:Widget|List<Widget>)\s+(_\w+)\(([^)]*)\)/);
        if (!m)
            continue;
        const name = m[1], spread = /^\s+List<Widget>/.test(cl);
        if (!m[2].trim()) {
            sites.push({ name, site: `${name}()`, spread });
            continue;
        }
        const hit = (pool[name] || []).find((st) => siteResolvable(st, known, defIndex, importNames));
        if (hit)
            sites.push({ name, site: hit, spread });
        else
            unresolved.push(name);
    }
    const chosenText = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && f.role !== 'build').map((f) => f.lines.join('\n')).join('\n');
    const internal = unresolved.filter((n) => new RegExp(`(?<![\\w.])${n}\\(`).test(chosenText.replace(new RegExp(`(?:Widget|List<Widget>)\\s+${n}\\(`), '')));
    return internal;
}
export function inner$socketPlan$internal$$step(unresolved, chosenText) {
    const internal = unresolved.filter((n) => new RegExp(`(?<![\\w.])${n}\\(`).test(chosenText.replace(new RegExp(`(?:Widget|List<Widget>)\\s+${n}\\(`), '')));
    return internal;
}
export function inner$socketPlan$reserved(frags, chosenSet, cls, defIndex, importNames, preludeLines, pool) {
    const known = preludeLocals(preludeLines);
    const sites = [];
    const unresolved = [];
    const candidates = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && (f.role === 'builder' || (f.role === 'member' && /^\s+List<Widget>\s+_\w+\(/.test(codeLine(f)))));
    for (const f of candidates) {
        const cl = codeLine(f);
        const m = cl.match(/(?:Widget|List<Widget>)\s+(_\w+)\(([^)]*)\)/);
        if (!m)
            continue;
        const name = m[1], spread = /^\s+List<Widget>/.test(cl);
        if (!m[2].trim()) {
            sites.push({ name, site: `${name}()`, spread });
            continue;
        }
        const hit = (pool[name] || []).find((st) => siteResolvable(st, known, defIndex, importNames));
        if (hit)
            sites.push({ name, site: hit, spread });
        else
            unresolved.push(name);
    }
    const chosenText = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && f.role !== 'build').map((f) => f.lines.join('\n')).join('\n');
    const internal = unresolved.filter((n) => new RegExp(`(?<![\\w.])${n}\\(`).test(chosenText.replace(new RegExp(`(?:Widget|List<Widget>)\\s+${n}\\(`), '')));
    const reserved = unresolved.filter((n) => !internal.includes(n));
    return reserved;
}
export function inner$socketPlan$reserved$$step(unresolved, internal) {
    const reserved = unresolved.filter((n) => !internal.includes(n));
    return reserved;
}
export function inner$socketPlan$pr(frags, chosenSet, cls, defIndex, importNames, src, preludeLines, pool) {
    const build = frags.find((f) => f.cls === cls && f.role === 'build');
    const preludeLinesAll = build && build.prelude ? src.slice(build.prelude[0], build.prelude[1]) : [];
    const known = preludeLocals(preludeLines);
    const sites = [];
    const unresolved = [];
    const candidates = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && (f.role === 'builder' || (f.role === 'member' && /^\s+List<Widget>\s+_\w+\(/.test(codeLine(f)))));
    for (const f of candidates) {
        const cl = codeLine(f);
        const m = cl.match(/(?:Widget|List<Widget>)\s+(_\w+)\(([^)]*)\)/);
        if (!m)
            continue;
        const name = m[1], spread = /^\s+List<Widget>/.test(cl);
        if (!m[2].trim()) {
            sites.push({ name, site: `${name}()`, spread });
            continue;
        }
        const hit = (pool[name] || []).find((st) => siteResolvable(st, known, defIndex, importNames));
        if (hit)
            sites.push({ name, site: hit, spread });
        else
            unresolved.push(name);
    }
    const pr = prunePrelude(preludeLinesAll, sites.map((x) => x.site).join('\n'));
    return pr;
}
export function inner$socketPlan$pr$$step(preludeLinesAll, sites) {
    const pr = prunePrelude(preludeLinesAll, sites.map((x) => x.site).join('\n'));
    return pr;
}
export function inner$declaredNames$out(names) {
    const out = [...names].filter((n) => !/^(void|return|if|else|for|while|import|export|part|static|final|const|var|late)$/.test(n));
    return out;
}
export function inner$select$frags(CAT, module) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    return frags;
}
export function inner$select$byId(CAT, module) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const byId = new Map(frags.map((f) => [f.id, f]));
    return byId;
}
export function inner$select$byId$$step(frags) {
    const byId = new Map(frags.map((f) => [f.id, f]));
    return byId;
}
export function inner$select$headOf(CAT, module) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const headOf = new Map(frags.filter((f) => f.role === 'class-head').map((f) => [f.cls, f]));
    return headOf;
}
export function inner$select$headOf$$step(frags) {
    const headOf = new Map(frags.filter((f) => f.role === 'class-head').map((f) => [f.cls, f]));
    return headOf;
}
export function inner$select$stateOf$m(headOf, c) {
    const m = headOf.has(c) && classLine(headOf.get(c)).match(/extends State<(\w+)>/);
    return m;
}
export function inner$select$f(CAT, module, id) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const byId = new Map(frags.map((f) => [f.id, f]));
    const f = byId.get(id);
    return f;
}
export function inner$select$f$$step(byId, id) {
    const f = byId.get(id);
    return f;
}
export function inner$select$g(CAT, module, did) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const byId = new Map(frags.map((f) => [f.id, f]));
    const g = byId.get(did);
    return g;
}
export function inner$select$g$$step(byId, did) {
    const g = byId.get(did);
    return g;
}
export function inner$select$classes(CAT, module, sel) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const byId = new Map(frags.map((f) => [f.id, f]));
    const classes = new Set([...sel].map((id) => byId.get(id).cls));
    return classes;
}
export function inner$select$classes$$step(byId, sel) {
    const classes = new Set([...sel].map((id) => byId.get(id).cls));
    return classes;
}
export function inner$select$text(plan) {
    const text = plan.preludeLines.join('\n') + '\n' + plan.sites.map((x) => x.site).join('\n');
    return text;
}
export function inner$select$g_L155(CAT, module, did) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const byId = new Map(frags.map((f) => [f.id, f]));
    const g = byId.get(did);
    return g;
}
export function inner$select$g_L155$$step(byId, did) {
    const g = byId.get(did);
    return g;
}
export function inner$select$needs(CAT, module, defIndex, f) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const byId = new Map(frags.map((f) => [f.id, f]));
    const needs = [...idsIn(f.lines.join('\n'))].filter((u) => !f.defs.includes(u)).flatMap((u) => (defIndex.get(u) || []).filter((did) => byId.get(did).cls === f.cls));
    return needs;
}
export function inner$select$needs$$step(byId, defIndex, f) {
    const needs = [...idsIn(f.lines.join('\n'))].filter((u) => !f.defs.includes(u)).flatMap((u) => (defIndex.get(u) || []).filter((did) => byId.get(did).cls === f.cls));
    return needs;
}
export function inner$select$classes_L169(CAT, module, sel) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const byId = new Map(frags.map((f) => [f.id, f]));
    const classes = new Set([...sel].map((id) => byId.get(id).cls));
    return classes;
}
export function inner$select$classes_L169$$step(byId, sel) {
    const classes = new Set([...sel].map((id) => byId.get(id).cls));
    return classes;
}
export function inner$select$chosen(CAT, module, sel) {
    const frags = CAT.fragments.filter((f) => f.module === module);
    const chosen = frags.filter((f) => sel.has(f.id));
    return chosen;
}
export function inner$select$chosen$$step(frags, sel) {
    const chosen = frags.filter((f) => sel.has(f.id));
    return chosen;
}
export function inner$assembleByOps$sites(res) {
    const sites = Object.values(res.plans).reduce((a, p) => a + p.sites.length, 0);
    return sites;
}
export function inner$assemble$stateClasses(chosen) {
    const stateClasses = new Set(chosen.filter((f) => f.role === 'class-head' && /extends State</.test(classLine(f))).map((f) => f.cls));
    return stateClasses;
}
export function inner$assemble$hasBuild(chosen) {
    const hasBuild = new Set(chosen.filter((f) => f.role === 'build').map((f) => f.cls));
    return hasBuild;
}
export function inner$assemble$widgetClasses(chosen) {
    const widgetClasses = new Set(chosen.filter((f) => f.role === 'class-head' && /extends StatefulWidget|extends StatelessWidget/.test(classLine(f))).map((f) => f.cls));
    return widgetClasses;
}
export function inner$assemble$nm(f) {
    const nm = f.cls.replace(/^_|State$/g, '');
    return nm;
}
export function inner$assemble$code(out) {
    let code = out.join('\n');
    return code;
}
export function inner$assemble$used(code) {
    const used = idsIn(code.replace(/^import .*$/gm, ''));
    return used;
}
export function inner$assemble$filter$m(l) {
    const m = l.match(/^import '([^']+)'(?:\s+as\s+(\w+))?/);
    return m;
}
export function inner$assembleMulti$m(l) {
    const m = l.match(/^(import '([^']+)'(?:\s+as\s+\w+)?;)/);
    return m;
}
export function inner$assembleMulti$code(f) {
    const code = f.lines.filter((l) => !/^import '/.test(l) && !/^\s*\/\//.test(l) && l.trim() && !/^void main\(/.test(l));
    return code;
}
export function inner$assembleMulti$k(l) {
    const k = l.replace(/\s*\/\/.*$/, '').trim();
    return k;
}
export function inner$assembleMulti$heads(p) {
    const heads = new Map(p.chosen.filter((f) => f.role === 'class-head').map((f) => [f.cls, classLine(f)]));
    return heads;
}
export function inner$assembleMulti$dataCls(p) {
    const heads = new Map(p.chosen.filter((f) => f.role === 'class-head').map((f) => [f.cls, classLine(f)]));
    const dataCls = new Set([...heads].filter(([c, l]) => !/extends (StatefulWidget|StatelessWidget|State<)/.test(l)).map(([c]) => c));
    return dataCls;
}
export function inner$assembleMulti$dataCls$$step(heads) {
    const dataCls = new Set([...heads].filter(([c, l]) => !/extends (StatefulWidget|StatelessWidget|State<)/.test(l)).map(([c]) => c));
    return dataCls;
}
export function inner$assembleMulti$map$heads(p) {
    const heads = new Map(p.chosen.filter((f) => f.role === 'class-head').map((f) => [f.cls, classLine(f)]));
    return heads;
}
export function inner$assembleMulti$map$stateCls(p) {
    const heads = new Map(p.chosen.filter((f) => f.role === 'class-head').map((f) => [f.cls, classLine(f)]));
    const stateCls = new Set([...heads].filter(([c, l]) => /extends State</.test(l)).map(([c]) => c));
    return stateCls;
}
export function inner$assembleMulti$map$stateCls$$step(heads) {
    const stateCls = new Set([...heads].filter(([c, l]) => /extends State</.test(l)).map(([c]) => c));
    return stateCls;
}
export function inner$assembleMulti$map$members(p) {
    const heads = new Map(p.chosen.filter((f) => f.role === 'class-head').map((f) => [f.cls, classLine(f)]));
    const stateCls = new Set([...heads].filter(([c, l]) => /extends State</.test(l)).map(([c]) => c));
    const members = p.chosen.filter((f) => stateCls.has(f.cls) && (f.role === 'member' || f.role === 'builder'));
    return members;
}
export function inner$assembleMulti$map$members$$step(p, stateCls) {
    const members = p.chosen.filter((f) => stateCls.has(f.cls) && (f.role === 'member' || f.role === 'builder'));
    return members;
}
export function inner$assembleMulti$renameFor(hoisted) {
    const renameFor = new Map(hoisted.map((p) => [p.tag, new Map()]));
    return renameFor;
}
export function inner$assembleMulti$tags(owners) {
    const tags = [...new Set(owners.map((o) => o.tag))];
    return tags;
}
export function inner$assembleMulti$codes(owners) {
    const codes = new Set(owners.map((o) => o.code));
    return codes;
}
export function inner$assembleMulti$N(name) {
    const N = name.replace(/[^A-Za-z0-9]/g, '');
    return N;
}
export function inner$assembleMulti$map$heads_L297(p) {
    const heads = new Map(p.chosen.filter((f) => f.role === 'class-head').map((f) => [f.cls, classLine(f)]));
    return heads;
}
export function inner$assembleMulti$map$sc(p) {
    const heads = new Map(p.chosen.filter((f) => f.role === 'class-head').map((f) => [f.cls, classLine(f)]));
    const sc = [...heads].filter(([c, l]) => /extends State</.test(l)).map(([c]) => c);
    return sc;
}
export function inner$assembleMulti$map$sc$$step(heads) {
    const sc = [...heads].filter(([c, l]) => /extends State</.test(l)).map(([c]) => c);
    return sc;
}
export function inner$assembleMulti$applyFor$ren(renameFor, tag) {
    const ren = renameFor.get(tag);
    return ren;
}
export function inner$arg$i(k, process) {
    const i = process.argv.indexOf(k);
    return i;
}
export function inner$socketPlan$sites$$after_loop(frags, chosenSet, cls, defIndex, importNames, preludeLines, pool) {
    const known = preludeLocals(preludeLines);
    const sites = [];
    const unresolved = [];
    const candidates = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && (f.role === 'builder' || (f.role === 'member' && /^\s+List<Widget>\s+_\w+\(/.test(codeLine(f)))));
    for (const f of candidates) {
        const cl = codeLine(f);
        const m = cl.match(/(?:Widget|List<Widget>)\s+(_\w+)\(([^)]*)\)/);
        if (!m)
            continue;
        const name = m[1], spread = /^\s+List<Widget>/.test(cl);
        if (!m[2].trim()) {
            sites.push({ name, site: `${name}()`, spread });
            continue;
        }
        const hit = (pool[name] || []).find((st) => siteResolvable(st, known, defIndex, importNames));
        if (hit)
            sites.push({ name, site: hit, spread });
        else
            unresolved.push(name);
    }
    return sites;
}
export function inner$socketPlan$unresolved$$after_loop(frags, chosenSet, cls, defIndex, importNames, preludeLines, pool) {
    const known = preludeLocals(preludeLines);
    const sites = [];
    const unresolved = [];
    const candidates = frags.filter((f) => f.cls === cls && chosenSet.has(f.id) && (f.role === 'builder' || (f.role === 'member' && /^\s+List<Widget>\s+_\w+\(/.test(codeLine(f)))));
    for (const f of candidates) {
        const cl = codeLine(f);
        const m = cl.match(/(?:Widget|List<Widget>)\s+(_\w+)\(([^)]*)\)/);
        if (!m)
            continue;
        const name = m[1], spread = /^\s+List<Widget>/.test(cl);
        if (!m[2].trim()) {
            sites.push({ name, site: `${name}()`, spread });
            continue;
        }
        const hit = (pool[name] || []).find((st) => siteResolvable(st, known, defIndex, importNames));
        if (hit)
            sites.push({ name, site: hit, spread });
        else
            unresolved.push(name);
    }
    return unresolved;
}

export const SIGS = {
  inner$siteResolvable$local: [{"name":"site","d":{"t":"any"},"opt":false}],
  inner$importNamesOf$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$prunePrelude$stmts: [{"name":"preludeLines","d":{"t":"any"},"opt":false}],
  inner$prunePrelude$need: [{"name":"usedText","d":{"t":"any"},"opt":false}],
  inner$socketPlan$build: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$socketPlan$preludeLinesAll: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$socketPlan$preludeLinesAll$$step: [{"name":"build","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$socketPlan$known: [{"name":"preludeLines","d":{"t":"any"},"opt":false}],
  inner$socketPlan$candidates: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"chosenSet","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$socketPlan$cl: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$socketPlan$m: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$socketPlan$m$$step: [{"name":"cl","d":{"t":"any"},"opt":false}],
  inner$socketPlan$spread: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$socketPlan$spread$$step: [{"name":"cl","d":{"t":"any"},"opt":false}],
  inner$socketPlan$hit: [{"name":"defIndex","d":{"t":"any"},"opt":false},{"name":"importNames","d":{"t":"any"},"opt":false},{"name":"preludeLines","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"obj","n":"pool","p":[]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$socketPlan$hit$$step: [{"name":"defIndex","d":{"t":"any"},"opt":false},{"name":"importNames","d":{"t":"any"},"opt":false},{"name":"known","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"pool","d":{"t":"obj","n":"pool","p":[]},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$socketPlan$chosenText: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"chosenSet","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$socketPlan$internal: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"chosenSet","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"defIndex","d":{"t":"any"},"opt":false},{"name":"importNames","d":{"t":"any"},"opt":false},{"name":"preludeLines","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"obj","n":"pool","p":[]},"opt":false}],
  inner$socketPlan$internal$$step: [{"name":"unresolved","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"chosenText","d":{"t":"any"},"opt":false}],
  inner$socketPlan$reserved: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"chosenSet","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"defIndex","d":{"t":"any"},"opt":false},{"name":"importNames","d":{"t":"any"},"opt":false},{"name":"preludeLines","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"obj","n":"pool","p":[]},"opt":false}],
  inner$socketPlan$reserved$$step: [{"name":"unresolved","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"internal","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$socketPlan$pr: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"chosenSet","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"defIndex","d":{"t":"any"},"opt":false},{"name":"importNames","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false},{"name":"preludeLines","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"obj","n":"pool","p":[]},"opt":false}],
  inner$socketPlan$pr$$step: [{"name":"preludeLinesAll","d":{"t":"any"},"opt":false},{"name":"sites","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$declaredNames$out: [{"name":"names","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$select$frags: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false}],
  inner$select$byId: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false}],
  inner$select$byId$$step: [{"name":"frags","d":{"t":"any"},"opt":false}],
  inner$select$headOf: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false}],
  inner$select$headOf$$step: [{"name":"frags","d":{"t":"any"},"opt":false}],
  inner$select$stateOf$m: [{"name":"headOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$select$f: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$select$f$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$select$g: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false},{"name":"did","d":{"t":"any"},"opt":false}],
  inner$select$g$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"did","d":{"t":"any"},"opt":false}],
  inner$select$classes: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false},{"name":"sel","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$select$classes$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sel","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$select$text: [{"name":"plan","d":{"t":"obj","p":[["preludeLines",{"t":"any"},false],["sites",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["site",{"t":"any"},false],["spread",{"t":"bool"},false]]}},false],["unresolved",{"t":"arr","of":{"t":"any"}},false],["internal",{"t":"arr","of":{"t":"any"}},false],["pruned",{"t":"arr","of":{"t":"any"}},false]]},"opt":false}],
  inner$select$g_L155: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false},{"name":"did","d":{"t":"any"},"opt":false}],
  inner$select$g_L155$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"did","d":{"t":"any"},"opt":false}],
  inner$select$needs: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false},{"name":"defIndex","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$select$needs$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"defIndex","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$select$classes_L169: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false},{"name":"sel","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$select$classes_L169$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"sel","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$select$chosen: [{"name":"CAT","d":{"t":"any"},"opt":false},{"name":"module","d":{"t":"any"},"opt":false},{"name":"sel","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$select$chosen$$step: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"sel","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$assembleByOps$sites: [{"name":"res","d":{"t":"obj","p":[["code",{"t":"str"},false],["fragments",{"t":"any"},false],["of",{"t":"any"},false],["target",{"t":"arr","of":{"t":"any"}},false],["plans",{"t":"obj","n":"plans","p":[]},false],["ids",{"t":"any"},false],["unselected",{"t":"any"},false]]},"opt":false}],
  inner$assemble$stateClasses: [{"name":"chosen","d":{"t":"any"},"opt":false}],
  inner$assemble$hasBuild: [{"name":"chosen","d":{"t":"any"},"opt":false}],
  inner$assemble$widgetClasses: [{"name":"chosen","d":{"t":"any"},"opt":false}],
  inner$assemble$nm: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$assemble$code: [{"name":"out","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$assemble$used: [{"name":"code","d":{"t":"str"},"opt":false}],
  inner$assemble$filter$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$assembleMulti$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$code: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$k: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$heads: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$dataCls: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$dataCls$$step: [{"name":"heads","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$assembleMulti$map$heads: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$map$stateCls: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$map$stateCls$$step: [{"name":"heads","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$assembleMulti$map$members: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$map$members$$step: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"stateCls","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$assembleMulti$renameFor: [{"name":"hoisted","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$tags: [{"name":"owners","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$codes: [{"name":"owners","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$N: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$assembleMulti$map$heads_L297: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$map$sc: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$assembleMulti$map$sc$$step: [{"name":"heads","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false}],
  inner$assembleMulti$applyFor$ren: [{"name":"renameFor","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tag","d":{"t":"any"},"opt":false}],
  inner$arg$i: [{"name":"k","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$socketPlan$sites$$after_loop: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"chosenSet","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"defIndex","d":{"t":"any"},"opt":false},{"name":"importNames","d":{"t":"any"},"opt":false},{"name":"preludeLines","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"obj","n":"pool","p":[]},"opt":false}],
  inner$socketPlan$unresolved$$after_loop: [{"name":"frags","d":{"t":"any"},"opt":false},{"name":"chosenSet","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"defIndex","d":{"t":"any"},"opt":false},{"name":"importNames","d":{"t":"any"},"opt":false},{"name":"preludeLines","d":{"t":"any"},"opt":false},{"name":"pool","d":{"t":"obj","n":"pool","p":[]},"opt":false}],
};
