/**
 * ratchet — התראת "תורמים בסיכון-נטישה" בבית + נחיתה-על-סגמנט מסונן.
 * הבית מתריע על הבינה החדשה, והקליק נוחת על מסך-התורמים כשהוא מסונן ל-atrisk.
 */
import { describe, expect, it } from 'vitest';
import homeSrc from '../homeData.ts?raw';
import homeViewSrc from '../HomeView.tsx?raw';
import viewSrc from '../../supporters/SupportersView.tsx?raw';
import segSrc from '../../supporters/segments.ts?raw';

describe('💛 ratchet — התראת-סיכון בבית → סגמנט מסונן', () => {
  it('🛡 בית: פריט-סיכון מגודר מודול-תורמים + דגל-הבינה, מנתב seg:atrisk', () => {
    expect(homeSrc).toContain('cockpitAtRisk(db.supporters');
    expect(homeSrc).toContain('בסיכון-נטישה');
    expect(homeSrc).toContain("nav: { kind: 'supporters', seg: 'atrisk' }");
    // מגודר: cockpit או intel (רק ארגון שהדליק את הבינה)
    expect(homeSrc).toContain("featureOn(config, 'supporters.cockpit')");
  });

  it('🛡 HomeView מעביר את הסגמנט לפני המעבר', () => {
    expect(homeViewSrc).toContain('requestSupportersSegment(nav.seg)');
  });

  it('🛡 מסך-התורמים קורא את בקשת-הסגמנט באתחול', () => {
    expect(viewSrc).toContain('takeSupportersSegment()');
  });

  it('🛡 בקשת-הסגמנט חד-פעמית (מוחקת אחרי קריאה)', () => {
    // הגנת-מקור: take קורא-ומוחק (sessionStorage.removeItem) ⇒ לא נדבק בין כניסות
    expect(segSrc).toContain('sessionStorage.setItem(SUP_SEG_KEY');
    expect(segSrc).toContain('sessionStorage.removeItem(SUP_SEG_KEY)');
  });
});
