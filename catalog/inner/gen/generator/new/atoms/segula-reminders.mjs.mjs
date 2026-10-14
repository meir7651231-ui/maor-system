// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/segula-reminders.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$segulaReminders$base(startIso) {
    const base = new Date(`${startIso}T12:00:00`);
    return base;
}
export function inner$segulaReminders$max(offsets) {
    const max = Math.max(...offsets);
    return max;
}
export function inner$segulaReminders$map$y(base) {
    const d = new Date(base);
    const y = d.getFullYear();
    return y;
}
export function inner$segulaReminders$map$y$$step(d) {
    const y = d.getFullYear();
    return y;
}
export function inner$segulaReminders$map$m(base) {
    const d = new Date(base);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return m;
}
export function inner$segulaReminders$map$m$$step(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return m;
}
export function inner$segulaReminders$map$dd(base) {
    const d = new Date(base);
    const dd = String(d.getDate()).padStart(2, '0');
    return dd;
}
export function inner$segulaReminders$map$dd$$step(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    return dd;
}

export const SIGS = {
  inner$segulaReminders$base: [{"name":"startIso","d":{"t":"any"},"opt":false}],
  inner$segulaReminders$max: [{"name":"offsets","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$segulaReminders$map$y: [{"name":"base","d":{"t":"date"},"opt":false}],
  inner$segulaReminders$map$y$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$segulaReminders$map$m: [{"name":"base","d":{"t":"date"},"opt":false}],
  inner$segulaReminders$map$m$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$segulaReminders$map$dd: [{"name":"base","d":{"t":"date"},"opt":false}],
  inner$segulaReminders$map$dd$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
};
