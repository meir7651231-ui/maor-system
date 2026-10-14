// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/reminders.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$toMin$h(hhmm) {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h;
}
export function inner$toMin$m(hhmm) {
    const [h, m] = String(hhmm).split(':').map(Number);
    return m;
}
export function inner$fromMin$x(min) {
    const x = ((min % 1440) + 1440) % 1440;
    return x;
}
export function inner$reminderQueue$defaultLead(opt) {
    const defaultLead = Number.isInteger(opt.defaultLead) ? opt.defaultLead : 30;
    return defaultLead;
}
export function inner$reminderQueue$lead(opt, it) {
    const defaultLead = Number.isInteger(opt.defaultLead) ? opt.defaultLead : 30;
    const lead = Number.isInteger(it.leadMinutes) && it.leadMinutes >= 0 ? it.leadMinutes : defaultLead;
    return lead;
}
export function inner$reminderQueue$lead$$step(defaultLead, it) {
    const lead = Number.isInteger(it.leadMinutes) && it.leadMinutes >= 0 ? it.leadMinutes : defaultLead;
    return lead;
}

export const SIGS = {
  inner$toMin$h: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$toMin$m: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$fromMin$x: [{"name":"min","d":{"t":"num"},"opt":false}],
  inner$reminderQueue$defaultLead: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["viaNumberId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["defaultLead",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false}],
  inner$reminderQueue$lead: [{"name":"opt","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["viaNumberId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["defaultLead",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false},{"name":"it","d":{"t":"any"},"opt":false}],
  inner$reminderQueue$lead$$step: [{"name":"defaultLead","d":{"t":"or","of":[{"t":"undef"},{"t":"num"}]},"opt":false},{"name":"it","d":{"t":"any"},"opt":false}],
};
