/**
 * ratchet — INTEGRATIONS גל א׳: הגנות-מקור לחיווט + טקסונומיית-הכנות.
 * (1) כל כפתור-הרחבה מגודר integrationOn (חסר=כבוי ⇒ ביט-זהה ללקוח קיים).
 * (2) אי-אפשר למכור roadmap: האשף מציג לממכר רק live; ההצעה מסננת ל-live;
 *     דף-המסירה בלי "ממתין להפעלה" (ההבטחה הישנה שלא קוימה).
 * (3) volunteerRouteStops — מסלול-מתנדב מכתובות המשפחות, מדלג חסרי-כתובת.
 */
import { describe, expect, it } from 'vitest';
import { INTEGRATION_LABELS, INTEGRATION_STATUS } from '../builder/handoff';
import { volunteerRouteStops } from '../shop7/lib';
import { emptyDb, emptyFamily, type Db } from '../../types/domain';
import familyDetailSrc from '../families/FamilyDetail.tsx?raw';
import supportersViewSrc from '../supporters/SupportersView.tsx?raw';
import supporterDetailSrc from '../supporters/SupporterDetail.tsx?raw';
import shop7Src from '../shop7/Shop7View.tsx?raw';
import coordSrc from '../tzedaka/CoordinatorsTab.tsx?raw';
import calendarSrc from '../calendar/CalendarView.tsx?raw';
import wizardSrc from '../builder/BuilderWizard.tsx?raw';
import handoffSrc from '../builder/handoff.ts?raw';

describe('🔌 ratchet — INTEGRATIONS גל א׳: גידור + כנות', () => {
  it('לכל 12 ההרחבות יש סטטוס; live = בדיוק whatsapp/maps/gcal', () => {
    for (const k of Object.keys(INTEGRATION_LABELS)) {
      expect(INTEGRATION_STATUS[k], 'סטטוס חסר ל-' + k).toBeTruthy();
    }
    const live = Object.keys(INTEGRATION_STATUS).filter((k) => INTEGRATION_STATUS[k] === 'live').sort();
    expect(live).toEqual(['gcal', 'maps', 'whatsapp']);
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

  it('🛡 כנות-מכירה: האשף מסנן ל-live (צ׳יפים+הצעה+מחירים); המסירה בלי "ממתין להפעלה"', () => {
    // ההצעה החיה: רק הרחבות ממומשות מתומחרות
    expect(wizardSrc).toContain("INTEGRATION_STATUS[k] === 'live'");
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
