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

  it('אזכרה עברית ב"אדר" מופיעה בייצוא גם בשנה מעוברת (נרמול אדר, עקבי עם הלוח)', () => {
    // 5786 (תשפ"ו) פשוטה; 5787 מעוברת. אזכרה שנקבעה ב-אדר תשפ"ו — נבדוק ב-אדר ב׳ תשפ"ז
    // (טווח לועזי שמכסה אדר ב׳ תשפ"ז: מרץ 2027). התאריך המקורי: ~פברואר 2026.
    const db: Db = {
      ...emptyDb(),
      events: [
        { id: 'm1', title: 'אזכרה', date: '2026-02-24', time: '', type: 'memorial', customType: '', notes: '', price: 0, roomId: '', famId: '', priority: 'green', done: false },
      ],
    };
    // הטווח מכסה את כל אדר ב׳ תשפ"ז (מרץ 2027) — האזכרה חייבת להופיע פעם אחת לפחות
    const rows = buildCustomExport(cfg(), db, 'events', { from: '2027-02-01', to: '2027-04-15' }, ['title', 'gdate']);
    expect(rows.length).toBeGreaterThanOrEqual(2); // כותרת + לפחות מופע אחד
    expect(rows.slice(1).every((r) => r[0] === 'אזכרה')).toBe(true);
  });

  it('תווית מסלול בייצוא חוגים כוללת חצי-שנתי/שנתי (לא "חודשי" גורף)', () => {
    const mk = (id: string, model: string) =>
      ({ id, name: id, teacherId: '', roomId: '', cat: '', audience: '', semester: 'שנתי', model,
         size: 0, price: 500, price1: 0, price2: 0, price1Name: '', price2Name: '', maxStudents: 20,
         ageMin: 0, ageMax: 99, gender: 'all', weekday: 1, time: '16:00', start: '2026-01-01',
         end: '2026-12-31', sessions: [], img: '', active: true, notes: '', description: '', sector: '' });
    const db = { ...emptyDb(), courses: [mk('half', 'half_year'), mk('yr', 'year')] } as unknown as Db;
    const rows = buildCustomExport(cfg(), db, 'courses', { from: '', to: '' }, ['name', 'model']);
    const half = rows.find((r) => r[0] === 'half')!;
    const yr = rows.find((r) => r[0] === 'yr')!;
    expect(String(half[1])).toContain('חצי-שנתי');
    expect(String(yr[1])).toContain('שנתי');
    expect(String(half[1])).not.toContain('חודשי');
  });
});
