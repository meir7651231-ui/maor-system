// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/constellation.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$radiusFor$base(daysSince) {
    const base = daysSince <= 30 ? 0.30 : daysSince <= 90 ? 0.45 : daysSince <= 180 ? 0.60 : daysSince <= 365 ? 0.75 : 0.9;
    return base;
}
export function inner$donorConstellation$offset(opts) {
    const offset = Math.max(0, opts.offsetDays ?? 0);
    return offset;
}
export function inner$donorConstellation$lg(scan) {
    const lg = Math.log10(scan.ils + 1);
    return lg;
}
export function inner$hash01$h$$after_loop(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h;
}

export const SIGS = {
  inner$radiusFor$base: [{"name":"daysSince","d":{"t":"num"},"opt":false}],
  inner$donorConstellation$offset: [{"name":"opts","d":{"t":"obj","n":"ConstellationOpts","p":[["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["riskThreshold",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["offsetDays",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$donorConstellation$lg: [{"name":"scan","d":{"t":"obj","n":"DonorScan","p":[["count",{"t":"num"},false],["ils",{"t":"num"},false],["first",{"t":"str"},false],["last",{"t":"str"},false],["monthly",{"t":"arr","of":{"t":"num"}},false]]},"opt":false}],
  inner$hash01$h$$after_loop: [{"name":"s","d":{"t":"str"},"opt":false}],
};
