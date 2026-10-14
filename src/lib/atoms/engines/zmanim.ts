/**
 * 🕯️ מנוע הזמנים והשבת — כרטיס-מנוע (ATOMS-ENGINES, 14.10.2026).
 * הפירוק ל-15 חלקים, נאמן לקוד החי: telephony/lib/zmanim.mjs · telephony/lib/hebcal.mjs ·
 * src/components/parnasa/zmanimBoard.ts. נתונים בלבד — בלי חישוב, בלי store/DOM.
 */
import type { EngineCard } from '../contract';

export const ZMANIM_CARD: EngineCard = {
  id: 'zmanim',
  name: 'מנוע הזמנים והשבת',
  emoji: '🕯️',
  from: 'פרנסה׳לע',
  computes: 'מחשב מהשמש ומהלוח העברי את זמני היום, את הדלקת הנרות ואת צאת השבת, ואת חלונות השבת והחג הסגורים.',
  parts: [
    // zmanim.mjs:45 julianDay
    { num: 1, name: 'ממיר תאריך למספר', computes: 'הופך תאריך לועזי למספר-יום רציף (יום יוליאני) שאפשר לחשב עליו.' },
    // zmanim.mjs:59 solarEventUTCmin — נטיית השמש ומשוואת-הזמן
    { num: 2, name: 'גובה השמש בעונה', computes: 'מחשב את נטיית השמש ואת משוואת-הזמן לפי היום בשנה.' },
    // zmanim.mjs:59 — זריחה/שקיעה ב-UTC לפי קו-רוחב וקו-אורך
    { num: 3, name: 'שעון השמש', computes: 'נותן את רגע הזריחה והשקיעה (בדקות מחצות UTC) לפי המיקום.' },
    // zmanimBoard.ts:283 sunAngleTime — שעת הגעה לזווית נתונה מתחת לאופק
    { num: 4, name: 'זווית לזמן', computes: 'מחשב מתי השמש מגיעה לזווית מסוימת מתחת לאופק.' },
    // zmanim.mjs:93 localHHMM · zmanimBoard.ts:123 clockAt
    { num: 5, name: 'ממיר לשעון מקומי', computes: 'הופך דקות UTC לשעה מקומית HH:MM לפי אזור-הזמן, כולל שעון קיץ.' },
    // zmanim.mjs:129 shabbatTimes (שקיעה−נרות, שקיעה+צאת) · zmanim.mjs:138 addDaysIso
    { num: 6, name: 'חיבור וחיסור דקות וימים', computes: 'מוסיף או מוריד דקות משעה וימים מתאריך (שקיעה פחות 40 דקות = הדלקת נרות).', atom: 'offset' },
    // zmanimBoard.ts:404 dayZmanim — שעה זמנית = (שקיעה−נץ)/12
    { num: 7, name: 'חלוקה לחלקים שווים', computes: 'מחלק את היום ל-12 שעות זמניות שוות (גר״א, ומג״א מעלות עד צאת).', atom: 'divide' },
    // zmanimBoard.ts:414 — סוף-זמן ⇒ floor, זמן-התחלה ⇒ ceil
    { num: 8, name: 'עיגול לחומרא', computes: 'מעגל לדקה השלמה לחומרא: סוף-זמן כלפי מטה, תחילת-זמן כלפי מעלה.', atom: 'round' },
    // zmanimBoard.ts:420–438 — עלות השחר = נץ−72, ר״ת = שקיעה+72, מניינים sh±N
    { num: 9, name: 'זמן יחסי', computes: 'קובע זמן ביחס לזמן אחר: 72 דקות לפני הנץ, מניין 20 דקות לפני השקיעה.', atom: 'offset' },
    // hebcal.mjs:39 hebParts · zmanimBoard.ts:383 hebDateAt (מתחלף בשקיעה)
    { num: 10, name: 'ממיר לועזי לעברי', computes: 'נותן יום, חודש ושנה עבריים לתאריך לועזי, ומחליף תאריך בשקיעה.' },
    // hebcal.mjs:63 classifyDay
    { num: 11, name: 'מסווג ימים', computes: 'אומר על כל יום אם הוא שבת, יום טוב, חול המועד, ערב חג, צום או ראש חודש.' },
    // zmanimBoard.ts:29 gem/gemYear (lib/hebrew)
    { num: 12, name: 'גימטריה', computes: 'כותב מספר באותיות עבריות (ט״ו, תשפ״ז).' },
    // zmanim.mjs:152 hebrewClosedWindows — "מיזוג-רצפים"
    { num: 13, name: 'מיזוג רצפים', computes: 'מאחד ימים סגורים צמודים (חג ושבת) לחלון סגירה אחד מהדלקה עד צאת.', atom: 'merge' },
    // zmanimBoard.ts:452 markZmanim (next) · zmanimBoard.ts shabbatOf/upcomingClosures
    { num: 14, name: '"מה הבא?"', computes: 'מוצא את הזמן הבא שעוד לא הגיע ואת השבת או החג הקרוב.', atom: 'next' },
    // zmanim.mjs:187 fail-closed בקוטב · zmanimBoard.ts:312 closureAt fail-closed
    { num: 15, name: 'כלל בטיחות', computes: 'כשאי אפשר לחשב שקיעה, סוגר את כל היום (נכשל לכיוון סגור, אף פעם לא פתוח בשבת).' },
  ],
  places: [
    {
      id: 'zmanim.day',
      engine: 'zmanim',
      name: 'היום מהנץ עד השקיעה',
      kind: 'span',
      results: { divide: 'שעות זמניות: היום מחולק ל-12 שעות שוות באורכן של היום הזה' },
    },
    {
      id: 'zmanim.shabbat',
      engine: 'zmanim',
      name: 'השבת מהדלקת הנרות עד צאת השבת',
      kind: 'span',
      results: { divide: 'השבת מחולקת למשמרות שוות (תורנות שמירה או השגחה)' },
    },
    {
      id: 'zmanim.times',
      engine: 'zmanim',
      name: 'זמני היום (עלות, נץ, סוף זמן ק״ש, חצות, שקיעה, צאת)',
      kind: 'times',
      results: {
        next: 'הזמן הבא שעוד לא הגיע, מסומן בלוח',
        offset: 'זמן חדש ביחס לזמן קיים: מניין 20 דקות לפני השקיעה',
        round: 'כל זמן מעוגל לדקה לחומרא: סוף-זמן למטה, התחלה למעלה',
      },
    },
    {
      id: 'zmanim.closedDays',
      engine: 'zmanim',
      name: 'הימים הסגורים בשבועות הקרובים (שבת ויום טוב)',
      kind: 'sequence',
      results: {
        merge: 'חג ושבת צמודים = חלון סגור אחד מהדלקה עד צאת',
        next: 'השבת או החג הקרוב שעוד לא נגמר',
      },
    },
  ],
};
