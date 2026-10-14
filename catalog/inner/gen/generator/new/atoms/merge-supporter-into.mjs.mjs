// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/merge-supporter-into.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$mergeSupporterInto$donations(keep, drop) {
    const donations = [...keep.donations, ...drop.donations].sort((a, b) => a.date.localeCompare(b.date));
    return donations;
}
export function inner$mergeSupporterInto$photos(keep, drop, photoMax) {
    const photos = [...new Set([...(keep.photos ?? []), ...(drop.photos ?? [])])].slice(0, photoMax);
    return photos;
}
export function inner$mergeSupporterInto$ils(keep, drop) {
    const donations = [...keep.donations, ...drop.donations].sort((a, b) => a.date.localeCompare(b.date));
    const ils = donations.filter((d) => d.cur !== '$').reduce((a, d) => a + d.amount, 0);
    return ils;
}
export function inner$mergeSupporterInto$ils$$step(donations) {
    const ils = donations.filter((d) => d.cur !== '$').reduce((a, d) => a + d.amount, 0);
    return ils;
}
export function inner$mergeSupporterInto$usd(keep, drop) {
    const donations = [...keep.donations, ...drop.donations].sort((a, b) => a.date.localeCompare(b.date));
    const usd = donations.filter((d) => d.cur === '$').reduce((a, d) => a + d.amount, 0);
    return usd;
}
export function inner$mergeSupporterInto$usd$$step(donations) {
    const usd = donations.filter((d) => d.cur === '$').reduce((a, d) => a + d.amount, 0);
    return usd;
}
export function inner$mergeSupporterInto$notes(keep, drop) {
    const notes = [keep.notes, drop.notes].map((n) => (n || '').trim()).filter(Boolean);
    return notes;
}

export const SIGS = {
  inner$mergeSupporterInto$donations: [{"name":"keep","d":{"t":"any"},"opt":false},{"name":"drop","d":{"t":"any"},"opt":false}],
  inner$mergeSupporterInto$photos: [{"name":"keep","d":{"t":"any"},"opt":false},{"name":"drop","d":{"t":"any"},"opt":false},{"name":"photoMax","d":{"t":"any"},"opt":false}],
  inner$mergeSupporterInto$ils: [{"name":"keep","d":{"t":"any"},"opt":false},{"name":"drop","d":{"t":"any"},"opt":false}],
  inner$mergeSupporterInto$ils$$step: [{"name":"donations","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$mergeSupporterInto$usd: [{"name":"keep","d":{"t":"any"},"opt":false},{"name":"drop","d":{"t":"any"},"opt":false}],
  inner$mergeSupporterInto$usd$$step: [{"name":"donations","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$mergeSupporterInto$notes: [{"name":"keep","d":{"t":"any"},"opt":false},{"name":"drop","d":{"t":"any"},"opt":false}],
};
