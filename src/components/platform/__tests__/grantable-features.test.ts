/**
 * ratchet — הדלקה-פר-עובד ליכולות-בחירה-מרובה (בקשת-בעלים 23.8:
 * "המנהל יוכל להדליק לעובד"). המנגנון היה הגבלה-בלבד (effectiveConfigFor מחיל רק
 * `=== false`). ההרחבה: רשימה סגורה GRANTABLE_STAFF_FEATURES מכבדת `true` בכרטיס-
 * העובד ⇒ הדלקה פר-עובד. **כל שאר המפתחות נשארים הגבלה-בלבד** (true מתעלמים).
 */
import { describe, expect, it } from 'vitest';
import { effectiveConfigFor, isGrantableFeature, GRANTABLE_STAFF_FEATURES } from '../lib';

const org = {
  slug: 's', manager: 'mgr@x.com', members: ['emp@x.com'],
  memberConfigs: {} as Record<string, { features?: Record<string, boolean>; modules?: Record<string, boolean> }>,
  config: {},
} as unknown as Parameters<typeof effectiveConfigFor>[1];

const cfg = { features: {} as Record<string, boolean>, modules: {} as Record<string, boolean> };

describe('🔓 ratchet — הדלקה-פר-עובד (grantable) מנתחית', () => {
  it('רשימת-ההדלקה = בדיוק 3 יכולות-הבחירה-המרובה', () => {
    expect([...GRANTABLE_STAFF_FEATURES].sort()).toEqual(
      ['supporters.bulkdelete', 'supporters.bulkselect', 'supporters.purpose'],
    );
    expect(isGrantableFeature('supporters.bulkselect')).toBe(true);
    expect(isGrantableFeature('supporters.cockpit')).toBe(false);
  });

  it('עובד עם grant=true ליכולת-הדלקה ⇒ הקונפיג-האפקטיבי מדליק (true)', () => {
    const o = { ...org, memberConfigs: { 'emp@x.com': { features: { 'supporters.bulkdelete': true } } } } as typeof org;
    const eff = effectiveConfigFor('emp@x.com', o, cfg);
    expect(eff.features?.['supporters.bulkdelete']).toBe(true);
  });

  it('עובד עם true ליכולת **לא-מהרשימה** ⇒ מתעלמים (הגבלה-בלבד נשמרת)', () => {
    const o = { ...org, memberConfigs: { 'emp@x.com': { features: { 'supporters.cockpit': true } } } } as typeof org;
    const eff = effectiveConfigFor('emp@x.com', o, cfg);
    // true על מפתח לא-grantable אינו מדליק — נשאר כמו הארגון (undefined)
    expect(eff.features?.['supporters.cockpit']).toBeUndefined();
  });

  it('false עדיין מכבה (הגבלה) — לכל מפתח, כולל grantable', () => {
    const base = { features: { 'supporters.bulkselect': true, 'core.export': true } };
    const o = { ...org, memberConfigs: { 'emp@x.com': { features: { 'supporters.bulkselect': false, 'core.export': false } } } } as typeof org;
    const eff = effectiveConfigFor('emp@x.com', o, base);
    expect(eff.features?.['supporters.bulkselect']).toBe(false);
    expect(eff.features?.['core.export']).toBe(false);
  });

  it('מנהל ⇒ קונפיג-הארגון כמו-שהוא (לא מוגבל, לא נזקק ל-grant)', () => {
    const o = { ...org, memberConfigs: { 'mgr@x.com': { features: { 'supporters.bulkselect': false } } } } as typeof org;
    const eff = effectiveConfigFor('mgr@x.com', o, cfg);
    expect(eff).toBe(cfg); // אותה הפניה — הארגון כמו-שהוא
  });
});
