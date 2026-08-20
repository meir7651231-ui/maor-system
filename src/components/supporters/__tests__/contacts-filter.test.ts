/**
 * 📞 פילטר יעדי-הקשר במסך התורמים (קוהרנטיות ווידג'ט↔יעד, 20.8.2026).
 *
 * הרקע: ווידג'ט "יעדי קשר" בבית מציג רק 6 שורות + "+N נוספים" שהיה טקסט מת —
 * לא היה בכל המערכת מקום שמציג את *הרשימה המסוננת המלאה* של יעדי-הקשר שהגיעו.
 * נבנה: פילטר "📞 יעד שהגיע" במסך-התורמים (אותה סמנטיקה כמו dueContacts בבית:
 * sp.nextDate <= today) + קישור-עומק מהווידג'ט (supListReq, דפוס supOpenReq).
 *
 * הבדיקות הן הגנות-מקור (?raw) — נפילה כאן = החיווט נותק.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import widgetsSrc from '../../home/widgets.tsx?raw';
import storeSrc from '../../../store/useApp.ts?raw';

describe('פילטר 📞 יעדי-קשר — הגנות-מקור', () => {
  it('ה-store מציע את בקשת-הסינון (supListReq) והיא מנווטת לתורמים', () => {
    expect(storeSrc).toContain("supListReq: 'contacts' | null");
    expect(storeSrc).toMatch(/openSupportersFiltered: \(f\) => set\(\{ view: 'supporters', supListReq: f \}\)/);
  });

  it('מסך-התורמים מסנן באותה סמנטיקה כמו הווידג\'ט (nextDate <= today)', () => {
    expect(viewSrc).toContain('if (nextF && !(sp.nextDate && sp.nextDate <= today)) return false;');
    // הצ'יפ מציג את אותו מונה כמו הבאדג' בבית
    expect(viewSrc).toContain("'📞 יעד שהגיע · ' + dueCount");
    expect(viewSrc).toContain('const dueCount = visibleBase.filter((sp) => sp.nextDate && sp.nextDate <= today).length');
  });

  it('הבקשה מהבית מדליקה את הפילטר ופותחת את פאנל-הסינון', () => {
    expect(viewSrc).toMatch(/supListReq === 'contacts'[\s\S]{0,120}setNextF\(true\);[\s\S]{0,60}setAdvOpen\(true\)/);
  });

  it('הווידג\'ט בבית מקשר "+N נוספים" לרשימה המלאה — לא טקסט מת', () => {
    expect(widgetsSrc).toContain("openSupportersFiltered('contacts')");
    expect(widgetsSrc).toContain('יעדי קשר נוספים — לרשימה המלאה');
  });

  it('מלאי-כרטיסיות והצעות-מקדימות מרחיבים במקום ("הצגת הכל") — לא שורה מתה', () => {
    expect(widgetsSrc).toContain('כרטיסיות נוספות — הצגת הכל');
    expect(widgetsSrc).toContain('הצעות נוספות — הצגת הכל');
  });
});
