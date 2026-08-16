/**
 * ratchet — אשף ההרשמה של אורביט (SIGNUP3, 1.8.2026).
 * 5 שלבים: תחום→גודל→צרכים→קשר→חשבון. הצרכים אופציונליים; השלב האחרון עובר
 * signUpError. הנתונים נזרעים ל-platformRequests (Rules: אין הגבלת-שדות ⇒ אין
 * צורך בעדכון כללים). הגנת-מקור: LoginScreen מציג את האשף בהרשמה, cloudSignUp
 * כותב את הפרופיל, לוח-הבקרה מציג אותו.
 */
import { describe, expect, it } from 'vitest';
import {
  EMPTY_WIZARD,
  ORG_NEEDS,
  ORG_SIZES,
  WIZARD_INDUSTRIES,
  WIZARD_STEPS,
  industryLabel,
  needLabel,
  sizeLabel,
  wizardStepError,
  type WizardState,
} from '../signupWizard';
import loginSrc from '../../components/cloud/LoginScreen.tsx?raw';
import wizardSrc from '../../components/cloud/SignupWizard.tsx?raw';
import panelSrc from '../../components/platform/PlatformPanel.tsx?raw';

const full: WizardState = {
  industry: 'clinic',
  size: 'medium',
  needs: ['crm', 'billing'],
  orgName: 'עמותת אור',
  contactName: 'ישראל ישראלי',
  phone: '050-1234567',
  email: 'a@b.com',
  password: 'secret123',
  password2: 'secret123',
};

describe('🪐 ratchet — אשף ההרשמה (SIGNUP3)', () => {
  it('5 שלבים; התחומים נגזרים מ-13 חבילות-הוורטיקל', () => {
    expect(WIZARD_STEPS).toBe(5);
    expect(WIZARD_INDUSTRIES.length).toBe(13);
    expect(WIZARD_INDUSTRIES.map((i) => i.id)).toContain('chesed');
    expect(ORG_SIZES.length).toBe(3);
    expect(ORG_NEEDS.length).toBeGreaterThanOrEqual(5);
  });

  it('ולידציית שלב: תחום/גודל חובה, צרכים אופציונלי, קשר חובה', () => {
    expect(wizardStepError(0, EMPTY_WIZARD)).toMatch(/תחום/);
    expect(wizardStepError(0, { ...EMPTY_WIZARD, industry: 'clinic' })).toBeNull();
    expect(wizardStepError(1, { ...EMPTY_WIZARD, industry: 'clinic' })).toMatch(/גודל/);
    expect(wizardStepError(1, { ...EMPTY_WIZARD, size: 'small' })).toBeNull();
    expect(wizardStepError(2, EMPTY_WIZARD)).toBeNull(); // צרכים אופציונלי
    expect(wizardStepError(3, { ...EMPTY_WIZARD, orgName: 'x' })).toMatch(/איש קשר/);
    expect(wizardStepError(3, { ...full })).toBeNull();
  });

  it('השלב האחרון עובר signUpError — סיסמאות לא תואמות נחסמות', () => {
    expect(wizardStepError(4, full)).toBeNull();
    expect(wizardStepError(4, { ...full, password2: 'zzz' })).not.toBeNull();
    expect(wizardStepError(4, { ...full, email: 'bad' })).not.toBeNull();
  });

  it('תוויות תצוגה ללוח-הבקרה', () => {
    expect(industryLabel('clinic')).toBe('קליניקה');
    expect(sizeLabel('medium')).toBe('בינוני');
    expect(needLabel('crm')).toMatch(/לקוחות/);
    expect(industryLabel(undefined)).toBe('—');
  });

  it('הגנת-מקור: LoginScreen מציג את האשף בהרשמה', () => {
    expect(loginSrc).toContain('SignupWizard');
    expect(loginSrc).toContain("mode === 'up' ?");
    // הטופס הרזה של ההרשמה הוסר — אין יותר orgName/contactName ב-LoginScreen
    expect(loginSrc).not.toContain('setContactName');
  });

  it('הגנת-מקור: האשף כותב את הפרופיל ל-cloudSignUp; הלוח מציג אותו', () => {
    expect(wizardSrc).toContain('cloudSignUp(');
    expect(wizardSrc).toMatch(/industry:\s*s\.industry/);
    expect(wizardSrc).toMatch(/needs:\s*s\.needs/);
    expect(panelSrc).toContain('industryLabel(r.industry)');
    expect(panelSrc).toContain('sizeLabel(r.size)');
  });
});
