// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/explain-call.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$explainCall$office(tenant) {
    const office = tenant.destinations?.office?.ext?.join(', ') || '—';
    return office;
}
export function inner$explainCall$when(call, DOW_HE, T) {
    const when = call.dow != null ? `${T.k32}${DOW_HE[call.dow]} ${call.hhmm || ''}` : call.date ? `${call.date} ${call.hhmm || ''}` : '';
    return when;
}
export function inner$explainCall$trg(T, sim) {
    const trg = sim.path.includes(T.k28) ? T.k29 : T.k30;
    return trg;
}

export const SIGS = {
  inner$explainCall$office: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$explainCall$when: [{"name":"call","d":{"t":"obj","p":[]},"opt":false},{"name":"DOW_HE","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$explainCall$trg: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"sim","d":{"t":"any"},"opt":false}],
};
