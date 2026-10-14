// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/HebDateInput.tsx — לא לערוך ביד.
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
export function inner$HebDateInput$monthVal(m, months) {
    const monthVal = months.includes(m) ? m : '';
    return monthVal;
}
export function inner$HebDateInput$monthOpts(months) {
    const monthOpts = [{ value: '', label: 'חודש' }, ...months.map((mm) => ({ value: mm, label: mm }))];
    return monthOpts;
}
export function inner$HebDateInput$from$yy(nowY, i) {
    const yy = nowY + 3 - i;
    return yy;
}

export const SIGS = {
  inner$fmtGreg$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtGreg$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtGreg$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$HebDateInput$monthVal: [{"name":"m","d":{"t":"str"},"opt":false},{"name":"months","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$HebDateInput$monthOpts: [{"name":"months","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$HebDateInput$from$yy: [{"name":"nowY","d":{"t":"num"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
};
