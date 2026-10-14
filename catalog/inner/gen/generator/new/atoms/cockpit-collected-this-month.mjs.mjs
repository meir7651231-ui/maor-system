// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/cockpit-collected-this-month.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$cockpitCollectedThisMonth$month(todayIso) {
    const month = todayIso.slice(0, 7);
    return month;
}
export function inner$cockpitCollectedThisMonth$sum$$after_loop(supporters, todayIso, rate) {
    const month = todayIso.slice(0, 7);
    let sum = 0;
    for (const sp of supporters) {
        for (const d of sp.donations) {
            if (!d.date.startsWith(month))
                continue;
            sum += (d.cur || '₪') === '$' ? d.amount * rate : d.amount;
        }
        for (const h of sp.hist ?? []) {
            if (!(h.d || '').startsWith(month))
                continue;
            sum += (h.c || '₪') === '$' ? h.a * rate : h.a;
        }
    }
    return sum;
}

export const SIGS = {
  inner$cockpitCollectedThisMonth$month: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$cockpitCollectedThisMonth$sum$$after_loop: [{"name":"supporters","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"rate","d":{"t":"num"},"opt":false}],
};
