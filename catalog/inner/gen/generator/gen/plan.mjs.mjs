// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/plan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$derivePlan$n(NEEDS, d) {
    const n = NEEDS.find((x) => x.from && x.from.dashboard === d.op);
    return n;
}

export const SIGS = {
  inner$derivePlan$n: [{"name":"NEEDS","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
};
