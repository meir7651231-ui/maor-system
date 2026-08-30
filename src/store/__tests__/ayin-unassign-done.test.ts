/**
 * 🎯 ratchet — ביטול-ייעוד בהשלמה (בקשת-בעלים 25.8, opt-in supporters.ayin.unassignondone).
 * הכרעת-בעלים "למנהל בלבד (לא-משוייך)": תיק שהגיע ל'הושלם' ⇒ forWho מתנקה ⇒
 * העובד/ת המוגבל/ת לא רואה אותו (supporterVisibleForDesignations מחזיר false
 * ל-forWho ריק), רק המנהל, עד ייעוד-מחדש. חסר-הדגל ⇒ ביט-זהה.
 */
import { describe, expect, it } from 'vitest';
import storeSrc from '../useApp.ts?raw';
import { supporterVisibleForDesignations } from '../../components/supporters/lib';

describe('🎯 ayin-unassign-done', () => {
  it('החיווט: forWho מתנקה רק ב-done + דגל דלוק + יש-ייעוד, ומתועד', () => {
    expect(storeSrc).toContain("patch.stage === 'done' &&");
    expect(storeSrc).toContain("get().config.features?.['supporters.ayin.unassignondone'] === true");
    expect(storeSrc).toContain("s.id === id ? { ...s, forWho: '' } : s");
    expect(storeSrc).toContain("logAudit('ביטול-ייעוד (הושלם)'");
  });
  it('סמנטיקה: forWho ריק ⇒ עובד-מוגבל לא רואה; מנהל (allowed=null) רואה', () => {
    expect(supporterVisibleForDesignations({ forWho: '' }, ['fundA'])).toBe(false);
    expect(supporterVisibleForDesignations({ forWho: '' }, null)).toBe(true);
    expect(supporterVisibleForDesignations({ forWho: 'fundA' }, ['fundA'])).toBe(true);
  });
});
