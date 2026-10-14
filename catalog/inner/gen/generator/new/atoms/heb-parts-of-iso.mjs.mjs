// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/heb-parts-of-iso.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hebPartsOfIso$hp(hpCacheShared, iso) {
    let hp = hpCacheShared.get(iso);
    return hp;
}

export const SIGS = {
  inner$hebPartsOfIso$hp: [{"name":"hpCacheShared","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"iso","d":{"t":"any"},"opt":false}],
};
