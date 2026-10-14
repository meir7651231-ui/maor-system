// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/reconvert-data.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const dartType = (v) => {
    if (v === null)
        return 'Object?'; // null חייב טיפוס-nullable (Object לא-nullable ⇒ שגיאת-קומפילציה)
    if (typeof v === 'string')
        return 'String';
    if (typeof v === 'number')
        return Number.isInteger(v) ? 'int' : 'double';
    if (typeof v === 'boolean')
        return 'bool';
    if (Array.isArray(v)) {
        const ts = new Set(v.map(dartType));
        return `List<${ts.size === 1 ? [...ts][0] : 'Object'}>`;
    }
    if (v && typeof v === 'object') {
        const ts = new Set(Object.values(v).map(dartType));
        return `Map<String, ${ts.size === 1 ? [...ts][0] : 'Object'}>`;
    }
    return 'Object';
};
export function inner$dartType$ts(v) {
    const ts = new Set(v.map(dartType));
    return ts;
}
export function inner$dartType$ts_L27(v) {
    const ts = new Set(Object.values(v).map(dartType));
    return ts;
}

export const SIGS = {
  inner$dartType$ts: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$dartType$ts_L27: [{"name":"v","d":{"t":"any"},"opt":false}],
};
