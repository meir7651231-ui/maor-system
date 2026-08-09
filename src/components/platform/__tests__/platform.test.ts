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
  orgEnabledFeatures,
  orgEnabledModules,
  isOrgManager,
  isValidSlug,
  normEmail,
  orgJoinFullCode,
  orgJoinLink,
  parseJoinFullCode,
  orgLink,
  overrideOf,
  removeMember,
  setEmployeeOverride,
  slugify,
} from '../lib';
import type { OrgCloudDoc } from '../../../lib/cloudConfig';
import cloudConfigSrc from '../../../lib/cloudConfig.ts?raw';
import appSrc from '../../../App.tsx?raw';
import panelSrc from '../PlatformPanel.tsx?raw';
import managerSrc from '../ManagerPanel.tsx?raw';
import remoteSrc from '../../builder/RemoteWizard.tsx?raw';
import useAppSrc from '../../../store/useApp.ts?raw';
import persistSrc from '../../../store/persist.ts?raw';
import settingsSrc from '../../settings/SettingsView.tsx?raw';
import rulesSrc from '../../../../firestore.rules?raw';

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

  it('orgEnabledFeatures: רק דגלים דלוקים-בארגון ותחת מודול-דלוק (תקרת תת-הדגלים)', () => {
    const FEATS = [
      { key: 'families.docs', module: 'families' },
      { key: 'families.cred', module: 'families' },
      { key: 'supporters.hist', module: 'supporters' },
      { key: 'shell.lock', module: 'shell' }, // פסאודו-מודול — לא תלוי במודול-אמיתי
    ];
    const cfg = {
      modules: { families: true, supporters: false }, // supporters כבוי בארגון
      features: { 'families.cred': false }, // הבעלים כיבה דגל זה
    };
    const keys = orgEnabledFeatures(cfg, FEATS).map((f) => f.key);
    expect(keys).toContain('families.docs'); // מודול דלוק + דגל דלוק
    expect(keys).not.toContain('families.cred'); // דגל שהבעלים כיבה ⇒ לא ניתן לחלוקה
    expect(keys).not.toContain('supporters.hist'); // תחת מודול כבוי ⇒ מוסתר
    expect(keys).toContain('shell.lock'); // פסאודו-מודול נשאר
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

  it('orgJoinFullCode ↔ parseJoinFullCode: "קוד מהבוס" מקודד slug (round-trip)', () => {
    // הרשמת-עובד/ת במסך-האחיד: הקוד מקודד את הסלאג ⇒ יודעים לאיזה ארגון לנתב.
    expect(orgJoinFullCode('maor', 'abc123de')).toBe('maor.abc123de');
    expect(parseJoinFullCode('maor.abc123de')).toEqual({ slug: 'maor', code: 'abc123de' });
    // סלאג עם מקף (השדה [a-z0-9-]) — הפיצול על הנקודה הראשונה שומר עליו
    expect(parseJoinFullCode('maor-hachesed.xy99')).toEqual({ slug: 'maor-hachesed', code: 'xy99' });
    expect(parseJoinFullCode('  MAOR.abc  ')).toEqual({ slug: 'maor', code: 'abc' }); // trim + lowercase לסלאג
  });

  it('parseJoinFullCode: קלט פגום ⇒ null (בלי נקודה / סלאג לא-חוקי / קוד ריק)', () => {
    expect(parseJoinFullCode('nodot')).toBeNull();
    expect(parseJoinFullCode('.abc')).toBeNull(); // אין סלאג
    expect(parseJoinFullCode('maor.')).toBeNull(); // אין קוד
    expect(parseJoinFullCode('bad slug.abc')).toBeNull(); // רווח בסלאג
    expect(parseJoinFullCode('')).toBeNull();
  });
});

