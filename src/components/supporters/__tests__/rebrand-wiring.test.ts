/**
 * ratchet — ריברנד: רצועת-KPI חיה מעל הטבלה הקיימת. opt-in מפורש (=== true, לא
 * featureOn) ⇒ בלי הדגל הטבלה ביט-זהה להיום. הצ׳יפים מסננים את הטבלה הקיימת.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import stripSrc from '../SupportersKpiStrip.tsx?raw';

describe('💛 ratchet — ריברנד (רצועת-KPI, opt-in)', () => {
  it('🛡 גידור opt-in מפורש: === true ולא featureOn', () => {
    expect(viewSrc).toContain("config.features?.['supporters.rebrand'] === true");
    expect(viewSrc).not.toContain("featureOn(config, 'supporters.rebrand')");
  });

  it('🛡 הרצועה נפרסת מעל הטבלה רק בדגל, ומחוברת לסינון הקיים', () => {
    expect(viewSrc).toContain('{rebrandOn && (');
    expect(viewSrc).toContain('<SupportersKpiStrip');
    // הצ׳יפים משתמשים בסטייט-הסינון הקיים (אפס כפילות)
    // ⚠️ ביקורת (12.10): הקולבקים יציבים (useCallback) — אותה כוונה: צ'יפ-דרגה ⇒ tierF, הו"ק ⇒ hokF='due'
    expect(viewSrc).toContain('const onKpiTier = useCallback((t: string) => setTierF(tierF === t ? null : t), [tierF, setTierF]);');
    expect(viewSrc).toContain("const onKpiHokDue = useCallback(() => setHokF(hokF === 'due' ? null : 'due'), [hokF, setHokF]);");
    expect(viewSrc).toContain('onTier={onKpiTier}');
    expect(viewSrc).toContain('onHokDue={onKpiHokDue}');
  });

  it('🛡 הרצועה נהוגה מהמנועים הטהורים (portfolioIntel + cockpitCollectedThisMonth)', () => {
    expect(stripSrc).toContain('portfolioIntel(');
    expect(stripSrc).toContain('cockpitCollectedThisMonth(');
    expect(stripSrc).toContain('useMemo(');
  });
});
