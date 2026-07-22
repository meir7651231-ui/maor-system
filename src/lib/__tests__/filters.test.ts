/**
 * בדיקות מסנני הרשימות — תחביר המספרים של סינון-עמודות (numMatch)
 * וצירי גלגל מאתר המשפחות (finderAxisValue/finderMatches).
 */
import { describe, expect, it } from 'vitest';
import { numMatch } from '../../components/families/lib';
import { finderAxisValue, finderMatches } from '../../components/families/FamilyFinder';
import { emptyDb, emptyFamily } from '../../types/domain';
import type { Db, Family } from '../../types/domain';

describe('numMatch — תחביר סינון עמודות', () => {
  it('ריק לא מסנן', () => {
    expect(numMatch('', 5)).toBe(true);
    expect(numMatch('  ', 0)).toBe(true);
  });
  it('מספר בדיוק', () => {
    expect(numMatch('3', 3)).toBe(true);
    expect(numMatch('3', 4)).toBe(false);
  });
  it('N+ = לפחות', () => {
    expect(numMatch('3+', 3)).toBe(true);
    expect(numMatch('3+', 7)).toBe(true);
    expect(numMatch('3+', 2)).toBe(false);
    expect(numMatch('3 +', 3)).toBe(true);
  });
  it('טווח A-B', () => {
    expect(numMatch('2-4', 2)).toBe(true);
    expect(numMatch('2-4', 4)).toBe(true);
    expect(numMatch('2-4', 5)).toBe(false);
    expect(numMatch('2 - 4', 3)).toBe(true);
  });
  it('קלט לא-מספרי לא מסנן', () => {
    expect(numMatch('abc', 1)).toBe(true);
  });
});

function fam(over: Partial<Omit<Family, 'createdAt'>>): Family {
  return { ...emptyFamily(), createdAt: '2026-01-01', id: 'f' + Math.abs(JSON.stringify(over).length), ...over };
}

function dbWith(families: Family[]): Db {
  return { ...emptyDb(), families };
}

describe('finderAxisValue — צירי גלגל המאתר', () => {
  const db = dbWith([]);
  it('עיר וקהילה', () => {
    const f = fam({ city: 'בני ברק', community: 'גור' });
    expect(finderAxisValue(db, f, 'city')).toBe('בני ברק');
    expect(finderAxisValue(db, f, 'comm')).toBe('גור');
  });
  it('מצב משפחתי חסר = לא ידוע', () => {
    expect(finderAxisValue(db, fam({}), 'marital')).toBe('לא ידוע');
  });
  it('אמינות לפי דרגה', () => {
    const f = fam({});
    f.cred = { ...f.cred, score: 960 };
    expect(finderAxisValue(db, f, 'cred')).toBe('טיטאן');
    f.cred = { ...f.cred, score: 400 };
    expect(finderAxisValue(db, f, 'cred')).toBe('סיכון נטישה');
  });
  it('ספח מלא', () => {
    expect(finderAxisValue(db, fam({ fullSefach: true }), 'sefach')).toBe('קיים');
    expect(finderAxisValue(db, fam({ fullSefach: false }), 'sefach')).toBe('חסר');
  });
});

describe('finderMatches — נעילות מסננות בשרשרת', () => {
  const a = fam({ name: 'א', city: 'בני ברק', community: 'גור' });
  const b = fam({ name: 'ב', city: 'בני ברק', community: 'בעלז' });
  const c = fam({ name: 'ג', city: 'ירושלים', community: 'גור' });
  a.id = 'fa'; b.id = 'fb'; c.id = 'fc';
  const db = dbWith([a, b, c]);

  it('בלי נעילות — כולן', () => {
    expect(finderMatches(db, {}).length).toBe(3);
  });
  it('נעילת עיר', () => {
    expect(finderMatches(db, { city: 'בני ברק' }).map((f) => f.id)).toEqual(['fa', 'fb']);
  });
  it('עיר + קהילה', () => {
    expect(finderMatches(db, { city: 'בני ברק', comm: 'גור' }).map((f) => f.id)).toEqual(['fa']);
  });
});
