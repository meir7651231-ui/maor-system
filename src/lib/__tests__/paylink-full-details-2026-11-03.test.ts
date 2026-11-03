/**
 * רצ'ט — «שכל הפרטים של הבן-אדם יעברו ישירות לעמוד התרומה ולא רק השם, כי שוכחים לרשום מייל וטלפון
 * ואז זה לא יכול להיכנס לתוכנה בחזרה» + «להוסיף עמוד תרומה של סולה חו״ל» (3.11.2026, בקשת-בעלים).
 *
 * «רק מאור» (הכרעת-בעלים 3.11): כל-הפרטים רק לארגון של מאור (payFullDetails); כל ארגון אחר — שם בלבד, ביט-זהה להיום.
 * הבאג: payLink העביר רק שם ⇒ התרומה חזרה בסנכרון (נדרים/סולה) בלי טלפון/מייל ⇒ אי-אפשר לשייך לתורם.
 * שמות-הפרמטרים אומתו: נדרים — מקוד-העמוד (‎DecodeParam('Phone') ⇒ #PhoneTxt‎…); סולה — בדפדפן מול
 * העמוד החי של מאור (xBillLastName/xBillPhone/xEmail/xBillStreet/xBillCity/xBillZip התמלאו).
 */
import { describe, expect, it } from 'vitest';
import { familyPayPerson, orgPayWho, orgSolaPayUrl, payLink, supporterPayPerson } from '../payLink';
import supDetail from '../../components/supporters/SupporterDetail.tsx?raw';
import dialer from '../../components/dialer/DialerModal.tsx?raw';
import ayin from '../../components/supporters/AyinCard.tsx?raw';
import manage from '../../components/courses/ManageModal.tsx?raw';
import collection from '../../components/courses/CollectionCenter.tsx?raw';

const NED = 'https://www.matara.pro/nedarimplus/online/?mosad=7001532';
const SOLA = 'https://secure.cardknox.com/meorhachessedlutzkininc';
const P = { name: 'משה כהן', phone: '050-1234567', email: 'moshe@example.com', street: 'הרב קוק 5', city: 'ירושלים', zip: '9534311', idNum: '123456782' };

describe('💳 נדרים — כל הפרטים', () => {
  it('Amount + ClientName + Phone + Email + Street + City + Zeout; mosad נשמר', () => {
    const u = new URL(payLink(NED, 180, P)!);
    expect(u.searchParams.get('mosad')).toBe('7001532');
    expect(u.searchParams.get('Amount')).toBe('180');
    expect(u.searchParams.get('ClientName')).toBe('משה כהן');
    expect(u.searchParams.get('Phone')).toBe('050-1234567');
    expect(u.searchParams.get('Email')).toBe('moshe@example.com');
    expect(u.searchParams.get('Street')).toBe('הרב קוק 5');
    expect(u.searchParams.get('City')).toBe('ירושלים');
    expect(u.searchParams.get('Zeout')).toBe('123456782');
  });
  it('שדה ריק לא נשלח (לא נועלים שדה ריק אצל נדרים); מחרוזת-שם = כמו פעם', () => {
    const u = new URL(payLink(NED, 0, { name: 'א', phone: '  ', email: '' })!);
    expect([...u.searchParams.keys()].sort()).toEqual(['ClientName', 'mosad']);
    expect(new URL(payLink(NED, 0, 'דוד')!).searchParams.get('ClientName')).toBe('דוד');
  });
});

describe('💳 סולה — כל הפרטים, בלי סכום', () => {
  it('xBillLastName/xBillPhone/xEmail/xBillStreet/xBillCity/xBillZip; בלי ת"ז ובלי סכום (₪ מול $)', () => {
    const u = new URL(payLink(SOLA, 500, P)!);
    expect(u.searchParams.get('xBillLastName')).toBe('משה כהן');
    expect(u.searchParams.get('xBillPhone')).toBe('050-1234567');
    expect(u.searchParams.get('xEmail')).toBe('moshe@example.com');
    expect(u.searchParams.get('xBillStreet')).toBe('הרב קוק 5');
    expect(u.searchParams.get('xBillCity')).toBe('ירושלים');
    expect(u.searchParams.get('xBillZip')).toBe('9534311');
    for (const k of ['xAmount', 'xamount', 'amount', 'Zeout', 'name']) expect(u.searchParams.get(k)).toBeNull();
  });
  it('זיהוי-מארח: cardknox/solapayments בלבד (מארח מתחזה ⇒ ספק-כללי)', () => {
    expect(new URL(payLink('https://paymentsite.cardknox.com/x', 0, P)!).searchParams.get('xEmail')).toBe(P.email);
    expect(new URL(payLink('https://pay.solapayments.com/x', 0, P)!).searchParams.get('xEmail')).toBe(P.email);
    const evil = new URL(payLink('https://cardknox.com.evil.example/x', 0, P)!);
    expect(evil.searchParams.get('xEmail')).toBeNull();
    expect(evil.searchParams.get('name')).toBe('משה כהן');
  });
});

