// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/to-tenant-id.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$toTenantId$base(slug, orgName, T) {
    const base = (slug && slug !== T.k1 ? slug : orgName || T.k2)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, T.k4);
    return base;
}
export function inner$toTenantId$padded(slug, orgName, T) {
    const base = (slug && slug !== T.k1 ? slug : orgName || T.k2)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, T.k4);
    const padded = base.length >= 3 ? base : `${base}${T.k3}`;
    return padded;
}
export function inner$toTenantId$padded$$step(T, base) {
    const padded = base.length >= 3 ? base : `${base}${T.k3}`;
    return padded;
}

export const SIGS = {
  inner$toTenantId$base: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"orgName","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$toTenantId$padded: [{"name":"slug","d":{"t":"any"},"opt":false},{"name":"orgName","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$toTenantId$padded$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"any"},"opt":false}],
};
