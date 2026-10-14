// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/is-org-manager.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isOrgManager$m(org) {
    const m = (org.manager ?? '').trim().toLowerCase();
    return m;
}

export const SIGS = {
  inner$isOrgManager$m: [{"name":"org","d":{"t":"any"},"opt":false}],
};
