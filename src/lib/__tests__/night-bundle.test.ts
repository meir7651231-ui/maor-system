/**
 * ratchet — צרור-הלילה (ROADMAP-100 ‏#1 מייל-קבלות · #3 תזכורות · #9 גיבוי-לילי):
 * ההרחבה mail בטקסונומיה הכנה, החיווט מגודר, והשרת משקף את סכמת-הלקוח.
 */
import { describe, expect, it } from 'vitest';
import { INTEGRATION_KEYS, INTEGRATION_SETTING_KEYS } from '../../types/config';
import { ENTITY_COLLECTIONS } from '../cloud-diff';
import { INTEGRATION_LABELS, INTEGRATION_STATUS } from '../../components/builder/handoff';
import donationModalSrc from '../../components/supporters/DonationModal.tsx?raw';
import supporterDetailSrc from '../../components/supporters/SupporterDetail.tsx?raw';
import cloudSrc from '../cloud.ts?raw';
import functionsSrc from '../../../functions/index.js?raw';

describe('🌙 ratchet — צרור-הלילה (#1/#3/#9)', () => {
  it('ההרחבה mail: ב-allowlist, עם תווית, ו-roadmap בטקסונומיית-הכנות (דורשת שרת ⇒ לא-נמכרת באשף)', () => {
    expect(INTEGRATION_KEYS).toContain('mail');
    expect(INTEGRATION_LABELS.mail).toBeTruthy();
    expect(INTEGRATION_STATUS.mail).toBe('roadmap');
  });

  it('יעדי-התקציר עוברים חיטוב-קונפיג: sms.adminPhone + mail.digestTo ב-INTEGRATION_SETTING_KEYS', () => {
    expect(INTEGRATION_SETTING_KEYS.sms).toContain('adminPhone');
    expect(INTEGRATION_SETTING_KEYS.mail).toContain('digestTo');
  });

  it('🛡 הגנת-מקור: מייל-הקבלה האוטומטי מגודר integrationOn(mail) + ענן-מחובר, וכשל-רך', () => {
    // הבאג-שנמנע: שליחה בלי גידור הייתה יורה לכל לקוח; וכשל בתור אסור שיפיל רישום-תרומה
    expect(donationModalSrc).toContain("integrationOn(cfg, 'mail')");
    expect(donationModalSrc).toMatch(/integrationOn\(cfg, 'mail'\) && st\.cloud\.enabled && !!st\.cloud\.user/);
    expect(donationModalSrc).toMatch(/writeMailOutbox[\s\S]{0,300}\.catch\(/);
  });

  it('🛡 הגנת-מקור: כפתור-המייל בכרטיס-התומך מגודר mailReady (הרחבה+ענן+כתובת)', () => {
    expect(supporterDetailSrc).toContain("integrationOn(config, 'mail') && cloudReady && !!sp.email");
  });

  it('writeMailOutbox כותב לתור בתחום-הארגון (scopedCol) עם status pending בלבד', () => {
    expect(cloudSrc).toMatch(/writeMailOutbox[\s\S]{0,300}scopedCol\('mailOutbox'\)/);
    expect(cloudSrc).toMatch(/writeMailOutbox[\s\S]{0,400}status: 'pending'/);
  });

  it('🛡 השרת משקף את הלקוח: BACKUP_COLLECTIONS בגיבוי-הלילי מכיל את כל 21 אוספי-הישויות', () => {
    // סחף-סכמה: אוסף חדש ב-ENTITY_COLLECTIONS בלי עדכון הגיבוי = צילום-לילה חסר
    for (const col of ENTITY_COLLECTIONS) {
      expect(functionsSrc, 'אוסף ' + col + ' חסר ב-BACKUP_COLLECTIONS של backupNightly').toMatch(new RegExp("'" + col + "'"));
    }
    expect(functionsSrc).toContain('BACKUP_KEEP = 30');
  });

  it("🛡 מסלול-B בגיבוי: 'donations' (האוסף-הנפרד, מוחרג-במכוון מ-ENTITY_COLLECTIONS) מגובה דרך EXTRA_BACKUP", () => {
    // 🐛 (21.8): גיבוי-לילה של ארגון-donationSplit יצא בלי תרומות/קבלות — שחזור
    // היה מאבד אותן בשקט. BACKUP_COLLECTIONS נשאר ≡ (הבדיקה למעלה); התוספת נפרדת.
    expect(functionsSrc).toMatch(/EXTRA_BACKUP = \['donations'\]/);
    expect(functionsSrc).toContain('[...BACKUP_COLLECTIONS, ...EXTRA_BACKUP]');
  });

  it('🛡 בידוד-קבלות: הפונקציות החדשות לא נוגעות במוני-הקבלות (R-/D-/S-) ולא רושמות תרומות', () => {
    // אותו אינווריאנט כמו paymentsWebhook — השרת מזרים/מצלם, המזכירה רושמת
    const night = functionsSrc.slice(functionsSrc.indexOf('═ צרור-הלילה'));
    expect(night).not.toMatch(/receiptSeq|donationSeq|shopReceiptSeq/);
    expect(night).not.toMatch(/collection\('supporters'\)\.add|\.set\(/);
  });

  it('🛡 גבול-לוח-עברי: אין חישוב עברי בשרת (יארצייט נשאר בצד-הלקוח, מקור-אמת יחיד)', () => {
    expect(functionsSrc).not.toMatch(/hebrew|hebcal|yahrzeit/i);
  });

  it('🛡 ארגון מוצפן מדולג בתזכורות (השרת לא מפענח), והגיבוי שומר envelope', () => {
    expect(functionsSrc).toMatch(/enc && d\.data\(\)\.iv/);
    expect(functionsSrc).toMatch(/_enc\/envelope/);
  });
});
