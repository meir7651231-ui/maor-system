// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:services/api-gateway/server.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$verifyToken$token(authHeader) {
    const token = authHeader && authHeader.split(' ')[1];
    return token;
}
export function inner$optionalAuth$token(authHeader) {
    const token = authHeader && authHeader.split(' ')[1];
    return token;
}

export const SIGS = {
  inner$verifyToken$token: [{"name":"authHeader","d":{"t":"any"},"opt":false}],
  inner$optionalAuth$token: [{"name":"authHeader","d":{"t":"any"},"opt":false}],
};
