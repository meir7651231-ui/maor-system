/**
 * 🗓 ratchet — חותמות-הסכמה (ביקורת-האמון 24.8, לולאת-האמון 7).
 *
 * הבאג: הסכמות-המדיה היו בוליאנים עירומים — אי-אפשר היה לענות "מאיזה תאריך
 * יש הסכמת-צילום", דרישת-יסוד בניהול-הסכמות. התיקון (additive):
 * Member.mConsentAt — מפת הסכמה⇒תאריך; הדלקת-צ'יפ בטופס חותמת isoToday,
 * כיבוי מסיר; כרטיס-המשפחה מציג "(מ-YYYY-MM-DD)". רשומה ישנה בלי השדה
 * נטענת כרגיל — אפס-מיגרציה.
 */
import { describe, expect, it } from 'vitest';
import domainSrc from '../../../types/domain.ts?raw';
import formSrc from '../MemberForm.tsx?raw';
import detailSrc from '../FamilyDetail.tsx?raw';

describe('🗓 consent-stamp — תאריך על כל הסכמה', () => {
  it('השדה additive על Member', () => {
    expect(domainSrc).toContain("mConsentAt?: Partial<Record<'mSefach' | 'mInvite' | 'mRecommend' | 'mPhotos' | 'mVideos', IsoDate>>");
  });
  it('הדלקת-צ׳יפ חותמת תאריך; כיבוי מסיר', () => {
    expect(formSrc).toContain('if (on) nextAt[mc.key] = isoToday()');
    expect(formSrc).toContain('else delete nextAt[mc.key]');
  });
  it('החותמות נשמרות על הרשומה ומוצגות בכרטיס', () => {
    expect(formSrc).toContain('{ mConsentAt: f.mConsentAt }');
    expect(detailSrc).toContain("' (מ-' + at.slice(0, 10) + ')'");
  });
});
