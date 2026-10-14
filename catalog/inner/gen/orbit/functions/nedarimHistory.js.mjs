// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/nedarimHistory.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$nedarimDateToIso$m(raw) {
    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(raw || ''));
    return m;
}
export function inner$planHistoryWrites$tid(r) {
    const tid = String(r.TransactionId ?? r.Transaction ?? '').trim();
    return tid;
}
export function inner$planHistoryWrites$idNum(r) {
    const tid = String(r.TransactionId ?? r.Transaction ?? '').trim();
    const idNum = Number(tid);
    return idNum;
}
export function inner$planHistoryWrites$idNum$$step(tid) {
    const idNum = Number(tid);
    return idNum;
}
export function inner$planHistoryWrites$kind(m) {
    const kind = m.amount < 0 ? 'refund' : m.amount === 0 ? 'cancel' : 'charge';
    return kind;
}

export const SIGS = {
  inner$nedarimDateToIso$m: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$planHistoryWrites$tid: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planHistoryWrites$idNum: [{"name":"r","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$planHistoryWrites$idNum$$step: [{"name":"tid","d":{"t":"str"},"opt":false}],
  inner$planHistoryWrites$kind: [{"name":"m","d":{"t":"obj","p":[["org",{"t":"str"},false],["amount",{"t":"num"},false],["currency",{"t":"str"},false],["name",{"t":"str"},false],["phone",{"t":"str"},false],["email",{"t":"str"},false],["zeout",{"t":"str"},false],["category",{"t":"str"},false],["kevaId",{"t":"str"},false],["reference",{"t":"str"},false]]},"opt":false}],
};
