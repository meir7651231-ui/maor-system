/**
 * ratchet — CONNECT חיבור 2: פאנלי העמודות בכרטיס המשפחה.
 * תצוגה בלבד: אפס פעולות כתיבה בפאנלים (הגנת-מקור); מגודרים בדגלים
 * tzedaka.familypanel / shop.familypanel (module='tzedaka'/'shop' ⇒
 * כיבוי המודול משרשר ומעלים את הפאנל).
 */
import { describe, expect, it } from 'vitest';
import { featureOn } from '../../lib/config';
import { DEFAULT_CONFIG } from '../../types/config';
import { FEATURES } from '../../types/features';
import tzPanelSrc from '../tzedaka/TzFamilyPanel.tsx?raw';
import shopPanelSrc from '../shop/ShopFamilyPanel.tsx?raw';
import detailSrc from '../families/FamilyDetail.tsx?raw';

describe('🔌 ratchet — חיבור 2: פאנלי כרטיס המשפחה', () => {
  it('🛡 תצוגה בלבד — אפס פעולות כתיבה בפאנלים', () => {
    for (const src of [tzPanelSrc, shopPanelSrc]) {
      expect(src).not.toMatch(/\bupsert[A-Z]/);
      expect(src).not.toMatch(/\bdelete[A-Z]/);
      expect(src).not.toContain('addTz');
      expect(src).not.toContain('addShop');
      expect(src).not.toContain('setDb');
      expect(src).toContain('פתח בעמודה');
    }
  });

  it('הדגלים קיימים עם module נכון — כיבוי המודול משרשר ומעלים את הפאנל', () => {
    expect(FEATURES.find((f) => f.key === 'tzedaka.familypanel')?.module).toBe('tzedaka');
    expect(FEATURES.find((f) => f.key === 'shop.familypanel')?.module).toBe('shop');
    const off = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, tzedaka: false, shop: false } };
    expect(featureOn(off, 'tzedaka.familypanel')).toBe(false);
    expect(featureOn(off, 'shop.familypanel')).toBe(false);
    expect(detailSrc).toContain("featureOn(config, 'tzedaka.familypanel') && <TzFamilyPanel");
    expect(detailSrc).toContain("featureOn(config, 'shop.familypanel') && <ShopFamilyPanel");
  });
});
