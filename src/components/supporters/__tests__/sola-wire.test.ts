/**
 * ratchet · חיווט-סולה בקליינט (21.8.2026 — "יש חשבון תתחיל לעבוד ותתחיל לחווט
 * כמו נדרים"). נועל את התבנית:
 *  1. הכספת מכירה ב-solaXKey (ORG_SECRET_KEYS) + שדה בהגדרות←מפתחות-ההרחבות.
 *  2. allowlist-ההרחבות מכיר ב-payments.solaPullUrl (בלעדיו normalizeConfig מוחק).
 *  3. תור-האישור נושא כפתור 🔄 משיכה-מסולה — מגודר כתובת+מנהל/מייל-על, דרך pullSola
 *     (טוקן-כניסה, אפס-סוד בדפדפן), והרישום נשאר דרך התור בלבד (אפס-קבלה מהשרת).
 */
import { describe, it, expect } from 'vitest';
import { ORG_SECRET_KEYS } from '../../../lib/cloudConfig';
import { INTEGRATION_SETTING_KEYS } from '../../../types/config';
import incomingSrc from '../IncomingPayments.tsx?raw';
import donorImportSrc from '../../settings/DonorImportSection.tsx?raw';
import secretsSrc from '../../settings/OrgSecretsSection.tsx?raw';
import cloudSrc from '../../../lib/cloud.ts?raw';

describe('🔒 ratchet — חיווט-סולה (תבנית-נדרים)', () => {
  it('הכספת: solaXKey רשום ב-ORG_SECRET_KEYS ומוצג בהגדרות', () => {
    expect(ORG_SECRET_KEYS).toContain('solaXKey');
    expect(secretsSrc).toContain("key: 'solaXKey'");
  });

  it('allowlist-הרחבות: payments.solaPullUrl+solaPayUrl מותרים (אחרת האשף/הענן ימחקו אותם)', () => {
    expect(INTEGRATION_SETTING_KEYS.payments).toContain('solaPullUrl');
    expect(INTEGRATION_SETTING_KEYS.payments).toContain('solaPayUrl');
  });

  it('💳 סולה (23.8, "מה עם סולה"): כפתור-סליקה שני בכל משטחי-התשלום', async () => {
    for (const path of ['../SupporterDetail.tsx', '../../dialer/DialerModal.tsx', '../../courses/ManageModal.tsx', '../../courses/CollectionCenter.tsx']) {
      const src = (await import(/* @vite-ignore */ path + '?raw')).default as string;
      expect(src, path).toMatch(/solaPayUrl/);
      expect(src, path).toMatch(/💳 סולה/);
    }
    const wiz = (await import('../../builder/BuilderWizard.tsx?raw')).default as string;
    expect(wiz).toContain("setIntegrationField('payments', 'solaPayUrl', v)");
  });

  it('הכרעת-בעלים 23.8: כפתורי-המשיכה במסך-המנהל (DonorImportSection), מגודרים solaPullUrl+מנהל', () => {
    expect(donorImportSrc).toMatch(/integrationSetting\(config, 'payments', 'solaPullUrl'\)/);
    expect(donorImportSrc).toMatch(/canPullSola = !!solaPullUrl && \(isSuperAdmin\(cloudUser\?\.email\) \|\| isManager\)/);
    expect(donorImportSrc).toContain('pullSola(solaPullUrl, { reset })');
    // 🧹 משיכה-מלאה-באיפוס (23.8) — חמושה דו-שלבית (סמן-ישן צמצם את החלון)
    expect(donorImportSrc).toMatch(/armOr\('sola-reset'[\s\S]{0,60}doSolaPull\(true\)/);
    // מסך-התורמים נשאר לצפייה — בלי כפתורי-משיכה, עם ריפוי-הפתיחה בלבד
    expect(incomingSrc).not.toContain('doSolaPull');
    expect(incomingSrc).toMatch(/fetchProviderRows\('sola'\)/);
  });

  it('pullSola (cloud.ts): https-בלבד + טוקן-כניסה — אפס-סוד בדפדפן', () => {
    expect(cloudSrc).toMatch(/export async function pullSola[\s\S]{0,200}https:\\\/\\\//);
    expect(cloudSrc).toMatch(/pullSola[\s\S]{0,600}getIdToken/);
  });
});
