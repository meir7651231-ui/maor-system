/**
 * רצ'ט — חיבור ראשון לענן לא מאבד נתונים מקומיים (פאס-5 של הנחיל, HIGH).
 * לפני התיקון, אם בענן כבר היו נתונים, startCloudSync החליף את כל ה-DB המקומי
 * ב-snapshot של הענן (setDbFromRemote(cloudDb)) — כל עבודה מקומית שנעשתה
 * לא-מקוונת לפני החיבור הראשון נמחקה בשקט. כאן: מאחדים לפי id (הענן מנצח
 * בהתנגשות), רשומות מקומיות-בלבד שורדות ונדחפות לענן.
 *
 * ../lib/cloud ממוקק (אין firebase/רשת) — שולטים ב-pullAll ולוכדים pushDiff.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyDb, emptyFamily, type Db, type Family } from '../../types/domain';
import type { DbDiff } from '../../lib/cloud-diff';

const pushed: DbDiff[] = [];
let cloudReturn: Db | null = null;
let onPush: (() => void) | null = null; // hook לגירוי logout באמצע push
let subscribeCalls = 0;

vi.mock('../../lib/cloud', () => ({
  pullAll: () => Promise.resolve(cloudReturn),
  pushDiff: (d: DbDiff) => {
    pushed.push(d);
    onPush?.();
    return Promise.resolve();
  },
  subscribeAll: () => {
    subscribeCalls++;
    return () => {};
  },
  // re-exports ש-cloudSync מייצא מחדש — לא בשימוש בבדיקה
  initCloud: () => {},
  resetPassword: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOutCloud: () => Promise.resolve(),
  watchAuth: () => () => {},
}));

const { startCloudSync, stopCloudSync } = await import('../cloudSync');

const fam = (id: string, name: string): Family => ({ ...emptyFamily(), id, name, createdAt: '2026-01-01' });
const db = (fams: Family[]): Db => ({ ...emptyDb(), families: fams });

beforeEach(() => {
  pushed.length = 0;
  cloudReturn = null;
  onPush = null;
  subscribeCalls = 0;
  stopCloudSync();
});

describe('☁️ ratchet — מיזוג בחיבור ראשון (HIGH)', () => {
  it('רשומה מקומית-בלבד שורדת ונדחפת; רשומת-ענן מנצחת בהתנגשות', async () => {
    // מקומי: fLocal (מקומי-בלבד) + f1 (קיים גם בענן, בגרסה מקומית ישנה)
    const local = db([fam('f1', 'כהן-מקומי'), fam('fLocal', 'לוי-אופליין')]);
    // ענן: f1 (הגרסה הסמכותית) + fCloud
    cloudReturn = db([fam('f1', 'כהן-ענן'), fam('fCloud', 'ברקוביץ')]);

    let stored: Db | null = null;
    let current = local; // ה-store החי — משקף את setDbFromRemote (כמו במציאות)
    await startCloudSync({
      getDb: () => current,
      setDbFromRemote: (d) => {
        stored = d;
        current = d;
      },
      toast: () => {},
      setStatus: () => {},
    });

    expect(stored).not.toBeNull();
    const ids = stored!.families.map((f) => f.id).sort();
    expect(ids).toEqual(['f1', 'fCloud', 'fLocal']); // המקומי-בלבד שרד
    // הענן מנצח בהתנגשות f1
    expect(stored!.families.find((f) => f.id === 'f1')!.name).toBe('כהן-ענן');
    // רק התוספת המקומית (fLocal) נדחפה לענן, בלי מחיקות
    expect(pushed.length).toBe(1);
    const setIds = pushed[0].sets.map((s) => s.id);
    expect(setIds).toContain('fLocal');
    expect(setIds).not.toContain('fCloud');
    expect(pushed[0].deletes).toEqual([]);
  });

  // 🐛 נחיל-עמוק (13.8): מוני-הקבלות חייבים לעלות בלבד גם בחיבור-ראשון. מכשיר
  // שהנפיק קבלות local-first (receiptSeq גבוה) התחבר לענן עם מונה נמוך ⇒ merged
  // ירש את המונה הנמוך ⇒ הקבלה הבאה קיבלה מספר-מס שכבר הונפק (כפילות §46).
  it('חיבור-ראשון מרים את מוני-הקבלות לערך המקומי הגבוה (לא נסיגה)', async () => {
    const local: Db = { ...emptyDb(), families: [fam('fLocal', 'אופליין')], receiptSeq: 21, donationSeq: 8, seq: 30, shopReceiptSeq: 5 };
    cloudReturn = { ...emptyDb(), families: [fam('fCloud', 'ענן')], receiptSeq: 15, donationSeq: 3, seq: 12, shopReceiptSeq: 1 };
    let stored: Db | null = null;
    await startCloudSync({
      getDb: () => local,
      setDbFromRemote: (d) => { stored = d; },
      toast: () => {},
      setStatus: () => {},
    });
    // ה-DB המאוחד נושא את המונים הגבוהים (מקומי) — לא את הנמוכים של הענן
    expect(stored!.receiptSeq).toBe(21);
    expect(stored!.donationSeq).toBe(8);
    expect(stored!.seq).toBe(30);
    expect(stored!.shopReceiptSeq).toBe(5);
    // והמונים המורמים נדחפים לענן (meta) כדי שגם הענן לא ייתקע נמוך
    expect(pushed[0].meta?.receiptSeq).toBe(21);
    expect(pushed[0].meta?.donationSeq).toBe(8);
  });

  // 🐛 נחיל-עמוק (13.8): עריכה בזמן לחיצת-היד (לפני active) נשמרה מקומית אך לא נדחפה.
  it('עריכה בזמן לחיצת-היד נדחפת בדחיפת-השלמה אחרי active', async () => {
    const base: Db = { ...emptyDb(), families: [fam('f1', 'כהן')] };
    const edited: Db = { ...emptyDb(), families: [fam('f1', 'כהן'), fam('f2', 'עריכת-חלון')] };
    cloudReturn = { ...emptyDb(), families: [fam('f1', 'כהן')] };
    let calls = 0;
    await startCloudSync({
      getDb: () => (++calls === 1 ? base : edited), // הקריאה השנייה (דחיפת-ההשלמה) רואה את העריכה
      setDbFromRemote: () => {},
      toast: () => {},
      setStatus: () => {},
    });
    // דחיפת-ההשלמה כללה את f2 שנוסף בזמן החלון
    const allSetIds = pushed.flatMap((d) => d.sets.map((s) => s.id));
    expect(allSetIds).toContain('f2');
  });

  it('logout באמצע ה-push לא מחיה מנוי חי ולא כותב synced (HIGH re-guard)', async () => {
    const local = db([fam('fLocal', 'אופליין')]);
    cloudReturn = db([fam('fCloud', 'ענן')]);
    const statuses: string[] = [];
    // מדמים logout בדיוק כשה-push רץ (stopCloudSync מאפס hooks → active נשאר false)
    onPush = () => stopCloudSync();
    await startCloudSync({
      getDb: () => local,
      setDbFromRemote: () => {},
      toast: () => {},
      setStatus: (s) => statuses.push(s),
    });
    // אחרי logout: אין התקנת מנוי Firestore, ואין כתיבת 'synced' מעל ה-'idle'
    expect(subscribeCalls).toBe(0);
    expect(statuses[statuses.length - 1]).toBe('idle');
    expect(statuses).not.toContain('synced');
  });
});
