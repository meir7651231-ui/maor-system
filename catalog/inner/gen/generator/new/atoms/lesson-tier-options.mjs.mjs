// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/lesson-tier-options.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$lessonTierOptions$out(c, T) {
    const out = [{ v: '', t: T.k1 + (c.lessonPrice || 0) }];
    return out;
}

export const SIGS = {
  inner$lessonTierOptions$out: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
