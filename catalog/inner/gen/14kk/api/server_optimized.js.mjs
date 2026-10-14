// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:api/server_optimized.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$OptimizedAPIServer$getAssets$cacheKey(req) {
    const cacheKey = 'assets:' + JSON.stringify(req.query);
    return cacheKey;
}
export function inner$OptimizedAPIServer$deleteAsset$result(id) {
    const result = { deleted: true, id: parseInt(id) };
    return result;
}
export function inner$OptimizedAPIServer$setupErrorHandling$use$errorResponse(err, process) {
    const errorResponse = process.env.NODE_ENV === 'production'
        ? { error: 'Internal server error' }
        : { error: err.message, stack: err.stack };
    return errorResponse;
}

export const SIGS = {
  inner$OptimizedAPIServer$getAssets$cacheKey: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$OptimizedAPIServer$deleteAsset$result: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$OptimizedAPIServer$setupErrorHandling$use$errorResponse: [{"name":"err","d":{"t":"any"},"opt":false},{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["NODE_TLS_REJECT_UNAUTHORIZED",{"t":"str"},false]]},false]]},"opt":false}],
};
