// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/prayer.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function normPrayerName(s) {
    return s.trim().replace(/\s+/g, ' ').toLowerCase();
}
export function inner$planAddPrayerName$nm(name) {
    const nm = name.trim().replace(/\s+/g, ' ');
    return nm;
}
export function inner$planAddPrayerName$key(name) {
    const nm = name.trim().replace(/\s+/g, ' ');
    const key = normPrayerName(nm);
    return key;
}
export function inner$planAddPrayerName$key$$step(nm) {
    const key = normPrayerName(nm);
    return key;
}
export function inner$prayerListText$open(list) {
    const open = list.filter((p) => !p.done);
    return open;
}
export function inner$prayerListText$done(list) {
    const done = list.filter((p) => p.done);
    return done;
}

export const SIGS = {
  inner$planAddPrayerName$nm: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$planAddPrayerName$key: [{"name":"name","d":{"t":"str"},"opt":false}],
  inner$planAddPrayerName$key$$step: [{"name":"nm","d":{"t":"str"},"opt":false}],
  inner$prayerListText$open: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
  inner$prayerListText$done: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"PrayerName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["note",{"t":"str"},false],["addedAt",{"t":"str"},false],["done",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},"opt":false}],
};
