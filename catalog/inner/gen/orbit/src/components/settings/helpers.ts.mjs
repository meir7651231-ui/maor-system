// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/settings/helpers.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fmtDate$p(iso) {
    const p = iso.slice(0, 10).split('-');
    return p;
}
export function inner$fmtDateTime$time(iso) {
    const time = iso.length > 15 ? iso.slice(11, 16) : '';
    return time;
}

export const SIGS = {
  inner$fmtDate$p: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtDateTime$time: [{"name":"iso","d":{"t":"str"},"opt":false}],
};
