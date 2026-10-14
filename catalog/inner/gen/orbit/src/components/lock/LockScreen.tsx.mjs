// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/lock/LockScreen.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$LockScreen$remainMs(until, now) {
    const remainMs = Math.max(0, until - now);
    return remainMs;
}
export function inner$LockScreen$cooling(until, now) {
    const remainMs = Math.max(0, until - now);
    const cooling = remainMs > 0;
    return cooling;
}
export function inner$LockScreen$cooling$$step(remainMs) {
    const cooling = remainMs > 0;
    return cooling;
}
export function inner$LockScreen$primary(kind) {
    const primary = kind === 'primary';
    return primary;
}
export function inner$LockScreen$forgot$msg(primary) {
    const msg = primary
        ? 'לאפס את קוד הכניסה? הקוד יימחק מהמכשיר הזה והמערכת תיפתח. הנתונים יישארו — רק הנעילה תבוטל.'
        : 'לאפס את קוד המנהל? כל קודי הנעילה יימחקו מהמכשיר הזה. הנתונים יישארו.';
    return msg;
}

export const SIGS = {
  inner$LockScreen$remainMs: [{"name":"until","d":{"t":"num"},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$LockScreen$cooling: [{"name":"until","d":{"t":"num"},"opt":false},{"name":"now","d":{"t":"num"},"opt":false}],
  inner$LockScreen$cooling$$step: [{"name":"remainMs","d":{"t":"num"},"opt":false}],
  inner$LockScreen$primary: [{"name":"kind","d":{"t":"lit","v":["primary","secondary"]},"opt":false}],
  inner$LockScreen$forgot$msg: [{"name":"primary","d":{"t":"bool"},"opt":false}],
};
