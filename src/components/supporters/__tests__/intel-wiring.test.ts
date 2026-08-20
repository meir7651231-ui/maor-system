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

  it('🛡 מכונת-הזמן מחווטת מהמנוע הטהור (timeMachine + סרגל-אופק)', () => {
    expect(intelSrc).toContain('timeMachine(props.supporters');
    expect(intelSrc).toContain('<TimeBand');
    // memoized ⇒ הקרנה על עשרות-אלפים בלי סריקה-חוזרת
    expect(intelSrc).toContain('machine = useMemo(');
  });

  it('🛡 מפת-העונתיות מחווטת מהמנוע הטהור (seasonality)', () => {
    expect(intelSrc).toContain('seasonality(props.supporters');
    expect(intelSrc).toContain('<SeasonBand');
    expect(intelSrc).toContain('season = useMemo(');
  });

  it('🛡 לוח-האותות מחווט מהמנוע הטהור (portfolioSignals)', () => {
    expect(intelSrc).toContain('portfolioSignals(props.supporters');
    expect(intelSrc).toContain('<SignalsBand');
    expect(intelSrc).toContain('signals = useMemo(');
  });

  it('🛡 ייצוא-CSV מגודר core.export + נהוג מ-intelCsvRows', () => {
    expect(intelSrc).toContain("featureOn(props.config, 'core.export')");
    expect(intelSrc).toContain('intelCsvRows(props.supporters');
    expect(intelSrc).toContain('downloadCsv(');
  });

  it('🛡 כרטיס-הצלילה מועשר בקצב-עונתי + אותות פר-תורם', () => {
    expect(intelSrc).toContain('donorRhythm(sp');
    expect(intelSrc).toContain('donorSignals(sp');
  });

  it('🛡 דירוג/אחוזון מחווט מהמנוע הטהור (donorRanks) לכרטיס-הצלילה', () => {
    expect(intelSrc).toContain('donorRanks(props.supporters');
    expect(intelSrc).toContain('rank={ranks.get(');
    expect(intelSrc).toContain('ranks = useMemo(');
  });
});
