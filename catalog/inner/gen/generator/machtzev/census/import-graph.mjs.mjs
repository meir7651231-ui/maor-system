// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/census/import-graph.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildGraph$dartBare(f, m) {
    const spec = m[1] || m[2] || m[3] || m[4];
    const dartBare = f.endsWith('.dart') && !/^(package|dart):/.test(spec) && spec.endsWith('.dart');
    return dartBare;
}
export function inner$buildGraph$dartBare$$step(f, spec) {
    const dartBare = f.endsWith('.dart') && !/^(package|dart):/.test(spec) && spec.endsWith('.dart');
    return dartBare;
}
export function inner$consumersOf$leaves(NEW, graph, roots) {
    const leaves = roots.filter((f) => !(graph.importers.get(f) || new Set()).size && !graph.dynamic.has(f) && f.startsWith(NEW.replace(/\/$/, '')));
    return leaves;
}
export function inner$consumersOf$outside(NEW, roots) {
    const outside = roots.filter((f) => !f.startsWith(NEW.replace(/\/$/, '')));
    return outside;
}

export const SIGS = {
  inner$buildGraph$dartBare: [{"name":"f","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
  inner$buildGraph$dartBare$$step: [{"name":"f","d":{"t":"any"},"opt":false},{"name":"spec","d":{"t":"any"},"opt":false}],
  inner$consumersOf$leaves: [{"name":"NEW","d":{"t":"str"},"opt":false},{"name":"graph","d":{"t":"obj","p":[["files",{"t":"arr","of":{"t":"any"}},false],["importers",{"t":"map","k":{"t":"any"},"v":{"t":"any"}},false],["dynamic",{"t":"set","of":{"t":"any"}},false]]},"opt":false},{"name":"roots","d":{"t":"any"},"opt":false}],
  inner$consumersOf$outside: [{"name":"NEW","d":{"t":"str"},"opt":false},{"name":"roots","d":{"t":"any"},"opt":false}],
};
