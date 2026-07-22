import { describe, it, expect } from 'vitest';
import { buildCustomExport, expFieldDefs } from '../customExport';
import { DEFAULT_CONFIG, type OrgConfig } from '../../types/config';
import { emptyDb, emptyAyin, type Db, type Supporter } from '../../types/domain';

function cfg(partial: Partial<OrgConfig> = {}): OrgConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}

function sup(over: Partial<Supporter>): Supporter {
  return {
    id: 's1',
    name: 'תומך',
    phone: '050',
    email: 'a@b.com',
    address: '',
    idNum: '',
    cat: '',
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
    ...over,
  };
}

describe('expFieldDefs — ayin columns gated by feature', () => {
  it('includes ayin fields when supporters.ayin is on', () => {
    const keys = expFieldDefs(cfg(), 'supporters').map((f) => f.key);
    expect(keys).toContain('stage');
    expect(keys).toContain('names');
  });

  it('omits ayin fields when supporters.ayin is off', () => {
    const c = cfg({ features: { 'supporters.ayin': false } });
    const keys = expFieldDefs(c, 'supporters').map((f) => f.key);
    expect(keys).not.toContain('stage');
    expect(keys).not.toContain('names');
    expect(keys).toEqual(['name', 'phone', 'email', 'dons']);
  });
});

describe('buildCustomExport — field selection', () => {
  it('header contains only the selected columns, in def order', () => {
    const db: Db = { ...emptyDb(), supporters: [sup({ donations: [{ rid: 'D1', date: '2026-03-01', amount: 100, cur: '₪', cat: '' }] })] };
    const rows = buildCustomExport(cfg(), db, 'supporters', { from: '', to: '' }, ['phone', 'name']);
    // סדר לפי defs (name לפני phone), לא לפי סדר הבחירה
    expect(rows[0]).toEqual(['שם', 'טלפון']);
    expect(rows[1]).toEqual(['תומך', '050']);
  });

  it('empty selection → header row only (empty)', () => {
    const rows = buildCustomExport(cfg(), emptyDb(), 'supporters', { from: '', to: '' }, []);
    expect(rows).toEqual([[]]);
  });

  it('filters supporter donations by range and renders ayin names', () => {
    const s = sup({
      donations: [
        { rid: 'D1', date: '2026-03-01', amount: 100, cur: '₪', cat: '' },
        { rid: 'D2', date: '2020-01-01', amount: 999, cur: '₪', cat: '' },
      ],
      ayin: { ...emptyAyin(), stage: 'eyes', lastTouch: '2026-03-05', names: [{ id: 'n', name: 'אבי', eyes: 3, done: false }] },
    });
    const db: Db = { ...emptyDb(), supporters: [s] };
    const rows = buildCustomExport(cfg(), db, 'supporters', { from: '2026-01-01', to: '2026-12-31' }, ['name', 'dons', 'names']);
    expect(rows[0]).toEqual(['שם', 'תרומות בטווח (מספר + סכום)', expect.stringContaining('שם לטיפול')]);
    // רק תרומה אחת בטווח (₪100)
    expect(String(rows[1][1])).toContain('1 תרומות');
    expect(String(rows[1][1])).toContain('100');
    expect(String(rows[1][2])).toContain('אבי');
  });

  it('events non-recurring occurrence within range', () => {
    const db: Db = {
      ...emptyDb(),
      events: [
        { id: 'e1', title: 'כנס', date: '2026-05-10', time: '19:00', type: 'org', customType: '', notes: '', price: 0, roomId: '', famId: '', priority: 'green', done: false },
        { id: 'e2', title: 'ישן', date: '2020-01-01', time: '', type: 'org', customType: '', notes: '', price: 0, roomId: '', famId: '', priority: 'green', done: false },
      ],
    };
    const rows = buildCustomExport(cfg(), db, 'events', { from: '2026-01-01', to: '2026-12-31' }, ['title', 'gdate']);
    expect(rows).toHaveLength(2);
    expect(rows[1][0]).toBe('כנס');
    expect(rows[1][1]).toBe('10/05/2026');
  });
});
