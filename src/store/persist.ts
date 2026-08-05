/**
 * שכבת ההתמדה — חגורה + שלייקס:
 * 1. localStorage — כתיבה מיידית (debounced 500ms) של כל שינוי.
 * 2. IndexedDB — עותק שני + טבעת גיבויים יומיים (30 אחרונים).
 * 3. ייצוא/ייבוא JSON ידני + גיבוי אוטומטי בסוף יום (הורדת קובץ).
 *
 * אין שרת. הנתונים חיים אצל הלקוח — ולכן כל שכבה כאן קריטית.
 */
import { openDB, type IDBPDatabase } from 'idb';
import { isoLocal } from '../lib/date-util';
import { supporterAggregates } from '../lib/supporterAgg';
import {
  DB_VERSION,
  emptyDb,
  type CredLogEntry,
  type Db,
  type FamilyCred,
  type FamilyDoc,
} from '../types/domain';
import {
  isEncrypted,
  openDek,
  decryptDb,
  reencryptDb,
  encryptDb,
  rewrapPassword,
  genRecoveryKey,
  type EncEnvelope,
} from '../lib/crypto';

/**
 * מצב ההצפנה מוחזק בזיכרון בלבד: ה-DEK (מפתח הנתונים) והמעטפת הנוכחית.
 * נקבע רק לאחר פענוח מוצלח (unlock/enable). saveDb משתמש בהם כדי לכתוב מוצפן.
 * לעולם לא נשמר לדיסק — סגירת הדפדפן מוחקת אותו, ואז צריך שוב סיסמה.
 */
let dek: CryptoKey | null = null;
let envelope: EncEnvelope | null = null;
// שכבת הגיבוי (IndexedDB) נכשלה בשמירה האחרונה בעוד localStorage הצליח.
let idbBackupMissing = false;

/** האם השמירה הנוכחית מוצפנת (יש DEK בזיכרון). */
export function isCryptoActive(): boolean {
  return !!dek && !!envelope;
}
/** ניקוי מצב ההצפנה מהזיכרון (נעילה/התנתקות). */
export function clearCrypto(): void {
  dek = null;
  envelope = null;
}

let LS_KEY = 'maor_db';
let LS_CORRUPT_KEY = 'maor_db_corrupt';
let IDB_NAME = 'maor';
const IDB_STORE = 'db';
const IDB_SNAPSHOTS = 'snapshots';
const SNAPSHOT_KEEP = 30;

/**
 * מרחב-שמות לפי ארגון: כמה לקוחות על אותו host (?org=<slug>) לא חולקים נתונים.
 * חובה לקרוא לפני loadDb (init עושה זאת). slug 'default' שומר על המפתחות הישנים.
 */
export function setPersistNamespace(slug: string): void {
  if (!slug || slug === 'default') {
    // חזרה לתחום-השורש: איפוס למפתחות הבסיס (ביט-זהה להיום ללקוח default —
    // ה-init קורא פעם אחת; הכיוון החשוב לתיקון: מעבר-חזרה מ-slug ל-default).
    nsSlug = '';
    LS_KEY = 'maor_db';
    LS_CORRUPT_KEY = 'maor_db_corrupt';
    IDB_NAME = 'maor';
    idb = null;
    return;
  }
  nsSlug = slug;
  LS_KEY = `maor_db:${slug}`;
  LS_CORRUPT_KEY = `maor_db_corrupt:${slug}`;
  IDB_NAME = `maor:${slug}`;
  idb = null; // חיבור קודם (אם נפתח) מצביע ל-DB הלא נכון
}

let nsSlug = '';

/**
 * 🗑 ניקוי-מגירה מקומי לארגון שנמחק (5.8 — מצבת platformOrgs.deleted): מוחק
 * **רק** את מפתחות-ה-namespace של ה-slug (localStorage/sessionStorage המסתיימים
 * ב-`:slug` + מסד-ה-IndexedDB `maor:slug`). לעולם לא רץ על 'default' (השורש —
 * הלקוח הקיים) — הגנה קשיחה, גם אם ייקרא בטעות. סוגר חיבור-IDB פתוח קודם
 * (deleteDatabase נחסם על חיבור חי).
 */
export async function wipeLocalOrgData(slug: string): Promise<void> {
  if (!slug || slug === 'default') return;
  const suffix = ':' + slug;
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.endsWith(suffix)) localStorage.removeItem(k);
    }
    for (const k of Object.keys(sessionStorage)) {
      if (k.endsWith(suffix)) sessionStorage.removeItem(k);
    }
  } catch { /* אחסון חסום — ממשיכים ל-IDB */ }
  try {
    if (nsSlug === slug && idb) {
      (await idb).close();
      idb = null;
    }
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('maor:' + slug);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve(); // טאב אחר מחזיק — יימחק כשישוחרר
    });
  } catch { /* אין IndexedDB */ }
}

/**
 * מפתח localStorage/sessionStorage ממורחב-שמות — אותו כלל בדיוק כמו LS_KEY:
 * default = המפתח הישן; אחרת `${base}:${slug}`. (CONNECT חיבור 7 — הקופה
 * הרושמת; שאר מפתחות באג-3 נשארים שם, חלקם מקומיים-במכוון.)
 */
export function nsLsKey(base: string): string {
  return nsSlug ? `${base}:${nsSlug}` : base;
}

let idb: Promise<IDBPDatabase> | null = null;

function getIdb(): Promise<IDBPDatabase> {
  if (!idb) {
    idb = openDB(IDB_NAME, 1, {
      upgrade(d) {
        d.createObjectStore(IDB_STORE);
        d.createObjectStore(IDB_SNAPSHOTS);
      },
    });
  }
  return idb;
}

