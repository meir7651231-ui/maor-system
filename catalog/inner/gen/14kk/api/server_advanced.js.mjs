// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:api/server_advanced.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$AdvancedAssetManagerAPI$updateTask$taskId(req) {
    const taskId = req.url.split('/')[3];
    return taskId;
}
export function inner$AdvancedAssetManagerAPI$updateTask$on$updates(body) {
    const updates = JSON.parse(body);
    return updates;
}
export function inner$AdvancedAssetManagerAPI$deleteTask$taskId(req) {
    const taskId = req.url.split('/')[3];
    return taskId;
}
export function inner$AdvancedAssetManagerAPI$handleRegister$on$username(body) {
    const { username, email, password } = JSON.parse(body);
    return username;
}
export function inner$AdvancedAssetManagerAPI$handleRegister$on$email(body) {
    const { username, email, password } = JSON.parse(body);
    return email;
}
export function inner$AdvancedAssetManagerAPI$handleRegister$on$password(body) {
    const { username, email, password } = JSON.parse(body);
    return password;
}

export const SIGS = {
  inner$AdvancedAssetManagerAPI$updateTask$taskId: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$AdvancedAssetManagerAPI$updateTask$on$updates: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$AdvancedAssetManagerAPI$deleteTask$taskId: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$AdvancedAssetManagerAPI$handleRegister$on$username: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$AdvancedAssetManagerAPI$handleRegister$on$email: [{"name":"body","d":{"t":"str"},"opt":false}],
  inner$AdvancedAssetManagerAPI$handleRegister$on$password: [{"name":"body","d":{"t":"str"},"opt":false}],
};
