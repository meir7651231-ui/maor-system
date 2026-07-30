/**
 * ratchet — CONNECT חיבור 1: העמודות המבודדות בפלטת החיפוש.
 * כל בלוק מגודר moduleOn (מודול כבוי ⇒ אפס תוצאות שלו — דפוס familiesOn
 * הקיים); המונחים דרך termOf; הפעולה ניווט לעמודה בלבד (בלי deep-link).
 */
import { describe, expect, it } from 'vitest';
import paletteSrc from '../palette/CommandPalette.tsx?raw';

describe('🔌 ratchet — חיבור 1: פלטה', () => {
  it('בלוקי tzedaka/shop מגודרים moduleOn — מודול כבוי לא מאנדקס כלום', () => {
    expect(paletteSrc).toContain("moduleOn(config, 'tzedaka')");
    expect(paletteSrc).toContain("moduleOn(config, 'shop')");
    expect(paletteSrc).toMatch(/tzedakaOn \? db\.tzCoordinators : \[\]/);
    expect(paletteSrc).toMatch(/tzedakaOn \? db\.tzBoxes : \[\]/);
    expect(paletteSrc).toMatch(/shopOn \? db\.shopProducts : \[\]/);
    expect(paletteSrc).toMatch(/shopOn \? db\.shopItems : \[\]/);
    expect(paletteSrc).toMatch(/shopOn \? db\.shopAssignments : \[\]/);
  });

  it('מונחים דרך termOf; קופה נמצאת ב-#num; הפעולה — ניווט לעמודה', () => {
    expect(paletteSrc).toContain("termOf(config, 'entity.tzCoordinator', 'רכז')");
    expect(paletteSrc).toContain("termOf(config, 'entity.shopProduct', 'מוצר')");
    expect(paletteSrc).toContain("termOf(config, 'entity.shopItem', 'פריט')");
    expect(paletteSrc).toContain("'#' + b.num");
    expect(paletteSrc).toMatch(/go\('tzedaka'\)/);
    expect(paletteSrc).toMatch(/go\('shop'\)/);
    // שיוכים מאונדקסים לפי שם משפחת המוטב (beneficiaryLabel — lib טהור)
    expect(paletteSrc).toContain('beneficiaryLabel(db, a)');
  });
});
