/**
 * ratchet — ביקורת-עומק 6-עדשות (2.9.2026, "תבדוק עמוק יותר הכי עמוק שאתה יכול").
 * נועל את התיקונים המערכתיים: סנכרון-ענן (דילוג-snapshot · איחוד-rid · מצבות),
 * מחלקת-הקריסה (לוקאפים חסינים + ריפוי-במיזוג-חי), כסף (שערי-סכום · $-ניתוב · עיגול),
 * חוזה-דגלים (false מפורש · GRANTABLE), אבטחת-שרת (התאמת-מייל-מלאה · שער-slug · cooldown).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sanitizeIncoming, mergeDonationsPreserving } from '../cloud-merge';
import { evMeta, EV_META } from '../eventMeta';
import cloudSrc from '../cloud.ts?raw';
import cloudSyncSrc from '../../store/cloudSync.ts?raw';
import useAppSrc from '../../store/useApp.ts?raw';
import configSrc from '../config.ts?raw';
import persistSrc from '../../store/persist.ts?raw';
import appSrc from '../../App.tsx?raw';
// נחיל ב׳ 3.9 — סמכות-מנהל אפקטיבית (isAdminAuthority) + הגנות-מקור למשטחים שעברו אליה
import { canGrantedAction, isAdminAuthority } from '../config';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';
import settingsSrc from '../../components/settings/SettingsView.tsx?raw';
import backupSrc from '../../components/settings/BackupSection.tsx?raw';
import donorImportSrc from '../../components/settings/DonorImportSection.tsx?raw';
import gcontactsSrc from '../../components/settings/GContactsSection.tsx?raw';
import themeSrc from '../../components/settings/ThemeSection.tsx?raw';
import paletteSrc from '../../components/palette/CommandPalette.tsx?raw';
import platformLibSrc from '../../components/platform/lib.ts?raw';

const fn = readFileSync('functions/gcontactsSync.js', 'utf8');

describe('☁️ סנכרון-ענן — נכונות', () => {
  it('מאזין-ישויות מסנן פר-מסמך (לא מדלג על snapshot שלם); meta מוחל תמיד', () => {
    expect(cloudSrc).toContain("snap.docChanges().filter((ch) => !ch.doc.metadata.hasPendingWrites)");
    expect(cloudSrc).not.toContain('if (snap.metadata.hasPendingWrites) return;');
    expect(cloudSrc).not.toContain('if (snap.metadata.hasPendingWrites || !snap.exists()) return;');
  });
  it('איחוד-rid חל גם על enrollments.payments (תשלום-R- לא נדרס)', () => {
    const local = { id: 'e1', payments: [{ rid: 'R-1' }, { rid: 'R-2' }] };
    const inc = { id: 'e1', payments: [{ rid: 'R-1' }] };
    const m = mergeDonationsPreserving('enrollments', local, inc) as { payments: { rid: string }[] };
    expect(m.payments.map((p) => p.rid).sort()).toEqual(['R-1', 'R-2']);
    // אוסף ללא rid-union ⇒ המסמך המרוחק כמות-שהוא
    expect(mergeDonationsPreserving('rooms', { id: 'r', x: 1 }, { id: 'r', x: 2 })).toEqual({ id: 'r', x: 2 });
  });
  it('handshake: id בשני הצדדים ⇒ mergeDonationsPreserving; מצבה-מקומית ⇒ העתק-הענן יורד', () => {
    expect(cloudSyncSrc).toContain('mergeDonationsPreserving(col, l as unknown as Record<string, unknown>');
    expect(cloudSyncSrc).toMatch(/local\.delLog \?\? \[\]\)\.some\(\(e\) => e\.col === col && e\.id === c\.id && !localIds\.has\(c\.id\)\)/);
  });
  it('restoreDb/resetAll מטביעים מצבות (לא עוקפים את הטבעת)', () => {
    expect(useAppSrc).toContain('function withRemovalTombstones(prev: Db, next: Db): Db');
    expect((useAppSrc.match(/set\(\{ db: withRemovalTombstones\(prev, db\) \}\)/g) ?? []).length).toBe(2);
  });
});

describe('💥 מחלקת-הקריסה — לוקאפים חסינים + ריפוי במיזוג-חי', () => {
  it('sanitizeIncoming מרפא status/cred/type/pri/sessions כמו migrate', () => {
    expect(sanitizeIncoming('families', { id: 'f', status: 'bogus' }).status).toBe('active');
    expect((sanitizeIncoming('families', { id: 'f' }).cred as { score: number }).score).toBe(700);
    expect(sanitizeIncoming('events', { id: 'e', type: 'weird' }).type).toBe('custom');
    expect(sanitizeIncoming('events', { id: 'e', type: 'bday' }).type).toBe('bday'); // תקין ביט-זהה
    expect(sanitizeIncoming('tasks', { id: 't', pri: 9 }).pri).toBe(2);
    expect(Array.isArray(sanitizeIncoming('courses', { id: 'c' }).sessions)).toBe(true);
  });
  it('evMeta: סוג לא-מוכר ⇒ custom (לא undefined.bg)', () => {
    expect(evMeta({ type: 'nope' as never })).toEqual(EV_META.custom);
    expect(evMeta({ type: 'call' })).toEqual(EV_META.call);
  });
  it('migrate מרפא events.type + tasks.pri; App מפענח hash בבטחה', () => {
    expect(persistSrc).toMatch(/merged\.events = [\s\S]{0,200}EVT\.has\(String\(e\.type\)\) \? e : \{ \.\.\.e, type: 'custom' \}/);
    expect(persistSrc).toMatch(/\[1, 2, 3\]\.includes\(t\.pri as number\) \? t : \{ \.\.\.t, pri: 2 \}/);
    expect(appSrc).toContain('function safeDecode(s: string): string');
    expect(appSrc).not.toMatch(/[^e]decodeURIComponent\(window/);
  });
});

describe('💰 כסף — שערים בליבה', () => {
  it('addDonation/addPayment דוחים סכום לא-סופי/לא-חיובי לפני צריכת-המונה', () => {
    expect(useAppSrc).toContain("if (!Number.isFinite(payment.amount) || payment.amount <= 0) { get().toast('סכום לא-תקין — התשלום לא נרשם'); return { ok: false }; }");
    expect(useAppSrc).toContain("if (!Number.isFinite(donation.amount) || donation.amount <= 0) { get().toast('סכום לא-תקין — התרומה לא נרשמה'); return { ok: false }; }");
  });
});

describe('🚩 חוזה-הדגלים', () => {
  it('canGrantedAction: false מפורש מכבה גם למנהל/מייל-על', () => {
    // נחיל ב׳ 3.9: הסמכות עברה ל-isAdminAuthority (ארגון-פלטפורמה בלי adminEmails ≠ "כולם מנהלים")
    expect(configSrc).toContain("return config.features?.[key] !== false && (isAdminAuthority(config, email, isManager) || config.features?.[key] === true);");
  });
});

describe('🔐 נחיל ב׳ 3.9 — סמכות-מנהל אפקטיבית (isAdminAuthority · F1/F2/F3/F4/DS-2)', () => {
  // 🐛 ארגון-פלטפורמה נולד בלי adminEmails (allOffConfig) ⇒ isAdminUser החזיר true-לכולם ⇒
  // canGrantedAction וסעיפי-המנהל בהגדרות נחשפו לכל עובד/ת. שורש/מאור-החסד/דמו/אופליין — ביט-זהה.
  const cfgOf = (p: Partial<OrgConfig>): OrgConfig => ({ ...DEFAULT_CONFIG, ...p });
  const FB = { apiKey: 'k', authDomain: 'a', projectId: 'p', appId: 'x' };
  const platform = cfgOf({ slug: 'acme', firebase: FB, cloudRoot: false });

  it('ארגון-פלטפורמה בלי adminEmails: עובד/ת אינו/ה סמכות; מנהל-ארגון ומייל-על כן', () => {
    expect(isAdminAuthority(platform, 'emp@x.com', false)).toBe(false);
    expect(canGrantedAction(platform, 'emp@x.com', false, 'families.delete')).toBe(false);
    expect(isAdminAuthority(platform, 'emp@x.com', true)).toBe(true);
    expect(canGrantedAction(platform, 'emp@x.com', true, 'families.delete')).toBe(true);
    expect(isAdminAuthority(platform, 'meir7651231@gmail.com', false)).toBe(true);
    expect(canGrantedAction(platform, 'meir7651231@gmail.com', false, 'families.delete')).toBe(true);
    // הדלקה-פר-עובד (features[key]===true) עדיין מדליקה לעובד/ת
    expect(canGrantedAction({ ...platform, features: { 'families.delete': true } }, 'emp@x.com', false, 'families.delete')).toBe(true);
    // false מפורש מכבה גם למנהל (ביקורת-עומק 2.9 נשמרת)
    expect(canGrantedAction({ ...platform, features: { 'families.delete': false } }, 'emp@x.com', true, 'families.delete')).toBe(false);
  });

  it('ארגון-פלטפורמה עם adminEmails ⇒ isAdminUser כמו היום (חבר true · לא-חבר false)', () => {
    const c = { ...platform, adminEmails: ['boss@x.com'] };
    expect(isAdminAuthority(c, 'boss@x.com', false)).toBe(true);
    expect(isAdminAuthority(c, 'BOSS@X.com', false)).toBe(true);
    expect(isAdminAuthority(c, 'emp@x.com', false)).toBe(false);
  });

  it('שורש (cloudRoot / slug=default) עם adminEmails — ביט-זהה ל-isAdminUser', () => {
    const root = cfgOf({ slug: 'default', firebase: FB, cloudRoot: true, adminEmails: ['a@x.com'] });
    expect(isAdminAuthority(root, 'a@x.com', false)).toBe(true);
    expect(isAdminAuthority(root, 'z@x.com', false)).toBe(false);
    const live = cfgOf({ slug: 'maor-hachesed', firebase: FB, cloudRoot: true, adminEmails: ['a@x.com'] });
    expect(isAdminAuthority(live, 'a@x.com', false)).toBe(true);
    expect(canGrantedAction(live, 'a@x.com', false, 'families.delete')).toBe(true);
    // שורש בלי adminEmails (cloudRoot:true) — לא ארגון-פלטפורמה ⇒ כמו היום (true)
    expect(isAdminAuthority(cfgOf({ slug: 'default', firebase: FB, cloudRoot: true }), 'anyone@x.com', false)).toBe(true);
  });

  it('בלי firebase (דמו/אופליין) ⇒ כל אחד סמכות (ביט-זהה להיום)', () => {
    expect(isAdminAuthority(cfgOf({ slug: 'demo' }), 'anyone@x.com', false)).toBe(true);
    expect(isAdminAuthority(cfgOf({}), null, false)).toBe(true);
    expect(canGrantedAction(cfgOf({ slug: 'demo' }), null, false, 'families.delete')).toBe(true);
  });

  it('הגנות-מקור: סעיפי-המנהל בהגדרות · איפוס/שחזור · פלטה-למורה · תקרת-הארגון · אזהרת-orgName', () => {
    // F1 — הצ׳יפים והסעיפים המגודרים-מנהל
    expect(settingsSrc).toContain('const isAdmin = isAdminAuthority(config, cloudUser?.email, !!isManager);');
    expect(donorImportSrc).toContain('isAdminAuthority(config, cloudUser?.email, !!isManager)');
    expect(gcontactsSrc).toContain('isAdminAuthority(config, cloudUser?.email, !!isManager)');
    expect(themeSrc).toContain('const isAdmin = isAdminAuthority(config, cloudUser?.email, !!isManager);');
    // TP-8 — מונחי-הישויות ב-GContacts (fallback = הליטרל ההיסטורי)
    expect(gcontactsSrc).toContain("termOf(config, 'entity.volunteers', 'מתנדבים')");
    expect(gcontactsSrc).not.toContain('משפחות, תורמים ומתנדבים —');
    // F4 — איפוס/שחזור בארגון-ענן למנהל/ת בלבד; הייצוא נשאר
    expect(settingsSrc).toContain('const canReset = !cloudOn || isAdminAuthority(config, cloudUser?.email, isManager);');
    expect(settingsSrc).toContain('פעולה זו שמורה למנהל/ת הארגון');
    expect(backupSrc).toContain('const canRestore = !cloudOn || isAdminAuthority(config, cloudUser?.email, isManager);');
    expect(backupSrc).toContain("if (!canRestore) { toast('שחזור בארגון-ענן — מנהל-הארגון בלבד'); setRestore(null); return; }");
    expect(backupSrc).toContain('{canRestore && demoTotal > 0 && (');
    expect(backupSrc).toContain("featureOn(useApp.getState().config, 'core.export') && (");
    // DS-2 — אזהרת orgName-לא-תואם במודאל-האישור (additive)
    expect(backupSrc).toContain('inc.orgName !== cur.orgName');
    // F3 — הפלטה לא מנווטת מורה להגדרות (ניווט + כרטיסי-מורים)
    expect(paletteSrc).toContain("n.view === 'settings' ? !isTeacherUser");
    expect(paletteSrc).toContain("!zoneLocked('settings') && !isTeacherUser");
    // F2 — הדלקה-פר-עובד לעולם לא מעל תקרת-הארגון
    expect(platformLibSrc).toContain('GRANTABLE_STAFF_FEATURES.has(k) && orgConfig.features?.[k] !== false');
  });
});

describe('🔐 שרת gcontactsSync — הקשחה', () => {
  it('מייל-על = התאמה-מלאה (Set), לא substring; slug מאומת; cooldown; שגיאה קבועה', () => {
    expect(fn).toContain("const superSet = () => new Set(['meir7651231@gmail.com'");
    expect(fn).not.toContain('supers.includes(el)');
    expect(fn).toContain("if (!(ORG_RE.test(slug) || slug === 'root')) { res.status(400).json({ error: 'bad-org' }); return; }");
    expect(fn).toContain("res.status(429).json({ error: 'cooldown' })");
    expect(fn).toContain("res.status(500).json({ error: 'sync-failed' })");
    // לקוח-השורש קורא אוספי-שורש (לא orgs/root/*)
    expect(fn).toContain("org === 'root' ? db.collection(name) : db.collection('orgs').doc(org).collection(name)");
  });
});

describe('ביקורת-עומק 2.9 — שאריות (PR המשך)', () => {
  const read = (p: string) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
  it('מצבי-ריק עוברים termOf (7 דליפות: תלמידים/חוגים/תורמים)', () => {
    expect(read('components/courses/CoursesCockpit.tsx')).toContain("'אין ' + termOf(config, 'entity.students', 'תלמידים') + ' בסיכון");
    expect(read('components/courses/RetentionCenter.tsx')).toContain("אין {termOf(config, 'entity.students', 'תלמידים')} בסיכון-נשירה");
    expect(read('components/courses/CoursesDashboard.tsx')).toContain("עדיין אין {termOf(config, 'nav.courses', 'חוגים')} להצגה");
    expect(read('components/courses/ParentCard.tsx')).toContain("אין {termOf(config, 'nav.courses', 'חוגים')} פעילים");
    expect(read('components/courses/parent.ts')).toContain("lines.push('אין ' + coursesTerm + ' פעילים כרגע.');");
    expect(read('components/supporters/SupportersIntel.tsx')).toContain('אין {supPlural} עם היסטוריית-נתינה');
    expect(read('components/supporters/SupportersUniverse3D.tsx')).toContain("אין {termOf(props.config, 'nav.supporters', 'תורמים')} להצגה");
  });
  it('גיבוי-סוף-יום: החותמת היומית רק אחרי הצלחת-ההורדה', () => {
    const app = read('App.tsx');
    expect(app).toContain("void exportBackup().then((ok) => { if (ok) localStorage.setItem(nsLsKey('maor_autoexp'), today); });");
    expect(app).not.toMatch(/localStorage\.setItem\(nsLsKey\('maor_autoexp'\), today\);\s*\n\s*exportBackup\(\);/);
    expect(read('store/useApp.ts')).toContain('exportBackup: () => Promise<boolean>;');
  });
});
