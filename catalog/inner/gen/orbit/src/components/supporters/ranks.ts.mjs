// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/ranks.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$donorRanks$ltvRank(i) {
    const ltvRank = i + 1;
    return ltvRank;
}
export function inner$donorRanks$tierRank(tierSeen, r) {
    const tierRank = (tierSeen.get(r.tier) || 0) + 1;
    return tierRank;
}
export function inner$donorRanks$tierSizes$$after_loop(rows) {
    const tierSizes = new Map();
    for (const r of rows)
        tierSizes.set(r.tier, (tierSizes.get(r.tier) || 0) + 1);
    return tierSizes;
}
export function inner$donorRanks$out$$after_loop(rows, total) {
    const tierSizes = new Map();
    for (const r of rows)
        tierSizes.set(r.tier, (tierSizes.get(r.tier) || 0) + 1);
    const out = new Map();
    const tierSeen = new Map();
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const ltvRank = i + 1;
        const tierRank = (tierSeen.get(r.tier) || 0) + 1;
        tierSeen.set(r.tier, tierRank);
        out.set(r.id, {
            ltvRank,
            total,
            percentile: total > 0 ? Math.round(((total - i) / total) * 100) : 0,
            tierRank,
            tierSize: tierSizes.get(r.tier) || 1,
            tier: r.tier,
        });
    }
    return out;
}
export function inner$donorRanks$tierSeen$$after_loop(rows, total) {
    const tierSizes = new Map();
    for (const r of rows)
        tierSizes.set(r.tier, (tierSizes.get(r.tier) || 0) + 1);
    const out = new Map();
    const tierSeen = new Map();
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const ltvRank = i + 1;
        const tierRank = (tierSeen.get(r.tier) || 0) + 1;
        tierSeen.set(r.tier, tierRank);
        out.set(r.id, {
            ltvRank,
            total,
            percentile: total > 0 ? Math.round(((total - i) / total) * 100) : 0,
            tierRank,
            tierSize: tierSizes.get(r.tier) || 1,
            tier: r.tier,
        });
    }
    return tierSeen;
}

export const SIGS = {
  inner$donorRanks$ltvRank: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$donorRanks$tierRank: [{"name":"tierSeen","d":{"t":"map","k":{"t":"str"},"v":{"t":"num"}},"opt":false},{"name":"r","d":{"t":"obj","n":"Row","p":[["id",{"t":"str"},false],["ltv",{"t":"num"},false],["tier",{"t":"str"},false]]},"opt":false}],
  inner$donorRanks$tierSizes$$after_loop: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["id",{"t":"str"},false],["ltv",{"t":"num"},false],["tier",{"t":"str"},false]]}},"opt":false}],
  inner$donorRanks$out$$after_loop: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["id",{"t":"str"},false],["ltv",{"t":"num"},false],["tier",{"t":"str"},false]]}},"opt":false},{"name":"total","d":{"t":"num"},"opt":false}],
  inner$donorRanks$tierSeen$$after_loop: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"Row","p":[["id",{"t":"str"},false],["ltv",{"t":"num"},false],["tier",{"t":"str"},false]]}},"opt":false},{"name":"total","d":{"t":"num"},"opt":false}],
};
