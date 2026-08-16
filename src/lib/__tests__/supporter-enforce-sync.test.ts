/**
 * ratchet — אכיפת-תומכים · פאזה-2 (חיווט-סנכרון, dormant).
 * האינווריאנט: הדגל off-by-default ואף קוד לא מדליק אותו (עד פאזת-ההפעלה) ⇒
 * ביט-זהה להיום — בלי skey בדחיפה, בלי סינון במשיכה/מנוי. נבדק דרך הגנת-מקור.
 */
import { describe, expect, it } from 'vitest';
import cloudSrc from '../cloud.ts?raw';
import rulesSrc from '../../../firestore.rules?raw';

describe('🔒 ratchet — אכיפת-תומכים dormant (פאזה-2)', () => {
  it('off-by-default: הדגל מאותחל false; אין הדלקה בקוד (רק setter מפאזת-ההפעלה)', () => {
    expect(cloudSrc).toContain('let supEnforceOn = false;');
    // אף קוד ב-cloud.ts לא קורא setSupEnforce(true) — ההדלקה חיצונית (פאזה-5)
    expect(cloudSrc).not.toContain('setSupEnforce(true)');
    // supEnforceOn = true מופיע רק דרך ה-setter (setSupEnforce), לא בהשמה ישירה אחרת
    expect(cloudSrc.match(/supEnforceOn = /g)?.length).toBe(2); // ההשמה-ההתחלתית + בתוך ה-setter
  });

  it('דחיפה: skey מוזרק לאוספים-נאכפים (supporters+events) רק כשהאכיפה דלוקה', () => {
    expect(cloudSrc).toContain('supEnforceOn && (SUP_KEYED_COLS as readonly string[]).includes(s.col)');
    expect(cloudSrc).toContain('skey: docSkey(s.col, s.data as Record<string, unknown>, supKeyBySpId)');
  });

  it('משיכה/מנוי: שאילתת אוסף-נאכף מסוננת ב-skey לעובד/ת מוגבל/ת; skey מקולף', () => {
    expect(cloudSrc).toContain("(SUP_KEYED_COLS as readonly string[]).includes(col) && allowedPurposes");
    expect(cloudSrc).toContain("where('skey', 'in', supAllowedKeys(allowedPurposes))");
    expect(cloudSrc).toContain('(SUP_KEYED_COLS as readonly string[]).includes(col) ? stripSupKey(');
  });

  it('מיגרציה: seed של skey לתומכים **ולאירועים** (אידמפוטנטי, לא-הרסי)', () => {
    expect(cloudSrc).toContain('export async function migrateSupportersToKeyed(');
    expect(cloudSrc).toContain('skey: supKeyOf(sp)');
    expect(cloudSrc).toContain("skey: docSkey('events'");
  });

  it('משטח #3: לוג-הפעולות (audit) מקולף מ-meta בענן כשהאכיפה דלוקה', () => {
    expect(cloudSrc).toContain('supEnforceOn && diff.meta ? stripAuditMeta(diff.meta) : diff.meta');
  });

  it('משטח #3 (מנהל מסונכרן): auditlog/{uid} — כתיבת-עצמו, קריאת-מנהל, מיזוג', () => {
    // כותב רק את מסמכו; מנהל/מייל-על קורא את כולם (auditReadable)
    expect(cloudSrc).toContain("scopedCol('auditlog'), auditUid");
    expect(cloudSrc).toContain('if (!auditReadable) return null;');
    // Rules: כתיבת-uid-עצמו בלבד + קריאת-מנהל
    expect(rulesSrc).toContain('match /orgs/{slug}/auditlog/{uid}');
    expect(rulesSrc).toContain('request.auth.uid == uid');
    // נחיל-אבטחה 16.8: auditlog מוחרג מהכתיבה-הכללית ביחד עם שאר האוספים-הנאכפים
    // (לא עוד `col != 'auditlog'` לבדו — זה היה עוקף את אכיפת-הייעוד).
    expect(rulesSrc).toContain("!(col in ['donations', 'supporters', 'events', 'auditlog', 'incomingPayments', 'smsOutbox', 'mailOutbox', '_enc', 'meta'])");
  });
});
