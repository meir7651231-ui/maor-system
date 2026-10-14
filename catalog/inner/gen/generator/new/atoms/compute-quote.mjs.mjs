// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/compute-quote.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$computeQuote$onModules(cfg, allModules) {
    const onModules = allModules.filter((m) => cfg.modules?.[m] !== false);
    return onModules;
}
export function inner$computeQuote$addonLines(prices, addons, T) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: T.k2 }));
    return addonLines;
}
export function inner$computeQuote$lines(prices, addons, T, all) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: T.k2 }));
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    return lines;
}
export function inner$computeQuote$lines$$step(all, addonLines) {
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    return lines;
}
export function inner$computeQuote$included(all) {
    const included = all.filter((l) => l.price === 0);
    return included;
}
export function inner$computeQuote$modulesSubtotal(prices, addons, T, all) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: T.k2 }));
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    const modulesSubtotal = lines.reduce((s, l) => s + l.price, 0);
    return modulesSubtotal;
}
export function inner$computeQuote$modulesSubtotal$$step(lines) {
    const modulesSubtotal = lines.reduce((s, l) => s + l.price, 0);
    return modulesSubtotal;
}
export function inner$computeQuote$monthly(size, prices, addons, T, all) {
    const addonLines = addons.map((a) => ({ key: a.key, label: a.label, price: prices.integrations[a.key] ?? 0, kind: T.k2 }));
    const lines = [...all.filter((l) => l.price > 0), ...addonLines.filter((l) => l.price > 0)];
    const modulesSubtotal = lines.reduce((s, l) => s + l.price, 0);
    const sizeMult = prices.sizeMult[size] ?? 1;
    const monthly = Math.round((prices.base + modulesSubtotal) * sizeMult);
    return monthly;
}
export function inner$computeQuote$monthly$$step(prices, modulesSubtotal, sizeMult) {
    const monthly = Math.round((prices.base + modulesSubtotal) * sizeMult);
    return monthly;
}

export const SIGS = {
  inner$computeQuote$onModules: [{"name":"cfg","d":{"t":"any"},"opt":false},{"name":"allModules","d":{"t":"any"},"opt":false}],
  inner$computeQuote$addonLines: [{"name":"prices","d":{"t":"any"},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$computeQuote$lines: [{"name":"prices","d":{"t":"any"},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false}],
  inner$computeQuote$lines$$step: [{"name":"all","d":{"t":"any"},"opt":false},{"name":"addonLines","d":{"t":"arr","of":{"t":"obj","p":[["key",{"t":"any"},false],["label",{"t":"any"},false],["price",{"t":"any"},false],["kind",{"t":"any"},false]]}},"opt":false}],
  inner$computeQuote$included: [{"name":"all","d":{"t":"any"},"opt":false}],
  inner$computeQuote$modulesSubtotal: [{"name":"prices","d":{"t":"any"},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false}],
  inner$computeQuote$modulesSubtotal$$step: [{"name":"lines","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$computeQuote$monthly: [{"name":"size","d":{"t":"any"},"opt":false},{"name":"prices","d":{"t":"any"},"opt":false},{"name":"addons","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"all","d":{"t":"any"},"opt":false}],
  inner$computeQuote$monthly$$step: [{"name":"prices","d":{"t":"any"},"opt":false},{"name":"modulesSubtotal","d":{"t":"any"},"opt":false},{"name":"sizeMult","d":{"t":"num"},"opt":false}],
};
