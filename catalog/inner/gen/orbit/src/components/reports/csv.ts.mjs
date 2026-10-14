// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/reports/csv.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$esc$v(x) {
    let v = String(x ?? '');
    return v;
}

export const SIGS = {
  inner$esc$v: [{"name":"x","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
};
