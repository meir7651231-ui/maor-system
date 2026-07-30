/**
 * ratchet — שלד מודול הקופות (קופות 2).
 * (א) חוזה הדגלים: modules.tzedaka=false משרשר כיבוי לכל tzedaka.* —
 *     tzedaka נכנס ל-NAV_MODULE_KEYS.
 * (ב) הגנת-מקור: NAV מכיל 'tzedaka' ו-VIEWS ממפה אותו ל-TzedakaView.
 */
import { describe, expect, it } from 'vitest';
import { featureOn } from '../../../lib/config';
import { DEFAULT_CONFIG } from '../../../types/config';
import appSrc from '../../../App.tsx?raw';

describe('🪙 ratchet — קופות 2: שלד המודול', () => {
  it('(א) כיבוי המודול משרשר לדגלים העדינים; דלוק = מפתח חסר פעיל', () => {
    const off = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules, tzedaka: false } };
    expect(featureOn(off, 'tzedaka.score')).toBe(false);
    expect(featureOn(off, 'tzedaka.calendar')).toBe(false);
    const on = { ...DEFAULT_CONFIG, modules: { ...DEFAULT_CONFIG.modules } };
    expect(featureOn(on, 'tzedaka.score')).toBe(true);
    expect(featureOn(on, 'tzedaka.showcase')).toBe(true);
  });

  it('(ב) הגנת-מקור: NAV ו-VIEWS מחווטים ל-tzedaka', () => {
    expect(appSrc).toContain("{ view: 'tzedaka', icon: '🪙', label: 'קופות צדקה' }");
    expect(appSrc).toContain('tzedaka: TzedakaView');
  });
});