/** v1 שמר מסמכים כמערך שמות קבצים — ממירים לאובייקטי FamilyDoc. */
function migrateDocs(raw: unknown): FamilyDoc[] {
  if (!Array.isArray(raw)) return [];
  const out: FamilyDoc[] = [];
  raw.forEach((d, i) => {
    if (typeof d === 'string') {
      out.push({ id: 'dx' + i, name: d, addedAt: '' });
    } else if (d && typeof d === 'object') {
      const o = d as Partial<FamilyDoc>;
      out.push({ id: o.id || 'dx' + i, name: o.name ?? '', addedAt: o.addedAt ?? '' });
    }
    // ערכים אחרים (null / מספרים) — נזרקים
  });
  return out;
}

/**
 * ניקוד משפחתי: ב-v1 רשומות הלוג היו {d|date, delta, desc} — ממופות
 * ל-{date, delta, reason}. cred חסר מקבל את ברירת המחדל המקורית (700).
 */
function migrateCred(raw: unknown): FamilyCred {
  const o = (raw && typeof raw === 'object' ? raw : {}) as { score?: unknown; log?: unknown };
  const score = typeof o.score === 'number' && Number.isFinite(o.score) ? o.score : 700;
  const log: CredLogEntry[] = Array.isArray(o.log)
    ? o.log
        .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
        .map((e) => ({
          date: String(e.date ?? e.d ?? ''),
          delta: typeof e.delta === 'number' && Number.isFinite(e.delta) ? e.delta : Number(e.delta) || 0,
          reason: String(e.reason ?? e.desc ?? ''),
        }))
    : [];
  return { score, log };
}

/**
 * מיגרציה מגרסאות קודמות של הסכמה (כולל v1 של האב-טיפוס).
 * v3: נוסף שדה supporter.ayin (מעקב טיפול) — אופציונלי; תומכות קיימות
 * עוברות כמות שהן (ayin נשאר undefined עד השימוש הראשון), אין צורך בטרנספורמציה.
 */
/**
 * תכנון דדופ מספרי-קבלה דטרמיניסטי (#5.5a). כשכמה רשומות חולקות אותו rid (מרוץ
 * סנכרון בין-מכשירי), הרשומה **המוקדמת-בתאריך** שומרת על המספר המקורי (מספר נמוך
 * = הונפק מוקדם, המשמעות הסטנדרטית של מספור-קבלות רציף), והאחרות ממוספרות מחדש
 * מעל המונה הזרוע. שובר-שוויון: אינדקס נמוך. כך אותה קבלה שומרת על מספרה בכל
 * טעינה — בלי תלות בסדר-המערך, שמיזוג-הענן עלול לשנות (החשיפה שסומנה ב-ANALYSIS).
 *
 * טהור: מקבל רשומות שטוחות {rid,date}, מחזיר newRid[] (null = שומר מקורי) והמונה
 * הבא. no-op מוחלט כשאין כפילויות (הנתיב הרווח) ⇒ אפס שינוי לנתונים נקיים.
 */
export function planRidRenumber(
  entries: { rid?: string; date?: string }[],
  startSeq: number,
  prefix: string,
): { newRid: (string | null)[]; nextSeq: number } {
  const keep = new Map<string, number>();
  entries.forEach((e, i) => {
    if (!e.rid) return;
    const prev = keep.get(e.rid);
    if (prev === undefined || (e.date ?? '') < (entries[prev].date ?? '')) keep.set(e.rid, i);
  });
  let seq = startSeq;
  const newRid = entries.map((e, i) => (!e.rid || keep.get(e.rid) === i ? null : prefix + seq++));
  return { newRid, nextSeq: seq };
}

