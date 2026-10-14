// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/open-dek.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$openDek$wrap(env, via, T) {
    const wrap = via === T.k1 ? env.wrapPass : env.wrapRec;
    return wrap;
}

export const SIGS = {
  inner$openDek$wrap: [{"name":"env","d":{"t":"any"},"opt":false},{"name":"via","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
