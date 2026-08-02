/**
 * ratchet — נעילת-ניהול ללקוח החי (תיקון-אבטחה 1.8.2026, הכרעת בעלים "רק אני מנהל").
 * היה באג: `public/c/maor-hachesed/config.json` בלי adminEmails ⇒ isAdminUser
 * החזיר true לכל מי שנכנס. עכשיו adminEmails = הבעלים בלבד.
 */
import { describe, expect, it } from 'vitest';
import { isAdminUser } from '../config';
import liveCfg from '../../../public/c/maor-hachesed/config.json';

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
