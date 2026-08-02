/**
 * ratchet — SHOP7 (מתנדבים · יום-חלוקה · מסירות). מעקב **קדימה**; הקלט =
 * shopAssignments (SHOP6); בידוד כספי מוחלט (אפס קבלות/כסף/S-).
 */
import { describe, expect, it } from 'vitest';
import { emptyDb } from '../../../types/domain';
import type { Db, Delivery, ShopAssignment, Volunteer } from '../../../types/domain';
import {
  advanceStatus,
  dayProgress,
  deliveriesOfFamily,
  deliveriesOfVolunteer,
  deliveryListLines,
  eligibleAssignmentsForDay,
  pendingDeliveriesToday,
  statusLabel,
  volunteerLoadHint,
} from '../lib';
import libSrc from '../lib.ts?raw';
import storeSrc from '../../../store/useApp.ts?raw';

const asg = (id: string, status: ShopAssignment['status'] = 'active'): ShopAssignment => ({
  id, productId: 'p1', famId: 'f' + id, memberId: '', criterionIds: [], since: '', status, notes: '', redemptions: [],
});
const del = (id: string, dayId: string, volId: string, asgId: string, status: Delivery['status'] = 'pickup'): Delivery => ({
  id, dayId, assignmentId: asgId, volunteerId: volId, familyId: 'f', status, note: '',
});
const vol = (id: string, max?: number): Volunteer => ({ id, name: 'מ' + id, phone: '', maxDeliveries: max, active: true, note: '', createdAt: '2026-08-01' });

describe('🚚 ratchet — SHOP7 מנוע', () => {
  it('advanceStatus — קדימה בלבד; delivered סופי', () => {
    expect(advanceStatus('pickup')).toBe('enroute');
    expect(advanceStatus('enroute')).toBe('delivered');
    expect(advanceStatus('delivered')).toBe('delivered'); // סופי
    expect(statusLabel('pickup')).toBe('איסוף');
    expect(statusLabel('delivered')).toBe('נמסר');
  });

  it('eligibleAssignmentsForDay — רק פעילים שטרם במסירה ביום', () => {
    const db: Db = { ...emptyDb(), shopAssignments: [asg('a1'), asg('a2'), asg('a3', 'done')], deliveries: [del('d1', 'day1', 'v1', 'a1')] };
    const elig = eligibleAssignmentsForDay(db, 'day1').map((a) => a.id);
    expect(elig).toContain('a2'); // פעיל, לא-משויך
    expect(elig).not.toContain('a1'); // כבר במסירה ביום
    expect(elig).not.toContain('a3'); // לא-פעיל
    // ביום אחר — a1 שוב זמין
    expect(eligibleAssignmentsForDay(db, 'day2').map((a) => a.id)).toContain('a1');
  });

  it('dayProgress — ספירה לפי סטטוס', () => {
    const db: Db = { ...emptyDb(), deliveries: [del('d1', 'day1', 'v1', 'a1', 'pickup'), del('d2', 'day1', 'v1', 'a2', 'delivered'), del('d3', 'day1', 'v2', 'a3', 'enroute'), del('d9', 'day2', 'v1', 'a9')] };
    expect(dayProgress(db, 'day1')).toEqual({ total: 3, pickup: 1, enroute: 1, delivered: 1 });
  });

  it('volunteerLoadHint — רמז-קיבולת לא-חוסם', () => {
    const db: Db = { ...emptyDb(), deliveries: [del('d1', 'day1', 'v1', 'a1'), del('d2', 'day1', 'v1', 'a2')] };
    expect(volunteerLoadHint(db, vol('v1'), 'day1')).toEqual({ count: 2, over: false }); // בלי מגבלה
    expect(volunteerLoadHint(db, vol('v1', 2), 'day1')).toEqual({ count: 2, over: true }); // חרג
    expect(volunteerLoadHint(db, vol('v1', 5), 'day1')).toEqual({ count: 2, over: false });
    expect(deliveriesOfVolunteer(db, 'v1', 'day1').length).toBe(2);
  });

  it('CONNECT — מסירות-משפחה, מונה-היום, שורות-תדפיס פר-מתנדב', () => {
    const db: Db = {
      ...emptyDb(),
      distributionDays: [{ id: 'day1', date: '2026-08-01', title: 'חג', note: '', closed: false, createdAt: '' }, { id: 'day2', date: '2026-07-01', title: 'ישן', note: '', closed: false, createdAt: '' }],
      deliveries: [
        { ...del('d1', 'day1', 'v1', 'a1', 'pickup'), familyId: 'f1' },
        { ...del('d2', 'day1', 'v1', 'a2', 'delivered'), familyId: 'f2' },
        { ...del('d3', 'day2', 'v2', 'a3', 'pickup'), familyId: 'f1' },
      ],
    };
    // מסירות-משפחה — כל המסירות של f1 (משני ימים)
    expect(deliveriesOfFamily(db, 'f1').map((d) => d.id).sort()).toEqual(['d1', 'd3']);
    // מונה-היום — רק יום מתוארך היום ולא-נמסר (d1); d2 נמסר, d3 יום ישן
    expect(pendingDeliveriesToday(db, '2026-08-01').map((d) => d.id)).toEqual(['d1']);
    // שורות-תדפיס — כותרת פר-מתנדב + שורת-מסירה
    const rows = db.deliveries.filter((d) => d.dayId === 'day1').map((d) => ({ ...d, familyName: 'משפחה ' + d.familyId, volunteerName: 'מתנדב ' + d.volunteerId }));
    const lines = deliveryListLines(rows);
    expect(lines[0]).toContain('מתנדב v1');
    expect(lines.some((l) => l.includes('משפחה f1') && l.includes('איסוף'))).toBe(true);
  });

  it('🛡 בידוד כספי — המנוע והפעולות לא נוגעים בקבלות/כסף/S-', () => {
    // המנוע הטהור — אפס אזכור מוני-קבלות (האינווריאנט הכספי; 'S-' מופיע רק בהערת-התיעוד)
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq']) {
      expect(libSrc).not.toContain(kw);
    }
    // אזור-הפעולות של SHOP7 ב-store — בין upsertVolunteer ל-ayinAdvance — נקי ממוני-קבלות
    const start = storeSrc.indexOf('upsertVolunteer(v)');
    const end = storeSrc.indexOf('ayinAdvance(id)');
    expect(start).toBeGreaterThan(0);
    const shop7Block = storeSrc.slice(start, end);
    for (const kw of ['receiptSeq', 'donationSeq', 'shopReceiptSeq']) {
      expect(shop7Block).not.toContain(kw);
    }
  });
});
