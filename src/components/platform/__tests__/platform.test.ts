/**
 * ratchet — לוח הבקרה של הבעלים (CLOUD2 ענן 4).
 * ‏slugify טהור (עברית→לטינית, ייחודיות); קונפיג-הלידה all-off — כל 9
 * המודולים false **מפורש** (לא "חסר=דלוק"); הגנות-מקור: הפאנל מאחורי
 * מייל-על (#platform, דפוס #builder), כל מתג נכתב מיד לענן.
 */
import { describe, expect, it } from 'vitest';
import {
  ALL_MODULES,
  allOffConfig,
  approveMember,
  genJoinCode,
  isOrgManager,
  isValidSlug,
  normEmail,
  orgJoinLink,
  orgLink,
  removeMember,
  roleOf,
  slugify,
} from '../lib';
import type { OrgCloudDoc } from '../../../lib/cloudConfig';
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

  it('קונפיג-הלידה all-off: כל 9 המודולים false מפורש — מסך כמעט ריק ללקוח חדש', () => {
    const c = allOffConfig('test-demo', 'עמותת בדיקה');
    expect(ALL_MODULES).toHaveLength(9);
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

describe('👥 ORGADMIN — היררכיית 3 שכבות (ליבה טהורה)', () => {
  const org: OrgCloudDoc = {
    orgName: 'מאור',
    manager: 'boss@maor.org',
    members: ['boss@maor.org', 'rina@maor.org'],
    memberRoles: { 'rina@maor.org': 'limited' },
  };

  it('normEmail: trim + lowercase (זהה להשוואת ה-Rules)', () => {
    expect(normEmail('  Boss@Maor.ORG ')).toBe('boss@maor.org');
  });

  it('isOrgManager: רק מייל-המנהל, case-insensitive', () => {
    expect(isOrgManager('BOSS@maor.org', org)).toBe(true);
    expect(isOrgManager('rina@maor.org', org)).toBe(false);
    expect(isOrgManager('x@y.z', { manager: '' })).toBe(false);
  });

  it('roleOf: מנהל=full · חבר-עם-רשומה=הרשומה · חבר-בלי-רשומה=full (תאימות v2) · לא-חבר=null', () => {
    expect(roleOf('boss@maor.org', org)).toBe('full'); // מנהל
    expect(roleOf('rina@maor.org', org)).toBe('limited'); // רשומה מפורשת
    expect(roleOf('dana@maor.org', { members: ['dana@maor.org'] })).toBe('full'); // חבר v2 בלי roles
    expect(roleOf('zzz@maor.org', org)).toBeNull(); // לא-חבר
  });

  it('approveMember: מוסיף ל-members+memberRoles בלי כפילויות, מנרמל', () => {
    const r = approveMember(org, ' Dana@Maor.org ', 'full');
    expect(r.members).toContain('dana@maor.org');
    expect(r.members.filter((m) => m === 'boss@maor.org')).toHaveLength(1); // בלי כפילות
    expect(r.memberRoles['dana@maor.org']).toBe('full');
    expect(r.memberRoles['rina@maor.org']).toBe('limited'); // קיים נשמר
  });

  it('removeMember: מוציא מ-members ומ-memberRoles', () => {
    const r = removeMember(org, 'rina@maor.org');
    expect(r.members).not.toContain('rina@maor.org');
    expect(r.memberRoles['rina@maor.org']).toBeUndefined();
    expect(r.members).toContain('boss@maor.org'); // אחרים נשמרים
  });

  it('genJoinCode: דטרמיניסטי מ-seed, 8 תווים base36', () => {
    const a = genJoinCode('maor-1700000000');
    expect(a).toMatch(/^[a-z0-9]{8}$/);
    expect(genJoinCode('maor-1700000000')).toBe(a); // יציב
    expect(genJoinCode('maor-1700000001')).not.toBe(a); // seed שונה ⇒ קוד שונה
  });

  it('orgJoinLink: ?org=slug&join=code', () => {
    expect(orgJoinLink('https://x.io', '/m/', 'maor', 'abc123de')).toBe('https://x.io/m/?org=maor&join=abc123de');
  });
});
