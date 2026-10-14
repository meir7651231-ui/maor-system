// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/calendar/CalViewTabs.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CalViewTabs$map$on(mode, m) {
    const on = m === mode;
    return on;
}

export const SIGS = {
  inner$CalViewTabs$map$on: [{"name":"mode","d":{"t":"lit","v":["week","month","day"]},"opt":false},{"name":"m","d":{"t":"lit","v":["week","month","day"]},"opt":false}],
};
