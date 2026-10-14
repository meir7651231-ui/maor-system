// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/component-counts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$componentCounts$out$$after_loop(p) {
    const out = { meeting: 0, coupon: 0, gift: 0, holidayGift: 0 };
    for (const c of p.components)
        out[c.kind]++;
    return out;
}

export const SIGS = {
  inner$componentCounts$out$$after_loop: [{"name":"p","d":{"t":"any"},"opt":false}],
};
