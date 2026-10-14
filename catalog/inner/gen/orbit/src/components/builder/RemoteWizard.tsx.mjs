// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/builder/RemoteWizard.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$restoreBuilderPrev$prev(raw) {
    const prev = JSON.parse(raw);
    return prev;
}
export function inner$restoreBuilderPrev$cfg(raw) {
    const prev = JSON.parse(raw);
    const cfg = prev.config ?? (prev.slug ? prev : null);
    return cfg;
}
export function inner$restoreBuilderPrev$cfg$$step(prev) {
    const cfg = prev.config ?? (prev.slug ? prev : null);
    return cfg;
}

export const SIGS = {
  inner$restoreBuilderPrev$prev: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$restoreBuilderPrev$cfg: [{"name":"raw","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$restoreBuilderPrev$cfg$$step: [{"name":"prev","d":{"t":"obj","p":[["config",{"t":"any"},true],["uiTheme",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},true],["uiAccent",{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"str"}]},true],["slug",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
};
