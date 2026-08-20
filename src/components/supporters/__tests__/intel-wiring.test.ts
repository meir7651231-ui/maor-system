/**
 * ratchet — חיווט מרכז-המודיעין. אותו אינווריאנט קריטי כמו הקוקפיט: **opt-in
 * מפורש** (`=== true`, לא featureOn), ואפס-השפעה על הלקוח-החי בלי הדגל.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import intelSrc from '../SupportersIntel.tsx?raw';

describe('💛 ratchet — חיווט מרכז-המודיעין (opt-in)', () => {
  it('🛡 גידור opt-in מפורש: === true ולא featureOn', () => {
    expect(viewSrc).toContain("config.features?.['supporters.intel'] === true");
    expect(viewSrc).not.toContain("featureOn(config, 'supporters.intel')");
  });

  it('🛡 מתג + נפרס רק כש-opt-in וגם במצב-מודיעין, מנתב לכרטיס', () => {
    expect(viewSrc).toContain('📊 מודיעין');
    expect(viewSrc).toContain('if (intelOn && intelMode) {');
    expect(viewSrc).toContain('<SupportersIntel');
    expect(viewSrc).toContain('onExit={() => setIntelMode(false)}');
    expect(viewSrc).toContain('visibleSupportersForDesignations(db.supporters, desigLimit)');
  });

  it('🛡 המסך נהוג מהמנועים הטהורים (donorIntel + portfolioIntel)', () => {
    expect(intelSrc).toContain('donorIntel(');
    expect(intelSrc).toContain('portfolioIntel(');
    // memoized ⇒ ביצועים על עשרות-אלפים
    expect(intelSrc).toContain('useMemo(');
  });

  it('🛡 רצועת-הקוהורטה נהוגה מהמנועים (מיגרציה · פעילות · פיזור-ציון)', () => {
    expect(intelSrc).toContain('tierTrendCounts(');
    expect(intelSrc).toContain('activeByMonth(');
    expect(intelSrc).toContain('<CohortBand');
    expect(intelSrc).toContain('scoreBins={portfolio.scoreBins}');
  });
});
