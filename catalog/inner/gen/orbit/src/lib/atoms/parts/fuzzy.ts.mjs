// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/fuzzy.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function normHe(s) {
    return String(s ?? '')
        .replace(/־/g, ' ')
        .replace(/[֑-ׇ]/g, '')
        .replace(/[״׳"'`]/g, '')
        .replace(/[.,!?;:()\-/\\+*_=&]/g, ' ')
        .replace(/ך/g, 'כ')
        .replace(/ם/g, 'מ')
        .replace(/ן/g, 'נ')
        .replace(/ף/g, 'פ')
        .replace(/ץ/g, 'צ')
        .replace(/וו/g, 'ו')
        .replace(/יי/g, 'י')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
const PREFIX_RE = /^(וכש|וש|וה|וב|ול|ומ|שה|שב|של|מה|בה|לה|כש|ו|ה|ב|ל|מ|ש|כ)(?=.{3,})/;
export function inner$wordScore$st(tok) {
    const st = tok.replace(PREFIX_RE, '');
    return st;
}
export function inner$wordScore$typos(maxTypos) {
    const typos = maxTypos === 1 ? 1 : 0;
    return typos;
}
export function inner$fuzzyFind$toks(query) {
    const toks = normHe(query).split(' ').filter(Boolean);
    return toks;
}
export function inner$fuzzyFind$forEach$words(c) {
    const words = normHe(c.text).split(' ').filter(Boolean);
    return words;
}

export const SIGS = {
  inner$wordScore$st: [{"name":"tok","d":{"t":"str"},"opt":false}],
  inner$wordScore$typos: [{"name":"maxTypos","d":{"t":"num"},"opt":false}],
  inner$fuzzyFind$toks: [{"name":"query","d":{"t":"str"},"opt":false}],
  inner$fuzzyFind$forEach$words: [{"name":"c","d":{"t":"any"},"opt":false}],
};
