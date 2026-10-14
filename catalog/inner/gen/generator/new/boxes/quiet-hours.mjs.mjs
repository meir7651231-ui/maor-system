// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/quiet-hours.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$intlPrefix$raw(phone) {
    const raw = (phone || '').replace(/[\s()\-.]/g, '');
    return raw;
}
export function inner$contactWindow$intl(entry) {
    const intl = !!entry && entry.p !== '+972';
    return intl;
}
export function inner$contactWindow$shift(orgUtcOffset, entry) {
    const intl = !!entry && entry.p !== '+972';
    const shift = entry && intl ? entry.off - orgUtcOffset : 0;
    return shift;
}
export function inner$contactWindow$shift$$step(orgUtcOffset, entry, intl) {
    const shift = entry && intl ? entry.off - orgUtcOffset : 0;
    return shift;
}
export function inner$contactWindow$local(nowHour, orgUtcOffset, entry) {
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
export function inner$contactWindow$quiet(local, QUIET_FROM, QUIET_TO) {
    const localHour = Math.floor(local);
    const quiet = localHour >= QUIET_FROM || localHour < QUIET_TO;
    return quiet;
}
export function inner$contactWindow$quiet$$step(localHour, QUIET_FROM, QUIET_TO) {
    const quiet = localHour >= QUIET_FROM || localHour < QUIET_TO;
    return quiet;
}
export function inner$intlPrefix$best$$after_loop(s, PREFIX_TZ) {
    let best = null;
    for (const e of PREFIX_TZ)
        if (s.startsWith(e.p) && (!best || e.p.length > best.length))
            best = e.p;
    return best;
}

export const SIGS = {
  inner$intlPrefix$raw: [{"name":"phone","d":{"t":"any"},"opt":false}],
  inner$contactWindow$intl: [{"name":"entry","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["p",{"t":"str"},false],["off",{"t":"num"},false],["label",{"t":"str"},false]]}]},"opt":false}],
  inner$contactWindow$shift: [{"name":"orgUtcOffset","d":{"t":"num"},"opt":false},{"name":"entry","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["p",{"t":"str"},false],["off",{"t":"num"},false],["label",{"t":"str"},false]]}]},"opt":false}],
  inner$contactWindow$shift$$step: [{"name":"orgUtcOffset","d":{"t":"num"},"opt":false},{"name":"entry","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["p",{"t":"str"},false],["off",{"t":"num"},false],["label",{"t":"str"},false]]}]},"opt":false},{"name":"intl","d":{"t":"bool"},"opt":false}],
  inner$contactWindow$local: [{"name":"nowHour","d":{"t":"any"},"opt":false},{"name":"orgUtcOffset","d":{"t":"num"},"opt":false},{"name":"entry","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","p":[["p",{"t":"str"},false],["off",{"t":"num"},false],["label",{"t":"str"},false]]}]},"opt":false}],
  inner$contactWindow$local$$step: [{"name":"nowHour","d":{"t":"any"},"opt":false},{"name":"shift","d":{"t":"num"},"opt":false}],
  inner$contactWindow$localHour: [{"name":"local","d":{"t":"num"},"opt":false}],
  inner$contactWindow$quiet: [{"name":"local","d":{"t":"num"},"opt":false},{"name":"QUIET_FROM","d":{"t":"lit","v":[21]},"opt":false},{"name":"QUIET_TO","d":{"t":"lit","v":[8]},"opt":false}],
  inner$contactWindow$quiet$$step: [{"name":"localHour","d":{"t":"num"},"opt":false},{"name":"QUIET_FROM","d":{"t":"lit","v":[21]},"opt":false},{"name":"QUIET_TO","d":{"t":"lit","v":[8]},"opt":false}],
  inner$intlPrefix$best$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false},{"name":"PREFIX_TZ","d":{"t":"arr","of":{"t":"obj","p":[["p",{"t":"str"},false],["off",{"t":"num"},false],["label",{"t":"str"},false]]}},"opt":false}],
};
