/**
 * ratchet — חיווט גלקסיית-התורמים. opt-in מפורש (=== true, לא featureOn),
 * אפס-השפעה בלי הדגל; נהוגה מהמנוע הטהור + מכבדת prefers-reduced-motion.
 */
import { describe, expect, it } from 'vitest';
import viewSrc from '../SupportersView.tsx?raw';
import galaxySrc from '../SupportersGalaxy.tsx?raw';

describe('💛 ratchet — חיווט גלקסיית-התורמים (opt-in)', () => {
  it('🛡 גידור opt-in מפורש: === true ולא featureOn', () => {
    expect(viewSrc).toContain("config.features?.['supporters.galaxy'] === true");
    expect(viewSrc).not.toContain("featureOn(config, 'supporters.galaxy')");
  });

  it('🛡 מתג + נפרס רק כש-opt-in וגם במצב-גלקסיה, מנתב לכרטיס', () => {
    expect(viewSrc).toContain('🌌 גלקסיה');
    expect(viewSrc).toContain('if (galaxyOn && galaxyMode) {');
    expect(viewSrc).toContain('<SupportersGalaxy');
    expect(viewSrc).toContain('onExit={() => setGalaxyMode(false)}');
  });

  it('🛡 נהוגה מהמנוע הטהור + ביצועים + נגישות', () => {
    expect(galaxySrc).toContain('donorConstellation(');
    expect(galaxySrc).toContain('RENDER_CAP'); // תקרת-רינדור לביצועים
    expect(galaxySrc).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(galaxySrc).toContain('cancelAnimationFrame'); // ניקוי הלולאה
  });
});
