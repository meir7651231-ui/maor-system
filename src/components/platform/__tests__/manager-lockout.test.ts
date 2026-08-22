/**
 * ratchet · מנהל-לעולם-לא-ננעל-בחוץ (21.8.2026 — דיווח-בעלים חי:
 * "למה המנהל של הארגון נשאר תקוע בחוץ" על ?org=mavr-hchsd).
 *
 * הבאג המשולש:
 * 1. שער-החברות ב-useApp בחן רק את members — מנהל (org.manager) שנשמט מהרשימה
 *    (דריסת-מערך ישנה לפני תיקון-arrayUnion, או טעות-הקלדה במינוי) נתקע במסך-
 *    ההמתנה למרות שהוא המנהל-הרשום.
 * 2. ב-Rules, get על platformOrgs דרש orgMember ⇒ מנהל-שנשמט לא יכול היה אפילו
 *    לקרוא את מסמך-הארגון כדי שהקליינט יזהה שהוא המנהל.
 * 3. בלוח-הבקרה לא היה שום כלי לצפות/לתקן manager/members אחרי ההקמה — לבעלים
 *    לא הייתה דרך-החלמה בכלל.
 */
import { describe, it, expect } from 'vitest';
import storeSrc from '../../../store/useApp.ts?raw';
import panelSrc from '../PlatformPanel.tsx?raw';
import rulesSrc from '../../../../firestore.rules?raw';

describe('🔒 ratchet — מנהל-הארגון לעולם לא נתקע מחוץ לארגון שלו', () => {
  it('שער-החברות: orgIsManager נספר כחבר (לא רק members)', () => {
    // member = superAdmin || orgIsManager || members.some(...)
    expect(storeSrc).toMatch(/const member =[\s\S]{0,120}orgIsManager[\s\S]{0,160}orgDoc\?\.members\?\.some/);
  });

  it('Rules: get על platformOrgs מתיר גם את manager של המסמך (resource.data ישיר)', () => {
    expect(rulesSrc).toMatch(/allow get:[\s\S]{0,240}email\.lower\(\) == resource\.data\.get\('manager', ''\)/);
  });

  it('לוח-הבקרה: כלי-תיקון חברות — עדכון-מנהל (manager+addOrgMember), הוספה והסרה אטומיות', () => {
    expect(panelSrc).toContain('👥 מי נכנס לארגון');
    // עדכון-מנהל כותב את שדה-manager וגם מוסיף אותו ל-members (אטומי)
    expect(panelSrc).toMatch(/writeOrgCloudDoc\(sel, \{ manager: m \}\);[\s\S]{0,80}addOrgMember\(sel, m\)/);
    expect(panelSrc).toContain('async function addMember()');
    // הסרה — דו-שלבית (confirmTwice) ואטומית (removeOrgMember)
    expect(panelSrc).toMatch(/confirmTwice\('rmm-'[\s\S]{0,200}removeOrgMember\(sel, m\)/);
  });
});
