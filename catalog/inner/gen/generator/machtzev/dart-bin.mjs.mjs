// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/dart-bin.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$resolveFlutter$F(process) {
    const F = (process.env.FLUTTER || '').replace(/\/+$/, '');
    return F;
}
export function inner$parseAnalyze$s(text) {
    const s = String(text == null ? '' : text);
    return s;
}
export function inner$parseAnalyze$lines(text) {
    const s = String(text == null ? '' : text);
    const lines = s.split('\n');
    return lines;
}
export function inner$parseAnalyze$lines$$step(s) {
    const lines = s.split('\n');
    return lines;
}
export function inner$parseAnalyze$map$m(l) {
    const m = l.match(/^\s*error • (.*) • (\S+):(\d+):(\d+) • (\S+)\s*$/);
    return m;
}
export function inner$parseAnalyze$issues(text) {
    const s = String(text == null ? '' : text);
    const issues = ((s.match(/^(\d+) issues? found\./m) || [])[1] ?? (/No issues found!/.test(s) ? '0' : null));
    return issues;
}
export function inner$parseAnalyze$issues$$step(s) {
    const issues = ((s.match(/^(\d+) issues? found\./m) || [])[1] ?? (/No issues found!/.test(s) ? '0' : null));
    return issues;
}

export const SIGS = {
  inner$resolveFlutter$F: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$parseAnalyze$s: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseAnalyze$lines: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseAnalyze$lines$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$parseAnalyze$map$m: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$parseAnalyze$issues: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseAnalyze$issues$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
};
