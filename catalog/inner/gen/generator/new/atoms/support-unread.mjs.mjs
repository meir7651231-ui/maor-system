// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/support-unread.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supportUnread$n(thread, side, T) {
    const n = side === T.k1 ? thread.unreadAdmin : thread.unreadUser;
    return n;
}

export const SIGS = {
  inner$supportUnread$n: [{"name":"thread","d":{"t":"any"},"opt":false},{"name":"side","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
