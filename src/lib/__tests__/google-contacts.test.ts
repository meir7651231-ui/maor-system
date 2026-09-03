/**
 * ratchet — 📇 סנכרון אנשי-קשר ל-Google (הרחבת gcontacts, opt-in). המנוע טהור:
 * איסוף מ-3 מקורות, דדופ-טלפונים, מפתח-יציב לזיהוי-חוזר, מיפוי People API ו-vCard.
 * בקשת-בעלים 1.9 "סנכרון-חי לגוגל, כל אנשי-הקשר".
 */
import { describe, expect, it } from 'vitest';
import {
  collectOrgContacts,
  contactStableKey,
  toPersonResource,
  buildVcard,
  contactsVcf,
  syncStats,
  GCONTACTS_GROUP_DEFAULT,
} from '../googleContacts';
import type { Family, Supporter, Volunteer } from '../../types/domain';

const fam = (o: Partial<Family>): Family => ({ id: 'f1', name: 'משפחת כהן', phone: '050-1111111', email: '', city: 'ירושלים', address: 'הרצל 3', members: [], ...o } as Family);
const sup = (o: Partial<Supporter>): Supporter => ({ id: 's1', name: 'ראובן לוי', phone: '052-2222222', email: 'r@x.com', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], ...o } as Supporter);
const vol = (o: Partial<Volunteer>): Volunteer => ({ id: 'v1', name: 'שמעון', phone: '053-3333333', active: true, note: '', createdAt: '2026-01-01', ...o } as Volunteer);

describe('📇 איסוף אנשי-קשר', () => {
  it('אוסף מ-3 מקורות עם סוג + שדות', () => {
    const c = collectOrgContacts([fam({})], [sup({})], [vol({})], 'עמותת מאור');
    expect(c).toHaveLength(3);
    expect(c[0]).toMatchObject({ kind: 'family', name: 'משפחת כהן', city: 'ירושלים', address: 'הרצל 3', org: 'עמותת מאור' });
    expect(c[1]).toMatchObject({ kind: 'supporter', name: 'ראובן לוי', emails: ['r@x.com'] });
    expect(c[2]).toMatchObject({ kind: 'volunteer', name: 'שמעון' });
  });

  it('מדלג על חסרי-שם ועל מי שאין לו טלפון ולא מייל', () => {
    const c = collectOrgContacts(
      [fam({ id: 'f2', name: '', phone: '050-9' }), fam({ id: 'f3', phone: '', phone2: '', email: '', members: [] })],
      [], [],
    );
    expect(c).toHaveLength(0);
  });

  it('דדופ-טלפונים: 0501234567 == +972-50-1234567 == אותו מספר', () => {
    const c = collectOrgContacts(
      [fam({ phone: '050-123-4567', phone2: '+972 50 1234567', members: [{ id: 'm', first: 'בן', phone: '0501234567' } as never] })],
      [], [],
    );
    expect(c[0].phones).toHaveLength(1); // כל השלושה = אותו מספר
  });

  it('מספר-ראשי נשאר ראשון; מספרים-נוספים של תורם מצורפים', () => {
    const c = collectOrgContacts([], [sup({ phone: '052-2222222', phones: [{ id: 'p', num: '03-9999999' }] })], []);
    expect(c[0].phones).toEqual(['052-2222222', '03-9999999']);
  });
});

describe('📇 מפתח-יציב + מיפוי People API', () => {
  it('מפתח-יציב פר-סוג+מזהה', () => {
    expect(contactStableKey({ kind: 'family', id: 'f1' })).toBe('maor:family:f1');
    expect(contactStableKey({ kind: 'supporter', id: 's9' })).toBe('maor:supporter:s9');
  });

  it('Person resource נושא clientData=maorKey לזיהוי-חוזר + שדות', () => {
    const [c] = collectOrgContacts([fam({})], [], [], 'עמותת מאור');
    const p = toPersonResource(c) as Record<string, unknown>;
    expect(p.names).toEqual([{ givenName: 'משפחת כהן' }]);
    expect(p.clientData).toEqual([{ key: 'maorKey', value: 'maor:family:f1' }]);
    expect(p.phoneNumbers).toEqual([{ value: '050-1111111', type: 'main' }]);
    expect(p.addresses).toEqual([{ streetAddress: 'הרצל 3', city: 'ירושלים' }]);
    expect(p.organizations).toEqual([{ name: 'עמותת מאור' }]);
    expect(p.userDefined).toEqual([{ key: 'מאור', value: 'משפחה' }]);
  });

  it('בלי כתובת/מייל — השדות לא נוצרים (payload רזה)', () => {
    const [c] = collectOrgContacts([], [], [vol({})]);
    const p = toPersonResource(c);
    expect(p.emailAddresses).toBeUndefined();
    expect(p.addresses).toBeUndefined();
  });
});

