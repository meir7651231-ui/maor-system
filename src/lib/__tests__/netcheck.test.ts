/**
 * ratchet — 🩺 מאבחן-חסימות (11.8, לקח בנייה-חכמה: הסננים default-deny —
 * גם דומיין עצמאי נחסם עד אישור; הכלי נותן ללקוחה בדיוק מה לבקש לפתוח).
 * האינווריאנטים:
 * 1. יעדי-googleapis נבדקים רק לארגון-ענן — ארגון מקומי-בלבד לא תלוי בהם
 *    ואסור להפחיד אותו ב"חסום" על שירות שהוא לא צורך.
 * 2. הטקסט למוקד-הסינון נבנה רק מהדומיינים שנחסמו בפועל; אין חסימות ⇒ ריק.
 * 3. הכלי נגיש ממסך-הכניסה (לקוחה חסומה לא מגיעה פנימה!) ומ-❓ העזרה.
 * 4. כל תשובת-HTTP = פתוח; רק כשל-רשת/timeout = חסום (דף-חסימה בלי CORS
 *    נכשל ב-fetch ⇒ נמדד כחסום — ההיוריסטיקה הרצויה).
 */
import { describe, expect, it } from 'vitest';
import { netCheckScript, netCheckTargets } from '../netcheck';
import loginSrc from '../../components/cloud/LoginScreen.tsx?raw';
import appSrc from '../../App.tsx?raw';
import modalSrc from '../../components/cloud/NetCheckModal.tsx?raw';

describe('🩺 ratchet — מאבחן-חסימות (11.8)', () => {
  it('ארגון-ענן: 4 יעדים; מקומי-בלבד: רק האתר עצמו', () => {
    const cloud = netCheckTargets('https://example.github.io', true);
    expect(cloud.map((t) => t.key)).toEqual(['site', 'auth', 'token', 'db']);
    expect(cloud.map((t) => t.domain)).toContain('identitytoolkit.googleapis.com');
    expect(cloud.map((t) => t.domain)).toContain('firestore.googleapis.com');
    const local = netCheckTargets('https://example.github.io', false);
    expect(local.map((t) => t.key)).toEqual(['site']);
  });

  it('הטקסט למוקד: רק דומיינים שנחסמו; הכול פתוח ⇒ ריק', () => {
    const t = netCheckTargets('https://x.io', true);
    const all = t.map((x) => ({ ...x, ok: true, ms: 10 }));
    expect(netCheckScript(all)).toBe('');
    const some = t.map((x, i) => ({ ...x, ok: i !== 3, ms: 10 }));
    const script = netCheckScript(some);
    expect(script).toContain('firestore.googleapis.com');
    expect(script).not.toContain('identitytoolkit');
    expect(script).toContain('לפתוח את הכתובות');
  });

  it('נגישות: כפתור במסך-הכניסה + כפתור ב-❓ העזרה', () => {
    expect(loginSrc).toContain('🩺 בדיקת תקשורת');
    expect(loginSrc).toContain('<NetCheckModal');
    expect(appSrc).toMatch(/emoji="🩺"/);
    expect(appSrc).toContain('<NetCheckModal');
  });

  it('המודאל: העתקת-בקשה, בדיקה-חוזרת, ומסר "המערכת ממשיכה לעבוד מקומית"', () => {
    expect(modalSrc).toContain('📋 העתקת הבקשה');
    expect(modalSrc).toContain('🔄 בדיקה חוזרת');
    expect(modalSrc).toContain('המערכת ממשיכה לעבוד במלואה על המכשיר');
  });
});
