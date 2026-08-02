/**
 * ratchet — הצפנת-ענן doc-level (עיצוב DESIGN-CLOUD-ENCRYPTION).
 * round-trip; תאימות-לאחור (plaintext→identity); IV שונה בכל כתיבה; ה-envelope
 * נפתח בסיסמה ובמפתח-שחזור; סוד שגוי → null.
 */
import { describe, expect, it } from 'vitest';
import { createCloudKey, decryptDoc, encryptDoc, isEncDoc, openCloudKey } from '../cloudCrypto';
import cloudSrc from '../cloud.ts?raw';

describe('🔐 ratchet — הצפנת-ענן doc-level', () => {
  it('round-trip: encryptDoc→decryptDoc = זהות', async () => {
    const { dek } = await createCloudKey('סיסמה-חזקה', 'REC-KEY-1234');
    const doc = { id: 'f1', name: 'משפחת כהן', members: [{ id: 'm1', first: 'רוני' }], n: 42 };
    const enc = await encryptDoc(doc, dek);
    expect(isEncDoc(enc)).toBe(true);
    expect(JSON.stringify(enc)).not.toContain('כהן'); // הצופן לא חושף PII
    const back = await decryptDoc(enc as unknown as Record<string, unknown>, dek);
    expect(back).toEqual(doc);
  });

  it('תאימות-לאחור: decryptDoc על plaintext (בלי enc/iv) = identity', async () => {
    const { dek } = await createCloudKey('pw', 'REC');
    const plain = { id: 'f2', name: 'לוי', x: 1 };
    expect(await decryptDoc({ ...plain }, dek)).toEqual(plain);
  });

  it('IV שונה בכל כתיבה (חובה ל-GCM)', async () => {
    const { dek } = await createCloudKey('pw', 'REC');
    const a = await encryptDoc({ id: 'x' }, dek);
    const b = await encryptDoc({ id: 'x' }, dek);
    expect(a.iv).not.toBe(b.iv);
    expect(a.enc).not.toBe(b.enc); // אותו plaintext, ciphertext שונה
  });

  it('ה-envelope נפתח בסיסמה ובמפתח-שחזור; שניהם מפענחים אותו doc', async () => {
    const { env, dek } = await createCloudKey('הסיסמה', 'RECOVER-9999');
    const enc = await encryptDoc({ id: 'f3', secret: 'סודי' }, dek);
    const dekPass = await openCloudKey(env, 'הסיסמה', 'pass');
    const dekRec = await openCloudKey(env, 'RECOVER-9999', 'rec');
    expect(dekPass).not.toBeNull();
    expect(dekRec).not.toBeNull();
    expect(await decryptDoc(enc as unknown as Record<string, unknown>, dekPass!)).toEqual({ id: 'f3', secret: 'סודי' });
    expect(await decryptDoc(enc as unknown as Record<string, unknown>, dekRec!)).toEqual({ id: 'f3', secret: 'סודי' });
  });

  it('סוד שגוי → null (אין דלת אחורית)', async () => {
    const { env } = await createCloudKey('נכונה', 'REC-OK');
    expect(await openCloudKey(env, 'שגויה', 'pass')).toBeNull();
    expect(await openCloudKey(env, 'REC-BAD', 'rec')).toBeNull();
  });

  it('DEK שגוי → פענוח זורק (שלמות GCM)', async () => {
    const { dek } = await createCloudKey('a', 'B');
    const { dek: other } = await createCloudKey('c', 'D');
    const enc = await encryptDoc({ id: 'z', v: 1 }, dek);
    await expect(decryptDoc(enc as unknown as Record<string, unknown>, other)).rejects.toBeTruthy();
  });

  it('🛡 הגנת-מקור: נתיב ה-dek-נעדר בסנכרון ביט-זהה להיום', () => {
    // pushDiff/pullAll/subscribeAll מקבלים dek אופציונלי
    expect(cloudSrc).toMatch(/pushDiff\(diff: DbDiff, dek\?: CryptoKey \| null\)/);
    expect(cloudSrc).toMatch(/pullAll\(dek\?: CryptoKey \| null\)/);
    expect(cloudSrc).toMatch(/dek\?: CryptoKey \| null,/); // subscribeAll
    // כשאין dek — הנתיב הישן: toPlain בכתיבה, data() גולמי בקריאה, early-return בהאזנה
    expect(cloudSrc).toContain('dek ? await encryptDoc(toPlain(s.data), dek) : toPlain(s.data)');
    expect(cloudSrc).toContain('dek ? await decryptDoc(metaSnap.data(), dek) : metaSnap.data()');
    expect(cloudSrc).toContain('if (!dek) {'); // early-return ל-onRemote בהאזנה
  });
});
