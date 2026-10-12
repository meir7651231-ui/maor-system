/**
 * ⚡ ratchet — ביצועי ההתמדה (12.10.2026): טעינה נקייה לא מתזמנת שמירה; הצילום היומי ב-idle.
 *
 * המדידה אצל הלקוח האמיתי (16,000 תורמים · 34MB · ×4 האטת-CPU): טעינת-דף 3.3s CPU (6s קיר) —
 * ובתוכה (1) dailySnapshot עשה structured-clone של כל המסמך ל-IDB מיד אחרי הציור הראשון,
 * (2) runDecay היומי קרא setDb גם כשאף משפחה לא דעכה ⇒ scheduleSave ⇒ שמירה מלאה (34MB)
 * חצי-שנייה אחרי הפתיחה. הכלל: אין שינוי ⇒ אין setDb (ה-db נשאר אותה הפניה); הצילום נדחה
 * ל-idle וכשהטאב גלוי — ועדיין מובטח (rIC עם timeout / נפילה ל-setTimeout / המתנה ל-visible).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useApp } from '../useApp';
import { runWhenIdleVisible, scheduleDailySnapshot } from '../persist';
import { emptyDb, type Db, type Family } from '../../types/domain';
import useAppSrc from '../useApp.ts?raw';

const iso = (daysAgo: number) => {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};
const fam = (id: string, cred: Family['cred']): Family =>
  ({ id, name: 'משפחה ' + id, phone: '', members: [], docs: [], status: 'active', createdAt: iso(100), cred } as unknown as Family);

describe('⚡ ratchet — runDecay בלי דעיכה בפועל ⇒ ה-db לא מוחלף (אין שמירה מתוזמנת)', () => {
  it('כל המשפחות פעילות/כבר-דעכו-היום ⇒ אותה הפניית db; יש דעיכה ⇒ db חדש + ציון 698', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      families: [
        fam('active', { score: 700, log: [{ date: iso(2), delta: 5, reason: 'תשלום' }] }),
        fam('today', { score: 700, log: [{ date: iso(0), delta: -2, reason: 'דעיכה — חוסר פעילות' }] }),
        fam('floor', { score: 0, log: [] }),
      ],
    }) as Partial<Db>);
    const before = useApp.getState().db;
    useApp.getState().runDecay();
    expect(useApp.getState().db).toBe(before); // setDb לא נקרא ⇒ scheduleSave לא תוזמן
    expect(useApp.getState().toasts.some((t) => t.text.includes('Batch יומי'))).toBe(false);

    useApp.getState().setDb((db) => ({ families: [...db.families, fam('idle', { score: 700, log: [] })] }));
    const before2 = useApp.getState().db;
    useApp.getState().runDecay();
    expect(useApp.getState().db).not.toBe(before2);
    expect(useApp.getState().db.families.find((f) => f.id === 'idle')!.cred.score).toBe(698);
    expect(useApp.getState().db.families.find((f) => f.id === 'active')!.cred.score).toBe(700);
  });
});

describe('⚡ ratchet — runWhenIdleVisible / scheduleDailySnapshot', () => {
  const g = globalThis as unknown as Record<string, unknown>;
  afterEach(() => { delete g.window; delete g.document; vi.useRealTimers(); });

  it('טאב גלוי + rIC ⇒ מתוזמן ב-requestIdleCallback עם timeout (מובטח לרוץ)', () => {
    let cb: (() => void) | null = null; let opts: { timeout: number } | undefined;
    g.window = { requestIdleCallback: (f: () => void, o?: { timeout: number }) => { cb = f; opts = o; return 1; } };
    g.document = { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} };
    const fn = vi.fn();
    runWhenIdleVisible(fn, 10_000);
    expect(fn).not.toHaveBeenCalled(); // לא בזמן הציור הראשון
    expect(opts).toEqual({ timeout: 10_000 });
    cb!();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('טאב מוסתר בטעינה ⇒ ממתין ל-visible ורק אז מתזמן (פעם אחת)', () => {
    const listeners: Array<() => void> = [];
    let ric = 0;
    const doc = { visibilityState: 'hidden', addEventListener: (_: string, l: () => void) => listeners.push(l), removeEventListener: vi.fn() };
    g.window = { requestIdleCallback: (f: () => void) => { ric++; f(); return 1; } };
    g.document = doc;
    const fn = vi.fn();
    runWhenIdleVisible(fn, 10_000);
    expect(ric).toBe(0);
    listeners.forEach((l) => l()); // עדיין hidden — כלום
    expect(fn).not.toHaveBeenCalled();
    doc.visibilityState = 'visible';
    listeners.forEach((l) => l());
    expect(fn).toHaveBeenCalledTimes(1);
    expect(doc.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('בלי requestIdleCallback (Safari) ⇒ setTimeout — עדיין רץ', () => {
    vi.useFakeTimers();
    g.window = {};
    g.document = { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} };
    const fn = vi.fn();
    runWhenIdleVisible(fn, 10_000);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('scheduleDailySnapshot: getDb נקרא רק ברגע ה-idle (הצילום = המצב-החי דאז)', () => {
    let cb: (() => void) | null = null;
    g.window = { requestIdleCallback: (f: () => void) => { cb = f; return 1; } };
    g.document = { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} };
    const getDb = vi.fn(() => emptyDb());
    scheduleDailySnapshot(getDb);
    expect(getDb).not.toHaveBeenCalled();
    cb!();
    expect(getDb).toHaveBeenCalledTimes(1);
  });
});

describe('🧷 הגנת-מקור — postLoad', () => {
  it('הגיזום כותב רק כשיש מה לגזום; הצילום היומי דרך scheduleDailySnapshot; runDecay כותב רק כש-n>0', () => {
    expect(useAppSrc).toMatch(/const stale = Object\.entries\(db\.attnDone \?\? \{\}\)[^\n]*\n(?:\s*\/\/[^\n]*\n)*\s*if \(stale\.length\) \{\s*\n\s*setDb\(/);
    expect(useAppSrc).toContain('if (!corrupt) scheduleDailySnapshot(() => get().db);');
    // בתוך postLoad אין עוד צילום-מיידי (restoreDb — פעולת-משתמש מפורשת — נשאר מיידי במכוון)
    const postLoad = useAppSrc.slice(useAppSrc.indexOf('function postLoad('), useAppSrc.indexOf('const today = isoToday();', useAppSrc.indexOf('function postLoad(')));
    expect(postLoad).not.toMatch(/void dailySnapshot\(/);
    expect(useAppSrc).toMatch(/if \(n === 0\) return;\s*\n\s*setDb\(\{ families \}\);/);
  });
});