export function migrate(raw: unknown): Db | null {
  if (!raw || typeof raw !== 'object') return null;
  const db = raw as Partial<Db> & { v?: number };
  if (!db.v || db.v > DB_VERSION) return null;
  const base = emptyDb();
  const merged: Db = {
    ...base,
    ...db,
    v: DB_VERSION,
    families: Array.isArray(db.families) ? db.families : [],
    enrollments: Array.isArray(db.enrollments) ? db.enrollments : [],
    courses: Array.isArray(db.courses) ? db.courses : [],
    events: Array.isArray(db.events) ? db.events : [],
    rooms: Array.isArray(db.rooms) ? db.rooms : [],
    teachers: Array.isArray(db.teachers) ? db.teachers : [],
    supporters: Array.isArray(db.supporters) ? db.supporters : [],
    // קופות צדקה (מודול tzedaka) — תוספת אדיטיבית, DB_VERSION נשאר 5:
    // מפתח חסר בגיבוי ישן = מערך ריק מ-emptyDb
    tzCoordinators: Array.isArray(db.tzCoordinators) ? db.tzCoordinators : [],
    tzBoxes: Array.isArray(db.tzBoxes) ? db.tzBoxes : [],
    tzCampaigns: Array.isArray(db.tzCampaigns) ? db.tzCampaigns : [],
    tzEvents: Array.isArray(db.tzEvents) ? db.tzEvents : [],
    // חנות מוצרי-שירות (מודול shop) — תוספת אדיטיבית, DB_VERSION נשאר 5
    shopItems: Array.isArray(db.shopItems) ? db.shopItems : [],
    shopProducts: Array.isArray(db.shopProducts) ? db.shopProducts : [],
    shopStores: Array.isArray(db.shopStores) ? db.shopStores : [],
    shopCriteria: Array.isArray(db.shopCriteria) ? db.shopCriteria : [],
    shopAssignments: Array.isArray(db.shopAssignments) ? db.shopAssignments : [],
    shopEvents: Array.isArray(db.shopEvents) ? db.shopEvents : [],
    // SHOP6: יומן קליטות — תוספת אדיטיבית (גיבוי ישן = מערך ריק)
    shopIntakes: Array.isArray(db.shopIntakes) ? db.shopIntakes : [],
    // SHOP7: מתנדבים/ימי-חלוקה/מסירות — אדיטיבי (v5→v6; גיבוי ישן = מערך ריק)
    volunteers: Array.isArray(db.volunteers) ? db.volunteers : [],
    distributionDays: Array.isArray(db.distributionDays) ? db.distributionDays : [],
    deliveries: Array.isArray(db.deliveries) ? db.deliveries : [],
    notif: { ...base.notif, ...db.notif },
    reports: { ...base.reports, ...db.reports },
    ui: { ...base.ui, ...db.ui },
    seq: Math.max(db.seq ?? 0, base.seq),
    receiptSeq: db.receiptSeq ?? base.receiptSeq,
    donationSeq: db.donationSeq ?? base.donationSeq,
    shopReceiptSeq: db.shopReceiptSeq ?? base.shopReceiptSeq,
    // ציד-באגים 3.8.2026 (🟡): usdRate=0/null בגיבוי מושחת אִפֵּס את כל ערך-הדולר
    // של התורמים (סכום/דירוג/tier/ייצוא). מרפאים לברירת-מחדל חיובית. budget שלילי→0.
    usdRate: typeof db.usdRate === 'number' && db.usdRate > 0 ? db.usdRate : base.usdRate,
    budget: typeof db.budget === 'number' && db.budget >= 0 ? db.budget : base.budget,
    security: db.security ?? base.security,
  };
  // גרסאות ישנות מיספרו קבלות מתוך seq המשותף. מזריעים את המונים הרציפים
  // מעל המספר הגבוה ביותר שכבר הונפק, כדי שהמספור הבא יימשך רציף וללא התנגשות.
  const maxRid = (prefix: string, rids: string[]): number =>
    rids.reduce((mx, rid) => {
      const n = rid?.startsWith(prefix) ? parseInt(rid.slice(prefix.length), 10) : NaN;
      return Number.isFinite(n) && n >= mx ? n + 1 : mx;
    }, 0);
  const rNext = maxRid(
    'R-',
    merged.enrollments.flatMap((e) => (Array.isArray(e.payments) ? e.payments.map((p) => p.rid) : [])),
  );
  const dNext = maxRid(
    'D-',
    merged.supporters.flatMap((s) => (Array.isArray(s.donations) ? s.donations.map((d) => d.rid) : [])),
  );
  // אישורי S- של החנות — אותו דפוס זריעה (רציפות גם בגיבוי שקדם למונה)
  const sNext = maxRid(
    'S-',
    merged.shopAssignments.flatMap((a) =>
      Array.isArray(a.redemptions) ? a.redemptions.map((r) => r.rid ?? '') : [],
    ),
  );
  if (rNext > merged.receiptSeq) merged.receiptSeq = rNext;
  if (dNext > merged.donationSeq) merged.donationSeq = dNext;
  if (sNext > merged.shopReceiptSeq) merged.shopReceiptSeq = sNext;
  // הגנה על ייחודיות מספרי-קבלה בנתונים: מרוץ בין-מכשירי (אותו receiptSeq נקרא
  // בשני מכשירים) עלול להנפיק rid זהה לשתי קבלות. פס זה רץ בכל טעינה ובכל משיכה
  // מהענן (pullAll→migrate). #5.5a: הדדופ דטרמיניסטי — הקבלה המוקדמת-בתאריך שומרת
  // על מספרה (planRidRenumber), בלי תלות בסדר-המערך, כדי שמספר שכבר נמסר לתורם לא
  // יזוז בכל טעינה. הקבלה עצמה נוצרת on-demand מ-p.rid, כך שהמספר מתוקן.
  // מנרמלים גם את שדות-הרשימה הפנימיים ל-[] כשהם חסרים (לא רק כשהם כבר מערך) —
  // מסמך שהגיע מהענן/גיבוי ללא payments/absences/donations היה משאיר undefined,
  // וקוד ש-.map/.filter עליהם (paidOf, sessionsOf, דוחות) היה קורס.
  merged.enrollments = merged.enrollments.map((e) => ({
    ...e,
    payments: Array.isArray(e.payments) ? e.payments : [],
    absences: Array.isArray(e.absences) ? e.absences : [],
  }));
  const payCoords = merged.enrollments.flatMap((e, ei) => e.payments.map((p, pi) => ({ ei, pi, rid: p.rid, date: p.date })));
  const rPlan = planRidRenumber(payCoords, merged.receiptSeq, 'R-');
  payCoords.forEach((c, k) => {
    if (rPlan.newRid[k]) merged.enrollments[c.ei].payments[c.pi] = { ...merged.enrollments[c.ei].payments[c.pi], rid: rPlan.newRid[k]! };
  });
  merged.receiptSeq = rPlan.nextSeq;
  merged.supporters = merged.supporters.map((s) => ({
    ...s,
    donations: Array.isArray(s.donations) ? s.donations : [],
    // hist מהקובץ ההיסטורי (לגאסי {d,a,c}) — נרמול: לא-מערך → undefined;
    // איברים בלי תאריך d או סכום a מספרי — נזרקים. מטבע לא-מוכר → ברירת ₪ בתצוגה.
    hist: Array.isArray(s.hist)
      ? s.hist
          .filter((h): h is { d: string; a: number; c?: '₪' | '$' } =>
            !!h && typeof h === 'object' && !!(h as { d?: unknown }).d &&
            typeof (h as { a?: unknown }).a === 'number' && Number.isFinite((h as { a?: unknown }).a as number))
          .map((h) => ({ d: h.d, a: h.a, ...(h.c === '$' || h.c === '₪' ? { c: h.c } : {}) }))
      : undefined,
  }));
  const donCoords = merged.supporters.flatMap((s, si) => s.donations.map((d, di) => ({ si, di, rid: d.rid, date: d.date })));
  const dPlan = planRidRenumber(donCoords, merged.donationSeq, 'D-');
  donCoords.forEach((c, k) => {
    if (dPlan.newRid[k]) merged.supporters[c.si].donations[c.di] = { ...merged.supporters[c.si].donations[c.di], rid: dPlan.newRid[k]! };
  });
  merged.donationSeq = dPlan.nextSeq;
  // ריפוי-עצמי של מצבורי-התומכת (#14, הכרעת בעלים "כל מה שיעלה בקובץ"): count/ils/
  // usd נגזרים מ-donations+hist, כך שהכרטיס/הבית/הדוחות תואמים תמיד. first/last —
  // המחושב, ובהיעדר תאריכים נשמר הסימון הישן (fallback ל-supDonEvents לא נשבר).
  merged.supporters = merged.supporters.map((s) => {
    const agg = supporterAggregates(s);
    return { ...s, count: agg.count, ils: agg.ils, usd: agg.usd, first: agg.first || s.first, last: agg.last || s.last };
  });
  // קופות צדקה — ריפוי פר-רשומה (מודול מבודד, אותה רוח כמו שאר הריפויים):
  // רכז: score לא-מספרי → 0, scoreLog לא-מערך → []; קופה: collections
  // לא-מערך → [], סטטוס זר → 'office'
  merged.tzCoordinators = merged.tzCoordinators.map((c) => ({
    ...c,
    score: typeof c.score === 'number' && Number.isFinite(c.score) ? c.score : 0,
    scoreLog: Array.isArray(c.scoreLog) ? c.scoreLog : [],
  }));
  const TZ_STATUSES = ['home', 'office', 'lost', 'retired'];
  merged.tzBoxes = merged.tzBoxes.map((b) => ({
    ...b,
    collections: Array.isArray(b.collections) ? b.collections : [],
    status: TZ_STATUSES.includes(b.status) ? b.status : 'office',
  }));
  // חנות — ריפוי פר-רשומה: components/redemptions/criterionIds → [], סטטוס
  // זר → 'active', discountPct נצמד ל-0–100 (לא-סופי → 0)
  merged.shopProducts = merged.shopProducts.map((p) => ({
    ...p,
    components: (Array.isArray(p.components) ? p.components : []).map((c) => {
      let out = c;
      // מלאי: לא-סופי → מוסר (בלי מעקב); שלילי → 0 (אזל)
      if (out.stock !== undefined) {
        if (typeof out.stock !== 'number' || !Number.isFinite(out.stock)) {
          const { stock: _dropStock, ...rest } = out;
          out = rest;
        } else if (out.stock < 0) out = { ...out, stock: 0 };
      }
      // ימי תוקף קופון: לא-סופי → מוסר (ללא תוקף); שלילי → 0
      if (out.validDays !== undefined) {
        if (typeof out.validDays !== 'number' || !Number.isFinite(out.validDays)) {
          const { validDays: _dropDays, ...rest } = out;
          out = rest;
        } else if (out.validDays < 0) out = { ...out, validDays: 0 };
      }
      return out;
    }),
  }));
  // פריטי קטלוג — ריפוי: holidays לא-מערך → מוסר (= כל החגים);
  // waits לא-מערך → מוסר (= אין ממתינים; SHOP6 חנות 27)
  merged.shopItems = merged.shopItems.map((i) => {
    let out = i;
    if (out.holidays !== undefined && !Array.isArray(out.holidays)) {
      const { holidays: _dropHol, ...rest } = out;
      out = rest;
    }
    if (out.waits !== undefined && !Array.isArray(out.waits)) {
      const { waits: _dropWaits, ...rest } = out;
      out = rest;
    }
    return out;
  });
  // SHOP4 (הכרעה 18): רכיבים→פריטים — כל רכיב בלי itemId מוליד ShopItem
  // מנתוניו; המלאי/התוקף עוברים לפריט (מקור-אמת יחיד) והרכיב הופך מצביע
  // בלי דריסות. דטרמיניסטי וחד-פעמי: רכיב עם itemId לא נוגעים —
  // כפל-ריצה לא יוצר פריטים כפולים. המימושים ממשיכים להיספר (componentId
  // לא משתנה), כך שהמלאי הנותר נשמר בדיוק.
  merged.shopProducts = merged.shopProducts.map((p) => {
    if (!p.components.some((c) => !c.itemId)) return p;
    return {
      ...p,
      components: p.components.map((c) => {
        if (c.itemId) return c;
        const itemId = 'shi' + merged.seq++;
        merged.shopItems = [
          ...merged.shopItems,
          {
            id: itemId,
            name: c.label || 'פריט',
            kind: c.kind,
            storeId: c.storeId || '',
            value: typeof c.value === 'number' && Number.isFinite(c.value) ? c.value : 0,
            basePrice: typeof c.basePrice === 'number' && Number.isFinite(c.basePrice) ? c.basePrice : 0,
            ...(c.stock !== undefined ? { stock: c.stock } : {}),
            ...(c.validDays !== undefined ? { validDays: c.validDays } : {}),
            active: true,
            notes: '',
          },
        ];
        const { stock: _mvStock, validDays: _mvDays, value: _mvVal, basePrice: _mvBase, ...rest } = c;
        return { ...rest, itemId };
      }),
    };
  });
  const SHOP_STATUSES = ['active', 'done', 'stopped'];
  // נרמול-רשומה בלבד (חותמת-ביטול מושחתת → מוסרת; המימוש חוזר להיחשב חי).
  merged.shopAssignments = merged.shopAssignments.map((a) => ({
    ...a,
    redemptions: Array.isArray(a.redemptions)
      ? a.redemptions.map((r) => {
          if (r.voidedAt !== undefined && typeof r.voidedAt !== 'string') {
            const { voidedAt: _dropVoid, ...rest } = r;
            return rest;
          }
          return r;
        })
      : [],
    criterionIds: Array.isArray(a.criterionIds) ? a.criterionIds : [],
    status: SHOP_STATUSES.includes(a.status) ? a.status : 'active',
  }));
  // ציד-באגים 3.8.2026 (🟡): ייחודיות S- דטרמיניסטית — אותו planRidRenumber כמו R-/D-
  // (המימוש המוקדם-בתאריך שומר על מספרו, בלי תלות בסדר-המערך שהענן עלול לשנות),
  // במקום seenS תלוי-הסדר. אישור S- שכבר נמסר למשפחה לא מחליף מספר בין טעינות.
  const sCoords = merged.shopAssignments.flatMap((a, ai) =>
    a.redemptions.map((r, ri) => ({ ai, ri, rid: r.rid, date: r.date })),
  );
  const sPlan = planRidRenumber(sCoords, merged.shopReceiptSeq, 'S-');
  sCoords.forEach((c, k) => {
    if (sPlan.newRid[k])
      merged.shopAssignments[c.ai].redemptions[c.ri] = {
        ...merged.shopAssignments[c.ai].redemptions[c.ri],
        rid: sPlan.newRid[k]!,
      };
  });
  merged.shopReceiptSeq = sPlan.nextSeq;
  merged.shopCriteria = merged.shopCriteria.map((c) => ({
    ...c,
    discountPct:
      typeof c.discountPct === 'number' && Number.isFinite(c.discountPct)
        ? Math.min(100, Math.max(0, c.discountPct))
        : 0,
  }));
  // היגיינה: מזהים חסרים, כפילויות, מערכים חסרים בתוך משפחות
  const seen = new Set<string>();
  // מזהי בני-משפחה חייבים להיות ייחודיים גלובלית: deleteMember מסנן שיבוצים
  // לפי memberId על פני כל ה-DB, ולכן id כפול בין שתי משפחות (מיובא/ממוזג)
  // היה גורם למחיקת בן-משפחה באחת למחוק בטעות את שיבוצי השנייה. משכפלים →
  // מזהה חדש ייחודי (השיבוצים הדו-משמעיים נשארים על ההופעה הראשונה).
  const seenMember = new Set<string>();
  // סורקים מראש את כל מזהי בני-המשפחה הגולמיים. 'mx'N נשמרים ל-DB וחוזרים
  // למיגרציה, ו-mSeq מתאפס בכל ריצה — לכן מזהה מחודש עלול להיווצר כ-'mx'N
  // שכבר שייך לבן-משפחה אמיתי שטרם בוקר ב-map. שער כפול: seenMember (מזהים
  // שכבר הוקצו בריצה) + allMemberIds (מזהים אמיתיים שטרם בוקרו) — מזהה חדש
  // חייב להימנע משניהם, אחרת נשחית מזהה אמיתי ונייתם את שיבוציו.
  const allMemberIds = new Set<string>();
  for (const f of merged.families) {
    if (!f) continue;
    for (const m of Array.isArray(f.members) ? f.members : []) {
      if (m?.id) allMemberIds.add(m.id);
    }
  }
  let mSeq = 0;
  const freshMemberId = (): string => {
    let id: string;
    do {
      id = 'mx' + mSeq++;
    } while (seenMember.has(id) || allMemberIds.has(id));
    return id;
  };
  merged.families = merged.families
    .filter(Boolean)
    .map((f, i) => {
      const members = (Array.isArray(f.members) ? f.members : []).map((m, j) => {
        let id = m?.id || 'fm' + i + '_' + j;
        // מזהה אמיתי: id===m.id, וכל האמיתיים כבר ב-allMemberIds — לכן פוסחים על
        // הבדיקה מולו. מזהה מסונתז ('fm'…): m?.id שקרי → נבדק גם מול allMemberIds
        // כדי שלא יתנגש במזהה אמיתי שטרם בוקר.
        if (seenMember.has(id) || (allMemberIds.has(id) && id !== m?.id)) id = freshMemberId();
        seenMember.add(id);
        return { ...m, id };
      });
      return {
        ...f,
        id: f.id || 'fx' + i,
        members,
        docs: migrateDocs(f.docs),
        cred: migrateCred(f.cred),
      };
    })
    .filter((f) => !seen.has(f.id) && !!seen.add(f.id));
  // שדות ארגון מגיבוי לגאסי (v:1 שומר orgName/orgSite/orgDonate ברמת השורש) —
  // ערך לא-מחרוזתי (undefined מפורש וכד') נופל לברירת המחדל ולא מזהם את ה-Db.
  if (typeof merged.orgName !== 'string') merged.orgName = base.orgName;
  if (typeof merged.orgSite !== 'string') merged.orgSite = base.orgSite;
  if (typeof merged.orgDonate !== 'string') merged.orgDonate = base.orgDonate;
  // זריעת seq מעל כל המזהים המספריים בנתונים: הלגאסי מנפיק id בצורת prefix+seq
  // ('spi'/'fr'/'mi'/'ev'…, legacy-main-script.js:990 ועוד), ו-nextId שלנו מנפיק
  // prefix+seq באותה צורה — seq נמוך מהסיומת הגבוהה ביותר היה מנפיק id שכבר
  // תפוס (למשל 'ev'N) ודורס ישות קיימת. parseInt על 'spi42' לא תופס — סורקים
  // סיומת ספרתית בכל מזהי הישויות, כולל בני-משפחה ותומכות.
  let maxIdNum = -1;
  const scanId = (id: unknown): void => {
    const m = typeof id === 'string' ? id.match(/^[A-Za-z_]+(\d+)$/) : null;
    if (m && +m[1] > maxIdNum) maxIdNum = +m[1];
  };
  for (const f of merged.families) {
    scanId(f.id);
    for (const m of f.members) scanId(m.id);
  }
  for (const arr of [merged.enrollments, merged.courses, merged.events, merged.rooms, merged.teachers, merged.supporters] as { id?: unknown }[][]) {
    for (const x of arr) scanId(x?.id);
  }
  if (maxIdNum >= merged.seq) merged.seq = maxIdNum + 1;
  return merged;
}

