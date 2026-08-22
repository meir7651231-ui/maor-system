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
import secretsSrc from '../../settings/OrgSecretsSection.tsx?raw';
import cloudSrc from '../../../lib/cloud.ts?raw';

describe('🔒 ratchet — חיווט-סולה (תבנית-נדרים)', () => {
  it('הכספת: solaXKey רשום ב-ORG_SECRET_KEYS ומוצג בהגדרות', () => {
    expect(ORG_SECRET_KEYS).toContain('solaXKey');
    expect(secretsSrc).toContain("key: 'solaXKey'");
  });

  it('allowlist-הרחבות: payments.solaPullUrl מותר (אחרת האשף/הענן ימחקו אותו)', () => {
    expect(INTEGRATION_SETTING_KEYS.payments).toContain('solaPullUrl');
  });

  it('תור-האישור: כפתור-משיכה מגודר (solaPullUrl + מנהל/מייל-על) וקורא pullSola', () => {
    expect(incomingSrc).toMatch(/integrationSetting\(config, 'payments', 'solaPullUrl'\)/);
    expect(incomingSrc).toMatch(/canPullSola = !!solaPullUrl && \(isSuperAdmin\(cloudEmail\) \|\| isManager\)/);
    expect(incomingSrc).toContain('pullSola(solaPullUrl)');
  });

  it('pullSola (cloud.ts): https-בלבד + טוקן-כניסה — אפס-סוד בדפדפן', () => {
    expect(cloudSrc).toMatch(/export async function pullSola[\s\S]{0,200}https:\\\/\\\//);
    expect(cloudSrc).toMatch(/pullSola[\s\S]{0,600}getIdToken/);
  });
});
