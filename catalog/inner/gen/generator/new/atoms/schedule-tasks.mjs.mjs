// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/schedule-tasks.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$scheduleTasks$earliest$t(byId, id) {
    const t = byId.get(id);
    return t;
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
  inner$scheduleTasks$earliest$t: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$scheduleTasks$latestStart$t: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$scheduleTasks$latestStart$succ: [{"name":"successors","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
  inner$scheduleTasks$latestStart$v: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"id","d":{"t":"any"},"opt":false},{"name":"lf","d":{"t":"num"},"opt":false}],
  inner$scheduleTasks$latestStart$v$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"lf","d":{"t":"num"},"opt":false}],
  inner$scheduleTasks$map$start: [{"name":"es","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
};
