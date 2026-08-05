/**
 * ratchet — ריפוי-לשונית-תקועה (5.8.2026): לקוחות עם לשונית פתוחה ימים ראו
 * גרסה עתיקה (מסך-Passkey שנמחק). האפליקציה משווה מול version.json בכל
 * חזרה-ללשונית ומרעננת פעם-אחת פר-גרסה.
 */
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';
import viteCfg from '../../../vite.config.ts?raw';

describe('🔄 ratchet — ריפוי-לשונית-תקועה', () => {
  it('ה-build מטביע מזהה וכותב version.json; האפליקציה בודקת בחזרה-ללשונית', () => {
    expect(viteCfg).toContain('__BUILD_ID__');
    expect(viteCfg).toContain("'version.json'");
    expect(appSrc).toContain("fetch(import.meta.env.BASE_URL + 'version.json', { cache: 'no-store' })");
    expect(appSrc).toContain("document.addEventListener('visibilitychange', check)");
  });

  it('🛡 רענון פעם-אחת פר-גרסה (שומר-ריצה) — בלי לולאת-רענונים', () => {
    // הסכנה: מתווך/מטמון שמגיש version.json ישן היה מרענן בלי סוף — השומר חוסם
    expect(appSrc).toMatch(/maor_ver_reload:[\s\S]{0,120}sessionStorage\.getItem\(key\)/);
    expect(appSrc).toMatch(/setItem\(key, '1'\);\s*\n\s*window\.location\.reload\(\)/);
  });
});
