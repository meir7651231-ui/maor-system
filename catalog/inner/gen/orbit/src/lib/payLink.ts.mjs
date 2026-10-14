// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/payLink.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$payLink$amt(amount) {
    const amt = String(Math.max(0, Math.round(amount * 100) / 100));
    return amt;
}

export const SIGS = {
  inner$payLink$amt: [{"name":"amount","d":{"t":"num"},"opt":false}],
};
