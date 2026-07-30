/**
 * ratchet — CONNECT חיבור 5: העמודות החדשות במדריך ובסיור.
 * הגייטינג הקיים (module על הצעד/הסעיף) עובד לבד: מודול כבוי ⇒ הצעד
 * והסעיף לא מופיעים.
 */
import { describe, expect, it } from 'vitest';
import { tourSteps, TOUR_STEPS } from '../tour';
import { guideSections, GUIDE_SECTIONS } from '../guide';

describe('🔌 ratchet — חיבור 5: מדריך וסיור', () => {
  it('הסיור כולל צעד לכל עמודה; מודול כבוי ⇒ הצעד נעלם', () => {
    expect(TOUR_STEPS.some((s) => s.view === 'tzedaka' && s.module === 'tzedaka')).toBe(true);
    expect(TOUR_STEPS.some((s) => s.view === 'shop' && s.module === 'shop')).toBe(true);
    const allOn = tourSteps(() => true);
    expect(allOn.some((s) => s.view === 'shop')).toBe(true);
    const shopOff = tourSteps((m) => m !== 'shop');
    expect(shopOff.some((s) => s.view === 'shop')).toBe(false);
    expect(shopOff.some((s) => s.view === 'tzedaka')).toBe(true);
  });

  it('המדריך כולל סעיף לכל עמודה (term דרך nav.*); מודול כבוי ⇒ הסעיף נעלם', () => {
    expect(GUIDE_SECTIONS.some((s) => s.module === 'tzedaka' && s.term === 'nav.tzedaka')).toBe(true);
    expect(GUIDE_SECTIONS.some((s) => s.module === 'shop' && s.term === 'nav.shop')).toBe(true);
    const tzOff = guideSections((m) => m !== 'tzedaka');
    expect(tzOff.some((s) => s.module === 'tzedaka')).toBe(false);
    expect(tzOff.some((s) => s.module === 'shop')).toBe(true);
  });
});
