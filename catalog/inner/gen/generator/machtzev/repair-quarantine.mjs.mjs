// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/repair-quarantine.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const castFromMsg = (msg) => {
    const m = msg.match(/parameter type '([^']+)'|return type of '[^']+'|type '([^']+)'\.?$/);
    const m2 = msg.match(/assigned to (?:the )?(?:parameter |list |map |a variable of )?type '([^']+)'/);
    return (m2 && m2[1]) || (m && (m[1] || m[2])) || null;
};
export function inner$fn$i(process) {
    const i = process.argv.indexOf('--only');
    return i;
}
export function inner$analyze$out(e) {
    const out = String(e.stdout || '');
    return out;
}
export function inner$analyze$map$p(l) {
    const p = l.split('|');
    return p;
}
export function inner$castFromMsg$m(msg) {
    const m = msg.match(/parameter type '([^']+)'|return type of '[^']+'|type '([^']+)'\.?$/);
    return m;
}
export function inner$castFromMsg$m2(msg) {
    const m2 = msg.match(/assigned to (?:the )?(?:parameter |list |map |a variable of )?type '([^']+)'/);
    return m2;
}
export function inner$repairFile$rel(base) {
    const rel = 'lib/dart-maor/QUARANTINE/' + base + '.dart';
    return rel;
}
export function inner$repairFile$lines(src) {
    const lines = src.split('\n');
    return lines;
}
export function inner$repairFile$usedTruthy(src) {
    let usedTruthy = src.includes('_rqTruthy');
    return usedTruthy;
}
export function inner$repairFile$seg(src, e) {
    const seg = src.slice(e.at, e.at + e.len);
    return seg;
}
export function inner$repairFile$t(e) {
    const t = castFromMsg(e.msg);
    return t;
}
export function inner$repairFile$firstDecl(src) {
    const firstDecl = src.search(/\n(?:[A-Za-z_][\w<>,?\[\] ]*\s+)?[a-z_]\w*\s*\(/);
    return firstDecl;
}

export const SIGS = {
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
  inner$analyze$out: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$analyze$map$p: [{"name":"l","d":{"t":"str"},"opt":false}],
  inner$castFromMsg$m: [{"name":"msg","d":{"t":"any"},"opt":false}],
  inner$castFromMsg$m2: [{"name":"msg","d":{"t":"any"},"opt":false}],
  inner$repairFile$rel: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$repairFile$lines: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$repairFile$usedTruthy: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$repairFile$seg: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"obj","p":[["at",{"t":"num"},false],["code",{"t":"str"},false],["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["len",{"t":"num"},false],["msg",{"t":"str"},false]]},"opt":false}],
  inner$repairFile$t: [{"name":"e","d":{"t":"obj","p":[["at",{"t":"num"},false],["code",{"t":"str"},false],["file",{"t":"str"},false],["line",{"t":"num"},false],["col",{"t":"num"},false],["len",{"t":"num"},false],["msg",{"t":"str"},false]]},"opt":false}],
  inner$repairFile$firstDecl: [{"name":"src","d":{"t":"any"},"opt":false}],
};
