/**
 * ratchet — איחוד מדיניות פעולות-הרסניות (בקשת-בעלים 23.8: "מנהל תמיד · הדלקה-פר-עובד").
 * מחיקת-משפחה ומחיקת-חוג היו גלויות לכל עובד/ת; עכשיו דרך canGrantedAction (מנהל/בעלים
 * תמיד; עובד/ת רק אם הודלק/ה). featureOn נשמר כ-AND ⇒ מכבד כיבוי-ארגוני קיים (אפס-רגרסיה).
 */
import { describe, expect, it } from 'vitest';
import famSrc from '../families/FamilyDetail.tsx?raw';
import crsSrc from '../courses/CourseDetail.tsx?raw';
import supSrc from '../supporters/SupporterDetail.tsx?raw';

describe('🔒 ratchet — מחיקות-ישויות דרך canGrantedAction (מנהל/הדלקה-פר-עובד)', () => {
  it('FamilyDetail: מחיקת-משפחה מגודרת canGrantedAction + featureOn', () => {
    expect(famSrc).toContain("canGrantedAction(config, cloudEmail, isOrgMgr, 'families.delete')");
    expect(famSrc).toContain("featureOn(config, 'families.delete') && canGrantedAction");
    expect(famSrc).toContain('{canDeleteFamily && (');
  });

  it('CourseDetail: מחיקת-חוג מגודרת canGrantedAction + featureOn (נשמר) + !מורה', () => {
    expect(crsSrc).toContain("featureOn(cfg, 'courses.delete') && canGrantedAction(cfg, userEmail, isOrgMgr, 'courses.delete')");
    expect(crsSrc).toContain('{!isTeacherUser && canDeleteCourse && (');
  });

  it('SupporterDetail: מחיקת-תורם מגודרת canGrantedAction + featureOn', () => {
    expect(supSrc).toContain("featureOn(config, 'supporters.delete') && canGrantedAction(config, cloud.user?.email, !!cloud.isManager, 'supporters.delete')");
    expect(supSrc).toContain('{canDeleteSupporter && (');
  });
});
