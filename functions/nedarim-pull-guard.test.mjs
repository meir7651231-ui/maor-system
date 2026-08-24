/**
 * ratchet — הגנות-מקור על תיקוני-נדרים בצד-השרת (20.8). זרימות-Firestore (runNedarimPull)
 * דורשות אמולטור ⇒ נועלים את התיקונים ברמת-המקור כדי שרגרסיה שמחזירה את הבאג תיפול.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');

describe('🛡 ratchet — תיקוני-שרת נדרים (הגנות-מקור)', () => {
  const pull = read('nedarimPull.js');
  const index = read('index.js');

  it('F1: המשיכה קוראת-לפני-כתיבה (getAll) ומדלגת doc-id קיים — לא דורסת handled→pending', () => {
    expect(pull).toContain('db.getAll(');
    expect(pull).toContain('existing.add(s.id)');
    expect(pull).toContain('writes.filter((w) => !existing.has(w.id))');
  });

  it('F10: הגנת-התקדמות-cursor — לא מתאפס ל-0 ומושך שוב מההתחלה', () => {
    expect(pull).toContain('if (!(cursor > lastId)) break;');
  });

  it('F11: nedarimSyncHourly מדלג כשאין NEDARIM_ORG (לא מושך ל-root); NEDARIM_ORG אינו secret', () => {
    expect(pull).toContain("if (!org) {");
    // הצהרת-הסוד של התזמון בלי NEDARIM_ORG (⇒ פריסה-מלאה לא נחסמת)
    expect(pull).toMatch(/secrets:\s*\['NEDARIM_MOSAD_ID',\s*'NEDARIM_API_PASSWORD'\]\s*}/);
  });

  it('F5: אימות-סוד קבוע-זמן (timingSafeEqual) בשני המסלולים — לא השוואת !==', () => {
    expect(pull).toContain('crypto.timingSafeEqual');
    expect(index).toContain('crypto.timingSafeEqual');
    expect(pull).toContain('secretOk(p.secret');
    expect(index).toContain('secretOk(p.secret');
  });

  it('F7: פענוח fatal ⇒ שרשרת-הנפילה של הקידוד באמת פועלת; הקוד-המת (fetchNedarimDonorsCsv) הוסר', () => {
    expect(pull).toContain('{ fatal: true }');
    expect(pull).not.toContain('fetchNedarimDonorsCsv');
  });

  it('F9: ה-webhook קולט זיכוי/ביטול עם kind (לא 400, לא דילוג-שקט)', () => {
    expect(index).not.toContain("send('bad amount')");
    expect(index).toContain("m.amount < 0 ? 'refund'");
    expect(index).toContain("m.amount === 0 ? 'cancel'");
    // פאזה-מודעת-כסף בשני המסלולים: המשיכה והמפַּה
    expect(read('nedarimHistory.js')).toContain("m.amount < 0 ? 'refund'");
  });

  it('F6: ה-webhook נופל לאסמכתא (reference) כ-doc-id כשאין TransactionId', () => {
    expect(index).toContain("'ref-' + m.reference");
    expect(index).toContain("'nedarim-' + dedupKey");
  });

  it('F2: ה-webhook כותב תאריך-עסקה (d) מהמיפוי', () => {
    expect(index).toMatch(/d:\s*m\.d/);
  });

  it('F12: המשיכה קוראת אישורי-נדרים מכספת-הארגון (orgSecrets) — לא רק env גלובלי', () => {
    expect(pull).toContain('nedarimCreds');
    expect(pull).toContain("db.doc('orgSecrets/'");
    expect(pull).toContain('s.nedarimMosad');
    expect(pull).toContain('fetchNedarimHistory(lastId, MAX_ID, creds)');
  });

  it('F3: המשיכה משתמשת ב-m.toremId/m.d מהמיפוי (לא חילוץ-ידני עם מפתח-כפול)', () => {
    const hist = read('nedarimHistory.js');
    expect(hist).toContain('const toremId = m.toremId;');
    expect(hist).not.toContain('r.ToremId ?? r.ToremId');
  });

  it('ייעול: כפתור-אפליקציה מאומת-טוקן (isOrgAdmin) + CORS + ?full=1 — בלי סוד בדפדפן', () => {
    expect(pull).toContain('async function isOrgAdmin');
    expect(pull).toContain('verifyIdToken');
    expect(pull).toContain("platformOrgs/'"); // אימות מנהל-הארגון
    expect(pull).toContain('secretOk(p.secret, process.env.PAY_SECRET) || (await isOrgAdmin'); // סוד או-טוקן
    expect(pull).toContain('Access-Control-Allow-Origin'); // CORS ל-cross-origin fetch
    expect(pull).toContain("p.full === '1'"); // משיכה-מלאה בקליק (תורמים+עסקאות)
  });

  // 🐛 (21.8) ה-webhook בנה doc-id מ-reference גולמי — '/' זרק ⇒ 500 ⇒ תשלום אבד.
  it('F13: מפתח-הדדופ של ה-webhook עובר sanitizeDedupKey לפני doc()', () => {
    expect(index).toContain('sanitizeDedupKey(rawKey, rawSafe)');
    expect(index).toContain("require('./paymentMap')");
  });

  // 🐛 (21.8) mailOutbox לא מצהירה secrets ⇒ MAIL_FROM תמיד undefined ⇒ מיילים בלי
  // From (ספאם/דחייה). הכרעת-בעלים "מייל פר-לקוח": השולח נגזר מ-username של
  // ה-smtpUrl הארגוני (decodeURIComponent); ‏MAIL_FROM נפילה-לאחור בלבד.
  it('F14: mailOutbox גוזרת From מה-smtpUrl של הארגון (לא רק MAIL_FROM הריק)', () => {
    expect(index).toContain('decodeURIComponent(new URL(smtpUrl).username)');
    expect(index).toMatch(/sendMail\(\{ from,/);
  });

  // 🐛 (21.8) BACKUP_COLLECTIONS ≡ ENTITY_COLLECTIONS מחריג במכוון את 'donations'
  // (מסלול-B) ⇒ גיבוי-לילה של ארגון-מפוצל יצא בלי תרומות/קבלות. EXTRA_BACKUP משלים.
  it("F15: backupNightly מגבה גם את אוסף-התרומות הנפרד (EXTRA_BACKUP=['donations'])", () => {
    expect(index).toMatch(/EXTRA_BACKUP = \['donations'\]/);
    expect(index).toContain('[...BACKUP_COLLECTIONS, ...EXTRA_BACKUP]');
  });

  // 🔒 (24.8, בקשת-שטח "נדרים מסתכרן לא רק לענף-הפלטפורמה של מאור") — בידוד-בין-ארגונים:
  // ה-fallback ל-mosad הגלובלי (של מאור) היה לכל ארגון בלי כספת ⇒ ארגון-פלטפורמה
  // משך את נתוני-מאור לתוך scope שלו. עכשיו: גלובלי רק ל-root, ארגון בלי כספת = שגיאה.
  it('F16: nedarimCreds — נפילה גלובלית רק ל-root, וזריקה כשאין mosad לארגון-פלטפורמה', () => {
    // ה-fallback הגלובלי מגודר org==='root' (isRoot) — לא ניתן ללא-שורש
    expect(pull).toMatch(/const isRoot = org === 'root';/);
    expect(pull).toMatch(/isRoot \? \(process\.env\.NEDARIM_MOSAD_ID/);
    // אין mosad (ארגון-פלטפורמה בלי כספת) ⇒ throw מפורש, לא משיכה עם ה-mosad של מאור
    expect(pull).toMatch(/if \(!mosad\) \{/);
    expect(pull).toContain('אין אישורי-סליקה לארגון');
  });

  it('F17: הפוחות (fetchers) לא נופלים חזרה ל-env הגלובלי — creds בלבד', () => {
    // לפני-התיקון: `creds.mosad || process.env.NEDARIM_MOSAD_ID` בשני הפוחות = דלף.
    expect(pull).not.toContain('creds.mosad || process.env.NEDARIM_MOSAD_ID');
    expect(pull).not.toContain('creds.pass || process.env.NEDARIM_API_PASSWORD');
  });
});