export interface LoadResult {
  db: Db;
  corrupt: boolean;
  /** השמירה מוצפנת — נדרש קוד לפני שאפשר לפענח (db יהיה ריק עד decryptAndLoad). */
  encrypted?: boolean;
}

/** קורא את הערך הגולמי (מפוענח-JSON) מ-localStorage ואז מ-IndexedDB. */
async function readRaw(): Promise<unknown> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* חסום או JSON פגום — ננסה IndexedDB */
  }
  try {
    return await (await getIdb()).get(IDB_STORE, 'current');
  } catch {
    return null;
  }
}

/** מפתח ה-DB בתחום הנוכחי — לזיהוי אירוע storage הרלוונטי (שער ריבוי-הטאבים #3). */
export function currentDbKey(): string {
  return LS_KEY;
}

/**
 * קריאה סינכרונית של ה-DB המאוחסן הגלוי — לשער ריבוי-הטאבים (#3): טאב שראה
 * שטאב אחר כתב DB חדש יותר מאמץ אותו במקום לדרוס אותו בשמירה הבאה. מוצפן ⇒ null
 * (שער-ההצפנה ב-saveDb כבר מונע דריסת-מעטפת בטקסט גלוי; לא נוגעים כאן). null גם
 * בהיעדר/פגום.
 */
