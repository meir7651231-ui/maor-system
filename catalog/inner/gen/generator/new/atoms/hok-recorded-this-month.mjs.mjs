// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/hok-recorded-this-month.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hokRecordedThisMonth$month(todayIso) {
    const month = todayIso.slice(0, 7);
    return month;
}
export function inner$hokRecordedThisMonth$inDonations(sp, todayIso, hokCat, hok) {
    const month = todayIso.slice(0, 7);
    const inDonations = sp.donations.some((d) => d.date.startsWith(month) && (d.cat === hokCat || (d.amount === hok.amount && (d.cur || '₪') === hok.cur)));
    return inDonations;
}
export function inner$hokRecordedThisMonth$inDonations$$step(sp, hokCat, month, hok) {
    const inDonations = sp.donations.some((d) => d.date.startsWith(month) && (d.cat === hokCat || (d.amount === hok.amount && (d.cur || '₪') === hok.cur)));
    return inDonations;
}

export const SIGS = {
  inner$hokRecordedThisMonth$month: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$hokRecordedThisMonth$inDonations: [{"name":"sp","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"hokCat","d":{"t":"any"},"opt":false},{"name":"hok","d":{"t":"any"},"opt":false}],
  inner$hokRecordedThisMonth$inDonations$$step: [{"name":"sp","d":{"t":"any"},"opt":false},{"name":"hokCat","d":{"t":"any"},"opt":false},{"name":"month","d":{"t":"any"},"opt":false},{"name":"hok","d":{"t":"any"},"opt":false}],
};
