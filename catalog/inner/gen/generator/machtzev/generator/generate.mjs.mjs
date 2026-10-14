// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/generate.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'x';
const ok = (c) => c.n != null || ((c.op === '=' || String(c.op || '')[0] === '@') && c.y);
const lit = (v) => "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$') + "'";
const unq = (v) => String(v).trim().replace(/^'(.*)'$/, '$1');
export function inner$goldIndex$m(stemsOf, f) {
    const m = stemsOf.get(f.module) || new Map();
    return m;
}
export function inner$goldModuleFor$tf(stemsOf, m) {
    const tf = stemsOf.get(m);
    return tf;
}
export function inner$routeOf$entLabels(SLG, ENT_LINE_RE, spec) {
    const entLabels = new Set(spec.spec.split('\n').filter((l) => ENT_LINE_RE.test(l)).map((l) => l.replace(ENT_LINE_RE, '').split(` ${SLG.withWord} `)[0].trim()));
    return entLabels;
}
export function inner$routeOf$srcThings(SRC) {
    const srcThings = new Set(SRC.flatMap((x) => x.things));
    return srcThings;
}
export function inner$routeOf$ruleThings(RUL) {
    const ruleThings = new Set(RUL ? RUL.things : []);
    return ruleThings;
}
export function inner$routeOf$bufThings(BUF) {
    const bufThings = new Set(BUF.flatMap((x) => x.things));
    return bufThings;
}
export function inner$routeOf$x(BUF, t) {
    const x = BUF.find((y) => y.things.includes(t.label));
    return x;
}
export function inner$routeOf$x_L93(SRC, t) {
    const x = SRC.find((y) => y.things.includes(t.label));
    return x;
}
export function inner$routeOf$c(capSegs, t) {
    const c = capSegs.get(t.src);
    return c;
}
export function inner$routeOf$line(search) {
    const line = search.map((x) => `«${x.word}»: כתוב על ${x.carriers} חלקיקים${x.carriers ? ` (${[...x.logic, ...x.display].slice(0, 3).join(', ')})` : ''} · שדות בגזע ${x.fields.length ? x.fields.join(', ') : 0} · הגדרה זכורה ${x.remembered ? 'כן' : 'לא'}`).join(' | ');
    return line;
}
export function inner$routeOf$capThings(routes) {
    const capThings = new Set(routes.filter((r) => r.route === 'capability').map((r) => r.thing));
    return capThings;
}
export function inner$routeOf$specLines(SLG, ENT_LINE_RE, DECL_RE, answers, spec, routes, SRC, RUL, BUF) {
    const entLabels = new Set(spec.spec.split('\n').filter((l) => ENT_LINE_RE.test(l)).map((l) => l.replace(ENT_LINE_RE, '').split(` ${SLG.withWord} `)[0].trim()));
    const srcThings = new Set(SRC.flatMap((x) => x.things));
    const ruleThings = new Set(RUL ? RUL.things : []);
    const bufThings = new Set(BUF.flatMap((x) => x.things));
    const SHP = answers.__shape || null;
    const capThings = new Set(routes.filter((r) => r.route === 'capability').map((r) => r.thing));
    const specLines = spec.spec.split('\n').filter((l) => { const m = l.match(DECL_RE); if (bufThings.size && [...bufThings].some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; if (ruleThings.size && [...ruleThings].some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; if (srcThings.size && [...srcThings].some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; if (SHP && SHP.things.some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; return !(m && capThings.has(m[2].trim()) && entLabels.has(m[2].trim())); });
    return specLines;
}
export function inner$routeOf$specLines$$step(DECL_RE, spec, entLabels, srcThings, ruleThings, bufThings, SHP, capThings) {
    const specLines = spec.spec.split('\n').filter((l) => { const m = l.match(DECL_RE); if (bufThings.size && [...bufThings].some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; if (ruleThings.size && [...ruleThings].some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; if (srcThings.size && [...srcThings].some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; if (SHP && SHP.things.some((x) => new RegExp(`^\\S+\\s+${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|:|$)`).test(l)))
        return false; return !(m && capThings.has(m[2].trim()) && entLabels.has(m[2].trim())); });
    return specLines;
}
export function inner$routeOf$filter$m(DECL_RE, l) {
    const m = l.match(DECL_RE);
    return m;
}
export function inner$markSilentDefaults$lookLine(spec, SL) {
    const lookLine = SL.lookWord && spec.match(new RegExp('^\\s*' + SL.lookWord + '\\s*:\\s*(.+)$', 'm'));
    return lookLine;
}
export function inner$generateFromDoc$perukRead(node) {
    const perukRead = Number((node && node.fields) || 0);
    return perukRead;
}
export function inner$generateFromDoc$qs(findings) {
    const qs = findings.filter((f) => f.q);
    return qs;
}
export function inner$generateFromDoc$fixes(findings) {
    const fixes = findings.filter((f) => !f.q && f.kind !== 'ממה נפשך');
    return fixes;
}
export function inner$generateFromDoc$latin(md) {
    const latin = new Set((md.match(/[A-Za-z_]+/g) || []).map((w) => w.toLowerCase()));
    return latin;
}
export function inner$generateFromDoc$m(ENT_FIELDS_RE, l) {
    const m = l.match(ENT_FIELDS_RE);
    return m;
}
export function inner$generateFromDoc$fieldsPart(ENT_FIELDS_RE, l) {
    const m = l.match(ENT_FIELDS_RE);
    const [fieldsPart, ...secs] = m[2].split(/\s*\|\s*/);
    return fieldsPart;
}
export function inner$generateFromDoc$fieldsPart$$step(m) {
    const [fieldsPart, ...secs] = m[2].split(/\s*\|\s*/);
    return fieldsPart;
}
export function inner$generateFromDoc$secs(ENT_FIELDS_RE, l) {
    const m = l.match(ENT_FIELDS_RE);
    const [fieldsPart, ...secs] = m[2].split(/\s*\|\s*/);
    return secs;
}
export function inner$generateFromDoc$secs$$step(m) {
    const [fieldsPart, ...secs] = m[2].split(/\s*\|\s*/);
    return secs;
}
export function inner$generateFromDoc$sm(s) {
    const sm = s.match(/^\S+\s*:?\s*(.+)$/);
    return sm;
}
export function inner$generateAll$routes(proposals, allRoutes) {
    const routes = proposals ? allRoutes : allRoutes.filter((r) => !r.proposal);
    return routes;
}
export function inner$generateAll$held(proposals, allRoutes) {
    const held = allRoutes.filter((r) => r.proposal && !proposals);
    return held;
}
export function inner$generateAll$covered(allRoutes) {
    const covered = allRoutes.filter((x) => x.route !== 'appds').map((x) => ({ role: x.route, text: x.thing }));
    return covered;
}
export function inner$generateAll$capSegs(proposals, allRoutes) {
    const routes = proposals ? allRoutes : allRoutes.filter((r) => !r.proposal);
    const capSegs = [...new Map(routes.filter((r) => r.route === 'capability' && !r.tail).map((r) => [r.seg, r.clauses])).entries()];
    return capSegs;
}
export function inner$generateAll$capSegs$$step(routes) {
    const capSegs = [...new Map(routes.filter((r) => r.route === 'capability' && !r.tail).map((r) => [r.seg, r.clauses])).entries()];
    return capSegs;
}
export function inner$generateAll$forEach$cls(i) {
    const cls = `GenCap${i + 1}Screen`;
    return cls;
}
export function inner$generateAll$map$fn$main(clauses) {
    const main = clauses.find((c) => c.kind === 'levels') || clauses.find((c) => ok(c) && !c.and && !c.or) || clauses.find(ok) || null;
    return main;
}
export function inner$generateAll$map$fn$ands(clauses) {
    const main = clauses.find((c) => c.kind === 'levels') || clauses.find((c) => ok(c) && !c.and && !c.or) || clauses.find(ok) || null;
    const ands = clauses.filter((c) => c !== main && c.and && ok(c));
    return ands;
}
export function inner$generateAll$map$fn$ands$$step(clauses, main) {
    const ands = clauses.filter((c) => c !== main && c.and && ok(c));
    return ands;
}
export function inner$generateAll$map$fn$ors(clauses) {
    const main = clauses.find((c) => c.kind === 'levels') || clauses.find((c) => ok(c) && !c.and && !c.or) || clauses.find(ok) || null;
    const ors = clauses.filter((c) => c !== main && c.or && ok(c));
    return ors;
}
export function inner$generateAll$map$fn$ors$$step(clauses, main) {
    const ors = clauses.filter((c) => c !== main && c.or && ok(c));
    return ors;
}
export function inner$generateAll$map$map$i(seg, c) {
    const i = c.x ? seg.indexOf(c.x) : -1;
    return i;
}
export function inner$generateAll$offOf$raw(answers, seg) {
    const raw = String(answers[`כיבוי ${seg.trim()}`] ?? '').trim();
    return raw;
}
export function inner$generateAll$offOf$v(answers, seg) {
    const raw = String(answers[`כיבוי ${seg.trim()}`] ?? '').trim();
    const v = Number(raw);
    return v;
}
export function inner$generateAll$offOf$v$$step(raw) {
    const v = Number(raw);
    return v;
}
export function inner$generateAll$feeds(proposals, allRoutes) {
    const routes = proposals ? allRoutes : allRoutes.filter((r) => !r.proposal);
    const feeds = [...new Set(routes.filter((r) => r.route === 'source').map((r) => r.ent))];
    return feeds;
}
export function inner$generateAll$feeds$$step(routes) {
    const feeds = [...new Set(routes.filter((r) => r.route === 'source').map((r) => r.ent))];
    return feeds;
}
export function inner$generateAll$derived(answers) {
    const SHP0 = answers.__shape || null;
    const derived = SHP0 && SHP0.linked ? [{ name: String(SHP0.seg).trim().split(/\s+/)[0], ent: SHP0.ent, parentKey: SHP0.fields[0], terms: SHP0.calc.terms, out: SHP0.out }] : [];
    return derived;
}
export function inner$generateAll$derived$$step(SHP0) {
    const derived = SHP0 && SHP0.linked ? [{ name: String(SHP0.seg).trim().split(/\s+/)[0], ent: SHP0.ent, parentKey: SHP0.fields[0], terms: SHP0.calc.terms, out: SHP0.out }] : [];
    return derived;
}
export function inner$generateAll$find$fn$m(ENT_FIELDS_RE, l) {
    const m = l.match(ENT_FIELDS_RE);
    return m;
}
export function inner$generateAll$ents(ENT_FIELDS_RE, spec) {
    const ents = spec.split('\n').map((l) => l.match(ENT_FIELDS_RE)).filter(Boolean).map((m) => ({ name: m[1].trim(), fields: m[2].split('|')[0].split(/[,،]/).map((f) => f.trim().replace(/\{[^}]*\}$/, '')).filter(Boolean) }));
    return ents;
}
export function inner$generateAll$entOfSlug$m0(ENT_NAME_RE, spec) {
    const m0 = spec.split('\n').map((l) => l.match(ENT_NAME_RE)).filter(Boolean).map((m) => m[1].trim());
    return m0;
}
export function inner$generateAll$fn$ce(app, x, ents) {
    const ce = ents.find((e) => app.nameToSlug && app.nameToSlug[e.name] === x.live.childSlug);
    return ce;
}
export function inner$generateAll$fn$l(spec, app, x, ents, SLc) {
    const ce = ents.find((e) => app.nameToSlug && app.nameToSlug[e.name] === x.live.childSlug);
    const l = spec.split('\n').find((q) => q.startsWith(`${SLc.exampleWord} ${ce.name}:`));
    return l;
}
export function inner$generateAll$fn$l$$step(spec, ce, SLc) {
    const l = spec.split('\n').find((q) => q.startsWith(`${SLc.exampleWord} ${ce.name}:`));
    return l;
}
export function inner$generateAll$fn$cfi(app, x, ents) {
    const ce = ents.find((e) => app.nameToSlug && app.nameToSlug[e.name] === x.live.childSlug);
    const cfi = ce.fields.indexOf(x.live.childField);
    return cfi;
}
export function inner$generateAll$fn$cfi$$step(x, ce) {
    const cfi = ce.fields.indexOf(x.live.childField);
    return cfi;
}
export function inner$generateAll$linkedOf$d(derived, x) {
    const d = derived.find((q) => q.name === (x.live.base || x.live.field));
    return d;
}
export function inner$generateAll$linkedOf$o(derived, x, r) {
    const d = derived.find((q) => q.name === (x.live.base || x.live.field));
    const o = d && d.out.find((q) => q.key === (r[0] || '').trim());
    return o;
}
export function inner$generateAll$linkedOf$o$$step(r, d) {
    const o = d && d.out.find((q) => q.key === (r[0] || '').trim());
    return o;
}
export function inner$generateAll$linkedOf$fi2(x, ent) {
    const fi2 = ent ? ent.fields.indexOf(x.live.arith.field) : -1;
    return fi2;
}
export function inner$generateAll$linkedOf$fv(x, ent, r) {
    const fi2 = ent ? ent.fields.indexOf(x.live.arith.field) : -1;
    const fv = fi2 >= 0 ? parseFloat(r[fi2]) : NaN;
    return fv;
}
export function inner$generateAll$linkedOf$fv$$step(r, fi2) {
    const fv = fi2 >= 0 ? parseFloat(r[fi2]) : NaN;
    return fv;
}
export function inner$generateAll$linkedOf$v(derived, x, ent, r) {
    const d = derived.find((q) => q.name === (x.live.base || x.live.field));
    const o = d && d.out.find((q) => q.key === (r[0] || '').trim());
    const fi2 = ent ? ent.fields.indexOf(x.live.arith.field) : -1;
    const fv = fi2 >= 0 ? parseFloat(r[fi2]) : NaN;
    const v = x.live.arith.op === '/' ? o.value / fv : x.live.arith.op === '*' ? o.value * fv : o.value + fv;
    return v;
}
export function inner$generateAll$linkedOf$v$$step(x, o, fv) {
    const v = x.live.arith.op === '/' ? o.value / fv : x.live.arith.op === '*' ? o.value * fv : o.value + fv;
    return v;
}
export function inner$generateAll$exLine(spec, ent, SLd) {
    const exLine = spec.split('\n').find((l) => l.startsWith(`${SLd.exampleWord} ${ent.name}:`));
    return exLine;
}
export function inner$generateAll$fi(x, ent) {
    const fi = ent.fields.indexOf(x.live.field);
    return fi;
}
export function inner$generateAll$lt0(x) {
    const lt0 = x.live.op === '<';
    return lt0;
}
export function inner$generateAll$m(tuples, sw) {
    const m = new Map(tuples.map((a, i) => [a.join('|'), sw.values[i]]));
    return m;
}
export function inner$generateAll$bi(x, ent) {
    const bi = ent.fields.indexOf(x.live.by);
    return bi;
}
export function inner$generateAll$exLine_L290(spec, ent, SLd) {
    const exLine = spec.split('\n').find((l) => l.startsWith(`${SLd.exampleWord} ${ent.name}:`));
    return exLine;
}
export function inner$generateAll$fi_L290(x, ent) {
    const fi = ent.fields.indexOf(x.live.field);
    return fi;
}
export function inner$generateAll$recs0(spec, ent, SLd) {
    const exLine = spec.split('\n').find((l) => l.startsWith(`${SLd.exampleWord} ${ent.name}:`));
    const recs0 = exLine ? exLine.slice(exLine.indexOf(':') + 1).split(';').map((r) => r.split(/[,،]/).map((v) => v.trim())) : [];
    return recs0;
}
export function inner$generateAll$recs0$$step(exLine) {
    const recs0 = exLine ? exLine.slice(exLine.indexOf(':') + 1).split(';').map((r) => r.split(/[,،]/).map((v) => v.trim())) : [];
    return recs0;
}
export function inner$generateAll$lv(spec, x, ent, SLd) {
    const exLine = spec.split('\n').find((l) => l.startsWith(`${SLd.exampleWord} ${ent.name}:`));
    const fi = ent.fields.indexOf(x.live.field);
    const recs0 = exLine ? exLine.slice(exLine.indexOf(':') + 1).split(';').map((r) => r.split(/[,،]/).map((v) => v.trim())) : [];
    const lv = recs0.map((r) => parseFloat(r[fi])).filter((v) => !isNaN(v));
    return lv;
}
export function inner$generateAll$lv$$step(fi, recs0) {
    const lv = recs0.map((r) => parseFloat(r[fi])).filter((v) => !isNaN(v));
    return lv;
}
export function inner$generateAll$id(x) {
    const id = `lvl.${x.slug}`;
    return id;
}
export function inner$generateAll$isEq(x) {
    const isEq = x.live.kind === 'eq';
    return isEq;
}
export function inner$generateAll$id_L301(x) {
    const id = `sev.${x.slug}`;
    return id;
}
export function inner$generateAll$tests(proposals, form, allRoutes, app) {
    const routes = proposals ? allRoutes : allRoutes.filter((r) => !r.proposal);
    const feeds = [...new Set(routes.filter((r) => r.route === 'source').map((r) => r.ent))];
    const tests = feeds.map((en) => {
        const t = form.things.find((x) => x.label === en);
        const row = t && t.examples && t.examples[0];
        const sl = app.nameToSlug[en];
        if (!row || !sl)
            return null;
        return [`  test(${lit(`מקור מבחוץ: «${en}» ⇒ שורה נכנסת לטבלה`)}, () {`, `    final before = appStore.records('${sl}').length;`, `    expect(ingestFeed('${sl}', ${lit(JSON.stringify([row]))}), 1);`, `    expect(appStore.records('${sl}').length, before + 1);`, `    expect(appStore.records('${sl}').any((r) => r.values.contains(${lit(row[0])})), isTrue);`, '  });'].join('\n');
    }).filter(Boolean);
    return tests;
}
export function inner$generateAll$tests$$step(form, feeds, app) {
    const tests = feeds.map((en) => {
        const t = form.things.find((x) => x.label === en);
        const row = t && t.examples && t.examples[0];
        const sl = app.nameToSlug[en];
        if (!row || !sl)
            return null;
        return [`  test(${lit(`מקור מבחוץ: «${en}» ⇒ שורה נכנסת לטבלה`)}, () {`, `    final before = appStore.records('${sl}').length;`, `    expect(ingestFeed('${sl}', ${lit(JSON.stringify([row]))}), 1);`, `    expect(appStore.records('${sl}').length, before + 1);`, `    expect(appStore.records('${sl}').any((r) => r.values.contains(${lit(row[0])})), isTrue);`, '  });'].join('\n');
    }).filter(Boolean);
    return tests;
}
export function inner$generateAll$map$t(form, en) {
    const t = form.things.find((x) => x.label === en);
    return t;
}
export function inner$generateAll$en(app, x) {
    const en = Object.keys(app.nameToSlug).find((n) => app.nameToSlug[n] === x.live.slug);
    return en;
}
export function inner$generateAll$t(form, app, x) {
    const en = Object.keys(app.nameToSlug).find((n) => app.nameToSlug[n] === x.live.slug);
    const t = form.things.find((y) => y.label === en);
    return t;
}
export function inner$generateAll$t$$step(form, en) {
    const t = form.things.find((y) => y.label === en);
    return t;
}
export function inner$generateAll$fi_L322(form, app, x) {
    const en = Object.keys(app.nameToSlug).find((n) => app.nameToSlug[n] === x.live.slug);
    const t = form.things.find((y) => y.label === en);
    const fi = t ? t.fields.findIndex((f) => f.label === x.live.field) : -1;
    return fi;
}
export function inner$generateAll$fi_L322$$step(x, t) {
    const fi = t ? t.fields.findIndex((f) => f.label === x.live.field) : -1;
    return fi;
}
export function inner$generateAll$span(x) {
    const H = x.live.horizon || 0;
    const span = Math.max(1, H || 30);
    return span;
}
export function inner$generateAll$span$$step(H) {
    const span = Math.max(1, H || 30);
    return span;
}
export function inner$generateAll$mins(form, app, x) {
    const en = Object.keys(app.nameToSlug).find((n) => app.nameToSlug[n] === x.live.slug);
    const t = form.things.find((y) => y.label === en);
    const rows = (t && t.examples) || [];
    const H = x.live.horizon || 0;
    const span = Math.max(1, H || 30);
    const mins = rows.map((r, i) => Math.round(span - (span * i) / (rows.length - 1)));
    return mins;
}
export function inner$generateAll$mins$$step(rows, span) {
    const mins = rows.map((r, i) => Math.round(span - (span * i) / (rows.length - 1)));
    return mins;
}
export function inner$generateAll$want(v) {
    const want = String(Math.round(v * 10) / 10);
    return want;
}
export function inner$generateAll$en_L327(app, x) {
    const en = Object.keys(app.nameToSlug).find((n) => app.nameToSlug[n] === x.live.slug);
    return en;
}
export function inner$generateAll$t_L328(form, app, x) {
    const en = Object.keys(app.nameToSlug).find((n) => app.nameToSlug[n] === x.live.slug);
    const t = form.things.find((y) => y.label === en);
    return t;
}
export function inner$generateAll$t_L328$$step(form, en) {
    const t = form.things.find((y) => y.label === en);
    return t;
}
export function inner$generateAll$fi_L328(form, app, x) {
    const en = Object.keys(app.nameToSlug).find((n) => app.nameToSlug[n] === x.live.slug);
    const t = form.things.find((y) => y.label === en);
    const fi = t.fields.findIndex((f) => f.label === x.live.field);
    return fi;
}
export function inner$generateAll$fi_L328$$step(x, t) {
    const fi = t.fields.findIndex((f) => f.label === x.live.field);
    return fi;
}
export function inner$generateAll$ri(rules, r) {
    const ri = rules.roles.indexOf(r);
    return ri;
}
export function inner$generateAll$others(app, es) {
    const others = Object.keys(app.nameToSlug).filter((n) => !es.includes(n));
    return others;
}
export function inner$generateAll$forEach$slug(i) {
    const slug = `buf${i + 1}`;
    return slug;
}
export function inner$generateAll$forEach$cls_L345(i) {
    const cls = `GenBuf${i + 1}Screen`;
    return cls;
}
export function inner$generateAll$ents_L355(app) {
    const ents = app ? app.screens.filter((s) => s.kind === 'entity').map((s) => s.slug) : [];
    return ents;
}
export function inner$generateAll$rec(B, id, n) {
    const p = (B.picks || {})[id] || {};
    const rec = { demand: n.demand, plan: p.proven ? (p.chain || [p.pick]).filter(Boolean) : null, synth: null, synthNote: '' };
    return rec;
}
export function inner$generateAll$rec$$step(n, p) {
    const rec = { demand: n.demand, plan: p.proven ? (p.chain || [p.pick]).filter(Boolean) : null, synth: null, synthNote: '' };
    return rec;
}
export function inner$generateAll$exs(n) {
    const exs = (n.examples || []).map(([args, want]) => { const a = String(args).trim(), w = String(want).replace(/^r\s*==\s*/, '').trim(); const one = /^'[^']*'$|^"[^"]*"$|^[^,'"]+$/.test(a); return one ? { in: a.replace(/^['"]|['"]$/g, ''), out: w.replace(/^['"]|['"]$/g, '') } : null; });
    return exs;
}
export function inner$generateAll$map$a(args) {
    const a = String(args).trim();
    return a;
}
export function inner$generateAll$map$w(want) {
    const w = String(want).replace(/^r\s*==\s*/, '').trim();
    return w;
}
export function inner$generateAll$map$one(args) {
    const a = String(args).trim();
    const one = /^'[^']*'$|^"[^"]*"$|^[^,'"]+$/.test(a);
    return one;
}
export function inner$generateAll$map$one$$step(a) {
    const one = /^'[^']*'$|^"[^"]*"$|^[^,'"]+$/.test(a);
    return one;
}
export function inner$generateAll$how(r) {
    let how = r ? `הוכח ב-synth: ${r.chain.join('∘')}${r.alts ? ` (+${r.alts} שקולות)` : ''}${r.shortcut ? ' · אטום-יחיד' : ''}` : '';
    return how;
}
export function inner$generateAll$tree(B, id) {
    const p = (B.picks || {})[id] || {};
    const tree = p.proven ? (B.trees || {})[id] : null;
    return tree;
}
export function inner$generateAll$tree$$step(B, id, p) {
    const tree = p.proven ? (B.trees || {})[id] : null;
    return tree;
}
export function inner$generateAll$gslug(name, out) {
    const gslug = 'beh_' + slug(name) + '_' + (Object.keys(out).length + 1);
    return gslug;
}
export function inner$generateAll$cls(name, out) {
    const gslug = 'beh_' + slug(name) + '_' + (Object.keys(out).length + 1);
    const cls = 'Gen' + gslug.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join('') + 'Screen';
    return cls;
}
export function inner$generateAll$cls$$step(gslug) {
    const cls = 'Gen' + gslug.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join('') + 'Screen';
    return cls;
}
export function inner$generateAll$map$ins(a) {
    const ins = String(a).split(/\s*,\s*/).map(unq);
    return ins;
}
export function inner$generateAll$map$o(w) {
    const o = unq(String(w).replace(/^r\s*==\s*/, ''));
    return o;
}
export function inner$generateAll$gspec(n, P, calc) {
    const exs = (n.examples || []).map(([args, want]) => { const a = String(args).trim(), w = String(want).replace(/^r\s*==\s*/, '').trim(); const one = /^'[^']*'$|^"[^"]*"$|^[^,'"]+$/.test(a); return one ? { in: a.replace(/^['"]|['"]$/g, ''), out: w.replace(/^['"]|['"]$/g, '') } : null; });
    const gspec = [`${n.demand}:`, `כותרת ${P.capProofTitle || n.demand}`, `אטום ChipWrap ${n.demand}: ${exs.map((e) => e.in).join(' / ')}`, ...calc, `כותרת ${P.capFreeTitle || n.demand}`, `${P.fieldPrompt || ''} ${n.demand}`.trim(), ...calc].join('\n');
    return gspec;
}
export function inner$generateAll$gspec$$step(n, exs, P, calc) {
    const gspec = [`${n.demand}:`, `כותרת ${P.capProofTitle || n.demand}`, `אטום ChipWrap ${n.demand}: ${exs.map((e) => e.in).join(' / ')}`, ...calc, `כותרת ${P.capFreeTitle || n.demand}`, `${P.fieldPrompt || ''} ${n.demand}`.trim(), ...calc].join('\n');
    return gspec;
}
export function inner$generateAll$gslug_L408(name, out) {
    const gslug = 'beh_' + slug(name) + '_' + (Object.keys(out).length + 1);
    return gslug;
}
export function inner$generateAll$ents_L424(ENT_LINE_RE, spec) {
    const ents = spec.split('\n').filter((l) => ENT_LINE_RE.test(l));
    return ents;
}
export function inner$generateAll$roles(ROLE_LINE_RE, spec) {
    const roles = spec.split('\n').filter((l) => ROLE_LINE_RE.test(l));
    return roles;
}
export function inner$generateAll$dash(DASH_LINE_RE, spec) {
    const dash = spec.split('\n').filter((l) => DASH_LINE_RE.test(l)).map((l) => l.replace(DASH_LINE_RE, '').split(',').map((p) => p.trim()).filter((p) => /^\S+?\(.+?\..+?\)$/.test(p))).flat();
    return dash;
}
export function inner$generateAll$appLine(NOT_APP_RE, spec) {
    const appLine = spec.split('\n').find((l) => /^[^\s:]+: /.test(l) && !NOT_APP_RE.test(l));
    return appLine;
}
export function inner$generateAll$genSpec(SLG, ENT_LINE_RE, ROLE_LINE_RE, DASH_LINE_RE, NOT_APP_RE, name, spec) {
    const ents = spec.split('\n').filter((l) => ENT_LINE_RE.test(l));
    const roles = spec.split('\n').filter((l) => ROLE_LINE_RE.test(l));
    const dash = spec.split('\n').filter((l) => DASH_LINE_RE.test(l)).map((l) => l.replace(DASH_LINE_RE, '').split(',').map((p) => p.trim()).filter((p) => /^\S+?\(.+?\..+?\)$/.test(p))).flat();
    const appLine = spec.split('\n').find((l) => /^[^\s:]+: /.test(l) && !NOT_APP_RE.test(l));
    const genSpec = [appLine || `${SLG.appWord}: ${name}`, ...ents, ...(dash.length ? [`לוח בקרה עם ${dash.join(', ')}`] : []), ...roles].join('\n');
    return genSpec;
}
export function inner$generateAll$genSpec$$step(SLG, name, ents, roles, dash, appLine) {
    const genSpec = [appLine || `${SLG.appWord}: ${name}`, ...ents, ...(dash.length ? [`לוח בקרה עם ${dash.join(', ')}`] : []), ...roles].join('\n');
    return genSpec;
}
export function inner$generateAll$kpi(report) {
    const kpi = new Set(report.dashboard.map((d) => d.entity));
    return kpi;
}
export function inner$generateAll$openN(lenses) {
    const openN = Object.values(lenses).reduce((a, l) => a + l.length, 0);
    return openN;
}
export function inner$generateAll$golds(proposals, allRoutes) {
    const routes = proposals ? allRoutes : allRoutes.filter((r) => !r.proposal);
    const golds = [...new Map(routes.filter((r) => r.route === 'gold').map((r) => [r.module + '|' + r.thing, r])).values()];
    return golds;
}
export function inner$generateAll$golds$$step(routes) {
    const golds = [...new Map(routes.filter((r) => r.route === 'gold').map((r) => [r.module + '|' + r.thing, r])).values()];
    return golds;
}
export function inner$generateAll$comb(proposals, allRoutes) {
    const routes = proposals ? allRoutes : allRoutes.filter((r) => !r.proposal);
    const comb = routes.filter((r) => r.route === 'combine');
    return comb;
}
export function inner$generateAll$comb$$step(routes) {
    const comb = routes.filter((r) => r.route === 'combine');
    return comb;
}
export function inner$generateAll$merged(sentence, name, contentSet, sections) {
    const merged = { generated: true, src: `mavin:${sentence}`, screen: `gen_${slug(name)}_combined`, content: [...contentSet], sections };
    return merged;
}
export function inner$generateAll$out(g) {
    const out = (g.stdout || '') + (g.stderr || '');
    return out;
}
export function inner$generateAll$hit(g) {
    const out = (g.stdout || '') + (g.stderr || '');
    const hit = out.match(/הורכב: (\S+)/);
    return hit;
}
export function inner$generateAll$hit$$step(out) {
    const hit = out.match(/הורכב: (\S+)/);
    return hit;
}
export function inner$generateAll$fedSlugs(proposals, allRoutes, app) {
    const routes = proposals ? allRoutes : allRoutes.filter((r) => !r.proposal);
    const feeds = [...new Set(routes.filter((r) => r.route === 'source').map((r) => r.ent))];
    const fedSlugs = new Set(feeds.map((en) => app && app.nameToSlug && app.nameToSlug[en]).filter(Boolean));
    return fedSlugs;
}
export function inner$generateAll$fedSlugs$$step(feeds, app) {
    const fedSlugs = new Set(feeds.map((en) => app && app.nameToSlug && app.nameToSlug[en]).filter(Boolean));
    return fedSlugs;
}
export function inner$generateAll$m_L477(ABS, f) {
    const m = ABS && f.formula && f.formula.match(new RegExp(`^${ABS}\\((.+?)-(.+)\\)$`));
    return m;
}
export function inner$generateAll$mv(r) {
    const o = r.result.output || {};
    const mv = typeof o.move === 'string' ? o.move : (o.move && (o.move.text || o.move.move)) || '';
    return mv;
}
export function inner$generateAll$mv$$step(o) {
    const mv = typeof o.move === 'string' ? o.move : (o.move && (o.move.text || o.move.move)) || '';
    return mv;
}
export function inner$generateBalagan$notes$$after_loop(logs) {
    const notes = [];
    for (const l of logs.slice(-6))
        notes.push(l.slice(0, 200));
    return notes;
}

