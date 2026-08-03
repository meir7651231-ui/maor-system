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
  effectiveConfigFor,
  genJoinCode,
  isMember,
  orgEnabledModules,
  isOrgManager,
  isValidSlug,
  normEmail,
  orgJoinLink,
  orgLink,
  overrideOf,
  removeMember,
  setEmployeeOverride,
  slugify,
} from '../lib';
import type { OrgCloudDoc } from '../../../lib/cloudConfig';
import appSrc from '../../../App.tsx?raw';
import panelSrc from '../PlatformPanel.tsx?raw';
import managerSrc from '../ManagerPanel.tsx?raw';
import useAppSrc from '../../../store/useApp.ts?raw';

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

describe('👥 ORGADMIN — היררכיית 3 שכבות + כרטיס-עובד (ליבה טהורה)', () => {
  const org: OrgCloudDoc = {
    orgName: 'מאור',
    manager: 'boss@maor.org',
    members: ['boss@maor.org', 'rina@maor.org'],
    // כרטיס-העובד של רינה: כיבו לה את התורמים ואת דגל-הדוחות
    memberConfigs: { 'rina@maor.org': { modules: { supporters: false }, features: { 'reports.csv': false } } },
  };
  const orgConfig = { modules: { supporters: true, families: true }, features: {} as Record<string, boolean> };

  it('normEmail: trim + lowercase (זהה להשוואת ה-Rules)', () => {
    expect(normEmail('  Boss@Maor.ORG ')).toBe('boss@maor.org');
  });

  it('isOrgManager / isMember: מנהל + עובדות מאושרות; זר=לא', () => {
    expect(isOrgManager('BOSS@maor.org', org)).toBe(true);
    expect(isOrgManager('rina@maor.org', org)).toBe(false);
    expect(isMember('rina@maor.org', org)).toBe(true);
    expect(isMember('boss@maor.org', org)).toBe(true); // מנהל = חבר
    expect(isMember('zzz@maor.org', org)).toBe(false);
  });

  it('effectiveConfigFor: מנהל=קונפיג-הארגון · עובדת=בניכוי מה שכובה בכרטיס · חבר-בלי-כרטיס=מלא', () => {
    // מנהל — רואה הכל כמו הארגון
    expect(effectiveConfigFor('boss@maor.org', org, orgConfig)).toBe(orgConfig);
    // רינה — התורמים כובו לה בכרטיס
    const rina = effectiveConfigFor('rina@maor.org', org, orgConfig);
    expect(rina.modules.supporters).toBe(false); // כובה לה
    expect(rina.modules.families).toBe(true); // נשאר כמו הארגון
    expect(rina.features['reports.csv']).toBe(false); // דגל כובה לה
    expect(orgConfig.modules.supporters).toBe(true); // המקור לא זז (טהור)
    // עובדת בלי כרטיס — רואה כמו הארגון
    const org2: OrgCloudDoc = { members: ['dana@maor.org'] };
    expect(effectiveConfigFor('dana@maor.org', org2, orgConfig)).toBe(orgConfig);
  });

  it('כרטיס-עובד רק מגביל — לא מדליק מה שהארגון כיבה', () => {
    const off = { modules: { supporters: false }, features: {} as Record<string, boolean> };
    // הכרטיס מנסה "להדליק" supporters, אבל הארגון כבוי ⇒ נשאר כבוי
    const orgTry: OrgCloudDoc = { members: ['x@y.z'], memberConfigs: { 'x@y.z': { modules: { supporters: true } } } };
    expect(effectiveConfigFor('x@y.z', orgTry, off).modules.supporters).toBe(false);
  });

  it('approveMember: מוסיף ל-members בלי כפילויות, מנרמל (ללא כרטיס = מלא)', () => {
    const r = approveMember(org, ' Dana@Maor.org ');
    expect(r.members).toContain('dana@maor.org');
    expect(r.members.filter((m) => m === 'boss@maor.org')).toHaveLength(1);
  });

  it('setEmployeeOverride: כותב כרטיס-עובד, שומר קיימים', () => {
    const r = setEmployeeOverride(org, 'Dana@maor.org', { modules: { families: false } });
    expect(r.memberConfigs['dana@maor.org'].modules?.families).toBe(false);
    expect(r.memberConfigs['rina@maor.org']).toBeDefined(); // קיים נשמר
  });

  it('orgEnabledModules: רק מה שהבעלים הדליק (לא-false) — "רק הכפתורים שאני הדלקתי"', () => {
    // ארגון all-off שהבעלים הדליק בו רק משפחות+חוגים
    const cfg = allOffConfig('maor', 'מאור');
    cfg.modules.families = true;
    cfg.modules.courses = true;
    const scope = orgEnabledModules(cfg);
    expect(scope).toContain('families');
    expect(scope).toContain('courses');
    expect(scope).not.toContain('supporters'); // לא הודלק ⇒ המנהל לא רואה
    expect(scope).not.toContain('shop');
  });

  it('overrideOf: מחזיר את הכרטיס, ריק לחבר-בלי-כרטיס', () => {
    expect(overrideOf('rina@maor.org', org).modules?.supporters).toBe(false);
    expect(overrideOf('boss@maor.org', org)).toEqual({});
  });

  it('removeMember: מוציא מ-members ומ-memberConfigs', () => {
    const r = removeMember(org, 'rina@maor.org');
    expect(r.members).not.toContain('rina@maor.org');
    expect(r.memberConfigs['rina@maor.org']).toBeUndefined();
    expect(r.members).toContain('boss@maor.org');
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

describe('🛡 ORGADMIN — הגנות-מקור (חיווט 3 השכבות)', () => {
  it('מייל-על ממנה מנהל באישור: PlatformPanel כותב manager + members=[מנהל]', () => {
    expect(panelSrc).toContain('מייל מנהל-הארגון');
    expect(panelSrc).toContain('manager: mgr');
    expect(panelSrc).toContain('members: [mgr]');
  });

  it('פאנל-המנהל: אשף מצומצם ל-orgEnabledModules + 3 הפעולות', () => {
    expect(managerSrc).toContain('orgEnabledModules'); // רק מה שהבעלים הדליק
    expect(managerSrc).toContain('joinOpen'); // מתג הרשמת-עובדים
    expect(managerSrc).toContain('fetchOrgJoinRequests'); // מושך בקשות
    expect(managerSrc).toContain('setEmployeeOverride'); // כרטיס-עובד
    expect(managerSrc).toContain('deleteOrgJoinRequest'); // אישור/דחייה
  });

  it('App מגדר #manage מאחורי cloud.isManager בלבד', () => {
    expect(appSrc).toContain("window.location.hash === '#manage'");
    expect(appSrc).toContain('managerOpen && cloud.isManager');
    expect(appSrc).toContain('cloud.isManager && ('); // הכפתור 👥 מגודר
  });

  it('useApp: עובד/ת מקבל/ת קונפיג-אפקטיבי + isManager + בקשת-הצטרפות ב-join', () => {
    expect(useAppSrc).toContain('effectiveConfigFor(user.email, orgDoc');
    expect(useAppSrc).toContain('isManager: isOrgManager(user.email');
    expect(useAppSrc).toContain('writeOrgJoinRequest(cfg.slug, user.uid');
  });
});
