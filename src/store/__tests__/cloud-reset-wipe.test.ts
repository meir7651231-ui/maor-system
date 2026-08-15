/**
 * ratchet — איפוס/שחזור מוחקים את הישויות גם מהענן (בקשת-בעלים 12.8:
 * "באיפוס אני רוצה שימחק גם את כל התורמים").
 *
 * הבאג: הזרימה הרגילה (cloudOnDbChange) עוברת debounce 800ms ואז flushPush
 * שקורא-מחדש את ה-DB **החי** ‏(hooks.getDb). ‏snapshot-ענן שנכנס בחלון-ההשהיה
 * מיזג את התורמים בחזרה ל-live ⇒ ה-diff חושב מול live-עם-התורמים ⇒ אפס
 * מחיקות ⇒ התורמים "קמו לתחייה" ונשארו בענן. `cloudReplaceNow` דוחף מיד את
 * המחיקות מ-prev הקפוא, בלי לקרוא live, וחוסם מיזוג-מרוחק תוך-כדי.
 *
 * ../lib/cloud ממוקק — לוכדים את ה-DbDiff שנדחף.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDb, emptyFamily, type Db } from '../../types/domain';
import type { DbDiff } from '../../lib/cloud-diff';
import viewSrc from '../useApp.ts?raw';

const pushed: DbDiff[] = [];

vi.mock('../../lib/cloud', () => ({
  pullAll: () => Promise.resolve(null),
  pushDiff: (d: DbDiff) => { pushed.push(d); return Promise.resolve(); },
  subscribeAll: () => () => {},
  donationSplitActive: () => false,
  pushDonations: () => Promise.resolve(),
  initCloud: () => {},
  resetPassword: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOutCloud: () => Promise.resolve(),
  watchAuth: () => () => {},
}));

const { startCloudSync, stopCloudSync, cloudReplaceNow } = await import('../cloudSync');

function withSupporters(n: number): Db {
  const db = emptyDb();
  db.families = [{ ...emptyFamily(), id: 'f1', name: 'משפחה', createdAt: '2026-01-01' }];
  db.supporters = Array.from({ length: n }, (_, i) => ({
    id: 's' + i, name: 'תורם ' + i, donations: [], count: 0, ils: 0, usd: 0,
  } as unknown as Db['supporters'][number]));
  return db;
}

beforeEach(() => {
  pushed.length = 0;
  stopCloudSync();
});

describe('🗑 ratchet — איפוס/שחזור מוחקים תורמים מהענן (12.8)', () => {
  it('cloudReplaceNow דוחף מחיקה לכל תורם — גם מעבר לגבול-האצווה (1201 > 400)', async () => {
    const prev = withSupporters(1201);
    // live-db "מזוהם" — מכיל את כל התורמים בחזרה (כאילו snapshot-ענן מיזג);
    // אם המימוש קורא live במקום prev — ייצא אפס מחיקות והבדיקה תיפול.
    await startCloudSync({ getDb: () => prev, setDbFromRemote: () => {}, toast: () => {}, setStatus: () => {} });

    await cloudReplaceNow(prev, emptyDb());

    const dels = pushed.flatMap((d) => d.deletes);
    const supDeletes = dels.filter((d) => d.col === 'supporters').map((d) => d.id);
    expect(supDeletes.length).toBe(1201);
    expect(new Set(supDeletes).size).toBe(1201); // כולם ייחודיים
    expect(dels.some((d) => d.col === 'families' && d.id === 'f1')).toBe(true);
  });

  it('diff ריק ⇒ אין דחיפה (אין ענן-ריק מיותר)', async () => {
    await startCloudSync({ getDb: () => emptyDb(), setDbFromRemote: () => {}, toast: () => {}, setStatus: () => {} });
    await cloudReplaceNow(emptyDb(), emptyDb());
    expect(pushed.length).toBe(0);
  });

  it('הגנת-מקור: resetAll + restoreDb קוראים cloudReplaceNow (לא הזרימה המושהית)', () => {
    // שני מסלולי-ההחלפה עברו לדחיפה הסמכותית-המיידית (2 קריאות)
    expect((viewSrc.match(/cloudReplaceNow\(prev, db\)/g) ?? []).length).toBe(2);
    // resetAll ממש קורא לה (החלון הורחב ל-600 — נחיל-עמוק 13.8 הוסיף סימון-dirty+הערה)
    expect(viewSrc).toMatch(/resetAll\(\)[\s\S]{0,600}cloudReplaceNow\(prev, db\)/);
    // ואף אחד מהשניים כבר לא משתמש בזרימה המושהית cloudOnDbChange
    expect(viewSrc).not.toMatch(/resetAll\(\)[\s\S]{0,600}cloudOnDbChange/);
  });
});
