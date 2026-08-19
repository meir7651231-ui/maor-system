/**
 * ratchet — תקרית 19.8.2026: משיכת-נדרים מלאה מ-2019 העמידה ~12,125 תשלומים-
 * ממתינים (status=pending). החיבור-החי (App.tsx watchIncomingPayments) עיבד את
 * **כולם** סינכרונית + ירה ~12K כתיבות-ענן על **כל טעינה** ⇒ הדפדפן קפא/קרס
 * בלולאה ("האתר כל הזמן קורס"). הנעילה:
 *   1. החיבור-החי מדלג על באלק גדול (rows.length > NED_LIVE_MAX) — טפטוף בלבד;
 *      הבאלק עובר למסך 🔄 הידני עם תצוגה-מקדימה.
 *   2. מסך-הסנכרון הידני מסמן handled **במנות** (300 במקביל, ממתין בין מנה למנה)
 *      במקום אלפי כתיבות בו-זמנית.
 */
import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';
import modalSrc from '../supporters/NedarimSyncModal.tsx?raw';

describe('🛡 ratchet — חיבור-חי מנדרים לא מקפיא על באלק היסטורי', () => {
  it('App.tsx: החיבור-החי מדלג מעל תקרה (NED_LIVE_MAX) לפני עיבוד', () => {
    expect(appSrc).toContain('const NED_LIVE_MAX = 400');
    expect(appSrc).toContain('if (rows.length > NED_LIVE_MAX) return;');
    // הדילוג חייב להיות **לפני** applyNedarimAuto (אחרת כבר עיבדנו את כל ה-12K)
    const guard = appSrc.indexOf('rows.length > NED_LIVE_MAX');
    const apply = appSrc.indexOf('applyNedarimAuto(rows)');
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(apply);
  });

  it('NedarimSyncModal: סימון handled במנות (300), לא אלפי כתיבות בו-זמנית', () => {
    expect(modalSrc).toContain('i += 300');
    expect(modalSrc).toContain('await Promise.all(');
    // אסור לחזור לצורה הישנה — לולאת-ירי בלי המתנה על אלפי מזהים
    expect(modalSrc).not.toContain('for (const id of chargeIds) void m.markIncomingPayment');
  });
});
