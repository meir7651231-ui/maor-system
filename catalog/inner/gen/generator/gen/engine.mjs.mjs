// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/engine.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$runGenerator$needById(NEEDS) {
    const needById = Object.fromEntries(NEEDS.map((n) => [n.id, n]));
    return needById;
}
export function inner$runGenerator$needIds(plan) {
    const needIds = [...new Set(plan.map((p) => p.needId))];
    return needIds;
}
export function inner$runGenerator$report(specText, inventory, sentence, spec, plan, chosen, proofs, meta) {
    const report = { app: spec.app, spec: specText, sentence, entities: spec.entities, dashboard: spec.dashboard, roles: spec.roles || [], plan, proofs,
        atoms: [...new Set([...chosen.values()])].map((a) => ({ name: a.name, fn: a.fn, n: a.n, hasT: a.hasT, role: a.role, file: a.file, src: a.src })),
        unproven: proofs.filter((p) => !p.chosen).map((p) => p.need), inventory, meta };
    return report;
}
export function inner$runGenerator$why$$after_loop(r) {
    const why = {};
    for (const f of r.failed)
        why[f.why] = (why[f.why] ?? 0) + 1;
    return why;
}
export function inner$runGenerator$dw$$after_loop(d) {
    const dw = {};
    for (const f of d.failed || [])
        dw[f.why] = (dw[f.why] ?? 0) + 1;
    return dw;
}

export const SIGS = {
  inner$runGenerator$needById: [{"name":"NEEDS","d":{"t":"any"},"opt":false}],
  inner$runGenerator$needIds: [{"name":"plan","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["needId",{"t":"any"},false],["entity",{"t":"any"},false],["field",{"t":"any"},false],["kind",{"t":"str"},false],["label",{"t":"str"},false],["op",{"t":"undef"},true]]},{"t":"obj","p":[["needId",{"t":"any"},false],["op",{"t":"any"},false],["entity",{"t":"any"},false],["field",{"t":"any"},false],["kind",{"t":"str"},false],["label",{"t":"str"},false]]}]}},"opt":false}],
  inner$runGenerator$report: [{"name":"specText","d":{"t":"any"},"opt":false},{"name":"inventory","d":{"t":"null"},"opt":false},{"name":"sentence","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"obj","p":[["app",{"t":"str"},false],["entities",{"t":"arr","of":{"t":"undef"}},false],["dashboard",{"t":"arr","of":{"t":"undef"}},false],["roles",{"t":"arr","of":{"t":"undef"}},false],["lines",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"plan","d":{"t":"arr","of":{"t":"or","of":[{"t":"obj","p":[["needId",{"t":"any"},false],["entity",{"t":"any"},false],["field",{"t":"any"},false],["kind",{"t":"str"},false],["label",{"t":"str"},false],["op",{"t":"undef"},true]]},{"t":"obj","p":[["needId",{"t":"any"},false],["op",{"t":"any"},false],["entity",{"t":"any"},false],["field",{"t":"any"},false],["kind",{"t":"str"},false],["label",{"t":"str"},false]]}]}},"opt":false},{"name":"chosen","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"proofs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"meta","d":{"t":"obj","p":[["slug",{"t":"any"},false],["built",{"t":"str"},false],["ms",{"t":"num"},false],["shelf",{"t":"any"},false],["fns",{"t":"any"},false],["dart",{"t":"num"},false],["expiryWords",{"t":"any"},false],["expiryWarnDays",{"t":"any"},false]]},"opt":false}],
  inner$runGenerator$why$$after_loop: [{"name":"r","d":{"t":"obj","p":[["proven",{"t":"arr","of":{"t":"any"}},false],["tried",{"t":"num"},false],["failed",{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["why",{"t":"str"},false]]}},false]]},"opt":false}],
  inner$runGenerator$dw$$after_loop: [{"name":"d","d":{"t":"any"},"opt":false}],
};
