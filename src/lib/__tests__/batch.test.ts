/**
 * ratchet · מנוע עיבוד-צובר (runBatch) — נועל את החוזה:
 * שימור-סדר, מקביליות-חסומה, ניסיון-חוזר בטוח (רק שגיאת-מעבר), דיווח-התקדמות.
 */
import { describe, expect, it, vi } from 'vitest';
import { isTransientError, runBatch } from '../batch';

describe('🔁 runBatch — מנוע עיבוד-צובר', () => {
  it('מריץ את כל הפריטים ושומר סדר-תוצאות לפי סדר-הקלט', async () => {
    const items = [1, 2, 3, 4, 5];
    const res = await runBatch(items, async (n) => n * 10, { concurrency: 2, minDelayMs: 0 });
    expect(res.ok).toBe(5);
    expect(res.fail).toBe(0);
    expect(res.results).toEqual([10, 20, 30, 40, 50]);
    expect(res.errors).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });

  it('לא חורג מתקרת-המקביליות', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 12 }, (_, i) => i);
    await runBatch(
      items,
      async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight -= 1;
      },
      { concurrency: 3, minDelayMs: 0 },
    );
    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(maxInFlight).toBeGreaterThan(1); // באמת רץ במקביל
  });

  it('מנסה-שוב על שגיאת-מעבר ומצליח בניסיון השני', async () => {
    let calls = 0;
    const res = await runBatch(
      ['x'],
      async () => {
        calls += 1;
        if (calls === 1) throw new Error('429 rate limit');
        return 'ok';
      },
      { retries: 2, minDelayMs: 0 },
    );
    expect(calls).toBe(2);
    expect(res.ok).toBe(1);
    expect(res.results[0]).toBe('ok');
  });

  it('לא מנסה-שוב על שגיאה גנרית (בטיחות-כתיבה) — נכשל ורושם את השגיאה', async () => {
    let calls = 0;
    const res = await runBatch(
      ['x'],
      async () => {
        calls += 1;
        throw new Error('validation failed');
      },
      { retries: 3, minDelayMs: 0 },
    );
    expect(calls).toBe(1); // ניסיון יחיד — לא-בטוח לחזור
    expect(res.ok).toBe(0);
    expect(res.fail).toBe(1);
    expect((res.errors[0] as Error).message).toContain('validation');
  });

  it('ממצה את הניסיונות על כשל-מעבר מתמשך ואז נכשל', async () => {
    let calls = 0;
    const res = await runBatch(
      ['x'],
      async () => {
        calls += 1;
        throw new Error('unavailable');
      },
      { retries: 2, minDelayMs: 0 },
    );
    expect(calls).toBe(3); // ראשון + 2 חוזרים
    expect(res.fail).toBe(1);
  });

  it('מדווח התקדמות מ-0 עד total, מונוטונית', async () => {
    const onProgress = vi.fn();
    await runBatch([1, 2, 3], async (n) => n, { concurrency: 1, minDelayMs: 0, onProgress });
    const dones = onProgress.mock.calls.map((c) => c[0]);
    expect(dones[0]).toBe(0);
    expect(dones[dones.length - 1]).toBe(3);
    for (let i = 1; i < dones.length; i++) expect(dones[i]).toBeGreaterThanOrEqual(dones[i - 1]);
    onProgress.mock.calls.forEach((c) => expect(c[1]).toBe(3)); // total קבוע
  });

  it('קלט ריק — לא זורק, מחזיר אפסים', async () => {
    const res = await runBatch([], async (x) => x, {});
    expect(res).toEqual({ ok: 0, fail: 0, results: [], errors: [] });
  });

  it('isTransientError מסווג נכון', () => {
    expect(isTransientError(new Error('429 Too Many Requests'))).toBe(true);
    expect(isTransientError(new Error('RESOURCE_EXHAUSTED: quota'))).toBe(true);
    expect(isTransientError({ code: 'unavailable' })).toBe(true);
    expect(isTransientError(new Error('permission-denied'))).toBe(false);
    expect(isTransientError(new Error('bad email'))).toBe(false);
  });
});
