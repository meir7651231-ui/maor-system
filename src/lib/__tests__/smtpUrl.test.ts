/**
 * ratchet · הרכבת-SMTP ידידותית (20.8, בקשת-בעלים "רק של הלקוח — תייצר מקום
 * להכניס") — הלקוח מקליד מייל+סיסמת-אפליקציה, ה-URL המלא מורכב לבד.
 */
import { describe, expect, it } from 'vitest';
import { composeSmtpUrl, smtpHostFor } from '../smtpUrl';
import secSrc from '../../components/settings/OrgSecretsSection.tsx?raw';

describe('smtpHostFor — זיהוי-ספק לפי דומיין', () => {
  it('ג׳ימייל ⇒ שרת-גוגל 465', () => {
    expect(smtpHostFor('receipts@gmail.com')).toBe('smtp.gmail.com:465');
    expect(smtpHostFor('a@GMAIL.com')).toBe('smtp.gmail.com:465');
  });
  it('אאוטלוק ⇒ 587 (STARTTLS)', () => {
    expect(smtpHostFor('x@outlook.com')).toBe('smtp-mail.outlook.com:587');
  });
  it('ספק לא-מוכר / כתובת שבורה ⇒ ריק (שדה-שרת ידני)', () => {
    expect(smtpHostFor('x@shem-haamuta.org')).toBe('');
    expect(smtpHostFor('בלי-שטרודל')).toBe('');
    expect(smtpHostFor('')).toBe('');
  });
});

describe('composeSmtpUrl — הרכבת הכתובת המלאה', () => {
  it('‏465 ⇒ smtps:// · ‏587 ⇒ smtp:// (כך nodemailer מפרש)', () => {
    expect(composeSmtpUrl('a@gmail.com', 'p', 'smtp.gmail.com:465')).toBe(
      'smtps://a%40gmail.com:p@smtp.gmail.com:465',
    );
    expect(composeSmtpUrl('a@outlook.com', 'p', 'smtp-mail.outlook.com:587')).toBe(
      'smtp://a%40outlook.com:p@smtp-mail.outlook.com:587',
    );
  });
  it('🐛 סיסמת-אפליקציה עם תווים מיוחדים לא שוברת את הכתובת (encodeURIComponent)', () => {
    const url = composeSmtpUrl('a@gmail.com', 'p@ss:w/rd', 'smtp.gmail.com:465')!;
    expect(url).toContain('p%40ss%3Aw%2Frd');
    // ה-URL נשאר פריק: user/pass משתחזרים נכון
    const u = new URL(url);
    expect(decodeURIComponent(u.username)).toBe('a@gmail.com');
    expect(decodeURIComponent(u.password)).toBe('p@ss:w/rd');
  });
  it('חסר משהו ⇒ null (בלי כתובת-חצי שנשמרת לכספת)', () => {
    expect(composeSmtpUrl('', 'p', 'h:465')).toBeNull();
    expect(composeSmtpUrl('a@gmail.com', '', 'h:465')).toBeNull();
    expect(composeSmtpUrl('a@gmail.com', 'p', '')).toBeNull();
    expect(composeSmtpUrl('בלי-שטרודל', 'p', 'h:465')).toBeNull();
  });
});

describe('הגנת-מקור — הכספת משתמשת במרכיב הידידותי', () => {
  it('OrgSecretsSection מרכיב smtpUrl דרך composeSmtpUrl (לא שדה-URL גולמי)', () => {
    expect(secSrc).toContain('composeSmtpUrl(mailUser, mailPass, knownHost || mailHost)');
    expect(secSrc).toContain('סיסמת-אפליקציה');
    // השדה-הטכני הישן הוסר מרשימת-השדות
    expect(secSrc).not.toContain("label: '📧 חשבון-מייל לשליחה");
  });
});
