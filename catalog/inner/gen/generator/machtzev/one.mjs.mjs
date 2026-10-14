// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/one.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$stage$b(f) {
    const b = f.replace('.dart', '');
    return b;
}
export function inner$stage$terms(count) {
    const terms = Object.entries(count).sort((a, b) => b[1] - a[1]);
    return terms;
}
export function inner$stage$reg(rep, base) {
    const reg = rep.filter(x => base[x.k] >= 0 && x.diffPct - base[x.k] > 1.5 && x.diffPct > 2);
    return reg;
}

export const SIGS = {
  inner$stage$b: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$stage$terms: [{"name":"count","d":{"t":"obj","n":"count","p":[]},"opt":false}],
  inner$stage$reg: [{"name":"rep","d":{"t":"any"},"opt":false},{"name":"base","d":{"t":"obj","n":"base","p":[]},"opt":false}],
};
