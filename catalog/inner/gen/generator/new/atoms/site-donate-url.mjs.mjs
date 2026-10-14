// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/site-donate-url.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$siteDonateUrl$payUrl(T, pay) {
    const payUrl = pay && typeof pay.payUrl === T.k1 ? pay.payUrl : '';
    return payUrl;
}

export const SIGS = {
  inner$siteDonateUrl$payUrl: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"pay","d":{"t":"any"},"opt":false}],
};
