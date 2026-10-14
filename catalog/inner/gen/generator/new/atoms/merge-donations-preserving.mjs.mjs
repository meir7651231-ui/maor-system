// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/merge-donations-preserving.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$mergeDonationsPreserving$localDon(local) {
    const localDon = Array.isArray(local.donations) ? local.donations : [];
    return localDon;
}
export function inner$mergeDonationsPreserving$incDon(incoming) {
    const incDon = Array.isArray(incoming.donations) ? incoming.donations : [];
    return incDon;
}
export function inner$mergeDonationsPreserving$incRids(incoming) {
    const incDon = Array.isArray(incoming.donations) ? incoming.donations : [];
    const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
    return incRids;
}
export function inner$mergeDonationsPreserving$incRids$$step(incDon) {
    const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
    return incRids;
}
export function inner$mergeDonationsPreserving$localOnly(local, incoming) {
    const localDon = Array.isArray(local.donations) ? local.donations : [];
    const incDon = Array.isArray(incoming.donations) ? incoming.donations : [];
    const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
    const localOnly = localDon.filter((d) => d && d.rid && !incRids.has(d.rid));
    return localOnly;
}
export function inner$mergeDonationsPreserving$localOnly$$step(localDon, incRids) {
    const localOnly = localDon.filter((d) => d && d.rid && !incRids.has(d.rid));
    return localOnly;
}

export const SIGS = {
  inner$mergeDonationsPreserving$localDon: [{"name":"local","d":{"t":"any"},"opt":false}],
  inner$mergeDonationsPreserving$incDon: [{"name":"incoming","d":{"t":"any"},"opt":false}],
  inner$mergeDonationsPreserving$incRids: [{"name":"incoming","d":{"t":"any"},"opt":false}],
  inner$mergeDonationsPreserving$incRids$$step: [{"name":"incDon","d":{"t":"any"},"opt":false}],
  inner$mergeDonationsPreserving$localOnly: [{"name":"local","d":{"t":"any"},"opt":false},{"name":"incoming","d":{"t":"any"},"opt":false}],
  inner$mergeDonationsPreserving$localOnly$$step: [{"name":"localDon","d":{"t":"any"},"opt":false},{"name":"incRids","d":{"t":"set","of":{"t":"any"}},"opt":false}],
};
