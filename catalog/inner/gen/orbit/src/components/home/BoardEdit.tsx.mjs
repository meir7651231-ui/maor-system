// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/home/BoardEdit.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$BoardEditor$moveTo$from(draft, id) {
    const from = draft.indexOf(id);
    return from;
}
export function inner$BoardEditor$moveTo$at(draft, insertAt) {
    const at = Math.max(1, Math.min(insertAt, draft.length));
    return at;
}
export function inner$BoardEditor$moveTo$next(draft, id) {
    const next = draft.filter((x) => x !== id);
    return next;
}
export function inner$BoardEditor$shift$from(draft, id) {
    const from = draft.indexOf(id);
    return from;
}
export function inner$BoardEditor$shift$to(draft, id, dir) {
    const from = draft.indexOf(id);
    const to = from + dir;
    return to;
}
export function inner$BoardEditor$shift$to$$step(dir, from) {
    const to = from + dir;
    return to;
}
export function inner$BoardEditor$zone$hot(dragId, overIdx, insertAt) {
    const hot = dragId !== null && overIdx === insertAt;
    return hot;
}
export function inner$BoardEditor$map$idx(i) {
    const idx = i + 1;
    return idx;
}

export const SIGS = {
  inner$BoardEditor$moveTo$from: [{"name":"draft","d":{"t":"arr","of":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]}},"opt":false},{"name":"id","d":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]},"opt":false}],
  inner$BoardEditor$moveTo$at: [{"name":"draft","d":{"t":"arr","of":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]}},"opt":false},{"name":"insertAt","d":{"t":"num"},"opt":false}],
  inner$BoardEditor$moveTo$next: [{"name":"draft","d":{"t":"arr","of":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]}},"opt":false},{"name":"id","d":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]},"opt":false}],
  inner$BoardEditor$shift$from: [{"name":"draft","d":{"t":"arr","of":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]}},"opt":false},{"name":"id","d":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]},"opt":false}],
  inner$BoardEditor$shift$to: [{"name":"draft","d":{"t":"arr","of":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]}},"opt":false},{"name":"id","d":{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]},"opt":false},{"name":"dir","d":{"t":"lit","v":[1,-1]},"opt":false}],
  inner$BoardEditor$shift$to$$step: [{"name":"dir","d":{"t":"lit","v":[1,-1]},"opt":false},{"name":"from","d":{"t":"num"},"opt":false}],
  inner$BoardEditor$zone$hot: [{"name":"dragId","d":{"t":"or","of":[{"t":"lit","v":["contacts","hero","bdays","digest","carousel","stats","today","mytasks","attention","recent","goldbook","hebcal","community","punchlow","quick","coursemetrics","credmetrics","suggest"]},{"t":"null"}]},"opt":false},{"name":"overIdx","d":{"t":"or","of":[{"t":"null"},{"t":"num"}]},"opt":false},{"name":"insertAt","d":{"t":"num"},"opt":false}],
  inner$BoardEditor$map$idx: [{"name":"i","d":{"t":"num"},"opt":false}],
};
