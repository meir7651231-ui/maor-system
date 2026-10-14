// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/seasonality.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const M = (iso) => {
    // YYYY-MM-DD → חודש. זול, בלי Date.
    const m = +iso.slice(5, 7);
    return m >= 1 && m <= 12 ? m : 0;
};
export function inner$M$m(iso) {
    const m = +iso.slice(5, 7);
    return m;
}
export function inner$seasonality$take$m(date) {
    const m = M(date);
    return m;
}
export function inner$seasonality$v(ils, m) {
    const v = Math.round(ils[m]);
    return v;
}
export function inner$donorRhythm$take$m(date) {
    const m = M(date);
    return m;
}
export function inner$donorRhythm$take$v(rate, amount, cur) {
    const v = (cur || '₪') === '$' ? amount * rate : amount;
    return v;
}
export function inner$donorRhythm$concentration(ils, total) {
    let topMonth = 0;
    let topIls = -1;
    for (let m = 1; m <= 12; m++)
        if (ils[m] > topIls) {
            topIls = ils[m];
            topMonth = m;
        }
    const concentration = total > 0 ? Math.round((topIls / total) * 100) : 0;
    return concentration;
}
export function inner$donorRhythm$concentration$$step(total, topIls) {
    const concentration = total > 0 ? Math.round((topIls / total) * 100) : 0;
    return concentration;
}
export function inner$donorRhythm$topMonth$$after_loop(ils) {
    let topMonth = 0;
    let topIls = -1;
    for (let m = 1; m <= 12; m++)
        if (ils[m] > topIls) {
            topIls = ils[m];
            topMonth = m;
        }
    return topMonth;
}
export function inner$donorRhythm$topIls$$after_loop(ils) {
    let topMonth = 0;
    let topIls = -1;
    for (let m = 1; m <= 12; m++)
        if (ils[m] > topIls) {
            topIls = ils[m];
            topMonth = m;
        }
    return topIls;
}

export const SIGS = {
  inner$M$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$seasonality$take$m: [{"name":"date","d":{"t":"str"},"opt":false}],
  inner$seasonality$v: [{"name":"ils","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"m","d":{"t":"num"},"opt":false}],
  inner$donorRhythm$take$m: [{"name":"date","d":{"t":"str"},"opt":false}],
  inner$donorRhythm$take$v: [{"name":"rate","d":{"t":"num"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false},{"name":"cur","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$donorRhythm$concentration: [{"name":"ils","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"total","d":{"t":"num"},"opt":false}],
  inner$donorRhythm$concentration$$step: [{"name":"total","d":{"t":"num"},"opt":false},{"name":"topIls","d":{"t":"num"},"opt":false}],
  inner$donorRhythm$topMonth$$after_loop: [{"name":"ils","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$donorRhythm$topIls$$after_loop: [{"name":"ils","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
};
