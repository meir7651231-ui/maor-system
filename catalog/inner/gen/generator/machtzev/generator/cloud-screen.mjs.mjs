// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/cloud-screen.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$renderCloudSection$field$val(s) {
    const val = s.kind === 'store' ? `appStore.setting('${s.key}')` : s.key;
    return val;
}
export function inner$renderCloudSection$field$set(s) {
    const set = s.kind === 'store' ? `appStore.setSetting('${s.key}', v)` : `${s.key} = v`;
    return set;
}
export function inner$renderCloudSection$fs_(SOCKETS, need) {
    const fs_ = SOCKETS.sockets.filter((s) => s.need === need);
    return fs_;
}
export function inner$renderCloudSection$ns(SOCKETS, need) {
    const ns = SOCKETS.notes.filter((n) => n.need === need);
    return ns;
}
export function inner$renderCloudSection$as(SOCKETS, need) {
    const as = SOCKETS.actions.filter((a) => a.need === need);
    return as;
}

export const SIGS = {
  inner$renderCloudSection$field$val: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderCloudSection$field$set: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$renderCloudSection$fs_: [{"name":"SOCKETS","d":{"t":"any"},"opt":false},{"name":"need","d":{"t":"str"},"opt":false}],
  inner$renderCloudSection$ns: [{"name":"SOCKETS","d":{"t":"any"},"opt":false},{"name":"need","d":{"t":"str"},"opt":false}],
  inner$renderCloudSection$as: [{"name":"SOCKETS","d":{"t":"any"},"opt":false},{"name":"need","d":{"t":"str"},"opt":false}],
};
