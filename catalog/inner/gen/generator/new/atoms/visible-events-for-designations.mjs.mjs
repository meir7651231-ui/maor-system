// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/visible-events-for-designations.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$visibleEventsForDesignations$byId(supporters) {
    const byId = new Map(supporters.map((s) => [s.id, s]));
    return byId;
}
export function inner$visibleEventsForDesignations$filter$sp(byId, ev) {
    const sp = byId.get(ev.spId);
    return sp;
}

export const SIGS = {
  inner$visibleEventsForDesignations$byId: [{"name":"supporters","d":{"t":"any"},"opt":false}],
  inner$visibleEventsForDesignations$filter$sp: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"ev","d":{"t":"any"},"opt":false}],
};
