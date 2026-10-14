// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/hebrewNumber.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ONES = ['', 'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'];
const TEENS = ['עשרה', 'אחד עשר', 'שנים עשר', 'שלושה עשר', 'ארבעה עשר', 'חמישה עשר', 'שישה עשר', 'שבעה עשר', 'שמונה עשר', 'תשעה עשר'];
const TENS = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];
const HUNDREDS = ['', 'מאה', 'מאתיים', 'שלוש מאות', 'ארבע מאות', 'חמש מאות', 'שש מאות', 'שבע מאות', 'שמונה מאות', 'תשע מאות'];
const THOUSAND_CONSTRUCT = {
    3: 'שלושת', 4: 'ארבעת', 5: 'חמשת', 6: 'ששת', 7: 'שבעת', 8: 'שמונת', 9: 'תשעת', 10: 'עשרת',
};
function words0_999(n) {
    const out = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h)
        out.push(HUNDREDS[h]);
    if (rem) {
        if (rem < 10)
            out.push(ONES[rem]);
        else if (rem < 20)
            out.push(TEENS[rem - 10]);
        else {
            const t = Math.floor(rem / 10);
            const u = rem % 10;
            out.push(TENS[t]);
            if (u)
                out.push(ONES[u]);
        }
    }
    return out;
}
function thousandWords(th) {
    if (th === 1)
        return ['אלף'];
    if (th === 2)
        return ['אלפיים'];
    if (THOUSAND_CONSTRUCT[th])
        return [THOUSAND_CONSTRUCT[th] + ' אלפים'];
    // 11..999 אלף — "אחד עשר אלף" וכו׳ (יחיד "אלף"). איבר אחד: החזרת מערך שטוח
    // גרמה ל-joinHeb להצמיד ו׳ ל"אלף" עצמו ("שמונה עשר ואלף") — על קבלת מס.
    return [joinHeb(words0_999(th)) + ' אלף'];
}
function joinHeb(words) {
    const w = words.filter(Boolean);
    if (w.length === 0)
        return '';
    if (w.length === 1)
        return w[0];
    return w.slice(0, -1).join(' ') + ' ו' + w[w.length - 1];
}
function integerInWords(n) {
    if (!Number.isFinite(n) || n < 0 || n > 999_999_999 || Math.floor(n) !== n)
        return null;
    if (n === 0)
        return 'אפס';
    const millions = Math.floor(n / 1_000_000);
    const thousands = Math.floor((n % 1_000_000) / 1000);
    const rest = n % 1000;
    const groups = [];
    if (millions) {
        if (millions === 1)
            groups.push('מיליון');
        else if (millions === 2)
            groups.push('שני מיליון');
        // איבר אחד — אותו באג-דפוס כמו באלפים ("שמונה עשר ומיליון")
        else
            groups.push(joinHeb(words0_999(millions)) + ' מיליון');
    }
    if (thousands)
        groups.push(...thousandWords(thousands));
    if (rest)
        groups.push(...words0_999(rest));
    return joinHeb(groups);
}
export function inner$words0_999$h(n) {
    const h = Math.floor(n / 100);
    return h;
}
export function inner$words0_999$rem(n) {
    const rem = n % 100;
    return rem;
}
export function inner$words0_999$t(n) {
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    return t;
}
export function inner$words0_999$t$$step(rem) {
    const t = Math.floor(rem / 10);
    return t;
}
export function inner$words0_999$u(n) {
    const rem = n % 100;
    const u = rem % 10;
    return u;
}
export function inner$words0_999$u$$step(rem) {
    const u = rem % 10;
    return u;
}
export function inner$agorotWords$t(n) {
    const t = Math.floor(n / 10);
    return t;
}
export function inner$agorotWords$u(n) {
    const u = n % 10;
    return u;
}
export function inner$joinHeb$w(words) {
    const w = words.filter(Boolean);
    return w;
}
export function inner$integerInWords$millions(n) {
    const millions = Math.floor(n / 1_000_000);
    return millions;
}
export function inner$integerInWords$thousands(n) {
    const thousands = Math.floor((n % 1_000_000) / 1000);
    return thousands;
}
export function inner$integerInWords$rest(n) {
    const rest = n % 1000;
    return rest;
}
export function inner$amountInWords$shekelWord(currency) {
    const shekelWord = currency === '$' ? { one: 'דולר אחד', many: 'דולרים', agName: 'סנט' } : { one: 'שקל אחד', many: 'שקלים', agName: 'אגורות' };
    return shekelWord;
}
export function inner$amountInWords$whole(amount) {
    let whole = Math.floor(amount);
    return whole;
}
export function inner$amountInWords$agorot(amount, whole) {
    let agorot = Math.round((amount - whole) * 100);
    return agorot;
}
export function inner$amountInWords$wholeWords(whole) {
    const wholeWords = integerInWords(whole);
    return wholeWords;
}
export function inner$amountInWords$agWords(agorot) {
    const agWords = integerInWords(agorot);
    return agWords;
}

export const SIGS = {
  inner$words0_999$h: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$words0_999$rem: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$words0_999$t: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$words0_999$t$$step: [{"name":"rem","d":{"t":"num"},"opt":false}],
  inner$words0_999$u: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$words0_999$u$$step: [{"name":"rem","d":{"t":"num"},"opt":false}],
  inner$agorotWords$t: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$agorotWords$u: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$joinHeb$w: [{"name":"words","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$integerInWords$millions: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$integerInWords$thousands: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$integerInWords$rest: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$amountInWords$shekelWord: [{"name":"currency","d":{"t":"lit","v":["₪","$"]},"opt":false}],
  inner$amountInWords$whole: [{"name":"amount","d":{"t":"num"},"opt":false}],
  inner$amountInWords$agorot: [{"name":"amount","d":{"t":"num"},"opt":false},{"name":"whole","d":{"t":"num"},"opt":false}],
  inner$amountInWords$wholeWords: [{"name":"whole","d":{"t":"num"},"opt":false}],
  inner$amountInWords$agWords: [{"name":"agorot","d":{"t":"num"},"opt":false}],
};
