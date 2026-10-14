// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/store/search-store.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const MAX_RECENT = 8;
export function inner$loadRecent$arr(raw) {
    const arr = JSON.parse(raw);
    return arr;
}
export function inner$recordRecent$trimmed(q) {
    const trimmed = q.trim();
    return trimmed;
}
export function inner$recordRecent$next(recentSearches, q) {
    const trimmed = q.trim();
    const next = [trimmed, ...recentSearches.value.filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
    return next;
}
export function inner$recordRecent$next$$step(recentSearches, trimmed) {
    const next = [trimmed, ...recentSearches.value.filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
    return next;
}

export const SIGS = {
  inner$loadRecent$arr: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$recordRecent$trimmed: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$recordRecent$next: [{"name":"recentSearches","d":{"t":"any"},"opt":false},{"name":"q","d":{"t":"str"},"opt":false}],
  inner$recordRecent$next$$step: [{"name":"recentSearches","d":{"t":"any"},"opt":false},{"name":"trimmed","d":{"t":"str"},"opt":false}],
};
