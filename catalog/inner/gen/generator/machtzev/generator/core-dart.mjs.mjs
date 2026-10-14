// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/core-dart.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`;
export function inner$emit$wf(e) {
    const wf = e.workflows.find((w) => w.states && w.states.length);
    return wf;
}
export function inner$emit$nextBody(eng) {
    const nextBody = eng === 'advance-status' ? `{ final n = advanceStatus(s); return n == s ? null : n; }` : eng === 'next-stage' ? `=> nextStage(s, stageIndex, ayinStages);` : `{ final i = states.indexOf(s); return i < 0 || i + 1 >= states.length ? null : states[i + 1]; } // הצבה: סדר-ההצהרה (אין אטום-מעבר לישות זו) — חוק-7`;
    return nextBody;
}
export function inner$emit$rel(e) {
    const rel = e.relations.map((r) => `[${q(r.field)}, ${q(r.target || '∅')}, ${q(r.how)}]`);
    return rel;
}
export function inner$emit$rules(e) {
    const rules = e.rules.map((r) => `[${q(r.kind)}, ${q(r.field)}, ${q(r.kind === 'enum' ? r.values.join('|') : r.kind === 'ref' ? r.target : '')}]`);
    return rules;
}
export function inner$emit$chans(e) {
    const chans = e.notification.map((n) => `[${q(n.field)}, ${q(n.channel)}]`);
    return chans;
}
export function inner$emit$evs(e) {
    const evs = e.events.map((x) => `[${q(x.field)}, ${q(x.event)}]`);
    return evs;
}

export const SIGS = {
  inner$emit$wf: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$emit$nextBody: [{"name":"eng","d":{"t":"any"},"opt":false}],
  inner$emit$rel: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$emit$rules: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$emit$chans: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$emit$evs: [{"name":"e","d":{"t":"any"},"opt":false}],
};
