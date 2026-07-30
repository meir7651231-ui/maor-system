/**
 * ratchet — הטיפול המשרדי (חנות 6).
 * הגנת-מקור: HomeTab ניזון מ-needsCare/upcomingHolidays של המודול בלבד,
 * כל שורת טיפול נפתחת ל-RedeemModal, ואפס נגיעה בעולם הקבלות/התרומות.
 */
import { describe, expect, it } from 'vitest';
import homeSrc from '../HomeTab.tsx?raw';

describe('🛍 ratchet — חנות 6: טיפול משרדי', () => {
  it('🛡 בידוד: אפס נגיעה בקבלות/תרומות/לוח הראשי (הכרעת בעלים 30.7)', () => {
    expect(homeSrc).not.toMatch(/from '.*supporters/);
    expect(homeSrc).not.toMatch(/from '.*receipt/);
    expect(homeSrc).not.toContain('addDonation');
    expect(homeSrc).not.toContain('upsertEvent');
  });

  it('שורות הטיפול והמימוש המהיר נפתחים ל-RedeemModal; חגים עם מונה ממתינות', () => {
    expect(homeSrc).toContain('needsCare(db, today)');
    expect(homeSrc).toContain('upcomingHolidays(today, 45)');
    expect(homeSrc).toContain('RedeemModal');
    expect(homeSrc).toContain('מתנות ממתינות');
    expect(homeSrc).toContain('🎁 מימוש מהיר');
  });
});
