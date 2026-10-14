// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/detect-recurring-hok.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$detectRecurringHok$map$nd(clearingProviders, sp) {
    const nd = (sp.hist ?? []).filter((h) => clearingProviders.includes(h.clearer || '') && h.a > 0 && !!h.d);
    return nd;
}
export function inner$detectRecurringHok$map$kevaCharge(clearingProviders, sp) {
    const nd = (sp.hist ?? []).filter((h) => clearingProviders.includes(h.clearer || '') && h.a > 0 && !!h.d);
    const kevaCharge = nd.find((h) => h.kevaId);
    return kevaCharge;
}
export function inner$detectRecurringHok$map$kevaCharge$$step(nd) {
    const kevaCharge = nd.find((h) => h.kevaId);
    return kevaCharge;
}
export function inner$detectRecurringHok$map$distinctMonths(clearingProviders, sp) {
    const nd = (sp.hist ?? []).filter((h) => clearingProviders.includes(h.clearer || '') && h.a > 0 && !!h.d);
    const distinctMonths = new Set(nd.map((h) => h.d.slice(0, 7)));
    return distinctMonths;
}
export function inner$detectRecurringHok$map$distinctMonths$$step(nd) {
    const distinctMonths = new Set(nd.map((h) => h.d.slice(0, 7)));
    return distinctMonths;
}
export function inner$detectRecurringHok$map$cur(parts) {
    const cur = parts[1] === '$' ? '$' : '₪';
    return cur;
}
export function inner$detectRecurringHok$map$dates(clearingProviders, sp) {
    const nd = (sp.hist ?? []).filter((h) => clearingProviders.includes(h.clearer || '') && h.a > 0 && !!h.d);
    const dates = nd.map((h) => h.d).sort();
    return dates;
}
export function inner$detectRecurringHok$map$dates$$step(nd) {
    const dates = nd.map((h) => h.d).sort();
    return dates;
}

export const SIGS = {
  inner$detectRecurringHok$map$nd: [{"name":"clearingProviders","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$detectRecurringHok$map$kevaCharge: [{"name":"clearingProviders","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$detectRecurringHok$map$kevaCharge$$step: [{"name":"nd","d":{"t":"any"},"opt":false}],
  inner$detectRecurringHok$map$distinctMonths: [{"name":"clearingProviders","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$detectRecurringHok$map$distinctMonths$$step: [{"name":"nd","d":{"t":"any"},"opt":false}],
  inner$detectRecurringHok$map$cur: [{"name":"parts","d":{"t":"any"},"opt":false}],
  inner$detectRecurringHok$map$dates: [{"name":"clearingProviders","d":{"t":"any"},"opt":false},{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$detectRecurringHok$map$dates$$step: [{"name":"nd","d":{"t":"any"},"opt":false}],
};
