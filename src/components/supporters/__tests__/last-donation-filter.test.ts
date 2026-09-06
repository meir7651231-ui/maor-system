/**
 * ratchet — סינון "🕐 תרומה אחרונה" (בקשת-בעלים 6.9 "תבדוק למה נעלם הסינון של תרומה אחרונה"):
 * הבורר "תרומה אחרונה בתקופה" הופיע **רק** אחרי בחירת שנה/חודש — בלי תקופה לא היה קיים
 * ⇒ "נעלם". ובתצוגת-גריד לא היו כותרות-טבלה ⇒ אי-אפשר היה למיין לפי תרומה אחרונה.
 * עכשיו: בורר-דליים עצמאי תמיד-גלוי (supLastInBucket, היום מוזרק) + בורר-מיון בגריד.
 */
import { describe, expect, it } from 'vitest';
import { LAST_BUCKETS, supLastInBucket } from '../lib';
import type { Supporter } from '../../../types/domain';
import viewSrc from '../SupportersView.tsx?raw';

const TODAY = '2026-09-06';
const sp = (last: string, hist: { d: string }[] = []): Supporter =>
  ({ id: 'x', name: 'א', last, hist, donations: [], count: 0, ils: 0, usd: 0 }) as unknown as Supporter;

describe('supLastInBucket — דליי-זמן מהיום', () => {
  it('null = הכול; never = בלי תרומה בלבד', () => {
    expect(supLastInBucket(sp(''), TODAY, null)).toBe(true);
    expect(supLastInBucket(sp(''), TODAY, 'never')).toBe(true);
    expect(supLastInBucket(sp('2026-09-01'), TODAY, 'never')).toBe(false);
    expect(supLastInBucket(sp(''), TODAY, 'm12')).toBe(false);
  });
  it('30/91/182/365 ימים — גבולות כוללים; over12 = מעל 365', () => {
    expect(supLastInBucket(sp('2026-08-07'), TODAY, 'm1')).toBe(true); // 30
    expect(supLastInBucket(sp('2026-08-06'), TODAY, 'm1')).toBe(false); // 31
    expect(supLastInBucket(sp('2026-08-06'), TODAY, 'm3')).toBe(true);
    expect(supLastInBucket(sp('2026-03-10'), TODAY, 'm6')).toBe(true); // 180
    expect(supLastInBucket(sp('2025-09-06'), TODAY, 'm12')).toBe(true); // 365
    expect(supLastInBucket(sp('2025-09-05'), TODAY, 'm12')).toBe(false); // 366
    expect(supLastInBucket(sp('2025-09-05'), TODAY, 'over12')).toBe(true);
    expect(supLastInBucket(sp('2025-09-06'), TODAY, 'over12')).toBe(false);
  });
  it('ההיסטוריה (hist) נספרת — supLast = המאוחר מבין קבלות+היסטוריה; תאריך עתידי = 0 ימים', () => {
    expect(supLastInBucket(sp('2024-01-01', [{ d: '2026-09-01' }]), TODAY, 'm1')).toBe(true);
    expect(supLastInBucket(sp('2026-12-01'), TODAY, 'm1')).toBe(true);
  });
  it('שישה דליים, מפתחות ייחודיים', () => {
    expect(LAST_BUCKETS.map((b) => b.key)).toEqual(['m1', 'm3', 'm6', 'm12', 'over12', 'never']);
  });
});

describe('הגנת-מקור — הבורר תמיד-גלוי, מסנן, מנוקה ב"נקה הכל", ומיון בגריד', () => {
  it('הבורר "תרומה אחרונה" לא מגודר בבחירת-תקופה', () => {
    expect(viewSrc).toContain('ariaLabel="תרומה אחרונה"');
    // הבורר יושב לפני הגידור (monthF || gaveYearF) של בורר-התקופה
    expect(viewSrc.indexOf('ariaLabel="תרומה אחרונה"')).toBeLessThan(viewSrc.indexOf('{(monthF || gaveYearF) && ('));
    expect(viewSrc).toContain('if (lastF && !supLastInBucket(sp, today, lastF)) return false;');
    expect(viewSrc).toContain("|| !!segF || !!lastF ||");
    expect(viewSrc).toContain('setLastF(null);\n    setMonthF(null);');
    expect(viewSrc).toContain("clear: () => setLastF(null)");
  });
  it('בגריד יש בורר-מיון עם תרומה אחרונה', () => {
    expect(viewSrc).toContain("{supView === 'grid' && sortOn && (");
    expect(viewSrc).toContain('ariaLabel="מיון"');
    expect(viewSrc).toContain("['name', 'count', 'ils', 'usd', 'last', 'nextDate', 'score'].includes(h.key)");
  });
});
