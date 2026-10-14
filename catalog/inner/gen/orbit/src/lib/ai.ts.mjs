// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/ai.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$writeAiKey$t(key) {
    const t = key.trim();
    return t;
}
export function inner$askClaude$text(data) {
    const text = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
    return text;
}

export const SIGS = {
  inner$writeAiKey$t: [{"name":"key","d":{"t":"str"},"opt":false}],
  inner$askClaude$text: [{"name":"data","d":{"t":"obj","p":[["content",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["type",{"t":"str"},false],["text",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true]]},"opt":false}],
};
