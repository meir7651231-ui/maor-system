// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sup-don-events.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supDonEvents$out(sp, T2) {
    const out = (sp.donations || []).map((d) => ({
        date: d.date,
        amount: d.amount,
        cur: d.cur || '₪',
        src: T2.k1 + d.rid,
        rid: d.rid,
    }));
    return out;
}
export function inner$supDonEvents$meta(T2, h) {
    const meta = [
        h.receipt && T2.k1 + h.receipt,
        h.txn && T2.k2 + h.txn,
        h.ref && T2.k3 + h.ref,
        h.brand,
        h.last4 && '•' + h.last4,
        h.clearer,
        h.pays && h.pays > 1 && h.pays + T2.k4,
        h.status,
    ]
        .filter(Boolean)
        .join(' · ');
    return meta;
}
export function inner$supDonEvents$seen(out) {
    const seen = new Set(out.map((x) => x.date));
    return seen;
}

export const SIGS = {
  inner$supDonEvents$out: [{"name":"sp","d":{"t":"any"},"opt":false},{"name":"T2","d":{"t":"any"},"opt":false}],
  inner$supDonEvents$meta: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$supDonEvents$seen: [{"name":"out","d":{"t":"any"},"opt":false}],
};
