// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/PostForm.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function splitTokens(s) {
    return s
        .split(/[,،\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
}
export function inner$PostForm$map$toks(timesText, i) {
    const toks = splitTokens(timesText[i] ?? '');
    return toks;
}

export const SIGS = {
  inner$PostForm$map$toks: [{"name":"timesText","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
};
