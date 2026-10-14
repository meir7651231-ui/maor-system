// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sort-support-threads.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$sortSupportThreads$supportUnread$n(T, thread, side) {
    const n = side === T.k1 ? thread.unreadAdmin : thread.unreadUser;
    return n;
}

export const SIGS = {
  inner$sortSupportThreads$supportUnread$n: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"thread","d":{"t":"any"},"opt":false},{"name":"side","d":{"t":"any"},"opt":false}],
};
