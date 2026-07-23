/**
 * הצפנת נתונים במנוחה — הליבה הקריפטוגרפית. בדיקות הלוך-חזור, סוד שגוי,
 * מפתח שחזור, זיהוי שינוי-נתונים (GCM), והחלפת סיסמה בלי אובדן נתונים.
 * כשל כאן = אבדן נתונים אמיתי, לכן הכיסוי מקיף.
 */
import { describe, expect, it } from 'vitest';
import {
  encryptDb,
  decryptDb,
  openDek,
  reencryptDb,
  rewrapPassword,
  genRecoveryKey,
  isEncrypted,
} from '../crypto';

const JSON1 = JSON.stringify({ families: [{ id: 'f1', name: 'כהן' }], secret: 'ת"ז 123' });

describe('🔐 encrypt/decrypt — הלוך-חזור', () => {
  it('מצפין ומפענח חזרה בדיוק, והטקסט המקורי לא מופיע במעטפת', async () => {
    const env = await encryptDb(JSON1, 'passw0rd', genRecoveryKey());
    expect(isEncrypted(env)).toBe(true);
    // הנתונים הגלויים לא נמצאים במעטפת (הצפנה אמיתית)
    const blob = JSON.stringify(env);
    expect(blob).not.toContain('כהן');
    expect(blob).not.toContain('123');
    const dek = await openDek(env, 'passw0rd', 'pass');
    expect(dek).not.toBeNull();
    expect(await decryptDb(env, dek!)).toBe(JSON1);
  });
});

describe('🔑 סיסמה שגויה / מפתח שחזור', () => {
  it('סיסמה שגויה → null (לא נפתח)', async () => {
    const env = await encryptDb(JSON1, 'correct-horse', genRecoveryKey());
    expect(await openDek(env, 'wrong-pass', 'pass')).toBeNull();
  });
  it('מפתח השחזור פותח גם כשהסיסמה נשכחה', async () => {
    const rec = genRecoveryKey();
    const env = await encryptDb(JSON1, 'forgotten', rec);
    const dek = await openDek(env, rec, 'rec');
    expect(dek).not.toBeNull();
    expect(await decryptDb(env, dek!)).toBe(JSON1);
  });
  it('מפתח שחזור שגוי → null', async () => {
    const env = await encryptDb(JSON1, 'p', genRecoveryKey());
    expect(await openDek(env, genRecoveryKey(), 'rec')).toBeNull();
  });
});

describe('🛡️ זיהוי שינוי-נתונים (AES-GCM אותנטי)', () => {
  it('נתונים ששונו → הפענוח נכשל (null דרך openDek לא רלוונטי; decrypt זורק)', async () => {
    const env = await encryptDb(JSON1, 'pw', genRecoveryKey());
    const dek = (await openDek(env, 'pw', 'pass'))!;
    const tampered = { ...env, data: env.data.slice(0, -4) + 'AAAA' };
    await expect(decryptDb(tampered, dek)).rejects.toBeDefined();
  });
});

describe('🔄 שמירה שוטפת + החלפת סיסמה', () => {
  it('reencryptDb עם אותו DEK — סיסמה ומפתח שחזור עדיין פותחים את הנתונים החדשים', async () => {
    const rec = genRecoveryKey();
    const env = await encryptDb(JSON1, 'pw', rec);
    const dek = (await openDek(env, 'pw', 'pass'))!;
    const JSON2 = JSON.stringify({ families: [], note: 'עודכן' });
    const env2 = await reencryptDb(env, dek, JSON2);
    const dekPass = (await openDek(env2, 'pw', 'pass'))!;
    const dekRec = (await openDek(env2, rec, 'rec'))!;
    expect(await decryptDb(env2, dekPass)).toBe(JSON2);
    expect(await decryptDb(env2, dekRec)).toBe(JSON2);
  });
  it('rewrapPassword — הסיסמה החדשה פותחת, הישנה לא, הנתונים נשמרים', async () => {
    const rec = genRecoveryKey();
    const env = await encryptDb(JSON1, 'old-pass', rec);
    const dek = (await openDek(env, 'old-pass', 'pass'))!;
    const env2 = await rewrapPassword(env, dek, 'new-pass');
    expect(await openDek(env2, 'old-pass', 'pass')).toBeNull();
    const dekNew = (await openDek(env2, 'new-pass', 'pass'))!;
    expect(await decryptDb(env2, dekNew)).toBe(JSON1);
    // מפתח השחזור עדיין עובד אחרי החלפת סיסמה
    const dekRec = (await openDek(env2, rec, 'rec'))!;
    expect(await decryptDb(env2, dekRec)).toBe(JSON1);
  });
});

describe('🎲 genRecoveryKey', () => {
  it('פורמט קבוצות, ייחודי, בלי תווים מבלבלים', () => {
    const k = genRecoveryKey();
    expect(k).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){5}$/);
    expect(k).not.toMatch(/[IO01]/);
    expect(genRecoveryKey()).not.toBe(genRecoveryKey());
  });
});
