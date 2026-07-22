import { describe, it, expect } from 'vitest';
import { migrate } from '../../store/persist';
import { DB_VERSION } from '../../types/domain';

/** Minimal v1 prototype-style blob (missing most v2 fields). */
function v1Blob(): Record<string, unknown> {
  return {
    v: 1,
    families: [
      { id: 'f1', name: 'כהן', members: [{ id: 'm1', first: 'דוד' }] },
      // duplicate id — must be deduped
      { id: 'f1', name: 'כהן (כפול)' },
      // missing id + missing arrays — must be repaired
      { name: 'לוי' },
    ],
    courses: [{ id: 'c1', name: 'ציור' }],
    seq: 7,
  };
}

describe('migrate', () => {
  it('upgrades a v1 prototype blob to the current version', () => {
    const db = migrate(v1Blob());
    expect(db).not.toBeNull();
    expect(db!.v).toBe(DB_VERSION);
    expect(db!.courses).toHaveLength(1);
    // fields absent in v1 get defaults from emptyDb
    expect(db!.orgName).toBeTruthy();
    expect(Array.isArray(db!.supporters)).toBe(true);
    expect(db!.notif).toBeDefined();
    expect(db!.ui).toBeDefined();
    // seq never goes below the base floor
    expect(db!.seq).toBeGreaterThanOrEqual(7);
  });

  it('dedups families by id and repairs missing ids/arrays', () => {
    const db = migrate(v1Blob())!;
    const ids = db.families.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    expect(ids.filter((id) => id === 'f1')).toHaveLength(1);
    // first occurrence wins
    expect(db.families.find((f) => f.id === 'f1')!.name).toBe('כהן');
    // family without id got a generated one; missing arrays filled
    const levi = db.families.find((f) => f.name === 'לוי')!;
    expect(levi.id).toBeTruthy();
    expect(levi.members).toEqual([]);
    expect(levi.docs).toEqual([]);
  });

  it('returns null on unknown (future) version', () => {
    expect(migrate({ v: DB_VERSION + 1, families: [] })).toBeNull();
    expect(migrate({ v: 999 })).toBeNull();
  });

  it('returns null on non-objects and blobs without a version', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate(undefined)).toBeNull();
    expect(migrate('nope')).toBeNull();
    expect(migrate(42)).toBeNull();
    expect(migrate({})).toBeNull();
    expect(migrate({ families: [] })).toBeNull();
  });

  it('converts legacy v1 string docs to FamilyDoc objects', () => {
    const db = migrate({
      v: 1,
      families: [{ id: 'f1', name: 'כהן', docs: ['tofes.pdf', 'sefach.jpg'] }],
    })!;
    expect(db.families[0].docs).toEqual([
      { id: 'dx0', name: 'tofes.pdf', addedAt: '' },
      { id: 'dx1', name: 'sefach.jpg', addedAt: '' },
    ]);
  });

  it('maps legacy cred log fields (desc→reason, d→date)', () => {
    const db = migrate({
      v: 1,
      families: [
        {
          id: 'f1',
          name: 'כהן',
          cred: {
            score: 320,
            log: [
              { d: '2024-01-01', delta: 5, desc: 'תשלום' },
              { date: '2024-02-01', delta: -2, desc: 'ביטול' },
            ],
          },
        },
      ],
    })!;
    const cred = db.families[0].cred;
    expect(cred.score).toBe(320);
    expect(cred.log).toEqual([
      { date: '2024-01-01', delta: 5, reason: 'תשלום' },
      { date: '2024-02-01', delta: -2, reason: 'ביטול' },
    ]);
  });

  it('defaults missing cred to the original prototype score (700)', () => {
    const db = migrate({ v: 1, families: [{ id: 'f1', name: 'לוי' }] })!;
    expect(db.families[0].cred).toEqual({ score: 700, log: [] });
  });

  it('accepts a current-version blob and normalizes bad arrays', () => {
    const db = migrate({ v: DB_VERSION, families: 'garbage', events: null });
    expect(db).not.toBeNull();
    expect(db!.families).toEqual([]);
    expect(db!.events).toEqual([]);
  });

  it('מבטיח מזהי בני-משפחה ייחודיים גלובלית (id כפול בין שתי משפחות)', () => {
    const db = migrate({
      v: DB_VERSION,
      families: [
        { id: 'f1', name: 'כהן', members: [{ id: 'm1', first: 'רוני' }] },
        { id: 'f2', name: 'לוי', members: [{ id: 'm1', first: 'דני' }] }, // אותו id!
      ],
    })!;
    const allIds = db.families.flatMap((f) => f.members.map((m) => m.id));
    expect(new Set(allIds).size).toBe(allIds.length); // אין כפילות גלובלית
    // ההופעה הראשונה שומרת על id המקורי; השנייה קיבלה id חדש
    expect(db.families[0].members[0].id).toBe('m1');
    expect(db.families[1].members[0].id).not.toBe('m1');
    // השמות נשמרו — לא אבדו נתונים
    expect(db.families[0].members[0].first).toBe('רוני');
    expect(db.families[1].members[0].first).toBe('דני');
  });

  it('בן-משפחה בלי id מקבל id ייחודי (לא ריק, לא מתנגש)', () => {
    const db = migrate({
      v: DB_VERSION,
      families: [{ id: 'f1', name: 'כהן', members: [{ first: 'רוני' }, { first: 'שירה' }] }],
    })!;
    const ids = db.families[0].members.map((m) => m.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(2);
  });
});
