// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/cockpit-feed.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$cockpitFeed$map$money(e) {
    const money = e.amount > 0 ? (e.cur === '$' ? '$' + e.amount.toLocaleString('en-US') : '₪' + e.amount.toLocaleString('he-IL')) : '';
    return money;
}

export const SIGS = {
  inner$cockpitFeed$map$money: [{"name":"e","d":{"t":"any"},"opt":false}],
};
