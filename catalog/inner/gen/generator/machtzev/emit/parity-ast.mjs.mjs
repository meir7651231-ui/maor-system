// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/emit/parity-ast.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$k(b) {
    const k = (b.match(/node לא-מטופל \w+|error - [^:]+|Undefined|Expected|isn't defined/) || ['אחר'])[0].slice(0, 40);
    return k;
}

export const SIGS = {
  inner$forEach$k: [{"name":"b","d":{"t":"str"},"opt":false}],
};
