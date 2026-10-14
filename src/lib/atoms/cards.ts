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
    name: 'מחלק לחלקים שווים',
    emoji: '✂️',
    from: { engine: 'zmanim', num: 7 },
    computes: 'נותנים לו התחלה, סוף ומספר, והוא חותך לחלקים באותו גודל.',
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
    name: 'מחבר דברים צמודים',
    emoji: '🔗',
    from: { engine: 'zmanim', num: 13 },
    computes: 'מקבל רשימה, ומאחד לקבוצה אחת כל מה שצמוד זה לזה.',
    worksOn: ['sequence'],
    question: 'מה לאחד?',
    details: [
      { id: 'maxGap', label: 'כמה רווח מותר בתוך רצף?', type: 'number', min: 0, default: 0 },
      { id: 'minLength', label: 'מה האורך הקצר ביותר שנחשב?', type: 'number', min: 1, default: 1 },
    ],
  },
  {
    id: 'next',
    name: 'מוצא את הבא בתור',
    emoji: '⏭️',
    from: { engine: 'zmanim', num: 14 },
    computes: 'מסתכל ברשימה ובשעה עכשיו, ואומר מה הדבר הבא שעוד לא קרה.',
    worksOn: ['times', 'sequence'],
    question: 'מה לחפש קדימה?',
    details: [
      { id: 'count', label: 'כמה הבאים להראות?', type: 'number', min: 1, max: 50, default: 1 },
      { id: 'minLength', label: 'מה האורך הקצר ביותר שמתאים?', type: 'number', min: 1, default: 1 },
    ],
  },
  {
    id: 'round',
    name: 'מעגל מספרים',
    emoji: '🎯',
    from: { engine: 'zmanim', num: 8 },
    computes: 'הופך מספר לא עגול למספר עגול, למעלה או למטה, לפי מה שבוחרים.',
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
    name: 'מזיז זמן לפני או אחרי',
    emoji: '⏱️',
    from: { engine: 'zmanim', num: 9 },
    computes: 'לוקח זמן שכבר קיים, ומוסיף לו או מוריד ממנו דקות או ימים.',
    worksOn: ['times'],
    question: 'ביחס למה?',
    details: [{ id: 'minutes', label: 'כמה דקות? (מינוס = לפני)', type: 'minutes', min: -1440, max: 1440, default: -10 }],
  },
  {
    id: 'escalate',
    name: 'מעביר הלאה כשאין תשובה',
    emoji: '📣',
    from: { engine: 'whatNeed', num: 8 },
    computes: 'שולח משהו למישהו. אם הוא לא עונה בזמן, מעביר לבא אחריו.',
    worksOn: ['waiting'],
    question: 'מה להעביר הלאה כשאין תשובה?',
    details: [
      { id: 'waitMin', label: 'כמה לחכות לתשובה לפני שמעבירים?', type: 'minutes', min: 0, default: 180 },
      { id: 'urgentWaitMin', label: 'וכמה לחכות כשזה דחוף?', type: 'minutes', min: 0, default: 60 },
    ],
  },
  {
    id: 'rotate',
    name: 'מחלק בתורות',
    emoji: '🔄',
    from: { engine: 'whatNeed', num: 11 },
    computes: 'כל פעם נותן לאדם אחר ברשימה, לפי הסדר, כדי שיהיה הוגן.',
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
    name: 'מוצא גם עם טעות כתיב',
    emoji: '🔍',
    from: { engine: 'whatNeed', num: 4 },
    computes: 'מחפש מילה ומוצא אותה גם כשיש בה טעות אחת, או "ו", "ה" או "ב" בהתחלה.',
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
