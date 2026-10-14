// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/switchboard/summary.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$todaySummary$text(t) {
    const text = typeof t === 'string' ? t.replace(/\s+/g, ' ').trim() : '';
    return text;
}
export function inner$summaryHeader$dow(iso) {
    const dow = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay();
    return dow;
}
export function inner$shareWaUrl$t(text) {
    const t = encodeURIComponent(text);
    return t;
}

export const SIGS = {
  inner$todaySummary$text: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$summaryHeader$dow: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$shareWaUrl$t: [{"name":"text","d":{"t":"str"},"opt":false}],
};
