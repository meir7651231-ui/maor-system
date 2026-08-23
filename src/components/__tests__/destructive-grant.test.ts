/**
 * ratchet — איחוד מדיניות פעולות-הרסניות (בקשת-בעלים 23.8: "מנהל תמיד · הדלקה-פר-עובד").
 * מחיקת-משפחה ומחיקת-חוג היו גלויות לכל עובד/ת; עכשיו דרך canGrantedAction (מנהל/בעלים
 * תמיד; עובד/ת רק אם הודלק/ה). featureOn נשמר כ-AND ⇒ מכבד כיבוי-ארגוני קיים (אפס-רגרסיה).
 */
import { describe, expect, it } from 'vitest';
import famSrc from '../families/FamilyDetail.tsx?raw';
import crsSrc from '../courses/CourseDetail.tsx?raw';
import supSrc from '../supporters/SupporterDetail.tsx?raw';
import teachersSrc from '../settings/TeachersSection.tsx?raw';
import catalogSrc from '../shop/CatalogTab.tsx?raw';
import itemsSrc from '../shop/ItemsPanel.tsx?raw';
import storesSrc from '../shop/StoresPanel.tsx?raw';
import criteriaSrc from '../shop/CriteriaPanel.tsx?raw';
import coordSrc from '../tzedaka/CoordinatorCard.tsx?raw';

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

// ── השלמת-הסחיפה (בקשת-בעלים 23.8 "פרוס + המשך לכולם"): מורה · חנות · קופה · הקמה-מהירה ──
describe('🔒 ratchet — השלמת מדיניות הפעולות-ההרסניות (מורים/חנות/קופות/סמסטר)', () => {
  it('TeachersSection: מחיקת-מורה מגודרת canGrantedAction + featureOn', () => {
    expect(teachersSrc).toContain("featureOn(config, 'settings.teachers.delete')");
    expect(teachersSrc).toContain("canGrantedAction(config, cloudEmail, isOrgMgr, 'settings.teachers.delete')");
    expect(teachersSrc).toContain('{canDeleteTeacher && (');
  });

  it('CatalogTab: מחיקת-מוצר מגודרת shop.delete דרך canGrantedAction', () => {
    expect(catalogSrc).toContain("featureOn(config, 'shop.delete') && canGrantedAction(config, cloudEmail, isOrgMgr, 'shop.delete')");
    expect(catalogSrc).toContain('{canDeleteShop && (');
  });

  it('ItemsPanel: מחיקת-פריט מגודרת shop.delete', () => {
    expect(itemsSrc).toContain("featureOn(config, 'shop.delete') && canGrantedAction(config, cloudEmail, isOrgMgr, 'shop.delete')");
    expect(itemsSrc).toContain('{canDeleteShop && (');
  });

  it('StoresPanel: מחיקת-חנות מגודרת shop.delete', () => {
    expect(storesSrc).toContain("featureOn(config, 'shop.delete') && canGrantedAction(config, cloudEmail, isOrgMgr, 'shop.delete')");
    expect(storesSrc).toContain('{canDeleteShop && (');
  });

  it('CriteriaPanel: מחיקת-קריטריון מגודרת shop.delete', () => {
    expect(criteriaSrc).toContain("featureOn(config, 'shop.delete') && canGrantedAction(config, cloudEmail, isOrgMgr, 'shop.delete')");
    expect(criteriaSrc).toContain('{canDeleteShop && (');
  });

  it('CoordinatorCard: מחיקת-קופה מגודרת tzedaka.delete', () => {
    expect(coordSrc).toContain("featureOn(config, 'tzedaka.delete') && canGrantedAction(config, cloudEmail, isOrgMgr, 'tzedaka.delete')");
    expect(coordSrc).toContain('{canDeleteBox && (');
  });

  it('CourseDetail: הקמה-מהירה (שכפול/סיום-סמסטר) מגודרת courses.bulkadmin דרך canGrantedAction', () => {
    expect(crsSrc).toContain("featureOn(cfg, 'courses.bulkadmin') && canGrantedAction(cfg, userEmail, isOrgMgr, 'courses.bulkadmin')");
    expect(crsSrc).toContain('{!isTeacherUser && canBulkAdmin && (');
    // אינווריאנט: אין יותר קריאה גולמית featureOn(courses.bulkadmin) ללא-canGrantedAction על הכפתורים
    expect(crsSrc).not.toContain("!isTeacherUser && featureOn(cfg, 'courses.bulkadmin')");
  });
});
