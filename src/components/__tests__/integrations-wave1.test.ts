/**
 * ratchet — INTEGRATIONS גל א׳: הגנות-מקור לחיווט + טקסונומיית-הכנות.
 * (1) כל כפתור-הרחבה מגודר integrationOn (חסר=כבוי ⇒ ביט-זהה ללקוח קיים).
 * (2) אי-אפשר למכור roadmap: האשף מציג לממכר רק live; ההצעה מסננת ל-live;
 *     דף-המסירה בלי "ממתין להפעלה" (ההבטחה הישנה שלא קוימה).
 * (3) volunteerRouteStops — מסלול-מתנדב מכתובות המשפחות, מדלג חסרי-כתובת.
 */
import { describe, expect, it } from 'vitest';
import { INTEGRATION_LABELS, INTEGRATION_STATUS, liveAddons } from '../builder/handoff';
import { INTEGRATION_KEYS } from '../../types/config';
import { volunteerRouteStops } from '../shop7/lib';
import { emptyDb, emptyFamily, type Db } from '../../types/domain';
import familyDetailSrc from '../families/FamilyDetail.tsx?raw';
import supportersViewSrc from '../supporters/SupportersView.tsx?raw';
import supporterDetailSrc from '../supporters/SupporterDetail.tsx?raw';
import shop7Src from '../shop7/Shop7View.tsx?raw';
import coordSrc from '../tzedaka/CoordinatorsTab.tsx?raw';
import calendarSrc from '../calendar/CalendarView.tsx?raw';
import widgetsSrc from '../home/widgets.tsx?raw';
import manageSrc from '../courses/ManageModal.tsx?raw';
import wizardSrc from '../builder/BuilderWizard.tsx?raw';
import handoffSrc from '../builder/handoff.ts?raw';

