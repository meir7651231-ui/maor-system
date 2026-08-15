/**
 * ratchet — תמחור משוקלל פר-שיעור (בקשת-בעלים 13.8 ב'): "מסלול תמחור פר שיעור,
 * ולקוח שנרשם בוחר כמה פעמים בשבוע/חודש → תשלום משוקלל חד-פעמי/שבועי/דו-שבועי/
 * חודשי/מספר-חודשים/חצי-שנתי/שנתי; וגם הנחות הלקוח".
 * הנעילה: מנוע טהור weightedQuote/lessonsInTerm — מחיר-לשיעור (אחרי הנחה) ×
 * מספר-שיעורים-בתקופה.
 */
import { describe, expect, it } from 'vitest';
import type { Course } from '../../../types/domain';
import { WEEKS_PER_MONTH, enrollmentQuote, lessonPriceForTier, lessonsInTerm, weightedQuote } from '../lib';

const course = (over: Partial<Course> = {}): Course =>
  ({
    id: 'c1', name: 'ציור', teacherId: '', roomId: '', description: '',
    price: 0, price1: 0, price2: 0, price1Name: 'אחים', price2Name: 'מלגה',
    model: 'monthly', size: 0, start: '', end: '', weekday: 0, time: '', maxStudents: 0,
    gender: 'all', ageMin: 0, ageMax: 0, cat: '', semester: '', sector: '', sessions: [], notes: '',
    perLesson: true, lessonPrice: 50, lessonPrice1: 40, lessonPrice2: 30,
    ...over,
  }) as Course;

describe('lessonsInTerm — מספר שיעורים בתקופה', () => {
  it('פעם בשבוע: שבועי=1 · דו-שבועי=2 · חד-פעמי=1', () => {
    expect(lessonsInTerm(1, 'week', 'weekly')).toBe(1);
    expect(lessonsInTerm(1, 'week', 'biweekly')).toBe(2);
    expect(lessonsInTerm(1, 'week', 'once')).toBe(1);
  });

  it('פעמיים בשבוע → חודשי ≈ 8.67, שנתי ≈ 104', () => {
    expect(lessonsInTerm(2, 'week', 'monthly')).toBeCloseTo(2 * WEEKS_PER_MONTH, 5);
    expect(lessonsInTerm(2, 'week', 'year')).toBeCloseTo(2 * WEEKS_PER_MONTH * 12, 5);
  });

  it('תדירות פר-חודש: 4 בחודש → חודשי=4 · 3 חודשים=12 · חצי-שנתי=24', () => {
    expect(lessonsInTerm(4, 'month', 'monthly')).toBe(4);
    expect(lessonsInTerm(4, 'month', 'months', 3)).toBe(12);
    expect(lessonsInTerm(4, 'month', 'half_year')).toBe(24);
  });

  it('קלט פגום (NaN/שלילי) → 0 שיעורים, לא קורס', () => {
    expect(lessonsInTerm(NaN, 'week', 'monthly')).toBe(0);
    expect(lessonsInTerm(-3, 'week', 'weekly')).toBe(0);
  });
});

describe('lessonPriceForTier — הנחת הלקוח', () => {
  it('מלא/הנחה-1/הנחה-2', () => {
    const c = course();
    expect(lessonPriceForTier(c, '')).toBe(50);
    expect(lessonPriceForTier(c, '1')).toBe(40);
    expect(lessonPriceForTier(c, '2')).toBe(30);
  });
  it('רמת-הנחה בלי מחיר → נופל למחיר המלא', () => {
    const c = course({ lessonPrice2: 0 });
    expect(lessonPriceForTier(c, '2')).toBe(50);
  });
});

describe('weightedQuote — הסכום המשוקלל הסופי', () => {
  it('פעמיים בשבוע · חודשי · מלא → ₪433', () => {
    const q = weightedQuote(course(), { freq: 2, unit: 'week', term: 'monthly', tier: '' });
    expect(q.total).toBe(Math.round(2 * WEEKS_PER_MONTH * 50)); // 433
    expect(q.perLesson).toBe(50);
  });

  it('הנחת-הלקוח נכנסת: פעמיים בשבוע · חודשי · הנחה-1 (₪40) → ₪347', () => {
    const q = weightedQuote(course(), { freq: 2, unit: 'week', term: 'monthly', tier: '1' });
    expect(q.total).toBe(Math.round(2 * WEEKS_PER_MONTH * 40)); // 347
  });

  it('פעם בשבוע · שנתי · מלא → 52 שיעורים × ₪50 = ₪2600', () => {
    const q = weightedQuote(course(), { freq: 1, unit: 'week', term: 'year', tier: '' });
    expect(q.total).toBe(2600);
    expect(q.lessons).toBe(52);
  });

  it('חד-פעמי = שיעור בודד במחיר-לשיעור', () => {
    const q = weightedQuote(course(), { freq: 3, unit: 'week', term: 'once', tier: '2' });
    expect(q.total).toBe(30);
    expect(q.lessons).toBe(1);
  });
});

describe('enrollmentQuote — משדות-שיבוץ שמורים', () => {
  it('חוג פר-שיעור עם תדירות → ציטוט; חוג-שטוח או חסר תדירות → null', () => {
    const c = course();
    expect(enrollmentQuote(c, { freq: 1, freqUnit: 'week', term: 'weekly', tier: '' })?.total).toBe(50);
    expect(enrollmentQuote(course({ perLesson: false }), { freq: 1, freqUnit: 'week', term: 'weekly' })).toBeNull();
    expect(enrollmentQuote(c, { freq: undefined, freqUnit: 'week', term: 'weekly' })).toBeNull();
  });
});
