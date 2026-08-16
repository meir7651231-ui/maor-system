/**
 * ratchet — אכיפת-תומכים · פאזה-2 (חיווט-סנכרון, dormant).
 * האינווריאנט: הדגל off-by-default ואף קוד לא מדליק אותו (עד פאזת-ההפעלה) ⇒
 * ביט-זהה להיום — בלי skey בדחיפה, בלי סינון במשיכה/מנוי. נבדק דרך הגנת-מקור.
 */
import { describe, expect, it } from 'vitest';
import cloudSrc from '../cloud.ts?raw';

describe('🔒 ratchet — אכיפת-תומכים dormant (פאזה-2)', () => {
  it('off-by-default: הדגל מאותחל false; אין הדלקה בקוד (רק setter מפאזת-ההפעלה)', () => {
    expect(cloudSrc).toContain('let supEnforceOn = false;');
    // אף קוד ב-cloud.ts לא קורא setSupEnforce(true) — ההדלקה חיצונית (פאזה-5)
    expect(cloudSrc).not.toContain('setSupEnforce(true)');
    // supEnforceOn = true מופיע רק דרך ה-setter (setSupEnforce), לא בהשמה ישירה אחרת
    expect(cloudSrc.match(/supEnforceOn = /g)?.length).toBe(2); // ההשמה-ההתחלתית + בתוך ה-setter
  });

  it('דחיפה: skey מוזרק רק לתומכים ורק כשהאכיפה דלוקה (אחרת ביט-זהה)', () => {
    expect(cloudSrc).toContain("supEnforceOn && s.col === 'supporters'");
    expect(cloudSrc).toContain("skey: supKeyOf(s.data as Pick<Supporter, 'forWho'>)");
  });

  it('משיכה/מנוי: שאילתת-supporters מסוננת ב-skey לעובד/ת מוגבל/ת; skey מקולף', () => {
    expect(cloudSrc).toContain("supEnforceOn && col === 'supporters' && allowedPurposes");
    expect(cloudSrc).toContain("where('skey', 'in', supAllowedKeys(allowedPurposes))");
    expect(cloudSrc).toContain("col === 'supporters' ? stripSupKey(");
  });

  it('מיגרציה: seed של skey לכל התומכים (אידמפוטנטי, לא-הרסי)', () => {
    expect(cloudSrc).toContain('export async function migrateSupportersToKeyed(');
    expect(cloudSrc).toContain('skey: supKeyOf(sp)');
  });
});
