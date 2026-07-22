/**
 * חיפוש חכם בעברית — פורט נאמן מהאב-טיפוס (app_logic.js).
 * הרחבת שאילתה דרך טבלת תעתיקים (XLAT), ציון מדורג לכל מונח,
 * וסינון עם סובלנות לשגיאות כתיב (levenshtein).
 */
import { normSearch } from './validate';

/**
 * טבלת תעתיקים: מפתח עברי → כינויים באנגלית/רוסית/עברית.
 * הועתקה כלשונה מהאב-טיפוס — לא לשנות ערכים בלי לעדכן שם.
 */
export const XLAT: Record<string, string[]> = {
  'כהן': ['cohen', 'kohen', 'коэн'],
  'לוי': ['levi', 'леви'],
  'מזרחי': ['mizrahi', 'мизрахи'],
  'פרידמן': ['fridman', 'friedman', 'фридман'],
  'אברמוב': ['abramov', 'абрамов'],
  'שרעבי': ['sharabi', 'шараби'],
  'גולדשטיין': ['goldstein', 'гольдштейн'],
  'בן דוד': ['bendavid', 'ben david', 'бен давид'],
  'אוחיון': ['ohayon', 'охайон'],
  'משה': ['moshe', 'моше', 'מוישי', 'מוישה'],
  'שרה': ['sara', 'sarah', 'сара', 'שרהלה'],
  'דוד': ['david', 'давид', 'דודי'],
  'תמר': ['tamar', 'тамар'],
  'יוסף': ['yosef', 'иосиф', 'יוסי'],
  'רחל': ['rachel', 'рахель', 'רחלי'],
  'בנימין': ['binyamin', 'беньямин', 'בני'],
  'נועה': ['noa', 'ноа'],
  'איתן': ['eitan', 'эйтан'],
  'הודיה': ['hodaya'],
  'מיכאל': ['michael', 'михаил', 'מיכי'],
  'ליאה': ['lea', 'лея'],
  'יונתן': ['yonatan', 'йонатан', 'יוני'],
  'אבישי': ['avishai'],
  'טליה': ['talia', 'талия'],
  'עומר': ['omer'],
  'אגם': ['agam'],
  'ליאם': ['liam'],
  'רומי': ['romi'],
  'אליה': ['eliya', 'элия'],
  'צבי': ['zvi', 'цви'],
  'אסתר': ['esther', 'эстер', 'אסתי'],
  'כינור': ['violin', 'скрипка'],
  'גיטרה': ['guitar', 'гитара'],
  'פסנתר': ['piano', 'пианино', 'פסנטר'],
  'אורגנית': ['organ', 'орган', 'אורגן'],
  'מסאז׳': ['massage', 'массаж', 'מסאז', 'עיסוי'],
  'גרפיקה': ['graphics', 'графика'],
  'פיתוח קול': ['vocal', 'שירה'],
  'אומנות': ['art', 'אמנות'],
  'צילום': ['photo', 'photography', 'фото', 'מצלמה'],
  'ספרות': ['writing', 'литература', 'כתיבה', 'ספר'],
  'אפייה': ['baking', 'выпечка', 'בישול', 'קונדיטוריה'],
  'אנגלית': ['english', 'английский', 'שפה'],
  'העצמה': ['empowerment', 'ביטחון עצמי'],
  'התעמלות': ['fitness', 'гимнастика', 'ספורט', 'כושר', 'ג׳ים'],
  'רפלקסולוגיה': ['reflexology', 'рефлексология', 'עיסוי'],
  'ציור': ['art', 'рисование', 'אמנות', 'יצירה'],
  'תפירה': ['sewing', 'шитьё', 'מחט'],
  'אפילציה': ['epilation', 'эпиляция', 'טיפוח'],
  'מוזיקה': ['music', 'музыка', 'נגינה', 'כינור', 'גיטרה', 'אורגנית'],
  'ירושלים': ['jerusalem', 'иерусалим'],
  'בני ברק': ['bnei brak', 'бней брак'],
  'פתח תקווה': ['petah tikva', 'петах тиква'],
  'ראש העין': ['rosh haayin'],
  'מודיעין עילית': ['modiin illit'],
  'ביתר עילית': ['beitar illit'],
};

/** מרחק לוינשטיין מלא — המחרוזות כאן קצרות, אין צורך בקיטום. */
export function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (!la) return lb;
  if (!lb) return la;
  // שורה מתגלגלת אחת במקום מטריצה מלאה
  const dp: number[] = [];
  for (let j = 0; j <= lb; j++) dp[j] = j;
  for (let i = 1; i <= la; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[lb];
}

