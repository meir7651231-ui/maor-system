/**
 * ⚡ ratchet — ביצועי ההתמדה (12.10.2026): גיבוי-סוף-היום ב-idle; פורמט הקובץ **לא השתנה**.
 *
 * המדידה אצל הלקוח האמיתי (16,000 תורמים): הגיבוי האוטומטי של סוף-היום הסריאל
 * JSON.stringify(doc, null, 1) — 123MB במקום 34MB — והקפיא את הממשק 30.9s באמצע עבודה.
 * ⚠️ ביקורת (12.10): קובץ קומפקטי = קובץ אחר למשתמש (ייצוא-ידני, רשתות-הביטחון-לענן, סוף-היום) —
 * מחוץ למנדט "אותם קבצים" ⇒ ברירת-המחדל נשארה מרווחת ביט-זהה; הקומפקטי זמין כ-opt-in (`compact`)
 * שאינו מחובר עד הכרעת-בעלים. הריצה האוטומטית ב-requestIdleCallback (timeout 30s), גם בטאב ברקע.
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
import useAppSrc from '../useApp.ts?raw';

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

describe('⚠️ ביקורת (12.10) — קובץ-הגיבוי נשאר **מרווח** (ביט-זהה להיום); קומפקטי = opt-in שאינו מחובר', () => {
  it('גלוי: ברירת-המחדל = JSON.stringify(doc, null, 1) בדיוק; ה-compact מחזיר אותו JSON בלי רווחים', async () => {
    const db = seed();
    const pretty = await backupFileContent(db);
    expect(pretty.startsWith('{\n "')).toBe(true); // הזחה של רווח-אחד — הפורמט ההיסטורי
    expect(pretty).toBe(JSON.stringify(JSON.parse(pretty), null, 1));
    const compact = await backupFileContent(db, { compact: true });
    expect(compact.startsWith('{"')).toBe(true);
    expect(compact).not.toMatch(/\n /);
    expect({ ...JSON.parse(compact), savedAt: 0 }).toEqual({ ...JSON.parse(pretty), savedAt: 0 });
    for (const content of [pretty, compact]) {
      const back = parseBackupFile(content);
      const expected = migrate(JSON.parse(JSON.stringify(db)))!;
      expect(back.supporters).toEqual(expected.supporters);
      expect(back.orgName).toBe(db.orgName);
      expect(back.donationSeq).toBe(expected.donationSeq);
      expect(typeof back.savedAt).toBe('string');
    }
  });

  it('מוצפן: המעטפת מרווחת כברירת-מחדל; decryptBackupFile מחזיר את הנתונים (שני הפורמטים)', async () => {
    await beginEncryption(seed(), 'pw-גיבוי');
    const pretty = await backupFileContent(seed());
    expect(pretty.startsWith('{\n "$enc": 2')).toBe(true);
    expect(isEncryptedBackup(pretty)).toBe(true);
    expect(pretty).not.toContain('כהן');
    const back = await decryptBackupFile(pretty, 'pw-גיבוי', 'pass');
    expect(back?.supporters[0].name).toBe('כהן');
    expect(back?.supporters[0].donations).toHaveLength(2);
    const compact = await backupFileContent(seed(), { compact: true });
    expect(compact).not.toMatch(/\n /);
    expect((await decryptBackupFile(compact, 'pw-גיבוי', 'pass'))?.supporters[0].name).toBe('כהן');
  }, 60_000);
});

describe('🧷 הגנת-מקור — גיבוי-סוף-היום ב-idle; הקובץ דרך backupFileContent; ה-compact לא מחובר', () => {
  it('App: requestIdleCallback(timeout 30s) בלי תנאי-גלוי (ביקורת 12.10 — כמו היום, גם בטאב ברקע)', () => {
    const block = appSrc.slice(appSrc.indexOf("'core.dayendbackup'"), appSrc.indexOf('}, [exportBackup]);'));
    expect(block).toContain('if (pending) return;');
    expect(block).not.toContain("visibilityState");
    expect(block).toContain('w.requestIdleCallback(run, { timeout: 30_000 })');
    expect(block).toContain("void exportBackup().then((ok) => { if (ok) localStorage.setItem(nsLsKey('maor_autoexp'), today); });");
    expect(persistSrc).toContain('const content = await backupFileContent(db);');
    // ברירת-המחדל מרווחת (null, 1) — ואף קורא לא מבקש compact (הכרעת-בעלים פתוחה)
    expect(persistSrc).toContain("(opts?.compact ? JSON.stringify(v) : JSON.stringify(v, null, 1))");
    expect(useAppSrc).not.toContain('compact: true');
    expect(appSrc).not.toContain('compact: true');
  });
});