describe('📇 vCard (fallback ייצוא מיידי)', () => {
  it('vCard תקין עם FN/TEL/EMAIL/ADR/ORG/NOTE(מפתח)', () => {
    const [c] = collectOrgContacts([], [sup({ address: 'ויצמן 1', city: 'תל אביב' })], [], 'מאור');
    const v = buildVcard(c);
    expect(v).toContain('BEGIN:VCARD');
    expect(v).toContain('VERSION:3.0');
    expect(v).toContain('FN:ראובן לוי');
    expect(v).toContain('TEL;TYPE=CELL:052-2222222');
    expect(v).toContain('EMAIL;TYPE=INTERNET:r@x.com');
    expect(v).toContain('NOTE:maor:supporter:s1');
    expect(v.endsWith('END:VCARD')).toBe(true);
  });

  it('בריחת תווים מיוחדים ב-vCard (; , \\)', () => {
    const [c] = collectOrgContacts([fam({ name: 'כהן; לוי, בע"מ', address: 'a\\b', members: [] })], [], []);
    const v = buildVcard(c);
    expect(v).toContain('FN:כהן\\; לוי\\, בע"מ');
    expect(v).toContain('a\\\\b');
  });

  it('קובץ vcf מרובה-כרטיסים', () => {
    const all = collectOrgContacts([fam({})], [sup({})], []);
    const vcf = contactsVcf(all);
    expect(vcf.match(/BEGIN:VCARD/g)).toHaveLength(2);
    expect(vcf.match(/END:VCARD/g)).toHaveLength(2);
  });
});

describe('📇 תקציר', () => {
  it('syncStats סופר פר-סוג', () => {
    const c = collectOrgContacts([fam({})], [sup({}), sup({ id: 's2', name: 'דוד' })], [vol({})]);
    expect(syncStats(c)).toEqual({ total: 4, families: 1, supporters: 2, volunteers: 1 });
  });

  it('שם-קבוצת-ברירת-מחדל קיים', () => {
    expect(GCONTACTS_GROUP_DEFAULT).toContain('מאור');
  });
});

describe('📇 הגנת-מקור — חיווט הסנכרון (דורמנטי, מגודר)', () => {
  it('ההרחבה gcontacts ב-allowlist + הגדרת-קבוצה', async () => {
    const { INTEGRATION_KEYS, INTEGRATION_SETTING_KEYS } = await import('../../types/config');
    expect([...INTEGRATION_KEYS]).toContain('gcontacts');
    expect(INTEGRATION_SETTING_KEYS.gcontacts).toContain('groupName');
  });

  it('הסעיף מגודר integrationOn(gcontacts)+מנהל, ומחווט להגדרות', async () => {
    const sec = await import('../../components/settings/GContactsSection.tsx?raw').then((m) => m.default);
    expect(sec).toContain("integrationOn(config, 'gcontacts')");
    expect(sec).toContain('isAdminAuthority(config, cloudUser?.email, !!isManager)');
    // ייצוא-מיידי (vCard) + סנכרון-חי (lazy-import של הענן — firebase מחוץ לבנדל)
    expect(sec).toContain('contactsVcf(contacts)');
    expect(sec).toContain("await import('../../lib/cloud')");
    const settings = await import('../../components/settings/SettingsView.tsx?raw').then((m) => m.default);
    expect(settings).toContain('<GContactsSection />');
    expect(settings).toContain("'sec-gcontacts': 'data'");
  });

  it('cloud.syncGContacts שולח לטוקן-הכניסה מול gcontactsSyncNow', async () => {
    const cloud = await import('../cloud.ts?raw').then((m) => m.default);
    expect(cloud).toContain('export async function syncGContacts');
    expect(cloud).toContain('user.getIdToken()');
  });
});
