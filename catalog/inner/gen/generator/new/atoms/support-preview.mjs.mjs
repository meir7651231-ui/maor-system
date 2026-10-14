// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/support-preview.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supportPreview$t(text) {
    const t = (text ?? '').replace(/\s+/gu, ' ').trim();
    return t;
}

export const SIGS = {
  inner$supportPreview$t: [{"name":"text","d":{"t":"any"},"opt":false}],
};
