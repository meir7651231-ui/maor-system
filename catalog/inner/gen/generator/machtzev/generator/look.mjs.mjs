// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/look.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HARD_COLOR = /Color\(0x(?!00000000)[0-9A-Fa-f]{8}\)|Colors\.(?!transparent\b)[a-z]|Color\.from(?:ARGB|RGBO)\(|BsTokens\.(?:brand|brandDark|danger|dangerDark|success)\b|DsAtomColors\./;
export function inner$skinWired$f(file) {
    const f = file.startsWith('dart-') ? file : 'dart-ui-bs/' + file;
    return f;
}
export function inner$skinWired$ok(src) {
    const ok = !HARD_COLOR.test(src.replace(/dsWear\(context, (?:DsAtomColors|BsTokens)\.\w+/g, 'dsWear('));
    return ok;
}

export const SIGS = {
  inner$skinWired$f: [{"name":"file","d":{"t":"any"},"opt":false}],
  inner$skinWired$ok: [{"name":"src","d":{"t":"any"},"opt":false}],
};
