// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/support-msg-time.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supportMsgTime$d(at) {
    const d = new Date(at.includes('T') ? at : at + 'T12:00:00');
    return d;
}

export const SIGS = {
  inner$supportMsgTime$d: [{"name":"at","d":{"t":"any"},"opt":false}],
};
