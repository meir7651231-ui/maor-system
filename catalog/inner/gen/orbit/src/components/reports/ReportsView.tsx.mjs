// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/reports/ReportsView.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ReportsView$rangeError(range) {
    const rangeError = range.from && range.to && range.from > range.to
        ? 'טווח תאריכים שגוי — תאריך ההתחלה מאוחר מתאריך הסיום'
        : '';
    return rangeError;
}

export const SIGS = {
  inner$ReportsView$rangeError: [{"name":"range","d":{"t":"obj","n":"DateRange","p":[["from",{"t":"str"},false],["to",{"t":"str"},false]]},"opt":false}],
};
