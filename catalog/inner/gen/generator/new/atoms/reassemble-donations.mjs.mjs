// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/reassemble-donations.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function byDateThenRid(a, b) {
    if (a.date !== b.date)
        return a.date < b.date ? -1 : 1;
    if (a.rid !== b.rid)
        return a.rid < b.rid ? -1 : 1;
    return 0;
}
export function inner$reassembleDonations$donations(base, docs) {
    const donations = docs
        .filter((x) => x.supporterId === base.id)
        .map((x) => x.donation)
        .sort(byDateThenRid);
    return donations;
}

export const SIGS = {
  inner$reassembleDonations$donations: [{"name":"base","d":{"t":"any"},"opt":false},{"name":"docs","d":{"t":"any"},"opt":false}],
};
