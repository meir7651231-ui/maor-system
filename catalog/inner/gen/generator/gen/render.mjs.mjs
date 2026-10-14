// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/render.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jstr = (v) => JSON.stringify(v).replace(/<\//g, '<\\/');
function inlineAtom(a) {
    const src = a.src;
    const pure = a.fn;
    const wrap = a.hasT
        ? `const ${pure}__T = ${jstr(a.T ?? {})};\nconst ${pure}__call = (...x) => ${pure}(...x, ...Array(Math.max(0, ${a.n} - x.length)).fill(undefined), ${pure}__T);`
        : `const ${pure}__call = (...x) => ${pure}(...x);`;
    return `// ── אטום ${a.name} (${a.file})\n${src.trim()}\n${wrap}`;
}
export function inner$inlineAtom$wrap(a, pure) {
    const wrap = a.hasT
        ? `const ${pure}__T = ${jstr(a.T ?? {})};\nconst ${pure}__call = (...x) => ${pure}(...x, ...Array(Math.max(0, ${a.n} - x.length)).fill(undefined), ${pure}__T);`
        : `const ${pure}__call = (...x) => ${pure}(...x);`;
    return wrap;
}
export function inner$renderApp$atoms(chosen) {
    const atoms = [...new Set([...chosen.values()])];
    return atoms;
}
export function inner$renderApp$atomJs(chosen) {
    const atoms = [...new Set([...chosen.values()])];
    const atomJs = atoms.map(inlineAtom).join('\n\n');
    return atomJs;
}
export function inner$renderApp$atomJs$$step(atoms) {
    const atomJs = atoms.map(inlineAtom).join('\n\n');
    return atomJs;
}
export function inner$renderApp$map$ekey(ei) {
    const ekey = 'e' + ei;
    return ekey;
}
export function inner$renderApp$kpiHtml(plan) {
    const kpiHtml = plan.filter((p) => p.kind === 'kpi').map((p, i) => `<div class="kpi" id="kpi${i}"><bdi class="v">—</bdi><span class="l">${esc(p.label)}</span></div>`).join('');
    return kpiHtml;
}
export function inner$renderApp$hasSearch(plan) {
    const hasSearch = plan.some((p) => p.kind === 'search');
    return hasSearch;
}
export function inner$renderApp$schema(spec) {
    const schema = spec.entities.map((e) => ({ name: e.name, stages: e.stages || [], guards: e.guards || [], forbidden: e.forbidden || [], fix: e.fix || null, fields: e.fields.map((f) => ({ name: f.name, shape: f.shape, required: f.required, formula: f.formula || null, ref: f.ref ? spec.entities.findIndex((x) => x.name === f.ref) : -1 })) }));
    return schema;
}

export const SIGS = {
  inner$inlineAtom$wrap: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"pure","d":{"t":"any"},"opt":false}],
  inner$renderApp$atoms: [{"name":"chosen","d":{"t":"any"},"opt":false}],
  inner$renderApp$atomJs: [{"name":"chosen","d":{"t":"any"},"opt":false}],
  inner$renderApp$atomJs$$step: [{"name":"atoms","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$renderApp$map$ekey: [{"name":"ei","d":{"t":"any"},"opt":false}],
  inner$renderApp$kpiHtml: [{"name":"plan","d":{"t":"any"},"opt":false}],
  inner$renderApp$hasSearch: [{"name":"plan","d":{"t":"any"},"opt":false}],
  inner$renderApp$schema: [{"name":"spec","d":{"t":"any"},"opt":false}],
};
