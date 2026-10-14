// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/verify-dart-tests.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fn$i(process) {
    const i = process.argv.findIndex(a => /^-j/.test(a));
    return i;
}

export const SIGS = {
  inner$fn$i: [{"name":"process","d":{"t":"obj","n":"process","p":[["env",{"t":"obj","n":"env","p":[["YESHIVA_LEDGER",{"t":"any"},false],["YESHIVA_LEDGER_CAP",{"t":"str"},false],["GEN_OUT",{"t":"any"},false],["GEN_DATA_OUT",{"t":"any"},false]]},false],["exitCode",{"t":"num"},false]]},"opt":false}],
};
