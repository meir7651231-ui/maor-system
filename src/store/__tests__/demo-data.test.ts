/**
 * ratchet — CONNECT חיבור 4: קובץ הדמו מכסה את העמודות החדשות.
 * migrate(demo.json) עובר נקי; מערכי הקופות והחנות אינם ריקים; seq גבוה
 * מכל המזהים המספריים (אין התנגשות nextId); ה-S- בדמו זרוע במונה.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import demo from '../../../public/demo.json';

describe('🔌 ratchet — חיבור 4: קובץ הדמו', () => {
  const out = migrate(demo as unknown as Record<string, unknown>);

  it('migrate(demo) עובר נקי — הדמו תואם סכמה', () => {
    expect(out).not.toBeNull();
    expect(out!.v).toBe(5);
  });

  it('העמודות החדשות מאוכלסות: רכזים/קופות/מבצע · פריטים/חבילה/קריטריונים/חנות/שיוך-עם-מימוש', () => {
    expect(out!.tzCoordinators.length).toBeGreaterThanOrEqual(2);
    expect(out!.tzBoxes.length).toBeGreaterThanOrEqual(4);
    expect(out!.tzBoxes.some((b) => b.collections.length > 0)).toBe(true);
    expect(out!.tzCampaigns.some((c) => c.active)).toBe(true);
    expect(out!.shopItems.length).toBeGreaterThanOrEqual(2);
    expect(out!.shopProducts.length).toBeGreaterThanOrEqual(1);
    expect(out!.shopCriteria.length).toBeGreaterThanOrEqual(2);
    expect(out!.shopStores.length).toBeGreaterThanOrEqual(1);
    expect(out!.shopAssignments.some((a) => a.redemptions.length > 0)).toBe(true);
  });

  it('seq גבוה מכל המזהים; shopReceiptSeq זרוע מעל ה-S- בדמו; השיוך מצביע על משפחה קיימת', () => {
    const nums: number[] = [];
    for (const list of [out!.tzCoordinators, out!.tzBoxes, out!.shopItems, out!.shopProducts, out!.shopAssignments] as { id: string }[][])
      for (const x of list) {
        const m = /(\d+)$/.exec(x.id);
        if (m) nums.push(+m[1]);
      }
    expect(out!.seq).toBeGreaterThan(Math.max(...nums));
    expect(out!.shopReceiptSeq).toBeGreaterThanOrEqual(2);
    const a = out!.shopAssignments[0];
    expect(out!.families.some((f) => f.id === a.famId)).toBe(true);
  });
});
