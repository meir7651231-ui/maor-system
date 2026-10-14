// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/merge-families.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$mergeFamilies$phone2(keeper) {
    let phone2 = (keeper.phone2 || '').trim();
    return phone2;
}
export function inner$mergeFamilies$c(cand) {
    const c = (cand || '').trim();
    return c;
}
export function inner$mergeFamilies$createdAt(keeper, losers) {
    const all = [keeper, ...losers];
    const createdAt = all.map((f) => f.createdAt).filter(Boolean).sort()[0] ?? keeper.createdAt;
    return createdAt;
}
export function inner$mergeFamilies$createdAt$$step(keeper, all) {
    const createdAt = all.map((f) => f.createdAt).filter(Boolean).sort()[0] ?? keeper.createdAt;
    return createdAt;
}
export function inner$mergeFamilies$loserNames(losers) {
    const loserNames = losers.map((l) => l.name).filter(Boolean).join(', ');
    return loserNames;
}
export function inner$mergeFamilies$notesParts(keeper, losers) {
    const all = [keeper, ...losers];
    const notesParts = all.map((f) => (f.notes || '').trim()).filter(Boolean);
    return notesParts;
}
export function inner$mergeFamilies$notesParts$$step(all) {
    const notesParts = all.map((f) => (f.notes || '').trim()).filter(Boolean);
    return notesParts;
}
export function inner$mergeFamilies$baseNotes(keeper, losers) {
    const all = [keeper, ...losers];
    const notesParts = all.map((f) => (f.notes || '').trim()).filter(Boolean);
    const baseNotes = [...new Set(notesParts)].join(' · ');
    return baseNotes;
}
export function inner$mergeFamilies$baseNotes$$step(notesParts) {
    const baseNotes = [...new Set(notesParts)].join(' · ');
    return baseNotes;
}
export function inner$mergeFamilies$notes(keeper, losers, T) {
    const all = [keeper, ...losers];
    const loserNames = losers.map((l) => l.name).filter(Boolean).join(', ');
    const notesParts = all.map((f) => (f.notes || '').trim()).filter(Boolean);
    const baseNotes = [...new Set(notesParts)].join(' · ');
    const notes = loserNames ? (baseNotes ? baseNotes + ' ' : '') + T.k4 + loserNames : baseNotes;
    return notes;
}
export function inner$mergeFamilies$notes$$step(T, loserNames, baseNotes) {
    const notes = loserNames ? (baseNotes ? baseNotes + ' ' : '') + T.k4 + loserNames : baseNotes;
    return notes;
}

export const SIGS = {
  inner$mergeFamilies$phone2: [{"name":"keeper","d":{"t":"any"},"opt":false}],
  inner$mergeFamilies$c: [{"name":"cand","d":{"t":"any"},"opt":false}],
  inner$mergeFamilies$createdAt: [{"name":"keeper","d":{"t":"any"},"opt":false},{"name":"losers","d":{"t":"any"},"opt":false}],
  inner$mergeFamilies$createdAt$$step: [{"name":"keeper","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$mergeFamilies$loserNames: [{"name":"losers","d":{"t":"any"},"opt":false}],
  inner$mergeFamilies$notesParts: [{"name":"keeper","d":{"t":"any"},"opt":false},{"name":"losers","d":{"t":"any"},"opt":false}],
  inner$mergeFamilies$notesParts$$step: [{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$mergeFamilies$baseNotes: [{"name":"keeper","d":{"t":"any"},"opt":false},{"name":"losers","d":{"t":"any"},"opt":false}],
  inner$mergeFamilies$baseNotes$$step: [{"name":"notesParts","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$mergeFamilies$notes: [{"name":"keeper","d":{"t":"any"},"opt":false},{"name":"losers","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$mergeFamilies$notes$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"loserNames","d":{"t":"any"},"opt":false},{"name":"baseNotes","d":{"t":"str"},"opt":false}],
};
