// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/supporters/SupporterCard.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$IntelPanel$max(mo) {
    const max = Math.max(1, ...mo);
    return max;
}
export function inner$SupporterCard$map$on(tab, t) {
    const on = t.key === tab;
    return on;
}

export const SIGS = {
  inner$IntelPanel$max: [{"name":"mo","d":{"t":"arr","of":{"t":"num"}},"opt":false}],
  inner$SupporterCard$map$on: [{"name":"tab","d":{"t":"lit","v":["card","intel"]},"opt":false},{"name":"t","d":{"t":"obj","p":[["key",{"t":"lit","v":["card","intel"]},false],["label",{"t":"str"},false]]},"opt":false}],
};
