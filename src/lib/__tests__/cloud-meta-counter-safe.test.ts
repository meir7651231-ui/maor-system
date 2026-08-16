/**
 * ratchet (הגנת-מקור) — נחיל-עמוק (13.8): כתיבת מסמך ה-meta לענן בטוחה-למונים.
 *  · #3  pushDiff כתב את ה-meta ב-set() עיוור ⇒ מכשיר עם מונה-מפגר דרס את מונה-הענן
 *        (מרוץ תת-שנייה על שינוי-meta שאינו-מונה) ⇒ קבלת-מס כפולה. כעת עסקה שמרימה
 *        את המונים למקסימום מול הערך החי בענן (עובד גם לנתיב המוצפן).
 *  · #16 cloudReplaceNow בלע עריכת-משתמש בזמן חלון-הדחיפה — כעת דחיפת-השלמה.
 */
import { describe, expect, it } from 'vitest';
import cloudSrc from '../cloud.ts?raw';
import cloudSyncSrc from '../../store/cloudSync.ts?raw';

describe('#3 — כתיבת meta בטוחה-למונים (עסקה)', () => {
  it('קיימת פונקציית-עסקה שמרימה מונים למקסימום', () => {
    expect(cloudSrc).toContain('async function pushMetaCounterSafe');
    expect(cloudSrc).toContain('runTransaction');
    expect(cloudSrc).toContain("META_COUNTER_KEYS = ['seq', 'receiptSeq', 'donationSeq', 'shopReceiptSeq']");
  });

  it('pushDiff מנתב את ה-meta דרך העסקה, לא דרך כתיבת-האצווה העיוורת', () => {
    // 15.8 — ה-meta עובר קילוף-audit מותנה-אכיפה לפני הכתיבה-הבטוחה-למונים
    expect(cloudSrc).toContain('if (meta) await pushMetaCounterSafe(toPlain(meta), dek)');
    // הכתיבה העיוורת הישנה של ה-meta ב-batch הוסרה
    expect(cloudSrc).not.toContain('b.set(doc(db, scopedMeta()), meta)');
  });
});

describe('#16 — cloudReplaceNow דוחף עריכה שנעשתה בחלון-הדחיפה', () => {
  it('דחיפת-השלמה: diff מול המצב החי אם השתנה מ-next', () => {
    // מסלול-B (2b): דחיפת-ההשלמה עברה דרך pushSplitAware(next.supporters, live.supporters, diffDb(next, live))
    expect(cloudSyncSrc).toContain('diffDb(next, live)');
    expect(cloudSyncSrc).toContain('pushSplitAware(next.supporters, live.supporters');
  });
});
