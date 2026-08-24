/**
 * נעילת גישה — גיבוב ואימות קוד. הקוד לעולם לא נשמר גלוי; אימות מול הגיבוב
 * בלבד. כולל ולידציית אורך וסירוב לקלט לא-ספרתי/ריק.
 */
import { describe, expect, it } from 'vitest';
import { hashPin, verifyPin, isValidPin, pinNeedsRehash } from '../lock';
import lockSrc from '../lock.ts?raw';
import { cooldownFor } from '../../components/lock/LockScreen';

// ANALYSIS §5 אבטחה — הגבלת-קצב על מסך ה-PIN (השהיה גדֵלה מול ניחוש-המוני).
describe('🔒 ratchet — הגבלת-קצב PIN (cooldownFor)', () => {
  it('2 כשלונות ראשונים ללא השהיה; 3→5ש׳, 4→15ש׳, 5+→30ש׳', () => {
    expect(cooldownFor(1)).toBe(0);
    expect(cooldownFor(2)).toBe(0);
    expect(cooldownFor(3)).toBe(5000);
    expect(cooldownFor(4)).toBe(15000);
    expect(cooldownFor(5)).toBe(30000);
    expect(cooldownFor(9)).toBe(30000); // תקרה
  });
});

describe('🔑 isValidPin — 4–8 ספרות בלבד', () => {
  it('מקבל 4–8 ספרות', () => {
    for (const p of ['1234', '000000', '12345678']) expect(isValidPin(p)).toBe(true);
  });
  it('דוחה קצר/ארוך/לא-ספרתי/ריק', () => {
    for (const p of ['', '123', '123456789', '12a4', '12 4', 'abcd']) expect(isValidPin(p)).toBe(false);
  });
});

describe('🔒 hashPin v2 — PBKDF2 עם מלח אקראי (ביקורת-האמון 24.8)', () => {
  // הבאג: SHA-256 חד-סיבובי עם מלח גלובלי קבוע — קוד 4–8 ספרות נפרץ-אופליין
  // במילישניות ממי שקרא localStorage. התיקון: PBKDF2 ‏310K + מלח אקראי פר-קוד.
  it('פורמט v2:{salt}:{hash} — לא הקוד הגלוי', async () => {
    const a = await hashPin('1234');
    expect(a).toMatch(/^v2:[0-9a-f]{32}:[0-9a-f]{64}$/);
  });
  it('מלח אקראי: אותו קוד ⇒ גיבובים שונים, שניהם מאמתים', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('1234');
    expect(a).not.toBe(b);
    expect(await verifyPin('1234', a)).toBe(true);
    expect(await verifyPin('1234', b)).toBe(true);
  }, 20000);
  it('🔒 המנוע: PBKDF2 ילידי, לא SHA-256 חד-סיבובי לקודים חדשים', () => {
    expect(lockSrc).toContain("name: 'PBKDF2'");
    expect(lockSrc).toContain('310_000');
  });
});

describe('🔓 תאימות-לאחור — גיבוב-לגאסי נפתח ומסומן-לשדרוג', () => {
  // גיבוב SHA-256 היסטורי של הקוד 4729 (מלח maor.lock.v1::) — PIN קיים
  // של לקוח-חי חייב להמשיך להיפתח; pinNeedsRehash מסמן אותו לשדרוג-שקט.
  const LEGACY_4729 = '30bd812b82992b21dacbb54b495b281fcd226304d7e88ae5d611f09895b70cd5';
  it('קוד נכון מול גיבוב-לגאסי → true', async () => {
    expect(await verifyPin('4729', LEGACY_4729)).toBe(true);
    expect(await verifyPin('0000', LEGACY_4729)).toBe(false);
  });
  it('pinNeedsRehash: לגאסי=true · v2=false · חסר=false', async () => {
    expect(pinNeedsRehash(LEGACY_4729)).toBe(true);
    expect(pinNeedsRehash(await hashPin('4729'))).toBe(false);
    expect(pinNeedsRehash(undefined)).toBe(false);
  });
});

describe('🔓 verifyPin — נכון עובר, שגוי/חסר נכשל', () => {
  it('קוד נכון מול הגיבוב שלו → true', async () => {
    const h = await hashPin('4729');
    expect(await verifyPin('4729', h)).toBe(true);
  });
  it('קוד שגוי → false', async () => {
    const h = await hashPin('4729');
    expect(await verifyPin('0000', h)).toBe(false);
  });
  it('גיבוב חסר/ריק → false (אין נעילה = לא נפתח בטעות)', async () => {
    expect(await verifyPin('1234', undefined)).toBe(false);
    expect(await verifyPin('1234', '')).toBe(false);
  });
});
