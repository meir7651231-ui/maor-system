/**
 * ratchet — UX סבב-ו׳ (5.8.2026): מסך ההגדרות מקובץ ל-4 לשוניות.
 * האינווריאנטים:
 * 1. כל 17 סעיפי-ההגדרות משויכים לקבוצה — אף סעיף לא נשמט מהמיפוי (אפס אובדן יכולת).
 * 2. כל שערי-הגידור המקוריים נשארו כלשונם (featureOn פר-סעיף, self-gates).
 * 3. בקשת-מיקוד ממסך אחר (goSettingsSection במשפחות) פותחת את הקבוצה הנכונה —
 *    sessionStorage חד-פעמי, לא state שאובד ב-unmount.
 * 4. לשונית ריקה מוסתרת; קבוצת ברירת-המחדל 'org' לעולם קיימת (sec-org תמיד מוצג).
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SettingsView.tsx?raw';
import libSrc from '../lib.tsx?raw';
import famSrc from '../../families/FamiliesView.tsx?raw';

const ALL_SECTION_IDS = [
  'sec-org', 'sec-theme', 'sec-teachers', 'sec-rooms', 'sec-notif', 'sec-access',
  'sec-backup', 'sec-export', 'sec-import', 'sec-audit',
  // ‏9.8: sec-org-secrets — כספת-המפתחות פר-ארגון (קבוצת האבטחה)
  'sec-security', 'sec-encryption', 'sec-cloud-encryption', 'sec-org-secrets',
  // מסלול-B (14.8): מיגרציית-פיצול-תרומות — מגודר מייל-על, קבוצת האבטחה
  'sec-donation-split',
  'sec-ai', 'sec-audittrail', 'sec-verifyreceipt', 'sec-reset',
];

describe('⚙️ ratchet — UX סבב-ו׳: הגדרות ב-4 לשוניות (5.8.2026)', () => {
  it('כל הסעיפים משויכים לקבוצה ב-SECTION_GROUP — אף אחד לא נשמט', () => {
    const mapMatch = viewSrc.match(/const SECTION_GROUP[\s\S]*?\n\};/);
    expect(mapMatch).toBeTruthy();
    for (const id of ALL_SECTION_IDS) expect(mapMatch![0]).toContain(`'${id}'`);
  });

  it('4 הקבוצות קיימות והלשוניות מסננות רינדור — קבוצה פעילה אחת בכל רגע', () => {
    for (const g of ['🏷 הארגון שלי', '📚 נתונים', '🔐 אבטחה', '🧪 מתקדם']) expect(viewSrc).toContain(g);
    for (const g of ['org', 'data', 'security', 'adv']) expect(viewSrc).toContain(`shownGroup === '${g}' && (`);
  });

  it('שערי-הגידור המקוריים נשארו כלשונם — הקיבוץ תצוגתי בלבד', () => {
    for (const gate of [
      "featureOn(config, 'settings.theme') && <ThemeSection />",
      "secOn('sec-teachers') && <TeachersSection />",
      "secOn('sec-rooms') && <RoomsSection />",
      "featureOn(config, 'settings.notif') && <NotifSection />",
      "featureOn(config, 'settings.backup') && <BackupSection />",
      "secOn('sec-export') && <ExportSection />",
      "secOn('sec-import') && <ImportSection />",
      "secOn('sec-audit') && <AuditSection />",
      "featureOn(config, 'settings.access') && <AccessSection />",
      "featureOn(config, 'shell.lock') && <SecuritySection />",
      "featureOn(config, 'settings.encryption') && <EncryptionSection />",
      '<CloudEncryptionSection />',
      '<AiKeySection />',
      '<AuditTrailSection />',
      '<VerifyReceiptSection />',
      "secOn('sec-reset') && <ResetSection />",
    ]) expect(viewSrc).toContain(gate);
  });

  it('בקשת-מיקוד: sessionStorage חד-פעמי (takeSettingsFocus) + fallback ל-org כשהקבוצה מוסתרת', () => {
    expect(libSrc).toContain("sessionStorage.setItem(SETTINGS_FOCUS_KEY, sectionId)");
    expect(libSrc).toMatch(/getItem\(SETTINGS_FOCUS_KEY\)[\s\S]{0,120}removeItem\(SETTINGS_FOCUS_KEY\)/);
    expect(viewSrc).toContain('takeSettingsFocus()');
    expect(viewSrc).toContain("(focusId && SECTION_GROUP[focusId]) || 'org'");
    expect(viewSrc).toContain("groupHas[group] ? group : 'org'");
  });

  it('קיצורי-המשפחות (ייבוא/בדיקת-נתונים) מבקשים מיקוד לפני המעבר — נוחתים בלשונית הנכונה', () => {
    expect(famSrc).toMatch(/requestSettingsSection\(sectionId\);\s*\n\s*go\('settings'\)/);
    expect(famSrc).toContain("goSettingsSection('sec-import')");
    expect(famSrc).toContain("goSettingsSection('sec-audit')");
  });

  it('צ׳יפי-הפעולה (אשף/לוח-בקרה/ניהול-עובדות) נשארו — עם אותם שערים', () => {
    expect(viewSrc).toContain('🎛️ אשף ההקמה');
    expect(viewSrc).toContain('🛠 לוח בקרה');
    expect(viewSrc).toContain('👥 ניהול העובדות');
  });

  it('"צ׳יפ לכל מה שמרונדר" — גם הסעיפים המגודרים-עצמית קיבלו צ׳יפ-קפיצה באותם שערים', () => {
    expect(viewSrc).toMatch(/featureOn\(config, 'shell\.lock'\) \? \[\{ id: 'sec-security'/);
    expect(viewSrc).toMatch(/featureOn\(config, 'settings\.encryption'\) \? \[\{ id: 'sec-encryption'/);
    // הכרעת-בעלים 24.8: הצפנת-ענן פר-מנהל-ארגון (לא מייל-על בלבד) — הצ׳יפ נפתח גם למנהל
    expect(viewSrc).toMatch(/canPlatform \|\| \(cloudOn && isManager && config\.slug !== 'default'\) \? \[\{ id: 'sec-cloud-encryption'/);
    expect(viewSrc).toMatch(/integrationOn\(config, 'ai'\) && isAdmin \? \[\{ id: 'sec-ai'/);
    expect(viewSrc).toMatch(/featureOn\(config, 'settings\.audittrail'\) && isAdmin \? \[\{ id: 'sec-audittrail'/);
    expect(viewSrc).toMatch(/featureOn\(config, 'core\.receipt\.verifycode'\) \? \[\{ id: 'sec-verifyreceipt'/);
  });
});

describe('⬆ ratchet — UX סבב-ו׳: בורר-מסלול בייבוא (5.8.2026)', () => {
  it('חמשת מסלולי-הייבוא קיימים במלואם — הבורר ממקד רינדור, לא מוחק זרימות', async () => {
    const importSrc = (await import('../ImportSection.tsx?raw')).default;
    // כל תת-הזרימות נשארו בקובץ
    for (const flow of ['onJsonFile', 'Families13Import', 'KidsImport', 'SupporterImport', 'AyinSheetImport']) {
      expect(importSrc).toContain(flow);
    }
    // הבורר מכסה את כל החמישה, וגיליון-העיניים מגודר באותם דגלים של הרכיב עצמו
    for (const r of ["route === 'json'", "route === 'fam'", "route === 'kids'", "route === 'sup'", "route === 'ayin'"]) {
      expect(importSrc).toContain(r);
    }
    expect(importSrc).toMatch(/supporters\.ayin'\) && featureOn\(config, 'supporters\.ayin\.sheet'\)/);
  });
});
