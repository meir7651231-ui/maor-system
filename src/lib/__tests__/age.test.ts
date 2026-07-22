/**
 * חישוב גיל (ageOf) — עמידות אזור-זמן ועקביות בין שני העותקים
 * (families/lib ו-courses/lib). new Date('YYYY-MM-DD') הוא חצות UTC וסטה ביום
 * באזורי זמן מערביים; התיקון מפרש בצהריים מקומי.
 */
import { describe, expect, it } from 'vitest';
import { ageOf as ageFamilies } from '../../components/families/lib';
import { ageOf as ageCourses } from '../../components/courses/lib';

describe('ageOf — עמידות ועקביות', () => {
  it('שני העותקים מחזירים אותו גיל', () => {
    expect(ageFamilies('2010-05-05')).toBe(ageCourses('2010-05-05'));
    expect(ageFamilies('2000-01-01')).toBe(ageCourses('2000-01-01'));
  });

  it('בלתי-תלוי ברכיב השעה (חסינות אזור-זמן/שעון) — זה לב התיקון', () => {
    const base = ageFamilies('2010-05-05');
    expect(ageFamilies('2010-05-05T00:00:00')).toBe(base);
    expect(ageFamilies('2010-05-05T12:00:00')).toBe(base);
    expect(ageFamilies('2010-05-05T23:59:59')).toBe(base);
  });

  it('יום הולדת ב-1 בינואר לפני 20 שנה → גיל 20 (עבר תמיד השנה, חסין גבולות)', () => {
    const y = new Date().getFullYear();
    expect(ageFamilies(`${y - 20}-01-01`)).toBe(20);
  });

  it('נולד השנה → גיל 0 או פחות (לא שלילי מזויף)', () => {
    const y = new Date().getFullYear();
    const age = ageFamilies(`${y}-01-01`);
    expect(age).not.toBeNull();
    expect(age!).toBeGreaterThanOrEqual(0);
  });

  it('ריק/זבל → null', () => {
    expect(ageFamilies('')).toBeNull();
    expect(ageFamilies('not-a-date')).toBeNull();
    expect(ageCourses('')).toBeNull();
  });
});
