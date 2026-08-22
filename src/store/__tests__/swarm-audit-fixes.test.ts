/**
 * ratchet — swarm-audit (21.8.2026): צרור תיקוני-באגים מאומתים ב-store/persist.
 *  · #1 סדר-אתחול הנעילה — lock נקרא לפני setPersistNamespace ⇒ PIN פר-ארגון "נעלם".
 *  · #3 restoreDb דרס את טבעת-הלוג החיה (audit) בזו של הגיבוי.
 *  · #5 מצבת-מחיקה (deleted) שהגיעה ב-onSnapshot החי נבלעה בשער-ה-config.
 *  · #6 מוני-קבלות התקבלו מהגיבוי בלי בדיקת-טיפוס ("5"+1="51" ⇒ D-51).
 *  · #8 מחיקת/מיזוג פריט-קטלוג השאירו קליטות-מלאי יתומות וזרקו waits.
 *  · #9 ריבוי-טאבים במצב-מוצפן — טאב מיושן דרס בשקט את הטאב האחר.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { migrate, setPersistNamespace } from '../persist';
import { readLock } from '../../lib/lock';
import { emptyDb, DB_VERSION } from '../../types/domain';
import type { Db } from '../../types/domain';
import useAppSrc from '../useApp.ts?raw';

beforeEach(() => {
  useApp.getState().setDb(() => emptyDb());
});

// ── #1 · סדר-אתחול הנעילה ────────────────────────────────────────────────────
describe('🔒 🐛 swarm-audit #1 — הנעילה נקראת אחרי קביעת ה-namespace', () => {
  // הבאג: `lock: readLock()` רץ ב-import של המודול, לפני setPersistNamespace(slug)
  // ב-init ⇒ אצל ?org=<slug> נקרא המפתח הגלובלי 'maor_lock' במקום 'maor_lock:<slug>',
  // ו-`let lock = get().lock` שימר את הערך המיושן — ה-PIN הפר-ארגוני נעלם ברענון.

  // סביבת-הבדיקות היא node — מציבים localStorage מינימלי כדי לבדוק את readLock עצמו
  const mem = new Map<string, string>();
  let prevLs: unknown;
  beforeAll(() => {
    prevLs = (globalThis as { localStorage?: unknown }).localStorage;
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => void mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() {
        return mem.size;
      },
    };
  });
  afterAll(() => {
    if (prevLs === undefined) delete (globalThis as { localStorage?: unknown }).localStorage;
    else (globalThis as { localStorage?: unknown }).localStorage = prevLs;
    setPersistNamespace('default');
  });

  it('readLock קורא את המפתח הפר-ארגוני אחרי setPersistNamespace, והגלובלי לפניו', () => {
    try {
      mem.set('maor_lock', JSON.stringify({ primary: 'HASH-GLOBAL' }));
      mem.set('maor_lock:orgx', JSON.stringify({ primary: 'HASH-ORGX' }));
      setPersistNamespace('default');
      expect(readLock().primary).toBe('HASH-GLOBAL');
      setPersistNamespace('orgx');
      expect(readLock().primary).toBe('HASH-ORGX'); // הקריאה-מחדש ב-init רואה את זה
      // מיגרציה-רכה (מדיניות קיימת, לא שונתה): ארגון בלי נעילה משלו ⇒ הגלובלי
      mem.delete('maor_lock:orgx');
      expect(readLock().primary).toBe('HASH-GLOBAL');
    } finally {
      setPersistNamespace('default');
      mem.clear();
    }
  });

  it('הגנת-מקור: init קורא מחדש set({ lock: readLock() }) אחרי setPersistNamespace ולפני loadDb', () => {
    const iNs = useAppSrc.indexOf('setPersistNamespace(config.slug);');
    const iRe = useAppSrc.indexOf('set({ lock: readLock() });');
    const iLoad = useAppSrc.indexOf('const res = await loadDb();');
    expect(iNs).toBeGreaterThan(-1);
    expect(iRe).toBeGreaterThan(iNs);
    expect(iLoad).toBeGreaterThan(iRe);
  });
});

// ── #3 · restoreDb משמר את טבעת-הלוג החיה ───────────────────────────────────
describe('🧾 🐛 swarm-audit #3 — restoreDb לא דורס את לוג-הפעולות החי', () => {
  it('הטבעת החיה (כולל רשומת "שחזור מגיבוי") נשמרת; audit של הגיבוי נזנח', () => {
    // הבאג: הגיבוי החליף את db.audit כולו — כולל רשומת 'שחזור מגיבוי' שנרשמה
    // שורה קודם — והלוג התפעולי (מי-שינה-מה) נמחק בכל שחזור.
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      audit: [{ at: '2026-08-20T10:00:00Z', who: 'מקומי', act: 'תשלום', what: 'R-7' }],
    }));
    const backup = {
      ...emptyDb(),
      orgName: 'גיבוי',
      audit: [{ at: '2020-01-01T00:00:00Z', who: 'ישן', act: 'ישן', what: 'ישן' }],
    } as Db;
    useApp.getState().restoreDb(backup);
    const audit = useApp.getState().db.audit ?? [];
    expect(audit.some((a) => a.act === 'תשלום')).toBe(true); // הלוג החי שרד
    expect(audit.some((a) => a.act === 'שחזור מגיבוי')).toBe(true); // רשומת-השחזור שרדה
    expect(audit.some((a) => a.who === 'ישן')).toBe(false); // לוג-הגיבוי לא אומץ
    expect(useApp.getState().db.orgName).toBe('גיבוי'); // השחזור עצמו עבד
  });

  it('ריפוי: audit תמיד מערך גם כשהטבעת החיה חסרה', () => {
    useApp.getState().setDb(() => {
      const db = { ...emptyDb() } as Partial<Db>;
      delete db.audit;
      return db as Db;
    });
    useApp.getState().restoreDb({ ...emptyDb(), orgName: 'ב' } as Db);
    expect(Array.isArray(useApp.getState().db.audit)).toBe(true);
  });
});

// ── #5 · מצבת-מחיקה בהאזנה-החיה ─────────────────────────────────────────────
describe('🗑 🐛 swarm-audit #5 — הגנת-מקור: applyCloudDoc מטפל ב-deleted לפני שער-ה-config', () => {
  it('orgDoc?.deleted נבדק בתוך applyCloudDoc, מפעיל wipeLocalOrgData+removed, ולפני !orgDoc?.config', () => {
    // הבאג: `if (!orgDoc?.config) return;` בלע מצבת {deleted:true} שהגיעה דרך
    // watchOrgCloudConfig (onSnapshot) בעוד לקוח מחובר — הניקוי רץ רק ב-fetch
    // החד-פעמי של ההתחברות, ולקוח-מחובר המשיך לעבוד על ארגון שנמחק.
    const m = useAppSrc.match(
      /const applyCloudDoc = \(orgDoc: OrgCloudDoc \| null\) => \{([\s\S]*?)\n {10}\};/,
    );
    expect(m).not.toBeNull();
    const body = m![1];
    const iDeleted = body.indexOf('orgDoc?.deleted');
    const iWipe = body.indexOf('wipeLocalOrgData(cfg.slug)');
    const iRemoved = body.indexOf("membership: 'removed'");
    const iCfgGate = body.indexOf('if (!orgDoc?.config) return;');
    expect(iDeleted).toBeGreaterThan(-1);
    expect(iWipe).toBeGreaterThan(iDeleted);
    expect(iRemoved).toBeGreaterThan(iDeleted);
    expect(iCfgGate).toBeGreaterThan(iDeleted); // המצבת נבדקת לפני שער-ה-config
  });
});

// ── #6 · מוני-קבלות עם בדיקת-טיפוס ──────────────────────────────────────────
describe('🔢 🐛 swarm-audit #6 — migrate: מונה-קבלות לא-מספרי לא משחית את מספור §46', () => {
  it('"donationSeq":"5" (מחרוזת) ⇒ נופל ל-base ונזרע מעל D- הגבוה בפועל (לא "51")', () => {
    // הבאג: db.donationSeq ?? base קיבל כל טיפוס — "5" הנפיק D-5 ואז "5"+1="51"
    // ⇒ הקבלה הבאה D-51, שבירת רציפות מספור סעיף 46.
    const m = migrate({
      v: DB_VERSION,
      receiptSeq: '3',
      donationSeq: '5',
      shopReceiptSeq: '2',
      supporters: [
        { id: 's1', name: 'כהן', donations: [{ rid: 'D-5', date: '2026-01-01', amount: 100, cur: '₪', cat: '' }] },
      ],
    } as unknown)!;
    expect(typeof m.donationSeq).toBe('number');
    expect(m.donationSeq).toBe(6); // זריעת maxRid: מעל D-5 שהונפק בפועל
    expect(m.receiptSeq).toBe(1); // אין R- בנתונים ⇒ base (המספור ימשיך תקין)
    expect(m.shopReceiptSeq).toBe(1);
  });

  it('שלילי/NaN/שבר ⇒ נופל ל-base או נחתך לשלם — לעולם לא מחרוזת', () => {
    const m = migrate({ v: DB_VERSION, receiptSeq: -4, donationSeq: NaN, shopReceiptSeq: 7.9 } as unknown)!;
    expect(m.receiptSeq).toBe(1);
    expect(m.donationSeq).toBe(1);
    expect(m.shopReceiptSeq).toBe(7); // Math.floor — מונה שלם
  });

  it('מונה מספרי תקין עובר כמות-שהוא (ביט-זהה לנתונים נקיים)', () => {
    const m = migrate({ v: DB_VERSION, receiptSeq: 12, donationSeq: 34, shopReceiptSeq: 5 } as unknown)!;
    expect(m.receiptSeq).toBe(12);
    expect(m.donationSeq).toBe(34);
    expect(m.shopReceiptSeq).toBe(5);
  });
});

// ── #8 · פריטי-קטלוג: קליטות + waits ───────────────────────────────────────
describe('📦 🐛 swarm-audit #8 — deleteShopItem/mergeShopItems מול קליטות-מלאי ורשימות-המתנה', () => {
  const item = (id: string, over: Record<string, unknown> = {}) =>
    ({ id, name: 'פריט ' + id, kind: 'coupon', storeId: '', active: true, notes: '', ...over });

  it('מחיקת פריט עם קליטות-מלאי נחסמת (כמו שער-הרכיבים) — הפריט נשאר', () => {
    // הבאג: המחיקה בדקה רק רכיבים — קליטות (shopIntakes.itemId) נשארו יתומות
    // על מזהה-מת ויומן "המלאי הנכנס" איבד את ההקשר.
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      shopItems: [item('i1')] as unknown as Db['shopItems'],
      shopIntakes: [
        { id: 'n1', itemId: 'i1', date: '2026-08-01', qty: 5, kind: 'donation', source: '', cost: 0, note: '' },
      ] as Db['shopIntakes'],
    }));
    expect(useApp.getState().deleteShopItem('i1')).toBe(false);
    expect(useApp.getState().db.shopItems).toHaveLength(1);
  });

  it('מחיקת פריט בלי קליטות ובלי רכיבים — עוברת כרגיל', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      shopItems: [item('i1')] as unknown as Db['shopItems'],
    }));
    expect(useApp.getState().deleteShopItem('i1')).toBe(true);
    expect(useApp.getState().db.shopItems).toHaveLength(0);
  });

  it('מיזוג: הקליטות של המקור עוברות ליעד, ו-waits מאוחדים בדדופ פר-משפחה', () => {
    // הבאג: המיזוג הסב רכיבים בלבד — הקליטות נשארו על מזהה-מת ו-waits של המקור נזרקו.
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      shopItems: [
        item('i1', { waits: [{ famId: 'f1', date: '2026-08-01', note: 'יעד' }] }),
        item('i2', {
          waits: [
            { famId: 'f1', date: '2026-08-02', note: 'כפול' },
            { famId: 'f3', date: '2026-08-03', note: 'חדש' },
          ],
        }),
      ] as unknown as Db['shopItems'],
      shopIntakes: [
        { id: 'n1', itemId: 'i2', date: '2026-08-01', qty: 5, kind: 'buy', source: '', cost: 10, note: '' },
      ] as Db['shopIntakes'],
    }));
    expect(useApp.getState().mergeShopItems('i1', 'i2')).toBe(true);
    const db = useApp.getState().db;
    expect(db.shopItems.map((x) => x.id)).toEqual(['i1']);
    expect(db.shopIntakes[0].itemId).toBe('i1'); // הקליטה הוסבה ליעד
    const waits = db.shopItems[0].waits!;
    expect(waits.map((w) => w.famId)).toEqual(['f1', 'f3']); // דדופ: f1 של היעד מנצח
    expect(waits.find((w) => w.famId === 'f1')!.note).toBe('יעד');
  });

  it('מיזוג בלי ממתינים משאיר את היעד בלי מפתח waits (ביט-זהה)', () => {
    useApp.getState().setDb(() => ({
      ...emptyDb(),
      shopItems: [item('i1'), item('i2')] as unknown as Db['shopItems'],
    }));
    expect(useApp.getState().mergeShopItems('i1', 'i2')).toBe(true);
    expect('waits' in useApp.getState().db.shopItems[0]).toBe(false);
  });
});

// ── #9 · ריבוי-טאבים במצב-מוצפן ─────────────────────────────────────────────
describe('🔐 🐛 swarm-audit #9 — הגנת-מקור: טאב-מיושן במצב-מוצפן לא כותב', () => {
  // הבאג: מאזין-ה-storage יצא בשקט על get().encrypted — טאב מיושן שלא ראה את
  // הכתיבה של הטאב האחר דרס בשמירה הבאה את כל יום-העבודה שלו. התיקון השמרני:
  // בלי פענוח-ואימוץ — מסמנים staleTab, חוסמים scheduleSave/flush ומבקשים רענון;
  // עם עריכה ממתינה (dirty) ההתנהגות הקודמת נשמרת.
  it('מאזין-ה-storage מסמן staleTab במצב-מוצפן כשאין עריכה ממתינה', () => {
    const m = useAppSrc.match(/function startMultiTabGuard\(\) \{([\s\S]*?)\n {2}\}/);
    expect(m).not.toBeNull();
    const body = m![1];
    expect(body).toContain('if (get().encrypted) {');
    expect(body).toContain('if (!dirty && !get().staleTab) {');
    expect(body).toContain('set({ staleTab: true });');
    expect(body).toContain('warnStaleTab();');
  });

  it('scheduleSave חסום כשהטאב מיושן — גם בכניסה וגם בתוך חלון-ה-debounce', () => {
    const m = useAppSrc.match(/function scheduleSave\(\) \{([\s\S]*?)\n {2}\}/);
    expect(m).not.toBeNull();
    const body = m![1];
    expect(body).toContain('if (get().staleTab) {');
    expect(body).toContain('if (get().staleTab) return;');
  });

  it('גם ה-flush הסינכרוני ביציאה מגודר staleTab', () => {
    expect(useAppSrc).toContain('if (!s.staleTab) flushSaveSync(s.db);');
  });

  it('staleTab נולד false ומוגדר ב-state (הדגל זמין ל-UI לבאנר)', () => {
    expect(useAppSrc).toContain('staleTab: false,');
    expect(useApp.getState().staleTab).toBe(false);
  });
});
