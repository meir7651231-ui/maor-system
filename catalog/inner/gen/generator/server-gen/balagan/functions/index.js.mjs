// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:server-gen/balagan/functions/index.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$uidOf$h(req) {
    const h = String(req.headers.authorization || '');
    return h;
}
export function inner$onRequest$code(req) {
    const code = String(req.query.code || '');
    return code;
}
export function inner$onRequest$state(req) {
    const state = String(req.query.state || '');
    return state;
}
export function inner$onSchedule$uid(doc) {
    const uid = doc.ref.path.split('/')[1];
    return uid;
}
export function inner$onSchedule$message(d, toks) {
    const message = {
        notification: { title: d.title || '', body: d.body || '' },
        data: { rid: String(d.rid || '') },
        tokens: toks.docs.map((t) => t.id),
    };
    return message;
}

export const SIGS = {
  inner$uidOf$h: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$code: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$state: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onSchedule$uid: [{"name":"doc","d":{"t":"any"},"opt":false}],
  inner$onSchedule$message: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"toks","d":{"t":"any"},"opt":false}],
};
