// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/emit/fuzz-parity.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const lit = (v) => v === null ? 'null' : typeof v === 'string' ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\t/g, '\\t')}'`
    : Number.isNaN(v) ? 'double.nan' : v === Infinity ? 'double.infinity' : v === -Infinity ? 'double.negativeInfinity' : String(v);
export function inner$fuzz$fn(mod) {
    const fn = mod[Object.keys(mod).find(k => typeof mod[k] === 'function')];
    return fn;
}
export function inner$fuzz$codeLines(dartAtom) {
    const codeLines = dartAtom.split('\n').filter(l => !/^\s*\/\//.test(l) && !/^\s*import /.test(l)).join('\n');
    return codeLines;
}
export function inner$fuzz$fname(dartAtom) {
    const codeLines = dartAtom.split('\n').filter(l => !/^\s*\/\//.test(l) && !/^\s*import /.test(l)).join('\n');
    const fname = (codeLines.match(/(?:dynamic|String|int|double|num|bool|List|Map|Object\??)\s+(\w+)\s*(?:<[^>]*>)?\s*\(/) || [])[1];
    return fname;
}
export function inner$fuzz$fname$$step(codeLines) {
    const fname = (codeLines.match(/(?:dynamic|String|int|double|num|bool|List|Map|Object\??)\s+(\w+)\s*(?:<[^>]*>)?\s*\(/) || [])[1];
    return fname;
}
export function inner$fuzz$checks(rows, dartAtom) {
    const codeLines = dartAtom.split('\n').filter(l => !/^\s*\/\//.test(l) && !/^\s*import /.test(l)).join('\n');
    const fname = (codeLines.match(/(?:dynamic|String|int|double|num|bool|List|Map|Object\??)\s+(\w+)\s*(?:<[^>]*>)?\s*\(/) || [])[1];
    const checks = rows.map((r, i) => {
        const exp = r.out === '__THROW__' ? null : r.out;
        return `  { dynamic got; try { got = ${fname}(${lit(r.inp)}); } catch(e){ got='__THROW__'; }
      final want = ${r.out === '__THROW__' ? "'__THROW__'" : lit(exp)};
      if (got?.toString() != want?.toString()) { print('MISMATCH[${i}] in=${lit(r.inp).replace(/'/g, '')} got=\$got want=\$want'); bad++; } }`;
    }).join('\n');
    return checks;
}
export function inner$fuzz$checks$$step(rows, fname) {
    const checks = rows.map((r, i) => {
        const exp = r.out === '__THROW__' ? null : r.out;
        return `  { dynamic got; try { got = ${fname}(${lit(r.inp)}); } catch(e){ got='__THROW__'; }
      final want = ${r.out === '__THROW__' ? "'__THROW__'" : lit(exp)};
      if (got?.toString() != want?.toString()) { print('MISMATCH[${i}] in=${lit(r.inp).replace(/'/g, '')} got=\$got want=\$want'); bad++; } }`;
    }).join('\n');
    return checks;
}
export function inner$fuzz$map$exp(r) {
    const exp = r.out === '__THROW__' ? null : r.out;
    return exp;
}
export function inner$fuzz$imps(dartAtom) {
    const imps = [...new Set((dartAtom.match(/^\s*import [^\n]+/gm) || []).map(x => x.trim()))];
    return imps;
}
export function inner$fuzz$hasMath(dartAtom) {
    const imps = [...new Set((dartAtom.match(/^\s*import [^\n]+/gm) || []).map(x => x.trim()))];
    const hasMath = imps.some(i => /dart:math/.test(i));
    return hasMath;
}
export function inner$fuzz$hasMath$$step(imps) {
    const hasMath = imps.some(i => /dart:math/.test(i));
    return hasMath;
}
export function inner$fuzz$src(rows, dartAtom, helpers) {
    const codeLines = dartAtom.split('\n').filter(l => !/^\s*\/\//.test(l) && !/^\s*import /.test(l)).join('\n');
    const fname = (codeLines.match(/(?:dynamic|String|int|double|num|bool|List|Map|Object\??)\s+(\w+)\s*(?:<[^>]*>)?\s*\(/) || [])[1];
    const checks = rows.map((r, i) => {
        const exp = r.out === '__THROW__' ? null : r.out;
        return `  { dynamic got; try { got = ${fname}(${lit(r.inp)}); } catch(e){ got='__THROW__'; }
      final want = ${r.out === '__THROW__' ? "'__THROW__'" : lit(exp)};
      if (got?.toString() != want?.toString()) { print('MISMATCH[${i}] in=${lit(r.inp).replace(/'/g, '')} got=\$got want=\$want'); bad++; } }`;
    }).join('\n');
    const imps = [...new Set((dartAtom.match(/^\s*import [^\n]+/gm) || []).map(x => x.trim()))];
    const hasMath = imps.some(i => /dart:math/.test(i));
    const src = imps.join('\n') + '\n' + helpers.replace(/\\n/g, '\n').replace(hasMath ? /import 'dart:math';\n?/ : /$^/, '') + codeLines + `\nvoid main(){ int bad=0;\n${checks}\n if(bad>0){ throw 'FUZZ FAIL: \$bad'; } print('fuzz ok ${rows.length}'); }`;
    return src;
}
export function inner$fuzz$src$$step(rows, codeLines, checks, helpers, imps, hasMath) {
    const src = imps.join('\n') + '\n' + helpers.replace(/\\n/g, '\n').replace(hasMath ? /import 'dart:math';\n?/ : /$^/, '') + codeLines + `\nvoid main(){ int bad=0;\n${checks}\n if(bad>0){ throw 'FUZZ FAIL: \$bad'; } print('fuzz ok ${rows.length}'); }`;
    return src;
}

export const SIGS = {
  inner$fuzz$fn: [{"name":"mod","d":{"t":"any"},"opt":false}],
  inner$fuzz$codeLines: [{"name":"dartAtom","d":{"t":"any"},"opt":false}],
  inner$fuzz$fname: [{"name":"dartAtom","d":{"t":"any"},"opt":false}],
  inner$fuzz$fname$$step: [{"name":"codeLines","d":{"t":"any"},"opt":false}],
  inner$fuzz$checks: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"dartAtom","d":{"t":"any"},"opt":false}],
  inner$fuzz$checks$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"fname","d":{"t":"any"},"opt":false}],
  inner$fuzz$map$exp: [{"name":"r","d":{"t":"obj","p":[["inp",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false],["out",{"t":"any"},false]]},"opt":false}],
  inner$fuzz$imps: [{"name":"dartAtom","d":{"t":"any"},"opt":false}],
  inner$fuzz$hasMath: [{"name":"dartAtom","d":{"t":"any"},"opt":false}],
  inner$fuzz$hasMath$$step: [{"name":"imps","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$fuzz$src: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"dartAtom","d":{"t":"any"},"opt":false},{"name":"helpers","d":{"t":"any"},"opt":false}],
  inner$fuzz$src$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"codeLines","d":{"t":"any"},"opt":false},{"name":"checks","d":{"t":"str"},"opt":false},{"name":"helpers","d":{"t":"any"},"opt":false},{"name":"imps","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"hasMath","d":{"t":"bool"},"opt":false}],
};
