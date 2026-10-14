// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/portfolio.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$tierTrendCounts$map() {
    const order = ['זהב', 'כסף', 'ארד', 'רדומה'];
    const map = new Map(order.map((t) => [t, { tier: t, total: 0, rising: 0, falling: 0, stable: 0 }]));
    return map;
}
export function inner$tierTrendCounts$map$$step(order) {
    const map = new Map(order.map((t) => [t, { tier: t, total: 0, rising: 0, falling: 0, stable: 0 }]));
    return map;
}
export function inner$tierTrendCounts$row(tier) {
    const order = ['זהב', 'כסף', 'ארד', 'רדומה'];
    const map = new Map(order.map((t) => [t, { tier: t, total: 0, rising: 0, falling: 0, stable: 0 }]));
    const row = map.get(tier);
    return row;
}
export function inner$tierTrendCounts$row$$step(map, tier) {
    const row = map.get(tier);
    return row;
}
export function inner$portfolioIntel$top$$after_loop(topN, ltvs) {
    let top = 0;
    for (let i = 0; i < Math.min(topN, ltvs.length); i++)
        top += ltvs[i];
    return top;
}

export const SIGS = {
  inner$tierTrendCounts$map: [],
  inner$tierTrendCounts$map$$step: [{"name":"order","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$tierTrendCounts$row: [{"name":"tier","d":{"t":"str"},"opt":false}],
  inner$tierTrendCounts$row$$step: [{"name":"map","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"TierTrend","p":[["tier",{"t":"str"},false],["total",{"t":"num"},false],["rising",{"t":"num"},false],["falling",{"t":"num"},false],["stable",{"t":"num"},false]]}},"opt":false},{"name":"tier","d":{"t":"str"},"opt":false}],
  inner$portfolioIntel$top$$after_loop: [{"name":"topN","d":{"t":"num"},"opt":false},{"name":"ltvs","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
};
