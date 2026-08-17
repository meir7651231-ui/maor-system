/**
 * ratchet — 🩺 מאבחן-חסימות (11.8, לקח בנייה-חכמה: הסננים default-deny —
 * גם דומיין עצמאי נחסם עד אישור; הכלי נותן ללקוחה בדיוק מה לבקש לפתוח).
 * האינווריאנטים:
 * 1. יעדי-googleapis נבדקים רק לארגון-ענן — ארגון מקומי-בלבד לא תלוי בהם
 *    ואסור להפחיד אותו ב"חסום" על שירות שהוא לא צורך.
 * 2. הטקסט למוקד-הסינון נבנה רק מהדומיינים שנחסמו בפועל; אין חסימות ⇒ ריק.
 * 3. הכלי נגיש ממסך-הכניסה (לקוחה חסומה לא מגיעה פנימה!) ומ-❓ העזרה.
 * 4. תשובת-HTTP עם CORS = פתוח; כשל-רשת/timeout או דף-חסימה בלי CORS = חסום.
 * 5. 🔴 תיקון-שווא 17.8: הבדיקות פונות לנקודות-קצה **שמחזירות CORS כשנגישות**
 *    (‏firestore documents · securetoken /v1/token · identitytoolkit) — לא ל-robots.txt,
 *    שאין לו CORS ⇒ נכשל בכל רשת ⇒ אזעקת-שווא "חסום" קבועה (הבהילה בעלים+לקוחות).
 */
import { describe, expect, it } from 'vitest';
import { netCheckScript, netCheckTargets } from '../netcheck';
import type { FirebaseOrgConfig } from '../../types/config';
import loginSrc from '../../components/cloud/LoginScreen.tsx?raw';
import appSrc from '../../App.tsx?raw';
import modalSrc from '../../components/cloud/NetCheckModal.tsx?raw';

const FB: FirebaseOrgConfig = { apiKey: 'k', authDomain: 'x.firebaseapp.com', projectId: 'my-proj', appId: 'a' };

describe('🩺 ratchet — מאבחן-חסימות (11.8)', () => {
  it('ארגון-ענן: 4 יעדים; מקומי-בלבד: רק האתר עצמו', () => {
    const cloud = netCheckTargets('https://example.github.io', FB);
    expect(cloud.map((t) => t.key)).toEqual(['site', 'auth', 'token', 'db']);
    expect(cloud.map((t) => t.domain)).toContain('identitytoolkit.googleapis.com');
    expect(cloud.map((t) => t.domain)).toContain('firestore.googleapis.com');
    const local = netCheckTargets('https://example.github.io', null);
    expect(local.map((t) => t.key)).toEqual(['site']);
  });

  it('🔴 תיקון-שווא 17.8: אין robots.txt; db=נתיב-מסמכים אמיתי, token=POST', () => {
    const t = netCheckTargets('https://x.io', FB);
    // אף בדיקה לא פונה ל-robots.txt (מקור אזעקת-השווא — חסר-CORS).
    expect(t.every((x) => !x.url.includes('robots.txt'))).toBe(true);
    const db = t.find((x) => x.key === 'db')!;
    expect(db.url).toContain('/v1/projects/my-proj/databases/(default)/documents/');
    const token = t.find((x) => x.key === 'token')!;
    expect(token.method).toBe('POST'); // securetoken מחזיר CORS רק על POST
    expect(token.url).toContain('securetoken.googleapis.com/v1/token');
  });

  it('הטקסט למוקד: רק דומיינים שנחסמו; הכול פתוח ⇒ ריק', () => {
    const t = netCheckTargets('https://x.io', FB);
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
