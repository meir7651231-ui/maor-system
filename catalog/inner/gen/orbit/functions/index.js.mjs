// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/index.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$onRequest$kind(m) {
    const kind = m.amount < 0 ? 'refund' : m.amount === 0 ? 'cancel' : 'charge';
    return kind;
}
export function inner$onRequest$tid(req) {
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const tid = String(p.TransactionId ?? p.Transaction ?? '').trim();
    return tid;
}
export function inner$onRequest$tid$$step(p) {
    const tid = String(p.TransactionId ?? p.Transaction ?? '').trim();
    return tid;
}
export function inner$onRequest$rawKey(req, m) {
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const tid = String(p.TransactionId ?? p.Transaction ?? '').trim();
    const rawKey = tid || (m.reference ? 'ref-' + m.reference : '');
    return rawKey;
}
export function inner$onRequest$rawKey$$step(m, tid) {
    const rawKey = tid || (m.reference ? 'ref-' + m.reference : '');
    return rawKey;
}
export function inner$slugOfQueueDoc$parts(docSnap) {
    const parts = docSnap.ref.path.split('/');
    return parts;
}
export function inner$onRequest$action(req) {
    const action = String(req.query.action ?? '');
    return action;
}
export function inner$onRequest$org(req) {
    const org = String(req.query.org ?? '');
    return org;
}
export function inner$onRequest$org_L243(req) {
    const org = String(req.query.org ?? '');
    return org;
}
export function inner$onRequest$key(req) {
    const key = String(req.query.key ?? '');
    return key;
}
export function inner$onSchedule$month(today) {
    const month = today.slice(0, 7);
    return month;
}
export function inner$onSchedule$smsTo(cfg) {
    const smsTo = cfg?.integrations?.sms?.enabled ? String(cfg?.integrations?.sms?.settings?.adminPhone ?? '').trim() : '';
    return smsTo;
}
export function inner$onSchedule$mailTo(cfg) {
    const mailTo = cfg?.integrations?.mail?.enabled ? String(cfg?.integrations?.mail?.settings?.digestTo ?? '').trim() : '';
    return mailTo;
}
export function inner$onSchedule$lines(today) {
    const lines = ['תקציר-בוקר ' + today];
    return lines;
}
export function inner$onSchedule$text(lines) {
    const text = lines.join('\n');
    return text;
}
export function inner$onSchedule$sorted(files) {
    const sorted = files.map((f) => f.name).sort();
    return sorted;
}

export const SIGS = {
  inner$onRequest$kind: [{"name":"m","d":{"t":"obj","p":[["org",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["zeout",{"t":"str"},false],["category",{"t":"str"},false],["kevaId",{"t":"str"},false],["reference",{"t":"str"},false]]},"opt":false}],
  inner$onRequest$tid: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$tid$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$onRequest$rawKey: [{"name":"req","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"obj","p":[["org",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["zeout",{"t":"str"},false],["category",{"t":"str"},false],["kevaId",{"t":"str"},false],["reference",{"t":"str"},false]]},"opt":false}],
  inner$onRequest$rawKey$$step: [{"name":"m","d":{"t":"obj","p":[["org",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["zeout",{"t":"str"},false],["category",{"t":"str"},false],["kevaId",{"t":"str"},false],["reference",{"t":"str"},false]]},"opt":false},{"name":"tid","d":{"t":"str"},"opt":false}],
  inner$slugOfQueueDoc$parts: [{"name":"docSnap","d":{"t":"any"},"opt":false}],
  inner$onRequest$action: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$org: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$org_L243: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$key: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onSchedule$month: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$onSchedule$smsTo: [{"name":"cfg","d":{"t":"any"},"opt":false}],
  inner$onSchedule$mailTo: [{"name":"cfg","d":{"t":"any"},"opt":false}],
  inner$onSchedule$lines: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$onSchedule$text: [{"name":"lines","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$onSchedule$sorted: [{"name":"files","d":{"t":"any"},"opt":false}],
};
