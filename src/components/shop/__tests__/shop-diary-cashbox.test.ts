/**
 * ratchet — יומן + קופה רושמת (חנות 21, הכרעות 19-20).
 * (א) פגישת-חנות-עם-חדר מופיעה בגריד יומן החדרים (דרך ה-OrgEvent המקושר —
 *     אין קריאה נפרדת של shopEvents ביומן, הבידוד נשמר).
 * (ב) "💵 גבייה בקופה" — מאחורי core.cashbox ורק כש-paid>0; הקופה נשארת
 *     כלי ספירה (sessionStorage, אפס כתיבה ל-db) והמודאל קורא את שם הלקוח.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { buildSlots } from '../../diary/lib';
import { DEFAULT_CONFIG } from '../../../types/config';
import { emptyDb, type Db, type Room, type ShopAssignment } from '../../../types/domain';
import redeemSrc from '../RedeemModal.tsx?raw';
import cashSrc from '../../timer/CashRegister.tsx?raw';

const room: Room = { id: 'r1', name: 'חדר ישיבות', active: true, slot: 60, cap: 10, location: '', from: '08:00', to: '20:00' } as unknown as Room;
function assignment(over: Partial<ShopAssignment>): ShopAssignment {
  return { id: 'sha1', productId: 'shp1', famId: 'f1', memberId: '', criterionIds: [], since: '', status: 'active', notes: '', redemptions: [], ...over };
}

describe('🛍 ratchet — חנות 21: יומן + קופה רושמת', () => {
  beforeEach(() => {
    useApp.setState({ config: { ...DEFAULT_CONFIG, features: {} } });
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      rooms: [room],
      families: [{ id: 'f1', name: 'כהן', members: [] } as unknown as Db['families'][number]],
      shopAssignments: [assignment({})],
    }));
  });

  it('(א) פגישת-חנות-עם-חדר מופיעה בגריד היומן של החדר באותו יום (הכרעה 19)', () => {
    expect(
      useApp.getState().upsertShopEvent({
        id: '', title: 'פגישה', date: '2026-08-05', time: '10:00', kind: 'meeting', assignmentId: 'sha1', roomId: 'r1', notes: '', done: false,
      }),
    ).toBe(true);
    const db = useApp.getState().db;
    const slots = buildSlots(db, room, '2026-08-05', null, useApp.getState().config);
    const hit = slots.find((s) => s.kind === 'event' && s.label.includes('פגישת ליווי'));
    expect(hit).toBeTruthy();
    expect(hit!.time).toBe('10:00');
    // יום אחר — לא מופיעה
    const other = buildSlots(db, room, '2026-08-06', null, useApp.getState().config);
    expect(other.some((s) => s.label.includes('פגישת ליווי'))).toBe(false);
  });

  it('(ב) הגנת-מקור: כפתור הקופה מאחורי הדגל ורק עם paid>0; אפס כתיבה ל-db', () => {
    expect(redeemSrc).toMatch(/featureOn\(config, 'core\.cashbox'\) && Math\.round\(\+f\.paid\) > 0/);
    expect(redeemSrc).toContain("sessionStorage.setItem('maor_cashbox_amount'");
    expect(redeemSrc).toContain("sessionStorage.setItem('maor_cashbox_client'");
    expect(redeemSrc).toContain("window.location.hash = '#cashbox'");
    expect(redeemSrc).toContain('💵 גבייה בקופה');
  });

  it('(ב-המשך) CashRegister קורא את מפתח הלקוח הממולא ונשאר מחוץ ל-db', () => {
    expect(cashSrc).toContain("const SS_CLIENT = 'maor_cashbox_client'");
    expect(cashSrc).toContain('sessionStorage.getItem(SS_CLIENT)');
    // הקופה = כלי ספירה נפרד (הכרעה 20): אין setDb ואין נגיעה במימושים/S-
    expect(cashSrc).not.toContain('setDb');
    expect(cashSrc).not.toContain('addShopRedemption');
    expect(cashSrc).not.toContain('shopReceiptSeq');
  });
});