/**
 * ציון התאמה של שאילתה מול מונח בודד (שניהם מנורמלים עם normSearch):
 * 100 זהה · 80 תחילית · 70 גזע-ריבוי (ים/ות) · 62 תת-מחרוזת ·
 * 58 ללא אימות קריאה (י/ו) · מרחק עריכה מדורג ‎52-4d‎ · 0 אין התאמה.
 *
 * סובלנות שגיאות כתיב מדורגת (פורט נאמן מהאב-טיפוס): מונח באורך ≥6 מרשה
 * מרחק לוינשטיין עד 2 (48 לשגיאה אחת, 44 לשתיים), מונח קצר יותר — עד 1 (48).
 */
export function scoreTerm(q: string, term: string): number {
  const nq = normSearch(q);
  const nt = normSearch(term);
  if (!nq || !nt) return 0;
  if (nt === nq) return 100;
  if (nt.startsWith(nq)) return 80;
  // "חוגים" מוצא "חוג" — הסרת סיומת ריבוי (אחרי נרמול: ם' סופית → מ')
  if (nq.length >= 4 && (nq.endsWith('ימ') || nq.endsWith('ות'))) {
    const stem = nq.slice(0, -2);
    if (nt === stem || nt.startsWith(stem)) return 70;
  }
  if (nq.length >= 2 && nt.includes(nq)) return 62;
  if (nq.length >= 3) {
    // "דויד" ≈ "דוד" — השוואה ללא אימות קריאה
    const sq = nq.replace(/[יו]/g, '');
    const st = nt.replace(/[יו]/g, '');
    if (sq.length >= 2 && sq === st) return 58;
    // מונח ארוך (≥6) סובל שתי שגיאות; קצר יותר — אחת. הציון יורד 4 לכל שגיאה.
    const max = nt.length >= 6 ? 2 : 1;
    const d = levenshtein(nq, nt);
    if (d <= max) return 52 - d * 4;
  }
  return 0;
}

/**
 * הרחבת שאילתה דרך XLAT: אם השאילתה היא מפתח עברי — מוסיפים את הכינויים;
 * אם היא כינוי — מוסיפים את המפתח העברי. תמיד כולל את השאילתה עצמה.
 */
export function expandQuery(q: string): string[] {
  const nq = normSearch(q);
  const out = [q];
  if (!nq) return out;
  for (const [heb, aliases] of Object.entries(XLAT)) {
    if (normSearch(heb) === nq) out.push(...aliases);
    else if (aliases.some((a) => normSearch(a) === nq)) out.push(heb);
  }
  return [...new Set(out)];
}

/**
 * ציון פריט מול שאילתה: לכל מילה בשאילתה — הציון הטוב ביותר על פני
 * (הרחבות × מונחים). כל מילה חייבת להתאים (AND); הציון הכולל הוא סכום המיטב.
 */
export function smartScore(q: string, terms: string[]): number {
  const toks = normSearch(q).split(/\s+/).filter(Boolean);
  if (!toks.length) return 0;
  let total = 0;
  for (const tok of toks) {
    let best = 0;
    for (const exp of expandQuery(tok)) {
      for (const term of terms) {
        best = Math.max(best, scoreTerm(exp, term));
        if (best >= 100) break;
      }
      if (best >= 100) break;
    }
    if (!best) return 0; // מילה בלי שום התאמה — הפריט נפסל
    total += best;
  }
  return total;
}

/**
 * סינון ומיון פריטים לפי smartScore (יורד). שאילתה ריקה מחזירה את הרשימה
 * כמות שהיא (עד limit) — כמו smartRank באב-טיפוס.
 */
export function smartFilter<T>(
  q: string,
  items: T[],
  getTerms: (t: T) => string[],
  limit?: number,
): T[] {
  if (!normSearch(q)) return limit !== undefined ? items.slice(0, limit) : items.slice();
  const scored: { it: T; sc: number }[] = [];
  for (const it of items) {
    const sc = smartScore(q, getTerms(it));
    if (sc > 0) scored.push({ it, sc });
  }
  scored.sort((a, b) => b.sc - a.sc); // sort יציב — שוויון שומר סדר מקורי
  const out = scored.map((x) => x.it);
  return limit !== undefined ? out.slice(0, limit) : out;
}
