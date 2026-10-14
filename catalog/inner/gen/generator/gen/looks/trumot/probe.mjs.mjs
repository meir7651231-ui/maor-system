// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/trumot/probe.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$VERIFY$low(t) {
    const low = t.toLowerCase();
    return low;
}
export function inner$VERIFY$wall(t) {
    const low = t.toLowerCase();
    const wall = ['create account', 'join now', 'sign up to continue', 'log in to continue'].filter(w => low.includes(w));
    return wall;
}
export function inner$VERIFY$wall$$step(low) {
    const wall = ['create account', 'join now', 'sign up to continue', 'log in to continue'].filter(w => low.includes(w));
    return wall;
}
export function inner$VERIFY$money(t) {
    const money = (t.match(/[₪$£€]\s?[\d,]{2,}/g) || []).length;
    return money;
}
export function inner$VERIFY$goal(t) {
    const goal = /goal|raised|target|יעד|נאספו|גויס/i.test(t);
    return goal;
}
export function inner$VERIFY$donors(t) {
    const donors = /donor|backer|supporter|תורמ|תומכ/i.test(t);
    return donors;
}

export const SIGS = {
  inner$VERIFY$low: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$wall: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$wall$$step: [{"name":"low","d":{"t":"str"},"opt":false}],
  inner$VERIFY$money: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$goal: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$donors: [{"name":"t","d":{"t":"str"},"opt":false}],
};