export function readStoredPlainDb(raw?: string | null): Db | null {
  try {
    const s = raw !== undefined ? raw : localStorage.getItem(LS_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    if (isEncrypted(parsed)) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

/** טעינה: localStorage תחילה, נפילה ל-IndexedDB, ואז DB ריק. מזהה מעטפת מוצפנת. */
export async function loadDb(): Promise<LoadResult> {
  const raw = await readRaw();
  if (isEncrypted(raw)) {
    // מוצפן — לא מפענחים כאן (אין קוד). מחזירים דגל; App יבקש קוד.
    envelope = raw;
    return { db: emptyDb(), corrupt: false, encrypted: true };
  }
  const parsed = migrate(raw);
  if (parsed) return { db: parsed, corrupt: false };
  // ה-LS החזיר ערך תקין-JSON אך ש-migrate דחה (למשל '[]', ‏42, אובייקט ללא v,
  // או v גבוה מדי) → לפני שמכריזים פגום, מתייעצים עם העותק השני ב-IndexedDB.
  let idbRaw: unknown = null;
  try {
    idbRaw = await (await getIdb()).get(IDB_STORE, 'current');
  } catch {
    /* IDB חסום */
  }
  if (idbRaw && idbRaw !== raw) {
    if (isEncrypted(idbRaw)) {
      envelope = idbRaw as EncEnvelope;
      return { db: emptyDb(), corrupt: false, encrypted: true };
    }
    const idbParsed = migrate(idbRaw);
    if (idbParsed) return { db: idbParsed, corrupt: false };
  }
  // לא-null אך לא תקין → פגום; שומרים עותק אם אפשר
  if (raw) {
    try {
      localStorage.setItem(LS_CORRUPT_KEY, JSON.stringify(raw));
    } catch {
      /* אין מקום */
    }
    return { db: emptyDb(), corrupt: true };
  }
  return { db: emptyDb(), corrupt: false };
}

/**
 * פענוח השמירה המוצפנת בעזרת קוד (סיסמה) או מפתח שחזור.
 * מצליח → קובע DEK+מעטפת בזיכרון ומחזיר את ה-Db. נכשל → null (קוד שגוי).
 */
export async function decryptAndLoad(secret: string, via: 'pass' | 'rec'): Promise<Db | null> {
  if (!envelope) return null;
  const key = await openDek(envelope, secret, via);
  if (!key) return null;
  try {
    const json = await decryptDb(envelope, key);
    const parsed = migrate(JSON.parse(json));
    if (!parsed) return null;
    dek = key;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * ניקוי טבעת הצילומים היומיים. dailySnapshot כותב עותקי DB מלאים, ובמעבר בין
 * גלוי למוצפן (או להפך) נשארים בטבעת צילומים בעלי סיווג-הצפנה מעורב: הפעלת
 * הצפנה הייתה מותירה עד 30 צילומים גלויים קריאים ב-IndexedDB (משפחות, תורמים,
 * טלפונים), וכיבוי הצפנה מותיר צילומים מוצפנים שאין להם עוד DEK לפענוח.
 * צילומים אינם גיבוי אמיתי (ראה BackupSection) — מוחקים את כולם, כך שאין עותק
 * בסיווג הישן ששורד את החלפת מצב ההצפנה. עוטפים ב-try/catch: לא קריטי.
 */
async function purgeSnapshots(): Promise<void> {
  try {
    const d = await getIdb();
    for (const key of await d.getAllKeys(IDB_SNAPSHOTS)) {
      await d.delete(IDB_SNAPSHOTS, key);
    }
  } catch {
    /* לא קריטי — יש עוד שכבות */
  }
}

/** הפעלת הצפנה על DB קיים — מייצר מעטפת + מפתח שחזור, כותב, ומחזיר את המפתח. */
export async function beginEncryption(db: Db, password: string): Promise<string> {
  const recoveryKey = genRecoveryKey();
  const env = await encryptDb(JSON.stringify({ ...db, savedAt: new Date().toISOString() }), password, recoveryKey);
  const key = await openDek(env, password, 'pass');
  if (!key) throw new Error('כשל בהפעלת ההצפנה');
  dek = key;
  envelope = env;
  await writeEnvelope(env);
  // צילומים גלויים ישנים בטבעת ינגחו את ההצפנה — מנקים אותם.
  await purgeSnapshots();
  return recoveryKey;
}

/** כיבוי הצפנה — כותב את ה-DB כטקסט גלוי ומנקה את מצב ההצפנה. */
export async function stopEncryption(db: Db): Promise<void> {
  dek = null;
  envelope = null;
  // כיבוי מכוון — עוקפים את שער ה-multi-tab של saveDb (שאחרת היה מסרב לדרוס
  // את המעטפת המוצפנת בטקסט גלוי) כדי שהכיבוי אכן ייכתב.
  await saveDb(db, { plaintext: true }); // נכתב גלוי (אין DEK)
  try {
    // ודא שהעותק המוצפן הישן לא נשאר ב-IndexedDB
    await (await getIdb()).put(IDB_STORE, { ...db, savedAt: new Date().toISOString() }, 'current');
  } catch {
    /* לא קריטי */
  }
  // צילומים מוצפנים ישנים כבר לא ניתנים לפענוח (אין DEK) — מנקים לשם סימטריה.
  await purgeSnapshots();
}

/** החלפת סיסמה — מאמת ישן, עוטף מחדש את ה-DEK בסיסמה חדשה. false = ישן שגוי. */
export async function changeEncryptionPassword(oldPw: string, newPw: string): Promise<boolean> {
  if (!envelope || !dek) return false;
  const check = await openDek(envelope, oldPw, 'pass');
  if (!check) return false;
  envelope = await rewrapPassword(envelope, dek, newPw);
  await writeEnvelope(envelope);
  return true;
}

/** כתיבת מעטפת מוצפנת לשתי השכבות. */
async function writeEnvelope(env: EncEnvelope): Promise<void> {
  const json = JSON.stringify(env);
  let lsOk = false;
  try {
    localStorage.setItem(LS_KEY, json);
    lsOk = true;
  } catch {
    /* מכסה מלאה */
  }
  try {
    await (await getIdb()).put(IDB_STORE, env, 'current');
    // LS נכשל אך IDB הצליח → מוחקים את העותק הישן ב-LS כדי ש-readRaw ייפול
    // לעותק הטרי ב-IndexedDB במקום להחזיר snapshot מיושן וקריא.
    if (!lsOk) {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* חסום — אין מה לעשות */
      }
    }
  } catch {
    /* IndexedDB נכשל */
  }
}

/**
 * שמירה לשתי השכבות. מחזיר false אם שתיהן נכשלו. מצפין אם ההצפנה פעילה.
 * opts.plaintext=true = כתיבה גלויה מכוונת (stopEncryption) שעוקפת את שער
 * ה-multi-tab למטה.
 */
export async function saveDb(db: Db, opts?: { plaintext?: boolean }): Promise<boolean> {
  const doc: Db = { ...db, savedAt: new Date().toISOString() };
  const json = JSON.stringify(doc);
  // ⚠️ רב-טאבי: מצב ההצפנה (dek/envelope) הוא ברמת-מודול ולכן פרטי לכל טאב,
  // בלי סנכרון בין טאבים. לפני שדורסים את הערך המאוחסן, קוראים אותו מחדש:
  //  • טאב גלוי (dek==null) שרואה מעטפת מוצפנת = טאב אחר הפעיל הצפנה → אסור
  //    לדרוס אותה בטקסט גלוי (היה מדליף משפחות/טלפונים/תורמים בגלוי).
  //  • טאב מוצפן שהמעטפת בזיכרונו התיישנה (טאב אחר החליף סיסמה) → מאמצים את
  //    עטיפת-הסיסמה הטרייה מהמאוחסן, אחרת reencryptDb היה משחזר את הסיסמה הישנה.
  if (!opts?.plaintext) {
    const stored = await readRaw();
    if (dek && envelope) {
      if (isEncrypted(stored)) {
        // wrapRec/saltRec זהים ⇒ אותו DEK (רק החלפת סיסמה) → מאמצים את עטיפת
        // הסיסמה הטרייה. שונים ⇒ הצפנה הופעלה מחדש עם DEK אחר בטאב אחר; ה-DEK
        // שבידינו מיושן וכתיבה תשחית — נמנעים מדריסה.
        if (stored.wrapRec === envelope.wrapRec && stored.saltRec === envelope.saltRec) {
          envelope = { ...envelope, saltPass: stored.saltPass, wrapPass: stored.wrapPass, iter: stored.iter };
        } else {
          return false;
        }
      }
      // stored גלוי/חסר → המעטפת שבזיכרון מוסמכת (למשל מיד אחרי beginEncryption)
    } else if (isEncrypted(stored)) {
      return false; // טאב גלוי מול מעטפת מוצפנת של טאב אחר — לא דורסים
    }
  }
  // הצפנה פעילה → כותבים מעטפת מוצפנת (אותו DEK, data מעודכן)
  const payload: string = dek && envelope ? JSON.stringify((envelope = await reencryptDb(envelope, dek, json))) : json;
  const idbValue: unknown = dek && envelope ? envelope : doc;
  let ok = false;
  let lsOk = false;
  let idbOk = false;
  try {
    localStorage.setItem(LS_KEY, payload);
    ok = true;
    lsOk = true;
  } catch {
    /* מכסה מלאה / מצב פרטי */
  }
  try {
    await (await getIdb()).put(IDB_STORE, idbValue, 'current');
    ok = true;
    idbOk = true;
    // LS נכשל (מכסה מלאה) אך IDB הצליח → מוחקים את העותק הישן ב-LS. אחרת
    // readRaw היה מחזיר את ה-snapshot הקריא שקדם למכסה, וכל עריכה שנשמרה
    // רק ל-IndexedDB לאחר מכן הייתה נעלמת בטעינה הבאה (איבוד נתונים שקט).
    if (!lsOk) {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* חסום — אין מה לעשות */
      }
    }
  } catch {
    /* IndexedDB נכשל */
  }
  // מעקב שכבת-הגיבוי: LS נכתב אך IDB נכשל = אין עותק שני (Safari פרטי / IDB חסום).
  if (lsOk && !idbOk) idbBackupMissing = true;
  else if (idbOk) idbBackupMissing = false;
  return ok;
}

/** האם שכבת הגיבוי (IndexedDB) חסרה בשמירה האחרונה — לאזהרה חד-פעמית ב-UI. */
export function isIdbBackupMissing(): boolean {
  return idbBackupMissing;
}

/**
 * שמירה סינכרונית ומיטבית ביציאה (pagehide/visibility hidden), לפני ש-debounce
 * של scheduleSave הספיק לירות. גלוי בלבד — הצפנה אינה אפשרית סינכרונית, ואז
 * נופלים ל-saveDb האסינכרוני (best-effort). כמו saveDb, לא דורסים מעטפת מוצפנת
 * של טאב אחר בטקסט גלוי.
 */
export function flushSaveSync(db: Db): void {
  if (isCryptoActive()) {
    void saveDb(db);
    return;
  }
  try {
    const cur = localStorage.getItem(LS_KEY);
    if (cur && isEncrypted(JSON.parse(cur))) return; // טאב אחר הצפין — לא לדרוס גלוי
  } catch {
    /* JSON פגום — ממשיכים לכתיבה */
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...db, savedAt: new Date().toISOString() }));
  } catch {
    /* מכסה מלאה */
  }
}

