// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/gen-verify.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$needsArgs$m(src, cls) {
    const m = src.match(new RegExp('const ' + cls + '\\(\\{([^}]*)\\}'));
    return m;
}
export function inner$screensIn$map$cls(src) {
    const cls = src.match(/^class (\w+Screen) extends StatefulWidget/m)[1];
    return cls;
}
export function inner$parseVerify$rows(out) {
    const rows = [...out.matchAll(/GENVERIFY (\{.*\})/g)].map((m) => JSON.parse(m[1]));
    return rows;
}
export function inner$parseVerify$last(out) {
    const last = [...out.matchAll(/\+(\d+)(?:\s+-(\d+))?:/g)].pop();
    return last;
}
export function inner$parseVerify$passed(out) {
    const last = [...out.matchAll(/\+(\d+)(?:\s+-(\d+))?:/g)].pop();
    const passed = last ? +last[1] : 0;
    return passed;
}
export function inner$parseVerify$passed$$step(last) {
    const passed = last ? +last[1] : 0;
    return passed;
}
export function inner$parseVerify$failed(out) {
    const last = [...out.matchAll(/\+(\d+)(?:\s+-(\d+))?:/g)].pop();
    const failed = last && last[2] ? +last[2] : 0;
    return failed;
}
export function inner$parseVerify$failed$$step(last) {
    const failed = last && last[2] ? +last[2] : 0;
    return failed;
}
export function inner$parseVerify$compileErr(out) {
    const compileErr = [...out.matchAll(/^((?:lib|test)\/[^\n]*Error: [^\n]*)$/gm)].map((m) => m[1].slice(0, 160));
    return compileErr;
}
export function inner$fn$i(process) {
    const i = process.argv.indexOf('--only');
    return i;
}
export function inner$map$r(rows, s) {
    const r = rows.find((x) => x.file === s.file);
    return r;
}
export function inner$map$atoms(DISPLAY, rows, s) {
    const r = rows.find((x) => x.file === s.file);
    const atoms = r ? Object.keys(r.types).filter((t) => DISPLAY.has(t)) : [];
    return atoms;
}
export function inner$map$atoms$$step(DISPLAY, r) {
    const atoms = r ? Object.keys(r.types).filter((t) => DISPLAY.has(t)) : [];
    return atoms;
}

export const SIGS = {
  inner$needsArgs$m: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"cls","d":{"t":"any"},"opt":false}],
  inner$screensIn$map$cls: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$parseVerify$rows: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseVerify$last: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseVerify$passed: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseVerify$passed$$step: [{"name":"last","d":{"t":"any"},"opt":false}],
  inner$parseVerify$failed: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$parseVerify$failed$$step: [{"name":"last","d":{"t":"any"},"opt":false}],
  inner$parseVerify$compileErr: [{"name":"out","d":{"t":"any"},"opt":false}],
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$map$r: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$atoms: [{"name":"DISPLAY","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$map$atoms$$step: [{"name":"DISPLAY","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
};
