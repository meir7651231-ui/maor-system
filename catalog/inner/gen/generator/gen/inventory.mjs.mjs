// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/inventory.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$inventory$fns(shelf) {
    const fns = shelf.filter((a) => a.kind === 'fn').length;
    return fns;
}
export function inner$inventory$consts(shelf) {
    const consts = shelf.filter((a) => a.kind === 'const').length;
    return consts;
}
export function inner$inventory$tFromData(shelf) {
    const tFromData = shelf.filter((a) => a.tSource && /-(strings|data)$/.test(a.tSource)).length;
    return tFromData;
}
export function inner$inventory$display(all) {
    const display = all.filter((x) => x.layer === 'display').length;
    return display;
}
export function inner$inventory$dartTwins(all) {
    const dartTwins = all.filter((x) => x.layer === 'logic' && x.file.startsWith('dart-maor/')).length;
    return dartTwins;
}

export const SIGS = {
  inner$inventory$fns: [{"name":"shelf","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["kind",{"t":"str"},false],["fn",{"t":"str"},false],["params",{"t":"arr","of":{"t":"str"}},false],["n",{"t":"num"},false],["hasT",{"t":"bool"},false],["T",{"t":"any"},false],["tSource",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["role",{"t":"str"},false],["file",{"t":"any"},false],["test",{"t":"any"},false],["src",{"t":"any"},false]]}},"opt":false}],
  inner$inventory$consts: [{"name":"shelf","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["kind",{"t":"str"},false],["fn",{"t":"str"},false],["params",{"t":"arr","of":{"t":"str"}},false],["n",{"t":"num"},false],["hasT",{"t":"bool"},false],["T",{"t":"any"},false],["tSource",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["role",{"t":"str"},false],["file",{"t":"any"},false],["test",{"t":"any"},false],["src",{"t":"any"},false]]}},"opt":false}],
  inner$inventory$tFromData: [{"name":"shelf","d":{"t":"arr","of":{"t":"obj","p":[["name",{"t":"any"},false],["kind",{"t":"str"},false],["fn",{"t":"str"},false],["params",{"t":"arr","of":{"t":"str"}},false],["n",{"t":"num"},false],["hasT",{"t":"bool"},false],["T",{"t":"any"},false],["tSource",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["role",{"t":"str"},false],["file",{"t":"any"},false],["test",{"t":"any"},false],["src",{"t":"any"},false]]}},"opt":false}],
  inner$inventory$display: [{"name":"all","d":{"t":"any"},"opt":false}],
  inner$inventory$dartTwins: [{"name":"all","d":{"t":"any"},"opt":false}],
};
