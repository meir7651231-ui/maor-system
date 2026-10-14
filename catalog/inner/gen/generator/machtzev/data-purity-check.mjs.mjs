// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/data-purity-check.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const HEB = /[֐-׿]/;
export function inner$isMixed$code(src) {
    let code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/\/?.*$/gm, '').replace(/(^|[^:'"])\/\/[^\n]*/gm, '$1');
    return code;
}
export function inner$isMixed$pureData(code) {
    const pureData = /^\s*(const\s+[\w<>,\s?]+\s+\w+\s*=\s*(?:[\[{]|['"])|[\w<>,\s?]+\s+get\s+\w+\s*=>\s*(?:const\s+)?(?:[\[{]|['"])|[\w<>,\s?]+\s+\w+\(\)\s*(?:=>\s*|\{\s*return\s+)(?:const\s+)?[\[{]|export\s+(?:const\s+\w+\s*=\s*(?:[\[{]|-?\d|['\"])|function\s+\w+\s*\(\)\s*\{\s*return\s+[\[{]))/m.test(code)
        && !/\b(if|for|while|switch)\b/.test(code);
    return pureData;
}
export function inner$isMixed$heb$$after_loop(code) {
    let heb = false;
    for (const m of code.matchAll(/['"]([^'"\\\n]{0,160})['"]/g))
        if (HEB.test(m[1])) {
            heb = true;
            break;
        }
    return heb;
}

export const SIGS = {
  inner$isMixed$code: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$isMixed$pureData: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$isMixed$heb$$after_loop: [{"name":"code","d":{"t":"any"},"opt":false}],
};
