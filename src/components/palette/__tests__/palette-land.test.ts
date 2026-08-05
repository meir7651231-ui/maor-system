/**
 * ratchet — UX סבב-ז׳ (6.8.2026): חיפוש-גלובלי נוחת על כרטיס-הישות.
 * הבאג: תוצאת-תומך בפלטה הריצה go('supporters') בלבד — המזכירה חיפשה
 * "גולדשטיין", קיבלה את מסך-הרשימה, וחיפשה שוב ידנית. משפחות כבר נחתו
 * על הכרטיס (selectFamily) — עכשיו גם תומכים (openSupporterCard, דפוס supFormReq).
 */
import { describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import paletteSrc from '../CommandPalette.tsx?raw';
import supViewSrc from '../../supporters/SupportersView.tsx?raw';

describe('🔎 ratchet — הפלטה נוחתת על כרטיס-התומך', () => {
  it('store: openSupporterCard מציב view+בקשה; ackSupporterOpen מנקה', () => {
    useApp.getState().openSupporterCard('sp123');
    expect(useApp.getState().view).toBe('supporters');
    expect(useApp.getState().supOpenReq).toBe('sp123');
    useApp.getState().ackSupporterOpen();
    expect(useApp.getState().supOpenReq).toBeNull();
  });

  it('הפלטה קוראת openSupporterCard (לא go בלבד); המסך מאשר ופותח את הכרטיס', () => {
    expect(paletteSrc).toContain('openSupporterCard(sp.id)');
    expect(supViewSrc).toMatch(/if \(supOpenReq\) \{\s*setSelId\(supOpenReq\);\s*ackSupporterOpen\(\);/);
  });
});
