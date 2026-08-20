/**
 * לוח עברי — גימטריה, המרות תאריכים וחגים.
 * מבוסס על Intl.DateTimeFormat עם לוח 'hebrew' (ללא תלות חיצונית).
 */

const fmtHM = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const fmtHY = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });
const fmtParts = new Intl.DateTimeFormat('en-u-ca-hebrew', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** גימטריה: 15→ט״ו, 5786→תשפ״ו. קלט לא-חוקי (שלילי / לא-שלם / NaN) → ''. */
export function gem(n: number): string {
  n = Math.floor(+n);
  if (!Number.isFinite(n) || n <= 0) return ''; // מונע פלט "undefined" מאינדקסים שליליים/שבורים
  const U = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const T = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const H = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  let s = H[Math.floor(n / 100)] || '';
  const r = n % 100;
  if (r === 15) s += 'טו';
  else if (r === 16) s += 'טז';
  else s += T[Math.floor(r / 10)] + U[r % 10];
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}

export function gemYear(y: number | string): string {
  return gem(+y % 1000);
}

export interface HebParts {
  day: number;
  month: string;
  year: number;
}

/**
 * נרמול אדר לחזרה שנתית: בשנה פשוטה יש "אדר" אחד, בשנה מעוברת "אדר א׳"+"אדר ב׳".
 * מיקומית האדר של שנה פשוטה מקביל ל"אדר ב׳" (שניהם צמודים לניסן), ולכן אזכרה/
 * יום-נישואים/יום-הולדת שנקבע ב"אדר" רגיל חוזר ב"אדר ב׳" של שנה מעוברת (וההפך).
 * בלי הנרמול אירוע/יום-הולדת עברי כזה נעלם מכל המשטחים בשנה מעוברת — איבוד נתונים.
 */
export function adarNorm(monthEn: string): string {
  return monthEn === 'Adar II' ? 'Adar' : monthEn;
}

/** האם שם החודש הוא אדר כלשהו (רגיל / א׳ / ב׳). */
function isAdar(m: string): boolean {
  return m === 'Adar' || m === 'Adar I' || m === 'Adar II';
}

/**
 * מטמון פר-שנה-עברית: רצף החודשים + קבוצת החודשים שיש בהם יום 30 (ל'). סריקה
 * אחת (~440 ימים) פר שנה — מזהה חודש חסר (חשוון/כסלו בני 29, אדר-א' בשנה פשוטה).
 * נדרש לכלל "ל׳ → א׳ בחודש הבא". טהור (hebParts בלבד — אין תלות ב-hebdate,
 * שמייבא מכאן; מונע תלות מעגלית).
 */
const hebYearScan = new Map<number, { seq: string[]; has30: Set<string> }>();
function scanHebYear(hebYear: number): { seq: string[]; has30: Set<string> } {
  const hit = hebYearScan.get(hebYear);
  if (hit) return hit;
  const seq: string[] = [];
  const has30 = new Set<string>();
  const gy = hebYear - 3761; // 1 באוגוסט של השנה הזו קודם תמיד לא' תשרי של hebYear
  for (let i = 0; i < 440; i++) {
    const p = hebParts(new Date(gy, 7, 1 + i, 12));
    if (p.year !== hebYear) continue;
    if (!seq.includes(p.month)) seq.push(p.month);
    if (p.day === 30) has30.add(p.month);
  }
  const res = { seq, has30 };
  hebYearScan.set(hebYear, res);
  return res;
}

/**
 * שוויון יום+חודש עברי לחזרה שנתית — **א-סימטרי לפי תפקיד**: הארגומנט הראשון הוא
 * *עוגן* (תאריך האירוע/יום-ההולדת המקורי), השני הוא *היום הנבדק* בשנה הנוכחית.
 * מקור-אמת יחיד לכל המשטחים (בית · לוח · קרובים · ייצוא) כדי שלא ייווצר פער.
 *
 * כלל ל׳ (החלטת המשתמש — "במקום ל אז א"): עוגן ל-ל' (30) בחודש שבשנה הנבדקת
 * *אין בו* יום 30 (חשוון/כסלו חסרים, אדר-א' בשנה פשוטה) — האזכרה/האירוע נופל על
 * *א' בחודש הבא* (יום ראש-חודש). בחודש שתמיד יש בו ל' (תשרי/שבט/ניסן/סיוון/אב)
 * האירוע נשאר על ל'. בלי כפילות: הנפילה חלה רק כשאין 30. דורש את שנת היום-הנבדק.
 *
 * כלל אדר (החלטת המשתמש — "אדר רגיל → אדר ב׳"):
 *  · שנה פשוטה (ליום הנבדק חודש 'Adar' יחיד) — כל עוגן-אדר נופל עליו.
 *  · שנה מעוברת: עוגן ב-'Adar' רגיל או 'Adar II' → נופל על אדר ב׳ (לא אדר א׳),
 *    כך שאזכרה/יום-הולדת חוזר פעם אחת בלבד; עוגן ב-'Adar I' → נופל על אדר א׳.
 * הא-סימטריות הכרחית: קריסה סימטרית של שלושת האדרים הייתה מפעילה אירוע אדר-רגיל
 * גם באדר א׳ וגם באדר ב׳ (כפילות), ועוגן אדר-א׳ היה נעלם משנה פשוטה (הבאג המקורי).
 */
export function hebAnnualEq(
  anchor: { day: number; month: string },
  query: { day: number; month: string; year?: number },
): boolean {
  // כלל ל׳: עוגן-30 מול א' בחודש-הבא, כשלחודש-העוגן אין 30 בשנת היום-הנבדק.
  if (anchor.day === 30 && query.day === 1 && query.year) {
    const { seq, has30 } = scanHebYear(query.year);
    const qi = seq.indexOf(query.month);
    const prev = qi > 0 ? seq[qi - 1] : null;
    // עוגן 30 אדר-א' בשנה *פשוטה*: אין 'Adar I' ברצף (רק 'Adar'), לכן ההשוואה
    // הישירה נכשלה והאירוע נעלם לגמרי (באג — אזכרה/יום-הולדת ב-30 אדר-א' חסר
    // מ-12 מתוך 19 שנים). כלל ל׳ המתועד: נופל על א' בחודש-הבא (=א' ניסן). אדר-א'
    // בשנה פשוטה = ה-'Adar' היחיד, שאין בו 30 ⇒ יורה. (בשנה מעוברת אין נפילה —
    // ל-Adar I יש 30, ההתאמה המדויקת מטפלת; ראה בדיקת-שימור.)
    const prevMatches = prev === anchor.month || (anchor.month === 'Adar I' && prev === 'Adar');
    if (prev && prevMatches && !has30.has(prev)) return true;
  }
  if (anchor.day !== query.day) return false;
  if (isAdar(anchor.month) || isAdar(query.month)) {
    if (!isAdar(anchor.month) || !isAdar(query.month)) return false; // אחד אדר, השני לא
    if (query.month === 'Adar') return true; // שנה פשוטה — אדר יחיד בולע כל עוגן-אדר
    if (query.month === 'Adar II') return anchor.month === 'Adar' || anchor.month === 'Adar II';
    if (query.month === 'Adar I') return anchor.month === 'Adar I';
    return false;
  }
  return anchor.month === query.month;
}

/** מפרק תאריך לועזי לחלקי התאריך העברי (חודש בשם אנגלי — 'Tishri', 'Adar II'…). */
export function hebParts(d: Date): HebParts {
  if (isNaN(d.getTime())) return { day: 0, month: '', year: 0 }; // תאריך לא-חוקי → חלקים בטוחים (מונע RangeError ב-formatToParts)
  const parts = fmtParts.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: +get('day'), month: get('month'), year: +get('year') };
}

