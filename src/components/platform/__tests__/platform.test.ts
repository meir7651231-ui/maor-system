/**
 * ratchet — לוח הבקרה של הבעלים (CLOUD2 ענן 4).
 * ‏slugify טהור (עברית→לטינית, ייחודיות); קונפיג-הלידה all-off — כל 8
 * המודולים false **מפורש** (לא "חסר=דלוק"); הגנות-מקור: הפאנל מאחורי
 * מייל-על (#platform, דפוס #builder), כל מתג נכתב מיד לענן.
 */
import { describe, expect, it } from 'vitest';
import { ALL_MODULES, allOffConfig, isValidSlug, orgLink, slugify } from '../lib';
import appSrc from '../../../App.tsx?raw';
import panelSrc from '../PlatformPanel.tsx?raw';

describe('☁️ ratchet — ענן 4: לוח הבקרה', () => {
  it('slugify: עברית→לטינית, ניקוי, ייחודיות עם סיומת מספרית', () => {
    expect(slugify('עמותת אור', [])).toBe('amvtt-avr');
    expect(isValidSlug(slugify('עמותת אור', []))).toBe(true);
    // תפוס ⇒ ‎-2, וגם הוא תפוס ⇒ ‎-3
    expect(slugify('עמותת אור', ['amvtt-avr'])).toBe('amvtt-avr-2');
    expect(slugify('עמותת אור', ['amvtt-avr', 'amvtt-avr-2'])).toBe('amvtt-avr-3');
    // לטינית נשארת; רווחים/סימנים ⇒ מקפים; ריק ⇒ org
    expect(slugify('Test Demo!', [])).toBe('test-demo');
    expect(slugify('', [])).toBe('org');
    expect(isValidSlug('UPPER')).toBe(false);
    expect(isValidSlug('ab')).toBe(true);
  });

  it('קונפיג-הלידה all-off: כל 8 המודולים false מפורש — מסך כמעט ריק ללקוח חדש', () => {
    const c = allOffConfig('test-demo', 'עמותת בדיקה');
    expect(ALL_MODULES).toHaveLength(8);
    for (const m of ALL_MODULES) expect(c.modules[m], m).toBe(false);
    expect(c.slug).toBe('test-demo');
    expect(c.orgName).toBe('עמותת בדיקה');
    expect(c.features).toEqual({});
    expect(c.terms).toEqual({});
  });

  it('orgLink: ‏{origin}{base}?org={slug}', () => {
    expect(orgLink('https://x.github.io', '/maor-system/', 'test-demo')).toBe('https://x.github.io/maor-system/?org=test-demo');
  });

  it('🛡 הגנת-מקור: הפאנל מאחורי מייל-על (#platform); משתמש אחר מקבל אין-הרשאה', () => {
    expect(appSrc).toContain("hash === '#platform'");
    expect(appSrc).toMatch(/isAdmin && isSuperAdmin\(cloud\.user\?\.email\)/);
    expect(appSrc).toContain('למנהל הפלטפורמה בלבד');
  });

  it('הגנת-מקור: העריכה החיה — כל מתג נכתב מיד לענן; "שמור — הוקם" ⇒ provisioned', () => {
    expect(panelSrc).toContain('writeOrgCloudConfig(sel, next)');
    expect(panelSrc).toContain('provisioned: true');
    expect(panelSrc).toContain('allOffConfig(');
    expect(panelSrc).toContain('applyVerticalPack');
    expect(panelSrc).toContain('📋 העתק קישור');
  });
});