describe('🛡 ORGADMIN — הגנות-מקור (חיווט 3 השכבות)', () => {
  it('מייל-על ממנה מנהל באישור: PlatformPanel כותב manager + members=[מנהל]', () => {
    expect(panelSrc).toContain('מייל מנהל-הארגון');
    expect(panelSrc).toContain('manager: mgr');
    expect(panelSrc).toContain('members: [mgr]');
  });

  it('🛡 צינור-30-הדקות: האישור זורע את חבילת-התחום מההרשמה (seedPack), עם ברירת-ביטול', () => {
    // הלקוח בחר תחום באשף-ההרשמה ⇒ openApprove מציע אותו כחבילת-פתיחה; הבעלים
    // יכול להחליף/לבטל ('' = לידה all-off כמו קודם). האישור מחיל applyVerticalPack.
    expect(panelSrc).toContain('setSeedPack(VERTICAL_PACKS.some((p) => p.id === r.industry)');
    expect(panelSrc).toContain('seedPack ? applyVerticalPack(born, seedPack) : born');
    expect(panelSrc).toContain('בלי חבילה — הכול כבוי');
  });

  it('פאנל-המנהל: אשף מצומצם ל-orgEnabledModules + תת-דגלים + 3 הפעולות', () => {
    expect(managerSrc).toContain('orgEnabledModules'); // רק מודולים שהבעלים הדליק
    expect(managerSrc).toContain('orgEnabledFeatures'); // תת-דגלים בתוך התקרה (100%)
    expect(managerSrc).toContain('toggleFeatureFor'); // הדלקה/כיבוי דגל פר-עובד
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

  it('🔒 Rules: כלל-השורש מצומצם (בלי catch-all חוצה-ארגונים) + מנהל מוגבל', () => {
    // ציד-באגים 3.8.2026: כלל-השורש מתיר כל אוסף-שורש פרט לאוספי-הפלטפורמה;
    // ‏9.8: הורחב — גם הכספת (orgSecrets/Meta) והפיד (icsFeeds) מוחרגים, אחרת
    // מייל ב-allowedRoot היה קורא דרך ה-catch-all את סודות **כל** הארגונים.
    expect(rulesSrc).toContain('match /{rootCol}/{document=**}');
    expect(rulesSrc).toContain(
      "!(rootCol in ['platformOrgs', 'platformRequests', 'platformLeads', 'orgs', 'orgSecrets', 'orgSecretsMeta', 'icsFeeds'])",
    );
    // הכלל הרקורסיבי-העירום (שנתן ל-allowedRoot כתיבה חוצת-ארגונים) הוסר
    expect(rulesSrc).not.toContain('match /{document=**}');
    // עדכון-חלקי-מנהל מוגבל לשדות ניהול-העובדות בלבד
    expect(rulesSrc).toContain("hasOnly(['members', 'memberConfigs', 'joinOpen', 'joinCode'])");
    expect(rulesSrc).toContain('function orgManager(slug)');
  });

  it('הגדרות: צ׳יפ לוח-בקרה (מייל-על) + ניהול-עובדות (מנהל) — בלי הקלדת hash', () => {
    expect(settingsSrc).toContain("window.location.hash = '#platform'");
    expect(settingsSrc).toContain('canPlatform &&'); // מגודר isSuperAdmin
    expect(settingsSrc).toContain("window.location.hash = '#manage'");
    expect(settingsSrc).toContain('isManager &&'); // מגודר cloud.isManager
  });

  it('🛡 הבעלים רואה בקשות-הצטרפות של עובדים בלוח-הבקרה (5.8.2026 — "מאור נרשם ולא ראיתי בקשה")', () => {
    // הבאג: בקשת "קוד מהבוס" נכתבת ל-joinRequests ומוצגת רק בפאנל-המנהל
    // (cloud.isManager). ארגון בלי מנהל-ממונה — או בעלים שאינו המנהל — לא ראה
    // את הבקשה בשום מסך. הלוח שולף מכל הארגונים + מאשר/דוחה באותה פעולה כמו המנהל.
    expect(panelSrc).toContain('fetchOrgJoinRequests');
    expect(panelSrc).toMatch(/approveJoin[\s\S]{0,300}approveMember/);
    expect(panelSrc).toMatch(/approveJoin[\s\S]{0,500}deleteOrgJoinRequest/);
    expect(panelSrc).toContain('בקשות-הצטרפות של עובדים');
  });

  it('🛡 הקמה ידנית בלוח (5.8) — לקוח בלי מסמך-בקשה (טלפון-מסונן חוסם Firestore)', () => {
    // האבחון: הכתיבה ל-platformRequests עובדת מהשרת אך נכשלת ממכשירים מסוננים —
    // המשתמש נוצר ב-Auth ואין בקשה. ההקמה-הידנית = אותו מסלול-אישור בלי בקשה.
    expect(panelSrc).toContain('openManualCreate');
    expect(panelSrc).toContain('➕ הקמה ידנית');
    // אין מסמך-בקשה ⇒ אין מחיקת-בקשה (deleteOrgRequest רק כשיש uid)
    expect(panelSrc).toMatch(/if \(approveReq\.uid\) await mod\.deleteOrgRequest/);
    // שם-הארגון חובה בהקמה ידנית
    expect(panelSrc).toContain("if (!approveReq.orgName?.trim()) return setSlugErr('שם הארגון חסר')");
  });

  it('🛰 אשף-הרכבה קשור-ענן (5.8) — האשף המלא עורך לקוח חי, עם שחזור-מיתוג', () => {
    // בקשת-בעלים: "שאני אראה בלייב מה אני מדליק" — #builder=slug מלביש את
    // קונפיג-הלקוח על האפליקציה, כל שינוי נכתב לענן (onSnapshot אצל הלקוח),
    // ובסגירה/קריסה מיתוג-הבעלים חוזר מהתצלום.
    expect(remoteSrc).toContain('writeOrgCloudConfig(slug, s.config)');
    expect(remoteSrc).toContain('BUILDER_PREV_KEY');
    // ציד-באגים 5.8: התצלום ב-localStorage (sessionStorage נמחק עם סגירת-הטאב ⇒
    // האתר של הבעלים נשאר לבוש-כלקוח לתמיד) + כולל את הערכה-האישית (db.ui)
    expect(remoteSrc).toMatch(/localStorage\.setItem\(BUILDER_PREV_KEY/);
    expect(remoteSrc).toContain('uiTheme: st.db.ui.theme ?? null');
    expect(remoteSrc).toMatch(/restoreBuilderPrev[\s\S]{0,600}localStorage\.getItem\(BUILDER_PREV_KEY\)/);
    // ‏App: זיהוי ‏#builder=slug, שער מייל-על, ושחזור-קריסה
    expect(appSrc).toContain("window.location.hash.startsWith('#builder=')");
    expect(appSrc).toMatch(/remoteBuilderSlug[\s\S]{0,400}isSuperAdmin\(cloud\.user\?\.email\)/);
    expect(appSrc).toContain('RemoteWizard');
    // הכניסה מהלוח
    expect(panelSrc).toContain("'#builder=' + o.slug");
  });

  it('🗑 מחיקת-לקוח מלאה (5.8) — תתי-אוספים לפני מסמך-הארגון, ואישור בהקלדת-סלאג', () => {
    // ‏Firestore: מחיקת מסמך לא מוחקת תתי-אוספים — deleteOrgCompletely מוחקת
    // את כל אוספי-הנתונים + התורים + meta/envelope + joinRequests ואז את המסמך.
    expect(cloudConfigSrc).toContain('export async function deleteOrgCompletely');
    expect(cloudConfigSrc).toMatch(/'incomingPayments', 'smsOutbox', 'mailOutbox'/);
    expect(cloudConfigSrc).toMatch(/_enc\/envelope/);
    // סדר: joinRequests ואז המצבת (אחרונה — כשל-באמצע משאיר את הלקוח גלוי לניסיון-חוזר)
    const wipeIdx = cloudConfigSrc.indexOf("PLATFORM_ORGS + '/' + slug + '/joinRequests'");
    const docIdx = cloudConfigSrc.indexOf('setDoc(doc(db, PLATFORM_ORGS, slug), { deleted: true');
    expect(wipeIdx).toBeGreaterThan(-1);
    expect(docIdx).toBeGreaterThan(wipeIdx);
    // הלוח: מחיקה מותנית בהקלדת הסלאג המדויק — לא קליק-כפול; מצבות מסוננות מהרשימה
    expect(panelSrc).toContain('delTyped.trim() !== delOrg.slug');
    expect(panelSrc).toContain('deleteOrgCompletely');
    expect(panelSrc).toContain('allRaw.filter((o) => !o.deleted)');
  });

  it('🛡 ציד-באגים 5.8 — עובד-ממתין לא מייצר בקשת-ארגון-רפאים; בקשה-בלי-שם ניתנת-לאישור', () => {
    // באג 3: הריפוי-העצמי במסך-ההמתנה רשם לעובד-עם-קוד בקשת-ארגון-חדש בלוח
    // (אישורה היה מקים ארגון-רפאים). עכשיו: PENDING_JOIN_KEY ⇒ ריפוי לתור-הארגון.
    expect(useAppSrc).toContain('PENDING_JOIN_KEY');
    expect(useAppSrc).toMatch(/join\?\.slug[\s\S]{0,300}writeOrgJoinRequest\(join\.slug, user\.uid/);
    // באג 4: בקשת-חילוץ מינימלית (בלי שם-ארגון) — האישור דרש שם ולא היה שדה
    expect(panelSrc).toContain("(!approveReq.uid || !(approveReq.orgName ?? '').trim())");
  });

  it('🛡 ניקוי-מקומי בטוח (5.8) — רק על מצבת מפורשת, לעולם לא על כשל-קריאה או על השורש', () => {
    // הסכנה שנחסמת: רשת רעועה ⇒ fetchOrgCloudConfig מחזיר null; ניקוי על null
    // היה משמיד נתוני-לקוח על תקלת-רשת. הניקוי רץ רק על orgDoc?.deleted===true.
    expect(useAppSrc).toMatch(/if \(orgDoc\?\.deleted\) \{[\s\S]{0,200}wipeLocalOrgData/);
    expect(useAppSrc).toContain("membership: 'removed'");
    // persist: הגנה קשיחה — 'default' (השורש, הלקוח הקיים) לעולם לא מנוקה
    expect(persistSrc).toMatch(/wipeLocalOrgData[\s\S]{0,200}if \(!slug \|\| slug === 'default'\) return/);
    // ‏Rules: מצבת קריאה לכל מחובר — רק כשהדגל deleted דלוק
    expect(rulesSrc).toContain("resource.data.get('deleted', false) == true");
  });
});
