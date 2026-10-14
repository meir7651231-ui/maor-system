// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/projectSchedule.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function isTask(n) {
    return typeof n.days === 'number' && n.days > 0;
}
export function inner$scheduleTasks$tasks(names) {
    const tasks = names.filter(isTask);
    return tasks;
}
export function inner$scheduleTasks$ids(names) {
    const tasks = names.filter(isTask);
    const ids = new Set(tasks.map((t) => t.id));
    return ids;
}
export function inner$scheduleTasks$ids$$step(tasks) {
    const ids = new Set(tasks.map((t) => t.id));
    return ids;
}
export function inner$scheduleTasks$byId(names) {
    const tasks = names.filter(isTask);
    const byId = new Map(tasks.map((t) => [t.id, t]));
    return byId;
}
export function inner$scheduleTasks$byId$$step(tasks) {
    const byId = new Map(tasks.map((t) => [t.id, t]));
    return byId;
}
export function inner$scheduleTasks$earliest$t(byId, id) {
    const t = byId.get(id);
    return t;
}
export function inner$scheduleTasks$total(names, es) {
    const tasks = names.filter(isTask);
    const total = tasks.reduce((m, t) => Math.max(m, (es.get(t.id) || 0) + (t.days || 0)), 0);
    return total;
}
export function inner$scheduleTasks$total$$step(tasks, es) {
    const total = tasks.reduce((m, t) => Math.max(m, (es.get(t.id) || 0) + (t.days || 0)), 0);
    return total;
}
export function inner$scheduleTasks$latestStart$t(byId, id) {
    const t = byId.get(id);
    return t;
}
export function inner$scheduleTasks$latestStart$succ(successors, id) {
    const succ = successors.get(id) || [];
    return succ;
}
export function inner$scheduleTasks$latestStart$v(byId, id, lf) {
    const t = byId.get(id);
    const v = lf - (t.days || 0);
    return v;
}
export function inner$scheduleTasks$latestStart$v$$step(t, lf) {
    const v = lf - (t.days || 0);
    return v;
}
export function inner$scheduleTasks$map$start(es, t) {
    const start = es.get(t.id) || 0;
    return start;
}

export const SIGS = {
  inner$scheduleTasks$tasks: [{"name":"names","d":{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false}],
  inner$scheduleTasks$ids: [{"name":"names","d":{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false}],
  inner$scheduleTasks$ids$$step: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false}],
  inner$scheduleTasks$byId: [{"name":"names","d":{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false}],
  inner$scheduleTasks$byId$$step: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false}],
  inner$scheduleTasks$earliest$t: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$scheduleTasks$total: [{"name":"names","d":{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false},{"name":"es","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false}],
  inner$scheduleTasks$total$$step: [{"name":"tasks","d":{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false},{"name":"es","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false}],
  inner$scheduleTasks$latestStart$t: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$scheduleTasks$latestStart$succ: [{"name":"successors","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false}],
  inner$scheduleTasks$latestStart$v: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}},"opt":false},{"name":"id","d":{"t":"str"},"opt":false},{"name":"lf","d":{"t":"num"},"opt":false}],
  inner$scheduleTasks$latestStart$v$$step: [{"name":"t","d":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]},"opt":false},{"name":"lf","d":{"t":"num"},"opt":false}],
  inner$scheduleTasks$map$start: [{"name":"es","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false},{"name":"t","d":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]},"opt":false}],
};
