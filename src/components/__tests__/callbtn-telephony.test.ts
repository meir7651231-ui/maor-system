/**
 * ratchet — חיווט מודול-הטלפוניה למסכים (כפתור-חיוג 📞).
 *
 * הכרעת-בעלים: "תתחיל לחווט אותו למסכים איפה שהוא נדרש". CallBtn (📞→tel:,
 * downstream טהור) מופיע במשטחי-הקשר **רק** כשמודול-הטלפוניה דלוק (telephonyOn —
 * opt-in, חסר/false=כבוי). הגנה מפני רגרסיה: אין כפתור-חיוג כשהמודול כבוי (ביט-זהה
 * להיום), ואין כפילות עם משטחים שכבר מחייגים (רשימת-תומכים click2call · ManageModal).
 */
import { describe, expect, it } from 'vitest';
import { telHref } from '../../lib/tel';
import { telephonyOn } from '../../lib/config';
import type { OrgConfig } from '../../types/config';
import famSrc from '../families/FamilyDetail.tsx?raw';
import supSrc from '../supporters/SupporterDetail.tsx?raw';
import shopSrc from '../shop7/Shop7View.tsx?raw';
import coordSrc from '../tzedaka/CoordinatorsTab.tsx?raw';
import homeSrc from '../home/widgets.tsx?raw';

const cfg = (telephony?: unknown): OrgConfig =>
  ({ slug: 'x', orgName: 'x', theme: 'or-rishon', modules: {}, features: {}, telephony } as OrgConfig);

describe('טלפוניה · כפתור-חיוג במסכים', () => {
  it('telHref מנקה לספרות/‎+‎; קצר/ריק ⇒ null', () => {
    expect(telHref('050-123-4567')).toBe('tel:0501234567');
    expect(telHref('+972 50-1234567')).toBe('tel:+972501234567');
    expect(telHref('')).toBeNull();
    expect(telHref('12')).toBeNull(); // קצר מדי
    expect(telHref('ללא')).toBeNull(); // בלי ספרות
  });

  it('telephonyOn — opt-in: רק enabled:true מדליק', () => {
    expect(telephonyOn(cfg())).toBe(false); // חסר ⇒ כבוי
    expect(telephonyOn(cfg({ enabled: false }))).toBe(false);
    expect(telephonyOn(cfg({ enabled: true }))).toBe(true);
  });

  it('כל משטח-קשר מרנדר CallBtn מגודר telephonyOn(config)', () => {
    for (const src of [famSrc, supSrc, shopSrc, coordSrc, homeSrc]) {
      expect(src).toContain("import { CallBtn }");
      expect(src).toContain('telephonyOn(config)');
      expect(src).toMatch(/<CallBtn\b/);
    }
  });

  it('אין כפילות: רשימת-התומכים (click2call) ו-ManageModal לא מקבלים CallBtn נוסף', () => {
    // משטחים שכבר מחייגים — לא מכניסים כפתור-חיוג שני (הימנעות מדאבל-📞)
    return import('../supporters/SupportersView.tsx?raw').then(({ default: viewSrc }) =>
      import('../courses/ManageModal.tsx?raw').then(({ default: manageSrc }) => {
        expect(viewSrc).not.toContain('CallBtn');
        expect(manageSrc).not.toContain('CallBtn');
      }),
    );
  });
});
