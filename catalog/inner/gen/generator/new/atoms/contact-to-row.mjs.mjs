// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/contact-to-row.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$contactToRow$notes(c) {
    const notes = [c.org ? '🏢 ' + c.org : '', c.title, c.note].filter(Boolean).join(' · ');
    return notes;
}

export const SIGS = {
  inner$contactToRow$notes: [{"name":"c","d":{"t":"any"},"opt":false}],
};
