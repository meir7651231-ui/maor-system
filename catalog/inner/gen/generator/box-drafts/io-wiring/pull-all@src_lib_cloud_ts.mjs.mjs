// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:box-drafts/io-wiring/pull-all@src_lib_cloud_ts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pullAll$arr(bySup, supporterId) {
    const arr = bySup.get(supporterId) ?? [];
    return arr;
}

export const SIGS = {
  inner$pullAll$arr: [{"name":"bySup","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"supporterId","d":{"t":"any"},"opt":false}],
};
