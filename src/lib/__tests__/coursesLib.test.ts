/**
 * עזרי מודול הקורסים — ולידציית טווח תאריכים, ותוויות מסלול/מחיר עקביות
 * (planWord/priceSuffix/modelMeta) לכל ארבעת סוגי המסלול.
 */
import { describe, expect, it } from 'vitest';
import { courseDateError, planWord, priceSuffix, modelMeta, enrollCount } from '../../components/courses/lib';
import { emptyDb } from '../../types/domain';
import type { Course, Db, Enrollment, PricingModel } from '../../types/domain';

function enr(id: string, courseId: string, status: Enrollment['status']): Enrollment {
  return {
    id, memberId: 'm', courseId, plan: 'monthly', status, enrolledAt: '2026-01-01', group: '',
    totalDue: 0, purchased: 0, used: 0, payments: [], absences: [], dueDate: '', note: '',
  };
}

describe('courseDateError', () => {
  it('סוף מוקדם מהתחלה → שגיאה (החוג היה נעלם מהלוח)', () => {
    expect(courseDateError('2026-09-01', '2026-06-01')).toContain('מוקדם');
  });
  it('סוף אחרי/שווה להתחלה → תקין', () => {
    expect(courseDateError('2026-01-01', '2026-12-31')).toBeNull();
    expect(courseDateError('2026-05-05', '2026-05-05')).toBeNull();
  });
  it('טווח פתוח (חסר תאריך) → תקין', () => {
    expect(courseDateError('', '2026-01-01')).toBeNull();
    expect(courseDateError('2026-01-01', '')).toBeNull();
    expect(courseDateError('', '')).toBeNull();
  });
});

describe('planWord / priceSuffix — כל ארבעת המסלולים', () => {
  const cases: [PricingModel, string, string][] = [
    ['monthly', 'מנוי חודשי', 'לחודש'],
    ['half_year', 'מנוי חצי-שנתי', 'לחצי שנה'],
    ['year', 'מנוי שנתי', 'לשנה'],
    ['punch', 'כרטיסייה', ''],
  ];
  for (const [model, word, suffix] of cases) {
    it(`${model} → "${word}" · סיומת "${suffix}"`, () => {
      expect(planWord(model)).toBe(word);
      expect(priceSuffix(model)).toBe(suffix);
    });
  }
});

describe('enrollCount — תפוסה (פעיל+מוקפא, ללא שהסתיים)', () => {
  const db = (...st: Enrollment['status'][]): Db => ({
    ...emptyDb(),
    enrollments: st.map((s, i) => enr('e' + i, 'c1', s)),
  });
  it('סופר פעילים ומוקפאים', () => {
    expect(enrollCount(db('active', 'paused', 'active'), 'c1')).toBe(3);
  });
  it('לא סופר שהסתיים (המקום פנוי)', () => {
    expect(enrollCount(db('active', 'ended', 'ended'), 'c1')).toBe(1);
  });
  it('חוג עם בוגרים בלבד → תפוסה 0 (לא "מלא" מזויף)', () => {
    expect(enrollCount(db('ended', 'ended', 'ended'), 'c1')).toBe(0);
  });
});

describe('modelMeta — תווית מלאה', () => {
  const mk = (model: PricingModel, size = 0) => ({ model, size, price: 100 }) as unknown as Course;
  it('כרטיסייה כוללת מספר ניקובים', () => {
    expect(modelMeta(mk('punch', 10)).label).toContain('10');
  });
  it('חצי-שנתי/שנתי אינם "חודשי"', () => {
    expect(modelMeta(mk('half_year')).label).toContain('חצי-שנתי');
    expect(modelMeta(mk('year')).label).toContain('שנתי');
    expect(modelMeta(mk('half_year')).label).not.toBe('מנוי חודשי');
  });
});
