/**
 * 🧩 כרטיסי-החלקים — שמונת המנועים הקטנים של הגל הראשון (ATOMS, 14.10.2026).
 * כל כרטיס: מאיזה מנוע גדול פורק (ומספרו בפירוק), מה הוא מחשב, על איזה סוג הוא עובד (הצד הנקבה),
 * השאלה האחת שהוא שואל כשמחברים אותו, והפרטים שהוא שואל אחרי שבחרו מקום.
 * המימוש עצמו ב-`./parts/` (טהור). המזהים, הסוגים והשאלות קבועים — סשנים אחרים נשענים עליהם.
 */
import type { AtomCard, AtomId } from './contract';

export const ATOM_CARDS: readonly AtomCard[] = [
  {
    id: 'divide',
    name: 'חלוקה לחלקים שווים',
    emoji: '✂️',
    from: { engine: 'zmanim', num: 7 },
    computes: 'מחלק טווח או סכום לחלקים שווים, או לחלקים בגודל קבוע עם הפסקה ביניהם',
    worksOn: ['span', 'amount'],
    question: 'מה לחלק?',
    details: [
      {
        id: 'by',
        label: 'איך לחלק?',
        type: 'choice',
        choices: [
          { id: 'parts', label: 'למספר חלקים שווים' },
          { id: 'size', label: 'לחלקים בגודל קבוע' },
        ],
        default: 'parts',
      },
      { id: 'parts', label: 'לכמה חלקים?', type: 'number', min: 1, max: 1000, default: 12 },
      { id: 'size', label: 'כמה בכל חלק?', type: 'number', min: 1, default: 30 },
      { id: 'gap', label: 'כמה הפסקה בין חלק לחלק?', type: 'number', min: 0, default: 0 },
      {
        id: 'remainder',
        label: 'מה לעשות עם מה שנשאר בסוף?',
        type: 'choice',
        choices: [
          { id: 'drop', label: 'לוותר עליו' },
          { id: 'shorten', label: 'חלק אחרון קצר יותר' },
        ],
        default: 'drop',
      },
    ],
  },
  {
    id: 'merge',
    name: 'מיזוג רצפים',
    emoji: '🔗',
    from: { engine: 'zmanim', num: 13 },
    computes: 'מאחד פריטים צמודים מאותו מצב לרצף אחד — כמו שבת ליד חג שהופכים לחלון סגור אחד',
    worksOn: ['sequence'],
    question: 'מה לאחד?',
    details: [
      { id: 'maxGap', label: 'כמה רווח מותר בתוך רצף?', type: 'number', min: 0, default: 0 },
      { id: 'minLength', label: 'מה האורך הקצר ביותר שנחשב?', type: 'number', min: 1, default: 1 },
    ],
  },
  {
    id: 'next',
    name: 'מה הבא?',
    emoji: '⏭️',
    from: { engine: 'zmanim', num: 14 },
    computes: 'מוצא את הדבר הקרוב הבא אחרי עכשיו — רגע, או רצף באורך מספיק',
    worksOn: ['times', 'sequence'],
    question: 'מה לחפש קדימה?',
    details: [
      { id: 'count', label: 'כמה הבאים להראות?', type: 'number', min: 1, max: 50, default: 1 },
      { id: 'minLength', label: 'מה האורך הקצר ביותר שמתאים?', type: 'number', min: 1, default: 1 },
    ],
  },
  {
    id: 'round',
    name: 'עיגול לחומרא',
    emoji: '🎯',
    from: { engine: 'zmanim', num: 8 },
    computes: 'מעגל מספר או זמן ליחידה קבועה, בכיוון שבוחרים — סוף למטה, התחלה למעלה',
    worksOn: ['amount', 'times'],
    question: 'מה לעגל?',
    details: [
      { id: 'step', label: 'לאיזו יחידה לעגל?', type: 'number', min: 0.01, default: 1 },
      {
        id: 'dir',
        label: 'לאיזה כיוון?',
        type: 'choice',
        choices: [
          { id: 'down', label: 'לחומרא למטה' },
          { id: 'up', label: 'לחומרא למעלה' },
          { id: 'nearest', label: 'לקרוב' },
        ],
        default: 'down',
      },
    ],
  },
  {
    id: 'offset',
    name: 'זמן יחסי',
    emoji: '⏱️',
    from: { engine: 'zmanim', num: 9 },
    computes: 'מזיז זמנים בכמה דקות ביחס לעוגן — כמו "10 דקות לפני השקיעה"',
    worksOn: ['times'],
    question: 'ביחס למה?',
    details: [{ id: 'minutes', label: 'כמה דקות? (מינוס = לפני)', type: 'minutes', min: -1440, max: 1440, default: -10 }],
  },
  {
    id: 'escalate',
    name: 'ניתוב עם הסלמה',
    emoji: '📣',
    from: { engine: 'whatNeed', num: 8 },
    computes: 'שולח קודם למקבלים הראשונים, ואם אין תשובה בזמן — מעביר הלאה לשלב הבא',
    worksOn: ['waiting'],
    question: 'מה להעביר הלאה כשאין תשובה?',
    details: [
      { id: 'waitMin', label: 'כמה לחכות לתשובה לפני שמעבירים?', type: 'minutes', min: 0, default: 180 },
      { id: 'urgentWaitMin', label: 'וכמה לחכות כשזה דחוף?', type: 'minutes', min: 0, default: 60 },
    ],
  },
  {
    id: 'rotate',
    name: 'סבב הוגן',
    emoji: '🔄',
    from: { engine: 'whatNeed', num: 11 },
    computes: 'מחלק תורות בסבב — כל אחד בתורו, בלי לדלג ובלי להעדיף',
    worksOn: ['waiting', 'sequence'],
    question: 'מה לחלק בתורות?',
    details: [
      {
        id: 'by',
        label: 'איך מתחלף התור?',
        type: 'choice',
        choices: [
          { id: 'day', label: 'לפי יום' },
          { id: 'item', label: 'לפי פריט' },
        ],
        default: 'day',
      },
    ],
  },
  {
    id: 'fuzzy',
    name: 'חיפוש סלחני',
    emoji: '🔍',
    from: { engine: 'whatNeed', num: 4 },
    computes: 'מוצא מילים גם עם אותיות-שימוש בהתחלה (ו ה ב ל מ ש כ) וגם עם טעות הקלדה אחת',
    worksOn: ['text'],
    question: 'איפה לחפש?',
    details: [{ id: 'maxTypos', label: 'כמה טעויות הקלדה לסלוח?', type: 'number', min: 0, max: 1, default: 1 }],
  },
];

const BY_ID = new Map<string, AtomCard>(ATOM_CARDS.map((c) => [c.id, c]));

/** כרטיס לפי מזהה; לא-מוכר ⇒ null. */
export function atomCard(id: AtomId | string): AtomCard | null {
  return BY_ID.get(id) ?? null;
}
