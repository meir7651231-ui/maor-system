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

  // ratchet (לילה 13.11.2026) — 🐛 Family.phones[] ("טלפונים נוספים", 13.10) לא נאספו בשרת.
  it('טלפונים-נוספים של משפחה (phones[]) נאספים — ראשי → נוסף → phones[] → בני-המשפחה', () => {
    const d = { families: [{ id: 'f9', name: 'לוי', phone: '050-1111111', phone2: '02-5551234', phones: [{ num: '077-9876543' }, { num: '0501111111' }], members: [{ phone: '058-7654321' }] }] };
    const [c] = collectContacts(d, 'מאור');
    expect(c.phones).toEqual(['050-1111111', '02-5551234', '077-9876543', '058-7654321']);
    expect(JSON.stringify(toPersonBody(c))).toContain('077-9876543');
  });

  it('משפחה עם טלפון ב-phones[] בלבד לא מדולגת; phones פגום לא מפיל', () => {
    const d = {
      families: [{ id: 'f8', name: 'כץ', phone: '', phones: [{ num: '077-1112223' }] }, { id: 'f7', name: 'בר', phone: '050-2223334', phones: 'garbage' }],
      supporters: [{ id: 's7', name: 'דן', phone: '052-2222222', phones: [null, { num: '03-9999999' }] }],
    };
    const c = collectContacts(d, 'מאור');
    expect(c.map((x) => x.phones)).toEqual([['077-1112223'], ['050-2223334'], ['052-2222222', '03-9999999']]);
  });
});
