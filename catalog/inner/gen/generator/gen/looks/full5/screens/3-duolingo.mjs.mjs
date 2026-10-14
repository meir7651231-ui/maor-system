// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/full5/screens/3-duolingo.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$body$av$bg(cols, i) {
    const [bg, fg] = cols[i % 5].split(':');
    return bg;
}
export function inner$body$av$fg(cols, i) {
    const [bg, fg] = cols[i % 5].split(':');
    return fg;
}
export function inner$body$nodes(D) {
    const nodes = [
        ['done', '₪', 'גבייה', D.pct + '% הושלמו'],
        ['done', '👥', 'נוכחות צוות', D.present + ' מתוך ' + D.staff],
        ['', '📚', 'נוכחות תלמידים', D.attAll + '% השבוע'],
        ['', '❤', 'מגבית הבניין', Math.round(D.raised / D.goal * 100) + '% מהיעד'],
        ['locked', '🤝', 'ועדת גמ״ח', D.loansOpen + ' בקשות'],
        ['locked', '👑', 'קבלת קהל', D.queueN + ' ממתינים'],
        ['locked', '🔧', 'קריאות שירות', D.calls.length + ' פתוחות'],
        ['locked', '📊', 'דוח לוועד', 'סוף החודש'],
    ];
    return nodes;
}

export const SIGS = {
  inner$body$av$bg: [{"name":"cols","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$body$av$fg: [{"name":"cols","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$body$nodes: [{"name":"D","d":{"t":"any"},"opt":false}],
};
