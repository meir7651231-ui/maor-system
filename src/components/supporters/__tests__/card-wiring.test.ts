/**
 * ratchet — כרטיס-התורם המאוחד (opt-in). מעטפת-לשוניות שמרנדרת את הכרטיס-הקיים
 * verbatim + לשונית-מודיעין. גידור מפורש `=== true` ⇒ כבוי = הכרטיס הרגיל ביט-זהה.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import cardSrc from '../SupporterCard.tsx?raw';

describe('💛 ratchet — כרטיס-תורם מאוחד (opt-in)', () => {
  it('🛡 גידור opt-in מפורש: === true ולא featureOn', () => {
    expect(viewSrc).toContain("config.features?.['supporters.card'] === true");
    expect(viewSrc).not.toContain("featureOn(config, 'supporters.card')");
  });

  it('🛡 כבוי = הכרטיס הרגיל; דלוק = הכרטיס המאוחד (בורר-cardOn)', () => {
    expect(viewSrc).toContain('cardOn');
    expect(viewSrc).toContain('<SupporterCard');
    expect(viewSrc).toContain('<SupporterDetail supporter={selected}');
  });

  it('🛡 המעטפת מרנדרת את SupporterDetail הקיים verbatim (אפס-שכפול)', () => {
    expect(cardSrc).toContain('<SupporterDetail supporter={props.supporter} onBack={props.onBack} />');
  });

  it('🛡 לשונית-המודיעין נהוגה מהמנועים הטהורים', () => {
    expect(cardSrc).toContain('donorIntel(');
    expect(cardSrc).toContain('donorRhythm(');
    expect(cardSrc).toContain('donorSignals(');
    expect(cardSrc).toContain('donorRanks(');
  });
});
