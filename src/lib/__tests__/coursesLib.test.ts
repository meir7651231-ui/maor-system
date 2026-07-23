/**
 * עזרי מודול הקורסים — ולידציית טווח תאריכים, ותוויות מסלול/מחיר עקביות
 * (planWord/priceSuffix/modelMeta) לכל ארבעת סוגי המסלול.
 */
import { describe, expect, it } from 'vitest';
import { courseDateError, planWord, priceSuffix, modelMeta } from '../../components/courses/lib';
import type { Course, PricingModel } from '../../types/domain';

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
