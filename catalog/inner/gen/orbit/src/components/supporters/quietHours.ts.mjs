// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/quietHours.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const QUIET_FROM = 21;
const QUIET_TO = 8;
const PREFIX_TZ = [
    { p: '+972', off: 3, label: 'ישראל' },
    { p: '+1', off: -5, label: 'ארה״ב/קנדה' },
    { p: '+44', off: 0, label: 'בריטניה' },
    { p: '+33', off: 1, label: 'צרפת' },
    { p: '+32', off: 1, label: 'בלגיה' },
    { p: '+41', off: 1, label: 'שווייץ' },
    { p: '+61', off: 10, label: 'אוסטרליה' },
    { p: '+7', off: 3, label: 'רוסיה' },
    { p: '+380', off: 2, label: 'אוקראינה' },
];
function intlPrefix(phone) {
    const raw = (phone || '').replace(/[\s()\-.]/g, '');
    let s = raw;
    if (s.startsWith('00'))
        s = '+' + s.slice(2);
    if (!s.startsWith('+'))
        return null; // מקומי (05x / 0x) — אין קידומת בין-לאומית
    // התאמה לקידומת הארוכה-ביותר (‏+380 לפני +3).
    let best = null;
    for (const e of PREFIX_TZ)
        if (s.startsWith(e.p) && (!best || e.p.length > best.length))
            best = e.p;
    return best;
}
export function inner$intlPrefix$raw(phone) {
    const raw = (phone || '').replace(/[\s()\-.]/g, '');
    return raw;
}
export function inner$contactWindow$p(phone) {
    const p = intlPrefix(phone);
    return p;
}
export function inner$contactWindow$entry(phone) {
    const p = intlPrefix(phone);
    const entry = p ? PREFIX_TZ.find((e) => e.p === p) : null;
    return entry;
}
export function inner$contactWindow$entry$$step(p) {
    const entry = p ? PREFIX_TZ.find((e) => e.p === p) : null;
    return entry;
}
export function inner$contactWindow$intl(phone) {
    const p = intlPrefix(phone);
    const entry = p ? PREFIX_TZ.find((e) => e.p === p) : null;
    const intl = !!entry && entry.p !== '+972';
    return intl;
}
export function inner$contactWindow$intl$$step(entry) {
    const intl = !!entry && entry.p !== '+972';
    return intl;
}
export function inner$contactWindow$shift(phone, orgUtcOffset) {
    const p = intlPrefix(phone);
    const entry = p ? PREFIX_TZ.find((e) => e.p === p) : null;
    const intl = !!entry && entry.p !== '+972';
    const shift = entry && intl ? entry.off - orgUtcOffset : 0;
    return shift;
}
export function inner$contactWindow$shift$$step(orgUtcOffset, entry, intl) {
    const shift = entry && intl ? entry.off - orgUtcOffset : 0;
    return shift;
}
export function inner$contactWindow$local(phone, nowHour, orgUtcOffset) {
    const p = intlPrefix(phone);
    const entry = p ? PREFIX_TZ.find((e) => e.p === p) : null;
    const intl = !!entry && entry.p !== '+972';
    const shift = entry && intl ? entry.off - orgUtcOffset : 0;
    let local = (nowHour + shift) % 24;
    return local;
}
export function inner$contactWindow$local$$step(nowHour, shift) {
    let local = (nowHour + shift) % 24;
    return local;
}
export function inner$contactWindow$localHour(local) {
    const localHour = Math.floor(local);
    return localHour;
}
export function inner$contactWindow$quiet(local) {
    const localHour = Math.floor(local);
    const quiet = localHour >= QUIET_FROM || localHour < QUIET_TO;
    return quiet;
}
export function inner$contactWindow$quiet$$step(localHour) {
    const quiet = localHour >= QUIET_FROM || localHour < QUIET_TO;
    return quiet;
}
export function inner$intlPrefix$best$$after_loop(s) {
    let best = null;
    for (const e of PREFIX_TZ)
        if (s.startsWith(e.p) && (!best || e.p.length > best.length))
            best = e.p;
    return best;
}

export const SIGS = {
  inner$intlPrefix$raw: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$contactWindow$p: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$contactWindow$entry: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$contactWindow$entry$$step: [{"name":"p","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$contactWindow$intl: [{"name":"phone","d":{"t":"str"},"opt":false}],
  inner$contactWindow$intl$$step: [{"name":"entry","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["p",{"t":"str"},false],["off",{"t":"num"},false],["label",{"t":"str"},false]]}]},"opt":false}],
  inner$contactWindow$shift: [{"name":"phone","d":{"t":"str"},"opt":false},{"name":"orgUtcOffset","d":{"t":"num"},"opt":false}],
  inner$contactWindow$shift$$step: [{"name":"orgUtcOffset","d":{"t":"num"},"opt":false},{"name":"entry","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["p",{"t":"str"},false],["off",{"t":"num"},false],["label",{"t":"str"},false]]}]},"opt":false},{"name":"intl","d":{"t":"bool"},"opt":false}],
  inner$contactWindow$local: [{"name":"phone","d":{"t":"str"},"opt":false},{"name":"nowHour","d":{"t":"num"},"opt":false},{"name":"orgUtcOffset","d":{"t":"num"},"opt":false}],
  inner$contactWindow$local$$step: [{"name":"nowHour","d":{"t":"num"},"opt":false},{"name":"shift","d":{"t":"num"},"opt":false}],
  inner$contactWindow$localHour: [{"name":"local","d":{"t":"num"},"opt":false}],
  inner$contactWindow$quiet: [{"name":"local","d":{"t":"num"},"opt":false}],
  inner$contactWindow$quiet$$step: [{"name":"localHour","d":{"t":"num"},"opt":false}],
  inner$intlPrefix$best$$after_loop: [{"name":"s","d":{"t":"str"},"opt":false}],
};
