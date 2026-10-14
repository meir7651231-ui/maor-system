// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/supporter-visible-for-designations.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supporterVisibleForDesignations$fw(sup) {
    const fw = (sup.forWho ?? '').trim();
    return fw;
}

export const SIGS = {
  inner$supporterVisibleForDesignations$fw: [{"name":"sup","d":{"t":"any"},"opt":false}],
};