/** צילום יומי ל-IndexedDB — טבעת של SNAPSHOT_KEEP ימים. מוצפן אם ההצפנה פעילה. */
export async function dailySnapshot(db: Db): Promise<void> {
  try {
    const d = await getIdb();
    const key = isoLocal(new Date());
    const doc = { ...db, savedAt: new Date().toISOString() };
    // הצפנה פעילה → הצילום נשמר מוצפן, אחרת נדלוף נתונים גלויים ב-IndexedDB
    const value: unknown = dek && envelope ? await reencryptDb(envelope, dek, JSON.stringify(doc)) : doc;
    await d.put(IDB_SNAPSHOTS, value, key);
    const keys = (await d.getAllKeys(IDB_SNAPSHOTS)).sort();
    while (keys.length > SNAPSHOT_KEEP) {
      await d.delete(IDB_SNAPSHOTS, keys.shift()!);
    }
  } catch {
    /* לא קריטי — יש עוד שכבות */
  }
}

export async function listSnapshots(): Promise<string[]> {
  try {
    const d = await getIdb();
    return (await d.getAllKeys(IDB_SNAPSHOTS)).map(String).sort().reverse();
  } catch {
    return [];
  }
}

export async function loadSnapshot(key: string): Promise<Db | null> {
  try {
    const raw = await (await getIdb()).get(IDB_SNAPSHOTS, key);
    // צילום מוצפן — מפענחים עם ה-DEK הפעיל (המשתמש כבר מחובר)
    if (isEncrypted(raw)) {
      if (!dek) return null;
      return migrate(JSON.parse(await decryptDb(raw, dek)));
    }
    return migrate(raw);
  } catch {
    return null;
  }
}

