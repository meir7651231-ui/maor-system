/**
 * P0-DATA שלב 0 (7.11.2026) — האם סנכרון-הענן מציל את שני אובדני-הנתונים שנמצאו במשטר IDB-בלבד?
 * (knowledge/DIAG-P0-DATA-STAGE0-2026-11-07.md · e2e/p0-data-diag.mjs). ../lib/cloud ממוקק כענן-בזיכרון.
 *  E2 (שתי לשוניות): הדחיפה של B היא diff מול הבסיס של B ⇒ לא דורסת את עריכת A בענן; ובטעינה הבאה
 *     הענן מנצח ⇒ העריכה של A חוזרת גם מקומית. ⇒ **הענן מציל.**
 *  E1 (סגירה מהירה): הדחיפה נדחית 800ms ואין flush-ענן ביציאה ⇒ עריכה שנסגרה לפני 800ms לא נדחפה כלל.
 *     ⇒ **הענן לא מציל בחלון 0–800ms** (אחריו — setDoc לתור המתמיד של Firestore, cloud.ts:254).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDb, type Db } from '../../types/domain';
import type { DbDiff } from '../../lib/cloud-diff';
import cloudSyncSrc from '../cloudSync.ts?raw';

const cloud = new Map<string, Record<string, unknown>>(); // 'col|id' → doc
let cloudMeta: Record<string, unknown> | null = null;
const pushes: DbDiff[] = [];
function applyDiff(d: DbDiff) {
  pushes.push(d);
  for (const u of d.sets) cloud.set(u.col + '|' + u.id, u.data as Record<string, unknown>);
  for (const x of d.deletes) cloud.delete(x.col + '|' + x.id);
}
function cloudAsDb(): Db {
  const db = { ...emptyDb(), ...cloudMeta } as Db;
  db.supporters = [...cloud.entries()].filter(([k]) => k.startsWith('supporters|')).map(([, v]) => v) as unknown as Db['supporters'];
  return db;
}
vi.mock('../../lib/cloud', () => ({
  pullAll: () => Promise.resolve(cloud.size ? cloudAsDb() : null),
  pushDiff: (d: DbDiff) => { applyDiff(d); return Promise.resolve(); },
  subscribeAll: () => () => {},
  donationSplitActive: () => false,
  supEnforceActive: () => false,
  pushDonations: () => Promise.resolve(),
  initCloud: () => {},
  resetPassword: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOutCloud: () => Promise.resolve(),
  watchAuth: () => () => {},
}));
const { startCloudSync, stopCloudSync, cloudOnDbChange } = await import('../cloudSync');

const sup = (id: string, nextNote = '') => ({ id, name: 'תורם ' + id, donations: [], count: 0, ils: 0, usd: 0, nextNote }) as unknown as Db['supporters'][number];
function base(): Db {
  const db = emptyDb();
  db.supporters = [sup('s1'), sup('s2')];
  return db;
}
function seedCloud(db: Db) {
  cloud.clear();
  for (const s of db.supporters) cloud.set('supporters|' + s.id, JSON.parse(JSON.stringify(s)));
  cloudMeta = {};
}
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => { pushes.length = 0; stopCloudSync(); vi.useRealTimers(); });
afterEach(() => { stopCloudSync(); vi.useRealTimers(); });

describe('P0 · E2 שתי לשוניות — הענן מציל', () => {
  it('דחיפת B (בסיס-ישן) לא דורסת את עריכת A בענן; טעינה-הבאה מחזירה את עריכת A', async () => {
    const b0 = base();
    seedCloud(b0);
    // לשונית A ערכה s1 ונדחפה לענן (כמו בדיפ רגיל)
    cloud.set('supporters|s1', { ...cloud.get('supporters|s1'), nextNote: 'A' });
    // לשונית B — הזיכרון שלה ישן (בלי עריכת A), עורכת s2
    let liveB = b0;
    await startCloudSync({ getDb: () => liveB, setDbFromRemote: (d) => { liveB = d; }, toast: () => {}, setStatus: () => {} });
    // ה-handshake כבר מיזג: הענן מנצח ⇒ B מקבלת את עריכת A עוד לפני שהיא עורכת
    expect(liveB.supporters.find((s) => s.id === 's1')?.nextNote).toBe('A');
    // גם בתרחיש הגרוע (B עורכת מבסיס-ישן, בלי המיזוג): הדחיפה היא diff פר-מסמך
    vi.useFakeTimers();
    const stale = b0;
    const nextB = { ...stale, supporters: [stale.supporters[0], sup('s2', 'B')] };
    liveB = nextB;
    cloudOnDbChange(stale, nextB);
    await vi.advanceTimersByTimeAsync(900);
    const upIds = pushes.flatMap((d) => d.sets.filter((u) => u.col === 'supporters').map((u) => u.id));
    expect(upIds).toEqual(['s2']); // s1 לא נדחף ⇒ עריכת A בענן לא נדרסת
    expect(cloud.get('supporters|s1')?.nextNote).toBe('A');
    expect(cloud.get('supporters|s2')?.nextNote).toBe('B');
    vi.useRealTimers();
    stopCloudSync();
    // טעינה-הבאה: ה-IDB המקומי = המסמך המלא של B (s1 ישן). הענן מנצח ⇒ s1='A' חוזר
    let reload = nextB;
    await startCloudSync({ getDb: () => reload, setDbFromRemote: (d) => { reload = d; }, toast: () => {}, setStatus: () => {} });
    await flush();
    expect(reload.supporters.find((s) => s.id === 's1')?.nextNote).toBe('A');
    expect(reload.supporters.find((s) => s.id === 's2')?.nextNote).toBe('B');
  });
});

describe('P0 · E1 סגירה מהירה — הענן לא מציל בחלון ה-debounce', () => {
  it('עריכה ⇒ "סגירה" אחרי 700ms: שום דבר לא נדחף לענן; רק אחרי 800ms', async () => {
    const b0 = base();
    seedCloud(b0);
    let live = b0;
    await startCloudSync({ getDb: () => live, setDbFromRemote: (d) => { live = d; }, toast: () => {}, setStatus: () => {} });
    pushes.length = 0;
    vi.useFakeTimers();
    const next = { ...b0, supporters: [sup('s1', 'E1'), b0.supporters[1]] };
    live = next;
    cloudOnDbChange(b0, next);
    await vi.advanceTimersByTimeAsync(700);
    expect(pushes.length).toBe(0); // נסגר כאן ⇒ העריכה לא הגיעה לענן
    await vi.advanceTimersByTimeAsync(150);
    expect(pushes.length).toBe(1);
    expect(cloud.get('supporters|s1')?.nextNote).toBe('E1');
  });
  it('הגנת-מקור: debounce 800ms ואין flush-ענן ב-pagehide/hidden (נכון ל-7.11.2026)', () => {
    expect(cloudSyncSrc).toContain('const PUSH_DEBOUNCE_MS = 800;');
    expect(cloudSyncSrc).not.toMatch(/pagehide|visibilitychange/);
  });
});
