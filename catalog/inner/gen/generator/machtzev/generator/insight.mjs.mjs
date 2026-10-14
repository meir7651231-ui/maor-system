// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/insight.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$emitInsight$said(live, words) {
    const said = words || `${live.field} ${live.op} ${live.n}`;
    return said;
}
export function inner$emitInsight$manifest(slug, cls, name, live, entity, KIND) {
    const manifest = { key: live.kind === 'levels' ? `levelsOverSet·count` : `predicateOverSet·${live.kind || 'num'}${live.agg ? '·' + live.agg : ''}${live.by ? '·by' : ''}${live.pre && live.pre.length ? '·and' + live.pre.length : ''}${live.alt && live.alt.length ? '·or' + live.alt.length : ''}·${live.op}`, slug, cls, shape: 'predicateOverSet', purpose: name, kind: KIND.shiur, source: { entity: entity.name, field: live.field, op: live.op, n: live.n }, ops: [], flow: [] };
    return manifest;
}
export function inner$emitInsight$descField(live, entity, grouped) {
    const descField = grouped ? live.by : (entity.fields[0] || live.field);
    return descField;
}
export function inner$emitInsight$pick$first(prior, op) {
    const first = prior ? prior.ops.filter((o) => o.op === op && o.atom).map((o) => o.atom) : [];
    return first;
}
export function inner$emitInsight$pick$file(sy) {
    const file = `gen_synth_${sy.cls.toLowerCase()}.dart`;
    return file;
}
export function inner$emitInsight$aggStr(isSet) {
    const aggStr = isSet ? "(agg.isNaN ? '' : (agg * 10).round() / 10).toString()" : null;
    return aggStr;
}
export function inner$emitInsight$resolve$fr(op, G) {
    const fr = (G.fragments || G).filter((f) => (f.ops || []).includes(op));
    return fr;
}
export function inner$emitInsight$missing(manifest) {
    const missing = manifest.ops.filter((o) => !o.atom).map((o) => o.op).filter((op, i, a) => a.indexOf(op) === i);
    return missing;
}
export function inner$emitInsight$texts(expect) {
    const texts = [String(expect.count), ...expect.rows.flat()].filter((t) => t && String(t).trim());
    return texts;
}
export function inner$emitInsight$resolve$byMod$$after_loop(op, G) {
    const fr = (G.fragments || G).filter((f) => (f.ops || []).includes(op));
    const byMod = {};
    for (const f of fr)
        byMod[f.module] = (byMod[f.module] || 0) + 1;
    return byMod;
}

export const SIGS = {
  inner$emitInsight$said: [{"name":"live","d":{"t":"any"},"opt":false},{"name":"words","d":{"t":"null"},"opt":false}],
  inner$emitInsight$manifest: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"live","d":{"t":"any"},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false},{"name":"KIND","d":{"t":"obj","p":[["fact",{"t":"str"},false],["shiur",{"t":"str"},false]]},"opt":false}],
  inner$emitInsight$descField: [{"name":"live","d":{"t":"any"},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false},{"name":"grouped","d":{"t":"bool"},"opt":false}],
  inner$emitInsight$pick$first: [{"name":"prior","d":{"t":"any"},"opt":false},{"name":"op","d":{"t":"any"},"opt":false}],
  inner$emitInsight$pick$file: [{"name":"sy","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["cls",{"t":"null"},false],["role",{"t":"any"},false],["tried",{"t":"num"},false],["fit",{"t":"num"},false],["best",{"t":"or","of":[{"t":"null"},{"t":"num"}]},false],["ms",{"t":"num"},false],["why",{"t":"str"},false]]},{"t":"obj","p":[["role",{"t":"any"},false],["tried",{"t":"num"},false],["fit",{"t":"num"},false],["ms",{"t":"num"},false],["cls",{"t":"str"},false],["file",{"t":"str"},false],["html",{"t":"str"},false],["atom",{"t":"obj","p":[["family",{"t":"any"},false],["cls",{"t":"str"},false],["file",{"t":"str"},false],["seam",{"t":"any"},false],["states",{"t":"bool"},false],["stateIds",{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"any"}}]},false],["fieldSlots",{"t":"num"},false],["fieldDemo",{"t":"arr","of":{"t":"any"}},false],["sig",{"t":"obj","p":[["root",{"t":"obj","p":[["tag",{"t":"any"},false],["decorated",{"t":"bool"},false],["interactive",{"t":"bool"},false],["dir",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false]]},false],["svg",{"t":"bool"},false],["input",{"t":"any"},false],["series",{"t":"any"},false],["fills",{"t":"any"},false],["slots",{"t":"arr","of":{"t":"undef"}},false],["numEmph",{"t":"num"},false]]},false],["child",{"t":"bool"},false],["bare",{"t":"bool"},false],["control",{"t":"bool"},false],["actions",{"t":"num"},false],["items",{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["slots",{"t":"num"},false],["demo",{"t":"num"},false],["selectable",{"t":"bool"},false],["selected",{"t":"bool"},false],["cells",{"t":"num"},false],["variants",{"t":"null"},false]]}]},false],["columns",{"t":"any"},false],["values",{"t":"num"},false]]},false],["score",{"t":"num"},false],["src",{"t":"str"},false],["best",{"t":"undef"},true],["why",{"t":"undef"},true]]}]},"opt":false}],
  inner$emitInsight$aggStr: [{"name":"isSet","d":{"t":"bool"},"opt":false}],
  inner$emitInsight$resolve$fr: [{"name":"op","d":{"t":"any"},"opt":false},{"name":"G","d":{"t":"any"},"opt":false}],
  inner$emitInsight$missing: [{"name":"manifest","d":{"t":"obj","p":[["key",{"t":"str"},false],["slug",{"t":"any"},false],["cls",{"t":"any"},false],["shape",{"t":"str"},false],["purpose",{"t":"any"},false],["kind",{"t":"str"},false],["source",{"t":"obj","p":[["entity",{"t":"any"},false],["field",{"t":"any"},false],["op",{"t":"any"},false],["n",{"t":"any"},false]]},false],["ops",{"t":"arr","of":{"t":"undef"}},false],["flow",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$emitInsight$texts: [{"name":"expect","d":{"t":"null"},"opt":false}],
  inner$emitInsight$resolve$byMod$$after_loop: [{"name":"op","d":{"t":"any"},"opt":false},{"name":"G","d":{"t":"any"},"opt":false}],
};
