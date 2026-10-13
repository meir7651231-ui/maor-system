/**
 * ratchet — נעילת-ניהול ללקוח החי (תיקון-אבטחה 1.8.2026, הכרעת בעלים "רק אני מנהל").
 * היה באג: `public/c/maor-hachesed/config.json` בלי adminEmails ⇒ isAdminUser
 * החזיר true לכל מי שנכנס. עכשיו adminEmails = הבעלים בלבד.
 */
import { describe, expect, it } from 'vitest';
import { isAdminUser } from '../config';
import { DEFAULT_LOCK_ZONES } from '../lock';
import liveCfg from '../../../public/c/maor-hachesed/config.json';
import appSrc from '../../App.tsx?raw';

// swarm-b (N3, 3.9.2026): אזור-הנעילה 'wizard' הוגדר ב-DEFAULT_LOCK_ZONES (והוצג כמתג
// ב-SecuritySection) אך לא נאכף מעולם — adminNeededFor נקרא רק עם `view`. האשף נפתח
// בלי הקוד המשני. עכשיו ענף-האשף ב-App מגודר adminNeededFor('wizard') ⇒ LockScreen משני.
describe('🔒 ratchet — אזור-הנעילה wizard נאכף באשף', () => {
  it("DEFAULT_LOCK_ZONES כולל 'wizard' ו-App מגדר את האשף ב-adminNeededFor('wizard')", () => {
    expect(DEFAULT_LOCK_ZONES).toContain('wizard');
    expect(appSrc).toContain("adminNeededFor('wizard')");
    expect(appSrc).toMatch(/adminNeededFor\('wizard'\) \? \([\s\S]{0,600}<LockScreen kind="secondary" onUnlock=\{onAdminUnlock\} \/>/);
  });
});

describe('🔒 ratchet — נעילת-ניהול ללקוח החי', () => {
  it('config.json של maor-hachesed נועל את הניהול (adminEmails לא ריק)', () => {
    expect(Array.isArray(liveCfg.adminEmails)).toBe(true);
    expect(liveCfg.adminEmails.length).toBeGreaterThan(0);
    expect(liveCfg.adminEmails).toContain('meir7651231@gmail.com');
  });

  it('isAdminUser: רק המייל המורשה מנהל; אחר/ריק — לא', () => {
    const cfg = liveCfg as unknown as Parameters<typeof isAdminUser>[0];
    expect(isAdminUser(cfg, 'meir7651231@gmail.com')).toBe(true);
    expect(isAdminUser(cfg, 'MEIR7651231@GMAIL.COM')).toBe(true); // case-insensitive
    expect(isAdminUser(cfg, 'someone-else@example.com')).toBe(false);
    expect(isAdminUser(cfg, null)).toBe(false);
  });
});
