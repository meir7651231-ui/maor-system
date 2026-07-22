/**
 * בדיקות מנוע ההשוואה של סנכרון הענן — diffDb בלבד (טהור).
 * חשוב: מייבאים מ-cloud-diff (ללא firebase) — הבדיקות לא נוגעות ברשת.
 */
import { describe, it, expect } from 'vitest';
import { diffDb, emptyDiff, fullDbDiff, metaOf } from '../cloud-diff';
import { emptyDb, emptyFamily, type Db, type Family } from '../../types/domain';

function fam(id: string, name: string): Family {
  return { ...emptyFamily(), id, name, createdAt: '2026-01-01' };
}

function db(patch: Partial<Db> = {}): Db {
  return { ...emptyDb(), savedAt: '2026-01-01T00:00:00.000Z', ...patch };
}

describe('diffDb — אוספי ישויות', () => {
  it('אין שינוי → diff ריק', () => {
    const a = db({ families: [fam('f1', 'כהן')] });
    const b = db({ families: [fam('f1', 'כהן')] });
    const d = diffDb(a, b);
    expect(d.sets).toEqual([]);
    expect(d.deletes).toEqual([]);
    expect(d.meta).toBeNull();
    expect(emptyDiff(d)).toBe(true);
  });

  it('הוספת ישות → set באוסף הנכון', () => {
    const a = db();
    const b = db({ families: [fam('f1', 'כהן')] });
    const d = diffDb(a, b);
    expect(d.sets).toHaveLength(1);
    expect(d.sets[0]).toMatchObject({ col: 'families', id: 'f1' });
    expect((d.sets[0].data as Family).name).toBe('כהן');
    expect(d.deletes).toEqual([]);
  });

  it('שינוי ישות קיימת → set (השוואת JSON, לא זהות reference)', () => {
    const a = db({ families: [fam('f1', 'כהן')] });
    const b = db({ families: [fam('f1', 'לוי')] });
    const d = diffDb(a, b);
    expect(d.sets).toHaveLength(1);
    expect((d.sets[0].data as Family).name).toBe('לוי');
  });

  it('מחיקת ישות → delete', () => {
    const a = db({ families: [fam('f1', 'כהן'), fam('f2', 'לוי')] });
    const b = db({ families: [fam('f2', 'לוי')] });
    const d = diffDb(a, b);
    expect(d.sets).toEqual([]);
    expect(d.deletes).toEqual([{ col: 'families', id: 'f1' }]);
  });

  it('הוספה+שינוי+מחיקה יחד, כולל אוסף שני', () => {
    const a = db({
      families: [fam('f1', 'כהן'), fam('f2', 'לוי')],
      rooms: [{ ...roomStub('r1') }],
    });
    const b = db({
      families: [fam('f1', 'כהן-שונה'), fam('f3', 'מזרחי')],
      rooms: [{ ...roomStub('r1') }],
    });
    const d = diffDb(a, b);
    expect(d.sets.map((s) => s.id).sort()).toEqual(['f1', 'f3']);
    expect(d.sets.every((s) => s.col === 'families')).toBe(true);
    expect(d.deletes).toEqual([{ col: 'families', id: 'f2' }]);
  });

  it('סדר שונה בלבד (אותן ישויות) → אין sets', () => {
    const f1 = fam('f1', 'כהן');
    const f2 = fam('f2', 'לוי');
    const d = diffDb(db({ families: [f1, f2] }), db({ families: [f2, f1] }));
    expect(d.sets).toEqual([]);
    expect(d.deletes).toEqual([]);
  });
});

describe('diffDb — meta', () => {
  it('שינוי שדה meta (orgGoal) → meta מלא של המצב החדש', () => {
    const a = db();
    const b = db({ orgGoal: 50000 });
    const d = diffDb(a, b);
    expect(d.meta).not.toBeNull();
    expect(d.meta).toMatchObject({ orgGoal: 50000, orgName: 'מאור החסד' });
    // meta כולל את כל שדות ה-meta, לא רק את מה שהשתנה
    expect(Object.keys(d.meta as object).sort()).toEqual(Object.keys(metaOf(b)).sort());
  });

  it('שינוי seq / ui / attnDone → meta', () => {
    expect(diffDb(db(), db({ seq: 101 })).meta).not.toBeNull();
    expect(diffDb(db(), db({ ui: { famView: 'grid', crsView: 'grid' } })).meta).not.toBeNull();
    expect(diffDb(db(), db({ attnDone: { x: '2026-01-01' } })).meta).not.toBeNull();
  });

  it('שינוי savedAt בלבד → אינו נחשב שינוי meta (רעש שמירה)', () => {
    const a = db({ savedAt: '2026-01-01T00:00:00.000Z' });
    const b = db({ savedAt: '2026-06-01T00:00:00.000Z' });
    const d = diffDb(a, b);
    expect(d.meta).toBeNull();
    expect(emptyDiff(d)).toBe(true);
  });

  it('שינוי ישות בלבד → meta נשאר null', () => {
    const a = db();
    const b = db({ families: [fam('f1', 'כהן')] });
    expect(diffDb(a, b).meta).toBeNull();
  });
});

describe('fullDbDiff — הגירה ראשונה', () => {
  it('מייצר set לכל ישות בכל האוספים + meta, ללא מחיקות', () => {
    const d1 = fullDbDiff(db({ families: [fam('f1', 'כהן')], rooms: [roomStub('r1')] }));
    expect(d1.sets.map((s) => `${s.col}/${s.id}`).sort()).toEqual(['families/f1', 'rooms/r1']);
    expect(d1.deletes).toEqual([]);
    expect(d1.meta).toMatchObject({ orgName: 'מאור החסד', seq: 100 });
  });
});

/** חדר מינימלי תקין לבדיקות. */
function roomStub(id: string) {
  return {
    id,
    name: 'חדר ' + id,
    active: true,
    slot: 60,
    cap: 20,
    location: '',
    rate: 0,
    from: '08:00',
    to: '20:00',
    access: true,
    notes: '',
    eq: {},
  };
}
