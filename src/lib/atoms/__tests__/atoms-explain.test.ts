/**
 * 🔒 ratchets · השמות של המנועים (ATOMS-NAMES, 14.10.2026).
 * הבעלים: "צריך לעבוד יותר על השמות של המנועים כדי שנבין מה הם עושים" — ואז "הסבר צמוד עם דוגמאות".
 * הכלל שאושר: השם = מה המנוע עושה, כפועל, במילים של כל יום · מתחתיו משפט אחד · ושלוש דוגמאות "קלט ← תוצאה".
 * הבאג שננעל: שמות טכניים ("מיזוג רצפים", "ניתוב עם הסלמה", "חיפוש סלחני") ותוויות-סוג ("טווח", "רצף")
 * הופיעו על המסך — ולא היה ברור מה כל מנוע עושה.
 *  (א) לכל חלק ולכל מנוע: שם, הסבר, ובדיוק 3 דוגמאות — כל אחת עם "←".
 *  (ב) אין מילים טכניות אסורות בשום שם או תווית-סוג שהמשתמש רואה (הדוגמאות רשאיות לומר "ברצף").
 *  (ג) הטקסטים ב-explain.ts = הרשימה שאושרה, תו-בתו.
 *  (ד) הכרטיסים (שם/הסבר/אימוג׳י) = explain.ts; מספר החלקים הפנימיים = partsCount.
 */
import { describe, expect, it } from 'vitest';
import { ATOM_IDS, ENGINE_IDS, KINDS } from '../contract';
import { ATOM_CARDS } from '../cards';
import { ENGINE_CARDS } from '../engines';
import { ATOM_EXPLAIN, ENGINE_EXPLAIN, examplesOf, KIND_PLAIN } from '../explain';
import { NAME_RULES } from '../../../components/enginebox/atoms/naming';

const BANNED = ['מיזוג', 'ניתוב', 'הסלמה', 'סלחני', 'יחסי', 'אטום', 'רצף', 'טווח'];

const APPROVED = {
  atoms: {
    divide: ['✂️', 'מחלק לחלקים שווים', 'נותנים לו התחלה, סוף ומספר, והוא חותך לחלקים באותו גודל.', ['8:00 עד 16:00, ל-8 חלקים ← 8 תורים של שעה', '₪1,200, ל-3 חלקים ← 3 תשלומים של ₪400', 'מהנץ עד השקיעה, ל-12 חלקים ← "השעות הזמניות" של היום']],
    merge: ['🔗', 'מחבר דברים צמודים', 'מקבל רשימה, ומאחד לקבוצה אחת כל מה שצמוד זה לזה.', ['לילות פנויים ב-20, 21 ו-22 ← "פנוי 3 לילות ברצף"', 'ראש השנה שנופל בשבת ← חלון סגור אחד, מיום שישי בערב ועד מוצאי ראשון', '2 תקלות פתוחות באותה יחידה ← היחידה חסומה עד שהאחרונה נסגרת']],
    next: ['⏭️', 'מוצא את הבא בתור', 'מסתכל ברשימה ובשעה עכשיו, ואומר מה הדבר הבא שעוד לא קרה.', ['רשימת ההגעות ← "ההגעה הבאה: משפחת לוי, 15:00"', 'זמני היום ← "הזמן הבא: שקיעה"', 'הלילות של יחידה ← "הלילה הפנוי הבא: 24/10"']],
    round: ['🎯', 'מעגל מספרים', 'הופך מספר לא עגול למספר עגול, למעלה או למטה, לפי מה שבוחרים.', ['₪1,187 ← ₪1,190', 'הגעה ב-15:12 ← 15:00 או 15:30', 'סוף זמן קריאת שמע, 9:13 ו-40 שניות ← 9:13 (מעגלים למטה, לחומרא)']],
    offset: ['⏱️', 'מזיז זמן לפני או אחרי', 'לוקח זמן שכבר קיים, ומוסיף לו או מוריד ממנו דקות או ימים.', ['הגעה ביום חמישי ← תזכורת ביום רביעי', 'שקיעה ב-18:08 ← מניין 20 דקות לפני, ב-17:48', 'שקיעה ב-18:08 ← הדלקת נרות 22 דקות לפני, ב-17:46']],
    escalate: ['📣', 'מעביר הלאה כשאין תשובה', 'שולח משהו למישהו. אם הוא לא עונה בזמן, מעביר לבא אחריו.', ['משימת ניקיון ← למנקה הקבוע. אם אין אישור תוך שעה ← למנקה הבא', '"דולף לי בכיור" ← לאינסטלטורים. אם אין תשובה תוך 3 שעות ← לכל הקהילה', 'יתרה שלא שולמה ← תזכורת לאורח. אם אין תגובה ← למנהל']],
    rotate: ['🔄', 'מחלק בתורות', 'כל פעם נותן לאדם אחר ברשימה, לפי הסדר, כדי שיהיה הוגן.', ['3 מנקים ← כל משימה חדשה למנקה הבא', '4 פרסומות באותו מקום ← כל יום מופיעה אחרת', 'תורנות שמירה ← כל שבת מישהו אחר']],
    fuzzy: ['🔍', 'מוצא גם עם טעות כתיב', 'מחפש מילה ומוצא אותה גם כשיש בה טעות אחת, או "ו", "ה" או "ב" בהתחלה.', ['"אינסטלתור" ← אינסטלטור', '"והחשמלאי" ← חשמלאי', '"משפחת לויי" ← משפחת לוי']],
  },
  engines: {
    zmanim: ['🕯️', 'מחשבון הזמנים', 'יודע איפה השמש נמצאת בכל מקום ובכל יום, ומזה מחשב את כל הזמנים.', ['בני ברק, יום שישי 16/10 ← הדלקת נרות ב-17:46', '10 בתשרי ← יום כיפור, צום', 'שבת וחג צמודים ← חלון סגור אחד'], 15],
    whatNeed: ['🙋', 'מבין בקשות', 'קורא מה האדם כתב, מבין מה הוא צריך, ומוצא מי יכול לעזור.', ['"דולף לי בכיור" ← אינסטלטורים', 'בקשה בנושא רגיש ← נשלחת בשקט, בלי שם', 'אין תשובה תוך 3 שעות ← הבקשה עוברת לכל הקהילה'], 12],
    bookings: ['🛏️', 'מנהל ההזמנות', 'יודע מה פנוי, מי מגיע ומתי, כמה זה עולה וכמה שולם.', ['"יש מקום לשבת?" ← צימר הגפן פנוי', '3 לילות כפול ₪600 ← ₪1,800, ועוד דמי ניקיון', 'אורח עוזב ← נפתחת משימת ניקיון'], 13],
  },
  kinds: { span: 'מ… עד…', amount: 'סכום', sequence: 'רשימת ימים או פריטים', times: 'רשימת זמנים', waiting: 'מחכה לתשובה', text: 'טקסט' },
} as const;

