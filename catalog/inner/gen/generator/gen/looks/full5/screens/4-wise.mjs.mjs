// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/full5/screens/4-wise.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$body$c$bg(cols, i) {
    const [bg, fg] = cols[i % 4].split(':');
    return bg;
}
export function inner$body$c$fg(cols, i) {
    const [bg, fg] = cols[i % 4].split(':');
    return fg;
}
export function inner$body$groups(D) {
    const groups = [['היום', D.payList.slice(0, 5)], ['אתמול', D.payList.slice(5, 10)], ['השבוע', D.payList.slice(10, 16)]];
    return groups;
}

export const SIGS = {
  inner$body$c$bg: [{"name":"cols","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$body$c$fg: [{"name":"cols","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$body$groups: [{"name":"D","d":{"t":"any"},"opt":false}],
};
