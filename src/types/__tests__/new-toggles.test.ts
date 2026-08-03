/**
 * ratchet — הכרעת בעלים "כמות מקסימלית של מתגים": כל יכולת תמיד-דלוקה שהוסבה
 * למתג חייבת להיות רשומה ב-FEATURES כדי שתופיע באשף-ההקמה (sections.ts מקבץ לפי
 * module). הבדיקה מקבעת שהמתגים החדשים רשומים — אם מישהו יסיר רישום, המתג ייעלם
 * מהאשף (הבעלים יאבד שליטה) והבדיקה תיפול.
 */
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../features';

const NEW_TOGGLES = [
  // חנות
  'shop.photo', 'shop.stock', 'shop.expiry', 'shop.waitlist', 'shop.bulkassign',
  'shop.bulkredeem', 'shop.sreceipt', 'shop.void', 'shop.meeting', 'shop.merge',
  // משפחות
  'families.showid', 'families.filter',
  // הגדרות
  'settings.backup', 'settings.encryption', 'settings.access', 'settings.notif', 'settings.theme',
  // מעטפת + ליבה
  'shell.lock', 'shell.palette', 'core.receipt.copymark', 'core.dayendbackup',
  // גל 2 — חוגים
  'courses.absence', 'courses.absence.history', 'courses.makeup.justified', 'courses.reminder',
  'courses.enroll.freeze', 'courses.enroll.end', 'courses.enroll.note', 'courses.notes',
  'courses.colfilter', 'courses.viewtoggle',
  // גל 2 — יומן
  'diary.attendance', 'diary.inactivewarn',
  // גל 2 — לוח
  'calendar.export', 'calendar.layers.urgent', 'calendar.hebtoggle',
  // גל 2 — דוחות
  'reports.csv', 'reports.management.recon', 'reports.management.sponsor',
  'reports.donations.bycat', 'reports.families.geo', 'reports.attendance.member',
  // גל 2 — תורמים/קופות/חלוקה
  'supporters.thankyou', 'supporters.click2call', 'tzedaka.boxstatus', 'shop7.capacity',
];

describe('✓ ratchet — מתגי-אשף חדשים רשומים ב-FEATURES', () => {
  const keys = new Set(FEATURES.map((f) => f.key));
  it.each(NEW_TOGGLES)('הדגל %s רשום (מופיע כטוגל באשף)', (k) => {
    expect(keys.has(k)).toBe(true);
  });

  it('לכל דגל חדש יש label ו-desc (לתצוגה באשף)', () => {
    for (const k of NEW_TOGGLES) {
      const def = FEATURES.find((f) => f.key === k)!;
      expect(def.label.length, k).toBeGreaterThan(1);
      expect(def.desc.length, k).toBeGreaterThan(3);
    }
  });
});
