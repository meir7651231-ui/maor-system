// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/EditableText.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$EditableText$commit$v(draft) {
    const v = draft.trim();
    return v;
}

export const SIGS = {
  inner$EditableText$commit$v: [{"name":"draft","d":{"t":"str"},"opt":false}],
};
