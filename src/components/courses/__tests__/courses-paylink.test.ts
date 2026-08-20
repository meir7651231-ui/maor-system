/**
 * ratchet — 💳 תשלום-אונליין פר-שיבוץ (גל ה׳ · פאזה 12): כפתור-סליקה מגודר courses.paylink
 * בכרטיס-השיבוץ (ManageModal) ובמרכז-הגבייה. **חוזה default-on** (חסר=דלוק) ⇒ אפס-רגרסיה
 * ליכולת שכבר נשלחה בגל-ג׳; המתג רק מאפשר כיבוי בחוגים. אפס-קבלה. כפתור עם תווית+aria.
 */
import { describe, expect, it } from 'vitest';
import { featureOn } from '../../../lib/config';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { OrgConfig } from '../../../types/config';
import manageSrc from '../ManageModal.tsx?raw';
import collectSrc from '../CollectionCenter.tsx?raw';

function cfg(features: Record<string, boolean>): OrgConfig {
  return { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules }, features };
}

describe('💳 תשלום-אונליין — חוזה-דגל default-on (אפס-רגרסיה)', () => {
  it('courses.paylink חסר = דלוק (היכולת הקיימת נשמרת); false = כבוי', () => {
    expect(featureOn(cfg({}), 'courses.paylink')).toBe(true);
    expect(featureOn(cfg({ 'courses.paylink': false }), 'courses.paylink')).toBe(false);
    expect(featureOn(cfg({ 'courses.paylink': true }), 'courses.paylink')).toBe(true);
  });
});

describe('🛡 הגנות-מקור — כפתור-הסליקה מגודר, מתויג, אפס-קבלה', () => {
  it('ManageModal: payHref מגודר integrations.payments + courses.paylink, כפתור מתויג', () => {
    expect(manageSrc).toContain("integrationOn(cfg, 'payments') && featureOn(cfg, 'courses.paylink')");
    expect(manageSrc).toContain('💳 תשלום מקוון');
    expect(manageSrc).toContain('aria-label="תשלום מקוון');
    expect(manageSrc).toContain('אינו מנפיק קבלה');
  });
  it('CollectionCenter: payUrl מגודר payments + courses.paylink, כפתור מתויג אפס-קבלה', () => {
    expect(collectSrc).toContain("integrationOn(config, 'payments') && featureOn(config, 'courses.paylink')");
    expect(collectSrc).toContain('💳 תשלום מקוון');
    expect(collectSrc).toContain('אינו מנפיק קבלה');
  });
});
