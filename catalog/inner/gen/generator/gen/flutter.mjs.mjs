// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/flutter.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const toSpecDs = (specText) => specText.replace(/\[(תאריך|טלפון|מזהה|כמות)\]/g, '').replace(/\(-?\d+\.\.-?\d+\)/g, '').replace(/ \| (אסור|הרגע|מסך|תיקון):[^|\n]*/g, '');
export function inner$buildFlutter$specDs(specText) {
    const specDs = toSpecDs(specText);
    return specDs;
}
export function inner$buildFlutter$ns(slug) {
    const ns = 'gen' + slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ns;
}
export function inner$buildFlutter$tail(r) {
    const tail = (r.stdout || '').trim().split('\n').slice(-3).join('\n');
    return tail;
}

export const SIGS = {
  inner$buildFlutter$specDs: [{"name":"specText","d":{"t":"any"},"opt":false}],
  inner$buildFlutter$ns: [{"name":"slug","d":{"t":"any"},"opt":false}],
  inner$buildFlutter$tail: [{"name":"r","d":{"t":"any"},"opt":false}],
};
