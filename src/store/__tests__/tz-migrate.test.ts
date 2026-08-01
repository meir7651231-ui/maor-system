/**
 * ratchet — שכבת הנתונים של קופות הצדקה (קופות 1, BUILD-ORDER-TZEDAKA).
 * תוספת אדיטיבית: DB_VERSION נשאר 5 — גיבוי ישן בלי מערכי tz נטען עם [];
 * migrate מרפא score/scoreLog/collections/status; cloud-diff/merge מכירים
 * בארבעת האוספים כולל הגנת המערכים המקוננים.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { diffDb, ENTITY_COLLECTIONS } from '../../lib/cloud-diff';
import { applyEntityPartial } from '../../lib/cloud-merge';
import { DB_VERSION, emptyDb, type Db, type TzBox, type TzCoordinator } from '../../types/domain';

function coord(over: Partial<TzCoordinator>): TzCoordinator {
  return { id: 'tzc1', name: 'רכז', famId: '', memberId: '', phone: '', notes: '', active: true, startDate: '', score: 0, scoreLog: [], ...over };
}
function box(over: Partial<TzBox>): TzBox {
  return { id: 'tzb1', num: '42', coordinatorId: 'tzc1', famId: '', holderKind: '', since: '', status: 'home', notes: '', collections: [], ...over };
}

describe('🪙 ratchet — קופות 1: מיגרציה אדיטיבית (DB_VERSION נשאר 5)', () => {
  it('(א) גיבוי ישן בלי מערכי tz — נטען עם [] לארבעתם', () => {
    const old = { ...emptyDb(), v: DB_VERSION } as Record<string, unknown>;
    delete old.tzCoordinators;
    delete old.tzBoxes;
    delete old.tzCampaigns;
    delete old.tzEvents;
    const out = migrate(old)!;
    expect(out.tzCoordinators).toEqual([]);
    expect(out.tzBoxes).toEqual([]);
    expect(out.tzCampaigns).toEqual([]);
    expect(out.tzEvents).toEqual([]);
    expect(out.v).toBe(6);
  });

  it('(ב) רכז עם score מושחת ו-scoreLog חסר — נרפא ל-0 ו-[]', () => {
    const raw = {
      ...emptyDb(),
      tzCoordinators: [{ ...coord({}), score: 'הרבה' as unknown as number, scoreLog: null as unknown as [] }],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.tzCoordinators[0].score).toBe(0);
    expect(out.tzCoordinators[0].scoreLog).toEqual([]);
  });

  it('(ג) קופה בלי collections ועם סטטוס זר — נרפאת ([] + office)', () => {
    const raw = {
      ...emptyDb(),
      tzBoxes: [{ ...box({}), collections: undefined as unknown as [], status: 'garage' as unknown as 'home' }],
    };
    const out = migrate(raw as unknown as Record<string, unknown>)!;
    expect(out.tzBoxes[0].collections).toEqual([]);
    expect(out.tzBoxes[0].status).toBe('office');
  });

  it('(ד) cloud-diff מזהה set ו-delete ב-tzBoxes', () => {
    expect(ENTITY_COLLECTIONS).toContain('tzBoxes');
    const prev: Db = { ...emptyDb(), tzBoxes: [box({ id: 'tzb1' }), box({ id: 'tzb2', num: '7' })] };
    const next: Db = { ...emptyDb(), tzBoxes: [{ ...box({ id: 'tzb1' }), num: '99' }] };
    const d = diffDb(prev, next);
    expect(d.sets.some((s) => s.col === 'tzBoxes' && s.id === 'tzb1')).toBe(true);
    expect(d.deletes.some((x) => x.col === 'tzBoxes' && x.id === 'tzb2')).toBe(true);
  });

  it('(ה) applyEntityPartial על tzBoxes בלי collections — מקבל מערך ריק (LIST_FIELDS)', () => {
    const db: Db = { ...emptyDb() };
    const out = applyEntityPartial(db, 'tzBoxes', [
      { id: 'tzb9', data: { num: '5', coordinatorId: 'tzc1', status: 'home' }, deleted: false },
    ]);
    const b = out.tzBoxes.find((x) => x.id === 'tzb9')!;
    expect(Array.isArray(b.collections)).toBe(true);
    expect(b.collections).toEqual([]);
  });
});
