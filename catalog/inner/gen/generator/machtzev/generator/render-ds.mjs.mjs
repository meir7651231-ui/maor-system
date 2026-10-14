// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/render-ds.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const pascal = (slug) => 'GenApp' + slug.replace(/^app_/, '').replace(/(^|[_-])([a-z0-9])/g, (_, __, c) => c.toUpperCase()) + 'Screen';
const heWords = (s) => [...String(s || '').matchAll(/[֐-׿]{2,}/g)].map((m) => m[0]);
const prefixMatch = (a, b) => { let n = 0; const m = Math.min(a.length, b.length); while (n < m && a[n] === b[n])
    n++; return n >= 3 && n >= 0.7 * m; };
const injectHelper = (ty) => {
    const t = (ty || '').replace(/\s+/g, ' ').trim();
    if (/^String Function\(\s*String\s*\)$/.test(t))
        return '(s) => s';
    if (/^DateTime Function\(\s*String\s*\)$/.test(t))
        return "(s) => DateTime.tryParse(s.length == 10 ? s + 'T12:00:00' : s) ?? DateTime.now()";
    return null;
};
const sigParamTypes = (sig) => {
    const m = (sig || '').match(/\(([\s\S]*)\)/);
    if (!m)
        return [];
    const s = m[1];
    const out = [];
    let d = 0, cur = '';
    for (const ch of s.replace(/[{}\[\]]/g, ' ')) {
        if ('<(['.includes(ch))
            d++;
        else if ('>)]'.includes(ch))
            d--;
        if (ch === ',' && d === 0) {
            out.push(cur.trim());
            cur = '';
        }
        else
            cur += ch;
    }
    if (cur.trim())
        out.push(cur.trim());
    return out.map((p) => { const mm = p.replace(/\brequired\b/g, '').trim().match(/^([\s\S]+?)\s+[a-z_]\w*(\s*=[\s\S]*)?$/); return (mm ? mm[1] : p).trim(); });
};
function pickRelation(label, selfName, entityNames) {
    const fw = new Set(heWords(label));
    for (const en of entityNames) {
        if (en === selfName)
            continue;
        const ew = heWords(en);
        if (ew.length && ew.every((w) => fw.has(w)))
            return en;
    }
    return null;
}
const definal = (w) => w.replace(/ך$/, 'כ').replace(/ם$/, 'מ').replace(/ן$/, 'נ').replace(/ף$/, 'פ').replace(/ץ$/, 'צ');
function pluralForms(en) {
    const b = definal(en.replace(/ה$/, ''));
    const b2 = definal(en);
    return new Set([`${b}ים`, `${b}ות`, `${b2}ים`, `${b2}ות`]);
}
function pickMultiRelation(label, selfName, entityNames) {
    const fw = new Set(heWords(label));
    for (const en of entityNames) {
        if (en === selfName)
            continue;
        if (heWords(en).length !== 1)
            continue; // ריבוי רק לישויות חד-מיליות
        const forms = pluralForms(en);
        for (const w of fw)
            if (forms.has(w))
                return en;
    }
    return null;
}
const _fillStyle = (ty) => {
    const t = (ty || '').replace(/\?$/, '');
    const cb = _cb(t);
    if (cb)
        return cb;
    if (t === 'Color')
        return 'DsIdentity.propFallback';
    if (t === 'IconData')
        return 'Icons.circle';
    if (t === 'Widget')
        return 'const SizedBox.shrink()';
    if (t === 'List<Widget>')
        return 'const <Widget>[]';
    if (/^[A-Z][A-Za-z0-9]*Tokens$/.test(t))
        return `const ${t}()`;
    return ty && ty.endsWith('?') ? 'null' : null;
};
const _cb = (t) => t === 'VoidCallback' ? '() {}' : /^(ValueChanged|ValueSetter)</.test(t) ? '(_) {}' : null;
const _itemField = (ty, nm) => {
    const t = ty.replace(/\?$/, '');
    const cb = _cb(t);
    if (cb)
        return cb;
    if (t === 'String')
        return /^(ic|icon|glyph)$/.test(nm) ? "'\u{1F5C2}\u{FE0F}'" : "''";
    if (t === 'int' || t === 'double' || t === 'num')
        return '0';
    if (t === 'bool')
        return 'false';
    if (t === 'Color')
        return 'DsIdentity.propFallback';
    if (t === 'IconData')
        return 'Icons.circle';
    return null;
};
const _scalarFill = (ty, nm) => {
    const t = ty.replace(/\?$/, '');
    const cb = _cb(t);
    if (cb)
        return cb;
    if (t === 'String')
        return "''";
    if (t === 'int' || t === 'double' || t === 'num')
        return '0';
    if (t === 'bool')
        return 'false';
    if (t === 'Color')
        return 'DsIdentity.propFallback';
    if (t === 'IconData')
        return 'Icons.circle';
    if (t === 'Widget')
        return 'const SizedBox.shrink()';
    return ty.endsWith('?') ? 'null' : null;
};
export function inner$prefixMatch$m(a, b) {
    const m = Math.min(a.length, b.length);
    return m;
}
export function inner$requiredArity$o(sig) {
    const o = sig.indexOf('(');
    return o;
}
export function inner$requiredArity$i(sig) {
    const o = sig.indexOf('(');
    let i = o + 1;
    return i;
}
export function inner$requiredArity$i$$step(o) {
    let i = o + 1;
    return i;
}
export function inner$map$hw(f) {
    const hw = (f.he || []).filter((w) => w.length >= 2);
    return hw;
}
export function inner$injectHelper$t(ty) {
    const t = (ty || '').replace(/\s+/g, ' ').trim();
    return t;
}
export function inner$sigParamTypes$m(sig) {
    const m = (sig || '').match(/\(([\s\S]*)\)/);
    return m;
}
export function inner$sigParamTypes$map$mm(p) {
    const mm = p.replace(/\brequired\b/g, '').trim().match(/^([\s\S]+?)\s+[a-z_]\w*(\s*=[\s\S]*)?$/);
    return mm;
}
export function inner$filter$ps(f) {
    const ps = sigParamTypes(f.sig);
    return ps;
}
export function inner$pickXform$fw(label) {
    const fw = heWords(label).filter((w) => w.length >= 2);
    return fw;
}
export function inner$makeConsts$k$name(slug, consts) {
    const name = `gen_${slug}_c${consts.length}`;
    return name;
}
export function inner$write$filter$m(l) {
    const m = l.match(/^import\s+'([^']+)'/);
    return m;
}
export function inner$pickRelation$fw(label) {
    const fw = new Set(heWords(label));
    return fw;
}
export function inner$pickRelation$ew(en) {
    const ew = heWords(en);
    return ew;
}
export function inner$pluralForms$b(en) {
    const b = definal(en.replace(/ה$/, ''));
    return b;
}
export function inner$pluralForms$b2(en) {
    const b2 = definal(en);
    return b2;
}
export function inner$pickMultiRelation$fw(label) {
    const fw = new Set(heWords(label));
    return fw;
}
export function inner$pickMultiRelation$forms(en) {
    const forms = pluralForms(en);
    return forms;
}
export function inner$compileFormula$sorted(labels) {
    const sorted = labels.slice().sort((a, b) => b.label.length - a.label.length);
    return sorted;
}
export function inner$compileFormula$f0(formula) {
    let f0 = String(formula);
    return f0;
}
export function inner$compileFormula$at(f0, L) {
    let at = f0.indexOf(L.fnAbs + '(');
    return at;
}
export function inner$compileFormula$j(at, L) {
    let j = at + L.fnAbs.length;
    return j;
}
export function inner$compileFormula$e(f0) {
    let e = ' ' + f0 + ' ';
    return e;
}
export function inner$compileFormula$residue(labels, f0) {
    const sorted = labels.slice().sort((a, b) => b.label.length - a.label.length);
    let e = ' ' + f0 + ' ';
    for (const f of sorted)
        e = e.split(f.label).join(` @${f.idx}@ `);
    const residue = e.replace(/@\d+@/g, ' ').replace(/\.abs\(\)/g, ' ').replace(/[0-9.+\-*/()\s]/g, '');
    return residue;
}
export function inner$compileFormula$residue$$step(e) {
    const residue = e.replace(/@\d+@/g, ' ').replace(/\.abs\(\)/g, ' ').replace(/[0-9.+\-*/()\s]/g, '');
    return residue;
}
export function inner$compileFormula$dart(labels, f0) {
    const sorted = labels.slice().sort((a, b) => b.label.length - a.label.length);
    let e = ' ' + f0 + ' ';
    for (const f of sorted)
        e = e.split(f.label).join(` @${f.idx}@ `);
    const dart = e.replace(/@(\d+)@/g, "(num.tryParse(_v[$1] ?? '') ?? 0)").trim();
    return dart;
}
export function inner$compileFormula$dart$$step(e) {
    const dart = e.replace(/@(\d+)@/g, "(num.tryParse(_v[$1] ?? '') ?? 0)").trim();
    return dart;
}
export function inner$compileRule$m(rule) {
    const m = rule.match(/^(.+?)\s*(>=|<=|>|<)\s*(.+)$/);
    return m;
}
export function inner$compileRule$find$c(labels, name) {
    const c = labels.find((l) => l.label === name.trim());
    return c;
}
export function inner$compileGuard$find$c(labels, name) {
    const c = labels.find((l) => l.label === name.trim());
    return c;
}
export function inner$compileGuard$m(cond) {
    const m = cond.match(/^(.+?)\s*(>=|<=|>|<)\s*(.+)$/);
    return m;
}
export function inner$compileGuard$rlit(cond) {
    const m = cond.match(/^(.+?)\s*(>=|<=|>|<)\s*(.+)$/);
    const rlit = m[3].trim();
    return rlit;
}
export function inner$compileGuard$rlit$$step(m) {
    const rlit = m[3].trim();
    return rlit;
}
export function inner$compileCond$m(formula) {
    const m = formula.match(/^(.+?)\s*\?\s*([^?:]+?)\s*:\s*([^?:]+)$/);
    return m;
}
export function inner$renderEntity$SK(slug) {
    const SK = `'${slug}'`;
    return SK;
}
export function inner$renderEntity$labelIdx(schema) {
    const labelIdx = schema.map((s, i) => ({ label: s.label, idx: i }));
    return labelIdx;
}
export function inner$renderEntity$sigIdx(schema, L) {
    const sigIdx = schema.findIndex((s) => String(s.label).split(/\s+/).some((w) => (L.signWords || []).includes(w)));
    return sigIdx;
}
export function inner$renderEntity$sigOver(schema, L) {
    const sigIdx = schema.findIndex((s) => String(s.label).split(/\s+/).some((w) => (L.signWords || []).includes(w)));
    const sigOver = sigIdx < 0 ? [] : schema.map((s, i) => i).filter((i) => i !== sigIdx && !schema[i].formula && !schema[i].members);
    return sigOver;
}
export function inner$renderEntity$sigOver$$step(schema, sigIdx) {
    const sigOver = sigIdx < 0 ? [] : schema.map((s, i) => i).filter((i) => i !== sigIdx && !schema[i].formula && !schema[i].members);
    return sigOver;
}
export function inner$renderEntity$forEach$bind(i) {
    const bind = `value: _v[${i}] ?? '', onChanged: (v) => setState(() => _v[${i}] = v)`;
    return bind;
}
export function inner$renderEntity$forEach$rm(ROLLUP_RE, s) {
    const rm = s.formula.match(ROLLUP_RE);
    return rm;
}
export function inner$renderEntity$forEach$link(ROLLUP_RE, backRefs, s) {
    const rm = s.formula.match(ROLLUP_RE);
    const link = backRefs.find((b) => b.fname === rm[2].trim());
    return link;
}
export function inner$renderEntity$forEach$link$$step(backRefs, rm) {
    const link = backRefs.find((b) => b.fname === rm[2].trim());
    return link;
}
export function inner$renderEntity$forEach$em(s) {
    const em = s.formula.trim().match(/^([a-zA-Z_]\w*)\s*(?:\(([^)]*)\))?$/);
    return em;
}
export function inner$renderEntity$forEach$helpers(f) {
    const helpers = (f.ptypes || []).slice(1).map((t) => injectHelper(t));
    return helpers;
}
export function inner$renderEntity$forEach$hz(f) {
    const helpers = (f.ptypes || []).slice(1).map((t) => injectHelper(t));
    const hz = helpers.length ? ', ' + helpers.join(', ') : '';
    return hz;
}
export function inner$renderEntity$forEach$hz$$step(helpers) {
    const hz = helpers.length ? ', ' + helpers.join(', ') : '';
    return hz;
}
export function inner$renderEntity$forEach$maps(labelIdx, s) {
    const em = s.formula.trim().match(/^([a-zA-Z_]\w*)\s*(?:\(([^)]*)\))?$/);
    const maps = (em[2] || '').split(',').map((x) => x.trim()).filter(Boolean)
        .map((p) => p.split(/→|->/).map((y) => y.trim()))
        .filter((pair) => pair.length === 2 && labelIdx.some((l) => l.label === pair[0]))
        .map(([fld, key]) => ({ idx: labelIdx.find((l) => l.label === fld).idx, key }));
    return maps;
}
export function inner$renderEntity$forEach$maps$$step(labelIdx, em) {
    const maps = (em[2] || '').split(',').map((x) => x.trim()).filter(Boolean)
        .map((p) => p.split(/→|->/).map((y) => y.trim()))
        .filter((pair) => pair.length === 2 && labelIdx.some((l) => l.label === pair[0]))
        .map(([fld, key]) => ({ idx: labelIdx.find((l) => l.label === fld).idx, key }));
    return maps;
}
export function inner$renderEntity$forEach$subLines(subs) {
    const subLines = subs.map((x) => `            DsField(label: ${x.mk}, hint: '', value: _v[${x.si}] ?? '', onChanged: (v) => setState(() => _v[${x.si}] = v)),`).join('\n');
    return subLines;
}
export function inner$renderEntity$forEach$rel(name, entityNames, s) {
    const rel = pickRelation(s.label, name, entityNames);
    return rel;
}
export function inner$renderEntity$forEach$tslug(name, entityNames, nameToSlug, s) {
    const rel = pickRelation(s.label, name, entityNames);
    const tslug = rel ? (nameToSlug[rel] || null) : null;
    return tslug;
}
export function inner$renderEntity$forEach$tslug$$step(nameToSlug, rel) {
    const tslug = rel ? (nameToSlug[rel] || null) : null;
    return tslug;
}
export function inner$renderEntity$forEach$mrel(name, entityNames, s) {
    const mrel = pickMultiRelation(s.label, name, entityNames);
    return mrel;
}
export function inner$renderEntity$forEach$mslug(name, entityNames, nameToSlug, s) {
    const mrel = pickMultiRelation(s.label, name, entityNames);
    const mslug = mrel ? (nameToSlug[mrel] || null) : null;
    return mslug;
}
export function inner$renderEntity$forEach$mslug$$step(nameToSlug, mrel) {
    const mslug = mrel ? (nameToSlug[mrel] || null) : null;
    return mslug;
}
export function inner$renderEntity$forEach$nt(xf) {
    const nt = xf.inType.replace(/\?$/, '');
    return nt;
}
export function inner$renderEntity$forEach$arg(i, xf) {
    const nt = xf.inType.replace(/\?$/, '');
    const arg = nt === 'int' ? `(int.tryParse(_v[${i}] ?? '') ?? 0)`
        : nt === 'double' ? `(double.tryParse(_v[${i}] ?? '') ?? 0)`
            : nt === 'num' ? `(num.tryParse(_v[${i}] ?? '') ?? 0)`
                : `(_v[${i}] ?? '')`;
    return arg;
}
export function inner$renderEntity$forEach$arg$$step(i, nt) {
    const arg = nt === 'int' ? `(int.tryParse(_v[${i}] ?? '') ?? 0)`
        : nt === 'double' ? `(double.tryParse(_v[${i}] ?? '') ?? 0)`
            : nt === 'num' ? `(num.tryParse(_v[${i}] ?? '') ?? 0)`
                : `(_v[${i}] ?? '')`;
    return arg;
}
export function inner$renderEntity$forEach$call(i, xf) {
    const nt = xf.inType.replace(/\?$/, '');
    const arg = nt === 'int' ? `(int.tryParse(_v[${i}] ?? '') ?? 0)`
        : nt === 'double' ? `(double.tryParse(_v[${i}] ?? '') ?? 0)`
            : nt === 'num' ? `(num.tryParse(_v[${i}] ?? '') ?? 0)`
                : `(_v[${i}] ?? '')`;
    const call = `${xf.name}(${arg})`;
    return call;
}
export function inner$renderEntity$forEach$call$$step(xf, arg) {
    const call = `${xf.name}(${arg})`;
    return call;
}
export function inner$renderEntity$reqChecks(labelConst, requiredIdx, L) {
    const reqChecks = requiredIdx.map((i) => `if ((_v[${i}] ?? '').trim().isEmpty) miss.add('${L.missPrefix}' + ${labelConst[i]});`).join('\n      ');
    return reqChecks;
}
export function inner$renderEntity$uniqChecks(slug, labelConst, uniqueIdx, L) {
    const SK = `'${slug}'`;
    const uniqChecks = uniqueIdx.map((i) => `{ final v = (_v[${i}] ?? '').trim(); if (v.isNotEmpty && appStore.records(${SK}).any((r) => r['__id'] != _editId && (r[${labelConst[i]}] ?? '') == v)) miss.add('${L.dupPrefix}' + ${labelConst[i]}); }`).join('\n      ');
    return uniqChecks;
}
export function inner$renderEntity$uniqChecks$$step(SK, labelConst, uniqueIdx, L) {
    const uniqChecks = uniqueIdx.map((i) => `{ final v = (_v[${i}] ?? '').trim(); if (v.isNotEmpty && appStore.records(${SK}).any((r) => r['__id'] != _editId && (r[${labelConst[i]}] ?? '') == v)) miss.add('${L.dupPrefix}' + ${labelConst[i]}); }`).join('\n      ');
    return uniqChecks;
}
export function inner$renderEntity$map$bound(r) {
    const bound = r.min !== null && r.max !== null ? ` (${r.min}–${r.max})` : r.min !== null ? ` (≥${r.min})` : ` (≤${r.max})`;
    return bound;
}
export function inner$renderEntity$validPatterns(patternSpecs) {
    const validPatterns = patternSpecs.filter((p) => { try {
        new RegExp(p.pattern);
        return true;
    }
    catch {
        return false;
    } });
    return validPatterns;
}
export function inner$renderEntity$hasVal(requiredIdx, uniqueIdx, rangeSpecs, patternSpecs, ruleSpecs) {
    const validPatterns = patternSpecs.filter((p) => { try {
        new RegExp(p.pattern);
        return true;
    }
    catch {
        return false;
    } });
    const hasVal = requiredIdx.length + uniqueIdx.length + ruleSpecs.length + rangeSpecs.length + validPatterns.length > 0;
    return hasVal;
}
export function inner$renderEntity$hasVal$$step(requiredIdx, uniqueIdx, rangeSpecs, ruleSpecs, validPatterns) {
    const hasVal = requiredIdx.length + uniqueIdx.length + ruleSpecs.length + rangeSpecs.length + validPatterns.length > 0;
    return hasVal;
}
export function inner$renderEntity$defInit(defEntries) {
    const defInit = defEntries.length ? `{${defEntries.join(', ')}}` : '{}';
    return defInit;
}
export function inner$renderEntity$enumImport(hasEnum) {
    const enumImport = hasEnum ? "import '../dart-ui-bs/ds/ds_enum_field.dart';\n" : '';
    return enumImport;
}
export function inner$renderEntity$hasStages(stages) {
    const hasStages = stages.length >= 2;
    return hasStages;
}
export function inner$renderEntity$stageList(stageConsts) {
    const stageList = `[${stageConsts.join(', ')}]`;
    return stageList;
}
export function inner$renderEntity$stepsDart(stages, stageConsts) {
    const hasStages = stages.length >= 2;
    const stageList = `[${stageConsts.join(', ')}]`;
    const stepsDart = hasStages
        ? `        DsWorkflow(steps: const ${stageList}, current: 0),\n`
        : '';
    return stepsDart;
}
export function inner$renderEntity$stepsDart$$step(hasStages, stageList) {
    const stepsDart = hasStages
        ? `        DsWorkflow(steps: const ${stageList}, current: 0),\n`
        : '';
    return stepsDart;
}
export function inner$renderEntity$mapEntries(mapVals) {
    const mapEntries = mapVals.join(', ');
    return mapEntries;
}
export function inner$renderEntity$editLoad(labelConst, subEditLoad) {
    const editLoad = [...labelConst.map((cl, i) => `${i}: r[${cl}] ?? ''`), ...subEditLoad].join(', ');
    return editLoad;
}
export function inner$renderEntity$recValues(recValsR) {
    const recValues = recValsR.join(', ');
    return recValues;
}
export function inner$renderEntity$labelsList(labelConst) {
    const labelsList = labelConst.join(', ');
    return labelsList;
}
export function inner$renderEntity$backFooter(backRefs, backChips, sigBtn) {
    const backFooter = backRefs.length ? `, footer: Wrap(spacing: 6, runSpacing: 6, children: [${backChips}${sigBtn ? ', ' + sigBtn : ''}])` : sigBtn ? `, footer: ${sigBtn}` : '';
    return backFooter;
}
export function inner$renderEntity$refCount(slug) {
    const SK = `'${slug}'`;
    const refCount = `appStore.inboundRefs(${SK}, rid)`;
    return refCount;
}
export function inner$renderEntity$refCount$$step(SK) {
    const refCount = `appStore.inboundRefs(${SK}, rid)`;
    return refCount;
}
export function inner$renderEntity$map$t(stages, g) {
    const t = stages.indexOf(g.stage);
    return t;
}
export function inner$renderEntity$hasGuards(guardSpecs) {
    const hasGuards = guardSpecs.length > 0;
    return hasGuards;
}
export function inner$renderEntity$onStageBody(slug, guardSpecs, L) {
    const SK = `'${slug}'`;
    const hasGuards = guardSpecs.length > 0;
    const onStageBody = hasGuards
        ? `(i) { if (i > appStore.stageOf(${SK}, rid)) { final g = _guard(i, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } } appStore.setStage(${SK}, rid, i); }`
        : `(i) => appStore.setStage(${SK}, rid, i)`;
    return onStageBody;
}
export function inner$renderEntity$onStageBody$$step(SK, hasGuards, L) {
    const onStageBody = hasGuards
        ? `(i) { if (i > appStore.stageOf(${SK}, rid)) { final g = _guard(i, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } } appStore.setStage(${SK}, rid, i); }`
        : `(i) => appStore.setStage(${SK}, rid, i)`;
    return onStageBody;
}
export function inner$renderEntity$onAdvBody(slug, stages, guardSpecs, L) {
    const SK = `'${slug}'`;
    const hasGuards = guardSpecs.length > 0;
    const onAdvBody = hasGuards
        ? `() { final g = _guard(appStore.stageOf(${SK}, rid) + 1, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } appStore.advance(${SK}, rid, ${stages.length}); }`
        : `() => appStore.advance(${SK}, rid, ${stages.length})`;
    return onAdvBody;
}
export function inner$renderEntity$onAdvBody$$step(stages, SK, hasGuards, L) {
    const onAdvBody = hasGuards
        ? `() { final g = _guard(appStore.stageOf(${SK}, rid) + 1, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } appStore.advance(${SK}, rid, ${stages.length}); }`
        : `() => appStore.advance(${SK}, rid, ${stages.length})`;
    return onAdvBody;
}
export function inner$renderEntity$stageArgs(slug, stages, stageConsts, guardSpecs, L) {
    const SK = `'${slug}'`;
    const hasStages = stages.length >= 2;
    const stageList = `[${stageConsts.join(', ')}]`;
    const hasGuards = guardSpecs.length > 0;
    const onStageBody = hasGuards
        ? `(i) { if (i > appStore.stageOf(${SK}, rid)) { final g = _guard(i, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } } appStore.setStage(${SK}, rid, i); }`
        : `(i) => appStore.setStage(${SK}, rid, i)`;
    const onAdvBody = hasGuards
        ? `() { final g = _guard(appStore.stageOf(${SK}, rid) + 1, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } appStore.advance(${SK}, rid, ${stages.length}); }`
        : `() => appStore.advance(${SK}, rid, ${stages.length})`;
    const stageArgs = hasStages
        ? `stage: (const ${stageList})[appStore.stageOf(${SK}, rid)], stageDone: appStore.stageOf(${SK}, rid) >= ${stages.length - 1}, stages: const ${stageList}, stageIndex: appStore.stageOf(${SK}, rid), onStage: ${onStageBody}, onAdvance: ${onAdvBody}, `
        : '';
    return stageArgs;
}
export function inner$renderEntity$stageArgs$$step(stages, SK, hasStages, stageList, onStageBody, onAdvBody) {
    const stageArgs = hasStages
        ? `stage: (const ${stageList})[appStore.stageOf(${SK}, rid)], stageDone: appStore.stageOf(${SK}, rid) >= ${stages.length - 1}, stages: const ${stageList}, stageIndex: appStore.stageOf(${SK}, rid), onStage: ${onStageBody}, onAdvance: ${onAdvBody}, `
        : '';
    return stageArgs;
}
export function inner$renderEntity$nRoles(authz) {
    const nRoles = authz ? authz.scope.length : 0;
    return nRoles;
}
export function inner$renderEntity$hasScope(authz) {
    const hasScope = !!(authz && authz.scope.some((f) => f));
    return hasScope;
}
export function inner$renderEntity$hasHide(authz) {
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    return hasHide;
}
export function inner$renderEntity$hasRO(authz) {
    const hasRO = !!(authz && authz.readonly && authz.readonly.some((h) => h.length));
    return hasRO;
}
export function inner$renderEntity$roTable(authz) {
    const hasRO = !!(authz && authz.readonly && authz.readonly.some((h) => h.length));
    const roTable = hasRO ? `\n  static const List<List<int>> _rlsRO = [${authz.readonly.map((h) => `[${h.join(', ')}]`).join(', ')}];` : '';
    return roTable;
}
export function inner$renderEntity$roTable$$step(authz, hasRO) {
    const roTable = hasRO ? `\n  static const List<List<int>> _rlsRO = [${authz.readonly.map((h) => `[${h.join(', ')}]`).join(', ')}];` : '';
    return roTable;
}
export function inner$renderEntity$hiddenSetGetter(authz) {
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const rlsActive = hasScope || hasHide;
    const hiddenSetGetter = rlsActive ? `\n  Set<int> get _rlsHiddenSet => _rlsHidden[_rlsRole].toSet();` : '';
    return hiddenSetGetter;
}
export function inner$renderEntity$hiddenSetGetter$$step(rlsActive) {
    const hiddenSetGetter = rlsActive ? `\n  Set<int> get _rlsHiddenSet => _rlsHidden[_rlsRole].toSet();` : '';
    return hiddenSetGetter;
}
export function inner$renderEntity$rlsFields(authz, scopeTable, hiddenTable) {
    const nRoles = authz ? authz.scope.length : 0;
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const hasRO = !!(authz && authz.readonly && authz.readonly.some((h) => h.length));
    const rlsActive = hasScope || hasHide;
    const rlsTables = rlsActive || hasRO;
    const roTable = hasRO ? `\n  static const List<List<int>> _rlsRO = [${authz.readonly.map((h) => `[${h.join(', ')}]`).join(', ')}];` : '';
    const hiddenSetGetter = rlsActive ? `\n  Set<int> get _rlsHiddenSet => _rlsHidden[_rlsRole].toSet();` : '';
    const rlsFields = rlsTables
        ? `${scopeTable}${hiddenTable}${roTable}\n  int get _rlsRole => appStore.role.clamp(0, ${Math.max(0, nRoles - 1)});${hiddenSetGetter}\n`
        : '';
    return rlsFields;
}
export function inner$renderEntity$rlsFields$$step(nRoles, rlsTables, scopeTable, hiddenTable, roTable, hiddenSetGetter) {
    const rlsFields = rlsTables
        ? `${scopeTable}${hiddenTable}${roTable}\n  int get _rlsRole => appStore.role.clamp(0, ${Math.max(0, nRoles - 1)});${hiddenSetGetter}\n`
        : '';
    return rlsFields;
}
export function inner$renderEntity$fieldsPlain(fieldBlocks) {
    const fieldsPlain = fieldBlocks.map((fb) => fb.cond ? `          if (${fb.cond}) ${fb.expr},` : `          ${fb.expr},`).join('\n');
    return fieldsPlain;
}
export function inner$renderEntity$fieldsGated(authz, fieldBlocks) {
    const hasRO = !!(authz && authz.readonly && authz.readonly.some((h) => h.length));
    const fieldsGated = fieldBlocks.map((fb) => {
        const hideG = `!_rlsHidden[_rlsRole].contains(${fb.i})`;
        const inner = hasRO ? `AbsorbPointer(absorbing: _rlsRO[_rlsRole].contains(${fb.i}), child: ${fb.expr})` : fb.expr;
        const cond = fb.cond ? `${hideG} && (${fb.cond})` : hideG;
        return `          if (${cond}) ${inner},`;
    }).join('\n');
    return fieldsGated;
}
export function inner$renderEntity$fieldsGated$$step(fieldBlocks, hasRO) {
    const fieldsGated = fieldBlocks.map((fb) => {
        const hideG = `!_rlsHidden[_rlsRole].contains(${fb.i})`;
        const inner = hasRO ? `AbsorbPointer(absorbing: _rlsRO[_rlsRole].contains(${fb.i}), child: ${fb.expr})` : fb.expr;
        const cond = fb.cond ? `${hideG} && (${fb.cond})` : hideG;
        return `          if (${cond}) ${inner},`;
    }).join('\n');
    return fieldsGated;
}
export function inner$renderEntity$map$hideG(fb) {
    const hideG = `!_rlsHidden[_rlsRole].contains(${fb.i})`;
    return hideG;
}
export function inner$renderEntity$map$inner(hasRO, fb) {
    const inner = hasRO ? `AbsorbPointer(absorbing: _rlsRO[_rlsRole].contains(${fb.i}), child: ${fb.expr})` : fb.expr;
    return inner;
}
export function inner$renderEntity$map$cond(fb) {
    const hideG = `!_rlsHidden[_rlsRole].contains(${fb.i})`;
    const cond = fb.cond ? `${hideG} && (${fb.cond})` : hideG;
    return cond;
}
export function inner$renderEntity$map$cond$$step(fb, hideG) {
    const cond = fb.cond ? `${hideG} && (${fb.cond})` : hideG;
    return cond;
}
export function inner$renderEntity$formSection(authz, cForm, fieldBlocks) {
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const hasRO = !!(authz && authz.readonly && authz.readonly.some((h) => h.length));
    const rlsWrite = hasHide || hasRO;
    const fieldsPlain = fieldBlocks.map((fb) => fb.cond ? `          if (${fb.cond}) ${fb.expr},` : `          ${fb.expr},`).join('\n');
    const fieldsGated = fieldBlocks.map((fb) => {
        const hideG = `!_rlsHidden[_rlsRole].contains(${fb.i})`;
        const inner = hasRO ? `AbsorbPointer(absorbing: _rlsRO[_rlsRole].contains(${fb.i}), child: ${fb.expr})` : fb.expr;
        const cond = fb.cond ? `${hideG} && (${fb.cond})` : hideG;
        return `          if (${cond}) ${inner},`;
    }).join('\n');
    const formSection = rlsWrite
        ? `AnimatedBuilder(animation: appStore, builder: (context, _) => DsSection(title: ${cForm}, children: [\n${fieldsGated}\n        ])),`
        : `DsSection(title: ${cForm}, children: [\n${fieldsPlain}\n        ]),`;
    return formSection;
}
export function inner$renderEntity$formSection$$step(cForm, rlsWrite, fieldsPlain, fieldsGated) {
    const formSection = rlsWrite
        ? `AnimatedBuilder(animation: appStore, builder: (context, _) => DsSection(title: ${cForm}, children: [\n${fieldsGated}\n        ])),`
        : `DsSection(title: ${cForm}, children: [\n${fieldsPlain}\n        ]),`;
    return formSection;
}
export function inner$renderEntity$listRead0(slug, authz) {
    const SK = `'${slug}'`;
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const listRead0 = hasScope ? `appStore.scoped(${SK}, _rlsScope[_rlsRole])` : `appStore.records(${SK})`;
    return listRead0;
}
export function inner$renderEntity$listRead0$$step(SK, hasScope) {
    const listRead0 = hasScope ? `appStore.scoped(${SK}, _rlsScope[_rlsRole])` : `appStore.records(${SK})`;
    return listRead0;
}
export function inner$renderEntity$listRead(slug, authz) {
    const SK = `'${slug}'`;
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const listRead0 = hasScope ? `appStore.scoped(${SK}, _rlsScope[_rlsRole])` : `appStore.records(${SK})`;
    const listRead = `(widget.scopeId == null ? ${listRead0} : ${listRead0}.where((r) => (r[widget.scopeField ?? ''] ?? '') == widget.scopeId).toList())`;
    return listRead;
}
export function inner$renderEntity$listRead$$step(listRead0) {
    const listRead = `(widget.scopeId == null ? ${listRead0} : ${listRead0}.where((r) => (r[widget.scopeField ?? ''] ?? '') == widget.scopeId).toList())`;
    return listRead;
}
export function inner$renderEntity$cardSig(authz) {
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const rlsActive = hasScope || hasHide;
    const cardSig = rlsActive ? 'Widget _card(Map<String, String> r, Set<int> hidden) {' : 'Widget _card(Map<String, String> r) {';
    return cardSig;
}
export function inner$renderEntity$cardSig$$step(rlsActive) {
    const cardSig = rlsActive ? 'Widget _card(Map<String, String> r, Set<int> hidden) {' : 'Widget _card(Map<String, String> r) {';
    return cardSig;
}
export function inner$renderEntity$cardHiddenArg(authz) {
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const rlsActive = hasScope || hasHide;
    const cardHiddenArg = rlsActive ? ', hidden: hidden' : '';
    return cardHiddenArg;
}
export function inner$renderEntity$cardHiddenArg$$step(rlsActive) {
    const cardHiddenArg = rlsActive ? ', hidden: hidden' : '';
    return cardHiddenArg;
}
export function inner$renderEntity$cardCall(authz) {
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const rlsActive = hasScope || hasHide;
    const cardCall = rlsActive ? '_card(rs[i], _rlsHiddenSet)' : '_card(rs[i])';
    return cardCall;
}
export function inner$renderEntity$cardCall$$step(rlsActive) {
    const cardCall = rlsActive ? '_card(rs[i], _rlsHiddenSet)' : '_card(rs[i])';
    return cardCall;
}
export function inner$renderEntity$csvMethod(slug, authz, labelConst, recValsR) {
    const SK = `'${slug}'`;
    const recValues = recValsR.join(', ');
    const labelsList = labelConst.join(', ');
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const rlsActive = hasScope || hasHide;
    const listRead0 = hasScope ? `appStore.scoped(${SK}, _rlsScope[_rlsRole])` : `appStore.records(${SK})`;
    const listRead = `(widget.scopeId == null ? ${listRead0} : ${listRead0}.where((r) => (r[widget.scopeField ?? ''] ?? '') == widget.scopeId).toList())`;
    const csvMethod = rlsActive
        ? `  String _csv() {
      final b = StringBuffer();
      final hid = _rlsHiddenSet;
      final labels = const [${labelsList}];
      b.writeln([for (var i = 0; i < labels.length; i++) if (!hid.contains(i)) labels[i]].map((h) => '"' + h.replaceAll('"', '""') + '"').join(','));
      for (final r in ${listRead}) {
        final vals = [${recValues}];
        b.writeln([for (var i = 0; i < vals.length; i++) if (!hid.contains(i)) vals[i]].map((v) => '"' + v.replaceAll('"', '""') + '"').join(','));
      }
      return b.toString();
    }`
        : `  String _csv() {
      final b = StringBuffer();
      b.writeln(const [${labelsList}].map((h) => '"' + h.replaceAll('"', '""') + '"').join(','));
      for (final r in appStore.records(${SK})) {
        b.writeln([${recValues}].map((v) => '"' + v.replaceAll('"', '""') + '"').join(','));
      }
      return b.toString();
    }`;
    return csvMethod;
}
export function inner$renderEntity$csvMethod$$step(SK, recValues, labelsList, rlsActive, listRead) {
    const csvMethod = rlsActive
        ? `  String _csv() {
      final b = StringBuffer();
      final hid = _rlsHiddenSet;
      final labels = const [${labelsList}];
      b.writeln([for (var i = 0; i < labels.length; i++) if (!hid.contains(i)) labels[i]].map((h) => '"' + h.replaceAll('"', '""') + '"').join(','));
      for (final r in ${listRead}) {
        final vals = [${recValues}];
        b.writeln([for (var i = 0; i < vals.length; i++) if (!hid.contains(i)) vals[i]].map((v) => '"' + v.replaceAll('"', '""') + '"').join(','));
      }
      return b.toString();
    }`
        : `  String _csv() {
      final b = StringBuffer();
      b.writeln(const [${labelsList}].map((h) => '"' + h.replaceAll('"', '""') + '"').join(','));
      for (final r in appStore.records(${SK})) {
        b.writeln([${recValues}].map((v) => '"' + v.replaceAll('"', '""') + '"').join(','));
      }
      return b.toString();
    }`;
    return csvMethod;
}
export function inner$renderEntity$relImport(hasRel) {
    const relImport = hasRel ? "import '../dart-ui-bs/ds/ds_select.dart';\n" : '';
    return relImport;
}
export function inner$renderEntity$multiImport(hasMulti) {
    const multiImport = hasMulti ? "import '../dart-ui-bs/ds/ds_multi_select.dart';\n" : '';
    return multiImport;
}
export function inner$renderEntity$hasCal(firstDateConst) {
    const hasCal = firstDateConst !== null;
    return hasCal;
}
export function inner$renderEntity$boardImport(hasBoard) {
    const boardImport = hasBoard ? "import '../dart-ui-bs/ds/ds_board.dart';\n" : '';
    return boardImport;
}
export function inner$renderEntity$calImport(firstDateConst) {
    const hasCal = firstDateConst !== null;
    const calImport = hasCal ? "import '../dart-ui-bs/ds/ds_calendar.dart';\n" : '';
    return calImport;
}
export function inner$renderEntity$calImport$$step(hasCal) {
    const calImport = hasCal ? "import '../dart-ui-bs/ds/ds_calendar.dart';\n" : '';
    return calImport;
}
export function inner$renderEntity$tableImport() {
    const hasTable = true;
    const tableImport = hasTable ? "import '../dart-ui-bs/ds/ds_table.dart';\n" : '';
    return tableImport;
}
export function inner$renderEntity$viewField(firstDateConst, hasBoard) {
    const hasCal = firstDateConst !== null;
    const hasTable = true;
    const hasSwitch = hasBoard || hasCal || hasTable;
    const viewField = hasSwitch ? "  int _view = 0;   // 0=רשימה · לוח · לוח-שנה · טבלה\n" : '';
    return viewField;
}
export function inner$renderEntity$viewField$$step(hasSwitch) {
    const viewField = hasSwitch ? "  int _view = 0;   // 0=רשימה · לוח · לוח-שנה · טבלה\n" : '';
    return viewField;
}
export function inner$renderEntity$viewChips(L) {
    const viewChips = [`'${L.listChip}'`];
    return viewChips;
}
export function inner$renderEntity$viewToggle(firstDateConst, hasBoard, viewChips) {
    const hasCal = firstDateConst !== null;
    const hasTable = true;
    const hasSwitch = hasBoard || hasCal || hasTable;
    const viewToggle = hasSwitch
        ? `\n  Widget _viewBar(BuildContext context) {\n    final lk = DsLook.of(context);\n    const labels = [${viewChips.join(', ')}];\n    return Row(mainAxisSize: MainAxisSize.min, children: [\n      for (var i = 0; i < labels.length; i++)\n        Padding(\n          padding: const EdgeInsets.only(left: 6),\n          child: Material(\n            color: _view == i ? lk.accentSoft : (lk.chipBg),\n            borderRadius: BorderRadius.circular(20),\n            child: InkWell(\n              borderRadius: BorderRadius.circular(20),\n              onTap: () => setState(() => _view = i),\n              child: Padding(\n                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),\n                child: Text(labels[i], style: TextStyle(color: _view == i ? lk.accentDark : lk.muted, fontSize: 12, fontWeight: FontWeight.w700)),\n              ),\n            ),\n          ),\n        ),\n    ]);\n  }\n`
        : '';
    return viewToggle;
}
export function inner$renderEntity$viewToggle$$step(hasSwitch, viewChips) {
    const viewToggle = hasSwitch
        ? `\n  Widget _viewBar(BuildContext context) {\n    final lk = DsLook.of(context);\n    const labels = [${viewChips.join(', ')}];\n    return Row(mainAxisSize: MainAxisSize.min, children: [\n      for (var i = 0; i < labels.length; i++)\n        Padding(\n          padding: const EdgeInsets.only(left: 6),\n          child: Material(\n            color: _view == i ? lk.accentSoft : (lk.chipBg),\n            borderRadius: BorderRadius.circular(20),\n            child: InkWell(\n              borderRadius: BorderRadius.circular(20),\n              onTap: () => setState(() => _view = i),\n              child: Padding(\n                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),\n                child: Text(labels[i], style: TextStyle(color: _view == i ? lk.accentDark : lk.muted, fontSize: 12, fontWeight: FontWeight.w700)),\n              ),\n            ),\n          ),\n        ),\n    ]);\n  }\n`
        : '';
    return viewToggle;
}
export function inner$renderEntity$recordsTrailing(firstDateConst, hasBoard) {
    const hasCal = firstDateConst !== null;
    const hasTable = true;
    const hasSwitch = hasBoard || hasCal || hasTable;
    const recordsTrailing = hasSwitch ? 'Row(mainAxisSize: MainAxisSize.min, children: [_viewBar(context), const SizedBox(width: 8), _csvBtn(context)])' : '_csvBtn(context)';
    return recordsTrailing;
}
export function inner$renderEntity$recordsTrailing$$step(hasSwitch) {
    const recordsTrailing = hasSwitch ? 'Row(mainAxisSize: MainAxisSize.min, children: [_viewBar(context), const SizedBox(width: 8), _csvBtn(context)])' : '_csvBtn(context)';
    return recordsTrailing;
}
export function inner$renderEntity$boardBranch(slug, labelConst, recValsR, firstDateConst, stageConsts, hasBoard, viewIdx) {
    const SK = `'${slug}'`;
    const stageList = `[${stageConsts.join(', ')}]`;
    const recValues = recValsR.join(', ');
    const labelsList = labelConst.join(', ');
    const hasCal = firstDateConst !== null;
    const hasTable = true;
    const viewTitle = labelConst[0] || "''";
    const boardBranch = (hasBoard ? `if (_view == ${viewIdx.board}) return DsBoard(stages: const ${stageList}, records: rs, stageOf: (r) => appStore.stageOf(${SK}, r['__id'] ?? ''), titleOf: (r) => r[${viewTitle}] ?? '', onMove: (id, to) => appStore.setStage(${SK}, id, to));\n              ` : '')
        + (hasCal ? `if (_view == ${viewIdx.cal}) return DsCalendar(records: rs, dateOf: (r) => r[${firstDateConst}] ?? '', titleOf: (r) => r[${viewTitle}] ?? '');\n              ` : '')
        + (hasTable ? `if (_view == ${viewIdx.table}) return DsTable(labels: const [${labelsList}], rows: rs.map((r) => [${recValues}]).toList());\n              ` : '');
    return boardBranch;
}
export function inner$renderEntity$boardBranch$$step(SK, firstDateConst, stageList, recValues, labelsList, hasBoard, hasCal, viewTitle, viewIdx) {
    const hasTable = true;
    const boardBranch = (hasBoard ? `if (_view == ${viewIdx.board}) return DsBoard(stages: const ${stageList}, records: rs, stageOf: (r) => appStore.stageOf(${SK}, r['__id'] ?? ''), titleOf: (r) => r[${viewTitle}] ?? '', onMove: (id, to) => appStore.setStage(${SK}, id, to));\n              ` : '')
        + (hasCal ? `if (_view == ${viewIdx.cal}) return DsCalendar(records: rs, dateOf: (r) => r[${firstDateConst}] ?? '', titleOf: (r) => r[${viewTitle}] ?? '');\n              ` : '')
        + (hasTable ? `if (_view == ${viewIdx.table}) return DsTable(labels: const [${labelsList}], rows: rs.map((r) => [${recValues}]).toList());\n              ` : '');
    return boardBranch;
}
export function inner$renderEntity$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderEntity$code(slug, stages, backRefs, authz, cTitle, cSub, cIcon, cSave, cUpdate, cForm, cRecords, cEmpty, cNoMatch, funcImports, typedImports, labelConst, fieldBlocks, recValsR, mapVals, requiredIdx, uniqueIdx, defEntries, subEditLoad, rangeSpecs, patternSpecs, hasLive, hasRel, hasEnum, hasCalc, hasMulti, usedField, firstDateConst, ruleSpecs, ruleChecks, rangeChecks, patternChecks, stageConsts, backChips, sigBtn, sigMethods, delArgs, guardSpecs, guardMethod, scopeTable, hiddenTable, kpiStrip, hasBoard, viewChips, viewIdx, L) {
    const SK = `'${slug}'`;
    const reqChecks = requiredIdx.map((i) => `if ((_v[${i}] ?? '').trim().isEmpty) miss.add('${L.missPrefix}' + ${labelConst[i]});`).join('\n      ');
    const uniqChecks = uniqueIdx.map((i) => `{ final v = (_v[${i}] ?? '').trim(); if (v.isNotEmpty && appStore.records(${SK}).any((r) => r['__id'] != _editId && (r[${labelConst[i]}] ?? '') == v)) miss.add('${L.dupPrefix}' + ${labelConst[i]}); }`).join('\n      ');
    const validPatterns = patternSpecs.filter((p) => { try {
        new RegExp(p.pattern);
        return true;
    }
    catch {
        return false;
    } });
    const hasVal = requiredIdx.length + uniqueIdx.length + ruleSpecs.length + rangeSpecs.length + validPatterns.length > 0;
    const defInit = defEntries.length ? `{${defEntries.join(', ')}}` : '{}';
    const enumImport = hasEnum ? "import '../dart-ui-bs/ds/ds_enum_field.dart';\n" : '';
    const hasStages = stages.length >= 2;
    const stageList = `[${stageConsts.join(', ')}]`;
    const stepsDart = hasStages
        ? `        DsWorkflow(steps: const ${stageList}, current: 0),\n`
        : '';
    const mapEntries = mapVals.join(', ');
    const editLoad = [...labelConst.map((cl, i) => `${i}: r[${cl}] ?? ''`), ...subEditLoad].join(', ');
    const recValues = recValsR.join(', ');
    const labelsList = labelConst.join(', ');
    const backFooter = backRefs.length ? `, footer: Wrap(spacing: 6, runSpacing: 6, children: [${backChips}${sigBtn ? ', ' + sigBtn : ''}])` : sigBtn ? `, footer: ${sigBtn}` : '';
    const hasGuards = guardSpecs.length > 0;
    const onStageBody = hasGuards
        ? `(i) { if (i > appStore.stageOf(${SK}, rid)) { final g = _guard(i, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } } appStore.setStage(${SK}, rid, i); }`
        : `(i) => appStore.setStage(${SK}, rid, i)`;
    const onAdvBody = hasGuards
        ? `() { final g = _guard(appStore.stageOf(${SK}, rid) + 1, r); if (g != null) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${L.blockPrefix}' + g))); return; } appStore.advance(${SK}, rid, ${stages.length}); }`
        : `() => appStore.advance(${SK}, rid, ${stages.length})`;
    const stageArgs = hasStages
        ? `stage: (const ${stageList})[appStore.stageOf(${SK}, rid)], stageDone: appStore.stageOf(${SK}, rid) >= ${stages.length - 1}, stages: const ${stageList}, stageIndex: appStore.stageOf(${SK}, rid), onStage: ${onStageBody}, onAdvance: ${onAdvBody}, `
        : '';
    const nRoles = authz ? authz.scope.length : 0;
    const hasScope = !!(authz && authz.scope.some((f) => f));
    const hasHide = !!(authz && authz.hidden.some((h) => h.length));
    const hasRO = !!(authz && authz.readonly && authz.readonly.some((h) => h.length));
    const rlsActive = hasScope || hasHide;
    const rlsWrite = hasHide || hasRO;
    const rlsTables = rlsActive || hasRO;
    const roTable = hasRO ? `\n  static const List<List<int>> _rlsRO = [${authz.readonly.map((h) => `[${h.join(', ')}]`).join(', ')}];` : '';
    const hiddenSetGetter = rlsActive ? `\n  Set<int> get _rlsHiddenSet => _rlsHidden[_rlsRole].toSet();` : '';
    const rlsFields = rlsTables
        ? `${scopeTable}${hiddenTable}${roTable}\n  int get _rlsRole => appStore.role.clamp(0, ${Math.max(0, nRoles - 1)});${hiddenSetGetter}\n`
        : '';
    const fieldsPlain = fieldBlocks.map((fb) => fb.cond ? `          if (${fb.cond}) ${fb.expr},` : `          ${fb.expr},`).join('\n');
    const fieldsGated = fieldBlocks.map((fb) => {
        const hideG = `!_rlsHidden[_rlsRole].contains(${fb.i})`;
        const inner = hasRO ? `AbsorbPointer(absorbing: _rlsRO[_rlsRole].contains(${fb.i}), child: ${fb.expr})` : fb.expr;
        const cond = fb.cond ? `${hideG} && (${fb.cond})` : hideG;
        return `          if (${cond}) ${inner},`;
    }).join('\n');
    const formSection = rlsWrite
        ? `AnimatedBuilder(animation: appStore, builder: (context, _) => DsSection(title: ${cForm}, children: [\n${fieldsGated}\n        ])),`
        : `DsSection(title: ${cForm}, children: [\n${fieldsPlain}\n        ]),`;
    const listRead0 = hasScope ? `appStore.scoped(${SK}, _rlsScope[_rlsRole])` : `appStore.records(${SK})`;
    const listRead = `(widget.scopeId == null ? ${listRead0} : ${listRead0}.where((r) => (r[widget.scopeField ?? ''] ?? '') == widget.scopeId).toList())`;
    const cardSig = rlsActive ? 'Widget _card(Map<String, String> r, Set<int> hidden) {' : 'Widget _card(Map<String, String> r) {';
    const cardHiddenArg = rlsActive ? ', hidden: hidden' : '';
    const cardCall = rlsActive ? '_card(rs[i], _rlsHiddenSet)' : '_card(rs[i])';
    const csvMethod = rlsActive
        ? `  String _csv() {
      final b = StringBuffer();
      final hid = _rlsHiddenSet;
      final labels = const [${labelsList}];
      b.writeln([for (var i = 0; i < labels.length; i++) if (!hid.contains(i)) labels[i]].map((h) => '"' + h.replaceAll('"', '""') + '"').join(','));
      for (final r in ${listRead}) {
        final vals = [${recValues}];
        b.writeln([for (var i = 0; i < vals.length; i++) if (!hid.contains(i)) vals[i]].map((v) => '"' + v.replaceAll('"', '""') + '"').join(','));
      }
      return b.toString();
    }`
        : `  String _csv() {
      final b = StringBuffer();
      b.writeln(const [${labelsList}].map((h) => '"' + h.replaceAll('"', '""') + '"').join(','));
      for (final r in appStore.records(${SK})) {
        b.writeln([${recValues}].map((v) => '"' + v.replaceAll('"', '""') + '"').join(','));
      }
      return b.toString();
    }`;
    const relImport = hasRel ? "import '../dart-ui-bs/ds/ds_select.dart';\n" : '';
    const multiImport = hasMulti ? "import '../dart-ui-bs/ds/ds_multi_select.dart';\n" : '';
    const hasCal = firstDateConst !== null;
    const hasTable = true;
    const hasSwitch = hasBoard || hasCal || hasTable;
    const viewTitle = labelConst[0] || "''";
    const boardImport = hasBoard ? "import '../dart-ui-bs/ds/ds_board.dart';\n" : '';
    const calImport = hasCal ? "import '../dart-ui-bs/ds/ds_calendar.dart';\n" : '';
    const tableImport = hasTable ? "import '../dart-ui-bs/ds/ds_table.dart';\n" : '';
    const viewField = hasSwitch ? "  int _view = 0;   // 0=רשימה · לוח · לוח-שנה · טבלה\n" : '';
    const viewToggle = hasSwitch
        ? `\n  Widget _viewBar(BuildContext context) {\n    final lk = DsLook.of(context);\n    const labels = [${viewChips.join(', ')}];\n    return Row(mainAxisSize: MainAxisSize.min, children: [\n      for (var i = 0; i < labels.length; i++)\n        Padding(\n          padding: const EdgeInsets.only(left: 6),\n          child: Material(\n            color: _view == i ? lk.accentSoft : (lk.chipBg),\n            borderRadius: BorderRadius.circular(20),\n            child: InkWell(\n              borderRadius: BorderRadius.circular(20),\n              onTap: () => setState(() => _view = i),\n              child: Padding(\n                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),\n                child: Text(labels[i], style: TextStyle(color: _view == i ? lk.accentDark : lk.muted, fontSize: 12, fontWeight: FontWeight.w700)),\n              ),\n            ),\n          ),\n        ),\n    ]);\n  }\n`
        : '';
    const recordsTrailing = hasSwitch ? 'Row(mainAxisSize: MainAxisSize.min, children: [_viewBar(context), const SizedBox(width: 8), _csvBtn(context)])' : '_csvBtn(context)';
    const boardBranch = (hasBoard ? `if (_view == ${viewIdx.board}) return DsBoard(stages: const ${stageList}, records: rs, stageOf: (r) => appStore.stageOf(${SK}, r['__id'] ?? ''), titleOf: (r) => r[${viewTitle}] ?? '', onMove: (id, to) => appStore.setStage(${SK}, id, to));\n              ` : '')
        + (hasCal ? `if (_view == ${viewIdx.cal}) return DsCalendar(records: rs, dateOf: (r) => r[${firstDateConst}] ?? '', titleOf: (r) => r[${viewTitle}] ?? '');\n              ` : '')
        + (hasTable ? `if (_view == ${viewIdx.table}) return DsTable(labels: const [${labelsList}], rows: rs.map((r) => [${recValues}]).toList());\n              ` : '');
    const cls = pascal(slug);
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — מסך-חי מחווט (טופס→קשרים→מסע→חנות→טבלה + לוגיקה). אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  import '../dart-ui-bs/ds/ds.dart';
  import '../dart-ui-bs/ds/ds_search.dart';
  ${usedField ? "import '../dart-ui-bs/ds/ds_field.dart';\n" : ''}${[...typedImports].sort().map((x) => x + '\n').join('')}${enumImport}${relImport}${multiImport}${boardImport}${calImport}${tableImport}import '../dart-ui-bs/ds/ds_store.dart';
  ${[...funcImports].sort().join('\n')}
  import 'package:flutter/material.dart';
  import 'package:flutter/services.dart';
  
  class ${cls} extends StatefulWidget {
    const ${cls}({this.scopeField, this.scopeId, this.initial, this.editId, super.key});
    final String? editId;   // פתיחה ישר בעריכת-רשומה קיימת (מעמוד-התיק «ערוך»)
  
    final Map<String, String>? initial;   // G33 · מילוי-מראש מ«מה קרה?» (הכרעה-29): שדה ⇒ ערך, פעם אחת
    final String? scopeField;   // G26 · היקף-הורה (ניווט-מקשרים): שדה-הקשר + מזהה ⇒ הרשימה מסוננת לרשומת-ההורה והטופס ממולא-מראש
    final String? scopeId;
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    static const List<String> _labelsAll = [${labelConst.join(', ')}];
    Map<int, String> _v = ${defInit};
    String? _editId;   // ריק = הוספה · מזהה = עריכת-רשומה קיימת
    bool _initialUsed = false;
    void _prefill() { if (widget.scopeId != null) { final i = _labelsAll.indexOf(widget.scopeField ?? ''); if (i >= 0) _v[i] = widget.scopeId!; } if (widget.initial != null && !_initialUsed) { _initialUsed = true; widget.initial!.forEach((f, v) { final i = _labelsAll.indexOf(f); if (i >= 0 && v.trim().isNotEmpty) _v[i] = v; }); } }
    @override
    void initState() { super.initState(); _prefill(); if (widget.editId != null) { final r = appStore.byId('${slug}', widget.editId!); if (r != null) WidgetsBinding.instance.addPostFrameCallback((_) { if (mounted) _edit(r); }); } }
    String _q = '';    // מחרוזת-חיפוש (סינון-רשומות חי)
  ${viewField}${hasVal ? '  String? _err;      // שגיאת-ולידציה (שדות-חובה חסרים)\n' : ''}
  
    void _save() {
      if (_v.values.where((x) => x.trim().isNotEmpty).isEmpty) return;
  ${hasVal ? `    final miss = <String>[];
        ${reqChecks}
        ${uniqChecks}
        ${ruleChecks}${rangeChecks ? '\n      ' + rangeChecks : ''}${patternChecks ? '\n      ' + patternChecks : ''}
      if (miss.isNotEmpty) { setState(() => _err = miss.join(' · ')); return; }
  ` : ''}    final map = <String, String>{${mapEntries}};
      if (_editId != null) {
        appStore.update(${SK}, _editId!, map);
      } else {
        appStore.add(${SK}, <String, String>{...map${hasStages ? `, '__stage': '0'` : ''}});
      }
      setState(() { _v = ${defInit}; _editId = null;${hasVal ? ' _err = null;' : ''} _prefill(); });
    }
  
    void _edit(Map<String, String> r) {
      setState(() {
        _editId = r['__id'];
        _v = {${editLoad}};
      });
    }
  ${guardMethod}${rlsFields}${viewToggle}${sigMethods}
    ${cardSig}
      final rid = r['__id'] ?? '';
      return DsRecordCard(labels: const [${labelsList}], values: [${recValues}], ${stageArgs}onEdit: () => _edit(r), onDelete: () => appStore.removeById(${SK}, rid)${backFooter}${delArgs}${cardHiddenArg});
    }
  ${backRefs.length ? `
    Widget _backChip(String label, int n) => Builder(builder: (context) { final lk = DsLook.of(context); return Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
          decoration: BoxDecoration(color: lk.chipBg, borderRadius: BorderRadius.circular(20)),
          child: Text('\$label · \$n', style: TextStyle(color: lk.muted, fontSize: 11.5, fontWeight: FontWeight.w700)),
        ); });
  ` : ''}
  
  ${csvMethod}
  
    Widget _csvBtn(BuildContext context) { final lk = DsLook.of(context); return Material(
          color: lk.chipBg,
          borderRadius: BorderRadius.circular(9),
          child: InkWell(
            borderRadius: BorderRadius.circular(9),
            onTap: () {
              Clipboard.setData(ClipboardData(text: _csv()));
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('${L.copiedCsv}'), duration: Duration(seconds: 2)));
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.copy_all_outlined, size: 15, color: lk.muted),
                const SizedBox(width: 5),
                Text('CSV', style: TextStyle(color: lk.muted, fontSize: 12, fontWeight: FontWeight.w700)),
              ]),
            ),
          ),
        ); }
  
  ${hasCalc ? `  Widget _calc(String label, num v) => Builder(builder: (context) { final lk = DsLook.of(context); return Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(color: lk.successSoft, borderRadius: BorderRadius.circular(lk.rSm)),
            child: Row(children: [
              Icon(Icons.calculate_outlined, size: 16, color: lk.success),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: TextStyle(color: lk.ink, fontSize: 13.5, fontWeight: FontWeight.w700))),
              Text(v.toStringAsFixed(2), style: TextStyle(color: lk.success, fontSize: 15.5, fontWeight: FontWeight.w800)),
            ]),
          ),
        ); });
  
  ` : ''}${hasLive ? `  Widget _live(String label, String out) => Builder(builder: (context) { final lk = DsLook.of(context); return Padding(
          padding: const EdgeInsets.only(top: 2, bottom: 6),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(color: lk.accentSoft, borderRadius: BorderRadius.circular(lk.rSm)),
            child: Row(children: [
              Icon(Icons.bolt, size: 15, color: lk.accentDark),
              const SizedBox(width: 7),
              Expanded(child: Text('\$label · \$out', style: TextStyle(color: lk.accentDark, fontSize: 13, fontWeight: FontWeight.w700))),
            ]),
          ),
        ); });
  
  ` : ''}  @override
    Widget build(BuildContext context) {
      final lk = DsLook.of(context);
      return DsScaffold(
        title: ${cTitle},
        subtitle: ${cSub},
        icon: ${cIcon},
        bottomBar: DsPrimaryButton(label: _editId == null ? ${cSave} : ${cUpdate}, onTap: _save),
        children: [
          ${kpiStrip}
  ${stepsDart}${hasVal ? `        if (_err != null) Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: lk.dangerSoft, borderRadius: BorderRadius.circular(lk.rSm), border: Border.all(color: lk.dangerLine)),
            child: Row(children: [Icon(Icons.error_outline, size: 16, color: lk.danger), const SizedBox(width: 8), Expanded(child: Text(_err!, style: TextStyle(color: lk.danger, fontSize: 13, fontWeight: FontWeight.w600)))]),
          ),
  ` : ''}        ${formSection}
          DsSection(title: ${cRecords}, trailing: ${recordsTrailing}, children: [
            AnimatedBuilder(
              animation: appStore,
              builder: (context, _) {
                final all = ${listRead};
                if (all.isEmpty) return const DsEmpty(label: ${cEmpty});
                final q = _q.trim().toLowerCase();
                final rs = q.isEmpty ? all : all.where((r) => r.entries.any((e) => !e.key.startsWith('__') && e.value.toLowerCase().contains(q))).toList();
                ${boardBranch}return Column(children: [
                  DsSearch(value: _q, onChanged: (v) => setState(() => _q = v)),
                  if (rs.isEmpty) const DsEmpty(label: ${cNoMatch}),
                  for (var i = 0; i < rs.length; i++)
                    ${cardCall},
                ]);
              },
            ),
          ]),
        ],
      );
    }
  }
  `;
    return code;
}
export function inner$renderEntity$code$$step(slug, backRefs, cTitle, cSub, cIcon, cSave, cUpdate, cRecords, cEmpty, cNoMatch, SK, funcImports, typedImports, labelConst, hasLive, hasCalc, usedField, reqChecks, uniqChecks, ruleChecks, rangeChecks, patternChecks, hasVal, defInit, enumImport, hasStages, stepsDart, mapEntries, editLoad, recValues, labelsList, backFooter, sigMethods, delArgs, guardMethod, stageArgs, rlsFields, formSection, kpiStrip, listRead, cardSig, cardHiddenArg, cardCall, csvMethod, relImport, multiImport, boardImport, calImport, tableImport, viewField, viewToggle, recordsTrailing, boardBranch, cls, L) {
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — מסך-חי מחווט (טופס→קשרים→מסע→חנות→טבלה + לוגיקה). אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  import '../dart-ui-bs/ds/ds.dart';
  import '../dart-ui-bs/ds/ds_search.dart';
  ${usedField ? "import '../dart-ui-bs/ds/ds_field.dart';\n" : ''}${[...typedImports].sort().map((x) => x + '\n').join('')}${enumImport}${relImport}${multiImport}${boardImport}${calImport}${tableImport}import '../dart-ui-bs/ds/ds_store.dart';
  ${[...funcImports].sort().join('\n')}
  import 'package:flutter/material.dart';
  import 'package:flutter/services.dart';
  
  class ${cls} extends StatefulWidget {
    const ${cls}({this.scopeField, this.scopeId, this.initial, this.editId, super.key});
    final String? editId;   // פתיחה ישר בעריכת-רשומה קיימת (מעמוד-התיק «ערוך»)
  
    final Map<String, String>? initial;   // G33 · מילוי-מראש מ«מה קרה?» (הכרעה-29): שדה ⇒ ערך, פעם אחת
    final String? scopeField;   // G26 · היקף-הורה (ניווט-מקשרים): שדה-הקשר + מזהה ⇒ הרשימה מסוננת לרשומת-ההורה והטופס ממולא-מראש
    final String? scopeId;
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    static const List<String> _labelsAll = [${labelConst.join(', ')}];
    Map<int, String> _v = ${defInit};
    String? _editId;   // ריק = הוספה · מזהה = עריכת-רשומה קיימת
    bool _initialUsed = false;
    void _prefill() { if (widget.scopeId != null) { final i = _labelsAll.indexOf(widget.scopeField ?? ''); if (i >= 0) _v[i] = widget.scopeId!; } if (widget.initial != null && !_initialUsed) { _initialUsed = true; widget.initial!.forEach((f, v) { final i = _labelsAll.indexOf(f); if (i >= 0 && v.trim().isNotEmpty) _v[i] = v; }); } }
    @override
    void initState() { super.initState(); _prefill(); if (widget.editId != null) { final r = appStore.byId('${slug}', widget.editId!); if (r != null) WidgetsBinding.instance.addPostFrameCallback((_) { if (mounted) _edit(r); }); } }
    String _q = '';    // מחרוזת-חיפוש (סינון-רשומות חי)
  ${viewField}${hasVal ? '  String? _err;      // שגיאת-ולידציה (שדות-חובה חסרים)\n' : ''}
  
    void _save() {
      if (_v.values.where((x) => x.trim().isNotEmpty).isEmpty) return;
  ${hasVal ? `    final miss = <String>[];
        ${reqChecks}
        ${uniqChecks}
        ${ruleChecks}${rangeChecks ? '\n      ' + rangeChecks : ''}${patternChecks ? '\n      ' + patternChecks : ''}
      if (miss.isNotEmpty) { setState(() => _err = miss.join(' · ')); return; }
  ` : ''}    final map = <String, String>{${mapEntries}};
      if (_editId != null) {
        appStore.update(${SK}, _editId!, map);
      } else {
        appStore.add(${SK}, <String, String>{...map${hasStages ? `, '__stage': '0'` : ''}});
      }
      setState(() { _v = ${defInit}; _editId = null;${hasVal ? ' _err = null;' : ''} _prefill(); });
    }
  
    void _edit(Map<String, String> r) {
      setState(() {
        _editId = r['__id'];
        _v = {${editLoad}};
      });
    }
  ${guardMethod}${rlsFields}${viewToggle}${sigMethods}
    ${cardSig}
      final rid = r['__id'] ?? '';
      return DsRecordCard(labels: const [${labelsList}], values: [${recValues}], ${stageArgs}onEdit: () => _edit(r), onDelete: () => appStore.removeById(${SK}, rid)${backFooter}${delArgs}${cardHiddenArg});
    }
  ${backRefs.length ? `
    Widget _backChip(String label, int n) => Builder(builder: (context) { final lk = DsLook.of(context); return Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
          decoration: BoxDecoration(color: lk.chipBg, borderRadius: BorderRadius.circular(20)),
          child: Text('\$label · \$n', style: TextStyle(color: lk.muted, fontSize: 11.5, fontWeight: FontWeight.w700)),
        ); });
  ` : ''}
  
  ${csvMethod}
  
    Widget _csvBtn(BuildContext context) { final lk = DsLook.of(context); return Material(
          color: lk.chipBg,
          borderRadius: BorderRadius.circular(9),
          child: InkWell(
            borderRadius: BorderRadius.circular(9),
            onTap: () {
              Clipboard.setData(ClipboardData(text: _csv()));
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('${L.copiedCsv}'), duration: Duration(seconds: 2)));
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.copy_all_outlined, size: 15, color: lk.muted),
                const SizedBox(width: 5),
                Text('CSV', style: TextStyle(color: lk.muted, fontSize: 12, fontWeight: FontWeight.w700)),
              ]),
            ),
          ),
        ); }
  
  ${hasCalc ? `  Widget _calc(String label, num v) => Builder(builder: (context) { final lk = DsLook.of(context); return Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Container(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(color: lk.successSoft, borderRadius: BorderRadius.circular(lk.rSm)),
            child: Row(children: [
              Icon(Icons.calculate_outlined, size: 16, color: lk.success),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: TextStyle(color: lk.ink, fontSize: 13.5, fontWeight: FontWeight.w700))),
              Text(v.toStringAsFixed(2), style: TextStyle(color: lk.success, fontSize: 15.5, fontWeight: FontWeight.w800)),
            ]),
          ),
        ); });
  
  ` : ''}${hasLive ? `  Widget _live(String label, String out) => Builder(builder: (context) { final lk = DsLook.of(context); return Padding(
          padding: const EdgeInsets.only(top: 2, bottom: 6),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(color: lk.accentSoft, borderRadius: BorderRadius.circular(lk.rSm)),
            child: Row(children: [
              Icon(Icons.bolt, size: 15, color: lk.accentDark),
              const SizedBox(width: 7),
              Expanded(child: Text('\$label · \$out', style: TextStyle(color: lk.accentDark, fontSize: 13, fontWeight: FontWeight.w700))),
            ]),
          ),
        ); });
  
  ` : ''}  @override
    Widget build(BuildContext context) {
      final lk = DsLook.of(context);
      return DsScaffold(
        title: ${cTitle},
        subtitle: ${cSub},
        icon: ${cIcon},
        bottomBar: DsPrimaryButton(label: _editId == null ? ${cSave} : ${cUpdate}, onTap: _save),
        children: [
          ${kpiStrip}
  ${stepsDart}${hasVal ? `        if (_err != null) Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: lk.dangerSoft, borderRadius: BorderRadius.circular(lk.rSm), border: Border.all(color: lk.dangerLine)),
            child: Row(children: [Icon(Icons.error_outline, size: 16, color: lk.danger), const SizedBox(width: 8), Expanded(child: Text(_err!, style: TextStyle(color: lk.danger, fontSize: 13, fontWeight: FontWeight.w600)))]),
          ),
  ` : ''}        ${formSection}
          DsSection(title: ${cRecords}, trailing: ${recordsTrailing}, children: [
            AnimatedBuilder(
              animation: appStore,
              builder: (context, _) {
                final all = ${listRead};
                if (all.isEmpty) return const DsEmpty(label: ${cEmpty});
                final q = _q.trim().toLowerCase();
                final rs = q.isEmpty ? all : all.where((r) => r.entries.any((e) => !e.key.startsWith('__') && e.value.toLowerCase().contains(q))).toList();
                ${boardBranch}return Column(children: [
                  DsSearch(value: _q, onChanged: (v) => setState(() => _q = v)),
                  if (rs.isEmpty) const DsEmpty(label: ${cNoMatch}),
                  for (var i = 0; i < rs.length; i++)
                    ${cardCall},
                ]);
              },
            ),
          ]),
        ],
      );
    }
  }
  `;
    return code;
}
export function inner$renderDashboard$mw(metrics) {
    const mw = metrics.flatMap(heWords);
    return mw;
}
export function inner$renderDashboard$picked(entities, metrics) {
    const mw = metrics.flatMap(heWords);
    const picked = entities.filter((e) => heWords(e.name).some((n) => mw.some((m) => prefixMatch(m, n))));
    return picked;
}
export function inner$renderDashboard$picked$$step(entities, mw) {
    const picked = entities.filter((e) => heWords(e.name).some((n) => mw.some((m) => prefixMatch(m, n))));
    return picked;
}
export function inner$renderDashboard$disp(a, num, L) {
    const disp = a.kind === L.avg ? `${num}.toStringAsFixed(1)` : `${num}.toStringAsFixed(0)`;
    return disp;
}
export function inner$renderDashboard$countTile$ops(purpose, PSAK_KIND) {
    const ops = purpose.kind === PSAK_KIND.shiur ? ['ring', 'gauge', 'alert', 'headline'] : ['headline'];
    return ops;
}
export function inner$renderDashboard$num(e) {
    const num = `appStore.count('${e.slug || ''}').toDouble()`;
    return num;
}
export function inner$renderDashboard$num_L846(x) {
    const num = x.value != null && /^\d+(\.\d+)?$/.test(String(x.value)) ? `${Number(x.value)}.toDouble()` : '0.0';
    return num;
}
export function inner$renderDashboard$b(tiles, i) {
    const b = tiles[i + 1];
    return b;
}
export function inner$renderDashboard$second(tiles, i) {
    const b = tiles[i + 1];
    const second = b ? `Expanded(child: ${b})` : 'const Expanded(child: SizedBox())';
    return second;
}
export function inner$renderDashboard$second$$step(b) {
    const second = b ? `Expanded(child: ${b})` : 'const Expanded(child: SizedBox())';
    return second;
}
export function inner$renderDashboard$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderHub$hasActor(scopeFields) {
    const hasActor = scopeFields.length > 0;
    return hasActor;
}
export function inner$renderHub$actorMethod(scopeFields, actorUnion, L) {
    const hasActor = scopeFields.length > 0;
    const actorMethod = hasActor
        ? `\n  Widget _actorBar(BuildContext context) => AnimatedBuilder(\n    animation: appStore,\n    builder: (context, _) {\n      final lk = DsLook.of(context);\n      final opts = <String>{${actorUnion}}.toList()..sort();\n      return Container(\n        margin: const EdgeInsets.only(bottom: 8),\n        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),\n        decoration: BoxDecoration(color: lk.chipBg, borderRadius: BorderRadius.circular(12)),\n        child: Row(children: [\n          Text('${L.viewingAs}', style: TextStyle(fontSize: 12.5, color: lk.muted, fontWeight: FontWeight.w700)),\n          const SizedBox(width: 8),\n          DropdownButton<String>(\n            value: appStore.actor,\n            underline: const SizedBox.shrink(),\n            items: [const DropdownMenuItem<String>(value: '', child: Text('${L.all}')), for (final o in opts) if (o.isNotEmpty) DropdownMenuItem<String>(value: o, child: Text(o))],\n            onChanged: (v) => setState(() => appStore.setActor(v ?? '')),\n          ),\n          const Spacer(),\n          Text('${L.viewFilter}', style: TextStyle(fontSize: 11, color: lk.faint)),\n        ]),\n      );\n    },\n  );\n`
        : '';
    return actorMethod;
}
export function inner$renderHub$actorMethod$$step(hasActor, actorUnion, L) {
    const actorMethod = hasActor
        ? `\n  Widget _actorBar(BuildContext context) => AnimatedBuilder(\n    animation: appStore,\n    builder: (context, _) {\n      final lk = DsLook.of(context);\n      final opts = <String>{${actorUnion}}.toList()..sort();\n      return Container(\n        margin: const EdgeInsets.only(bottom: 8),\n        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),\n        decoration: BoxDecoration(color: lk.chipBg, borderRadius: BorderRadius.circular(12)),\n        child: Row(children: [\n          Text('${L.viewingAs}', style: TextStyle(fontSize: 12.5, color: lk.muted, fontWeight: FontWeight.w700)),\n          const SizedBox(width: 8),\n          DropdownButton<String>(\n            value: appStore.actor,\n            underline: const SizedBox.shrink(),\n            items: [const DropdownMenuItem<String>(value: '', child: Text('${L.all}')), for (final o in opts) if (o.isNotEmpty) DropdownMenuItem<String>(value: o, child: Text(o))],\n            onChanged: (v) => setState(() => appStore.setActor(v ?? '')),\n          ),\n          const Spacer(),\n          Text('${L.viewFilter}', style: TextStyle(fontSize: 11, color: lk.faint)),\n        ]),\n      );\n    },\n  );\n`
        : '';
    return actorMethod;
}
export function inner$renderHub$effRoles(roles, L) {
    const effRoles = roles.length ? roles : [{ name: L.all, all: true, ents: [] }];
    return effRoles;
}
export function inner$renderHub$roleVis(screens, roles, L) {
    const effRoles = roles.length ? roles : [{ name: L.all, all: true, ents: [] }];
    const roleVis = effRoles.map((role) => {
        if (role.all)
            return screens.map((_, i) => i);
        const out = [];
        screens.forEach((s, i) => {
            if (s.kind === 'system')
                return; // מסכי-מערכת רק למנהל-על
            if (s.kind === 'dashboard') {
                if (role.ents.some((e) => new RegExp(L.reportKw).test(e)))
                    out.push(i);
                return;
            }
            const nw = heWords(s.name);
            if (role.ents.some((e) => { const ew = heWords(e); return ew.length && ew.every((w) => nw.some((x) => prefixMatch(x, w))); }))
                out.push(i);
        });
        return out;
    });
    return roleVis;
}
export function inner$renderHub$roleVis$$step(screens, effRoles, L) {
    const roleVis = effRoles.map((role) => {
        if (role.all)
            return screens.map((_, i) => i);
        const out = [];
        screens.forEach((s, i) => {
            if (s.kind === 'system')
                return; // מסכי-מערכת רק למנהל-על
            if (s.kind === 'dashboard') {
                if (role.ents.some((e) => new RegExp(L.reportKw).test(e)))
                    out.push(i);
                return;
            }
            const nw = heWords(s.name);
            if (role.ents.some((e) => { const ew = heWords(e); return ew.length && ew.every((w) => nw.some((x) => prefixMatch(x, w))); }))
                out.push(i);
        });
        return out;
    });
    return roleVis;
}
export function inner$renderHub$map$forEach$nw(s) {
    const nw = heWords(s.name);
    return nw;
}
export function inner$renderHub$map$forEach$some$ew(e) {
    const ew = heWords(e);
    return ew;
}
export function inner$renderHub$showChips(roles, L) {
    const effRoles = roles.length ? roles : [{ name: L.all, all: true, ents: [] }];
    const showChips = effRoles.length >= 2;
    return showChips;
}
export function inner$renderHub$showChips$$step(effRoles) {
    const showChips = effRoles.length >= 2;
    return showChips;
}
export function inner$renderHub$visList(screens, roles, L) {
    const effRoles = roles.length ? roles : [{ name: L.all, all: true, ents: [] }];
    const roleVis = effRoles.map((role) => {
        if (role.all)
            return screens.map((_, i) => i);
        const out = [];
        screens.forEach((s, i) => {
            if (s.kind === 'system')
                return; // מסכי-מערכת רק למנהל-על
            if (s.kind === 'dashboard') {
                if (role.ents.some((e) => new RegExp(L.reportKw).test(e)))
                    out.push(i);
                return;
            }
            const nw = heWords(s.name);
            if (role.ents.some((e) => { const ew = heWords(e); return ew.length && ew.every((w) => nw.some((x) => prefixMatch(x, w))); }))
                out.push(i);
        });
        return out;
    });
    const visList = `[${roleVis.map((v) => `[${v.join(', ')}]`).join(', ')}]`;
    return visList;
}
export function inner$renderHub$visList$$step(roleVis) {
    const visList = `[${roleVis.map((v) => `[${v.join(', ')}]`).join(', ')}]`;
    return visList;
}
export function inner$renderHub$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderHub$code(slug, screens, roles, scopeFields, cTitle, cIcon, actorUnion, imports, tiles, roleChips, L) {
    const hasActor = scopeFields.length > 0;
    const actorMethod = hasActor
        ? `\n  Widget _actorBar(BuildContext context) => AnimatedBuilder(\n    animation: appStore,\n    builder: (context, _) {\n      final lk = DsLook.of(context);\n      final opts = <String>{${actorUnion}}.toList()..sort();\n      return Container(\n        margin: const EdgeInsets.only(bottom: 8),\n        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),\n        decoration: BoxDecoration(color: lk.chipBg, borderRadius: BorderRadius.circular(12)),\n        child: Row(children: [\n          Text('${L.viewingAs}', style: TextStyle(fontSize: 12.5, color: lk.muted, fontWeight: FontWeight.w700)),\n          const SizedBox(width: 8),\n          DropdownButton<String>(\n            value: appStore.actor,\n            underline: const SizedBox.shrink(),\n            items: [const DropdownMenuItem<String>(value: '', child: Text('${L.all}')), for (final o in opts) if (o.isNotEmpty) DropdownMenuItem<String>(value: o, child: Text(o))],\n            onChanged: (v) => setState(() => appStore.setActor(v ?? '')),\n          ),\n          const Spacer(),\n          Text('${L.viewFilter}', style: TextStyle(fontSize: 11, color: lk.faint)),\n        ]),\n      );\n    },\n  );\n`
        : '';
    const effRoles = roles.length ? roles : [{ name: L.all, all: true, ents: [] }];
    const roleVis = effRoles.map((role) => {
        if (role.all)
            return screens.map((_, i) => i);
        const out = [];
        screens.forEach((s, i) => {
            if (s.kind === 'system')
                return; // מסכי-מערכת רק למנהל-על
            if (s.kind === 'dashboard') {
                if (role.ents.some((e) => new RegExp(L.reportKw).test(e)))
                    out.push(i);
                return;
            }
            const nw = heWords(s.name);
            if (role.ents.some((e) => { const ew = heWords(e); return ew.length && ew.every((w) => nw.some((x) => prefixMatch(x, w))); }))
                out.push(i);
        });
        return out;
    });
    const showChips = effRoles.length >= 2;
    const visList = `[${roleVis.map((v) => `[${v.join(', ')}]`).join(', ')}]`;
    const cls = pascal(slug);
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — לוח-ניווט + שער-הרשאות (בורר-תפקיד חי · נשמר). אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  import '../dart-ui-bs/ds/ds.dart';
  import '../dart-ui-bs/ds/ds_store.dart';
  ${[...imports].sort().join('\n')}
  import 'package:flutter/material.dart';
  
  class ${cls} extends StatefulWidget {
    const ${cls}({super.key});
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    static const List<List<int>> _vis = ${visList};
  
    List<Widget> _tiles(BuildContext context) => [
  ${tiles.join('\n')}
    ];
  ${actorMethod}${showChips ? `
    Widget _roleChip(BuildContext context, int i, String label) {
      final lk = DsLook.of(context);
      final sel = appStore.role == i;
      return Padding(
        padding: const EdgeInsets.only(left: 8, bottom: 8),
        child: Material(
          color: sel ? lk.accent : (lk.chipBg),
          borderRadius: BorderRadius.circular(20),
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => setState(() => appStore.setRole(i)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Text(label, style: TextStyle(color: sel ? lk.onAccent : lk.muted, fontSize: 13, fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      );
    }
  ` : ''}
    @override
    Widget build(BuildContext context) {
      final all = _tiles(context);
      final vis = _vis[appStore.role.clamp(0, _vis.length - 1)];
      return DsScaffold(
        title: ${cTitle},
        subtitle: '\${vis.length} מסכים גלויים',
        icon: ${cIcon},
        children: [
  ${hasActor ? `        _actorBar(context),
  ` : ''}${showChips ? `        Container(
            margin: const EdgeInsets.only(bottom: 4),
            child: Wrap(children: [${roleChips}]),
          ),
  ` : ''}        for (final i in vis) all[i],
        ],
      );
    }
  }
  `;
    return code;
}
export function inner$renderHub$code$$step(slug, cTitle, cIcon, hasActor, actorMethod, imports, tiles, showChips, visList, roleChips, cls) {
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — לוח-ניווט + שער-הרשאות (בורר-תפקיד חי · נשמר). אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  import '../dart-ui-bs/ds/ds.dart';
  import '../dart-ui-bs/ds/ds_store.dart';
  ${[...imports].sort().join('\n')}
  import 'package:flutter/material.dart';
  
  class ${cls} extends StatefulWidget {
    const ${cls}({super.key});
  
    @override
    State<${cls}> createState() => _${cls}State();
  }
  
  class _${cls}State extends State<${cls}> {
    static const List<List<int>> _vis = ${visList};
  
    List<Widget> _tiles(BuildContext context) => [
  ${tiles.join('\n')}
    ];
  ${actorMethod}${showChips ? `
    Widget _roleChip(BuildContext context, int i, String label) {
      final lk = DsLook.of(context);
      final sel = appStore.role == i;
      return Padding(
        padding: const EdgeInsets.only(left: 8, bottom: 8),
        child: Material(
          color: sel ? lk.accent : (lk.chipBg),
          borderRadius: BorderRadius.circular(20),
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => setState(() => appStore.setRole(i)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Text(label, style: TextStyle(color: sel ? lk.onAccent : lk.muted, fontSize: 13, fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      );
    }
  ` : ''}
    @override
    Widget build(BuildContext context) {
      final all = _tiles(context);
      final vis = _vis[appStore.role.clamp(0, _vis.length - 1)];
      return DsScaffold(
        title: ${cTitle},
        subtitle: '\${vis.length} מסכים גלויים',
        icon: ${cIcon},
        children: [
  ${hasActor ? `        _actorBar(context),
  ` : ''}${showChips ? `        Container(
            margin: const EdgeInsets.only(bottom: 4),
            child: Wrap(children: [${roleChips}]),
          ),
  ` : ''}        for (final i in vis) all[i],
        ],
      );
    }
  }
  `;
    return code;
}
export function inner$renderMain$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderMain$hasEdges(edges) {
    const hasEdges = edges.length > 0;
    return hasEdges;
}
export function inner$renderMain$relSlug(slug) {
    const relSlug = slug.replace(/main$/, '') + 'relations';
    return relSlug;
}
export function inner$renderMain$relCode(slug, regs) {
    const relSlug = slug.replace(/main$/, '') + 'relations';
    const relCode = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — רישום גרף-הקשרים לשלמות-מחיקה. אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${relSlug}_content.dart';
  import '../dart-ui-bs/ds/ds_store.dart';
  
  void registerAppRelations(AppStore s) {
  ${regs}
  }
  `;
    return relCode;
}
export function inner$renderMain$relCode$$step(relSlug, regs) {
    const relCode = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — רישום גרף-הקשרים לשלמות-מחיקה. אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${relSlug}_content.dart';
  import '../dart-ui-bs/ds/ds_store.dart';
  
  void registerAppRelations(AppStore s) {
  ${regs}
  }
  `;
    return relCode;
}
export function inner$renderMain$relImport(slug, edges) {
    const hasEdges = edges.length > 0;
    const relSlug = slug.replace(/main$/, '') + 'relations';
    const relImport = hasEdges ? `import 'gen_${relSlug}.dart';\nimport '../dart-ui-bs/ds/ds_store.dart';\n` : '';
    return relImport;
}
export function inner$renderMain$relImport$$step(hasEdges, relSlug) {
    const relImport = hasEdges ? `import 'gen_${relSlug}.dart';\nimport '../dart-ui-bs/ds/ds_store.dart';\n` : '';
    return relImport;
}
export function inner$renderMain$mainLine(slug, edges) {
    const cls = pascal(slug);
    const hasEdges = edges.length > 0;
    const mainLine = hasEdges ? `void main() { registerAppRelations(appStore); runApp(const ${cls}()); }` : `void main() => runApp(const ${cls}());`;
    return mainLine;
}
export function inner$renderMain$mainLine$$step(cls, hasEdges) {
    const mainLine = hasEdges ? `void main() { registerAppRelations(appStore); runApp(const ${cls}()); }` : `void main() => runApp(const ${cls}());`;
    return mainLine;
}
export function inner$renderMain$code(slug, hubSlug, hubCls, edges, cTitle, paper, sc) {
    const cls = pascal(slug);
    const hasEdges = edges.length > 0;
    const relSlug = slug.replace(/main$/, '') + 'relations';
    const relImport = hasEdges ? `import 'gen_${relSlug}.dart';\nimport '../dart-ui-bs/ds/ds_store.dart';\n` : '';
    const mainLine = hasEdges ? `void main() { registerAppRelations(appStore); runApp(const ${cls}()); }` : `void main() => runApp(const ${cls}());`;
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — שורש-האפליקציה (main + MaterialApp + theme + RTL${paper ? ' + PureScope · עור-נייר (G28)' : ''}). אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  ${paper ? `import '../dart-ui-bs/ds/ds_pure.dart';
  import '../dart-ui-bs/ds/ds_seam.dart';` : `import '../dart-ui-bs/ds/ds.dart';`}
  ${relImport}import 'gen_${hubSlug}.dart';
  import 'package:flutter/material.dart';
  
  ${mainLine}
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) => MaterialApp(
          title: ${cTitle},
          debugShowCheckedModeBanner: false,
  ${paper ? `        theme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.light,
            fontFamily: 'Heebo',
            scaffoldBackgroundColor: DsPure.skins['${sc.skin}']!.canvas,
            colorScheme: ColorScheme.fromSeed(seedColor: DsPure.themes['${sc.theme}']!.a, brightness: Brightness.light),
          ),
          builder: (context, child) => PureScope(
            theme: DsPure.themes['${sc.theme}']!,
            skin: DsPure.skins['${sc.skin}']!,
            fonts: DsPure.fontSets['${sc.fonts}']!,
            child: Directionality(textDirection: TextDirection.rtl, child: child ?? const SizedBox.shrink()),
          ),` : `        theme: ThemeData(
            useMaterial3: true,
            fontFamily: 'Heebo',
            scaffoldBackgroundColor: DsTokens.bg,
            colorScheme: ColorScheme.fromSeed(seedColor: DsTokens.accent),
          ),
          builder: (context, child) => Directionality(
            textDirection: TextDirection.rtl,
            child: child ?? const SizedBox.shrink(),
          ),`}
          home: const ${hubCls}(),
        );
  }
  `;
    return code;
}
export function inner$renderMain$code$$step(slug, hubSlug, hubCls, cTitle, cls, relImport, mainLine, paper, sc) {
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — שורש-האפליקציה (main + MaterialApp + theme + RTL${paper ? ' + PureScope · עור-נייר (G28)' : ''}). אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  ${paper ? `import '../dart-ui-bs/ds/ds_pure.dart';
  import '../dart-ui-bs/ds/ds_seam.dart';` : `import '../dart-ui-bs/ds/ds.dart';`}
  ${relImport}import 'gen_${hubSlug}.dart';
  import 'package:flutter/material.dart';
  
  ${mainLine}
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) => MaterialApp(
          title: ${cTitle},
          debugShowCheckedModeBanner: false,
  ${paper ? `        theme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.light,
            fontFamily: 'Heebo',
            scaffoldBackgroundColor: DsPure.skins['${sc.skin}']!.canvas,
            colorScheme: ColorScheme.fromSeed(seedColor: DsPure.themes['${sc.theme}']!.a, brightness: Brightness.light),
          ),
          builder: (context, child) => PureScope(
            theme: DsPure.themes['${sc.theme}']!,
            skin: DsPure.skins['${sc.skin}']!,
            fonts: DsPure.fontSets['${sc.fonts}']!,
            child: Directionality(textDirection: TextDirection.rtl, child: child ?? const SizedBox.shrink()),
          ),` : `        theme: ThemeData(
            useMaterial3: true,
            fontFamily: 'Heebo',
            scaffoldBackgroundColor: DsTokens.bg,
            colorScheme: ColorScheme.fromSeed(seedColor: DsTokens.accent),
          ),
          builder: (context, child) => Directionality(
            textDirection: TextDirection.rtl,
            child: child ?? const SizedBox.shrink(),
          ),`}
          home: const ${hubCls}(),
        );
  }
  `;
    return code;
}
export function inner$atomCtor$ctor(cls, s) {
    const ctor = s.match(new RegExp('(?:const )?' + cls + '\\(\\{([\\s\\S]*?)\\}\\)'));
    return ctor;
}
export function inner$atomCtor$typeOf$m(s, p) {
    const m = s.match(new RegExp('final ([A-Za-z0-9<>?]+)[^;]*\\b' + p + '\\b[^;]*;'));
    return m;
}
export function inner$_fillStyle$t(ty) {
    const t = (ty || '').replace(/\?$/, '');
    return t;
}
export function inner$_fillStyle$cb(ty) {
    const t = (ty || '').replace(/\?$/, '');
    const cb = _cb(t);
    return cb;
}
export function inner$_fillStyle$cb$$step(t) {
    const cb = _cb(t);
    return cb;
}
export function inner$_candidates$p(ps, bound, spec) {
    const p = ps.find((x) => spec.re.test(x.nm) && (!spec.ty || spec.ty.test(x.ty || '')) && !Object.values(bound).includes(x.nm));
    return p;
}
export function inner$_candidates$rest(roleSpecs, ps) {
    const bound = {};
    let ok = true;
    for (const [role, spec] of Object.entries(roleSpecs)) {
        const p = ps.find((x) => spec.re.test(x.nm) && (!spec.ty || spec.ty.test(x.ty || '')) && !Object.values(bound).includes(x.nm));
        if (!p) {
            ok = false;
            break;
        }
        bound[role] = p.nm;
    }
    const rest = ps.filter((x) => !Object.values(bound).includes(x.nm));
    return rest;
}
export function inner$_candidates$rest$$step(ps, bound) {
    const rest = ps.filter((x) => !Object.values(bound).includes(x.nm));
    return rest;
}
export function inner$_candidates$f(x) {
    const f = _fillStyle(x.ty);
    return f;
}
export function inner$selectVaried$ties(c) {
    const ties = c.filter((x) => x.score === c[0].score);
    return ties;
}
export function inner$renderCompose$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderCompose$seed(entitySlug) {
    const seed = [...entitySlug].reduce((h, c) => h + c.charCodeAt(0), 0);
    return seed;
}
export function inner$renderCompose$extra(kpi) {
    const extra = kpi.fills.length ? ', ' + kpi.fills.join(', ') : '';
    return extra;
}
export function inner$renderCompose$extra_L1179(card) {
    const extra = card.fills.length ? ', ' + card.fills.join(', ') : '';
    return extra;
}
export function inner$renderCompose$extra_L1185(prog) {
    const extra = prog.fills.length ? ', ' + prog.fills.join(', ') : '';
    return extra;
}
export function inner$renderCompose$last(stages) {
    const last = Math.max(0, stages.length - 1);
    return last;
}
export function inner$renderCompose$pctExpr(entitySlug, stages, recsExpr) {
    const last = Math.max(0, stages.length - 1);
    const pctExpr = `appStore.count('${entitySlug}') == 0 ? 0 : (${recsExpr}.where((r) => appStore.stageOf('${entitySlug}', r['__id'] ?? '') >= ${last}).length * 100 ~/ appStore.count('${entitySlug}'))`;
    return pctExpr;
}
export function inner$renderCompose$pctExpr$$step(entitySlug, recsExpr, last) {
    const pctExpr = `appStore.count('${entitySlug}') == 0 ? 0 : (${recsExpr}.where((r) => appStore.stageOf('${entitySlug}', r['__id'] ?? '') >= ${last}).length * 100 ~/ appStore.count('${entitySlug}'))`;
    return pctExpr;
}
export function inner$renderCompose$extra_L1192(trend) {
    const extra = trend.fills.length ? ', ' + trend.fills.join(', ') : '';
    return extra;
}
export function inner$renderCompose$vals(recsExpr, nf) {
    const vals = `${recsExpr}.take(12).map((r) => double.tryParse(r[${nf}] ?? '') ?? 0).toList()`;
    return vals;
}
export function inner$renderCompose$labs(recsExpr, titleF) {
    const labs = `${recsExpr}.take(12).map((r) => r[${titleF}] ?? '').toList()`;
    return labs;
}
export function inner$renderCompose$b(entitySlug, recsExpr, board, stageConsts, titleF) {
    const b = `${board.cls}(${board.p.stages}: const [${stageConsts}], ${board.p.records}: ${recsExpr}, ${board.p.stageOf}: (r) => appStore.stageOf('${entitySlug}', r['__id'] ?? ''), ${board.p.titleOf}: (r) => r[${titleF}] ?? '', ${board.p.onMove}: (id, to) => appStore.setStage('${entitySlug}', id, to))`;
    return b;
}
export function inner$renderCompose$ex(nav) {
    const ex = nav.fills.length ? ', ' + nav.fills.join(', ') : '';
    return ex;
}
export function inner$renderCompose$row(detail, nav, titleF) {
    const ex = nav.fills.length ? ', ' + nav.fills.join(', ') : '';
    const row = `${nav.cls}(${nav.p.label}: (r[${titleF}] ?? '').isEmpty ? (r['__id'] ?? '') : (r[${titleF}] ?? ''), ${nav.p.onTap}: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ${detail.cls}(initialId: r['__id'] ?? '')))${ex})`;
    return row;
}
export function inner$renderCompose$row$$step(detail, nav, ex, titleF) {
    const row = `${nav.cls}(${nav.p.label}: (r[${titleF}] ?? '').isEmpty ? (r['__id'] ?? '') : (r[${titleF}] ?? ''), ${nav.p.onTap}: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ${detail.cls}(initialId: r['__id'] ?? '')))${ex})`;
    return row;
}
export function inner$renderCompose$extra_L1214(tbl) {
    const extra = tbl.fills.length ? ', ' + tbl.fills.join(', ') : '';
    return extra;
}
export function inner$renderCompose$code(slug, imports, blocks) {
    const cls = pascal(slug);
    const code = `// ✨ חולל ע"י מנוע-ההרכבה (render-ds/compose) — אטום+אטום ⇒ מסך-סקירה מורכב מנתוני-הישות. אל תערוך ידנית.
  ${[...imports].join('\n')}
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) => AnimatedBuilder(
          animation: appStore,
          builder: (context, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
            ${blocks.join(',\n          ')},
            ],
          ),
        );
  }
  `;
    return code;
}
export function inner$renderCompose$code$$step(slug, cls, imports, blocks) {
    const code = `// ✨ חולל ע"י מנוע-ההרכבה (render-ds/compose) — אטום+אטום ⇒ מסך-סקירה מורכב מנתוני-הישות. אל תערוך ידנית.
  ${[...imports].join('\n')}
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) => AnimatedBuilder(
          animation: appStore,
          builder: (context, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
            ${blocks.join(',\n          ')},
            ],
          ),
        );
  }
  `;
    return code;
}
export function inner$renderRecordDetail$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderRecordDetail$ex(kpi) {
    const ex = kpi.fills.length ? ', ' + kpi.fills.join(', ') : '';
    return ex;
}
export function inner$renderRecordDetail$imports(slug, kpi) {
    const imports = new Set(["import '../dart-ui-bs/ds/ds.dart';", "import '../dart-ui-bs/ds/ds_store.dart';", "import 'package:flutter/material.dart';", `import '../${kpi.file}';`, `import '../dart-data-bs/auto/gen_${slug}_content.dart';`]);
    return imports;
}
export function inner$_itemField$t(ty) {
    const t = ty.replace(/\?$/, '');
    return t;
}
export function inner$_itemField$cb(ty) {
    const t = ty.replace(/\?$/, '');
    const cb = _cb(t);
    return cb;
}
export function inner$_itemField$cb$$step(t) {
    const cb = _cb(t);
    return cb;
}
export function inner$_scalarFill$t(ty) {
    const t = ty.replace(/\?$/, '');
    return t;
}
export function inner$_scalarFill$cb(ty) {
    const t = ty.replace(/\?$/, '');
    const cb = _cb(t);
    return cb;
}
export function inner$_scalarFill$cb$$step(t) {
    const cb = _cb(t);
    return cb;
}
export function inner$analyzeScreen$cm(s) {
    const cm = s.match(/class ([A-Za-z]+)Composed/);
    return cm;
}
export function inner$analyzeScreen$cls(s) {
    const cm = s.match(/class ([A-Za-z]+)Composed/);
    const cls = cm[1] + 'Composed';
    return cls;
}
export function inner$analyzeScreen$cls$$step(cm) {
    const cls = cm[1] + 'Composed';
    return cls;
}
export function inner$analyzeScreen$ctor(s) {
    const cm = s.match(/class ([A-Za-z]+)Composed/);
    const cls = cm[1] + 'Composed';
    const ctor = s.match(new RegExp('const ' + cls + '\\(\\{([^}]*)\\}\\)'));
    return ctor;
}
export function inner$analyzeScreen$ctor$$step(s, cls) {
    const ctor = s.match(new RegExp('const ' + cls + '\\(\\{([^}]*)\\}\\)'));
    return ctor;
}
export function inner$analyzeScreen$params(s) {
    const cm = s.match(/class ([A-Za-z]+)Composed/);
    const cls = cm[1] + 'Composed';
    const ctor = s.match(new RegExp('const ' + cls + '\\(\\{([^}]*)\\}\\)'));
    const params = [...ctor[1].matchAll(/required this\.([a-zA-Z][a-zA-Z0-9_]*)/g)].map((m) => m[1]);
    return params;
}
export function inner$analyzeScreen$params$$step(ctor) {
    const params = [...ctor[1].matchAll(/required this\.([a-zA-Z][a-zA-Z0-9_]*)/g)].map((m) => m[1]);
    return params;
}
export function inner$analyzeScreen$typeOf$m(s, p) {
    const m = s.match(new RegExp('final ([A-Za-z0-9<>?]+) ' + p + ';'));
    return m;
}
export function inner$analyzeScreen$tokensArgs$body(s, ty) {
    const body = s.match(new RegExp('class ' + ty + ' \\{([\\s\\S]*?)\\n\\}'));
    return body;
}
export function inner$analyzeScreen$tokensArgs$fm(s, ty) {
    const body = s.match(new RegExp('class ' + ty + ' \\{([\\s\\S]*?)\\n\\}'));
    const fm = body ? [...body[1].matchAll(/final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*);/g)] : [];
    return fm;
}
export function inner$analyzeScreen$tokensArgs$fm$$step(body) {
    const fm = body ? [...body[1].matchAll(/final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*);/g)] : [];
    return fm;
}
export function inner$analyzeScreen$tokensArgs$map$t(ty2) {
    const t = ty2.replace(/\?$/, '');
    return t;
}
export function inner$analyzeScreen$tokensArgs$map$sf(ty2, n2) {
    const sf = _scalarFill(ty2, n2);
    return sf;
}
export function inner$analyzeScreen$lm(ty) {
    const lm = ty.match(/^List<([A-Za-z]+)>$/);
    return lm;
}
export function inner$analyzeScreen$body(s, item) {
    const body = s.match(new RegExp('class ' + item + ' \\{([\\s\\S]*?)\\n\\}'));
    return body;
}
export function inner$analyzeScreen$fm(s, item) {
    const body = s.match(new RegExp('class ' + item + ' \\{([\\s\\S]*?)\\n\\}'));
    const fm = body ? [...body[1].matchAll(/final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*);/g)] : [];
    return fm;
}
export function inner$analyzeScreen$fm$$step(body) {
    const fm = body ? [...body[1].matchAll(/final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*);/g)] : [];
    return fm;
}
export function inner$analyzeScreen$names(s, item) {
    const body = s.match(new RegExp('class ' + item + ' \\{([\\s\\S]*?)\\n\\}'));
    const fm = body ? [...body[1].matchAll(/final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*);/g)] : [];
    const names = fm.map((x) => x[2]);
    return names;
}
export function inner$analyzeScreen$names$$step(fm) {
    const names = fm.map((x) => x[2]);
    return names;
}
export function inner$analyzeScreen$dispF(s, item) {
    const body = s.match(new RegExp('class ' + item + ' \\{([\\s\\S]*?)\\n\\}'));
    const fm = body ? [...body[1].matchAll(/final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*);/g)] : [];
    const names = fm.map((x) => x[2]);
    const dispF = names.find((n) => /^(title|label|name|text|value)$/.test(n)) || fm.find(([, t]) => t.replace(/\?$/, '') === 'String')?.[2] || null;
    return dispF;
}
export function inner$analyzeScreen$dispF$$step(fm, names) {
    const dispF = names.find((n) => /^(title|label|name|text|value)$/.test(n)) || fm.find(([, t]) => t.replace(/\?$/, '') === 'String')?.[2] || null;
    return dispF;
}
export function inner$analyzeScreen$args(s, item) {
    const body = s.match(new RegExp('class ' + item + ' \\{([\\s\\S]*?)\\n\\}'));
    const fm = body ? [...body[1].matchAll(/final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*);/g)] : [];
    const names = fm.map((x) => x[2]);
    const dispF = names.find((n) => /^(title|label|name|text|value)$/.test(n)) || fm.find(([, t]) => t.replace(/\?$/, '') === 'String')?.[2] || null;
    const args = fm.map(([, ty2, n2]) => { if (n2 === dispF)
        return `${n2}: DISP`; const e = _itemField(ty2, n2); return e === null ? null : `${n2}: ${e}`; });
    return args;
}
export function inner$analyzeScreen$args$$step(fm, dispF) {
    const args = fm.map(([, ty2, n2]) => { if (n2 === dispF)
        return `${n2}: DISP`; const e = _itemField(ty2, n2); return e === null ? null : `${n2}: ${e}`; });
    return args;
}
export function inner$analyzeScreen$map$e(ty2, n2) {
    const e = _itemField(ty2, n2);
    return e;
}
export function inner$analyzeScreen$sf(p, ty) {
    const sf = _scalarFill(ty, p);
    return sf;
}
export function inner$renderScreenBind$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderScreenBind$itemArgs(spec) {
    const disp = `r.entries.firstWhere((e) => !e.key.startsWith('__') && e.value.trim().isNotEmpty, orElse: () => MapEntry('', r['__id'] ?? '')).value.trim()`;
    const itemArgs = spec.args.map((a) => a.replace(/DISP/g, disp)).join(', ');
    return itemArgs;
}
export function inner$renderScreenBind$primaryFill(spec, recsExpr) {
    const disp = `r.entries.firstWhere((e) => !e.key.startsWith('__') && e.value.trim().isNotEmpty, orElse: () => MapEntry('', r['__id'] ?? '')).value.trim()`;
    const itemArgs = spec.args.map((a) => a.replace(/DISP/g, disp)).join(', ');
    const primaryFill = `${spec.list}: ${recsExpr}.map((r) => ${spec.item}(${itemArgs})).toList()`;
    return primaryFill;
}
export function inner$renderScreenBind$primaryFill$$step(spec, itemArgs, recsExpr) {
    const primaryFill = `${spec.list}: ${recsExpr}.map((r) => ${spec.item}(${itemArgs})).toList()`;
    return primaryFill;
}
export function inner$renderScreenBind$args(spec, recsExpr) {
    const disp = `r.entries.firstWhere((e) => !e.key.startsWith('__') && e.value.trim().isNotEmpty, orElse: () => MapEntry('', r['__id'] ?? '')).value.trim()`;
    const itemArgs = spec.args.map((a) => a.replace(/DISP/g, disp)).join(', ');
    const primaryFill = `${spec.list}: ${recsExpr}.map((r) => ${spec.item}(${itemArgs})).toList()`;
    const args = spec.fills.map((f) => (f === '__PRIMARY__' ? primaryFill : f)).join(',\n          ');
    return args;
}
export function inner$renderScreenBind$args$$step(spec, primaryFill) {
    const args = spec.fills.map((f) => (f === '__PRIMARY__' ? primaryFill : f)).join(',\n          ');
    return args;
}
export function inner$renderScreenBind$dsImport(spec) {
    const dsImport = spec.needsDs ? "import '../dart-ui-bs/ds/ds.dart';\n" : '';
    return dsImport;
}
export function inner$renderScreenBind$contentImport(slug, scopeField) {
    const contentImport = scopeField ? `import '../dart-data-bs/auto/gen_${slug}_content.dart';\n` : '';
    return contentImport;
}
export function inner$renderScreenBind$code(slug, spec, scopeField, recsExpr) {
    const cls = pascal(slug);
    const disp = `r.entries.firstWhere((e) => !e.key.startsWith('__') && e.value.trim().isNotEmpty, orElse: () => MapEntry('', r['__id'] ?? '')).value.trim()`;
    const itemArgs = spec.args.map((a) => a.replace(/DISP/g, disp)).join(', ');
    const primaryFill = `${spec.list}: ${recsExpr}.map((r) => ${spec.item}(${itemArgs})).toList()`;
    const args = spec.fills.map((f) => (f === '__PRIMARY__' ? primaryFill : f)).join(',\n          ');
    const dsImport = spec.needsDs ? "import '../dart-ui-bs/ds/ds.dart';\n" : '';
    const contentImport = scopeField ? `import '../dart-data-bs/auto/gen_${slug}_content.dart';\n` : '';
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — מחבר-ישות-למסך: רשומות-ישות ⇒ מסך-Composed מפורק (סורק-אוטומטי). אל תערוך ידנית.
  import '../dart-screens-bs/${spec.file}';
  import '../dart-ui-bs/ds/ds_store.dart';
  ${dsImport}${contentImport}import 'package:flutter/material.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) => AnimatedBuilder(
          animation: appStore,
          builder: (context, _) => ${spec.cls}(
            ${args},
          ),
        );
  }
  `;
    return code;
}
export function inner$renderScreenBind$code$$step(spec, cls, args, dsImport, contentImport) {
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — מחבר-ישות-למסך: רשומות-ישות ⇒ מסך-Composed מפורק (סורק-אוטומטי). אל תערוך ידנית.
  import '../dart-screens-bs/${spec.file}';
  import '../dart-ui-bs/ds/ds_store.dart';
  ${dsImport}${contentImport}import 'package:flutter/material.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) => AnimatedBuilder(
          animation: appStore,
          builder: (context, _) => ${spec.cls}(
            ${args},
          ),
        );
  }
  `;
    return code;
}
export function inner$renderSystem$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderSystem$code(slug, cTitle, cSub, cIcon, cSection, kids, extraImport) {
    const cls = pascal(slug);
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — מסך-מערכת. אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  import '../dart-ui-bs/ds/ds.dart';
  ${extraImport}import 'package:flutter/material.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) {
      return DsScaffold(
        title: ${cTitle},
        subtitle: ${cSub},
        icon: ${cIcon},
        children: [
          DsSection(title: ${cSection}, children: [
  ${kids.join('\n')}
          ]),
        ],
      );
    }
  }
  `;
    return code;
}
export function inner$renderSystem$code$$step(slug, cTitle, cSub, cIcon, cSection, kids, extraImport, cls) {
    const code = `// ✨ חולל ע"י מנוע-הרינדור (render-ds) — מסך-מערכת. אל תערוך ידנית.
  import '../dart-data-bs/auto/gen_${slug}_content.dart';
  import '../dart-ui-bs/ds/ds.dart';
  ${extraImport}import 'package:flutter/material.dart';
  
  class ${cls} extends StatelessWidget {
    const ${cls}({super.key});
  
    @override
    Widget build(BuildContext context) {
      return DsScaffold(
        title: ${cTitle},
        subtitle: ${cSub},
        icon: ${cIcon},
        children: [
          DsSection(title: ${cSection}, children: [
  ${kids.join('\n')}
          ]),
        ],
      );
    }
  }
  `;
    return code;
}
export function inner$renderWizard$cls(slug) {
    const cls = pascal(slug);
    return cls;
}
export function inner$renderWizard$forEach$forEach$nt(f) {
    const nt = f.inType.replace(/\?$/, '');
    return nt;
}
export function inner$renderWizard$forEach$forEach$arg(t, f) {
    const nt = f.inType.replace(/\?$/, '');
    const arg = nt === 'int' ? `(int.tryParse(_t[${t}] ?? '') ?? 0)`
        : nt === 'double' ? `(double.tryParse(_t[${t}] ?? '') ?? 0)`
            : nt === 'num' ? `(num.tryParse(_t[${t}] ?? '') ?? 0)`
                : `(_t[${t}] ?? '')`;
    return arg;
}
export function inner$renderWizard$forEach$forEach$arg$$step(t, nt) {
    const arg = nt === 'int' ? `(int.tryParse(_t[${t}] ?? '') ?? 0)`
        : nt === 'double' ? `(double.tryParse(_t[${t}] ?? '') ?? 0)`
            : nt === 'num' ? `(num.tryParse(_t[${t}] ?? '') ?? 0)`
                : `(_t[${t}] ?? '')`;
    return arg;
}
export function inner$renderWizard$forEach$forEach$call(t, f) {
    const nt = f.inType.replace(/\?$/, '');
    const arg = nt === 'int' ? `(int.tryParse(_t[${t}] ?? '') ?? 0)`
        : nt === 'double' ? `(double.tryParse(_t[${t}] ?? '') ?? 0)`
            : nt === 'num' ? `(num.tryParse(_t[${t}] ?? '') ?? 0)`
                : `(_t[${t}] ?? '')`;
    const call = `${f.name}(${arg})`;
    return call;
}
export function inner$renderWizard$forEach$forEach$call$$step(f, arg) {
    const call = `${f.name}(${arg})`;
    return call;
}
export function inner$renderWizard$inventions(opts) {
    const inventions = opts.filter((o) => !o.src).length;
    return inventions;
}
export function inner$renderWizard$bodies(stepBodies) {
    const bodies = stepBodies.map((b, i) => `  List<Widget> _s${i}() => [\n${b}\n      ];`).join('\n');
    return bodies;
}
export function inner$renderWizard$cases(stepBodies) {
    const cases = stepBodies.map((_, i) => `      case ${i}: return _s${i}();`).join('\n');
    return cases;
}
export function inner$pickInput$best$$after_loop(INPUTS, q) {
    let best = null;
    let bs = 0;
    for (const w of INPUTS) {
        let s = 0;
        for (const t of q)
            if (w.st.includes(t))
                s++;
        if (s > bs) {
            bs = s;
            best = w;
        }
    }
    return best;
}
export function inner$pickInput$bs$$after_loop(INPUTS, q) {
    let best = null;
    let bs = 0;
    for (const w of INPUTS) {
        let s = 0;
        for (const t of q)
            if (w.st.includes(t))
                s++;
        if (s > bs) {
            bs = s;
            best = w;
        }
    }
    return bs;
}
export function inner$pickInput$s$$after_loop(q, w) {
    let s = 0;
    for (const t of q)
        if (w.st.includes(t))
            s++;
    return s;
}
export function inner$requiredArity$d$$after_loop(sig) {
    const o = sig.indexOf('(');
    let d = 0;
    let n = 0;
    let seen = false;
    for (let i = o + 1; i < sig.length; i++) {
        const c = sig[i];
        if (c === '(' || c === '<')
            d++;
        else if (c === '>')
            d--;
        else if (c === ')') {
            if (d === 0)
                break;
            d--;
        }
        else if (d === 0 && (c === '[' || c === '{'))
            break;
        else if (d === 0 && c === ',')
            n++;
        else if (d === 0 && !/\s/.test(c))
            seen = true;
    }
    return d;
}
export function inner$requiredArity$n$$after_loop(sig) {
    const o = sig.indexOf('(');
    let d = 0;
    let n = 0;
    let seen = false;
    for (let i = o + 1; i < sig.length; i++) {
        const c = sig[i];
        if (c === '(' || c === '<')
            d++;
        else if (c === '>')
            d--;
        else if (c === ')') {
            if (d === 0)
                break;
            d--;
        }
        else if (d === 0 && (c === '[' || c === '{'))
            break;
        else if (d === 0 && c === ',')
            n++;
        else if (d === 0 && !/\s/.test(c))
            seen = true;
    }
    return n;
}
export function inner$requiredArity$seen$$after_loop(sig) {
    const o = sig.indexOf('(');
    let d = 0;
    let n = 0;
    let seen = false;
    for (let i = o + 1; i < sig.length; i++) {
        const c = sig[i];
        if (c === '(' || c === '<')
            d++;
        else if (c === '>')
            d--;
        else if (c === ')') {
            if (d === 0)
                break;
            d--;
        }
        else if (d === 0 && (c === '[' || c === '{'))
            break;
        else if (d === 0 && c === ',')
            n++;
        else if (d === 0 && !/\s/.test(c))
            seen = true;
    }
    return seen;
}
export function inner$compileFormula$d$$after_loop(f0, at, L) {
    let d = 0;
    let j = at + L.fnAbs.length;
    for (; j < f0.length; j++) {
        if (f0[j] === '(')
            d++;
        else if (f0[j] === ')' && --d === 0)
            break;
    }
    return d;
}
export function inner$compileFormula$j$$after_loop(f0, at, L) {
    let d = 0;
    let j = at + L.fnAbs.length;
    for (; j < f0.length; j++) {
        if (f0[j] === '(')
            d++;
        else if (f0[j] === ')' && --d === 0)
            break;
    }
    return j;
}
export function inner$compileFormula$e$$after_loop(labels, f0) {
    const sorted = labels.slice().sort((a, b) => b.label.length - a.label.length);
    let e = ' ' + f0 + ' ';
    for (const f of sorted)
        e = e.split(f.label).join(` @${f.idx}@ `);
    return e;
}
export function inner$renderDashboard$rows$$after_loop(tiles) {
    const rows = [];
    for (let i = 0; i < tiles.length; i += 2) {
        const a = tiles[i], b = tiles[i + 1];
        const second = b ? `Expanded(child: ${b})` : 'const Expanded(child: SizedBox())';
        rows.push(`      Padding(padding: const EdgeInsets.only(bottom: 12), child: IntrinsicHeight(child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Expanded(child: ${a}), const SizedBox(width: 12), ${second}]))),`);
    }
    return rows;
}
export function inner$_candidates$bound$$after_loop(roleSpecs, ps) {
    const bound = {};
    let ok = true;
    for (const [role, spec] of Object.entries(roleSpecs)) {
        const p = ps.find((x) => spec.re.test(x.nm) && (!spec.ty || spec.ty.test(x.ty || '')) && !Object.values(bound).includes(x.nm));
        if (!p) {
            ok = false;
            break;
        }
        bound[role] = p.nm;
    }
    return bound;
}
export function inner$_candidates$ok$$after_loop(roleSpecs, ps) {
    const bound = {};
    let ok = true;
    for (const [role, spec] of Object.entries(roleSpecs)) {
        const p = ps.find((x) => spec.re.test(x.nm) && (!spec.ty || spec.ty.test(x.ty || '')) && !Object.values(bound).includes(x.nm));
        if (!p) {
            ok = false;
            break;
        }
        bound[role] = p.nm;
    }
    return ok;
}
export function inner$_candidates$fills$$after_loop(roleSpecs, ps) {
    const bound = {};
    let ok = true;
    for (const [role, spec] of Object.entries(roleSpecs)) {
        const p = ps.find((x) => spec.re.test(x.nm) && (!spec.ty || spec.ty.test(x.ty || '')) && !Object.values(bound).includes(x.nm));
        if (!p) {
            ok = false;
            break;
        }
        bound[role] = p.nm;
    }
    const rest = ps.filter((x) => !Object.values(bound).includes(x.nm));
    const fills = [];
    let safe = true;
    for (const x of rest) {
        if (!x.req)
            continue; // שקע אופציונלי לא-מחווט ⇒ מושמט (ברירת-Dart)
        const f = _fillStyle(x.ty);
        if (f === null) {
            safe = false;
            break;
        }
        fills.push(`${x.nm}: ${f}`); // required בלבד חייב מילוי; שקע-דאטה-required לא-ממופה ⇒ פסול (לא נזייף)
    }
    return fills;
}
export function inner$_candidates$safe$$after_loop(roleSpecs, ps) {
    const bound = {};
    let ok = true;
    for (const [role, spec] of Object.entries(roleSpecs)) {
        const p = ps.find((x) => spec.re.test(x.nm) && (!spec.ty || spec.ty.test(x.ty || '')) && !Object.values(bound).includes(x.nm));
        if (!p) {
            ok = false;
            break;
        }
        bound[role] = p.nm;
    }
    const rest = ps.filter((x) => !Object.values(bound).includes(x.nm));
    const fills = [];
    let safe = true;
    for (const x of rest) {
        if (!x.req)
            continue; // שקע אופציונלי לא-מחווט ⇒ מושמט (ברירת-Dart)
        const f = _fillStyle(x.ty);
        if (f === null) {
            safe = false;
            break;
        }
        fills.push(`${x.nm}: ${f}`); // required בלבד חייב מילוי; שקע-דאטה-required לא-ממופה ⇒ פסול (לא נזייף)
    }
    return safe;
}

export const SIGS = {
  inner$prefixMatch$m: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$requiredArity$o: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$requiredArity$i: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$requiredArity$i$$step: [{"name":"o","d":{"t":"num"},"opt":false}],
  inner$map$hw: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$injectHelper$t: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$sigParamTypes$m: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$sigParamTypes$map$mm: [{"name":"p","d":{"t":"str"},"opt":false}],
  inner$filter$ps: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$pickXform$fw: [{"name":"label","d":{"t":"any"},"opt":false}],
  inner$makeConsts$k$name: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"consts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$write$filter$m: [{"name":"l","d":{"t":"any"},"opt":false}],
  inner$pickRelation$fw: [{"name":"label","d":{"t":"any"},"opt":false}],
  inner$pickRelation$ew: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$pluralForms$b: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$pluralForms$b2: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$pickMultiRelation$fw: [{"name":"label","d":{"t":"any"},"opt":false}],
  inner$pickMultiRelation$forms: [{"name":"en","d":{"t":"any"},"opt":false}],
  inner$compileFormula$sorted: [{"name":"labels","d":{"t":"any"},"opt":false}],
  inner$compileFormula$f0: [{"name":"formula","d":{"t":"any"},"opt":false}],
  inner$compileFormula$at: [{"name":"f0","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$compileFormula$j: [{"name":"at","d":{"t":"num"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$compileFormula$e: [{"name":"f0","d":{"t":"str"},"opt":false}],
  inner$compileFormula$residue: [{"name":"labels","d":{"t":"any"},"opt":false},{"name":"f0","d":{"t":"str"},"opt":false}],
  inner$compileFormula$residue$$step: [{"name":"e","d":{"t":"str"},"opt":false}],
  inner$compileFormula$dart: [{"name":"labels","d":{"t":"any"},"opt":false},{"name":"f0","d":{"t":"str"},"opt":false}],
  inner$compileFormula$dart$$step: [{"name":"e","d":{"t":"str"},"opt":false}],
  inner$compileRule$m: [{"name":"rule","d":{"t":"any"},"opt":false}],
  inner$compileRule$find$c: [{"name":"labels","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$compileGuard$find$c: [{"name":"labels","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false}],
  inner$compileGuard$m: [{"name":"cond","d":{"t":"any"},"opt":false}],
  inner$compileGuard$rlit: [{"name":"cond","d":{"t":"any"},"opt":false}],
  inner$compileGuard$rlit$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$compileCond$m: [{"name":"formula","d":{"t":"any"},"opt":false}],
  inner$renderEntity$SK: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderEntity$labelIdx: [{"name":"schema","d":{"t":"any"},"opt":false}],
  inner$renderEntity$sigIdx: [{"name":"schema","d":{"t":"any"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$sigOver: [{"name":"schema","d":{"t":"any"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$sigOver$$step: [{"name":"schema","d":{"t":"any"},"opt":false},{"name":"sigIdx","d":{"t":"num"},"opt":false}],
  inner$renderEntity$forEach$bind: [{"name":"i","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$rm: [{"name":"ROLLUP_RE","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$link: [{"name":"ROLLUP_RE","d":{"t":"any"},"opt":false},{"name":"backRefs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$link$$step: [{"name":"backRefs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rm","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$em: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$helpers: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$hz: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$hz$$step: [{"name":"helpers","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$maps: [{"name":"labelIdx","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$maps$$step: [{"name":"labelIdx","d":{"t":"any"},"opt":false},{"name":"em","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$subLines: [{"name":"subs","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$rel: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"entityNames","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$tslug: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"entityNames","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"nameToSlug","d":{"t":"obj","p":[]},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$tslug$$step: [{"name":"nameToSlug","d":{"t":"obj","p":[]},"opt":false},{"name":"rel","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$mrel: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"entityNames","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$mslug: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"entityNames","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"nameToSlug","d":{"t":"obj","p":[]},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$mslug$$step: [{"name":"nameToSlug","d":{"t":"obj","p":[]},"opt":false},{"name":"mrel","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$nt: [{"name":"xf","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$arg: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"xf","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$arg$$step: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"nt","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$call: [{"name":"i","d":{"t":"any"},"opt":false},{"name":"xf","d":{"t":"any"},"opt":false}],
  inner$renderEntity$forEach$call$$step: [{"name":"xf","d":{"t":"any"},"opt":false},{"name":"arg","d":{"t":"str"},"opt":false}],
  inner$renderEntity$reqChecks: [{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"requiredIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$uniqChecks: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"uniqueIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$uniqChecks$$step: [{"name":"SK","d":{"t":"str"},"opt":false},{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"uniqueIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$map$bound: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$renderEntity$validPatterns: [{"name":"patternSpecs","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$hasVal: [{"name":"requiredIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"uniqueIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rangeSpecs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"patternSpecs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ruleSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["li",{"t":"any"},false],["ri",{"t":"any"},false],["op",{"t":"any"},false],["text",{"t":"any"},false]]}]}},"opt":false}],
  inner$renderEntity$hasVal$$step: [{"name":"requiredIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"uniqueIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rangeSpecs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"ruleSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["li",{"t":"any"},false],["ri",{"t":"any"},false],["op",{"t":"any"},false],["text",{"t":"any"},false]]}]}},"opt":false},{"name":"validPatterns","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$defInit: [{"name":"defEntries","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$enumImport: [{"name":"hasEnum","d":{"t":"bool"},"opt":false}],
  inner$renderEntity$hasStages: [{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$stageList: [{"name":"stageConsts","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$renderEntity$stepsDart: [{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"stageConsts","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$renderEntity$stepsDart$$step: [{"name":"hasStages","d":{"t":"bool"},"opt":false},{"name":"stageList","d":{"t":"str"},"opt":false}],
  inner$renderEntity$mapEntries: [{"name":"mapVals","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$editLoad: [{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"subEditLoad","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$recValues: [{"name":"recValsR","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$labelsList: [{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$backFooter: [{"name":"backRefs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"backChips","d":{"t":"str"},"opt":false},{"name":"sigBtn","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$renderEntity$refCount: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderEntity$refCount$$step: [{"name":"SK","d":{"t":"str"},"opt":false}],
  inner$renderEntity$map$t: [{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"g","d":{"t":"any"},"opt":false}],
  inner$renderEntity$hasGuards: [{"name":"guardSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["t",{"t":"num"},false],["c",{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["num",{"t":"any"},false],["ri",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["ri",{"t":"any"},false],["num",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"undef"},true],["num",{"t":"undef"},true],["ri",{"t":"undef"},true]]}]},false],["reason",{"t":"str"},false]]}]}},"opt":false}],
  inner$renderEntity$onStageBody: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"guardSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["t",{"t":"num"},false],["c",{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["num",{"t":"any"},false],["ri",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["ri",{"t":"any"},false],["num",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"undef"},true],["num",{"t":"undef"},true],["ri",{"t":"undef"},true]]}]},false],["reason",{"t":"str"},false]]}]}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$onStageBody$$step: [{"name":"SK","d":{"t":"str"},"opt":false},{"name":"hasGuards","d":{"t":"bool"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$onAdvBody: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"guardSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["t",{"t":"num"},false],["c",{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["num",{"t":"any"},false],["ri",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["ri",{"t":"any"},false],["num",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"undef"},true],["num",{"t":"undef"},true],["ri",{"t":"undef"},true]]}]},false],["reason",{"t":"str"},false]]}]}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$onAdvBody$$step: [{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"SK","d":{"t":"str"},"opt":false},{"name":"hasGuards","d":{"t":"bool"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$stageArgs: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"stageConsts","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"guardSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["t",{"t":"num"},false],["c",{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["num",{"t":"any"},false],["ri",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["ri",{"t":"any"},false],["num",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"undef"},true],["num",{"t":"undef"},true],["ri",{"t":"undef"},true]]}]},false],["reason",{"t":"str"},false]]}]}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$stageArgs$$step: [{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"SK","d":{"t":"str"},"opt":false},{"name":"hasStages","d":{"t":"bool"},"opt":false},{"name":"stageList","d":{"t":"str"},"opt":false},{"name":"onStageBody","d":{"t":"str"},"opt":false},{"name":"onAdvBody","d":{"t":"str"},"opt":false}],
  inner$renderEntity$nRoles: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$hasScope: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$hasHide: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$hasRO: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$roTable: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$roTable$$step: [{"name":"authz","d":{"t":"null"},"opt":false},{"name":"hasRO","d":{"t":"lit","v":[false]},"opt":false}],
  inner$renderEntity$hiddenSetGetter: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$hiddenSetGetter$$step: [{"name":"rlsActive","d":{"t":"lit","v":[false]},"opt":false}],
  inner$renderEntity$rlsFields: [{"name":"authz","d":{"t":"null"},"opt":false},{"name":"scopeTable","d":{"t":"str"},"opt":false},{"name":"hiddenTable","d":{"t":"str"},"opt":false}],
  inner$renderEntity$rlsFields$$step: [{"name":"nRoles","d":{"t":"num"},"opt":false},{"name":"rlsTables","d":{"t":"lit","v":[false]},"opt":false},{"name":"scopeTable","d":{"t":"str"},"opt":false},{"name":"hiddenTable","d":{"t":"str"},"opt":false},{"name":"roTable","d":{"t":"str"},"opt":false},{"name":"hiddenSetGetter","d":{"t":"lit","v":["","\n  Set<int> get _rlsHiddenSet => _rlsHidden[_rlsRole].toSet();"]},"opt":false}],
  inner$renderEntity$fieldsPlain: [{"name":"fieldBlocks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$fieldsGated: [{"name":"authz","d":{"t":"null"},"opt":false},{"name":"fieldBlocks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$fieldsGated$$step: [{"name":"fieldBlocks","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"hasRO","d":{"t":"lit","v":[false]},"opt":false}],
  inner$renderEntity$map$hideG: [{"name":"fb","d":{"t":"any"},"opt":false}],
  inner$renderEntity$map$inner: [{"name":"hasRO","d":{"t":"lit","v":[false]},"opt":false},{"name":"fb","d":{"t":"any"},"opt":false}],
  inner$renderEntity$map$cond: [{"name":"fb","d":{"t":"any"},"opt":false}],
  inner$renderEntity$map$cond$$step: [{"name":"fb","d":{"t":"any"},"opt":false},{"name":"hideG","d":{"t":"str"},"opt":false}],
  inner$renderEntity$formSection: [{"name":"authz","d":{"t":"null"},"opt":false},{"name":"cForm","d":{"t":"str"},"opt":false},{"name":"fieldBlocks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$formSection$$step: [{"name":"cForm","d":{"t":"str"},"opt":false},{"name":"rlsWrite","d":{"t":"lit","v":[false]},"opt":false},{"name":"fieldsPlain","d":{"t":"str"},"opt":false},{"name":"fieldsGated","d":{"t":"str"},"opt":false}],
  inner$renderEntity$listRead0: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$listRead0$$step: [{"name":"SK","d":{"t":"str"},"opt":false},{"name":"hasScope","d":{"t":"lit","v":[false]},"opt":false}],
  inner$renderEntity$listRead: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$listRead$$step: [{"name":"listRead0","d":{"t":"str"},"opt":false}],
  inner$renderEntity$cardSig: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$cardSig$$step: [{"name":"rlsActive","d":{"t":"lit","v":[false]},"opt":false}],
  inner$renderEntity$cardHiddenArg: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$cardHiddenArg$$step: [{"name":"rlsActive","d":{"t":"lit","v":[false]},"opt":false}],
  inner$renderEntity$cardCall: [{"name":"authz","d":{"t":"null"},"opt":false}],
  inner$renderEntity$cardCall$$step: [{"name":"rlsActive","d":{"t":"lit","v":[false]},"opt":false}],
  inner$renderEntity$csvMethod: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"authz","d":{"t":"null"},"opt":false},{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"recValsR","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderEntity$csvMethod$$step: [{"name":"SK","d":{"t":"str"},"opt":false},{"name":"recValues","d":{"t":"str"},"opt":false},{"name":"labelsList","d":{"t":"str"},"opt":false},{"name":"rlsActive","d":{"t":"lit","v":[false]},"opt":false},{"name":"listRead","d":{"t":"str"},"opt":false}],
  inner$renderEntity$relImport: [{"name":"hasRel","d":{"t":"bool"},"opt":false}],
  inner$renderEntity$multiImport: [{"name":"hasMulti","d":{"t":"bool"},"opt":false}],
  inner$renderEntity$hasCal: [{"name":"firstDateConst","d":{"t":"any"},"opt":false}],
  inner$renderEntity$boardImport: [{"name":"hasBoard","d":{"t":"bool"},"opt":false}],
  inner$renderEntity$calImport: [{"name":"firstDateConst","d":{"t":"any"},"opt":false}],
  inner$renderEntity$calImport$$step: [{"name":"hasCal","d":{"t":"bool"},"opt":false}],
  inner$renderEntity$tableImport: [],
  inner$renderEntity$viewField: [{"name":"firstDateConst","d":{"t":"any"},"opt":false},{"name":"hasBoard","d":{"t":"bool"},"opt":false}],
  inner$renderEntity$viewField$$step: [{"name":"hasSwitch","d":{"t":"lit","v":[true]},"opt":false}],
  inner$renderEntity$viewChips: [{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$viewToggle: [{"name":"firstDateConst","d":{"t":"any"},"opt":false},{"name":"hasBoard","d":{"t":"bool"},"opt":false},{"name":"viewChips","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$renderEntity$viewToggle$$step: [{"name":"hasSwitch","d":{"t":"lit","v":[true]},"opt":false},{"name":"viewChips","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$renderEntity$recordsTrailing: [{"name":"firstDateConst","d":{"t":"any"},"opt":false},{"name":"hasBoard","d":{"t":"bool"},"opt":false}],
  inner$renderEntity$recordsTrailing$$step: [{"name":"hasSwitch","d":{"t":"lit","v":[true]},"opt":false}],
  inner$renderEntity$boardBranch: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"recValsR","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"firstDateConst","d":{"t":"any"},"opt":false},{"name":"stageConsts","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"hasBoard","d":{"t":"bool"},"opt":false},{"name":"viewIdx","d":{"t":"obj","p":[["board",{"t":"num"},false],["cal",{"t":"num"},false],["table",{"t":"num"},false]]},"opt":false}],
  inner$renderEntity$boardBranch$$step: [{"name":"SK","d":{"t":"str"},"opt":false},{"name":"firstDateConst","d":{"t":"any"},"opt":false},{"name":"stageList","d":{"t":"str"},"opt":false},{"name":"recValues","d":{"t":"str"},"opt":false},{"name":"labelsList","d":{"t":"str"},"opt":false},{"name":"hasBoard","d":{"t":"bool"},"opt":false},{"name":"hasCal","d":{"t":"bool"},"opt":false},{"name":"viewTitle","d":{"t":"any"},"opt":false},{"name":"viewIdx","d":{"t":"obj","p":[["board",{"t":"num"},false],["cal",{"t":"num"},false],["table",{"t":"num"},false]]},"opt":false}],
  inner$renderEntity$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderEntity$code: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"backRefs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"authz","d":{"t":"null"},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"cSub","d":{"t":"str"},"opt":false},{"name":"cIcon","d":{"t":"str"},"opt":false},{"name":"cSave","d":{"t":"str"},"opt":false},{"name":"cUpdate","d":{"t":"str"},"opt":false},{"name":"cForm","d":{"t":"str"},"opt":false},{"name":"cRecords","d":{"t":"str"},"opt":false},{"name":"cEmpty","d":{"t":"str"},"opt":false},{"name":"cNoMatch","d":{"t":"str"},"opt":false},{"name":"funcImports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"typedImports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fieldBlocks","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"recValsR","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"mapVals","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"requiredIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"uniqueIdx","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"defEntries","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"subEditLoad","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"rangeSpecs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"patternSpecs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"hasLive","d":{"t":"bool"},"opt":false},{"name":"hasRel","d":{"t":"bool"},"opt":false},{"name":"hasEnum","d":{"t":"bool"},"opt":false},{"name":"hasCalc","d":{"t":"bool"},"opt":false},{"name":"hasMulti","d":{"t":"bool"},"opt":false},{"name":"usedField","d":{"t":"bool"},"opt":false},{"name":"firstDateConst","d":{"t":"any"},"opt":false},{"name":"ruleSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["li",{"t":"any"},false],["ri",{"t":"any"},false],["op",{"t":"any"},false],["text",{"t":"any"},false]]}]}},"opt":false},{"name":"ruleChecks","d":{"t":"str"},"opt":false},{"name":"rangeChecks","d":{"t":"str"},"opt":false},{"name":"patternChecks","d":{"t":"str"},"opt":false},{"name":"stageConsts","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"backChips","d":{"t":"str"},"opt":false},{"name":"sigBtn","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false},{"name":"sigMethods","d":{"t":"str"},"opt":false},{"name":"delArgs","d":{"t":"str"},"opt":false},{"name":"guardSpecs","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["t",{"t":"num"},false],["c",{"t":"or","of":[{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["num",{"t":"any"},false],["ri",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"any"},false],["ri",{"t":"any"},false],["num",{"t":"undef"},true]]},{"t":"obj","p":[["kind",{"t":"str"},false],["li",{"t":"any"},false],["op",{"t":"undef"},true],["num",{"t":"undef"},true],["ri",{"t":"undef"},true]]}]},false],["reason",{"t":"str"},false]]}]}},"opt":false},{"name":"guardMethod","d":{"t":"str"},"opt":false},{"name":"scopeTable","d":{"t":"str"},"opt":false},{"name":"hiddenTable","d":{"t":"str"},"opt":false},{"name":"kpiStrip","d":{"t":"str"},"opt":false},{"name":"hasBoard","d":{"t":"bool"},"opt":false},{"name":"viewChips","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"viewIdx","d":{"t":"obj","p":[["board",{"t":"num"},false],["cal",{"t":"num"},false],["table",{"t":"num"},false]]},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderEntity$code$$step: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"backRefs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"cSub","d":{"t":"str"},"opt":false},{"name":"cIcon","d":{"t":"str"},"opt":false},{"name":"cSave","d":{"t":"str"},"opt":false},{"name":"cUpdate","d":{"t":"str"},"opt":false},{"name":"cRecords","d":{"t":"str"},"opt":false},{"name":"cEmpty","d":{"t":"str"},"opt":false},{"name":"cNoMatch","d":{"t":"str"},"opt":false},{"name":"SK","d":{"t":"str"},"opt":false},{"name":"funcImports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"typedImports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"labelConst","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"hasLive","d":{"t":"bool"},"opt":false},{"name":"hasCalc","d":{"t":"bool"},"opt":false},{"name":"usedField","d":{"t":"bool"},"opt":false},{"name":"reqChecks","d":{"t":"str"},"opt":false},{"name":"uniqChecks","d":{"t":"str"},"opt":false},{"name":"ruleChecks","d":{"t":"str"},"opt":false},{"name":"rangeChecks","d":{"t":"str"},"opt":false},{"name":"patternChecks","d":{"t":"str"},"opt":false},{"name":"hasVal","d":{"t":"bool"},"opt":false},{"name":"defInit","d":{"t":"str"},"opt":false},{"name":"enumImport","d":{"t":"lit","v":["","import '../dart-ui-bs/ds/ds_enum_field.dart';\n"]},"opt":false},{"name":"hasStages","d":{"t":"bool"},"opt":false},{"name":"stepsDart","d":{"t":"str"},"opt":false},{"name":"mapEntries","d":{"t":"str"},"opt":false},{"name":"editLoad","d":{"t":"str"},"opt":false},{"name":"recValues","d":{"t":"str"},"opt":false},{"name":"labelsList","d":{"t":"str"},"opt":false},{"name":"backFooter","d":{"t":"str"},"opt":false},{"name":"sigMethods","d":{"t":"str"},"opt":false},{"name":"delArgs","d":{"t":"str"},"opt":false},{"name":"guardMethod","d":{"t":"str"},"opt":false},{"name":"stageArgs","d":{"t":"str"},"opt":false},{"name":"rlsFields","d":{"t":"str"},"opt":false},{"name":"formSection","d":{"t":"str"},"opt":false},{"name":"kpiStrip","d":{"t":"str"},"opt":false},{"name":"listRead","d":{"t":"str"},"opt":false},{"name":"cardSig","d":{"t":"lit","v":["Widget _card(Map<String, String> r, Set<int> hidden) {","Widget _card(Map<String, String> r) {"]},"opt":false},{"name":"cardHiddenArg","d":{"t":"lit","v":["",", hidden: hidden"]},"opt":false},{"name":"cardCall","d":{"t":"lit","v":["_card(rs[i], _rlsHiddenSet)","_card(rs[i])"]},"opt":false},{"name":"csvMethod","d":{"t":"str"},"opt":false},{"name":"relImport","d":{"t":"lit","v":["","import '../dart-ui-bs/ds/ds_select.dart';\n"]},"opt":false},{"name":"multiImport","d":{"t":"lit","v":["","import '../dart-ui-bs/ds/ds_multi_select.dart';\n"]},"opt":false},{"name":"boardImport","d":{"t":"lit","v":["","import '../dart-ui-bs/ds/ds_board.dart';\n"]},"opt":false},{"name":"calImport","d":{"t":"lit","v":["","import '../dart-ui-bs/ds/ds_calendar.dart';\n"]},"opt":false},{"name":"tableImport","d":{"t":"lit","v":["","import '../dart-ui-bs/ds/ds_table.dart';\n"]},"opt":false},{"name":"viewField","d":{"t":"lit","v":["","  int _view = 0;   // 0=רשימה · לוח · לוח-שנה · טבלה\n"]},"opt":false},{"name":"viewToggle","d":{"t":"str"},"opt":false},{"name":"recordsTrailing","d":{"t":"lit","v":["Row(mainAxisSize: MainAxisSize.min, children: [_viewBar(context), const SizedBox(width: 8), _csvBtn(context)])","_csvBtn(context)"]},"opt":false},{"name":"boardBranch","d":{"t":"str"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderDashboard$mw: [{"name":"metrics","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderDashboard$picked: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"metrics","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderDashboard$picked$$step: [{"name":"entities","d":{"t":"any"},"opt":false},{"name":"mw","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$renderDashboard$disp: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"num","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderDashboard$countTile$ops: [{"name":"purpose","d":{"t":"null"},"opt":false},{"name":"PSAK_KIND","d":{"t":"obj","p":[["fact",{"t":"str"},false],["shiur",{"t":"str"},false]]},"opt":false}],
  inner$renderDashboard$num: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$renderDashboard$num_L846: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$renderDashboard$b: [{"name":"tiles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$renderDashboard$second: [{"name":"tiles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$renderDashboard$second$$step: [{"name":"b","d":{"t":"str"},"opt":false}],
  inner$renderDashboard$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderHub$hasActor: [{"name":"scopeFields","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderHub$actorMethod: [{"name":"scopeFields","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"actorUnion","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$actorMethod$$step: [{"name":"hasActor","d":{"t":"bool"},"opt":false},{"name":"actorUnion","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$effRoles: [{"name":"roles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$roleVis: [{"name":"screens","d":{"t":"any"},"opt":false},{"name":"roles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$roleVis$$step: [{"name":"screens","d":{"t":"any"},"opt":false},{"name":"effRoles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$map$forEach$nw: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderHub$map$forEach$some$ew: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$renderHub$showChips: [{"name":"roles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$showChips$$step: [{"name":"effRoles","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderHub$visList: [{"name":"screens","d":{"t":"any"},"opt":false},{"name":"roles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$visList$$step: [{"name":"roleVis","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderHub$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderHub$code: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"screens","d":{"t":"any"},"opt":false},{"name":"roles","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"scopeFields","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"cIcon","d":{"t":"str"},"opt":false},{"name":"actorUnion","d":{"t":"str"},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"tiles","d":{"t":"any"},"opt":false},{"name":"roleChips","d":{"t":"str"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$renderHub$code$$step: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"cIcon","d":{"t":"str"},"opt":false},{"name":"hasActor","d":{"t":"bool"},"opt":false},{"name":"actorMethod","d":{"t":"str"},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"tiles","d":{"t":"any"},"opt":false},{"name":"showChips","d":{"t":"bool"},"opt":false},{"name":"visList","d":{"t":"str"},"opt":false},{"name":"roleChips","d":{"t":"str"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false}],
  inner$renderMain$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderMain$hasEdges: [{"name":"edges","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderMain$relSlug: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderMain$relCode: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"regs","d":{"t":"str"},"opt":false}],
  inner$renderMain$relCode$$step: [{"name":"relSlug","d":{"t":"str"},"opt":false},{"name":"regs","d":{"t":"str"},"opt":false}],
  inner$renderMain$relImport: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"edges","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderMain$relImport$$step: [{"name":"hasEdges","d":{"t":"bool"},"opt":false},{"name":"relSlug","d":{"t":"str"},"opt":false}],
  inner$renderMain$mainLine: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"edges","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderMain$mainLine$$step: [{"name":"cls","d":{"t":"str"},"opt":false},{"name":"hasEdges","d":{"t":"bool"},"opt":false}],
  inner$renderMain$code: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"hubSlug","d":{"t":"any"},"opt":false},{"name":"hubCls","d":{"t":"any"},"opt":false},{"name":"edges","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"paper","d":{"t":"bool"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false}],
  inner$renderMain$code$$step: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"hubSlug","d":{"t":"any"},"opt":false},{"name":"hubCls","d":{"t":"any"},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"relImport","d":{"t":"str"},"opt":false},{"name":"mainLine","d":{"t":"str"},"opt":false},{"name":"paper","d":{"t":"bool"},"opt":false},{"name":"sc","d":{"t":"any"},"opt":false}],
  inner$atomCtor$ctor: [{"name":"cls","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$atomCtor$typeOf$m: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$_fillStyle$t: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$_fillStyle$cb: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$_fillStyle$cb$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$_candidates$p: [{"name":"ps","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]}}]},"opt":false},{"name":"bound","d":{"t":"obj","n":"bound","p":[]},"opt":false},{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$_candidates$rest: [{"name":"roleSpecs","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]}}]},"opt":false}],
  inner$_candidates$rest$$step: [{"name":"ps","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]}}]},"opt":false},{"name":"bound","d":{"t":"obj","n":"bound","p":[]},"opt":false}],
  inner$_candidates$f: [{"name":"x","d":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]},"opt":false}],
  inner$selectVaried$ties: [{"name":"c","d":{"t":"arr","of":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}},"opt":false}],
  inner$renderCompose$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderCompose$seed: [{"name":"entitySlug","d":{"t":"any"},"opt":false}],
  inner$renderCompose$extra: [{"name":"kpi","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false}],
  inner$renderCompose$extra_L1179: [{"name":"card","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false}],
  inner$renderCompose$extra_L1185: [{"name":"prog","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false}],
  inner$renderCompose$last: [{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderCompose$pctExpr: [{"name":"entitySlug","d":{"t":"any"},"opt":false},{"name":"stages","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"recsExpr","d":{"t":"str"},"opt":false}],
  inner$renderCompose$pctExpr$$step: [{"name":"entitySlug","d":{"t":"any"},"opt":false},{"name":"recsExpr","d":{"t":"str"},"opt":false},{"name":"last","d":{"t":"num"},"opt":false}],
  inner$renderCompose$extra_L1192: [{"name":"trend","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false}],
  inner$renderCompose$vals: [{"name":"recsExpr","d":{"t":"str"},"opt":false},{"name":"nf","d":{"t":"str"},"opt":false}],
  inner$renderCompose$labs: [{"name":"recsExpr","d":{"t":"str"},"opt":false},{"name":"titleF","d":{"t":"str"},"opt":false}],
  inner$renderCompose$b: [{"name":"entitySlug","d":{"t":"any"},"opt":false},{"name":"recsExpr","d":{"t":"str"},"opt":false},{"name":"board","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false},{"name":"stageConsts","d":{"t":"str"},"opt":false},{"name":"titleF","d":{"t":"str"},"opt":false}],
  inner$renderCompose$ex: [{"name":"nav","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false}],
  inner$renderCompose$row: [{"name":"detail","d":{"t":"null"},"opt":false},{"name":"nav","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false},{"name":"titleF","d":{"t":"str"},"opt":false}],
  inner$renderCompose$row$$step: [{"name":"detail","d":{"t":"null"},"opt":false},{"name":"nav","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false},{"name":"ex","d":{"t":"str"},"opt":false},{"name":"titleF","d":{"t":"str"},"opt":false}],
  inner$renderCompose$extra_L1214: [{"name":"tbl","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]}]},"opt":false}],
  inner$renderCompose$code: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"blocks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderCompose$code$$step: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"imports","d":{"t":"set","of":{"t":"str"}},"opt":false},{"name":"blocks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderRecordDetail$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderRecordDetail$ex: [{"name":"kpi","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false}],
  inner$renderRecordDetail$imports: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"kpi","d":{"t":"obj","p":[["cls",{"t":"any"},false],["file",{"t":"any"},false],["p",{"t":"obj","n":"bound","p":[]},false],["fills",{"t":"arr","of":{"t":"str"}},false],["score",{"t":"num"},false]]},"opt":false}],
  inner$_itemField$t: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$_itemField$cb: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$_itemField$cb$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$_scalarFill$t: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$_scalarFill$cb: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$_scalarFill$cb$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$cm: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$cls: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$cls$$step: [{"name":"cm","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$ctor: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$ctor$$step: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false}],
  inner$analyzeScreen$params: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$params$$step: [{"name":"ctor","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$typeOf$m: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$tokensArgs$body: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$tokensArgs$fm: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$tokensArgs$fm$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$tokensArgs$map$t: [{"name":"ty2","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$tokensArgs$map$sf: [{"name":"ty2","d":{"t":"any"},"opt":false},{"name":"n2","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$lm: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$body: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$fm: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$fm$$step: [{"name":"body","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$names: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$names$$step: [{"name":"fm","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$analyzeScreen$dispF: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$dispF$$step: [{"name":"fm","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"names","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$analyzeScreen$args: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$args$$step: [{"name":"fm","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"dispF","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$map$e: [{"name":"ty2","d":{"t":"any"},"opt":false},{"name":"n2","d":{"t":"any"},"opt":false}],
  inner$analyzeScreen$sf: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$renderScreenBind$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderScreenBind$itemArgs: [{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$renderScreenBind$primaryFill: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"recsExpr","d":{"t":"str"},"opt":false}],
  inner$renderScreenBind$primaryFill$$step: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"itemArgs","d":{"t":"any"},"opt":false},{"name":"recsExpr","d":{"t":"str"},"opt":false}],
  inner$renderScreenBind$args: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"recsExpr","d":{"t":"str"},"opt":false}],
  inner$renderScreenBind$args$$step: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"primaryFill","d":{"t":"str"},"opt":false}],
  inner$renderScreenBind$dsImport: [{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$renderScreenBind$contentImport: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"scopeField","d":{"t":"null"},"opt":false}],
  inner$renderScreenBind$code: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"any"},"opt":false},{"name":"scopeField","d":{"t":"null"},"opt":false},{"name":"recsExpr","d":{"t":"str"},"opt":false}],
  inner$renderScreenBind$code$$step: [{"name":"spec","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false},{"name":"args","d":{"t":"any"},"opt":false},{"name":"dsImport","d":{"t":"lit","v":["","import '../dart-ui-bs/ds/ds.dart';\n"]},"opt":false},{"name":"contentImport","d":{"t":"str"},"opt":false}],
  inner$renderSystem$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderSystem$code: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"cSub","d":{"t":"str"},"opt":false},{"name":"cIcon","d":{"t":"str"},"opt":false},{"name":"cSection","d":{"t":"str"},"opt":false},{"name":"kids","d":{"t":"any"},"opt":false},{"name":"extraImport","d":{"t":"str"},"opt":false}],
  inner$renderSystem$code$$step: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cTitle","d":{"t":"str"},"opt":false},{"name":"cSub","d":{"t":"str"},"opt":false},{"name":"cIcon","d":{"t":"str"},"opt":false},{"name":"cSection","d":{"t":"str"},"opt":false},{"name":"kids","d":{"t":"any"},"opt":false},{"name":"extraImport","d":{"t":"str"},"opt":false},{"name":"cls","d":{"t":"str"},"opt":false}],
  inner$renderWizard$cls: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$renderWizard$forEach$forEach$nt: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$renderWizard$forEach$forEach$arg: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$renderWizard$forEach$forEach$arg$$step: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"nt","d":{"t":"any"},"opt":false}],
  inner$renderWizard$forEach$forEach$call: [{"name":"t","d":{"t":"num"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$renderWizard$forEach$forEach$call$$step: [{"name":"f","d":{"t":"any"},"opt":false},{"name":"arg","d":{"t":"str"},"opt":false}],
  inner$renderWizard$inventions: [{"name":"opts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderWizard$bodies: [{"name":"stepBodies","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$renderWizard$cases: [{"name":"stepBodies","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$pickInput$best$$after_loop: [{"name":"INPUTS","d":{"t":"any"},"opt":false},{"name":"q","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$pickInput$bs$$after_loop: [{"name":"INPUTS","d":{"t":"any"},"opt":false},{"name":"q","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$pickInput$s$$after_loop: [{"name":"q","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"w","d":{"t":"any"},"opt":false}],
  inner$requiredArity$d$$after_loop: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$requiredArity$n$$after_loop: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$requiredArity$seen$$after_loop: [{"name":"sig","d":{"t":"any"},"opt":false}],
  inner$compileFormula$d$$after_loop: [{"name":"f0","d":{"t":"str"},"opt":false},{"name":"at","d":{"t":"num"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$compileFormula$j$$after_loop: [{"name":"f0","d":{"t":"str"},"opt":false},{"name":"at","d":{"t":"num"},"opt":false},{"name":"L","d":{"t":"any"},"opt":false}],
  inner$compileFormula$e$$after_loop: [{"name":"labels","d":{"t":"any"},"opt":false},{"name":"f0","d":{"t":"str"},"opt":false}],
  inner$renderDashboard$rows$$after_loop: [{"name":"tiles","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$_candidates$bound$$after_loop: [{"name":"roleSpecs","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]}}]},"opt":false}],
  inner$_candidates$ok$$after_loop: [{"name":"roleSpecs","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]}}]},"opt":false}],
  inner$_candidates$fills$$after_loop: [{"name":"roleSpecs","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]}}]},"opt":false}],
  inner$_candidates$safe$$after_loop: [{"name":"roleSpecs","d":{"t":"any"},"opt":false},{"name":"ps","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","p":[["nm",{"t":"any"},false],["ty",{"t":"any"},false],["req",{"t":"bool"},false]]}}]},"opt":false}],
};
