/**
 * ratchet — 🚪 שער-ההצטרפות בעמוד-השיווק (פאזה 1): מנוע-טהור portal.ts (נוסח-בקשה,
 * ולידציה, ערוצים רב-מסלוליים) + חיווט/גידור (PortalEntry + PublicSite מגודר shell.portal,
 * נוסף לצד הכניסה הקיימת — אפס-מחיקה).
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../../types/config';
import type { OrgConfig } from '../../../types/config';
import { EMPTY_PORTAL_FORM, portalChannels, portalHasChannels, portalMessage, portalValid, type PortalForm } from '../portal';
import entrySrc from '../PortalEntry.tsx?raw';
import siteSrc from '../PublicSite.tsx?raw';

function cfg(contact: Partial<NonNullable<NonNullable<OrgConfig['site']>['contact']>>): OrgConfig {
  return { ...DEFAULT_CONFIG, orgName: 'מאור', site: { contact } } as OrgConfig;
}
const form: PortalForm = { childName: 'דנה', parentName: 'רות', phone: '050-1234567', course: 'ציור', note: '' };

describe('🚪 שער-ההצטרפות — מנוע', () => {
  it('portalValid: שם-ילד/ה (≥2) + טלפון (≥6 ספרות) חובה', () => {
    expect(portalValid(form)).toBe(true);
    expect(portalValid({ ...EMPTY_PORTAL_FORM })).toBe(false);
    expect(portalValid({ ...form, phone: '123' })).toBe(false);
    expect(portalValid({ ...form, childName: 'א' })).toBe(false);
  });

  it('portalMessage: נוסח מסודר עם ילד/טלפון/חוג, מדלג על ריקים', () => {
    const msg = portalMessage('מאור', form);
    expect(msg).toContain('בקשת הרשמה לחוג — מאור');
    expect(msg).toContain('ילד/ה: דנה');
    expect(msg).toContain('טלפון: 050-1234567');
    expect(msg).toContain('חוג מבוקש: ציור');
    expect(msg).not.toContain('הערה:'); // ריק ⇒ מדולג
  });

  it('portalChannels: WhatsApp+SMS+טלפון מטלפון, מייל ממייל — client-side', () => {
    const ch = portalChannels(cfg({ whatsapp: '0501234567', phones: ['025556677'], email: 'a@b.org' }), 'מאור', form);
    const keys = ch.map((c) => c.key);
    expect(keys).toContain('whatsapp');
    expect(keys).toContain('sms');
    expect(keys).toContain('phone');
    expect(keys).toContain('email');
    expect(ch.find((c) => c.key === 'whatsapp')!.href).toContain('wa.me/');
    expect(ch.find((c) => c.key === 'sms')!.href).toMatch(/^sms:/);
    expect(ch.find((c) => c.key === 'phone')!.href).toMatch(/^tel:/);
    expect(ch.find((c) => c.key === 'email')!.href).toMatch(/^mailto:a@b\.org/);
  });

  it('portalHasChannels: false בלי contact, true עם ולו ערוץ-אחד', () => {
    expect(portalHasChannels(DEFAULT_CONFIG)).toBe(false);
    expect(portalHasChannels(cfg({ whatsapp: '0501234567' }))).toBe(true);
  });
});

describe('🛡 הגנות-מקור — שער-ההצטרפות מחווט, מגודר, ונוסף-לצד (אפס-מחיקה)', () => {
  it('PortalEntry: שתי דלתות (הורים→טופס · צוות→onEnter) + שליחה רב-ערוצית', () => {
    expect(entrySrc).toContain('portalChannels(config, orgName, form)');
    expect(entrySrc).toContain('onEnter()'); // דלת-הצוות מובילה לכניסה הקיימת
    expect(entrySrc).toContain('👪');
    expect(entrySrc).toContain('🔑');
  });
  it('PublicSite: מגודר opt-in shell.portal + מרנדר לצד הכניסה הקיימת (onEnter נשמר)', () => {
    expect(siteSrc).toContain("config.features?.['shell.portal'] === true");
    expect(siteSrc).toContain('{portalOn && <PortalEntry onEnter={onEnter} />}');
    // אפס-מחיקה: כפתור-הכניסה הקיים ב-nav נשאר
    expect(siteSrc).toContain('onClick={onEnter}');
  });
});
