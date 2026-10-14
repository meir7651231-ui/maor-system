// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/courses/CoursesDashboard.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$CoursesDashboard$useMemo$sort$cc(va, vb) {
    const cc = typeof va === 'string' ? va.localeCompare(String(vb), 'he') : va - vb;
    return cc;
}

export const SIGS = {
  inner$CoursesDashboard$useMemo$sort$cc: [{"name":"va","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false},{"name":"vb","d":{"t":"or","of":[{"t":"str"},{"t":"num"}]},"opt":false}],
};
