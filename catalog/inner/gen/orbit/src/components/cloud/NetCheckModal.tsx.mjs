// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/cloud/NetCheckModal.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$NetCheckModal$blocked(results) {
    const blocked = (results ?? []).filter((r) => !r.ok);
    return blocked;
}
export function inner$NetCheckModal$faint(orbit) {
    const faint = orbit ? 'rgba(255,255,255,.5)' : 'var(--ink-faint)';
    return faint;
}

export const SIGS = {
  inner$NetCheckModal$blocked: [{"name":"results","d":{"t":"or","of":[{"t":"null"},{"t":"arr","of":{"t":"obj","n":"NetCheckResult","p":[["ok",{"t":"bool"},false],["ms",{"t":"num"},false],["key",{"t":"str"},false],["label",{"t":"str"},false],["url",{"t":"str"},false],["method",{"t":"or","of":[{"t":"lit","v":["GET","POST"]},{"t":"undef"}]},true],["body",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["domain",{"t":"str"},false]]}}]},"opt":false}],
  inner$NetCheckModal$faint: [{"name":"orbit","d":{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},"opt":false}],
};
