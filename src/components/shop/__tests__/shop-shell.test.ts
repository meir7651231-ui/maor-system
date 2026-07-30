/**
 * ratchet — שלד מודול החנות (חנות 2).
 * (א) חוזה הדגלים: modules.shop=false משרשר כיבוי לכל shop.* —
 *     shop נכנס ל-NAV_MODULE_KEYS.
 * (ב) הגנת-מקור: NAV מכיל 'shop' ו-VIEWS ממפה אותו ל-ShopView.
 */
import { describe, expect, it } from 'vitest';
import { featureOn } from '../../../lib/config';
import { DEFAULT_CONFIG } from '../../../types/config';
import appSrc from '../../../App.tsx?raw';

describe('🛍 ratchet — חנות 2: שלד המודול', () => {
  it('(א) כיבוי המודול משרשר לדגלים העדינים; דלוק = מפתח חסר פעיל', () => {
    const off = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, shop: false } };
    expect(featureOn(off, 'shop.stores')).toBe(false);
    expect(featureOn(off, 'shop.calendar')).toBe(false);
    const on = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules } };
    expect(featureOn(on, 'shop.stores')).toBe(true);
    expect(featureOn(on, 'shop.showcase')).toBe(true);
  });

  it('(ב) הגנת-מקור: NAV ו-VIEWS מחווטים ל-shop', () => {
    expect(appSrc).toContain("{ view: 'shop', icon: '🛍', label: 'חנות' }");
    expect(appSrc).toContain('shop: ShopView');
  });
});
