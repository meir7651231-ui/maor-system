// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/reports/CustomExport.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CustomExport$notesIdx(rows) {
    const notesIdx = rows ? rows[0].indexOf('הערות') : -1;
    return notesIdx;
}

export const SIGS = {
  inner$CustomExport$notesIdx: [{"name":"rows","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}}}]},"opt":false}],
};
