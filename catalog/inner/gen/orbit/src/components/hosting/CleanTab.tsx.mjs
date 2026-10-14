// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/hosting/CleanTab.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CleanTab$list(open, done) {
    const list = [...open, ...done.slice().reverse()];
    return list;
}
export function inner$CleanTab$map$o(tk) {
    const o = tk.status === 'open';
    return o;
}
export function inner$CleanTab$map$sc(tk) {
    const o = tk.status === 'open';
    const sc = o ? 'var(--h-warn)' : 'var(--h-faint)';
    return sc;
}
export function inner$CleanTab$map$sc$$step(o) {
    const sc = o ? 'var(--h-warn)' : 'var(--h-faint)';
    return sc;
}

export const SIGS = {
  inner$CleanTab$list: [{"name":"open","d":{"t":"arr","of":{"t":"obj","n":"HostCleanTask","p":[["kind",{"t":"lit","v":["clean"]},false],["unitId",{"t":"str"},false],["type",{"t":"str"},false],["status",{"t":"lit","v":["done","open"]},false],["date",{"t":"str"},false],["bookingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false},{"name":"done","d":{"t":"arr","of":{"t":"obj","n":"HostCleanTask","p":[["kind",{"t":"lit","v":["clean"]},false],["unitId",{"t":"str"},false],["type",{"t":"str"},false],["status",{"t":"lit","v":["done","open"]},false],["date",{"t":"str"},false],["bookingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]}},"opt":false}],
  inner$CleanTab$map$o: [{"name":"tk","d":{"t":"obj","n":"HostCleanTask","p":[["kind",{"t":"lit","v":["clean"]},false],["unitId",{"t":"str"},false],["type",{"t":"str"},false],["status",{"t":"lit","v":["done","open"]},false],["date",{"t":"str"},false],["bookingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$CleanTab$map$sc: [{"name":"tk","d":{"t":"obj","n":"HostCleanTask","p":[["kind",{"t":"lit","v":["clean"]},false],["unitId",{"t":"str"},false],["type",{"t":"str"},false],["status",{"t":"lit","v":["done","open"]},false],["date",{"t":"str"},false],["bookingId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["doneAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["id",{"t":"str"},false],["createdAt",{"t":"str"},false],["updatedAt",{"t":"str"},false]]},"opt":false}],
  inner$CleanTab$map$sc$$step: [{"name":"o","d":{"t":"bool"},"opt":false}],
};
