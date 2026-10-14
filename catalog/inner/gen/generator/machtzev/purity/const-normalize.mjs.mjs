// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/purity/const-normalize.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$normalize$codeNoC(src) {
    const codeNoC = src.replace(/^\s*\/\/.*$/gm, '');
    return codeNoC;
}
export function inner$normalize$ignore(name) {
    const ignore = /[A-Z_]/.test(name) ? '// ignore_for_file: non_constant_identifier_names\n' : '';
    return ignore;
}
export function inner$normalize$header(name) {
    const ignore = /[A-Z_]/.test(name) ? '// ignore_for_file: non_constant_identifier_names\n' : '';
    const header = `// ⚛️ אטום-Dart · ${name} — נורמל מ-const-דאטה לפונקציה (מנוע-טהור; העברית תחולץ למטרה).\n${ignore}`;
    return header;
}
export function inner$normalize$header$$step(name, ignore) {
    const header = `// ⚛️ אטום-Dart · ${name} — נורמל מ-const-דאטה לפונקציה (מנוע-טהור; העברית תחולץ למטרה).\n${ignore}`;
    return header;
}
export function inner$normalize$newSrc(src, m, name, type, literal) {
    const ignore = /[A-Z_]/.test(name) ? '// ignore_for_file: non_constant_identifier_names\n' : '';
    const header = `// ⚛️ אטום-Dart · ${name} — נורמל מ-const-דאטה לפונקציה (מנוע-טהור; העברית תחולץ למטרה).\n${ignore}`;
    const newSrc = header + src.replace(m[0], `${type} ${name}() => ${literal};`);
    return newSrc;
}
export function inner$normalize$newSrc$$step(src, m, name, type, literal, header) {
    const newSrc = header + src.replace(m[0], `${type} ${name}() => ${literal};`);
    return newSrc;
}
export function inner$normalize$out(name, c) {
    const out = c.csrc.replace(new RegExp(`\\b${name}\\b(?!\\s*\\()`, 'g'), `${name}()`);
    return out;
}

export const SIGS = {
  inner$normalize$codeNoC: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$normalize$ignore: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$normalize$header: [{"name":"name","d":{"t":"any"},"opt":false}],
  inner$normalize$header$$step: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"ignore","d":{"t":"lit","v":["","// ignore_for_file: non_constant_identifier_names\n"]},"opt":false}],
  inner$normalize$newSrc: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"type","d":{"t":"any"},"opt":false},{"name":"literal","d":{"t":"any"},"opt":false}],
  inner$normalize$newSrc$$step: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false},{"name":"name","d":{"t":"any"},"opt":false},{"name":"type","d":{"t":"any"},"opt":false},{"name":"literal","d":{"t":"any"},"opt":false},{"name":"header","d":{"t":"str"},"opt":false}],
  inner$normalize$out: [{"name":"name","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"obj","p":[["cp",{"t":"any"},false],["csrc",{"t":"any"},false]]},"opt":false}],
};
