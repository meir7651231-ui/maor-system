// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/particles.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const heW = (s) => [...String(s || '').matchAll(/[֐-׿][֐-׿״׳]*/g)].map((m) => m[0]);
const clean = (s) => heW(s).join(' ').trim();
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
const SOCK = {
    value: /^(value|val|amount|total|count|num)$/, label: /^(label|title|caption|name|text)$/, sub: /^(sub|subtitle|desc|body|note)$/,
    glyph: /^(glyph|emoji|icon)$/, fraction: /^(fraction|pct|percent|progress)$/, tap: /^(onTap|onPressed)$/, tone: /^(tone|severity|level)$/,
    labels: /^(labels|cols|columns|headers)$/, rows: /^(rows|data)$/, message: /^(message)$/,
    items: /^(items|options)$/, selected: /^(selected|activeIndex|index)$/, onSelect: /^(onSelect|onChanged)$/, children: /^(children)$/, // G24: בורר/מיכל
    delta: /^(delta|change|diff)$/, // G29: שינוי (דיף)
};
const BEHAV = /^(onTap|onPressed|onSelect|onChanged|onSelected|onSubmitted)$/;
const descFieldOf = (entity, p) => {
    const textish = entity.schema.filter((f) => !f.formula && !(f.enumVals && f.enumVals.length) && !(f.members && f.members.length) && !/^(num|date|bool)$/.test(f.type || '') && !(p.entNames || []).includes(f.label));
    return textish.slice().sort((a, b) => (b.type === 'multiline') - (a.type === 'multiline') || b.label.split(/\s+/).length - a.label.split(/\s+/).length)[0] || entity.schema[0];
};
const clsOf = (slug) => 'Gen' + slug.replace(/(^|_)([a-z0-9])/g, (_, __, c) => c.toUpperCase()) + 'Screen';
const val = (f, i) => f.enumVals && f.enumVals.length ? f.enumVals[0] : f.type === 'num' ? String(i + 1) : f.type === 'date' ? '2026-01-01' : f.type === 'bool' ? 'כן' : `${f.label}-${i + 1}`;
export function inner$parseParticleLines$body(PARTICLE_RE, line) {
    const body = line.replace(PARTICLE_RE, '');
    return body;
}
export function inner$parseParticleLines$ci(PARTICLE_RE, line) {
    const body = line.replace(PARTICLE_RE, '');
    const ci = body.indexOf(':');
    return ci;
}
export function inner$parseParticleLines$ci$$step(body) {
    const ci = body.indexOf(':');
    return ci;
}
export function inner$parseParticleLines$entity(PARTICLE_RE, line) {
    const body = line.replace(PARTICLE_RE, '');
    const ci = body.indexOf(':');
    const entity = clean(body.slice(0, ci));
    return entity;
}
export function inner$parseParticleLines$entity$$step(body, ci) {
    const entity = clean(body.slice(0, ci));
    return entity;
}
export function inner$parseParticleLines$rest(PARTICLE_RE, line) {
    const body = line.replace(PARTICLE_RE, '');
    const ci = body.indexOf(':');
    let rest = body.slice(ci + 1).trim();
    return rest;
}
export function inner$parseParticleLines$rest$$step(body, ci) {
    let rest = body.slice(ci + 1).trim();
    return rest;
}
export function inner$parseParticleLines$eq(PARTICLE_RE, line) {
    const body = line.replace(PARTICLE_RE, '');
    const ci = body.indexOf(':');
    let rest = body.slice(ci + 1).trim();
    const eq = rest.indexOf(' = ');
    return eq;
}
export function inner$parseParticleLines$eq$$step(rest) {
    const eq = rest.indexOf(' = ');
    return eq;
}
export function inner$parseContentLines$m(CONTENT_RE, line) {
    const m = line.replace(CONTENT_RE, '').match(/^([^\[:]+?)\s*(?:\[([^\]]+)\])?\s*:\s*(.+)$/);
    return m;
}
export function inner$parseReportLines$body(REPORT_RE, line) {
    const body = line.replace(REPORT_RE, '');
    return body;
}
export function inner$parseReportLines$ci(REPORT_RE, line) {
    const body = line.replace(REPORT_RE, '');
    const ci = body.indexOf(':');
    return ci;
}
export function inner$parseReportLines$ci$$step(body) {
    const ci = body.indexOf(':');
    return ci;
}
export function inner$parseReportLines$entity(REPORT_RE, line) {
    const body = line.replace(REPORT_RE, '');
    const ci = body.indexOf(':');
    const entity = clean(body.slice(0, ci));
    return entity;
}
export function inner$parseReportLines$entity$$step(body, ci) {
    const entity = clean(body.slice(0, ci));
    return entity;
}
export function inner$parseReportLines$rest(REPORT_RE, line) {
    const body = line.replace(REPORT_RE, '');
    const ci = body.indexOf(':');
    const rest = body.slice(ci + 1).trim();
    return rest;
}
export function inner$parseReportLines$rest$$step(body, ci) {
    const rest = body.slice(ci + 1).trim();
    return rest;
}
export function inner$parseReportLines$eqx(xm) {
    const eqx = xm[2].indexOf(' = ');
    return eqx;
}
export function inner$parseReportLines$label(xm) {
    const eqx = xm[2].indexOf(' = ');
    const label = (eqx > 0 ? xm[2].slice(0, eqx) : xm[2]).trim();
    return label;
}
export function inner$parseReportLines$label$$step(xm, eqx) {
    const label = (eqx > 0 ? xm[2].slice(0, eqx) : xm[2]).trim();
    return label;
}
export function inner$parseReportLines$goal(xm) {
    const eqx = xm[2].indexOf(' = ');
    const goal = eqx > 0 ? xm[2].slice(eqx + 3).trim() : '';
    return goal;
}
export function inner$parseReportLines$goal$$step(xm, eqx) {
    const goal = eqx > 0 ? xm[2].slice(eqx + 3).trim() : '';
    return goal;
}
export function inner$parseReportLines$eq(REPORT_RE, line) {
    const body = line.replace(REPORT_RE, '');
    const ci = body.indexOf(':');
    const rest = body.slice(ci + 1).trim();
    const eq = rest.indexOf(' = ');
    return eq;
}
export function inner$parseReportLines$eq$$step(rest) {
    const eq = rest.indexOf(' = ');
    return eq;
}
export function inner$parseReportLines$section(REPORT_RE, line) {
    const body = line.replace(REPORT_RE, '');
    const ci = body.indexOf(':');
    const rest = body.slice(ci + 1).trim();
    const eq = rest.indexOf(' = ');
    const section = clean(rest.slice(0, eq)) || rest.slice(0, eq).trim();
    return section;
}
export function inner$parseReportLines$section$$step(rest, eq) {
    const section = clean(rest.slice(0, eq)) || rest.slice(0, eq).trim();
    return section;
}
export function inner$parseReportLines$refs(REPORT_RE, CONTENT_REF, line) {
    const body = line.replace(REPORT_RE, '');
    const ci = body.indexOf(':');
    const rest = body.slice(ci + 1).trim();
    const eq = rest.indexOf(' = ');
    const refs = rest.slice(eq + 3).split(',').map((x) => x.trim()).filter(Boolean).map((raw) => {
        let m;
        if ((m = raw.match(CONTENT_REF)))
            return { raw, kind: 'content', group: clean(m[2]) };
        const di = raw.indexOf('.');
        if (di > 0)
            return { raw, kind: 'child', entity: clean(raw.slice(0, di)), name: clean(raw.slice(di + 1)) };
        return { raw, kind: 'own', name: clean(raw) };
    });
    return refs;
}
export function inner$parseReportLines$refs$$step(CONTENT_REF, rest, eq) {
    const refs = rest.slice(eq + 3).split(',').map((x) => x.trim()).filter(Boolean).map((raw) => {
        let m;
        if ((m = raw.match(CONTENT_REF)))
            return { raw, kind: 'content', group: clean(m[2]) };
        const di = raw.indexOf('.');
        if (di > 0)
            return { raw, kind: 'child', entity: clean(raw.slice(0, di)), name: clean(raw.slice(di + 1)) };
        return { raw, kind: 'own', name: clean(raw) };
    });
    return refs;
}
export function inner$parseReportLines$map$di(raw) {
    const di = raw.indexOf('.');
    return di;
}
export function inner$shapeOf$e(expr) {
    const e = expr.trim();
    return e;
}
export function inner$shapeOf$group(m) {
    const group = clean(m[2]);
    return group;
}
export function inner$shapeOf$items(content, m) {
    const group = clean(m[2]);
    const items = content.filter((c) => c.group === group);
    return items;
}
export function inner$shapeOf$items$$step(content, group) {
    const items = content.filter((c) => c.group === group);
    return items;
}
export function inner$shapeOf$arrow(G) {
    const arrow = new RegExp('\\s*(?:' + G.pairArrow.map((a) => a.replace(/[-]/g, '\\-')).join('|') + ')\\s*');
    return arrow;
}
export function inner$shapeOf$fm(seg) {
    const fm = seg.match(/^(.+?)\s*[×*]\s*(\d+)\s*$/);
    return fm;
}
export function inner$shapeOf$body(seg) {
    const fm = seg.match(/^(.+?)\s*[×*]\s*(\d+)\s*$/);
    const body = fm ? fm[1] : seg;
    return body;
}
export function inner$shapeOf$body$$step(seg, fm) {
    const body = fm ? fm[1] : seg;
    return body;
}
export function inner$shapeOf$factor(seg) {
    const fm = seg.match(/^(.+?)\s*[×*]\s*(\d+)\s*$/);
    const factor = fm ? +fm[2] : 0;
    return factor;
}
export function inner$shapeOf$factor$$step(fm) {
    const factor = fm ? +fm[2] : 0;
    return factor;
}
export function inner$shapeOf$ab(G, seg) {
    const arrow = new RegExp('\\s*(?:' + G.pairArrow.map((a) => a.replace(/[-]/g, '\\-')).join('|') + ')\\s*');
    const fm = seg.match(/^(.+?)\s*[×*]\s*(\d+)\s*$/);
    const body = fm ? fm[1] : seg;
    const ab = body.split(arrow).map((x) => clean(x));
    return ab;
}
export function inner$shapeOf$ab$$step(arrow, body) {
    const ab = body.split(arrow).map((x) => clean(x));
    return ab;
}
export function inner$shapeOf$cm(CONTENT_REF, m) {
    const cm = m[3].trim().match(CONTENT_REF);
    return cm;
}
export function inner$shapeOf$group_L114(CONTENT_REF, m) {
    const cm = m[3].trim().match(CONTENT_REF);
    const group = clean(cm[2]);
    return group;
}
export function inner$shapeOf$group_L114$$step(cm) {
    const group = clean(cm[2]);
    return group;
}
export function inner$shapeOf$items_L114(CONTENT_REF, content, m) {
    const cm = m[3].trim().match(CONTENT_REF);
    const group = clean(cm[2]);
    const items = content.filter((c) => c.group === group);
    return items;
}
export function inner$shapeOf$items_L114$$step(content, group) {
    const items = content.filter((c) => c.group === group);
    return items;
}
export function inner$shapeOf$listed(m) {
    const listed = m[2].split(/[,،]/).map((x) => clean(x)).filter(Boolean);
    return listed;
}
export function inner$wireAtom$t(t0) {
    const t = t0.replace(/\?$/, '');
    return t;
}
export function inner$wireAtom$req(w, name) {
    const req = w.required.has(name) || w.positional.includes(name);
    return req;
}
export function inner$wireAtom$sockets(w) {
    const sockets = [...w.types.keys()].filter((n) => !/^(key|child|children|bare)$/.test(n)).length;
    return sockets;
}
export function inner$rminhuAtom$behav(w0) {
    const behav = [...w0.types.keys()].filter((n) => BEHAV.test(n));
    return behav;
}
export function inner$rminhuAtom$missing(ctx, w0) {
    const missing = [...w0.types].filter(([n]) => w0.required.has(n) || w0.positional.includes(n)).map(([n]) => n).filter((n) => !Object.keys(SOCK).some((s) => SOCK[s].test(n) && ctx[s] != null));
    return missing;
}
export function inner$pickWired$score(w) {
    const score = w.sockets ? w.filled.length / w.sockets : 0;
    return score;
}
export function inner$planParticles$ent(entities, p) {
    const ent = entities.find((e) => e.name === p.entity);
    return ent;
}
export function inner$planParticles$goal(entities, p) {
    const ent = entities.find((e) => e.name === p.entity);
    const goal = `${p.name} ${p.expr} ${ent.name}`;
    return goal;
}
export function inner$planParticles$goal$$step(p, ent) {
    const goal = `${p.name} ${p.expr} ${ent.name}`;
    return goal;
}
export function inner$planParticles$children(entities, p) {
    const ent = entities.find((e) => e.name === p.entity);
    const children = entities.filter((e) => e !== ent && e.schema.some((f) => f.label === ent.name)).map((e) => ({ name: e.name, slug: e.slug, link: ent.name, schema: e.schema }));
    return children;
}
export function inner$planParticles$children$$step(entities, ent) {
    const children = entities.filter((e) => e !== ent && e.schema.some((f) => f.label === ent.name)).map((e) => ({ name: e.name, slug: e.slug, link: ent.name, schema: e.schema }));
    return children;
}
export function inner$messageExpr$phExpr$en(ph) {
    const [en, fl] = ph.split('.').map((x) => x.trim());
    return en;
}
export function inner$messageExpr$phExpr$fl(ph) {
    const [en, fl] = ph.split('.').map((x) => x.trim());
    return fl;
}
export function inner$messageExpr$phExpr$c(p, ph) {
    const [en, fl] = ph.split('.').map((x) => x.trim());
    const c = (p.children || []).find((x) => x.name === en);
    return c;
}
export function inner$messageExpr$phExpr$c$$step(p, en) {
    const c = (p.children || []).find((x) => x.name === en);
    return c;
}
export function inner$messageExpr$tpl$sents(text) {
    const sents = text.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
    return sents;
}
export function inner$messageExpr$def(s) {
    const def = s.items.find((it) => !it.tag);
    return def;
}
export function inner$messageExpr$it(s, v) {
    const it = s.items.find((x) => x.tag === v);
    return it;
}
export function inner$particleWidgets$recs(entity, plan, recsOverride) {
    const recs = recsOverride || (plan.some((p) => p.ok && p.shape && /^(search|filter)$/.test(p.shape.kind)) ? '_rs' : `appStore.records('${entity.slug}')`);
    return recs;
}
export function inner$particleWidgets$firstWired$map$cls(cand) {
    const cls = cand.split('@')[0];
    return cls;
}
export function inner$particleWidgets$agg(s) {
    const agg = /^(count|sum|avg)$/.test(s.kind);
    return agg;
}
export function inner$particleWidgets$kd(p) {
    const kd = p.ops.map((op, i) => [op, p.picks[i]]);
    return kd;
}
export function inner$particleWidgets$val(s, a, b) {
    const val = s.kind === '/' ? `(${b} == 0 ? 0.0 : ${a} / ${b})` : s.kind === '−' ? `(${a} - ${b})` : s.kind === '×' ? `(${a} * ${b})` : `(${a} - ${b})`;
    return val;
}
export function inner$particleWidgets$textish(entity, p) {
    const textish = entity.schema.filter((f) => !f.formula && !(f.enumVals && f.enumVals.length) && !(f.members && f.members.length) && !/^(num|date|bool)$/.test(f.type || '') && !(p.entNames || []).includes(f.label));
    return textish;
}
export function inner$particleWidgets$desc(entity, p) {
    const textish = entity.schema.filter((f) => !f.formula && !(f.enumVals && f.enumVals.length) && !(f.members && f.members.length) && !/^(num|date|bool)$/.test(f.type || '') && !(p.entNames || []).includes(f.label));
    const desc = textish.slice().sort((a, b) => (b.type === 'multiline') - (a.type === 'multiline') || b.label.split(/\s+/).length - a.label.split(/\s+/).length)[0] || entity.schema[0];
    return desc;
}
export function inner$particleWidgets$desc$$step(entity, textish) {
    const desc = textish.slice().sort((a, b) => (b.type === 'multiline') - (a.type === 'multiline') || b.label.split(/\s+/).length - a.label.split(/\s+/).length)[0] || entity.schema[0];
    return desc;
}
export function inner$particleWidgets$map$rowsExpr(row, inBand) {
    const rowsExpr = `for (final r in ${inBand}) ${row.call}`;
    return rowsExpr;
}
export function inner$particleWidgets$yrs(rows) {
    const yrs = rows.filter((r0) => r0.yr).map((r0) => r0.yr);
    return yrs;
}
export function inner$particleWidgets$ef(entity) {
    const ef = entity.schema.find((f) => f.enumVals && f.enumVals.length);
    return ef;
}
export function inner$particleWidgets$nav(entity) {
    const nav = `() => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const ${entity.cls}()))`;
    return nav;
}
export function inner$particleWidgets$linePick(p, s) {
    const kd = p.ops.map((op, i) => [op, p.picks[i]]);
    const linePick = s.tagged ? kd[1][1] : kd[0][1];
    return linePick;
}
export function inner$particleWidgets$linePick$$step(s, kd) {
    const linePick = s.tagged ? kd[1][1] : kd[0][1];
    return linePick;
}
export function inner$particleWidgets$tags(s) {
    const tags = [...new Set(s.items.map((it) => it.tag || ''))];
    return tags;
}
export function inner$particleWidgets$map$mine(s, rows, tag) {
    const mine = s.items.map((it, i) => [it, rows[i]]).filter(([it]) => (it.tag || '') === tag).map(([, w]) => w.call);
    return mine;
}
export function inner$particleWidgets$cls(cand) {
    const cls = cand.split('@')[0];
    return cls;
}
export function inner$particleWidgets$digest(rulings) {
    const digest = rulings.map((r) => `${r.atom}[${r.op}]=${r.verdict}(${r.why})`).join(' · ');
    return digest;
}
export function inner$descFieldOf$textish(entity, p) {
    const textish = entity.schema.filter((f) => !f.formula && !(f.enumVals && f.enumVals.length) && !(f.members && f.members.length) && !/^(num|date|bool)$/.test(f.type || '') && !(p.entNames || []).includes(f.label));
    return textish;
}
export function inner$particleText$recs(entity, plan, recsOverride) {
    const recs = recsOverride || (plan.some((p) => p.ok && p.shape && /^(search|filter)$/.test(p.shape.kind)) ? '_rs' : `appStore.records('${entity.slug}')`);
    return recs;
}
export function inner$particleText$val(s, a, b) {
    const val = s.kind === '/' ? `(${b} == 0 ? 0.0 : ${a} / ${b})` : `(${a} - ${b})`.replace(' - ', s.kind === '×' ? ' * ' : ' - ');
    return val;
}
export function inner$particleText$yrs(rows) {
    const yrs = rows.filter((r0) => r0.yr).map((r0) => r0.yr);
    return yrs;
}
export function inner$particleText$desc(entity, p) {
    const desc = descFieldOf(entity, p);
    return desc;
}
export function inner$particleText$tags(s) {
    const tags = [...new Set(s.items.map((it) => it.tag || ''))];
    return tags;
}
export function inner$renderParticles$cls(slug) {
    const cls = clsOf(slug);
    return cls;
}
export function inner$planReports$root(entities, r) {
    const root = entities.find((e) => e.name === r.entity);
    return root;
}
export function inner$planReports$toks(r) {
    const toks = r.export.goal.split(',').map((x) => x.trim()).filter(Boolean);
    return toks;
}
export function inner$planReports$toField(entities, r) {
    const root = entities.find((e) => e.name === r.entity);
    const toks = r.export.goal.split(',').map((x) => x.trim()).filter(Boolean);
    const toField = toks.map((t) => root.schema.find((f) => f.label === clean(t))).find(Boolean) || null;
    return toField;
}
export function inner$planReports$toField$$step(root, toks) {
    const toField = toks.map((t) => root.schema.find((f) => f.label === clean(t))).find(Boolean) || null;
    return toField;
}
export function inner$planReports$goalWords(entities, r) {
    const root = entities.find((e) => e.name === r.entity);
    const toks = r.export.goal.split(',').map((x) => x.trim()).filter(Boolean);
    const goalWords = toks.filter((t) => !root.schema.some((f) => f.label === clean(t))).join(' ');
    return goalWords;
}
export function inner$planReports$goalWords$$step(root, toks) {
    const goalWords = toks.filter((t) => !root.schema.some((f) => f.label === clean(t))).join(' ');
    return goalWords;
}
export function inner$planReports$cands(link) {
    const cands = [...link.atoms, ...link.alts].map((x) => x.split('@')[0]);
    return cands;
}
export function inner$planReports$map$ent(entities, root, ref) {
    const ent = ref.kind === 'child' ? entities.find((e) => e.name === ref.entity) : root;
    return ent;
}
export function inner$planReports$map$link(entities, root, ref) {
    const ent = ref.kind === 'child' ? entities.find((e) => e.name === ref.entity) : root;
    const link = ref.kind === 'child' ? (ent.schema.find((f) => f.label === root.name) || null) : null;
    return link;
}
export function inner$planReports$map$link$$step(root, ref, ent) {
    const link = ref.kind === 'child' ? (ent.schema.find((f) => f.label === root.name) || null) : null;
    return link;
}
export function inner$planReports$map$existing(plan, entities, root, ref) {
    const ent = ref.kind === 'child' ? entities.find((e) => e.name === ref.entity) : root;
    const existing = plan.find((p) => p.ok && p.entSlug === ent.slug && p.name === ref.name && !(ref.kind === 'own' && p.shape.kind === 'partition'));
    return existing;
}
export function inner$planReports$map$existing$$step(plan, ref, ent) {
    const existing = plan.find((p) => p.ok && p.entSlug === ent.slug && p.name === ref.name && !(ref.kind === 'own' && p.shape.kind === 'partition'));
    return existing;
}
export function inner$planReports$map$field(entities, root, ref) {
    const ent = ref.kind === 'child' ? entities.find((e) => e.name === ref.entity) : root;
    const field = ent.schema.find((f) => f.label === ref.name);
    return field;
}
export function inner$planReports$map$field$$step(ref, ent) {
    const field = ent.schema.find((f) => f.label === ref.name);
    return field;
}
export function inner$renderReport$goal(G, root) {
    const goal = `${G.reportWord} ${root.name}`;
    return goal;
}
export function inner$renderReport$ent(root, ref) {
    const ent = ref.mode === 'content' ? root : ref.ent;
    return ent;
}
export function inner$renderReport$cls(slug) {
    const cls = clsOf(slug);
    return cls;
}
export function inner$renderReport$ex(report) {
    const ex = report.export && report.export.ok ? report.export : null;
    return ex;
}
export function inner$renderReport$textFn(slug, texts) {
    const cls = clsOf(slug);
    const textFn = `
  /// 📤 סריאליזציית-הדוח לטקסט (G25): *חלק* · שורות; נבדקת ב-test/genesis_gen_app_<ns>_report_test.dart
  String reportText${cls}(Map<String, String> r0, String id0) {
    final b = <String>[
  ${texts.map((t) => `    ${t},`).join('\n')}
    ];
    return b.where((s) => s.trim().isNotEmpty).join('\\n');
  }
  `;
    return textFn;
}
export function inner$renderReport$textFn$$step(texts, cls) {
    const textFn = `
  /// 📤 סריאליזציית-הדוח לטקסט (G25): *חלק* · שורות; נבדקת ב-test/genesis_gen_app_<ns>_report_test.dart
  String reportText${cls}(Map<String, String> r0, String id0) {
    final b = <String>[
  ${texts.map((t) => `    ${t},`).join('\n')}
    ];
    return b.where((s) => s.trim().isNotEmpty).join('\\n');
  }
  `;
    return textFn;
}
export function inner$renderReport$shown(visible, sections) {
    const shown = sections.slice(0, visible);
    return shown;
}
export function inner$renderReport$folded(visible, sections) {
    const folded = sections.slice(visible);
    return folded;
}
export function inner$renderReport$bodyRows(visible, sections, foldW) {
    const shown = sections.slice(0, visible);
    const bodyRows = [...shown, ...(foldW ? [foldW] : [])];
    return bodyRows;
}
export function inner$renderReport$bodyRows$$step(shown, foldW) {
    const bodyRows = [...shown, ...(foldW ? [foldW] : [])];
    return bodyRows;
}
export function inner$renderReportTest$rootRec(root) {
    const rootRec = root.schema.filter((f) => !(f.members && f.members.length)).map((f, i) => `${q(f.label)}: ${q(val(f, i))}`).join(', ');
    return rootRec;
}
export function inner$renderReportTest$children(report) {
    const children = [...new Set(report.sections.flatMap((s) => s.refs.filter((x) => x.mode === 'childParticle' && x.ent).map((x) => JSON.stringify([x.ent.slug, x.link]))))].map((j) => JSON.parse(j));
    return children;
}
export function inner$renderReportTest$map$rec(link, e) {
    const rec = e.schema.filter((f) => !(f.members && f.members.length)).map((f, i) => `${q(f.label)}: ${f.label === link ? 'id0' : q(val(f, i))}`).join(', ');
    return rec;
}
export function inner$renderReportTest$expectSections(report) {
    const expectSections = report.sections.map((s) => `  expect(t, contains('*${s.name.replace(/'/g, "\\'")}*'));`).join('\n');
    return expectSections;
}
export function inner$renderReportTest$labelled(report) {
    const labelled = [...new Set(report.sections.flatMap((s) => s.refs.filter((x) => x.mode === 'particle' && x.p && x.p.shape && x.p.shape.kind === 'raw').map((x) => x.p.shape.field)))];
    return labelled;
}
export function inner$renderReportTest$expectFields(report) {
    const labelled = [...new Set(report.sections.flatMap((s) => s.refs.filter((x) => x.mode === 'particle' && x.p && x.p.shape && x.p.shape.kind === 'raw').map((x) => x.p.shape.field)))];
    const expectFields = labelled.map((f) => `  expect(t, contains(${q(f + ': ')}));`).join('\n');
    return expectFields;
}
export function inner$renderReportTest$expectFields$$step(labelled) {
    const expectFields = labelled.map((f) => `  expect(t, contains(${q(f + ': ')}));`).join('\n');
    return expectFields;
}
export function inner$planFor$ents(lines) {
    const ents = lines.filter((l) => /^\s*(צור\s+)?(ישות|טופס|טבלת)(\s|$)/.test(l));
    return ents;
}
export function inner$parseParticleLines$out$$after_loop(PARTICLE_RE, lines) {
    const out = [];
    for (const line of lines) {
        if (!PARTICLE_RE.test(line))
            continue;
        const body = line.replace(PARTICLE_RE, '');
        const ci = body.indexOf(':');
        if (ci < 0)
            continue;
        const entity = clean(body.slice(0, ci));
        let rest = body.slice(ci + 1).trim();
        let name = rest, expr = rest;
        const eq = rest.indexOf(' = ');
        if (eq > 0 && !/^\s*\[/.test(rest)) {
            name = rest.slice(0, eq).trim();
            expr = rest.slice(eq + 3).trim();
        }
        out.push({ entity, name: clean(name) || name, expr, line });
    }
    return out;
}
export function inner$parseContentLines$out$$after_loop(CONTENT_RE, lines) {
    const out = [];
    for (const line of lines) {
        if (!CONTENT_RE.test(line))
            continue;
        const m = line.replace(CONTENT_RE, '').match(/^([^\[:]+?)\s*(?:\[([^\]]+)\])?\s*:\s*(.+)$/);
        if (!m)
            continue;
        out.push({ group: clean(m[1]), tag: m[2] ? clean(m[2]) : null, text: m[3].trim(), line });
    }
    return out;
}
export function inner$parseReportLines$out$$after_loop(REPORT_RE, CONTENT_REF, EXPORT_HEAD, lines) {
    const out = [];
    for (const line of lines) {
        if (!REPORT_RE.test(line))
            continue;
        const body = line.replace(REPORT_RE, '');
        const ci = body.indexOf(':');
        if (ci < 0)
            continue;
        const entity = clean(body.slice(0, ci));
        const rest = body.slice(ci + 1).trim();
        let xm;
        if ((xm = rest.match(EXPORT_HEAD))) { // G25 · ייצוא-הדוח: תווית + מטרה (שדה-יעד + מילים בעברית שמנחות את חיפוש-מנוע-הקישור)
            const eqx = xm[2].indexOf(' = ');
            const label = (eqx > 0 ? xm[2].slice(0, eqx) : xm[2]).trim();
            const goal = eqx > 0 ? xm[2].slice(eqx + 3).trim() : '';
            out.push({ entity, export: { label, goal }, line });
            continue;
        }
        const eq = rest.indexOf(' = ');
        if (eq < 0)
            continue;
        const section = clean(rest.slice(0, eq)) || rest.slice(0, eq).trim();
        const refs = rest.slice(eq + 3).split(',').map((x) => x.trim()).filter(Boolean).map((raw) => {
            let m;
            if ((m = raw.match(CONTENT_REF)))
                return { raw, kind: 'content', group: clean(m[2]) };
            const di = raw.indexOf('.');
            if (di > 0)
                return { raw, kind: 'child', entity: clean(raw.slice(0, di)), name: clean(raw.slice(di + 1)) };
            return { raw, kind: 'own', name: clean(raw) };
        });
        out.push({ entity, section, refs, line });
    }
    return out;
}
export function inner$planReport$md$$after_loop(plan) {
    let md = `# תכנית-חלקיקים (הכרעה-27 · חיפוש-פתוח בכל הקטלוג)\n\n| חלקיק | ישות | צורה | פעולות ⇒ אטומים (חיפוש) | מחווט |\n|---|---|---|---|---|\n`;
    for (const p of plan)
        md += `| ${p.name} | ${p.entity} | ${p.shape ? p.shape.kind : '—'} | ${p.ok ? p.ops.map((o, i) => `${o}⇒${(p.picks[i].atoms[0] || '—').split('@')[0]}${p.picks[i].alts.length ? ` (${p.picks[i].alts.slice(0, 2).map((x) => x.split('@')[0]).join('/')})` : ''}`).join(' · ') : p.why} | ${(p.wired || []).join(' + ') || '—'} |\n`;
    return md;
}

export const SIGS = {
  inner$parseParticleLines$body: [{"name":"PARTICLE_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$ci: [{"name":"PARTICLE_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$ci$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$entity: [{"name":"PARTICLE_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$entity$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$rest: [{"name":"PARTICLE_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$rest$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"num"},"opt":false}],
  inner$parseParticleLines$eq: [{"name":"PARTICLE_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$eq$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$parseContentLines$m: [{"name":"CONTENT_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$body: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$ci: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$ci$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$entity: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$entity$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$rest: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$rest$$step: [{"name":"body","d":{"t":"any"},"opt":false},{"name":"ci","d":{"t":"num"},"opt":false}],
  inner$parseReportLines$eqx: [{"name":"xm","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$label: [{"name":"xm","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$label$$step: [{"name":"xm","d":{"t":"any"},"opt":false},{"name":"eqx","d":{"t":"num"},"opt":false}],
  inner$parseReportLines$goal: [{"name":"xm","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$goal$$step: [{"name":"xm","d":{"t":"any"},"opt":false},{"name":"eqx","d":{"t":"num"},"opt":false}],
  inner$parseReportLines$eq: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$eq$$step: [{"name":"rest","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$section: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$section$$step: [{"name":"rest","d":{"t":"any"},"opt":false},{"name":"eq","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$refs: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"CONTENT_REF","d":{"t":"any"},"opt":false},{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$refs$$step: [{"name":"CONTENT_REF","d":{"t":"any"},"opt":false},{"name":"rest","d":{"t":"any"},"opt":false},{"name":"eq","d":{"t":"num"},"opt":false}],
  inner$parseReportLines$map$di: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$shapeOf$e: [{"name":"expr","d":{"t":"any"},"opt":false}],
  inner$shapeOf$group: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$shapeOf$items: [{"name":"content","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$shapeOf$items$$step: [{"name":"content","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"group","d":{"t":"str"},"opt":false}],
  inner$shapeOf$arrow: [{"name":"G","d":{"t":"any"},"opt":false}],
  inner$shapeOf$fm: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeOf$body: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeOf$body$$step: [{"name":"seg","d":{"t":"any"},"opt":false},{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$shapeOf$factor: [{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeOf$factor$$step: [{"name":"fm","d":{"t":"any"},"opt":false}],
  inner$shapeOf$ab: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"seg","d":{"t":"any"},"opt":false}],
  inner$shapeOf$ab$$step: [{"name":"arrow","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"any"},"opt":false}],
  inner$shapeOf$cm: [{"name":"CONTENT_REF","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$shapeOf$group_L114: [{"name":"CONTENT_REF","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$shapeOf$group_L114$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$shapeOf$items_L114: [{"name":"CONTENT_REF","d":{"t":"any"},"opt":false},{"name":"content","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$shapeOf$items_L114$$step: [{"name":"content","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"group","d":{"t":"str"},"opt":false}],
  inner$shapeOf$listed: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$wireAtom$t: [{"name":"t0","d":{"t":"any"},"opt":false}],
  inner$wireAtom$req: [{"name":"w","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$wireAtom$sockets: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$rminhuAtom$behav: [{"name":"w0","d":{"t":"any"},"opt":false}],
  inner$rminhuAtom$missing: [{"name":"ctx","d":{"t":"any"},"opt":false},{"name":"w0","d":{"t":"any"},"opt":false}],
  inner$pickWired$score: [{"name":"w","d":{"t":"any"},"opt":false}],
  inner$planParticles$ent: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$planParticles$goal: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$planParticles$goal$$step: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$planParticles$children: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$planParticles$children$$step: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$messageExpr$phExpr$en: [{"name":"ph","d":{"t":"any"},"opt":false}],
  inner$messageExpr$phExpr$fl: [{"name":"ph","d":{"t":"any"},"opt":false}],
  inner$messageExpr$phExpr$c: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"ph","d":{"t":"any"},"opt":false}],
  inner$messageExpr$phExpr$c$$step: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"en","d":{"t":"any"},"opt":false}],
  inner$messageExpr$tpl$sents: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$messageExpr$def: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$messageExpr$it: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"v","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$recs: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"plan","d":{"t":"any"},"opt":false},{"name":"recsOverride","d":{"t":"null"},"opt":false}],
  inner$particleWidgets$firstWired$map$cls: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$agg: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$kd: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$val: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"str"},"opt":false},{"name":"b","d":{"t":"str"},"opt":false}],
  inner$particleWidgets$textish: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$desc: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$desc$$step: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"textish","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$map$rowsExpr: [{"name":"row","d":{"t":"any"},"opt":false},{"name":"inBand","d":{"t":"str"},"opt":false}],
  inner$particleWidgets$yrs: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$ef: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$nav: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$linePick: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$linePick$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"kd","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$tags: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$map$mine: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"any"},"opt":false},{"name":"tag","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$cls: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$particleWidgets$digest: [{"name":"rulings","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$descFieldOf$textish: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$particleText$recs: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"plan","d":{"t":"any"},"opt":false},{"name":"recsOverride","d":{"t":"null"},"opt":false}],
  inner$particleText$val: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"str"},"opt":false},{"name":"b","d":{"t":"str"},"opt":false}],
  inner$particleText$yrs: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$particleText$desc: [{"name":"entity","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$particleText$tags: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderParticles$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$planReports$root: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$planReports$toks: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$planReports$toField: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$planReports$toField$$step: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"toks","d":{"t":"any"},"opt":false}],
  inner$planReports$goalWords: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$planReports$goalWords$$step: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"toks","d":{"t":"any"},"opt":false}],
  inner$planReports$cands: [{"name":"link","d":{"t":"or","of":[{"t":"obj","p":[["op",{"t":"any"},false],["fam",{"t":"any"},false],["logic",{"t":"bool"},false],["atoms",{"t":"any"},false],["alts",{"t":"any"},false],["missing",{"t":"undef"},true]]},{"t":"obj","p":[["op",{"t":"any"},false],["fam",{"t":"any"},false],["logic",{"t":"bool"},false],["atoms",{"t":"any"},false],["alts",{"t":"any"},false],["missing",{"t":"or","of":[{"t":"arr","of":{"t":"any"}},{"t":"arr","of":{"t":"str"}}]},false]]}]},"opt":false}],
  inner$planReports$map$ent: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false}],
  inner$planReports$map$link: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false}],
  inner$planReports$map$link$$step: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$planReports$map$existing: [{"name":"plan","d":{"t":"any"},"opt":false},{"name":"entities","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false}],
  inner$planReports$map$existing$$step: [{"name":"plan","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$planReports$map$field: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false}],
  inner$planReports$map$field$$step: [{"name":"ref","d":{"t":"any"},"opt":false},{"name":"ent","d":{"t":"any"},"opt":false}],
  inner$renderReport$goal: [{"name":"G","d":{"t":"any"},"opt":false},{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderReport$ent: [{"name":"root","d":{"t":"any"},"opt":false},{"name":"ref","d":{"t":"any"},"opt":false}],
  inner$renderReport$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderReport$ex: [{"name":"report","d":{"t":"any"},"opt":false}],
  inner$renderReport$textFn: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"texts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderReport$textFn$$step: [{"name":"texts","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false}],
  inner$renderReport$shown: [{"name":"visible","d":{"t":"num"},"opt":false},{"name":"sections","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderReport$folded: [{"name":"visible","d":{"t":"num"},"opt":false},{"name":"sections","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderReport$bodyRows: [{"name":"visible","d":{"t":"num"},"opt":false},{"name":"sections","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"foldW","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$renderReport$bodyRows$$step: [{"name":"shown","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"foldW","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$renderReportTest$rootRec: [{"name":"root","d":{"t":"any"},"opt":false}],
  inner$renderReportTest$children: [{"name":"report","d":{"t":"any"},"opt":false}],
  inner$renderReportTest$map$rec: [{"name":"link","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$renderReportTest$expectSections: [{"name":"report","d":{"t":"any"},"opt":false}],
  inner$renderReportTest$labelled: [{"name":"report","d":{"t":"any"},"opt":false}],
  inner$renderReportTest$expectFields: [{"name":"report","d":{"t":"any"},"opt":false}],
  inner$renderReportTest$expectFields$$step: [{"name":"labelled","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$planFor$ents: [{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$parseParticleLines$out$$after_loop: [{"name":"PARTICLE_RE","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$parseContentLines$out$$after_loop: [{"name":"CONTENT_RE","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$parseReportLines$out$$after_loop: [{"name":"REPORT_RE","d":{"t":"any"},"opt":false},{"name":"CONTENT_REF","d":{"t":"any"},"opt":false},{"name":"EXPORT_HEAD","d":{"t":"any"},"opt":false},{"name":"lines","d":{"t":"any"},"opt":false}],
  inner$planReport$md$$after_loop: [{"name":"plan","d":{"t":"any"},"opt":false}],
};
