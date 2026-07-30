/**
 * ratchet — הרשמה + שער-החברות (CLOUD2 ענן 3).
 * ‏signUpError טהור (ולידציה עד גבול ה-SDK); הגנות-מקור: משתמש-ללא-חברות
 * לא מגיע לאפליקציה (מסך המתנה לפני השלד), הסנכרון מתחיל רק לחבר, למסך
 * הכניסה יש לשונית הרשמה, ומיילי-העל מוגדרים במקום אחד.
 */
import { describe, expect, it } from 'vitest';
import { SUPER_ADMIN_EMAILS, isSuperAdmin, signUpError } from '../config';
import appSrc from '../../App.tsx?raw';
import loginSrc from '../../components/cloud/LoginScreen.tsx?raw';
import useAppSrc from '../../store/useApp.ts?raw';
import rulesSrc from '../../../firestore.rules?raw';

describe('☁️ ratchet — ענן 3: הרשמה ושער-החברות', () => {
  it('signUpError: שם ארגון חובה, מייל תקין, סיסמה ≥6 וזהה — או ריק כשתקין', () => {
    expect(signUpError('', 'a@b.co', '123456', '123456')).toBe('שם הארגון הוא שדה חובה');
    expect(signUpError('עמותה', 'לא-מייל', '123456', '123456')).toBe('כתובת האימייל אינה תקינה');
    expect(signUpError('עמותה', 'a@b.co', '12345', '12345')).toBe('הסיסמה חייבת להיות לפחות 6 תווים');
    expect(signUpError('עמותה', 'a@b.co', '123456', '654321')).toBe('הסיסמאות אינן זהות');
    expect(signUpError('עמותה', 'a@b.co', '123456', '123456')).toBe('');
  });

  it('isSuperAdmin: מייל-העל בלבד, case-insensitive; הרשימה במקום אחד', () => {
    expect(SUPER_ADMIN_EMAILS).toContain('meir7651231@gmail.com');
    expect(isSuperAdmin('MEIR7651231@GMAIL.COM')).toBe(true);
    expect(isSuperAdmin('someone@else.com')).toBe(false);
    expect(isSuperAdmin('')).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });

  it("🛡 הגנת-מקור: משתמש-ללא-חברות לא מגיע לאפליקציה — מסך המתנה לפני השלד; הסנכרון רק לחבר", () => {
    expect(appSrc).toContain("membership === 'pending'");
    expect(appSrc).toContain('PendingApprovalScreen');
    // ב-store: שער החברות — startSync רק אחרי member; מסך המתנה אחרת
    expect(useAppSrc).toContain("setCloud({ membership: member ? 'member' : 'pending' })");
    expect(useAppSrc).toMatch(/if \(!member\) return;/);
  });

  it('הגנת-מקור: מסך הכניסה עם לשונית הרשמה (שם ארגון + סיסמה×2) ומסך המתנה', () => {
    expect(loginSrc).toContain('הרשמה');
    expect(loginSrc).toContain('שם הארגון *');
    expect(loginSrc).toContain('אימות סיסמה');
    expect(loginSrc).toContain('cloudSignUp');
    expect(loginSrc).toContain('PendingApprovalScreen');
    expect(loginSrc).toContain('הבקשה נקלטה');
  });

  it('הגנת-מקור: Rules v2 — בקשות uid-תואם, ארגונים לחברים, כתיבה למיילי-על, שורש כהיום', () => {
    expect(rulesSrc).toContain('platformRequests/{uid}');
    expect(rulesSrc).toContain('request.auth.uid == uid');
    expect(rulesSrc).toContain('platformOrgs/{slug}');
    expect(rulesSrc).toContain('orgMember(slug)');
    expect(rulesSrc).toContain('orgs/{slug}/{col}/{docId}');
    expect(rulesSrc).toContain('allowedRoot()');
    expect(rulesSrc).toContain('superAdmin()');
  });
});
