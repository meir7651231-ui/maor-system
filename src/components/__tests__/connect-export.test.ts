/**
 * ratchet — CONNECT חיבור 6: תדפיסי שטח וייצוא.
 * השורות טהורות (unit); **מבוטל מסומן ולא מוסתר בייצוא** (שקיפות);
 * הכפתורים מאחורי tzedaka.export / shop.export.
 */
import { describe, expect, it } from 'vitest';
import { collectionsCsvRows, coordinatorPrintLines } from '../tzedaka/lib';
import { redemptionsCsvRows } from '../shop/lib';
import { emptyDb, type Db } from '../../types/domain';
import tzHomeSrc from '../tzedaka/HomeTab.tsx?raw';
import shopHomeSrc from '../shop/HomeTab.tsx?raw';
import coordCardSrc from '../tzedaka/CoordinatorCard.tsx?raw';

const db: Db = {
  ...emptyDb(),
  families: [{ id: 'f1', name: 'כהן', address: 'הרצל 5', city: 'בני ברק', phone: '03-1234567', members: [] } as unknown as Db['families'][number]],
  tzCoordinators: [{ id: 'tzc1', name: 'שרה', famId: '', memberId: '', phone: '', notes: '', active: true, startDate: '', score: 0, scoreLog: [] }],
  tzBoxes: [
    { id: 'tzb1', num: '12', coordinatorId: 'tzc1', famId: 'f1', holderKind: '', since: '2026-01-01', status: 'home', notes: '', collections: [{ id: 'l1', date: '2026-06-15', amount: 120, campaignId: '', note: '' }] },
  ],
  shopItems: [{ id: 'shi1', name: 'סט תפילין', kind: 'gift', storeId: '', value: 200, basePrice: 50, active: true, notes: '' }],
  shopProducts: [{ id: 'shp1', name: 'מוצר חתן', desc: '', active: true, notes: '', components: [{ id: 'c1', itemId: 'shi1', kind: 'gift', label: 'סט תפילין', storeId: '', notes: '' }] }],
  shopAssignments: [
    {
      id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '',
      redemptions: [
        { id: 'r1', rid: 'S-1', componentId: 'c1', date: '2026-07-05', holiday: '', paid: 50, value: 200, note: '' },
        { id: 'r2', rid: 'S-2', componentId: 'c1', date: '2026-07-10', holiday: '', paid: 30, value: 100, note: '', voidedAt: '2026-07-11', voidReason: 'טעות' },
      ],
    },
  ],
};

describe('🔌 ratchet — חיבור 6: תדפיסים וייצוא', () => {
  it('תדפיס הרכז: מספר, משפחה, כתובת, טלפון וריקון אחרון — טהור', () => {
    const lines = coordinatorPrintLines(db, 'tzc1');
    expect(lines[0]).toContain('שרה');
    const row = lines.find((l) => l.includes('#12'))!;
    expect(row).toContain('משפחת כהן');
    expect(row).toContain('הרצל 5, בני ברק');
    expect(row).toContain('03-1234567');
    expect(row).toContain('ריקון אחרון: 2026-06-15');
  });

  it('CSV ריקונים: כותרת + שורה לכל ריקון', () => {
    const rows = collectionsCsvRows(db);
    expect(rows[0]).toEqual(['תאריך', 'רכז', 'קופה', 'משפחה', 'סכום', 'מבצע']);
    expect(rows[1]).toEqual(['2026-06-15', 'שרה', '#12', 'כהן', 120, '']);
  });

  it('CSV מימושים: מבוטל מסומן ולא מוסתר (שקיפות) + ה-S- נשמר', () => {
    const rows = redemptionsCsvRows(db);
    expect(rows).toHaveLength(3); // כותרת + 2 מימושים — המבוטל לא הוסתר
    const voided = rows.find((r) => r[6] === 'S-2')!;
    expect(voided[7]).toBe('בוטל ב-2026-07-11');
    const live = rows.find((r) => r[6] === 'S-1')!;
    expect(live[7]).toBe('');
  });

  it('הגנת-מקור: הכפתורים מאחורי הדגלים', () => {
    expect(tzHomeSrc).toMatch(/featureOn\(config, 'tzedaka\.export'\)[\s\S]{0,200}ייצוא ריקונים/);
    expect(shopHomeSrc).toMatch(/featureOn\(config, 'shop\.export'\)[\s\S]{0,200}ייצוא מימושים/);
    expect(coordCardSrc).toMatch(/featureOn\(config, 'tzedaka\.export'\)[\s\S]{0,300}coordinatorPrintLines/);
  });
});
