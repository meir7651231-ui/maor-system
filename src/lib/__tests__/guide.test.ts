/**
 * ratchet — המדריך המהיר 📖 (P2 פער 29).
 *
 * מקור האמת: legacy-markup.html:2891-2913 (showGuide) — התוכן חייב להישאר
 * מילה-במילה מהקובץ החי: קופסת "לפני הכל", שבע שורות המסכים,
 * "המתכונים המהירים" והערת הסיום. הבדיקות משוות מול הנוסח הנעול.
 */
import { describe, expect, it } from 'vitest';
import {
  GUIDE_FOOT,
  GUIDE_INTRO,
  GUIDE_INTRO_LABEL,
  GUIDE_RECIPES,
  GUIDE_RECIPES_LABEL,
  GUIDE_SECTIONS,
  guideSections,
} from '../guide';

describe('📖 ratchet — תוכן המדריך מילה-במילה מהלגאסי (markup:2891-2913)', () => {
  it('קופסת "לפני הכל" (legacy:2897-2899)', () => {
    expect(GUIDE_INTRO_LABEL).toBe('לפני הכל:');
    expect(GUIDE_INTRO).toBe(
      'אי אפשר לקלקל — הכל נשמר לבד · ↩ חזרה מחזיר אחורה · Esc סוגר כל חלון · ' +
        'אבודים? ⌕ חיפוש מוצא הכל (גם עם שגיאות כתיב) · ▶ הדמיה מראה את המערכת לבד.',
    );
  });

  it('שבע שורות המסכים בסדר הלגאסי (legacy:2900-2908)', () => {
    expect(GUIDE_SECTIONS.map((s) => s.title)).toEqual([
      'בית',
      'משפחות',
      'כרטיס משפחה',
      'קורסים',
      'תומכות',
      'לוח שנה',
      'הגדרות',
    ]);
    expect(GUIDE_SECTIONS[1].text).toBe(
      'הטבלה: לחיצה על כותרת ממיינת, ⏷ מסנן כל עמודה, ✦ סינון מורחב עם גלגל.',
    );
    expect(GUIDE_SECTIONS[2].text).toBe('ניקוב ✓, חיסור ✕, ⚙ לתשלומים וקבלות, 📜 היסטוריה + דוח מלא.');
    expect(GUIDE_SECTIONS[6].text).toBe('ייצוא לאקסל, דוחות, מורות, וגיבוי מלא (פעם בשבוע!).');
  });

  it('"המתכונים המהירים" — הנוסח המלא (legacy:2909-2912)', () => {
    expect(GUIDE_RECIPES_LABEL).toBe('המתכונים המהירים:');
    expect(GUIDE_RECIPES).toBe(
      'תשלום + קבלה ← ⚙ ליד השיבוץ ← 💳 ← ＋ קבלת תשלום · ניקוב ← כפתור "ניקוב" בכרטיס · ' +
        'משפחה חדשה תוך כדי שיבוץ ← "לא נמצא/ה במערכת?" · חוג מתאים לילד ← ✦ מצא חוג · ' +
        'תרומה ← תומכות ← לחיצה על השם ← ＋ תרומה · רשימה למורה ← החוג ← ⬇ תדפיס למורה · ' +
        'גיבוי ← הגדרות ← גיבוי מלא.',
    );
    expect(GUIDE_FOOT).toBe('המדריך המלא והמפורט נמצא בקובץ "מדריך למשתמש" — מסך-מסך וכפתור-כפתור.');
  });

  it('סינון לפי מודולים: מודול כבוי מסתיר את שורתו; בית והגדרות תמיד נשארים', () => {
    const all = guideSections(() => true);
    expect(all).toHaveLength(7);
    const noCourses = guideSections((m) => m !== 'courses');
    expect(noCourses.map((s) => s.title)).not.toContain('קורסים');
    expect(noCourses).toHaveLength(6);
    const none = guideSections(() => false);
    expect(none.map((s) => s.title)).toEqual(['בית', 'הגדרות']);
  });
});
