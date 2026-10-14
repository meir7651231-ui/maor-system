// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/parnasa/hooks.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$usePrBrand$c(community) {
    const c = (community ?? '').trim();
    return c;
}

export const SIGS = {
  inner$usePrBrand$c: [{"name":"community","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
};
