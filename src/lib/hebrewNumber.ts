/**
 * סכום בשקלים במילים (עברית) — לקבלת סעיף 46. תומך במספרים שלמים 0..999,999,999
 * ובאגורות. הצורות במין זכר ("שלושה שקלים"), מאות בצורת-נקבה ("שלוש מאות"),
 * ואלפים בצורת-סמיכות ("שלושת אלפים"). ה-ו׳ החיברת מוצמדת למילה האחרונה
 * ("מאה עשרים ושלושה"). מעל הטווח הנתמך — נפילה חיננית לספרות.
 *
 * פונקציה טהורה — נבדקת ביחידה.
 */

const ONES = ['', 'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'];
// אינדקס = המספר עצמו (10..19)
const TEENS = ['עשרה', 'אחד עשר', 'שנים עשר', 'שלושה עשר', 'ארבעה עשר', 'חמישה עשר', 'שישה עשר', 'שבעה עשר', 'שמונה עשר', 'תשעה עשר'];
// אינדקס = עשרות (2=20 ...)
const TENS = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];
const HUNDREDS = ['', 'מאה', 'מאתיים', 'שלוש מאות', 'ארבע מאות', 'חמש מאות', 'שש מאות', 'שבע מאות', 'שמונה מאות', 'תשע מאות'];
// צורת-סמיכות לאלפים 3..10
const THOUSAND_CONSTRUCT: Record<number, string> = {
  3: 'שלושת', 4: 'ארבעת', 5: 'חמשת', 6: 'ששת', 7: 'שבעת', 8: 'שמונת', 9: 'תשעת', 10: 'עשרת',
};

/** מילות המספר 1..999 כמערך (בלי ו׳ חיברת — מתווספת בסוף). */
function words0_999(n: number): string[] {
  const out: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h) out.push(HUNDREDS[h]);
  if (rem) {
    if (rem < 10) out.push(ONES[rem]);
    else if (rem < 20) out.push(TEENS[rem - 10]);
    else {
      const t = Math.floor(rem / 10);
      const u = rem % 10;
      out.push(TENS[t]);
      if (u) out.push(ONES[u]);
    }
  }
  return out;
}

/** מילות האלפים (מספר האלפים 1..999) — סמיכות ל-3..10, אחרת מספר + "אלף/אלפים". */
function thousandWords(th: number): string[] {
  if (th === 1) return ['אלף'];
  if (th === 2) return ['אלפיים'];
  if (THOUSAND_CONSTRUCT[th]) return [THOUSAND_CONSTRUCT[th] + ' אלפים'];
  // 11..999 אלף — "אחד עשר אלף" וכו׳ (יחיד "אלף"). איבר אחד: החזרת מערך שטוח
  // גרמה ל-joinHeb להצמיד ו׳ ל"אלף" עצמו ("שמונה עשר ואלף") — על קבלת מס.
  return [joinHeb(words0_999(th)) + ' אלף'];
}

/** מחבר רשימת מילים עם ו׳ חיברת לפני האחרונה (אם יש ≥2). */
function joinHeb(words: string[]): string {
  const w = words.filter(Boolean);
  if (w.length === 0) return '';
  if (w.length === 1) return w[0];
  return w.slice(0, -1).join(' ') + ' ו' + w[w.length - 1];
}

/** המספר השלם במילים (0..999,999,999). null אם מחוץ לטווח. */
export function integerInWords(n: number): string | null {
  if (!Number.isFinite(n) || n < 0 || n > 999_999_999 || Math.floor(n) !== n) return null;
  if (n === 0) return 'אפס';
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const groups: string[] = [];
  if (millions) {
    if (millions === 1) groups.push('מיליון');
    else if (millions === 2) groups.push('שני מיליון');
    // איבר אחד — אותו באג-דפוס כמו באלפים ("שמונה עשר ומיליון")
    else groups.push(joinHeb(words0_999(millions)) + ' מיליון');
  }
  if (thousands) groups.push(...thousandWords(thousands));
  if (rest) groups.push(...words0_999(rest));
  return joinHeb(groups);
}

/**
 * סכום כספי במילים: "<שקלים> שקלים ו-<אגורות> אגורות". שקל בודד → "שקל אחד".
 * מחוץ לטווח → fallback לספרות ("₪12,345.60"). currency ברירת מחדל שקלים.
 */
export function amountInWords(amount: number, currency: '₪' | '$' = '₪'): string {
  if (!Number.isFinite(amount) || amount < 0) return String(amount);
  const shekelWord = currency === '$' ? { one: 'דולר אחד', many: 'דולרים', agName: 'סנט' } : { one: 'שקל אחד', many: 'שקלים', agName: 'אגורות' };
  const whole = Math.floor(amount);
  const agorot = Math.round((amount - whole) * 100);
  const wholeWords = integerInWords(whole);
  if (wholeWords === null) {
    // fallback בטוח לספרות
    return currency + amount.toLocaleString('he-IL');
  }
  let s: string;
  if (whole === 1) s = shekelWord.one;
  else if (whole === 0) s = 'אפס ' + shekelWord.many;
  else s = wholeWords + ' ' + shekelWord.many;
  if (agorot > 0) {
    const agWords = integerInWords(agorot);
    s += ' ו-' + (agWords ?? agorot) + ' ' + shekelWord.agName;
  }
  return s;
}
