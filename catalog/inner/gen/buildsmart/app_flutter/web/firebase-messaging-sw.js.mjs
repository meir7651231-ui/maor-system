// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app_flutter/web/firebase-messaging-sw.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$addEventListener$target(event) {
    const threadId = (event.notification.data || {}).threadId;
    const target = threadId ? `/?thread=${encodeURIComponent(threadId)}` : '/';
    return target;
}
export function inner$addEventListener$target$$step(threadId) {
    const target = threadId ? `/?thread=${encodeURIComponent(threadId)}` : '/';
    return target;
}

export const SIGS = {
  inner$addEventListener$target: [{"name":"event","d":{"t":"any"},"opt":false}],
  inner$addEventListener$target$$step: [{"name":"threadId","d":{"t":"any"},"opt":false}],
};
