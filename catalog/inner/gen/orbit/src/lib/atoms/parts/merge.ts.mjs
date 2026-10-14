// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/merge.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const nonNeg = (v, d) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);
export function inner$mergeRuns$test(on) {
    const test = typeof on === 'function' ? on : (x) => !!x;
    return test;
}
export function inner$mergeRuns$maxGap(opts) {
    const maxGap = nonNeg(opts?.maxGap, 0);
    return maxGap;
}
export function inner$mergeRuns$minLength(opts) {
    const minLength = Math.max(1, nonNeg(opts?.minLength, 1));
    return minLength;
}

export const SIGS = {
  inner$mergeRuns$test: [{"name":"on","d":{"t":"or","of":[{"t":"undef"},{"t":"fn"}]},"opt":false}],
  inner$mergeRuns$maxGap: [{"name":"opts","d":{"t":"obj","n":"MergeOpts","p":[["maxGap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["minLength",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$mergeRuns$minLength: [{"name":"opts","d":{"t":"obj","n":"MergeOpts","p":[["maxGap",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["minLength",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
};
