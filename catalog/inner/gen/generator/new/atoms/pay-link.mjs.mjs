// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/pay-link.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$payLink$amt(amount, T) {
    const amt = String(Math.max(0, Math.round(amount * T.k7) / T.k7));
    return amt;
}

export const SIGS = {
  inner$payLink$amt: [{"name":"amount","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
