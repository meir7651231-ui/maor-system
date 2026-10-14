// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/cockpit-thanks.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const latestDonation = (sp) => {
    let best = null;
    for (const d of sp.donations) {
        if (!d.date)
            continue;
        if (!best || d.date > best.date)
            best = { date: d.date, amount: d.amount, cur: d.cur || '₪' };
    }
    for (const h of sp.hist ?? []) {
        if (!h.d)
            continue;
        if (!best || h.d > best.date)
            best = { date: h.d, amount: h.a, cur: h.c || '₪' };
    }
    return best;
};
export function inner$cockpitThanks$last(sp) {
    const last = latestDonation(sp);
    return last;
}
export function inner$cockpitThanks$money(sp) {
    const last = latestDonation(sp);
    const money = last.cur === '$' ? '$' + last.amount.toLocaleString('en-US') : '₪' + last.amount.toLocaleString('he-IL');
    return money;
}
export function inner$cockpitThanks$money$$step(last) {
    const money = last.cur === '$' ? '$' + last.amount.toLocaleString('en-US') : '₪' + last.amount.toLocaleString('he-IL');
    return money;
}

export const SIGS = {
  inner$cockpitThanks$last: [{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$cockpitThanks$money: [{"name":"sp","d":{"t":"any"},"opt":false}],
  inner$cockpitThanks$money$$step: [{"name":"last","d":{"t":"or","of":[{"t":"null"},{"t":"obj","p":[["date",{"t":"any"},false],["amount",{"t":"any"},false],["cur",{"t":"any"},false]]}]},"opt":false}],
};