/** ייצוא קובץ גיבוי JSON (הורדה בדפדפן). מוצפן אם ההצפנה פעילה. */
export async function exportBackupFile(db: Db): Promise<void> {
  const doc = { ...db, savedAt: new Date().toISOString() };
  // הצפנה פעילה → הגיבוי יורד מוצפן (שחזור ידרוש סיסמה/מפתח שחזור)
  const content =
    dek && envelope
      ? JSON.stringify((envelope = await reencryptDb(envelope, dek, JSON.stringify(doc))), null, 1)
      : JSON.stringify(doc, null, 1);
  const blob = new Blob([content], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const enc = dek ? '-encrypted' : '';
  a.download = `maor-backup${enc}-${isoLocal(new Date())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** האם טקסט הגיבוי הוא מעטפת מוצפנת (שחזורו דורש סיסמה/מפתח שחזור). */
export function isEncryptedBackup(text: string): boolean {
  try {
    return isEncrypted(JSON.parse(text));
  } catch {
    return false;
  }
}

/** ייבוא קובץ גיבוי גלוי — מחזיר DB תקין או זורק שגיאה בעברית. */
export function parseBackupFile(text: string): Db {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('הקובץ אינו JSON תקין');
  }
  if (isEncrypted(raw)) {
    throw new Error('זהו קובץ גיבוי מוצפן — יש לשחזר אותו דרך "שחזור גיבוי מוצפן" עם הסיסמה או מפתח השחזור');
  }
  const db = migrate(raw);
  if (!db) throw new Error('הקובץ אינו קובץ גיבוי של מאור החסד (או גרסה חדשה מדי)');
  return db;
}

/**
 * ייבוא קובץ גיבוי מוצפן עם סיסמה/מפתח שחזור.
 * null = הסוד שגוי (openDek נכשל) → המסך יציע לנסות מפתח שחזור.
 * זריקה = הסוד נכון אך התוכן המפוענח פגום או מגרסה חדשה מדי → אין טעם לנסות
 * מפתח שחזור; המסך מציג את הודעת השגיאה כפי שהיא (במקום "סיסמה שגויה").
 */
export async function decryptBackupFile(text: string, secret: string, via: 'pass' | 'rec'): Promise<Db | null> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isEncrypted(raw)) return null;
  const key = await openDek(raw, secret, via);
  if (!key) return null; // סוד שגוי — הבחנה שנשמרת עבור זרימת ה-fallback במסך
  // מכאן הסוד נכון: כישלון פענוח/JSON/מיגרציה = קובץ פגום/חדש מדי, לא סוד שגוי.
  let json: string;
  try {
    json = await decryptDb(raw, key);
  } catch {
    throw new Error('הקובץ המוצפן פוענח אך תוכנו פגום — לא ניתן לשחזר ממנו');
  }
  let parsed: Db | null;
  try {
    parsed = migrate(JSON.parse(json));
  } catch {
    throw new Error('הקובץ המוצפן פוענח אך תוכנו פגום — לא ניתן לשחזר ממנו');
  }
  if (!parsed) throw new Error('הקובץ אינו קובץ גיבוי של מאור החסד (או גרסה חדשה מדי)');
  return parsed;
}
