// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/pass.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$specOf$lines(dep) {
    const lines = [`אפליקציה: ${dep.app || dep.name}`];
    return lines;
}
export function inner$specOf$names(dep) {
    const names = new Set(dep.entities.map((e) => e.name));
    return names;
}
export function inner$specOf$fs_(e) {
    const fs_ = e.fields.map((f, i) => ({ ...f, required: f.required || (i === 0 && !e.fields.some((x) => x.required)) }));
    return fs_;
}
export function inner$specOf$ents(dep, r) {
    const names = new Set(dep.entities.map((e) => e.name));
    const ents = r.all ? null : r.ents.filter((n) => names.has(n));
    return ents;
}
export function inner$specOf$ents$$step(names, r) {
    const ents = r.all ? null : r.ents.filter((n) => names.has(n));
    return ents;
}
export function inner$improvements$names(dep) {
    const names = new Set(dep.entities.map((e) => e.name));
    return names;
}
export function inner$improvements$statusEnum(e) {
    const statusEnum = e.fields.find((f) => f.shape === 'enum' && /^(מצב|סטטוס|שלב)$/.test(f.name));
    return statusEnum;
}
export function inner$improvements$covered(dep, report) {
    const covered = new Set(report.roles.flatMap((r) => r.all ? dep.entities.map((e) => e.name) : r.ents));
    return covered;
}
export function inner$improvements$un(dep, report) {
    const covered = new Set(report.roles.flatMap((r) => r.all ? dep.entities.map((e) => e.name) : r.ents));
    const un = dep.entities.filter((e) => !covered.has(e.name));
    return un;
}
export function inner$improvements$un$$step(dep, covered) {
    const un = dep.entities.filter((e) => !covered.has(e.name));
    return un;
}
export function inner$fn$worst(uni) {
    const worst = [...uni.lenses].sort((a, b) => b.open.length - a.open.length).slice(0, 12);
    return worst;
}
export function inner$fn$byLens$$after_loop(uni) {
    const byLens = {};
    for (const l of uni.lenses)
        for (const o of l.open)
            byLens[o.lens] = (byLens[o.lens] ?? 0) + 1;
    return byLens;
}

export const SIGS = {
  inner$specOf$lines: [{"name":"dep","d":{"t":"any"},"opt":false}],
  inner$specOf$names: [{"name":"dep","d":{"t":"any"},"opt":false}],
  inner$specOf$fs_: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$specOf$ents: [{"name":"dep","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$specOf$ents$$step: [{"name":"names","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$improvements$names: [{"name":"dep","d":{"t":"any"},"opt":false}],
  inner$improvements$statusEnum: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$improvements$covered: [{"name":"dep","d":{"t":"any"},"opt":false},{"name":"report","d":{"t":"any"},"opt":false}],
  inner$improvements$un: [{"name":"dep","d":{"t":"any"},"opt":false},{"name":"report","d":{"t":"any"},"opt":false}],
  inner$improvements$un$$step: [{"name":"dep","d":{"t":"any"},"opt":false},{"name":"covered","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$fn$worst: [{"name":"uni","d":{"t":"any"},"opt":false}],
  inner$fn$byLens$$after_loop: [{"name":"uni","d":{"t":"any"},"opt":false}],
};
