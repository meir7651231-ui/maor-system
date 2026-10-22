/**
 * ratchet — מסך ההרשמה של אורביט (SIGNUP מיתוג 2+3).
 * הקופי הנעול מדויק; ההרשמה קוראת cloudSignUp; אפס הבטחת-אימות שאין
 * (Google/Apple/Passkey/WebAuthn); אפס CDN; העיתון+"נחזור אליכם" מחווטים;
 * שער-הענן הקיים (App) לא נשבר; הבידוד — הליד ללא-חשבון ל-platformLeads.
 */
import { describe, expect, it } from 'vitest';
import loginSrc from '../LoginScreen.tsx?raw';
import wizardSrc from '../SignupWizard.tsx?raw';
import heroSrc from '../SignupHero.tsx?raw';
import storeSrc from '../StoreModal.tsx?raw';
import reelSrc from '../ScreensReel.tsx?raw';
import cbSrc from '../CallbackModal.tsx?raw';
import cssSrc from '../../../styles/orbit.css?raw';
import appSrc from '../../../App.tsx?raw';
import rulesSrc from '../../../../firestore.rules?raw';

const ALL = [loginSrc, wizardSrc, heroSrc, storeSrc, reelSrc, cbSrc];

describe('🪐 ratchet — SIGNUP: מסך ההרשמה של אורביט', () => {
  it('הקופי הנעול מדויק + מיתוג נגזר-ארגון (ברירת-מחדל אורביט, בהמשך מהאתר שלהם)', () => {
    // כותרת חדשה (הכרעת-בעלים 22.10 — "משפט עוצמתי"); תת-הכותרת נשמרת
    expect(loginSrc).toContain('כל עסק. כל תחום.<br /><em>מערכת אחת שעושה הכול.</em>');
    expect(loginSrc).toContain('המערכת שמחברת את כל הפעילות שלכם למקום אחד');
    // המותג (שם+אייקון) נגזר מ-config; ברירת-מחדל = אורביט (הפלטפורמה)
    expect(loginSrc).toContain('orbit-brand-name');
    expect(loginSrc).toContain('{title}');
    expect(loginSrc).toContain("|| 'אורביט'");
    expect(loginSrc).toContain("config.emoji || '🪐'");
    // הצבע נגזר-ארגון דרך orbitTheme(accent); ברירת-מחדל = כחול קוסמי
    expect(loginSrc).toContain('orbitTheme(config.accent)');
    expect(heroSrc).toContain('orbitTheme(config.accent).scene');
    // אין קופי-אורביט קשיח ישן, אין ORBIT קשיח בפוטר, אין לוגו-ORBIT קשיח
    expect(loginSrc).not.toContain('אורביט היא מערכת');
    expect(loginSrc).not.toContain('© 2026 ORBIT');
    expect(heroSrc).not.toContain('orbit-logo.png');
  });

  it('ההרשמה = אשף (SignupWizard→cloudSignUp); כניסה נפרדת; פרטי הקשר באשף', () => {
    // ההרשמה עברה לאשף 5-השלבים; LoginScreen מציג אותו בהרשמה ומטפל בכניסה
    expect(loginSrc).toContain('SignupWizard');
    expect(loginSrc).toContain('cloudSignIn');
    expect(loginSrc).toContain("mode === 'up' ?");
    // שדות ההרשמה חיים באשף
    expect(wizardSrc).toContain('cloudSignUp');
    expect(wizardSrc).toContain('שם הארגון *');
    expect(wizardSrc).toContain('שם איש קשר *');
    expect(wizardSrc).toMatch(/טלפון.*\*/);
  });

  it('🛡 אין הבטחת שיטות-אימות שלא קיימות (Google/Apple/Passkey/WebAuthn)', () => {
    for (const src of ALL) {
      expect(src).not.toContain('Passkey');
      expect(src).not.toContain('WebAuthn');
      expect(src).not.toContain('Google');
      expect(src).not.toContain('Apple');
    }
    // הבאדג' הוחלף להצהרה אמיתית
    expect(loginSrc).toContain('הצפנה במנוחה');
    expect(loginSrc).not.toContain('SOC 2');
  });

  it('🛡 אפס CDN — לא unpkg/cdnjs/fonts.googleapis בקוד המסך ובסגנון', () => {
    for (const src of [...ALL, cssSrc]) {
      expect(src).not.toContain('unpkg');
      expect(src).not.toContain('cdnjs');
      expect(src).not.toContain('fonts.googleapis');
    }
  });

  it('🛒 החנות (במקום סרטון+עיתון, 22.10) + "נחזור אליכם" מחווטים; רצועת-מסכים', () => {
    expect(loginSrc).toContain('StoreModal');
    expect(loginSrc).toContain('setStoreOpen(true)');
    expect(loginSrc).toContain('CallbackModal');
    expect(loginSrc).toContain('setCallbackOpen(true)');
    expect(loginSrc).not.toContain('▶ סרטון');
    expect(loginSrc).not.toContain('📰 עיתון');
    expect(loginSrc).toContain('<ScreensReel');
    expect(storeSrc).toContain('orbit/store/index.html');
    // הודעת-החנות מתקבלת רק מאותו origin ומחוטאת
    expect(storeSrc).toContain('e.origin !== window.location.origin');
    expect(storeSrc).toContain('sanitizeStoreNames');
    expect(cbSrc).toContain('cloudRequestCallback');
  });

  it('הכדור מגודר signup.hero3d + נפילה לרקע סטטי', () => {
    expect(heroSrc).toContain("featureOn(config, 'signup.hero3d')");
    expect(heroSrc).toContain('mountBrainScene');
    expect(heroSrc).toContain('orbit-hero.png');
  });

  it('🪶 מיתוג 5 — three נטען דינמית (chunk נפרד): import() ל-three-scene, בלי import סטטי של mountBrainScene', () => {
    expect(heroSrc).toContain("import('../../lib/three-scene')");
    // אין import סטטי-של-ערך של mountBrainScene (רק import type לטיפוס)
    expect(heroSrc).not.toMatch(/import\s*\{[^}]*mountBrainScene/);
    expect(heroSrc).toContain("import type { BrainSceneHandle }");
  });

  it('🛡 שער-הענן הקיים לא נשבר — App מרנדר LoginScreen ב-cloud.enabled && !user', () => {
    expect(appSrc).toContain('<LoginScreen />');
    expect(appSrc).toContain('cloud.enabled && !cloud.user');
    expect(appSrc).toContain('PendingApprovalScreen');
  });

  it('Rules: platformLeads create-only ציבורי (קריאה למיילי-על) — לכידת-ליד בטוחה', () => {
    expect(rulesSrc).toContain('platformLeads/{leadId}');
    expect(rulesSrc).toMatch(/allow create: if request\.resource\.data\.keys\(\)\.hasOnly/);
    expect(rulesSrc).toContain('allow read, update, delete: if superAdmin()');
  });
});
