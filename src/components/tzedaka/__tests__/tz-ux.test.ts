/**
 * ratchet — חיפוש/סינון/מיון בקופות (UX סינון 1).
 * כל הלוגיקה טהורה ב-lib; ההתאמה הטקסטואלית דרך smartFilter (שגיאות-כתיב
 * נתפסות); הקישור הצולב למשפחה מגודר moduleOn.
 */
import { describe, expect, it } from 'vitest';
import { boxesOverview, filterCollections, filterCoordinators } from '../lib';
import { emptyDb, type Db, type TzBox, type TzCoordinator } from '../../../types/domain';
import coordsTabSrc from '../CoordinatorsTab.tsx?raw';
import coordCardSrc from '../CoordinatorCard.tsx?raw';
import calSrc from '../CalendarTab.tsx?raw';
import collectSrc from '../CollectModal.tsx?raw';

function coord(over: Partial<TzCoordinator>): TzCoordinator {
  return { id: 'tzc1', name: 'שרה לוינשטיין', famId: '', memberId: '', phone: '', notes: '', active: true, startDate: '', score: 0, scoreLog: [], ...over };
}
function box(over: Partial<TzBox>): TzBox {
  return { id: 'tzb1', num: '42', coordinatorId: 'tzc1', famId: '', holderKind: '', since: '', status: 'home', notes: '', collections: [], ...over };
}
const coll = (id: string, date: string, amount: number, campaignId = '') => ({ id, date, amount, campaignId, note: '' });

describe('🔍 ratchet — סינון 1: קופות צדקה', () => {
  const coords = [
    coord({ id: 'a', name: 'שרה לוינשטיין', score: 10 }),
    coord({ id: 'b', name: 'דוד פרידמן', score: 30 }),
    coord({ id: 'c', name: 'רבקה כהן', active: false, score: 50 }),
  ];
  const boxes = [
    box({ id: 'b1', coordinatorId: 'a', collections: [coll('l1', '2026-07-01', 500)] }),
    box({ id: 'b2', num: '7', coordinatorId: 'b', collections: [coll('l2', '2026-02-01', 100)] }),
  ];

  it('filterCoordinators: שגיאת-כתיב קלה נתפסת (smartFilter); פעילים-בלבד; מיון stale', () => {
    // "לוינשטין" (בלי י׳) עדיין מוצא את שרה
    expect(filterCoordinators(coords, boxes, 'לוינשטין', true, 'name').map((c) => c.id)).toEqual(['a']);
    // פעילים בלבד — רבקה (לא פעילה) מוסתרת; onlyActive=false מחזיר אותה
    expect(filterCoordinators(coords, boxes, '', true, 'name')).toHaveLength(2);
    expect(filterCoordinators(coords, boxes, '', false, 'name')).toHaveLength(3);
    // stale: ריקון-ישן-קודם — דוד (פברואר) לפני שרה (יולי)
    expect(filterCoordinators(coords, boxes, '', true, 'stale').map((c) => c.id)).toEqual(['b', 'a']);
    // score: יורד
    expect(filterCoordinators(coords, boxes, '', true, 'score').map((c) => c.id)).toEqual(['b', 'a']);
    expect(filterCoordinators(coords, boxes, '', true, 'total').map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('boxesOverview: שם רכז ומשפחה, סינון סטטוס, מיון ריקון-ישן-קודם', () => {
    const db: Db = {
      ...emptyDb(),
      families: [{ id: 'f1', name: 'כהן', members: [] } as unknown as Db['families'][number]],
      tzCoordinators: coords,
      tzBoxes: [
        box({ id: 'b1', num: '12', coordinatorId: 'a', famId: 'f1', collections: [coll('l1', '2026-07-01', 500)] }),
        box({ id: 'b2', num: '7', coordinatorId: 'b', status: 'office', collections: [coll('l2', '2026-02-01', 100)] }),
      ],
    };
    const all = boxesOverview(db, '', '', 'num');
    expect(all.map((r) => r.box.num)).toEqual(['7', '12']); // מיון מספרי, לא לקסיקוגרפי
    expect(all[1].coordName).toBe('שרה לוינשטיין');
    expect(all[1].famName).toBe('כהן');
    expect(boxesOverview(db, '', 'office', 'num').map((r) => r.box.num)).toEqual(['7']);
    expect(boxesOverview(db, '', '', 'lastCollection')[0].box.num).toBe('7'); // ישן קודם
    expect(boxesOverview(db, 'כהן', '', 'num').map((r) => r.box.num)).toEqual(['12']); // לפי משפחה
  });

  it('filterCollections: טווח כוללני + מבצע', () => {
    const b = box({
      collections: [coll('l1', '2026-01-15', 10), coll('l2', '2026-03-01', 20, 'p1'), coll('l3', '2026-06-30', 30)],
    });
    expect(filterCollections(b, '2026-03-01', '2026-06-30', '').map((c) => c.id)).toEqual(['l2', 'l3']);
    expect(filterCollections(b, '', '', 'p1').map((c) => c.id)).toEqual(['l2']);
    expect(filterCollections(b, '', '', '')).toHaveLength(3);
  });

  it('הגנת-מקור: הסינון מה-lib (לא ב-JSX); הקישור הצולב מגודר moduleOn; סינון הלוח לפני buildTzGrid', () => {
    expect(coordsTabSrc).toContain('filterCoordinators(');
    expect(coordsTabSrc).toContain('boxesOverview(');
    expect(coordsTabSrc).toMatch(/moduleOn\(config, 'families'\)/);
    expect(coordCardSrc).toContain('filterCollections(');
    expect(coordCardSrc).toMatch(/moduleOn\(config, 'families'\)/);
    expect(calSrc).toMatch(/tzEvents\.filter\(\(e\) => !kindsOff\.has\(e\.kind\)\)/);
    expect(calSrc).toContain('buildTzGrid(shownEvents');
  });

  // ratchet — הבאג: save() של CollectModal בדק סכום אך לא תאריך; HebDateInput במצב
  // לועזי פולט '' בניקוי ⇒ ריקון עם date:'' — הקופה מוצגת 'טרם רוקנה' לנצח,
  // staleBoxes ממשיך להתריע והרצף NaN. הגנת-מקור: חסימה כמו TzEventModal.
  it('🛡 תאריך ריק חסום ב-save() של CollectModal (swarm-audit)', () => {
    expect(collectSrc).toMatch(/if \(!f\.date\) return setError\(/);
  });
});
