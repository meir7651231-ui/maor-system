/**
 * ratchet — נחיל-אבטחה 16.8 (פריצות-האקרים). שלושה תיקונים:
 *  1) 🔴 CRITICAL — כלל-הכתיבה-הכללי ב-Rules החריג רק 'auditlog'; מאחר ש-Firestore=OR,
 *     ה-allow-write הרחב גבר על אכיפת-הייעוד (canWriteKeyed) ⇒ עובד-מוגבל היה הופך
 *     pkey/skey ל-'_shared_' וקורא/מוחק/מזייף קבלות-§46 ו-PII של ייעוד-אסור.
 *     התיקון: הכתיבה מחריגה בדיוק כמו הקריאה (8 האוספים) + _enc.
 *  2) _enc/envelope — כתיבה=מנהל/מייל-על בלבד (חוסם מחיקת-envelope = DoS על ההצפנה).
 *  3) חיטוי accent — ערך מוזרק ל-CSS `--accent`; `url()` זדוני = ביקון-מעקב מאולץ.
 */
import { describe, expect, it } from 'vitest';
import rules from '../../../firestore.rules?raw';
import { normalizeConfig, isSafeAccent } from '../config';

describe('🔒 Rules — אכיפת-כתיבה פר-ייעוד לא נעקפת (CRITICAL)', () => {
  it('הכתיבה-הכללית מחריגה את האוספים-הנאכפים (לא רק auditlog)', () => {
    expect(rules).toContain(
      "allow write: if (superAdmin() || orgMember(slug))\n        && !(col in ['donations', 'supporters', 'events', 'auditlog', 'incomingPayments', 'smsOutbox', 'mailOutbox', '_enc']);",
    );
    // הבאג שנסגר: אסור שתישאר החרגת auditlog-בלבד בכתיבה-הכללית
    expect(rules).not.toContain("allow write: if (superAdmin() || orgMember(slug)) && col != 'auditlog';");
  });

  it('_enc — בלוק ייעודי: קריאה=חבר, כתיבה=מנהל/מייל-על בלבד', () => {
    const m = rules.slice(rules.indexOf('match /orgs/{slug}/_enc/{d}'), rules.indexOf('match /orgs/{slug}/_enc/{d}') + 160);
    expect(m).toContain('allow read: if superAdmin() || orgMember(slug);');
    expect(m).toContain('allow write: if superAdmin() || orgManager(slug);');
  });
});

describe('🔒 חיטוי accent — חוסם הזרקת-CSS (url beacon)', () => {
  it('isSafeAccent מתיר צבע-CSS אמיתי בלבד', () => {
    for (const good of ['#fff', '#ffcc00', '#ffcc00aa', 'rgb(1,2,3)', 'rgba(1,2,3,.5)', 'hsl(1,2%,3%)', 'tomato']) {
      expect(isSafeAccent(good), good).toBe(true);
    }
    for (const bad of ["url('https://attacker/b.gif')", 'url(x)', 'red;background:url(x)', '#ff', 'expression(1)', 'var(--x)', '#12345', 'a b c']) {
      expect(isSafeAccent(bad), bad).toBe(false);
    }
  });

  it('normalizeConfig מסלק accent זדוני, שומר תקין', () => {
    const evil = normalizeConfig({ slug: 'x', orgName: 'x', theme: 'classic', accent: "url('https://attacker/b.gif?u=v')" });
    expect(evil?.accent).toBeUndefined();
    const good = normalizeConfig({ slug: 'x', orgName: 'x', theme: 'classic', accent: '#3366ff' });
    expect(good?.accent).toBe('#3366ff');
  });
});
