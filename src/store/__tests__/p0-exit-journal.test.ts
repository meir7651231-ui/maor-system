/**
 * ratchet — P0-DATA (7.11.2026) · יומן-יציאה במשטר IDB-בלבד.
 * 🐛 מסמך > מכסת localStorage (הלקוח-החי, 34MB) ⇒ השמירה ב-pagehide היא put אסינכרוני שמבוטל בפריקה ⇒
 * עריכה שנסגרה תוך ~1ש׳ אבדה בשקט (e2e/p0-data-diag.mjs E1). התיקון: diff סינכרוני ל-LS ביציאה,
 * מוחל בטעינה הבאה כשהוא חדש מהמסמך. כאן: אורקל applyDbDiff ≡ diffDb (כל עריכה משוחזרת בדיוק) + הגנות-מקור.
 */
import { describe, expect, it } from 'vitest';
import { emptyDb, type Db } from '../../types/domain';
import { diffDb } from '../../lib/cloud-diff';
import { applyDbDiff } from '../persist';
import persistSrc from '../persist.ts?raw';
import appSrc from '../useApp.ts?raw';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function world(r: () => number): Db {
  const db = emptyDb();
  db.supporters = Array.from({ length: 40 }, (_, i) => ({ id: 's' + i, name: 'תורם ' + i, nextNote: '', donations: [], count: 0, ils: 0, usd: 0 }) as unknown as Db['supporters'][number]);
  db.families = Array.from({ length: 10 }, (_, i) => ({ id: 'f' + i, name: 'משפחה ' + i, members: [] }) as unknown as Db['families'][number]);
  db.seq = 100 + Math.floor(r() * 10);
  return db;
}
function mutate(base: Db, r: () => number): Db {
  let next: Db = { ...base, supporters: [...base.supporters], families: [...base.families] };
  const n = 1 + Math.floor(r() * 6);
  for (let k = 0; k < n; k++) {
    const op = r();
    if (op < 0.4 && next.supporters.length) {
      const i = Math.floor(r() * next.supporters.length);
      next.supporters[i] = { ...next.supporters[i], nextNote: 'עריכה ' + k };
    } else if (op < 0.6) {
      next.supporters.push({ id: 'new' + k + '_' + Math.floor(r() * 1e6), name: 'חדש', donations: [], count: 0, ils: 0, usd: 0 } as unknown as Db['supporters'][number]);
    } else if (op < 0.75 && next.supporters.length) {
      next.supporters.splice(Math.floor(r() * next.supporters.length), 1);
    } else if (op < 0.9 && next.families.length) {
      const i = Math.floor(r() * next.families.length);
      next.families[i] = { ...next.families[i], name: 'שונה ' + k };
    } else {
      next = { ...next, seq: next.seq + 1, receiptSeq: next.receiptSeq + 1 };
    }
  }
  return next;
}
const norm = (db: Db) => {
  const { savedAt: _s, ...rest } = db as Db & { savedAt?: string };
  const sortById = (l: Array<{ id: string }>) => [...l].sort((a, b) => (a.id < b.id ? -1 : 1));
  return JSON.stringify({ ...rest, supporters: sortById(db.supporters), families: sortById(db.families) });
};

describe('🛟 יומן-יציאה — applyDbDiff(base, diffDb(base,next)) ≡ next', () => {
  it('אורקל: 300 עולמות-אקראיים × רצף-עריכות (עריכה/הוספה/מחיקה/מונים)', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const r = rng(seed);
      const base = world(r);
      const next = mutate(mutate(base, r), r);
      expect(norm(applyDbDiff(base, diffDb(base, next))), 'seed ' + seed).toBe(norm(next));
    }
  });
  it('diff ריק ⇒ אותו תוכן; מונה-קבלות עולה דרך meta', () => {
    const base = world(rng(7));
    expect(norm(applyDbDiff(base, diffDb(base, base)))).toBe(norm(base));
    const next = { ...base, donationSeq: base.donationSeq + 5 };
    expect(applyDbDiff(base, diffDb(base, next)).donationSeq).toBe(base.donationSeq + 5);
  });
});

describe('🛡 הגנות-מקור — החיווט', () => {
  it('יציאה במשטר IDB-בלבד כותבת יומן סינכרוני לפני ה-put האסינכרוני (גם כשהמכסה נלמדת ביציאה)', () => {
    expect(persistSrc).toMatch(/if \(lsDropped\) \{\s*writeExitJournal\(db\);[^\n]*\n\s*void saveDb\(db\);/);
    // יציאה ראשונה בסשן: היומן לפני ה-stringify הגדול (שנקטע בפריקה), ושורת ה-LS ביט-זהה
    expect(persistSrc).toMatch(/writeExitJournal\(db\);\s*\/\/ ⚡ \(12\.10\)[^\n]*\n\s*if \(!lsWrite\(JSON\.stringify\(\{ \.\.\.db, savedAt: new Date\(\)\.toISOString\(\) \}\)\)\) void saveDb\(db\);/);
    expect(persistSrc).toContain('storedBase = doc;'); // הבסיס מתעדכן אחרי כל put שהושלם
    expect(appSrc).toContain('if (!s.staleTab) flushSaveSync(s.db);'); // שורת-היציאה המוגנת — ביט-זהה
    // ברגע-העריכה (לפני הרינדור) — ביציאה מהירה pagehide לא רץ כלל כשה-thread עסוק
    expect(appSrc).toMatch(/dirty = true;[^\n]*\n[\s\S]{0,300}if \(!get\(\)\.staleTab\) writeExitJournal\(get\(\)\.db\);\s*scheduleSave\(\);/);
  });
  it('E2: במשטר IDB-בלבד שמירה מודיעה ללשוניות (BroadcastChannel) והמקבל מאמץ לפי כללי שער-ה-storage', () => {
    expect(persistSrc).toContain('if (lsSkipped || !lsOk) announceIdbSave(doc.savedAt);');
    expect(appSrc).toMatch(/onOtherTabIdbSave\(\(savedAt\) => \{[\s\S]{0,400}if \(dirty \|\| get\(\)\.needDecrypt\) return;/);
  });
  it('מוצפן ⇒ אין יומן גלוי (לא נכתב · נמחק בהפעלת-הצפנה ובטעינה מוצפנת); מסמך-ב-LS ⇒ אין יומן; בסיס מדויק', () => {
    expect(persistSrc).toContain('if (dek && envelope) return false; // (3)');
    expect(persistSrc).toContain('if (!lsDropped && lsHasDoc) return false;');
    expect(persistSrc).toMatch(/envelope = env;\s*clearAllJournals\(\);/); // beginEncryption
    expect((persistSrc.match(/clearAllJournals\(\); \/\/ 🛟 P0-DATA \(3\)/g) ?? []).length).toBeGreaterThanOrEqual(2); // שני ענפי-הטעינה המוצפנים
    expect(persistSrc).toContain('rebaseJournalAfterSave(db);');
    expect(appSrc).toMatch(/restoreDb\(db\) \{[\s\S]{0,3500}clearAllJournals\(\);/);
  });
});