describe('🔌 ratchet — INTEGRATIONS גל א׳: גידור + כנות', () => {
  it('לכל 13 ההרחבות יש סטטוס; live = 7 (גל א׳ 3 + גל ג׳ "עד-המפתח" 4)', () => {
    for (const k of Object.keys(INTEGRATION_LABELS)) {
      expect(INTEGRATION_STATUS[k], 'סטטוס חסר ל-' + k).toBeTruthy();
    }
    const live = Object.keys(INTEGRATION_STATUS).filter((k) => INTEGRATION_STATUS[k] === 'live').sort();
    expect(live).toEqual(['ai', 'campaign', 'esign', 'gcal', 'maps', 'payments', 'whatsapp']);
    // roadmap = הדורשות-שרת (functions/ בריפו, ממתין ל-Blaze+deploy);
    // ‏mail הצטרפה בצרור-הלילה 5.8.2026 (#1 מייל-קבלות + תקציר-בוקר)
    const roadmap = Object.keys(INTEGRATION_STATUS).filter((k) => INTEGRATION_STATUS[k] === 'roadmap').sort();
    expect(roadmap).toEqual(['mail', 'phone', 'sheets', 'sms']);
  });

  it('INTEGRATION_KEYS (ה-allowlist) ≡ מפתחות התוויות והסטטוסים — מקור-אמת אחד', () => {
    const keys = [...INTEGRATION_KEYS].sort();
    expect(Object.keys(INTEGRATION_LABELS).sort()).toEqual(keys);
    expect(Object.keys(INTEGRATION_STATUS).sort()).toEqual(keys);
  });

  it('liveAddons — מקור-אמת יחיד לסינון-הכנות: roadmap/included לעולם לא מתומחרים', () => {
    const addons = liveAddons({
      integrations: {
        whatsapp: { enabled: true },
        payments: { enabled: true }, // live מגל ג׳ — נמכר
        sms: { enabled: true }, // roadmap (שרת) — נזרק
        receipts: { enabled: true }, // included — נזרק
        maps: { enabled: false }, // כבוי — נזרק
      },
    });
    expect(addons.map((a) => a.key).sort()).toEqual(['payments', 'whatsapp']);
  });

  it("🛡 כל משטח-חיווט מגודר integrationOn — חסר=כבוי ⇒ ביט-זהה ללקוח קיים", () => {
    expect(familyDetailSrc).toContain("integrationOn(config, 'whatsapp')");
    expect(familyDetailSrc).toContain("integrationOn(config, 'maps')");
    expect(supportersViewSrc).toContain("integrationOn(config, 'whatsapp')");
    expect(supporterDetailSrc).toContain("integrationOn(config, 'whatsapp')");
    expect(shop7Src).toContain("integrationOn(config, 'whatsapp')");
    expect(shop7Src).toContain("integrationOn(config, 'maps')");
    expect(coordSrc).toContain("integrationOn(config, 'whatsapp')");
    expect(calendarSrc).toContain("integrationOn(config, 'gcal')");
  });

  it('🛡 גל ב׳ — תבניות-הודעה מגודרות: מסירה (shop7) · יום-הולדת (בית) · תזכורת-תשלום (חוגים)', () => {
    // כל תבנית נפתחת לעריכה לפני שליחה (wa.me לא שולח לבד) — וכולן מאחורי ההרחבה
    expect(shop7Src).toContain('waDeliveryText(');
    expect(widgetsSrc).toContain('waBirthdayText(');
    expect(widgetsSrc).toContain("integrationOn(config, 'whatsapp')");
    expect(manageSrc).toContain('waPaymentText(');
    expect(manageSrc).toContain("integrationOn(cfg, 'whatsapp')");
    // תזכורת-תשלום רק כשיש יתרה חיובית
    expect(manageSrc).toContain('bal > 0 && waPhone');
  });

  it('🛡 כנות-מכירה: האשף מסנן ל-live (צ׳יפים+הצעה+מחירים); המסירה בלי "ממתין להפעלה"', () => {
    // ההצעה החיה: רק דרך liveAddons (מקור-אמת יחיד); הצ'יפים/מחירים מסוננים ל-live
    expect(wizardSrc).toContain('liveAddons(config)');
    expect(wizardSrc).toContain("INTEGRATION_STATUS[k] === 'live'");
    // דגל-תקוע מקונפיג-מיובא: לא-ממומש-דלוק מוצג להסרה (לא רוכב בשקט; ביקורת 4.8)
    expect(wizardSrc).toContain("INTEGRATION_STATUS[k] !== 'live'");
    expect(wizardSrc).toContain('לא-ממומש (הסרה');
    // הקופי הישן שהבטיח-אוויר נעלם מדף-המסירה
    expect(handoffSrc).not.toContain('ממתין להפעלה');
    expect(handoffSrc).not.toContain('נרכשו ויופעלו בפגישת המשך');
    // הקופי הכן קיים
    expect(handoffSrc).toContain('בפיתוח (יופעלו עם השקתם, ללא חיוב היום)');
  });

  it('volunteerRouteStops: כתובות בסדר-הלוח; משפחה בלי כתובת מדולגת', () => {
    const db: Db = {
      ...emptyDb(),
      families: [
        { ...emptyFamily(), id: 'f1', createdAt: '', name: 'א', address: 'הרצל 1', city: 'עיר' },
        { ...emptyFamily(), id: 'f2', createdAt: '', name: 'ב', address: '', city: '' }, // בלי כתובת — מדולגת
        { ...emptyFamily(), id: 'f3', createdAt: '', name: 'ג', address: 'ביאליק 3', city: 'עיר' },
      ],
      deliveries: [
        { id: 'd1', dayId: 'day1', assignmentId: 'a1', volunteerId: 'v1', familyId: 'f1', status: 'pickup', note: '' },
        { id: 'd2', dayId: 'day1', assignmentId: 'a2', volunteerId: 'v1', familyId: 'f2', status: 'pickup', note: '' },
        { id: 'd3', dayId: 'day1', assignmentId: 'a3', volunteerId: 'v1', familyId: 'f3', status: 'pickup', note: '' },
        { id: 'd4', dayId: 'day2', assignmentId: 'a4', volunteerId: 'v1', familyId: 'f1', status: 'pickup', note: '' }, // יום אחר
        { id: 'd5', dayId: 'day1', assignmentId: 'a5', volunteerId: 'v2', familyId: 'f3', status: 'pickup', note: '' }, // מתנדב אחר
      ],
    };
    expect(volunteerRouteStops(db, 'day1', 'v1')).toEqual(['הרצל 1, עיר', 'ביאליק 3, עיר']);
    expect(volunteerRouteStops(db, 'day1', 'v9')).toEqual([]);
  });
});
