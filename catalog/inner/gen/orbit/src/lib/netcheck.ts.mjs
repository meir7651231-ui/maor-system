// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/netcheck.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$netCheckScript$blocked(results) {
    const blocked = results.filter((r) => !r.ok);
    return blocked;
}

export const SIGS = {
  inner$netCheckScript$blocked: [{"name":"results","d":{"t":"arr","of":{"t":"obj","n":"NetCheckResult","p":[["ok",{"t":"bool"},false],["ms",{"t":"num"},false],["key",{"t":"str"},false],["label",{"t":"str"},false],["url",{"t":"str"},false],["method",{"t":"or","of":[{"t":"lit","v":["GET","POST"]},{"t":"undef"}]},true],["body",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["domain",{"t":"str"},false]]}},"opt":false}],
};
