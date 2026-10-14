// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/ask-claude.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$askClaude$text(T, data) {
    const text = (data.content ?? []).filter((b) => b.type === T.k14).map((b) => b.text ?? '').join('');
    return text;
}

export const SIGS = {
  inner$askClaude$text: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"data","d":{"t":"any"},"opt":false}],
};