/**
 * hebParts ממומואיז לפי מחרוזת-ISO (חלקי-התאריך העברי דטרמיניסטיים לכל יום).
 * מטמון **חסום** (HP_CACHE_MAX): homeData ו-calLib החזיקו כל אחד Map ללא-גבול
 * שגדל עם כל תאריך שנצפה (ניווט-לוח ארוך = דליפת-זיכרון איטית). בחריגה מהתקרה
 * מנקים — hebParts טהור, אז הבנייה-מחדש חינמית מבחינת נכונות. משותף לשני הקוראים.
 */
const HP_CACHE_MAX = 3000;
const hpCacheShared = new Map<string, HebParts>();
export function hebPartsOfIso(iso: string): HebParts {
  let hp = hpCacheShared.get(iso);
  if (!hp) {
    if (hpCacheShared.size >= HP_CACHE_MAX) hpCacheShared.clear();
    hp = hebParts(new Date(iso.slice(0, 10) + 'T12:00:00'));
    hpCacheShared.set(iso, hp);
  }
  return hp;
}

/**
 * "ט״ו אלול תשפ״ו" מתוך תאריך ISO.
 * שימוש בצהריים מקומי (T12:00:00) ולא בחצות: `new Date('YYYY-MM-DD')` נפרש
 * כחצות UTC, ובאזורי זמן ממערב ל-UTC (יבשת אמריקה) זה נופל ליום הקודם מקומית
 * וגורם לתאריך העברי לסטות ביום. צהריים חסין לכך ולשעון קיץ — עקבי עם שאר
 * שכבת התאריכים (hebToIsoEn · isoToHebParts · homeData).
 */
