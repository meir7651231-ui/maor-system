/**
 * בדיקות-יחידה · ליבת gcontactsSync (טהורה, בלי firebase/googleapis):
 * איסוף אנשי-קשר, מיפוי People, ותוכנית-כתיבה אידמפוטנטית (create/update לפי maorKey).
 * הכרעת-בעלים 1.9 "סנכרון-חי לגוגל, כל אנשי-הקשר".
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { collectContacts, toPersonBody, planContactWrites, stableKey } = require('./gcontactsSync.js');

const data = {
  families: [{ id: 'f1', name: 'משפחת כהן', phone: '050-1111111', email: 'k@x.com', city: 'ירושלים', address: 'הרצל 3', members: [{ first: 'בן', phone: '+972 50 1111111' }] }],
  supporters: [{ id: 's1', name: 'ראובן', phone: '052-2222222', phones: [{ num: '03-9999999' }], email: '', address: '', city: '' }],
  volunteers: [{ id: 'v1', name: 'שמעון', phone: '053-3333333', area: 'צפון' }],
};

describe('gcontactsSync — ליבה טהורה', () => {
  it('איסוף מ-3 מקורות + דדופ-טלפונים (בן=אותו מספר של המשפחה)', () => {
    const c = collectContacts(data, 'עמותת מאור');
    expect(c).toHaveLength(3);
    expect(c[0].phones).toEqual(['050-1111111']); // ה-member כפול ⇒ מסונן
    expect(c[1].phones).toEqual(['052-2222222', '03-9999999']);
    expect(c[2]).toMatchObject({ kind: 'volunteer', name: 'שמעון', city: 'צפון' });
  });

  it('toPersonBody נושא clientData.maorKey לזיהוי-חוזר', () => {
    const [c] = collectContacts(data, 'מאור');
    const b = toPersonBody(c);
    expect(b.clientData).toEqual([{ key: 'maorKey', value: 'maor:family:f1' }]);
    expect(b.names).toEqual([{ givenName: 'משפחת כהן' }]);
    expect(b.phoneNumbers[0]).toEqual({ value: '050-1111111', type: 'main' });
  });

  it('planContactWrites: חדש⇒create, קיים(לפי maorKey)⇒update — בלי כפילות', () => {
    const c = collectContacts(data, 'מאור');
    // רק המשפחה כבר קיימת ב-Google
    const existing = { [stableKey('family', 'f1')]: { resourceName: 'people/c123', etag: 'ETAG1' } };
    const { creates, updates } = planContactWrites(c, existing);
    expect(updates).toHaveLength(1);
    expect(updates[0].resourceName).toBe('people/c123');
    expect(updates[0].etag).toBe('ETAG1');
    expect(creates).toHaveLength(2); // התורם + המתנדב חדשים
  });

  it('ריצה-חוזרת עם כולם-קיימים ⇒ 0 create (אידמפוטנטי)', () => {
    const c = collectContacts(data, 'מאור');
    const existing = {};
    for (const x of c) existing[stableKey(x.kind, x.id)] = { resourceName: 'people/' + x.id, etag: 'e' };
    const { creates, updates } = planContactWrites(c, existing);
    expect(creates).toHaveLength(0);
    expect(updates).toHaveLength(3);
  });

  it('בלי אנשי-קשר קיימים ⇒ הכל create', () => {
    const c = collectContacts(data, 'מאור');
    const { creates, updates } = planContactWrites(c, {});
    expect(creates).toHaveLength(3);
    expect(updates).toHaveLength(0);
  });
});
