// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/makeup-eligibility.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$makeupEligibility$earlyCancel(rawHrs, T) {
    const earlyCancel = rawHrs != null && rawHrs >= T.k2;
    return earlyCancel;
}

export const SIGS = {
  inner$makeupEligibility$earlyCancel: [{"name":"rawHrs","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
