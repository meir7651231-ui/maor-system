// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/CalendarPicker.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fmtGreg$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$fmtGreg$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$fmtGreg$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$CalendarPicker$withTime(props) {
    const withTime = props.time !== undefined;
    return withTime;
}
export function inner$CalendarPicker$map$isSel(sel, cell) {
    const isSel = cell.iso === sel;
    return isSel;
}
export function inner$CalendarPicker$map$isToday(today, cell) {
    const isToday = cell.iso === today;
    return isToday;
}

export const SIGS = {
  inner$fmtGreg$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtGreg$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtGreg$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$CalendarPicker$withTime: [{"name":"props","d":{"t":"obj","p":[["value",{"t":"str"},false],["onPick",{"t":"fn"},false],["onClose",{"t":"fn"},false],["time",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["onTime",{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},true],["title",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$CalendarPicker$map$isSel: [{"name":"sel","d":{"t":"str"},"opt":false},{"name":"cell","d":{"t":"obj","n":"MonthGridCell","p":[["iso",{"t":"str"},false],["dayNum",{"t":"str"},false],["hebDay",{"t":"str"},false],["inMonth",{"t":"bool"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fullHoliday",{"t":"bool"},false],["events",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$CalendarPicker$map$isToday: [{"name":"today","d":{"t":"str"},"opt":false},{"name":"cell","d":{"t":"obj","n":"MonthGridCell","p":[["iso",{"t":"str"},false],["dayNum",{"t":"str"},false],["hebDay",{"t":"str"},false],["inMonth",{"t":"bool"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fullHoliday",{"t":"bool"},false],["events",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
};
