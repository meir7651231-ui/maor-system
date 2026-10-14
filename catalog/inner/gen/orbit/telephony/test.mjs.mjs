// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/test.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$addMin$h(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h;
}
export function inner$addMin$m(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return m;
}
export function inner$addMin$x(hhmm, d) {
    const [h, m] = hhmm.split(':').map(Number);
    const x = ((h * 60 + m + d) % 1440 + 1440) % 1440;
    return x;
}
export function inner$addMin$x$$step(d, h, m) {
    const x = ((h * 60 + m + d) % 1440 + 1440) % 1440;
    return x;
}

export const SIGS = {
  inner$addMin$h: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$addMin$m: [{"name":"hhmm","d":{"t":"any"},"opt":false}],
  inner$addMin$x: [{"name":"hhmm","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"any"},"opt":false}],
  inner$addMin$x$$step: [{"name":"d","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
