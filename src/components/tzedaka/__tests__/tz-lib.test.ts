/**
 * ratchet — מנוע הקופות הטהור + פעולות ה-store (קופות 3).
 * כולל ratchet-בידוד (הכרעת בעלים 30.7.2026): הכסף והאירועים של המודול
 * לא זולגים לתרומות/קבלות/לוח הראשי.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildTzGrid,
  campaignProgress,
  collectionScoreDelta,
  grandTotal,
  leaderboard,
  lastCollectionIso,
  needsCare,
  staleBoxes,
  TZ_SCORE_RULES,
} from '../lib';
import { dayItems } from '../../calendar/calLib';
import { useApp } from '../../../store/useApp';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type Db, type TzBox, type TzCampaign, type TzCoordinator, type TzEvent } from '../../../types/domain';

function box(over: Partial<TzBox>): TzBox {
  return { id: 'tzb1', num: '42', coordinatorId: 'tzc1', famId: '', holderKind: '', since: '', status: 'home', notes: '', collections: [], ...over };
}
function coord(over: Partial<TzCoordinator>): TzCoordinator {
  return { id: 'tzc1', name: 'שרהל׳ה', famId: '', memberId: '', phone: '', notes: '', active: true, startDate: '', score: 0, scoreLog: [], ...over };
}
function camp(over: Partial<TzCampaign>): TzCampaign {
  return { id: 'tzp1', name: 'חנוכה', start: '2026-07-01', end: '', goal: 0, active: true, notes: '', ...over };
}
function tzev(over: Partial<TzEvent>): TzEvent {
  return { id: 'tze1', title: 'סבב', date: '2026-08-15', time: '', kind: 'round', coordinatorId: '', boxId: '', notes: '', done: false, ...over };
}
const coll = (id: string, date: string, amount: number, campaignId = '') => ({ id, date, amount, campaignId, note: '' });

describe('🪙 ratchet — קופות 3: מנוע הניקוד', () => {
  it('ריקון ראשון 120₪ ⇒ 10+2=12; ‏49₪ ⇒ 10 בלבד', () => {
    expect(collectionScoreDelta(box({}), '2026-07-30', 120)).toBe(12);
    expect(collectionScoreDelta(box({}), '2026-07-30', 49)).toBe(10);
    expect(TZ_SCORE_RULES.streakDays).toBe(60);
  });

  it('רצף: ריקון שני בתוך 60 יום ⇒ +5; אחרי 61 יום ⇒ בלי הבונוס', () => {
    const b = box({ collections: [coll('tzl1', '2026-06-01', 100)] });
    expect(collectionScoreDelta(b, '2026-07-30', 100)).toBe(10 + 2 + 5); // 59 יום
    expect(collectionScoreDelta(b, '2026-08-01', 100)).toBe(10 + 2); // 61 יום
  });
});

describe('🪙 ratchet — קופות 3: סכומים, טיפול, מובילים, מבצעים', () => {
  it('staleBoxes: קופת home שלא רוקנה 90 יום (או מעולם לפי since) — נתפסת; office לא', () => {
    const stale = box({ id: 'a', collections: [coll('l1', '2026-04-01', 50)] });
    const fresh = box({ id: 'b', collections: [coll('l2', '2026-07-01', 50)] });
    const never = box({ id: 'c', since: '2026-01-01' });
    const office = box({ id: 'd', status: 'office', collections: [coll('l3', '2026-01-01', 50)] });
    const out = staleBoxes([stale, fresh, never, office], '2026-07-30');
    expect(out.map((b) => b.id)).toEqual(['a', 'c']);
  });

  it('needsCare: ישנה · אבודה · רכז לא-פעיל עם קופות בבית · מבצע שמסתיים בתוך 14 יום', () => {
    const db: Db = {
      ...emptyDb(),
      tzCoordinators: [coord({ id: 'tzc9', name: 'דב', active: false })],
      tzBoxes: [
        box({ id: 'a', collections: [coll('l1', '2026-01-01', 10)] }),
        box({ id: 'b', num: '7', status: 'lost' }),
        box({ id: 'c', num: '8', coordinatorId: 'tzc9' , since: '2026-07-29', collections: [coll('l2', '2026-07-29', 10)] }),
      ],
      tzCampaigns: [camp({ id: 'p1', end: '2026-08-05' }), camp({ id: 'p2', name: 'רחוק', end: '2026-12-01' })],
    };
    const kinds = needsCare(db, '2026-07-30').map((x) => x.kind);
    expect(kinds).toContain('stale');
    expect(kinds).toContain('lost');
    expect(kinds).toContain('inactiveCoord');
    expect(kinds.filter((k) => k === 'campaignEnding')).toHaveLength(1);
  });

  it('leaderboard: פעילים בלבד, score יורד ואז סכום; campaignProgress קטום ו-goal=0⇒pct=0', () => {
    const boxes = [
      box({ id: 'a', coordinatorId: 'c1', collections: [coll('l1', '2026-07-01', 300, 'p1')] }),
      box({ id: 'b', coordinatorId: 'c2', collections: [coll('l2', '2026-07-01', 500, 'p1')] }),
    ];
    const rows = leaderboard(
      [coord({ id: 'c1', score: 20 }), coord({ id: 'c2', name: 'ב', score: 20 }), coord({ id: 'c3', name: 'כבוי', active: false })],
      boxes,
    );
    expect(rows.map((r) => r.coordinator.id)).toEqual(['c2', 'c1']); // תיקו בניקוד ⇒ סכום מכריע
    expect(campaignProgress(camp({ id: 'p1', goal: 400 }), boxes)).toEqual({ sum: 800, goal: 400, pct: 100 });
    expect(campaignProgress(camp({ id: 'p1', goal: 0 }), boxes).pct).toBe(0);
    expect(grandTotal(boxes)).toBe(800);
    expect(lastCollectionIso(boxes[0])).toBe('2026-07-01');
  });

  it('buildTzGrid: אירוע ב-15 לחודש מופיע בתא הנכון — לועזי ועברי', () => {
    const evs = [tzev({ date: '2026-08-15' })];
    const g1 = buildTzGrid(evs, '2026-08-15', false);
    const hit1 = g1.cells.find((c) => c.iso === '2026-08-15');
    expect(hit1?.events).toHaveLength(1);
    expect(hit1?.inMonth).toBe(true);
    const g2 = buildTzGrid(evs, '2026-08-15', true);
    const hit2 = g2.cells.find((c) => c.iso === '2026-08-15');
    expect(hit2?.events).toHaveLength(1);
    expect(g2.cells.filter((c) => c.inMonth).every((c, i, arr) => i === 0 || arr[i - 1].iso < c.iso)).toBe(true);
  });
});

describe('🛡 ratchet-בידוד — הכרעת בעלים 30.7.2026', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      tzCoordinators: [coord({})],
      tzBoxes: [box({})],
    }));
  });

  it('(א) addTzCollection לא נוגע ב-donationSeq/receiptSeq ולא מוסיף Donation/Payment', () => {
    const before = useApp.getState().db;
    const res = useApp.getState().addTzCollection('tzb1', { date: '2026-07-30', amount: 120, campaignId: '', note: '' });
    const after = useApp.getState().db;
    expect(res.ok).toBe(true);
    expect(after.donationSeq).toBe(before.donationSeq);
    expect(after.receiptSeq).toBe(before.receiptSeq);
    expect(after.supporters).toEqual(before.supporters);
    expect(after.enrollments).toEqual(before.enrollments);
    expect(after.events).toEqual(before.events);
    // הכסף נרשם רק בקופה + הניקוד רק אצל הרכז
    expect(after.tzBoxes[0].collections).toHaveLength(1);
    expect(after.tzCoordinators[0].score).toBe(12);
    expect(after.tzCoordinators[0].scoreLog[0].reason).toBe('ריקון קופה 42');
  });

  it('(ב) אירועי הלוח הייעודי אינם מופיעים בלוח הראשי (dayItems)', () => {
    const db: Db = { ...emptyDb(), tzEvents: [tzev({ date: '2026-08-02' })] };
    const items = dayItems(db, new Date('2026-08-02T12:00:00'));
    expect(items).toHaveLength(0);
  });

  it('סכום לא-חוקי נדחה בלי לגעת ב-db (לקח באג-5); דגל score כבוי ⇒ delta=0', () => {
    const before = useApp.getState().db;
    expect(useApp.getState().addTzCollection('tzb1', { date: '2026-07-30', amount: 0, campaignId: '', note: '' })).toEqual({ ok: false, delta: 0 });
    expect(useApp.getState().addTzCollection('tzb1', { date: '2026-07-30', amount: NaN, campaignId: '', note: '' }).ok).toBe(false);
    expect(useApp.getState().db).toEqual(before);
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: { 'tzedaka.score': false } } });
    const res = useApp.getState().addTzCollection('tzb1', { date: '2026-07-30', amount: 100, campaignId: '', note: '' });
    expect(res).toEqual({ ok: true, delta: 0 });
    expect(useApp.getState().db.tzCoordinators[0].score).toBe(0);
  });

  it('deleteTzCoordinator חסום עם קופות home; אחרי retire — מוחק וגם מנקה אירועים מקושרים', () => {
    useApp.getState().upsertTzEvent(tzev({ id: 'tze9', coordinatorId: 'tzc1' }));
    expect(useApp.getState().deleteTzCoordinator('tzc1')).toBe(false);
    expect(useApp.getState().db.tzCoordinators).toHaveLength(1);
    useApp.getState().upsertTzBox({ ...useApp.getState().db.tzBoxes[0], status: 'retired' });
    expect(useApp.getState().deleteTzCoordinator('tzc1')).toBe(true);
    expect(useApp.getState().db.tzCoordinators).toHaveLength(0);
    expect(useApp.getState().db.tzEvents).toHaveLength(0);
  });

  it('deleteTzCampaign מנקה שיוך בלי למחוק ריקונים; deleteTzBox מנקה אירועי-קופה', () => {
    useApp.getState().upsertTzCampaign(camp({ id: 'tzp1' }));
    useApp.getState().addTzCollection('tzb1', { date: '2026-07-30', amount: 100, campaignId: 'tzp1', note: '' });
    useApp.getState().deleteTzCampaign('tzp1');
    const b = useApp.getState().db.tzBoxes[0];
    expect(b.collections).toHaveLength(1);
    expect(b.collections[0].campaignId).toBe('');
    useApp.getState().upsertTzEvent(tzev({ id: 'tze8', boxId: 'tzb1' }));
    useApp.getState().deleteTzBox('tzb1');
    expect(useApp.getState().db.tzBoxes).toHaveLength(0);
    expect(useApp.getState().db.tzEvents.some((e) => e.id === 'tze8')).toBe(false);
  });
});
