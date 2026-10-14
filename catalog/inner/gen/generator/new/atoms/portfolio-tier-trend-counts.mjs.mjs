// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/portfolio-tier-trend-counts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$tierTrendCounts$map(order) {
    const map = new Map(order.map((t) => [t, { tier: t, total: 0, rising: 0, falling: 0, stable: 0 }]));
    return map;
}
export function inner$tierTrendCounts$row(order, tier) {
    const map = new Map(order.map((t) => [t, { tier: t, total: 0, rising: 0, falling: 0, stable: 0 }]));
    const row = map.get(tier);
    return row;
}
export function inner$tierTrendCounts$row$$step(map, tier) {
    const row = map.get(tier);
    return row;
}

export const SIGS = {
  inner$tierTrendCounts$map: [{"name":"order","d":{"t":"any"},"opt":false}],
  inner$tierTrendCounts$row: [{"name":"order","d":{"t":"any"},"opt":false},{"name":"tier","d":{"t":"any"},"opt":false}],
  inner$tierTrendCounts$row$$step: [{"name":"map","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"tier","d":{"t":"any"},"opt":false}],
};
