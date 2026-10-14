// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/validate-heb-month-names.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$validateHebMonthNames$gy(hebYear, T) {
    const gy = hebYear - T.k1;
    return gy;
}

export const SIGS = {
  inner$validateHebMonthNames$gy: [{"name":"hebYear","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
