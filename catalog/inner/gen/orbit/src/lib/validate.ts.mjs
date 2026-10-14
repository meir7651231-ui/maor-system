// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/validate.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function normSearch(t) {
    return String(t || '')
        .toLowerCase()
        .replace(/[֑-ׇ]/g, '')
        .replace(/[ךםןףץ]/g, (ch) => ({ ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' })[ch])
        .replace(/['"׳״\-–._]/g, '')
        .trim();
}
const NAME_TITLES = new Set([
    'ר', 'רבי', 'הרב', 'הרבנית', 'הרהג', 'הרהח', 'הגר', 'מוהרר', 'אדמור', 'מרת', 'מר', 'גב', 'הגב',
    'דר', 'פרופ', 'הבחור', 'הבהח', 'הת', 'משפ', 'משפחת',
    // סיומות-כבוד:
    'שליטא', 'זצל', 'זצוקל', 'זקל', 'זל', 'עה', 'היד', 'נרו', 'ניו', 'ני', 'היו',
]);
export function inner$validIsraeliId$s(id) {
    const s = String(id).trim();
    return s;
}
export function inner$validIsraeliId$p(id) {
    const s = String(id).trim();
    const p = s.padStart(9, '0');
    return p;
}
export function inner$validIsraeliId$p$$step(s) {
    const p = s.padStart(9, '0');
    return p;
}
export function inner$validIsraeliId$d(id, i) {
    const s = String(id).trim();
    const p = s.padStart(9, '0');
    let d = +p[i] * (i % 2 === 0 ? 1 : 2);
    return d;
}
export function inner$validIsraeliId$d$$step(p, i) {
    let d = +p[i] * (i % 2 === 0 ? 1 : 2);
    return d;
}
export function inner$normalizePhone$s(raw) {
    let s = String(raw || '').replace(/[\s\-().]/g, '');
    return s;
}
export function inner$formatIsraeliPhone$s(raw) {
    const s = String(raw || '').trim();
    return s;
}
export function inner$formatIsraeliPhone$d(raw) {
    const s = String(raw || '').trim();
    let d = s.replace(/\D/g, '');
    return d;
}
export function inner$formatIsraeliPhone$d$$step(s) {
    let d = s.replace(/\D/g, '');
    return d;
}
export function inner$nameSortKey$tokens(t) {
    const tokens = normSearch(t)
        .split(/\s+/)
        .filter((w) => w && !NAME_TITLES.has(w));
    return tokens;
}
export function inner$validIsraeliId$sum$$after_loop(id) {
    const s = String(id).trim();
    const p = s.padStart(9, '0');
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let d = +p[i] * (i % 2 === 0 ? 1 : 2);
        if (d > 9)
            d -= 9;
        sum += d;
    }
    return sum;
}

export const SIGS = {
  inner$validIsraeliId$s: [{"name":"id","d":{"t":"str"},"opt":false}],
  inner$validIsraeliId$p: [{"name":"id","d":{"t":"str"},"opt":false}],
  inner$validIsraeliId$p$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$validIsraeliId$d: [{"name":"id","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$validIsraeliId$d$$step: [{"name":"p","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$normalizePhone$s: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$formatIsraeliPhone$s: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$formatIsraeliPhone$d: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$formatIsraeliPhone$d$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
  inner$nameSortKey$tokens: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$validIsraeliId$sum$$after_loop: [{"name":"id","d":{"t":"str"},"opt":false}],
};
