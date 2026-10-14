// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/people/money.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$LOOK$money(t) {
    const money = ['refund', 'reverse', 'undo', 'cancel', 'dispute', 'chargeback', 'reversal', 'void'].filter(w => new RegExp('\\b' + w, 'i').test(t));
    return money;
}
export function inner$LOOK$secs(t) {
    const secs = [...new Set((t.match(/\b\d+\s*(seconds?|minutes?|hours?|days?|business days?)\b/gi) || []).map(s => s.replace(/\s+/g, ' ').trim()))].slice(0, 8);
    return secs;
}
export function inner$LOOK$gate(t) {
    const gate = ['log in', 'sign in', 'download the app', 'get the app'].filter(w => t.toLowerCase().includes(w));
    return gate;
}

export const SIGS = {
  inner$LOOK$money: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$LOOK$secs: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$LOOK$gate: [{"name":"t","d":{"t":"str"},"opt":false}],
};
