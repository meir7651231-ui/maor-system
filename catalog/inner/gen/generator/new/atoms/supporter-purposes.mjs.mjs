// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/supporter-purposes.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supporterPurposes$fw(sup) {
    const fw = (sup.forWho ?? '').trim();
    return fw;
}
export function inner$supporterPurposes$p(d) {
    const p = (d.purpose ?? '').trim();
    return p;
}

export const SIGS = {
  inner$supporterPurposes$fw: [{"name":"sup","d":{"t":"any"},"opt":false}],
  inner$supporterPurposes$p: [{"name":"d","d":{"t":"any"},"opt":false}],
};
