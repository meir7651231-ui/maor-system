/**
 * ratchet — מסך ההרשמה של אורביט (SIGNUP מיתוג 2+3).
 * הקופי הנעול מדויק; ההרשמה קוראת cloudSignUp; אפס הבטחת-אימות שאין
 * (Google/Apple/Passkey/WebAuthn); אפס CDN; העיתון+"נחזור אליכם" מחווטים;
 * שער-הענן הקיים (App) לא נשבר; הבידוד — הליד ללא-חשבון ל-platformLeads.
 */
import { describe, expect, it } from 'vitest';
import loginSrc from '../LoginScreen.tsx?raw';
import heroSrc from '../SignupHero.tsx?raw';
import newsSrc from '../NewsReader.tsx?raw';
import cbSrc from '../CallbackModal.tsx?raw';
import cssSrc from '../../../styles/orbit.css?raw';
import appSrc from '../../../App.tsx?raw';
import rulesSrc from '../../../../firestore.rules?raw';

const ALL = [loginSrc, heroSrc, newsSrc, cbSrc];

describe('🪐 ratchet — SIGNUP: מסך ההרשמה של אורביט', () => {
  it('הקופי הנעול מדויק (מילה-במילה)', () => {
    expect(loginSrc).toContain('העסק שלכם לא צריך עוד תוכנה. הוא צריך');
    expect(loginSrc).toContain('אורביט היא מערכת ההפעלה שמחברת את כל העסק למקום אחד');
    expect(loginSrc).toContain('<em>מוח</em>');
  });

  it('ההרשמה מחוברת ל-cloudSignUp הקיים; לשוניות כניסה/הרשמה', () => {
    expect(loginSrc).toContain('cloudSignUp');
    expect(loginSrc).toContain('cloudSignIn');
    expect(loginSrc).toContain('שם הארגון *');
    expect(loginSrc).toContain('שם איש קשר *');
    expect(loginSrc).toMatch(/טלפון.*\*/);
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

  it('העיתון + "נחזור אליכם" מחווטים; העיתון self-contained (בלי pdf.js)', () => {
    expect(loginSrc).toContain('NewsReader');
    expect(loginSrc).toContain('CallbackModal');
    expect(loginSrc).toContain('setReaderOpen(true)');
    expect(loginSrc).toContain('setCallbackOpen(true)');
    expect(newsSrc).toContain('orbit/orbit-news.html');
    expect(newsSrc).not.toContain('pdfjs');
    expect(cbSrc).toContain('cloudRequestCallback');
  });

  it('הכדור מגודר signup.hero3d + נפילה לרקע סטטי', () => {
    expect(heroSrc).toContain("featureOn(config, 'signup.hero3d')");
    expect(heroSrc).toContain('mountBrainScene');
    expect(heroSrc).toContain('orbit-hero.png');
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
