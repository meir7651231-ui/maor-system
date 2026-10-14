// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/support/SupportChat.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$PortalReqCard$tel(req) {
    const tel = req.phone.replace(/[^\d+]/g, '');
    return tel;
}
export function inner$SupportChat$map$mine(side, m) {
    const mine = m.from === side;
    return mine;
}
export function inner$SupportChat$map$showDay(lastDay, day) {
    const showDay = day !== lastDay;
    return showDay;
}
export function inner$SupportInbox$useMemo$t(q) {
    const t = q.trim().toLowerCase();
    return t;
}
export function inner$TeamChatModal$myEmail(user) {
    const myEmail = (user?.email ?? '').toLowerCase();
    return myEmail;
}
export function inner$TeamChatModal$myName(user, memberNames) {
    const myEmail = (user?.email ?? '').toLowerCase();
    const myName = memberNames?.[myEmail] || myEmail.split('@')[0] || 'אני';
    return myName;
}
export function inner$TeamChatModal$myName$$step(myEmail, memberNames) {
    const myName = memberNames?.[myEmail] || myEmail.split('@')[0] || 'אני';
    return myName;
}
export function inner$TeamChatModal$map$mine(myEmail, m) {
    const mine = (m.sender ?? '').toLowerCase() === myEmail;
    return mine;
}
export function inner$TeamChatModal$map$showDay(lastDay, day) {
    const showDay = day !== lastDay;
    return showDay;
}

export const SIGS = {
  inner$PortalReqCard$tel: [{"name":"req","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"ParsedPortalReq","p":[["childName",{"t":"str"},false],["parentName",{"t":"str"},false],["phone",{"t":"str"},false],["course",{"t":"str"},false],["note",{"t":"str"},false]]}]},"opt":false}],
  inner$SupportChat$map$mine: [{"name":"side","d":{"t":"lit","v":["admin","user"]},"opt":false},{"name":"m","d":{"t":"obj","n":"SupportMsg","p":[["from",{"t":"lit","v":["admin","user"]},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]},"opt":false}],
  inner$SupportChat$map$showDay: [{"name":"lastDay","d":{"t":"str"},"opt":false},{"name":"day","d":{"t":"str"},"opt":false}],
  inner$SupportInbox$useMemo$t: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$TeamChatModal$myEmail: [{"name":"user","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"CloudUser","p":[["uid",{"t":"str"},false],["email",{"t":"str"},false]]}]},"opt":false}],
  inner$TeamChatModal$myName: [{"name":"user","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"CloudUser","p":[["uid",{"t":"str"},false],["email",{"t":"str"},false]]}]},"opt":false},{"name":"memberNames","d":{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},"opt":false}],
  inner$TeamChatModal$myName$$step: [{"name":"myEmail","d":{"t":"str"},"opt":false},{"name":"memberNames","d":{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},"opt":false}],
  inner$TeamChatModal$map$mine: [{"name":"myEmail","d":{"t":"str"},"opt":false},{"name":"m","d":{"t":"obj","n":"TeamMsg","p":[["sender",{"t":"str"},false],["name",{"t":"str"},false],["text",{"t":"str"},false],["at",{"t":"str"},false]]},"opt":false}],
  inner$TeamChatModal$map$showDay: [{"name":"lastDay","d":{"t":"str"},"opt":false},{"name":"day","d":{"t":"str"},"opt":false}],
};
