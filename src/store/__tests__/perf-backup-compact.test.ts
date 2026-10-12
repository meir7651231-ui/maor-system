/**
 * ⚡ ratchet — ביצועי ההתמדה (12.10.2026): קובץ-הגיבוי קומפקטי + גיבוי-סוף-היום ב-idle.
 *
 * המדידה אצל הלקוח האמיתי (16,000 תורמים): הגיבוי האוטומטי של סוף-היום הסריאל
 * JSON.stringify(doc, null, 1) — 123MB במקום 34MB — והקפיא את הממשק 30.9s באמצע עבודה.
 * הכלל: הקובץ קומפקטי (אותו JSON, בלי רווחים), parseBackupFile/decryptBackupFile מקבלים
 * אותו ללא שינוי (ייצוא ⇒ ייבוא שווה-ערך), והריצה האוטומטית ב-requestIdleCallback
 * (timeout 30s) רק כשהטאב גלוי.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { emptyDb, type Db } from '../../types/domain';
import {
  backupFileContent,
  parseBackupFile,
  decryptBackupFile,
  isEncryptedBackup,
  beginEncryption,
  clearCrypto,
  migrate,
} from '../persist';
import persistSrc from '../persist.ts?raw';
import appSrc from '../../App.tsx?raw';

class MemStorage {
  m = new Map<string, string>();
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string): void { this.m.set(k, String(v)); }
  removeItem(k: string): void { this.m.delete(k); }
  clear(): void { this.m.clear(); }
  key(i: number): string | null { return [...this.m.keys()][i] ?? null; }
  get length(): number { return this.m.size; }
}
(globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();

const seed = (): Db => ({
  ...emptyDb(),
  orgName: 'עמותת "גיבוי"\nשורה',
  donationSeq: 3,
  supporters: [{
    id: 'sp1', name: 'כהן', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: 'הערה', count: 2, ils: 100, usd: 50,
    first: '2025-01-01', last: '2025-02-01', nextDate: '',
    donations: [{ rid: 'D-1', date: '2025-01-01', amount: 100, cur: '₪', cat: 'כללי' }, { rid: 'D-2', date: '2025-02-01', amount: 50, cur: '$', cat: 'כללי' }],
    hist: [{ d: '2024-01-01', a: 30, c: '$' }],
  } as Db['supporters'][number]],
});

beforeEach(() => { localStorage.clear(); clearCrypto(); });

describe('⚡ ratchet — קובץ-גיבוי קומפקטי: ייצוא ⇒ ייבוא שווה-ערך', () => {
  it('גלוי: בלי מעברי-שורה/הזחה; parseBackupFile מחזיר את אותם הנתונים', async () => {
    const db = seed();
    const content = await backupFileContent(db);
    expect(content.startsWith('{"')).toBe(true);
    expect(content).not.toMatch(/\n /); // אין הזחה (null, 1) — קומפקטי
    expect(content.length).toBeLessThan(JSON.stringify({ ...db, savedAt: '' }, null, 1).length);
    const back = parseBackupFile(content);
    const expected = migrate(JSON.parse(JSON.stringify(db)))!;
    expect(back.supporters).toEqual(expected.supporters);
    expect(back.orgName).toBe(db.orgName);
    expect(back.donationSeq).toBe(expected.donationSeq);
    expect(typeof back.savedAt).toBe('string');
    // ה-JSON עצמו = המסמך בדיוק (+savedAt)
    const raw = JSON.parse(content);
    expect({ ...raw, savedAt: undefined }).toEqual({ ...JSON.parse(JSON.stringify(db)), savedAt: undefined });
  });

  it('מוצפן: הקובץ מעטפת קומפקטית; decryptBackupFile מחזיר את הנתונים', async () => {
    await beginEncryption(seed(), 'pw-גיבוי');
    const content = await backupFileContent(seed());
    expect(content).not.toMatch(/\n /);
    expect(isEncryptedBackup(content)).toBe(true);
    expect(content).not.toContain('כהן');
    const back = await decryptBackupFile(content, 'pw-גיבוי', 'pass');
    expect(back?.supporters[0].name).toBe('כהן');
    expect(back?.supporters[0].donations).toHaveLength(2);
  }, 60_000);
});

describe('🧷 הגנת-מקור — גיבוי-סוף-היום ב-idle, רק כשהטאב גלוי', () => {
  it('App: requestIdleCallback(timeout 30s) + visibilityState; exportBackupFile ⇒ backupFileContent (קומפקטי)', () => {
    const block = appSrc.slice(appSrc.indexOf("'core.dayendbackup'"), appSrc.indexOf('}, [exportBackup]);'));
    expect(block).toContain("if (pending || document.visibilityState !== 'visible') return;");
    expect(block).toContain('w.requestIdleCallback(run, { timeout: 30_000 })');
    expect(block).toContain("void exportBackup().then((ok) => { if (ok) localStorage.setItem(nsLsKey('maor_autoexp'), today); });");
    expect(persistSrc).toContain('const content = await backupFileContent(db);');
    // בקוד (לא בהערות-הידע) אין עוד JSON.stringify מרווח
    const codeLines = persistSrc.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
    expect(codeLines.some((l) => /JSON\.stringify\([^)]*,\s*null,\s*\d\)/.test(l))).toBe(false);
  });
});