export const SIGS = {
  inner$goldIndex$m: [{"name":"stemsOf","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$goldModuleFor$tf: [{"name":"stemsOf","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$routeOf$entLabels: [{"name":"SLG","d":{"t":"any"},"opt":false},{"name":"ENT_LINE_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"obj","p":[["spec",{"t":"str"},false],["skipped",{"t":"arr","of":{"t":"any"}},false],["builtin",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$routeOf$srcThings: [{"name":"SRC","d":{"t":"arr","of":{"t":"obj","p":[["seg",{"t":"any"},false],["ent",{"t":"any"},false],["things",{"t":"any"},false]]}},"opt":false}],
  inner$routeOf$ruleThings: [{"name":"RUL","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["modes",{"t":"or","of":[{"t":"arr","of":{"t":"str"}},{"t":"arr","of":{"t":"undef"}}]},false],["roles",{"t":"or","of":[{"t":"arr","of":{"t":"str"}},{"t":"arr","of":{"t":"undef"}}]},false],["hide",{"t":"obj","n":"hide","p":[]},false],["only",{"t":"obj","n":"only","p":[]},false],["see",{"t":"obj","n":"see","p":[]},false],["things",{"t":"any"},false]]}]},"opt":false}],
  inner$routeOf$bufThings: [{"name":"BUF","d":{"t":"arr","of":{"t":"obj","p":[["seg",{"t":"any"},false],["ent",{"t":"any"},false],["field",{"t":"any"},false],["ceiling",{"t":"num"},false],["batch",{"t":"num"},false],["everyMin",{"t":"num"},false],["things",{"t":"any"},false],["sum",{"t":"any"},false]]}},"opt":false}],
  inner$routeOf$x: [{"name":"BUF","d":{"t":"arr","of":{"t":"obj","p":[["seg",{"t":"any"},false],["ent",{"t":"any"},false],["field",{"t":"any"},false],["ceiling",{"t":"num"},false],["batch",{"t":"num"},false],["everyMin",{"t":"num"},false],["things",{"t":"any"},false],["sum",{"t":"any"},false]]}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$routeOf$x_L93: [{"name":"SRC","d":{"t":"arr","of":{"t":"obj","p":[["seg",{"t":"any"},false],["ent",{"t":"any"},false],["things",{"t":"any"},false]]}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$routeOf$c: [{"name":"capSegs","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$routeOf$line: [{"name":"search","d":{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},"opt":false}],
  inner$routeOf$capThings: [{"name":"routes","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$routeOf$specLines: [{"name":"SLG","d":{"t":"any"},"opt":false},{"name":"ENT_LINE_RE","d":{"t":"any"},"opt":false},{"name":"DECL_RE","d":{"t":"any"},"opt":false},{"name":"answers","d":{"t":"obj","p":[]},"opt":false},{"name":"spec","d":{"t":"obj","p":[["spec",{"t":"str"},false],["skipped",{"t":"arr","of":{"t":"any"}},false],["builtin",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"routes","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"SRC","d":{"t":"arr","of":{"t":"obj","p":[["seg",{"t":"any"},false],["ent",{"t":"any"},false],["things",{"t":"any"},false]]}},"opt":false},{"name":"RUL","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["modes",{"t":"or","of":[{"t":"arr","of":{"t":"str"}},{"t":"arr","of":{"t":"undef"}}]},false],["roles",{"t":"or","of":[{"t":"arr","of":{"t":"str"}},{"t":"arr","of":{"t":"undef"}}]},false],["hide",{"t":"obj","n":"hide","p":[]},false],["only",{"t":"obj","n":"only","p":[]},false],["see",{"t":"obj","n":"see","p":[]},false],["things",{"t":"any"},false]]}]},"opt":false},{"name":"BUF","d":{"t":"arr","of":{"t":"obj","p":[["seg",{"t":"any"},false],["ent",{"t":"any"},false],["field",{"t":"any"},false],["ceiling",{"t":"num"},false],["batch",{"t":"num"},false],["everyMin",{"t":"num"},false],["things",{"t":"any"},false],["sum",{"t":"any"},false]]}},"opt":false}],
  inner$routeOf$specLines$$step: [{"name":"DECL_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"obj","p":[["spec",{"t":"str"},false],["skipped",{"t":"arr","of":{"t":"any"}},false],["builtin",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"entLabels","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"srcThings","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"ruleThings","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"bufThings","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"SHP","d":{"t":"any"},"opt":false},{"name":"capThings","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$routeOf$filter$m: [{"name":"DECL_RE","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$markSilentDefaults$lookLine: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"SL","d":{"t":"any"},"opt":false}],
  inner$generateFromDoc$perukRead: [{"name":"node","d":{"t":"obj","p":[["id",{"t":"null"},false],["ns",{"t":"any"},false],["title",{"t":"null"},false],["moment",{"t":"null"},false],["category",{"t":"null"},false],["not",{"t":"arr","of":{"t":"undef"}},false],["fields",{"t":"num"},false],["outputs",{"t":"arr","of":{"t":"str"}},false],["severity",{"t":"bool"},false],["classes",{"t":"arr","of":{"t":"any"}},false],["decisions",{"t":"arr","of":{"t":"str"}},false],["prices",{"t":"any"},false],["chain",{"t":"any"},false],["forbidden",{"t":"num"},false],["disclaimer",{"t":"or","of":[{"t":"bool"},{"t":"str"}]},false],["content",{"t":"num"},false]]},"opt":false}],
  inner$generateFromDoc$qs: [{"name":"findings","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["opts",{"t":"arr","of":{"t":"str"}},false],["name",{"t":"str"},false],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["ent",{"t":"any"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true]]},false],["pair",{"t":"obj","p":[["ent",{"t":"any"},false],["a",{"t":"any"},false],["b",{"t":"any"},false]]},false],["line",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"any"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["readings",{"t":"arr","of":{"t":"str"}},false],["pair",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["doc_says",{"t":"any"},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["line",{"t":"undef"},true],["apply",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateFromDoc$fixes: [{"name":"findings","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["opts",{"t":"arr","of":{"t":"str"}},false],["name",{"t":"str"},false],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["ent",{"t":"any"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true]]},false],["pair",{"t":"obj","p":[["ent",{"t":"any"},false],["a",{"t":"any"},false],["b",{"t":"any"},false]]},false],["line",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"any"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["line",{"t":"any"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["line",{"t":"str"},false],["opts",{"t":"undef"},true],["name",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["readings",{"t":"arr","of":{"t":"str"}},false],["pair",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["apply",{"t":"obj","p":[["type",{"t":"str"},false],["name",{"t":"any"},false],["opts",{"t":"undef"},true],["line",{"t":"undef"},true],["ent",{"t":"undef"},true]]},false],["doc_says",{"t":"any"},false],["line",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["q",{"t":"bool"},false],["text",{"t":"str"},false],["line",{"t":"undef"},true],["apply",{"t":"undef"},true],["pair",{"t":"undef"},true],["readings",{"t":"undef"},true],["doc_says",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateFromDoc$latin: [{"name":"md","d":{"t":"any"},"opt":false}],
  inner$generateFromDoc$m: [{"name":"ENT_FIELDS_RE","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$generateFromDoc$fieldsPart: [{"name":"ENT_FIELDS_RE","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$generateFromDoc$fieldsPart$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$generateFromDoc$secs: [{"name":"ENT_FIELDS_RE","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$generateFromDoc$secs$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$generateFromDoc$sm: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$generateAll$routes: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$held: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$covered: [{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$capSegs: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$capSegs$$step: [{"name":"routes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$forEach$cls: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generateAll$map$fn$main: [{"name":"clauses","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$fn$ands: [{"name":"clauses","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$fn$ands$$step: [{"name":"clauses","d":{"t":"any"},"opt":false},{"name":"main","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$fn$ors: [{"name":"clauses","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$fn$ors$$step: [{"name":"clauses","d":{"t":"any"},"opt":false},{"name":"main","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$map$i: [{"name":"seg","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$generateAll$offOf$raw: [{"name":"answers","d":{"t":"obj","p":[]},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$generateAll$offOf$v: [{"name":"answers","d":{"t":"obj","p":[]},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$generateAll$offOf$v$$step: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$generateAll$feeds: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$feeds$$step: [{"name":"routes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$derived: [{"name":"answers","d":{"t":"obj","p":[]},"opt":false}],
  inner$generateAll$derived$$step: [{"name":"SHP0","d":{"t":"any"},"opt":false}],
  inner$generateAll$find$fn$m: [{"name":"ENT_FIELDS_RE","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"str"},"opt":false}],
  inner$generateAll$ents: [{"name":"ENT_FIELDS_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$generateAll$entOfSlug$m0: [{"name":"ENT_NAME_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$generateAll$fn$ce: [{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false},{"name":"ents","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false}],
  inner$generateAll$fn$l: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false},{"name":"ents","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false},{"name":"SLc","d":{"t":"any"},"opt":false}],
  inner$generateAll$fn$l$$step: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"ce","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]}]},"opt":false},{"name":"SLc","d":{"t":"any"},"opt":false}],
  inner$generateAll$fn$cfi: [{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false},{"name":"ents","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]}},"opt":false}],
  inner$generateAll$fn$cfi$$step: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"ce","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]}]},"opt":false}],
  inner$generateAll$linkedOf$d: [{"name":"derived","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["ent",{"t":"any"},false],["parentKey",{"t":"any"},false],["terms",{"t":"any"},false],["out",{"t":"any"},false]]}},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$linkedOf$o: [{"name":"derived","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["ent",{"t":"any"},false],["parentKey",{"t":"any"},false],["terms",{"t":"any"},false],["out",{"t":"any"},false]]}},"opt":false},{"name":"x","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$generateAll$linkedOf$o$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["name",{"t":"str"},false],["ent",{"t":"any"},false],["parentKey",{"t":"any"},false],["terms",{"t":"any"},false],["out",{"t":"any"},false]]}]},"opt":false}],
  inner$generateAll$linkedOf$fi2: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$generateAll$linkedOf$fv: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$generateAll$linkedOf$fv$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"fi2","d":{"t":"num"},"opt":false}],
  inner$generateAll$linkedOf$v: [{"name":"derived","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"str"},false],["ent",{"t":"any"},false],["parentKey",{"t":"any"},false],["terms",{"t":"any"},false],["out",{"t":"any"},false]]}},"opt":false},{"name":"x","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$generateAll$linkedOf$v$$step: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false},{"name":"fv","d":{"t":"num"},"opt":false}],
  inner$generateAll$exLine: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"SLd","d":{"t":"any"},"opt":false}],
  inner$generateAll$fi: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$generateAll$lt0: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$m: [{"name":"tuples","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"sw","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"any"},false],["error",{"t":"undef"},true],["values",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["error",{"t":"any"},false],["reason",{"t":"undef"},true],["values",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["values",{"t":"any"},false],["reason",{"t":"undef"},true],["error",{"t":"undef"},true]]}]},"opt":false}],
  inner$generateAll$bi: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$generateAll$exLine_L290: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"SLd","d":{"t":"any"},"opt":false}],
  inner$generateAll$fi_L290: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$generateAll$recs0: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"SLd","d":{"t":"any"},"opt":false}],
  inner$generateAll$recs0$$step: [{"name":"exLine","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$generateAll$lv: [{"name":"spec","d":{"t":"str"},"opt":false},{"name":"x","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"obj","p":[["name",{"t":"str"},false],["fields",{"t":"arr","of":{"t":"str"}},false]]},"opt":false},{"name":"SLd","d":{"t":"any"},"opt":false}],
  inner$generateAll$lv$$step: [{"name":"fi","d":{"t":"num"},"opt":false},{"name":"recs0","d":{"t":"arr","of":{"t":"arr","of":{"t":"str"}}},"opt":false}],
  inner$generateAll$id: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$isEq: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$id_L301: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$tests: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false}],
  inner$generateAll$tests$$step: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"feeds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false}],
  inner$generateAll$map$t: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"en","d":{"t":"any"},"opt":false}],
  inner$generateAll$en: [{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$t: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$t$$step: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"en","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$generateAll$fi_L322: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$fi_L322$$step: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$generateAll$span: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$span$$step: [{"name":"H","d":{"t":"any"},"opt":false}],
  inner$generateAll$mins: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$mins$$step: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$generateAll$want: [{"name":"v","d":{"t":"num"},"opt":false}],
  inner$generateAll$en_L327: [{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$t_L328: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$t_L328$$step: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"en","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$generateAll$fi_L328: [{"name":"form","d":{"t":"obj","p":[["sentence",{"t":"str"},false],["words",{"t":"arr","of":{"t":"str"}},false],["segments",{"t":"arr","of":{"t":"str"}},false],["things",{"t":"arr","of":{"t":"any"}},false],["frame",{"t":"arr","of":{"t":"str"}},false],["examplesOrphan",{"t":"arr","of":{"t":"any"}},false]]},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$generateAll$fi_L328$$step: [{"name":"x","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$generateAll$ri: [{"name":"rules","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["modes",{"t":"or","of":[{"t":"arr","of":{"t":"str"}},{"t":"arr","of":{"t":"undef"}}]},false],["roles",{"t":"or","of":[{"t":"arr","of":{"t":"str"}},{"t":"arr","of":{"t":"undef"}}]},false],["hide",{"t":"obj","n":"hide","p":[]},false],["only",{"t":"obj","n":"only","p":[]},false],["see",{"t":"obj","n":"see","p":[]},false],["things",{"t":"any"},false]]}]},"opt":false},{"name":"r","d":{"t":"str"},"opt":false}],
  inner$generateAll$others: [{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false},{"name":"es","d":{"t":"any"},"opt":false}],
  inner$generateAll$forEach$slug: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generateAll$forEach$cls_L345: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$generateAll$ents_L355: [{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false}],
  inner$generateAll$rec: [{"name":"B","d":{"t":"or","of":[{"t":"obj","p":[["picks",{"t":"obj","p":[]},false],["asks",{"t":"arr","of":{"t":"obj","p":[["thing",{"t":"any"},false],["ask",{"t":"str"},false],["rel",{"t":"any"},false]]}},false],["needs",{"t":"undef"},true],["trees",{"t":"undef"},true],["ms",{"t":"undef"},true]]},{"t":"obj","p":[["picks",{"t":"rec","of":{"t":"obj","p":[["pick",{"t":"any"},false],["nodes",{"t":"any"},false],["chain",{"t":"any"},false],["proven",{"t":"bool"},false],["ties",{"t":"any"},false],["top3",{"t":"any"},false]]}},false],["asks",{"t":"arr","of":{"t":"obj","p":[["thing",{"t":"any"},false],["ask",{"t":"str"},false],["rel",{"t":"any"},false]]}},false],["needs",{"t":"obj","n":"needs","p":[]},false],["trees",{"t":"rec","of":{"t":"any"}},false],["ms",{"t":"num"},false]]}]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$generateAll$rec$$step: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"obj","p":[["pick",{"t":"any"},false],["nodes",{"t":"any"},false],["chain",{"t":"any"},false],["proven",{"t":"bool"},false],["ties",{"t":"any"},false],["top3",{"t":"any"},false]]},"opt":false}],
  inner$generateAll$exs: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$a: [{"name":"args","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$w: [{"name":"want","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$one: [{"name":"args","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$one$$step: [{"name":"a","d":{"t":"str"},"opt":false}],
  inner$generateAll$how: [{"name":"r","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["chain",{"t":"arr","of":{"t":"any"}},false],["alts",{"t":"num"},false],["shortcut",{"t":"bool"},false]]}]},"opt":false}],
  inner$generateAll$tree: [{"name":"B","d":{"t":"or","of":[{"t":"obj","p":[["picks",{"t":"obj","p":[]},false],["asks",{"t":"arr","of":{"t":"obj","p":[["thing",{"t":"any"},false],["ask",{"t":"str"},false],["rel",{"t":"any"},false]]}},false],["needs",{"t":"undef"},true],["trees",{"t":"undef"},true],["ms",{"t":"undef"},true]]},{"t":"obj","p":[["picks",{"t":"rec","of":{"t":"obj","p":[["pick",{"t":"any"},false],["nodes",{"t":"any"},false],["chain",{"t":"any"},false],["proven",{"t":"bool"},false],["ties",{"t":"any"},false],["top3",{"t":"any"},false]]}},false],["asks",{"t":"arr","of":{"t":"obj","p":[["thing",{"t":"any"},false],["ask",{"t":"str"},false],["rel",{"t":"any"},false]]}},false],["needs",{"t":"obj","n":"needs","p":[]},false],["trees",{"t":"rec","of":{"t":"any"}},false],["ms",{"t":"num"},false]]}]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$generateAll$tree$$step: [{"name":"B","d":{"t":"or","of":[{"t":"obj","p":[["picks",{"t":"obj","p":[]},false],["asks",{"t":"arr","of":{"t":"obj","p":[["thing",{"t":"any"},false],["ask",{"t":"str"},false],["rel",{"t":"any"},false]]}},false],["needs",{"t":"undef"},true],["trees",{"t":"undef"},true],["ms",{"t":"undef"},true]]},{"t":"obj","p":[["picks",{"t":"rec","of":{"t":"obj","p":[["pick",{"t":"any"},false],["nodes",{"t":"any"},false],["chain",{"t":"any"},false],["proven",{"t":"bool"},false],["ties",{"t":"any"},false],["top3",{"t":"any"},false]]}},false],["asks",{"t":"arr","of":{"t":"obj","p":[["thing",{"t":"any"},false],["ask",{"t":"str"},false],["rel",{"t":"any"},false]]}},false],["needs",{"t":"obj","n":"needs","p":[]},false],["trees",{"t":"rec","of":{"t":"any"}},false],["ms",{"t":"num"},false]]}]},"opt":false},{"name":"id","d":{"t":"str"},"opt":false},{"name":"p","d":{"t":"obj","p":[["pick",{"t":"any"},false],["nodes",{"t":"any"},false],["chain",{"t":"any"},false],["proven",{"t":"bool"},false],["ties",{"t":"any"},false],["top3",{"t":"any"},false]]},"opt":false}],
  inner$generateAll$gslug: [{"name":"name","d":{"t":"str"},"opt":false},{"name":"out","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$generateAll$cls: [{"name":"name","d":{"t":"str"},"opt":false},{"name":"out","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$generateAll$cls$$step: [{"name":"gslug","d":{"t":"str"},"opt":false}],
  inner$generateAll$map$ins: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$generateAll$map$o: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$generateAll$gspec: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"any"},"opt":false},{"name":"calc","d":{"t":"any"},"opt":false}],
  inner$generateAll$gspec$$step: [{"name":"n","d":{"t":"any"},"opt":false},{"name":"exs","d":{"t":"any"},"opt":false},{"name":"P","d":{"t":"any"},"opt":false},{"name":"calc","d":{"t":"any"},"opt":false}],
  inner$generateAll$gslug_L408: [{"name":"name","d":{"t":"str"},"opt":false},{"name":"out","d":{"t":"obj","n":"out","p":[]},"opt":false}],
  inner$generateAll$ents_L424: [{"name":"ENT_LINE_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$generateAll$roles: [{"name":"ROLE_LINE_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$generateAll$dash: [{"name":"DASH_LINE_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$generateAll$appLine: [{"name":"NOT_APP_RE","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$generateAll$genSpec: [{"name":"SLG","d":{"t":"any"},"opt":false},{"name":"ENT_LINE_RE","d":{"t":"any"},"opt":false},{"name":"ROLE_LINE_RE","d":{"t":"any"},"opt":false},{"name":"DASH_LINE_RE","d":{"t":"any"},"opt":false},{"name":"NOT_APP_RE","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"str"},"opt":false},{"name":"spec","d":{"t":"str"},"opt":false}],
  inner$generateAll$genSpec$$step: [{"name":"SLG","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"str"},"opt":false},{"name":"ents","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"roles","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"dash","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"appLine","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$generateAll$kpi: [{"name":"report","d":{"t":"any"},"opt":false}],
  inner$generateAll$openN: [{"name":"lenses","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$generateAll$golds: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$golds$$step: [{"name":"routes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$comb: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$comb$$step: [{"name":"routes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false}],
  inner$generateAll$merged: [{"name":"sentence","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"str"},"opt":false},{"name":"contentSet","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"sections","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$generateAll$out: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$generateAll$hit: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$generateAll$hit$$step: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$generateAll$fedSlugs: [{"name":"proposals","d":{"t":"bool"},"opt":false},{"name":"allRoutes","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["ent",{"t":"any"},false],["why",{"t":"str"},false],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["tail",{"t":"any"},false],["why",{"t":"str"},false],["seg",{"t":"any"},false],["clauses",{"t":"any"},false],["ent",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["screen",{"t":"str"},false],["score",{"t":"num"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["module",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["proposal",{"t":"bool"},false],["core",{"t":"str"},false],["why",{"t":"str"},false],["module",{"t":"any"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["search",{"t":"undef"},true]]},{"t":"obj","p":[["thing",{"t":"any"},false],["route",{"t":"str"},false],["search",{"t":"arr","of":{"t":"obj","p":[["word",{"t":"str"},false],["form",{"t":"any"},false],["carriers",{"t":"num"},false],["logic",{"t":"arr","of":{"t":"any"}},false],["display",{"t":"arr","of":{"t":"any"}},false],["fields",{"t":"any"},false],["remembered",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]}},false],["why",{"t":"str"},false],["ent",{"t":"undef"},true],["tail",{"t":"undef"},true],["seg",{"t":"undef"},true],["clauses",{"t":"undef"},true],["proposal",{"t":"undef"},true],["core",{"t":"undef"},true],["screen",{"t":"undef"},true],["score",{"t":"undef"},true],["module",{"t":"undef"},true]]}]}},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false}],
  inner$generateAll$fedSlugs$$step: [{"name":"feeds","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"app","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["screens",{"t":"arr","of":{"t":"obj","p":[["slug",{"t":"str"},false],["cls",{"t":"str"},false],["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"str"},false]]}},false],["sys",{"t":"arr","of":{"t":"obj","p":[["kind",{"t":"str"},false],["name",{"t":"any"},false],["icon",{"t":"str"},false],["sub",{"t":"any"},false],["slug",{"t":"any"},false],["cls",{"t":"str"},false]]}},false],["roles",{"t":"any"},false],["liveExtras",{"t":"any"},false],["nameToSlug",{"t":"obj","n":"nameToSlug","p":[]},false]]}]},"opt":false}],
  inner$generateAll$m_L477: [{"name":"ABS","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$generateAll$mv: [{"name":"r","d":{"t":"or","of":[{"t":"obj","p":[["available",{"t":"bool"},false],["reason",{"t":"any"},false],["error",{"t":"undef"},true],["result",{"t":"undef"},true],["rejected",{"t":"undef"},true],["text",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["error",{"t":"any"},false],["reason",{"t":"undef"},true],["result",{"t":"undef"},true],["rejected",{"t":"undef"},true],["text",{"t":"undef"},true]]},{"t":"obj","p":[["available",{"t":"bool"},false],["result",{"t":"any"},false],["rejected",{"t":"bool"},false],["text",{"t":"any"},false],["reason",{"t":"undef"},true],["error",{"t":"undef"},true]]}]},"opt":false}],
  inner$generateAll$mv$$step: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$generateBalagan$notes$$after_loop: [{"name":"logs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
