/**
 * ratchet — מצב הדגמה ▶ מודרך (P2 פער 30, מימוש הכרעה 4).
 *
 * מקור האמת: legacy-main-script.js:1105-1258 (runDemo) — הכיתובים כאן
 * מילה-במילה מכיתובי ההדמיה. הכרעה 4: סיור מודרך על מסכים אמיתיים (לא
 * אוטו-קליקר), עצירה בכל שלב. הלוגיקה טהורה — ניווט צעדים וגאומטריית
 * ה-spotlight נבדקות בלי DOM.
 */
import { describe, expect, it } from 'vitest';
import { spotlightBox, TOUR_STEPS, TOUR_STOP_LABEL, tourAdvance, tourSteps } from '../tour';

describe('▶ ratchet — תסריט הסיור לפי runDemo (script:1133-1256)', () => {
  it('כיתובי הלגאסי מילה-במילה: פתיחה, ⌘K, סגירה; כפתור העצירה מ-markup:2956', () => {
    expect(TOUR_STEPS[0].caption).toBe('👋 הדמיה מלאה — המערכת מדגימה את עצמה, על הנתונים האמיתיים');
    expect(TOUR_STEPS.map((s) => s.caption)).toContain('⌘K — חיפוש חכם מכל מקום');
    expect(TOUR_STEPS.map((s) => s.caption)).toContain('ניקוב נוכחות — היתרה יורדת + 5 נק׳ אמינות');
    expect(TOUR_STEPS.map((s) => s.caption)).toContain('רישום חיסור — עם כלל 48 השעות');
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].caption).toBe('זו המערכת. חיה, מלאה, במקום אחד ✦');
    expect(TOUR_STOP_LABEL).toBe('■ עצירת הדמיה (Esc)');
  });

  it('סדר הפרקים: תסריט הלגאסי + העמודות החדשות לפני ההגדרות (CONNECT חיבור 5)', () => {
    const views = TOUR_STEPS.map((s) => s.view);
    const order = views.filter((v, i) => i === 0 || v !== views[i - 1]);
    expect(order).toEqual(['home', 'families', 'courses', 'calendar', 'tzedaka', 'shop', 'settings', 'home']);
  });

  it('סינון מודולים: מודול כבוי מוריד את צעדיו; בית/הגדרות תמיד נשארים', () => {
    expect(tourSteps(() => true)).toHaveLength(TOUR_STEPS.length);
    const noFam = tourSteps((m) => m !== 'families');
    expect(noFam.some((s) => s.view === 'families')).toBe(false);
    const none = tourSteps(() => false);
    expect(none.every((s) => s.view === 'home' || s.view === 'settings')).toBe(true);
    expect(none.length).toBeGreaterThan(0);
  });

  it('tourAdvance: אחורה מ-0 נצמד ל-0; קדימה מהסוף = null (סיום); רגיל = הזזה', () => {
    expect(tourAdvance(0, -1, 5)).toBe(0);
    expect(tourAdvance(4, 1, 5)).toBeNull();
    expect(tourAdvance(2, 1, 5)).toBe(3);
    expect(tourAdvance(2, -1, 5)).toBe(1);
  });

  it('spotlightBox: ריפוד 10, הצמדה לגבולות המסך, rect ריק = null', () => {
    expect(spotlightBox(null, 1000, 800)).toBeNull();
    expect(spotlightBox({ left: 5, top: 5, width: 0, height: 20 }, 1000, 800)).toBeNull();
    // אלמנט באמצע — ריפוד מלא סביבו
    expect(spotlightBox({ left: 100, top: 100, width: 50, height: 20 }, 1000, 800)).toEqual({
      left: 90,
      top: 90,
      width: 70,
      height: 40,
    });
    // אלמנט צמוד לפינה — לא חורגים משמאל/מלמעלה ולא מהרוחב
    const clamped = spotlightBox({ left: 2, top: 2, width: 996, height: 20 }, 1000, 800);
    expect(clamped).toEqual({ left: 0, top: 0, width: 1000, height: 40 });
  });
});
