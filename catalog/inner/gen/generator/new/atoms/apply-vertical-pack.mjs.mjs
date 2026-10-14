// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/apply-vertical-pack.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$applyVerticalPack$pack(packId, packs) {
    const pack = packs.find((p) => p.id === packId);
    return pack;
}

export const SIGS = {
  inner$applyVerticalPack$pack: [{"name":"packId","d":{"t":"any"},"opt":false},{"name":"packs","d":{"t":"any"},"opt":false}],
};
