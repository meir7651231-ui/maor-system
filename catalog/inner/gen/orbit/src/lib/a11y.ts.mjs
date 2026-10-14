// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/a11y.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$parseAcc$a(raw) {
    const a = JSON.parse(raw);
    return a;
}

export const SIGS = {
  inner$parseAcc$a: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
};
