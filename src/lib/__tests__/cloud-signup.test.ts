/**
 * ratchet — הרשמה + שער-החברות (CLOUD2 ענן 3).
 * ‏signUpError טהור (ולידציה עד גבול ה-SDK); הגנות-מקור: משתמש-ללא-חברות
 * לא מגיע לאפליקציה (מסך המתנה לפני השלד), הסנכרון מתחיל רק לחבר, למסך
 * הכניסה יש לשונית הרשמה, ומיילי-העל מוגדרים במקום אחד.
 */
import { describe, expect, it } from 'vitest';
import { SUPER_ADMIN_EMAILS, employeeSignUpError, isSuperAdmin, signUpError } from '../config';
import appSrc from '../../App.tsx?raw';
import loginSrc from '../../components/cloud/LoginScreen.tsx?raw';
import wizardSrc from '../../components/cloud/SignupWizard.tsx?raw';
import empSrc from '../../components/cloud/EmployeeSignup.tsx?raw';
import useAppSrc from '../../store/useApp.ts?raw';
import rulesSrc from '../../../firestore.rules?raw';

describe('☁️ ratchet — ענן 3: הרשמה ושער-החברות', () => {
  it('signUpError: ארגון+איש-קשר+טלפון חובה (זרימת-שיחה), מייל תקין, סיסמה ≥6 וזהה', () => {
    expect(signUpError('', 'ישראל', '0501234567', 'a@b.co', '123456', '123456')).toBe('שם הארגון הוא שדה חובה');
    expect(signUpError('עמותה', '', '0501234567', 'a@b.co', '123456', '123456')).toBe('שם איש הקשר הוא שדה חובה');
    expect(signUpError('עמותה', 'ישראל', '', 'a@b.co', '123456', '123456')).toContain('טלפון');
    expect(signUpError('עמותה', 'ישראל', 'abc', 'a@b.co', '123456', '123456')).toContain('טלפון');
    expect(signUpError('עמותה', 'ישראל', '0501234567', 'לא-מייל', '123456', '123456')).toBe('כתובת האימייל אינה תקינה');
    expect(signUpError('עמותה', 'ישראל', '0501234567', 'a@b.co', '12345', '12345')).toBe('הסיסמה חייבת להיות לפחות 6 תווים');
    expect(signUpError('עמותה', 'ישראל', '0501234567', 'a@b.co', '123456', '654321')).toBe('הסיסמאות אינן זהות');
    expect(signUpError('עמותה', 'ישראל', '050-1234567', 'a@b.co', '123456', '123456')).toBe('');
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
    // (ORGADMIN: אותה שורה נושאת גם isManager; הגייט הבסיסי לא השתנה)
    expect(useAppSrc).toContain("membership: member ? 'member' : 'pending'");
    expect(useAppSrc).toContain('if (!member) {');
  });

  it('הגנת-מקור: ההרשמה = אשף — ארגון+איש-קשר+טלפון (זרימת-שיחה)+סיסמה×2; מסך המתנה', () => {
    expect(loginSrc).toContain('הרשמה');
    // שדות ההרשמה עברו לאשף 5-השלבים (SignupWizard); LoginScreen מציג אותו
    expect(loginSrc).toContain('SignupWizard');
    expect(wizardSrc).toContain('שם הארגון *');
    expect(wizardSrc).toContain('שם איש קשר *');
    expect(wizardSrc).toMatch(/טלפון.*\*/);
    expect(wizardSrc).toContain('אימות סיסמה');
    expect(wizardSrc).toContain('cloudSignUp');
    // מסך ההמתנה + ההצלחה נשארים ב-LoginScreen
    expect(loginSrc).toContain('PendingApprovalScreen');
    expect(loginSrc).toContain('הבקשה נקלטה!');
    expect(loginSrc).toContain('נאשר בהקדם');
  });

  it("🛡 הגנת-מקור: גם השורש/ברירת-מחדל שער-כניסה — נרשם-חדש בשורש = ממתין (לא רק פלטפורמה)", () => {
    // באג (4.8.2026): הרשמה בשורש פתחה את האפליקציה מיד — השורש דילג על שער-החברות
    // לגמרי. התיקון: else (שורש/default) גם הוא גוזר membership='member' רק למייל-על
    // או למורשי-השורש (adminEmails); כל השאר = 'pending'. נגזר מהמייל+הקונפיג ⇒ עמיד
    // ברענון (לא מצב-זיכרון חולף).
    expect(useAppSrc).toContain('rootOk');
    expect(useAppSrc).toContain('isSuperAdmin(user.email)');
    expect(useAppSrc).toContain('cfg.adminEmails?.some');
    // מורשה-שורש ⇒ member+סנכרון; אחרת ניתוב-עצמי/המתנה (לא נכנס מיד).
    // 15.8 ("חבר את מאור"): בין member ל-gatedStart נוספה קריאת-ייעודים-פר-עובד
    // ללקוח-שורש (failure-safe, בלי שער-חברות ובלי דריסת-קונפיג) — לכן הרווח גמיש.
    expect(useAppSrc).toMatch(/if \(rootOk\) \{\s*setCloud\(\{ membership: 'member' \}\);[\s\S]{0,1400}gatedStart\(\);/);
    expect(useAppSrc).toContain("setCloud({ membership: 'pending' })");
  });

  it('employeeSignUpError: מייל+טלפון+סיסמה≥6+קוד חובה (הרשמת-עובד/ת)', () => {
    expect(employeeSignUpError('לא-מייל', '0501234567', '123456', 'maor.abc')).toBe('כתובת האימייל אינה תקינה');
    expect(employeeSignUpError('a@b.co', '', '123456', 'maor.abc')).toContain('טלפון');
    expect(employeeSignUpError('a@b.co', '0501234567', '12345', 'maor.abc')).toBe('הסיסמה חייבת להיות לפחות 6 תווים');
    expect(employeeSignUpError('a@b.co', '0501234567', '123456', '')).toContain('קוד');
    expect(employeeSignUpError('a@b.co', '050-1234567', '123456', 'maor.abc')).toBe('');
  });

  it("🛡 הגנת-מקור: הרשמת-עובד/ת — לשונית שלישית, בקשה למנהל (joinRequest), לא בקשת-ארגון", () => {
    // הכרעת-בעלים (4.8.2026): "כולם באותו מסך הרשמה, תוסיף 'הרשמת עובד' עם קוד מהבוס".
    expect(loginSrc).toContain('הרשמת עובד');
    expect(loginSrc).toContain('EmployeeSignup');
    expect(empSrc).toContain('cloudEmployeeSignUp');
    expect(empSrc).toContain('קוד-הזמנה מהמנהל');
    // ב-store: הרשמת-עובד כותבת בקשת-הצטרפות (writeOrgJoinRequest), **לא** writeOrgRequest
    expect(useAppSrc).toContain('async cloudEmployeeSignUp(');
    expect(useAppSrc).toContain('parseJoinFullCode(fullCode)');
    expect(useAppSrc).toMatch(/cloudEmployeeSignUp[\s\S]*?writeOrgJoinRequest\(parsed\.slug/);
  });

  it("🛡 הגנת-מקור: ניתוב-עצמי בכניסה — כפתור-הכניסה מכניס חבר-ארגון לאתר שלו (בלי קישור)", () => {
    // הכרעת-בעלים (4.8.2026): "אני לא רוצה לשלוח קישור — כפתור הכניסה יעשה את זה".
    // בשורש, מייל שאינו מורשה-שורש אך חבר בארגון-פלטפורמה ⇒ ניתוב אוטומטי ל-?org=slug.
    expect(useAppSrc).toContain('findMemberOrgSlugs');
    expect(useAppSrc).toContain("membership: 'checking'");
    expect(useAppSrc).toContain("url.searchParams.set('org', slugs[0])");
    expect(useAppSrc).toContain('window.location.replace');
    // כלל ה-list ב-Rules — שאילתה מוגבלת-לעצמי (array-contains המייל), בלי חשיפת השאר
    expect(rulesSrc).toContain('array-contains');
    expect(rulesSrc).toMatch(/allow list: if superAdmin\(\)/);
    expect(rulesSrc).toContain("in resource.data.get('members', [])");
  });

  it('🛡 ריפוי-עצמי של בקשת-הרשמה (5.8 — "מאור נרשם ואני לא רואה בקשה")', () => {
    // הבאג: writeOrgRequest נוסה פעם-אחת בהרשמה; כשל (רשת/Rules) ⇒ הבקשה אבדה
    // לתמיד — הנרשם במסך-המתנה והבעלים לא רואה כלום בלוח. הריפוי: הפרטים נשמרים
    // מקומית לפני הניסיון, וכל התחברות שמסתיימת במסך-ההמתנה רושמת מחדש
    // (create-only + uid תואם ⇒ אידמפוטנטי, אפס כפילויות).
    expect(useAppSrc).toContain('PENDING_SIGNUP_KEY');
    // השמירה קודמת לניסיון-הכתיבה (סדר-מקור: setItem לפני writeOrgRequest בהרשמה)
    const signupIdx = useAppSrc.indexOf('localStorage.setItem(PENDING_SIGNUP_KEY');
    const writeIdx = useAppSrc.indexOf('writeOrgRequestResilient((u, r) => mod.writeOrgRequest(u, r), uid, reqDoc)');
    expect(signupIdx).toBeGreaterThan(-1);
    expect(writeIdx).toBeGreaterThan(signupIdx);
    // מסך-ההמתנה בשורש רושם מחדש — גם בלי פרטים שמורים (בקשה מינימלית מהמייל)
    expect(useAppSrc).toMatch(/membership: 'pending' \}\);[\s\S]{0,3500}writeOrgRequestResilient\([\s\S]{0,120}user\.uid/);
    // אושר-ונותב ⇒ הפרטים המקומיים מתנקים
    expect(useAppSrc).toContain('localStorage.removeItem(PENDING_SIGNUP_KEY)');
  });

  it('🛡 כשל-הבקשה גלוי במסך-ההמתנה (5.8) — לא "הבקשה נקלטה" על כתיבה שנכשלה', () => {
    // הבאג: המסך אמר "הבקשה נקלטה" ללא-תנאי; permission-denied נבלע בשקט
    // והבעלים לא ידע שה-Rules חוסמים. עכשיו: reqStatus מוצג עם קוד-השגיאה.
    expect(useAppSrc).toContain('reqStatus');
    expect(useAppSrc).toContain('fsErrCode');
    // כתיבה מוצלחת מסומנת (REQ_OK_KEY) ⇒ אין רישום-מחדש מיותר ואין שגיאת-שווא
    expect(useAppSrc).toContain('localStorage.setItem(REQ_OK_KEY');
    expect(useAppSrc).toMatch(/getItem\(REQ_OK_KEY\) === user\.uid/);
    expect(loginSrc).toContain("reqStatus !== 'ok'");
    expect(loginSrc).toContain('הבקשה לא נקלטה');
  });

  it('🛡 כתיבת-בקשה עמידה (5.8) — נדחה הנוסח-המלא ⇒ ניסיון-נפילה עם 5 שדות-הבסיס', () => {
    // הראיה: permission-denied רק לנרשמי-האשף — Rules מפורסמים ישנים עם hasOnly
    // על 5 שדות-הבסיס דוחים את industry/size/needs. עדיף בקשה בלי-פרופיל מבקשה שאבדה.
    expect(useAppSrc).toContain('async function writeOrgRequestResilient');
    expect(useAppSrc).toMatch(/if \(!\('industry' in req\) && !\('size' in req\) && !\('needs' in req\)\) throw e/);
    // שני מסלולי-הכתיבה (הרשמה + ריפוי-עצמי בהמתנה) עוברים דרך העמידה
    expect((useAppSrc.match(/writeOrgRequestResilient\(/g) ?? []).length).toBeGreaterThanOrEqual(3); // הגדרה + 2 שימושים
  });

  it('🛡 נחיל-אבטחה 17.8 (#4+#5): ריפוי-עצמי רק למכשיר-עם-רשומה — בלי בקשת-רפאים ובלי אזעקת-שווא', () => {
    // שני באגים, אותו שורש (ענף ה-!mine בריפוי-העצמי במסך-ההמתנה):
    // #5 — עובד/מכשיר-אחר בלי PENDING_SIGNUP_KEY היה כותב בקשת-ארגון ריקה (orgName:'')
    //      אצל הבעלים = זבל בלוח-הבקרה.
    // #4 — במכשיר-שני הבקשה כבר קיימת ⇒ create-only מחזיר permission-denied ⇒
    //      המסך אמר בשקר "הבקשה לא נקלטה".
    // התיקון: הכתיבה-מחדש מגודרת ב-(mine && stored); אחרת reqStatus:'ok' בלי כתיבה.
    expect(useAppSrc).toContain('if (mine && stored)');
    // הענף האחר (מכשיר-אחר) מציג "נקלטה" בלי לכתוב — אין יותר orgName:'' בענף-הנפילה
    expect(useAppSrc).not.toMatch(/mine && stored \? stored : \{\s*orgName: '',/);
    // כשל-אמיתי (mine) עדיין גלוי — fsErrCode נשאר בענף ה-mine
    expect(useAppSrc).toMatch(/if \(mine && stored\)[\s\S]{0,1200}fsErrCode\(e\)/);
  });

  it('🛡 נחיל-אבטחה 17.8 (#2): joinRequests מוקשח-DoS — allowlist 5 שדות + תקרות-גודל', () => {
    // בלי ההקשחה מסמך-הצטרפות יכול היה להגיע ל-1MB בכל slug (זבל בלוח-המנהל).
    expect(rulesSrc).toMatch(/joinRequests\/\{uid\}[\s\S]{0,900}hasOnly\(\['email', 'name', 'phone', 'code', 'at'\]\)/);
    // הכותבים בפועל משתמשים בדיוק בשדות האלה ⇒ לא-שובר (email/name/phone/code/at)
    expect(rulesSrc).toMatch(/joinRequests\/\{uid\}[\s\S]{0,1400}request\.resource\.data\.email\.size\(\) <= 120/);
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
