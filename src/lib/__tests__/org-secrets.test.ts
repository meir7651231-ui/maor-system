/**
 * ratchet — כספת-מפתחות פר-ארגון (בקשת-בעלים 9.8: "כל מנהל יש את הסודות שלו").
 * האינווריאנטים הקשיחים:
 * 1. ‏Rules: ‏orgSecrets — write למנהל בלבד, **read:false לכולם** (רק Admin-SDK
 *    של ה-functions); הכספת אוסף-שורש (תחת orgs/ כל חבר היה קורא — OR-semantics).
 * 2. הלקוח לעולם לא קורא סוד חזרה: אין getDoc על ORG_SECRETS בכל קוד-הלקוח;
 *    המסך מציג רק את המטא ("מוגדר ✓") וכותב דרך allowlist.
 * 3. ‏'' = מחיקה מהכספת (deleteField), לא שמירת מחרוזת-ריקה.
 * 4. השרת: סוד-הארגון גובר, ה-secret הגלובלי נפילה-לאחור; תור בלי מפתח נשאר
 *    pending (לא error) עד שיוגדר.
 */
import { describe, expect, it } from 'vitest';
import rulesSrc from '../../../firestore.rules?raw';
import cloudCfgSrc from '../cloudConfig.ts?raw';
import sectionSrc from '../../components/settings/OrgSecretsSection.tsx?raw';
import functionsSrc from '../../../functions/index.js?raw';

describe('🗝 ratchet — כספת-מפתחות פר-ארגון', () => {
  it('Rules: orgSecrets כתיבה-למנהל, קריאה-לאף-אחד; המטא קריא-לחברים', () => {
    expect(rulesSrc).toMatch(/match \/orgSecrets\/\{slug\} \{[\s\S]{0,200}allow write: if superAdmin\(\) \|\| orgManager\(slug\);[\s\S]{0,80}allow read: if false;/);
    expect(rulesSrc).toMatch(/match \/orgSecretsMeta\/\{slug\} \{[\s\S]{0,200}allow read: if superAdmin\(\) \|\| orgMember\(slug\);/);
  });

  it('הלקוח כותב-בלבד: אין קריאת-סוד חזרה בשום מקום; \'\' = deleteField', () => {
    expect(cloudCfgSrc).toContain("const ORG_SECRETS = 'orgSecrets'");
    expect(cloudCfgSrc).toMatch(/secret\[k\] = v \|\| deleteField\(\)/);
    // הקריאה היחידה היא של המטא — לא של הכספת עצמה
    expect(cloudCfgSrc).not.toMatch(/getDoc\(doc\(cloudDb\(\), ORG_SECRETS,/);
    expect(cloudCfgSrc).toMatch(/getDoc\(doc\(cloudDb\(\), ORG_SECRETS_META,/);
    // המסך: שדות-סיסמה שלעולם לא מאוכלסים מערכי-כספת
    expect(sectionSrc).toContain('type="password"');
    expect(sectionSrc).toContain('readOrgSecretsMeta');
    expect(sectionSrc).not.toContain('readOrgSecrets(');
  });

  it('השרת: סוד-הארגון גובר + נפילה-לאחור לגלובלי; בלי מפתח ⇒ נשאר pending', () => {
    expect(functionsSrc).toContain('async function orgSecretsOf(');
    expect(functionsSrc).toContain('sec.smsApiKey || process.env.SMS_API_KEY');
    expect(functionsSrc).toContain('sec.smtpUrl || process.env.SMTP_URL');
    expect(functionsSrc).toContain('sec.yemotToken || process.env.YEMOT_TOKEN');
    // תור בלי מפתח — continue (יישלח כשיוגדר), לא error
    expect(functionsSrc).toMatch(/if \(!apiKey\) continue;/);
    expect(functionsSrc).toMatch(/if \(!smtpUrl\) continue;/);
  });
});