describe('ספק-כללי ותבנית — ללא שינוי', () => {
  it('amount/name בלבד; תבנית {amount}/{name}; לא-https ⇒ null', () => {
    const g = new URL(payLink('https://pay.example.org/d', 50, P)!);
    expect([...g.searchParams.keys()].sort()).toEqual(['amount', 'name']);
    expect(payLink('https://pay.example.org/d?s={amount}&n={name}', 50, P)).toBe('https://pay.example.org/d?s=50&n=%D7%9E%D7%A9%D7%94%20%D7%9B%D7%94%D7%9F');
    expect(payLink('http://x.example', 1, P)).toBeNull();
  });
});

describe('🧑 פרטי-המשלם', () => {
  it('תורם: טלפון ראשי, אחרת הראשון מהנוספים; כתובת/עיר/ת"ז', () => {
    const sp = { name: 'א', phone: '', phones: [{ num: '' }, { num: '052-7654321' }], email: 'a@b.co', address: 'רחוב 1', city: 'בני ברק', idNum: '1' };
    expect(supporterPayPerson(sp)).toEqual({ name: 'א', phone: '052-7654321', email: 'a@b.co', street: 'רחוב 1', city: 'בני ברק', idNum: '1' });
    expect(supporterPayPerson({ ...sp, phone: '03-1111111' }).phone).toBe('03-1111111');
  });
  it('חוג: פרטי-המשפחה, נפילה לטלפון-החבר, **בלי ת"ז** (ת"ז-הילד אינה של המשלם)', () => {
    const pp = familyPayPerson('דני · לוי', { phone: '', phone2: '054-0000000', email: 'f@x.co', address: 'א 2', city: 'צפת' }, { phone: '058-1111111' });
    expect(pp).toEqual({ name: 'דני · לוי', phone: '058-1111111', email: 'f@x.co', street: 'א 2', city: 'צפת' });
    expect('idNum' in pp).toBe(false);
  });
});

describe('🌍 עמוד-סולה של מאור כברירת-מחדל («תקבע בתוכנה»)', () => {
  it('הוזן באשף ⇒ גובר; משרד מאור (mavr-hchsd) ⇒ ברירת-המחדל; ארגון אחר ⇒ אין', () => {
    expect(orgSolaPayUrl('https://secure.cardknox.com/other', 'mavr-hchsd')).toBe('https://secure.cardknox.com/other');
    expect(orgSolaPayUrl('', 'mavr-hchsd')).toBe(SOLA);
    expect(orgSolaPayUrl(undefined, 'maor-hachesed')).toBe(SOLA);
    expect(orgSolaPayUrl('', 'some-org')).toBe('');
    expect(orgSolaPayUrl('', undefined)).toBe('');
  });
});

describe('🔌 חיווט — כל הכפתורים מעבירים את כל הפרטים, וסולה בכל מקום', () => {
  it('אף משטח לא שולח רק שם', () => {
    for (const src of [supDetail, dialer, ayin]) {
      expect(src).not.toMatch(/payLink\([^;]*,\s*sp\.name\)/);
      expect(src).toMatch(/orgPayWho\((config|cfg)\.slug, supporterPayPerson\(sp\)\)/);
      expect(src).toContain("orgSolaPayUrl(integrationSetting(");
    }
    expect(manage).toContain('payLink(integrationSetting(cfg, \'payments\', \'payUrl\'), bal, payPerson)');
    expect(manage).toContain("orgPayWho(cfg.slug, familyPayPerson(");
    expect(collection).toContain('orgPayWho(config.slug, familyPayPerson(');
    expect(manage).toContain("payLink(orgSolaPayUrl(integrationSetting(cfg, 'payments', 'solaPayUrl'), cfg.slug), bal, payPerson)");
    expect(collection).toContain('payLink(payUrl, r.bal, personOf(r.memberId, r.name))');
    expect(collection).toContain('payLink(solaPayUrl, r.bal, personOf(r.memberId, r.name))');
  });
  it('לוח מעקב-הטיפול: כפתור סולה לצד נדרים', () => {
    expect(ayin).toContain('💳 תשלום בסולה (חו״ל)');
    expect(ayin).toMatch(/\{!a\.paid && ayinSolaHref && \(/);
  });
});

describe('🔒 «רק מאור» — שאר הלקוחות ביט-זהים להיום', () => {
  it('מאור (המשרד mavr-hchsd / האתר maor-hachesed) ⇒ כל הפרטים; ארגון אחר/ללא ⇒ שם בלבד', () => {
    expect(orgPayWho('mavr-hchsd', P)).toBe(P);
    expect(orgPayWho('maor-hachesed', P)).toBe(P);
    expect(orgPayWho('other-org', P)).toBe('משה כהן');
    expect(orgPayWho('default', P)).toBe('משה כהן');
    expect(orgPayWho(undefined, P)).toBe('משה כהן');
  });
  it('שם בלבד = הקישור הישן בדיוק: נדרים Amount+ClientName; סולה/אחר amount+name', () => {
    expect(payLink(NED, 180, orgPayWho('other-org', P))).toBe(NED + '&Amount=180&ClientName=%D7%9E%D7%A9%D7%94+%D7%9B%D7%94%D7%9F');
    const sola = new URL(payLink(SOLA, 500, orgPayWho('other-org', P))!);
    expect([...sola.searchParams.entries()]).toEqual([['amount', '500'], ['name', 'משה כהן']]);
  });
});
