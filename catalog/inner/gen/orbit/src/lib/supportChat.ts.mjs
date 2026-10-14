// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/supportChat.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function supportUnread(thread, side) {
    if (!thread)
        return 0;
    const n = side === 'admin' ? thread.unreadAdmin : thread.unreadUser;
    return typeof n === 'number' && n > 0 ? n : 0;
}
export function inner$supportMsgTime$d(at) {
    const d = new Date(at.includes('T') ? at : at + 'T12:00:00');
    return d;
}
export function inner$supportDayLabel$day(at) {
    const day = at.slice(0, 10);
    return day;
}
export function inner$supportDayLabel$t(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    return t;
}
export function inner$supportDayLabel$y(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    const y = t.getFullYear();
    return y;
}
export function inner$supportDayLabel$y$$step(t) {
    const y = t.getFullYear();
    return y;
}
export function inner$supportDayLabel$m(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    const m = String(t.getMonth() + 1).padStart(2, '0');
    return m;
}
export function inner$supportDayLabel$m$$step(t) {
    const m = String(t.getMonth() + 1).padStart(2, '0');
    return m;
}
export function inner$supportDayLabel$dd(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    const dd = String(t.getDate()).padStart(2, '0');
    return dd;
}
export function inner$supportDayLabel$dd$$step(t) {
    const dd = String(t.getDate()).padStart(2, '0');
    return dd;
}
export function inner$supportDayLabel$yy(at) {
    const day = at.slice(0, 10);
    const [yy, mm, d2] = day.split('-');
    return yy;
}
export function inner$supportDayLabel$yy$$step(day) {
    const [yy, mm, d2] = day.split('-');
    return yy;
}
export function inner$supportDayLabel$mm(at) {
    const day = at.slice(0, 10);
    const [yy, mm, d2] = day.split('-');
    return mm;
}
export function inner$supportDayLabel$mm$$step(day) {
    const [yy, mm, d2] = day.split('-');
    return mm;
}
export function inner$supportDayLabel$d2(at) {
    const day = at.slice(0, 10);
    const [yy, mm, d2] = day.split('-');
    return d2;
}
export function inner$supportDayLabel$d2$$step(day) {
    const [yy, mm, d2] = day.split('-');
    return d2;
}
export function inner$supportPreview$t(text) {
    const t = (text ?? '').replace(/\s+/gu, ' ').trim();
    return t;
}
export function inner$supportUnread$n(thread, side) {
    const n = side === 'admin' ? thread.unreadAdmin : thread.unreadUser;
    return n;
}
export function inner$teamUnreadCount$mine(myEmail) {
    const mine = (myEmail || '').toLowerCase();
    return mine;
}
export function inner$sortSupportThreads$sort$ua(a) {
    const ua = supportUnread(a, 'admin');
    return ua;
}
export function inner$sortSupportThreads$sort$ub(b) {
    const ub = supportUnread(b, 'admin');
    return ub;
}
export function inner$teamUnreadCount$n$$after_loop(msgs, lastReadIso, myEmail) {
    const mine = (myEmail || '').toLowerCase();
    const since = lastReadIso || '';
    let n = 0;
    for (const m of msgs) {
        if ((m.sender ?? '').toLowerCase() === mine)
            continue;
        if ((m.at || '') > since)
            n++;
    }
    return n;
}
export function inner$latestTeamAt$mx$$after_loop(msgs) {
    let mx = '';
    for (const m of msgs)
        if ((m.at || '') > mx)
            mx = m.at;
    return mx;
}

export const SIGS = {
  inner$supportMsgTime$d: [{"name":"at","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$day: [{"name":"at","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$t: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$y: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$y$$step: [{"name":"t","d":{"t":"date"},"opt":false}],
  inner$supportDayLabel$m: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$m$$step: [{"name":"t","d":{"t":"date"},"opt":false}],
  inner$supportDayLabel$dd: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$dd$$step: [{"name":"t","d":{"t":"date"},"opt":false}],
  inner$supportDayLabel$yy: [{"name":"at","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$yy$$step: [{"name":"day","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$mm: [{"name":"at","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$mm$$step: [{"name":"day","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$d2: [{"name":"at","d":{"t":"str"},"opt":false}],
  inner$supportDayLabel$d2$$step: [{"name":"day","d":{"t":"str"},"opt":false}],
  inner$supportPreview$t: [{"name":"text","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$supportUnread$n: [{"name":"thread","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"SupportThread","p":[["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastText",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastFrom",{"t":"or","of":[{"t":"lit","v":["admin","user"]},{"t":"undef"}]},true],["unreadAdmin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["unreadUser",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}]},"opt":false},{"name":"side","d":{"t":"lit","v":["admin","user"]},"opt":false}],
  inner$teamUnreadCount$mine: [{"name":"myEmail","d":{"t":"str"},"opt":false}],
  inner$sortSupportThreads$sort$ua: [{"name":"a","d":{"t":"obj","p":[["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastText",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastFrom",{"t":"or","of":[{"t":"lit","v":["admin","user"]},{"t":"undef"}]},true],["unreadAdmin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["unreadUser",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["uid",{"t":"str"},false]]},"opt":false}],
  inner$sortSupportThreads$sort$ub: [{"name":"b","d":{"t":"obj","p":[["email",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["orgName",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastText",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastFrom",{"t":"or","of":[{"t":"lit","v":["admin","user"]},{"t":"undef"}]},true],["unreadAdmin",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["unreadUser",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["uid",{"t":"str"},false]]},"opt":false}],
  inner$teamUnreadCount$n$$after_loop: [{"name":"msgs","d":{"t":"arr","of":{"t":"obj","n":"TeamMsg","p":[["sender",{"t":"str"},false],["name",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},"opt":false},{"name":"lastReadIso","d":{"t":"str"},"opt":false},{"name":"myEmail","d":{"t":"str"},"opt":false}],
  inner$latestTeamAt$mx$$after_loop: [{"name":"msgs","d":{"t":"arr","of":{"t":"obj","n":"TeamMsg","p":[["sender",{"t":"str"},false],["name",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]}},"opt":false}],
};
