// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:api/server_minimal.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$SimpleAssetManagerAPI$handleCreateUser$on$user(body) {
    const user = JSON.parse(body);
    return user;
}
export function inner$SimpleAssetManagerAPI$handleCreateAsset$on$asset(body) {
    const asset = JSON.parse(body);
    return asset;
}

export const SIGS = {
  inner$SimpleAssetManagerAPI$handleCreateUser$on$user: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$SimpleAssetManagerAPI$handleCreateAsset$on$asset: [{"name":"body","d":{"t":"str"},"opt":false}],
};
