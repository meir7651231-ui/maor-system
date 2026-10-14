// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/cockpit-hok-tasks.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$cockpitHokTasks$map$money(hok) {
    const money = hok.cur === '$' ? '$' + hok.amount.toLocaleString('en-US') : '₪' + hok.amount.toLocaleString('he-IL');
    return money;
}

export const SIGS = {
  inner$cockpitHokTasks$map$money: [{"name":"hok","d":{"t":"any"},"opt":false}],
};
