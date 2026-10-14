/**
 * 🕯️ מנוע הזמנים והשבת — כרטיס-מנוע (ATOMS-ENGINES, 14.10.2026).
 * הפירוק ל-15 חלקים, נאמן לקוד החי: telephony/lib/zmanim.mjs · telephony/lib/hebcal.mjs ·
 * src/components/parnasa/zmanimBoard.ts. נתונים בלבד — בלי חישוב, בלי store/DOM.
 */
import type { EngineCard } from '../contract';

export const ZMANIM_CARD: EngineCard = {
  id: 'zmanim',
  name: 'מחשבון הזמנים',
  emoji: '🕯️',
  from: 'פרנסה׳לע',
  computes: 'יודע איפה השמש נמצאת בכל מקום ובכל יום, ומזה מחשב את כל הזמנים.',
  parts: [
    // zmanim.mjs:45 julianDay
    { num: 1, name: 'הופך תאריך למספר ימים, כדי לחשב איתו', computes: 'כל תאריך הופך למספר אחד שרץ מיום ליום, וככה קל לחשב איתו.' },
    // zmanim.mjs:59 solarEventUTCmin — נטיית השמש ומשוואת-הזמן
    { num: 2, name: 'מחשב איפה השמש עומדת בעונה הזו', computes: 'לפי היום בשנה, מחשב כמה גבוה השמש עולה, ובכמה השעון שלה מקדים או מאחר.' },
    // zmanim.mjs:59 — זריחה/שקיעה ב-UTC לפי קו-רוחב וקו-אורך
    { num: 3, name: 'מחשב מתי זריחה ושקיעה', computes: 'לפי המקום על המפה, נותן את רגע הזריחה ואת רגע השקיעה.' },
    // zmanimBoard.ts:283 sunAngleTime — שעת הגעה לזווית נתונה מתחת לאופק
    { num: 4, name: 'מחשב מתי השמש יורדת לעומק מסוים', computes: 'אומר באיזו שעה השמש מגיעה לעומק מסוים מתחת לאופק, למשל בצאת הכוכבים.' },
    // zmanim.mjs:93 localHHMM · zmanimBoard.ts:123 clockAt
    { num: 5, name: 'הופך את החישוב לשעה בשעון שלנו', computes: 'נותן שעה רגילה, כמו 17:46, לפי המקום, כולל שעון קיץ.' },
    // zmanim.mjs:129 shabbatTimes (שקיעה−נרות, שקיעה+צאת) · zmanim.mjs:138 addDaysIso
    { num: 6, name: 'מוסיף ומוריד דקות וימים', computes: 'מוסיף או מוריד דקות משעה, וימים מתאריך. למשל: שקיעה פחות 40 דקות = הדלקת נרות.', atom: 'offset' },
    // zmanimBoard.ts:404 dayZmanim — שעה זמנית = (שקיעה−נץ)/12
    { num: 7, name: 'מחלק את היום ל-12 שעות שוות', computes: 'מחלק את הזמן מהנץ עד השקיעה ל-12 חלקים שווים: "השעות הזמניות".', atom: 'divide' },
    // zmanimBoard.ts:414 — סוף-זמן ⇒ floor, זמן-התחלה ⇒ ceil
    { num: 8, name: 'מעגל כל זמן לדקה, לחומרא', computes: 'מעגל לדקה שלמה: סוף זמן כלפי מטה, תחילת זמן כלפי מעלה.', atom: 'round' },
    // zmanimBoard.ts:420–438 — עלות השחר = נץ−72, ר״ת = שקיעה+72, מניינים sh±N
    { num: 9, name: 'קובע זמן לפני או אחרי זמן אחר', computes: 'למשל: עלות השחר 72 דקות לפני הנץ, מניין 20 דקות לפני השקיעה.', atom: 'offset' },
    // hebcal.mjs:39 hebParts · zmanimBoard.ts:383 hebDateAt (מתחלף בשקיעה)
    { num: 10, name: 'הופך תאריך לועזי לעברי', computes: 'נותן יום, חודש ושנה עבריים, ומחליף את התאריך בשקיעה.' },
    // hebcal.mjs:63 classifyDay
    { num: 11, name: 'אומר איזה יום זה', computes: 'אומר על כל יום אם הוא שבת, חג, חול המועד, ערב חג, צום או ראש חודש.' },
    // zmanimBoard.ts:29 gem/gemYear (lib/hebrew)
    { num: 12, name: 'כותב מספר באותיות', computes: 'כותב מספר באותיות עבריות, כמו ט״ו או תשפ״ז.' },
    // zmanim.mjs:152 hebrewClosedWindows — "מיזוג-רצפים"
    { num: 13, name: 'מחבר ימים סגורים צמודים', computes: 'חג ושבת צמודים הופכים לחלון סגור אחד, מהדלקת הנרות עד צאת החג.', atom: 'merge' },
    // zmanimBoard.ts:452 markZmanim (next) · zmanimBoard.ts shabbatOf/upcomingClosures
    { num: 14, name: 'מוצא את הזמן הבא', computes: 'מוצא את הזמן הבא שעוד לא הגיע, ואת השבת או החג הקרובים.', atom: 'next' },
    // zmanim.mjs:187 fail-closed בקוטב · zmanimBoard.ts:312 closureAt fail-closed
    { num: 15, name: 'סוגר את היום כשאי אפשר לחשב', computes: 'כשאי אפשר לדעת מתי השקיעה, סוגר את כל היום. אף פעם לא פותח בשבת בטעות.' },
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
