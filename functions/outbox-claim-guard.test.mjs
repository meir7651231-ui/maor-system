/**
 * ratchet — הגנות-מקור נחיל swarm-b (3.9.2026) בצד-השרת:
 *  · A5 index.js: תורי SMS/מייל תובעים מסמך בטרנזקציה (pending⇒sending) לפני שליחה — ריצות
 *    onSchedule חופפות (20 שליחות SMTP > 60s) קראו אותם pending ושלחו פעמיים; המפתח/SMTP נבדק
 *    לפני התביעה (בלי מפתח ⇒ נשאר pending); תביעה-תקועה (>10 דק׳) משוחררת בתחילת-ריצה.
 *  · F5 gcontactsSync.js: "סנכרן עכשיו" למנהל-ארגון/מייל-על בלבד — לא לכל חבר (od.members).
 * זרימות-Firestore דורשות אמולטור ⇒ נועלים ברמת-המקור (כמו nedarim-pull-guard).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');

describe('🛡 ratchet — swarm-b צד-שרת (הגנות-מקור)', () => {
  const index = read('index.js');
  const gc = read('gcontactsSync.js');

  it('A5: תביעה טרנזקציונית pending⇒sending לפני שליחה, בשני התורים — אחרי בדיקת מפתח/SMTP', () => {
    expect(index).toContain('async function claimOutboxDoc(db, ref)');
    expect(index).toContain('db.runTransaction(');
    expect(index).toContain("if (!s.exists || s.data().status !== 'pending') return false;");
    expect(index).toContain("tx.update(ref, { status: 'sending', claimedAt: new Date().toISOString() });");
    const sms = index.slice(index.indexOf('exports.smsOutbox'), index.indexOf('exports.yemotProxy'));
    const mail = index.slice(index.indexOf('exports.mailOutbox'), index.indexOf('exports.remindersNightly'));
    for (const sec of [sms, mail]) {
      expect(sec).toContain('if (!(await claimOutboxDoc(db, doc.ref).catch(() => false))) continue;');
    }
    // בלי מפתח — continue לפני התביעה (המסמך נשאר pending, לא 'sending' לנצח)
    expect(sms.indexOf('if (!apiKey) continue;')).toBeLessThan(sms.indexOf('claimOutboxDoc(db, doc.ref)'));
    expect(mail.indexOf('if (!smtpUrl) continue;')).toBeLessThan(mail.indexOf('claimOutboxDoc(db, doc.ref)'));
  });

  it('A5: תביעות-תקועות (sending > 10 דק׳) משוחררות ל-pending בתחילת כל ריצה, בשני התורים', () => {
    expect(index).toContain('const STALE_CLAIM_MS = 10 * 60_000;');
    expect(index).toContain("where('status', '==', 'sending')");
    expect(index).toContain("await releaseStaleClaims(db, 'smsOutbox');");
    expect(index).toContain("await releaseStaleClaims(db, 'mailOutbox');");
    expect(index).toMatch(/d\.ref\.update\(\{ status: 'pending', claimedAt: null \}\)/);
  });

  it('F5: gcontactsSyncNow — isMgr = מנהל-הארגון בלבד (לא od.members)', () => {
    const line = gc.split('\n').find((l) => l.includes('const isMgr ='));
    expect(line).toBeDefined();
    expect(line).toContain("slug !== 'root' && clean(od.manager).toLowerCase() === el");
    expect(line).not.toContain('od.members');
  });
});