const all = () => [...ATOM_IDS.map((id) => [id, ATOM_EXPLAIN[id]] as const), ...ENGINE_IDS.map((id) => [id, ENGINE_EXPLAIN[id]] as const)];

describe('🔤 השמות של המנועים', () => {
  it('(א) לכל חלק ולכל מנוע: שם, הסבר ובדיוק 3 דוגמאות עם "←"', () => {
    expect(Object.keys(ATOM_EXPLAIN)).toEqual([...ATOM_IDS]);
    expect(Object.keys(ENGINE_EXPLAIN)).toEqual([...ENGINE_IDS]);
    for (const [id, e] of all()) {
      expect(e.name.trim().length, id).toBeGreaterThan(0);
      expect(e.emoji.trim().length, id).toBeGreaterThan(0);
      expect(e.explain.trim().length, id).toBeGreaterThan(0);
      expect(e.examples.length, id).toBe(3);
      for (const x of e.examples) expect(x, id).toContain('←');
      expect(examplesOf(id)).toBe(e.examples);
    }
    expect(examplesOf('nope')).toEqual([]);
  });

  it('(ב) אין מילים טכניות בשמות ובתוויות-הסוג שהמשתמש רואה', () => {
    const visible: [string, string][] = [];
    for (const [id, e] of all()) visible.push([id, e.name]);
    for (const c of ATOM_CARDS) visible.push([c.id, c.name]);
    for (const e of ENGINE_CARDS) {
      visible.push([e.id, e.name]);
      for (const p of e.parts) visible.push([e.id + '#' + p.num, p.name]);
      for (const p of e.places) visible.push([p.id, p.name]);
    }
    for (const [k, v] of Object.entries(KIND_PLAIN)) visible.push(['kind:' + k, v]);
    for (const r of NAME_RULES) visible.push(['cap:' + r.atom, r.name]);
    for (const [where, text] of visible) for (const w of BANNED) expect(text.includes(w), where + ': ' + text).toBe(false);
    // הדוגמאות רשאיות לומר "ברצף" — זו עברית של כל יום
    expect(ATOM_EXPLAIN.merge.examples[0]).toContain('ברצף');
    // ולכל סוג של החוזה יש שם פשוט
    expect(Object.keys(KIND_PLAIN).sort()).toEqual(KINDS.map((k) => k.id).sort());
  });

  it('(ג) הטקסטים = הרשימה שאושרה, תו-בתו', () => {
    for (const id of ATOM_IDS) {
      const [emoji, name, explain, examples] = APPROVED.atoms[id];
      expect(ATOM_EXPLAIN[id], id).toEqual({ name, emoji, explain, examples });
    }
    for (const id of ENGINE_IDS) {
      const [emoji, name, explain, examples, partsCount] = APPROVED.engines[id];
      expect(ENGINE_EXPLAIN[id], id).toEqual({ name, emoji, explain, examples, partsCount });
    }
    expect(KIND_PLAIN).toEqual(APPROVED.kinds);
  });

  it('(ד) הכרטיסים מדברים באותן מילים: שם, הסבר ואימוג׳י; מספר החלקים הפנימיים', () => {
    for (const c of ATOM_CARDS) {
      expect(c.name, c.id).toBe(ATOM_EXPLAIN[c.id].name);
      expect(c.computes, c.id).toBe(ATOM_EXPLAIN[c.id].explain);
      expect(c.emoji, c.id).toBe(ATOM_EXPLAIN[c.id].emoji);
    }
    for (const e of ENGINE_CARDS) {
      const x = ENGINE_EXPLAIN[e.id];
      expect(e.name, e.id).toBe(x.name);
      expect(e.computes, e.id).toBe(x.explain);
      expect(e.emoji, e.id).toBe(x.emoji);
      expect(e.parts.length, e.id).toBe(x.partsCount);
    }
  });

  it('(ה) שם של חלק פנימי = פועל במילים פשוטות (לא שם-עצם טכני כמו "חפיפה" או "מכונת סטטוס")', () => {
    const OLD_TECH = ['חפיפה', 'זמינות', 'מכונת', 'גימטריה', 'שעון השמש', 'זווית לזמן', 'פסי יומן', 'כלל בטיחות', 'מדרג', 'סבב הוגן'];
    for (const e of ENGINE_CARDS)
      for (const p of e.parts) {
        for (const w of OLD_TECH) expect(p.name.includes(w), e.id + '#' + p.num + ': ' + p.name).toBe(false);
        expect(p.computes.trim().length).toBeGreaterThan(0);
      }
  });
});