export function hebDateFull(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  if (isNaN(d.getTime())) return '';
  return `${gem(hebParts(d).day)} ${fmtHM.format(d)} ${gemYear(fmtHY.format(d))}`;
}

/** חגים ומועדים לפי 'חודש-אנגלי יום'. */
export const HOLIDAYS: Record<string, string> = {
  'Tishri 1': 'ראש השנה',
  'Tishri 2': 'ראש השנה ב׳',
  'Tishri 3': 'צום גדליה',
  'Tishri 10': 'יום כיפור',
  'Tishri 15': 'סוכות',
  'Tishri 21': 'הושענא רבה',
  'Tishri 22': 'שמחת תורה',
  // חנוכה — 8 ימים: כ״ה כסלו עד ב׳/ג׳ טבת (התלות באורך כסלו מטופלת ע"י כך
  // שכ״ל בכסלו קיים רק בשנה מלאה, וג׳ טבת רק בשנה חסרה — תמיד 8 ימים בפועל).
  'Kislev 25': 'חנוכה',
  'Kislev 26': 'חנוכה',
  'Kislev 27': 'חנוכה',
  'Kislev 28': 'חנוכה',
  'Kislev 29': 'חנוכה',
  'Kislev 30': 'חנוכה',
  'Tevet 1': 'חנוכה',
  'Tevet 2': 'חנוכה',
  // ג' טבת (יום ח' של חנוכה) מטופל דינמית ב-holidayOf — רק כשכסלו היה חסר (29).
  'Tevet 10': 'צום עשרה בטבת',
  'Shevat 15': 'ט״ו בשבט',
  // פורים קטן / שושן פורים קטן — רק בשנה מעוברת (אדר א׳)
  'Adar I 14': 'פורים קטן',
  'Adar I 15': 'שושן פורים קטן',
  'Adar 13': 'תענית אסתר',
  'Adar II 13': 'תענית אסתר',
  'Adar 14': 'פורים',
  'Adar II 14': 'פורים',
  'Adar 15': 'שושן פורים',
  'Adar II 15': 'שושן פורים',
  'Nisan 15': 'פסח',
  'Nisan 21': 'שביעי של פסח',
  'Iyar 18': 'ל״ג בעומר',
  'Sivan 6': 'שבועות',
  'Tamuz 17': 'צום י״ז בתמוז',
  'Av 9': 'תשעה באב',
  'Av 15': 'ט״ו באב',
  'Elul 29': 'ערב ראש השנה',
};

/** שם החג בתאריך נתון, אם יש. */
export function holidayOf(d: Date): string | null {
  const p = hebParts(d);
  // חנוכה יום ח' (ג' טבת): קיים רק בשנה שכסלו בה חסר (29) — בשנה מלאה חנוכה
  // מסתיים ב-ב' טבת. שמירה על 8 ימים בדיוק בשתי סוגי-השנים.
  if (p.month === 'Tevet' && p.day === 3) {
    return scanHebYear(p.year).has30.has('Kislev') ? null : 'חנוכה';
  }
  // 🐛 נחיל-עמוק (13.8): צום י״ז בתמוז / ט׳ באב שחלו בשבת — הצום נדחה ליום ראשון
  // (כמו ביומן-החדרים, לקח #21). לא מציגים "צום" על השבת אלא על יום-הדחייה.
  const dow = d.getDay();
  const key = `${p.month} ${p.day}`;
  if (dow === 6 && (key === 'Tamuz 17' || key === 'Av 9')) return null; // שבת — הצום נדחה
  if (dow === 0 && p.month === 'Tamuz' && p.day === 18) return 'צום י״ז בתמוז (נדחה)';
  if (dow === 0 && p.month === 'Av' && p.day === 10) return 'תשעה באב (נדחה)';
  // דין-נדחה מלא (19.8) — אותו דפוס לשני הצומות הנותרים:
  // צום גדליה (ג' תשרי) שחל בשבת נדחה ליום ראשון (ד' תשרי) — קורה כשר"ה ביום חמישי.
  if (dow === 6 && key === 'Tishri 3') return null;
  if (dow === 0 && p.month === 'Tishri' && p.day === 4) return 'צום גדליה (נדחה)';
  // תענית אסתר (י"ג אדר) שחלה בשבת מוקדמת ליום חמישי (י"א אדר) — פורים ביום ראשון.
  if (dow === 6 && (key === 'Adar 13' || key === 'Adar II 13')) return null;
  if (dow === 4 && p.day === 11 && (p.month === 'Adar' || p.month === 'Adar II')) {
    return 'תענית אסתר (מוקדם)';
  }
  return HOLIDAYS[key] ?? null;
}
