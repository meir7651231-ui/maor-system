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

  it('F9: ה-webhook מחזיר 200 (לא 400) על חיוב לא-חיובי (מבוטל/זיכוי)', () => {
    expect(index).toContain("ok (skipped: non-positive)");
    expect(index).not.toContain("send('bad amount')");
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
});
