/**
 * מנוע-סנכרון נדרים→מאור (כיוון-נכנס, "דו-כווני מלא דרך המפתחות") — **טהור**
 * (בלי firebase/DOM/store), נבדק ביחידה. לוקח את רשימת-התורמים והעסקאות ששוגרו
 * מנדרים + התומכים הקיימים, ומייצר **תוכנית-סנכרון** שמתאימה כל תורם/עסקה לכרטיס
 * הנכון לפי **מפתחות-שיוך** (בסדר-עדיפות): מזהה-חיצוני(ToremId) → ת"ז → טלפון →
 * אימייל → שם+עיר. אותם מפתחות בדיוק כמו מנוע-הדדופ (עקביות) ⇒ זיהוי-100%.
 *
 * עקרונות (הכרעות-בעלים):
 *  - **אפס אובדן:** כל עסקה נכנסת ל-hist[] של כרטיס כלשהו (נוצר חדש אם אין התאמה).
 *  - **קבלות-מס אצל נדרים:** העסקאות נרשמות כ-hist[] (היסטוריית-חיוב) — **לא**
 *    כתרומות/קבלות §46 (רו"ח: "נדרים" מנפיק). לכן count/ils/usd השמורים (קבלות-
 *    בלבד, אינווריאנט-הענן) אינם משתנים; הצבירה-המוצגת כוללת hist דרך supAggregates.
 *  - **אידמפוטנטי:** דדופ-חיובים לפי מספר-עסקה (txn); כרטיס-חדש במזהה דטרמיניסטי
 *    ('sup-ned-<ToremId>') ⇒ הרצה-חוזרת רק מעשירה, לא משכפלת.
 *  - **הרחבה בלבד:** כרטיסים קיימים מועשרים (מילוי-שדות-ריקים + קביעת extId) —
 *    לעולם לא נמחקים ולא נדרסים שדות מלאים.
 */
import type { Supporter } from '../types/domain';
import { normId, normPhone } from './dedup';
import { nameSortKey, normSearch } from './validate';

/** רשומת-תורם מנדרים (staged) — קלט-סנכרון (תת-קבוצה מבנית של NedarimDonor). */
export interface SyncDonor {
  toremId: string;
  zeout?: string;
  name: string;
  address?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  email?: string;
  notes?: string;
}

/** עסקה מנדרים (staged incomingPayments) — קלט-סנכרון (תת-קבוצה מבנית). */
export interface SyncCharge {
  id?: string; // מזהה-מסמך incomingPayments — לסימון handled רק למה שחובר
  amount: number;
  currency?: string;
  name?: string;
  phone?: string;
  email?: string;
  zeout?: string;
  toremId?: string;
  txnId?: string;
  reference?: string;
  d?: string;
  at?: string;
  receipt?: string;
  last4?: string;
  category?: string;
  kevaId?: string;
  kind?: string; // 'refund' (Amount<0) / 'cancel' (Amount 0) / חסר=חיוב רגיל — פאזה-מודעת-כסף
  provider?: string; // 'sola' | חסר=נדרים — קובע את תווית-הסליקה ב-hist (🐛 23.8 "זה לא נכנס במקום הנכון")
}

type HistEntry = NonNullable<Supporter['hist']>[number];

export interface SyncSummary {
  existing: number;
  donorsIn: number;
  chargesIn: number;
  newSupporters: number;
  updatedSupporters: number;
  chargesAdded: number;
  chargesDup: number; // כבר קיים ב-hist לפי txn — דילוג
  chargesNoTxn: number; // חיוב בלי מספר-עסקה (לא ניתן-דדופ) — עדיין נוסף
  chargesSkipped: number; // attachOnly: אין כרטיס-תואם ⇒ נשאר pending (לא נוצר כרטיס)
  chargesNonPositive: number; // ביטולים (Amount 0) — סומנו טופל, לא ל-hist (אין-כסף)
  refundsApplied: number; // זיכויים (Amount<0) שנרשמו כשורת-hist שלילית (מקזזת צבירה)
  recurring: number; // חיובי הו"ק שזוהו (kevaId)
  ilsAdded: number;
  usdAdded: number;
}

export interface SyncPlan {
  /** מערך-התומכים הסופי (קיימים מועשרים + חדשים) — היישום = set db.supporters. */
  supporters: Supporter[];
  summary: SyncSummary;
  newNames: string[]; // עד 40 לתצוגה-מקדימה
  updatedNames: string[]; // עד 40
  /** מזהי-העסקאות שחוברו (attached/dup) — לסימון handled. במצב attachOnly,
   *  עסקה בלי-התאמה **אינה** כאן ⇒ נשארת pending לסנכרון-הידני. */
  handledChargeIds: string[];
}

/** מפתחות-שיוך של רשומה (ext/id/ph/em/namecity) — עקבי עם מנוע-הדדופ. */
function keysOf(o: { extId?: string; idNum?: string; zeout?: string; phone?: string; phone2?: string; phone3?: string; email?: string; name?: string; city?: string }): string[] {
  const ks: string[] = [];
  const ext = (o.extId || '').trim();
  if (ext) ks.push('ext:' + ext);
  const id = normId(o.idNum || o.zeout);
  if (id) ks.push('id:' + id);
  for (const p of [o.phone, o.phone2, o.phone3]) {
    const ph = normPhone(p || '');
    if (ph.length >= 7) ks.push('ph:' + ph);
  }
  const em = (o.email || '').trim().toLowerCase();
  if (em) ks.push('em:' + em);
  const n = normSearch(o.name || '');
  const c = normSearch(o.city || '');
  if (n && c) ks.push('nc:' + n + '|' + c);
  return ks;
}

/** מטבע מנורמל מעסקה (תומך '₪'/'$' וגם קידוד-נדרים '1'/'2'). */
function curOf(charge: SyncCharge): '₪' | '$' {
  const raw = String(charge.currency || '').trim();
  return raw === '$' || raw === '2' || /usd|\$|דולר/i.test(raw) ? '$' : '₪';
}

/** תווית-הסליקה לפי ספק-העסקה. 🐛 (23.8, "זה לא נכנס במקום הנכון"): עסקאות-סולה
 *  שמוזגו נרשמו 'נדרים' — תווית שגויה בכרטיס, וגרוע מזה: "ביטול ייבוא נדרים"
 *  (wipeNedarimImport מסנן clearer==='נדרים') היה **מוחק גם אותן**. חסר-ספק ⇒
 *  'נדרים' — ביט-זהה לכל זרימות-נדרים הקיימות. */
export function providerClearer(provider?: string): string {
  return /sola/i.test(provider || '') ? 'סולה' : 'נדרים';
}

/** בניית רשומת-hist מעסקה (רק שדות לא-ריקים; d/a/c תמיד). */
export function chargeToHist(charge: SyncCharge): HistEntry {
  const h: HistEntry = {
    d: (charge.d || (charge.at || '').slice(0, 10) || '').trim(),
    a: charge.amount,
    c: curOf(charge),
    clearer: providerClearer(charge.provider),
  };
  const ref = (charge.reference || '').trim();
  const txn = (charge.txnId || '').trim();
  const rec = (charge.receipt || '').trim();
  const l4 = (charge.last4 || '').trim();
  const keva = (charge.kevaId || '').trim();
  if (ref) h.ref = ref;
  if (txn) h.txn = txn;
  if (rec) h.receipt = rec;
  if (l4) h.last4 = l4;
  if (keva) h.kevaId = keva; // חיוב חוזר — נשמר ל-hist לזיהוי-הו"ק מדויק בעתיד
  return h;
}

/** מפתח-דדופ לעסקה: txn ראשון, נפילה ל-**אסמכתא** (reference) — כך CallBack-כפול
 *  בלי TransactionId (ספק-אחר/CallBack-חלקי) לא משכפל שורת-hist. ריק ⇒ אין דדופ. */
export function chargeDedupKey(charge: SyncCharge): string {
  const txn = (charge.txnId || '').trim();
  if (txn) return 'txn:' + txn;
  const ref = (charge.reference || '').trim();
  return ref ? 'ref:' + ref : '';
}
/** מפתח-דדופ מרשומת-hist קיימת (מקביל ל-chargeDedupKey). */
function histDedupKey(h: HistEntry): string {
  const txn = (h.txn || '').trim();
  if (txn) return 'txn:' + txn;
  const ref = (h.ref || '').trim();
  return ref ? 'ref:' + ref : '';
}

/* ── מילוי-אוטומטי של משבצת-ההו"ק מחיוב-נדרים חוזר (הכרעת-בעלים 19.8:
   "שיתמלא אוטומטית מנדרים ישר למשבצת של הו"ק") — חיוב עם kevaId ⇒ הכרטיס מסומן
   כהו"ק פעיל (סכום/מטבע/יום מהחיוב). הו"ק **ידני** של המשרד (בלי kevaId) לא נדרס. */

/** יום-החיוב מתאריך-העסקה (1–28 — כך קיים בכל חודש). ברירת-מחדל 1. */
function hokDayFromDate(iso: string): number {
  const d = Number((iso || '').slice(8, 10));
  return isFinite(d) && d >= 1 ? Math.min(28, Math.floor(d)) : 1;
}

/** אם העסקה חוזרת (kevaId) — ממלא/מעדכן את משבצת-ההו"ק של הכרטיס. משמר startedAt
 *  מוקדם-ביותר; מעדכן סכום/מטבע/יום מהעסקה. הו"ק-ידני (בלי kevaId) לא נגוע. */
export function withNedarimHok(sp: Supporter, charge: SyncCharge): Supporter {
  if (!(charge.amount > 0)) return sp; // זיכוי/ביטול (Amount≤0) לא ממלא/מעדכן הו"ק
  const keva = (charge.kevaId || '').trim();
  if (!keva) return sp;
  if (sp.hok && !sp.hok.kevaId) return sp; // הו"ק ידני — לא דורסים
  const cd = (charge.d || charge.at || '').slice(0, 10);
  const prevStart = sp.hok?.startedAt || '';
  return {
    ...sp,
    hok: {
      amount: charge.amount,
      cur: curOf(charge),
      day: hokDayFromDate(cd),
      method: 'card',
      note: 'הו״ק נדרים · ' + keva,
      active: true,
      startedAt: prevStart && prevStart < cd ? prevStart : cd || prevStart || '',
      kevaId: keva,
    },
  };
}

/* ── זיהוי-רטרואקטיבי של הו"ק מהיסטוריה (הכרעת-בעלים 19.8) ──
   חיובים שכבר סונכרו לפני מנגנון-ההו"ק יושבים ב-hist בלי סימון. מזהים הו"ק
   מ**תבנית-החיובים**: תורם עם אותו סכום-נדרים בכמה חודשים שונים = הוראת-קבע.
   כשיש kevaId ב-hist (חיובים חדשים) — מדויק; אחרת — לפי סכום+מטבע חוזר. טהור. */

/** מספר-החודשים מ-dateIso עד todayIso (0=אותו חודש). */
function monthsAgo(dateIso: string, todayIso: string): number {
  const [y1, m1] = dateIso.slice(0, 7).split('-').map(Number);
  const [y2, m2] = todayIso.slice(0, 7).split('-').map(Number);
  if (!y1 || !m1 || !y2 || !m2) return 999;
  return (y2 - y1) * 12 + (m2 - m1);
}

/** הערך-השכיח במערך (mode) — ליום-החיוב הטיפוסי. */
function modeOf(nums: number[]): number {
  const c = new Map<number, number>();
  let best = nums[0] ?? 1;
  let bestN = 0;
  for (const n of nums) {
    const k = (c.get(n) ?? 0) + 1;
    c.set(n, k);
    if (k > bestN) { bestN = k; best = n; }
  }
  return best;
}

/** המחרוזת-השכיחה (mode) — לסכום|מטבע הטיפוסי של ההו"ק (עמיד לסכום משתנה). */
function modeStr(strs: string[]): string {
  const c = new Map<string, number>();
  let best = strs[0] ?? '';
  let bestN = 0;
  for (const s of strs) {
    const k = (c.get(s) ?? 0) + 1;
    c.set(s, k);
    if (k > bestN) { bestN = k; best = s; }
  }
  return best;
}

/** מזהה הוראות-קבע מתבנית-ה-hist וממלא את משבצת-ההו"ק. תורם עם אותו סכום-נדרים
 *  ב-≥`minMonths` חודשים שונים = הו"ק (day=היום-השכיח, active=חויב ב-≤2 חודשים).
 *  הו"ק **ידני** (בלי kevaId) לא נדרס. מחזיר { supporters, detected }. */
export function detectRecurringHok(supporters: Supporter[], todayIso: string, minMonths = 3): { supporters: Supporter[]; detected: number } {
  let detected = 0;
  const out = supporters.map((sp) => {
    if (sp.hok && !sp.hok.kevaId) return sp; // הו"ק ידני — לא נוגעים
    const nd = (sp.hist ?? []).filter((h) => h.clearer === 'נדרים' && h.a > 0 && !!h.d);
    if (!nd.length) return sp;
    // חיוב עם kevaId ⇒ הו"ק **ודאי** (גם חיוב-בודד). אחרת ⇒ תבנית: חיובי-נדרים
    // ב-≥minMonths חודשים **שונים** (סכום עשוי להשתנות בין שנים ⇒ לא דורשים
    // סכום-זהה; זה מה שהחמיץ ~400 תורמים ותיקים).
    const kevaCharge = nd.find((h) => h.kevaId);
    const distinctMonths = new Set(nd.map((h) => h.d.slice(0, 7)));
    if (!kevaCharge && distinctMonths.size < minMonths) return sp;
    detected++;
    // סכום/מטבע ההו"ק = השכיח (הו"ק חוזר); day = היום השכיח.
    const parts = modeStr(nd.map((h) => h.a + '|' + (h.c || '₪'))).split('|');
    const cur: '₪' | '$' = parts[1] === '$' ? '$' : '₪';
    const dates = nd.map((h) => h.d).sort();
    return {
      ...sp,
      hok: {
        amount: Number(parts[0]),
        cur,
        day: Math.min(28, Math.max(1, modeOf(nd.map((h) => Number(h.d.slice(8, 10)) || 1)))),
        method: 'card',
        note: kevaCharge ? 'הו״ק נדרים · ' + kevaCharge.kevaId : 'הו״ק נדרים (זוהה מהיסטוריה · ' + distinctMonths.size + ' חודשים)',
        active: monthsAgo(dates[dates.length - 1], todayIso) <= 2,
        startedAt: dates[0],
        kevaId: kevaCharge?.kevaId || 'auto',
      },
    };
  });
  return { supporters: out, detected };
}

/* ── שיוך-ידני של תשלום-נכנס לכרטיס (בסגנון בדיקת-הכפילויות, 19.8.2026) ──
   כשהסנכרון-האוטומטי לא הצליח להתאים עסקה (שם שונה/חסר), המזכירה בוחרת ידנית
   את הכרטיס. אותם מפתחות-שיוך של המנוע — כדי להציע מועמדים חכמים. טהור. */

/** מועמדים לשיוך עסקה לכרטיס — לפי מפתח-חזק (ToremId/ת"ז/טלפון/אימייל) או שם
 *  חסין-סדר (≥2 מילים). ממוין: מפתח-חזק קודם, שם אחרון. עד `limit`. */
export function candidateSupportersForCharge(charge: SyncCharge, supporters: Supporter[], limit = 8): Supporter[] {
  const ck = new Set(keysOf({ extId: charge.toremId, zeout: charge.zeout, phone: charge.phone, email: charge.email }));
  const cName = nameSortKey(charge.name || '');
  const scored: { sp: Supporter; score: number }[] = [];
  for (const sp of supporters) {
    const sk = keysOf({ extId: sp.extId, idNum: sp.idNum, phone: sp.phone, email: sp.email });
    let score = 0;
    for (const k of sk) {
      if (!ck.has(k)) continue;
      if (k.startsWith('ext:')) score = Math.max(score, 5);
      else if (k.startsWith('id:')) score = Math.max(score, 4);
      else if (k.startsWith('ph:')) score = Math.max(score, 3);
      else if (k.startsWith('em:')) score = Math.max(score, 2);
    }
    if (!score && cName && cName.includes(' ') && nameSortKey(sp.name) === cName) score = 1;
    if (score) scored.push({ sp, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.sp);
}

/** חיבור-ידני של עסקה לכרטיס נבחר — מוסיף chargeToHist ל-hist (דדופ לפי txn).
 *  מחזיר { supporters, added }; added=false אם הכרטיס לא-נמצא או העסקה כבר קיימת. */
export function attachChargeTo(supporters: Supporter[], supId: string, charge: SyncCharge): { supporters: Supporter[]; added: boolean } {
  const idx = supporters.findIndex((s) => s.id === supId);
  if (idx < 0) return { supporters, added: false };
  const sp = supporters[idx];
  const key = chargeDedupKey(charge);
  const hist = sp.hist || [];
  if (key && hist.some((h) => histDedupKey(h) === key)) return { supporters, added: false };
  const next = supporters.slice();
  next[idx] = withNedarimHok({ ...sp, hist: [...hist, chargeToHist(charge)] }, charge);
  return { supporters: next, added: true };
}

/** ריפוי-תוויות רטרואקטיבי: רשומות-hist שמפתח-הדדופ שלהן (txn/ref) שייך לספק
 *  נתון מקבלות את התווית הנכונה. 🐛 (23.8): עסקאות-סולה שמוזגו לפני התיקון
 *  נרשמו 'נדרים' — גם תווית-מקור שגויה בכרטיס, וגם נמחקות ב"ביטול ייבוא נדרים".
 *  אידמפוטנטי; נוגע רק בשורות שבאמת ברשימת-המזהים. */
export function relabelHistByTxn(supporters: Supporter[], txns: string[], label: string): { supporters: Supporter[]; changed: number } {
  const set = new Set(txns.map((t) => t.trim()).filter(Boolean));
  if (!set.size) return { supporters, changed: 0 };
  let changed = 0;
  const out = supporters.map((sp) => {
    const hist = sp.hist;
    if (!hist?.length) return sp;
    let touched = false;
    const next = hist.map((h) => {
      const key = (h.txn || '').trim() || (h.ref || '').trim();
      if (!key || !set.has(key) || h.clearer === label) return h;
      touched = true;
      changed++;
      return { ...h, clearer: label };
    });
    return touched ? { ...sp, hist: next } : sp;
  });
  return { supporters: out, changed };
}

/** ההתאמה-החזקה-ביותר לעסקה — לפי מפתח-**ודאי** בלבד (ToremId/ת"ז/טלפון/אימייל,
 *  לא שם-בלבד) או null. משמש לשיוך-אוטומטי-בטוח באצווה: שם-בלבד דורש אישור-ידני
 *  (סיכון להתאמת-שווא), לכן אינו נכלל כאן. */
export function strongMatchForCharge(charge: SyncCharge, supporters: Supporter[]): Supporter | null {
  const ck = new Set(keysOf({ extId: charge.toremId, zeout: charge.zeout, phone: charge.phone, email: charge.email }));
  if (!ck.size) return null;
  let best: { sp: Supporter; score: number } | null = null;
  for (const sp of supporters) {
    let score = 0;
    for (const k of keysOf({ extId: sp.extId, idNum: sp.idNum, phone: sp.phone, email: sp.email })) {
      if (!ck.has(k)) continue;
      if (k.startsWith('ext:')) score = Math.max(score, 5);
      else if (k.startsWith('id:')) score = Math.max(score, 4);
      else if (k.startsWith('ph:')) score = Math.max(score, 3);
      else if (k.startsWith('em:')) score = Math.max(score, 2);
    }
    if (score && (!best || score > best.score)) best = { sp, score };
  }
  return best?.sp ?? null;
}

/** שיוך-אוטומטי **מרובה ויעיל** על כל הממתינים: בונה אינדקס-מפתחות פעם-אחת
 *  (O(S)), ואז לכל עסקה מחזיר את הכרטיס עם המפתח-החזק-ביותר התואם (O(M)). כך
 *  אפשר לרוקן ערימה של אלפי-ממתינים בבת-אחת (לא רק 300 המוצגים). שם-בלבד לא
 *  נכלל (דורש שיוך-ידני, מונע התאמת-שווא). מחזיר {supId, charge} למחוברים. */
export function autoMatchCharges(charges: SyncCharge[], supporters: Supporter[]): { supId: string; charge: SyncCharge }[] {
  const idx = new Map<string, string>(); // מפתח → supId (ראשון גובר)
  for (const sp of supporters) {
    for (const k of keysOf({ extId: sp.extId, idNum: sp.idNum, phone: sp.phone, email: sp.email })) {
      if (!idx.has(k)) idx.set(k, sp.id);
    }
  }
  const out: { supId: string; charge: SyncCharge }[] = [];
  for (const c of charges) {
    let supId: string | undefined;
    // סדר keysOf: ext → id → ph → em ⇒ הראשון-שנמצא = המפתח-החזק-ביותר.
    for (const k of keysOf({ extId: c.toremId, zeout: c.zeout, phone: c.phone, email: c.email })) {
      const hit = idx.get(k);
      if (hit) { supId = hit; break; }
    }
    if (supId) out.push({ supId, charge: c });
  }
  return out;
}

/** שיוך-אצווה: מחבר רשימת {supId, charge} בבת-אחת (setDb יחיד). דדופ-txn פר-כרטיס
 *  (כולל בתוך האצווה עצמה). מחזיר { supporters, added } — added=מספר החיובים שנוספו. */
export function attachChargesBulk(supporters: Supporter[], items: { supId: string; charge: SyncCharge }[]): { supporters: Supporter[]; added: number } {
  const byId = new Map(supporters.map((s, i) => [s.id, i]));
  const next = supporters.slice();
  const seenTxn = new Map<number, Set<string>>();
  let added = 0;
  for (const { supId, charge } of items) {
    const idx = byId.get(supId);
    if (idx == null) continue;
    let seen = seenTxn.get(idx);
    if (!seen) { seen = new Set((next[idx].hist || []).map(histDedupKey).filter(Boolean)); seenTxn.set(idx, seen); }
    const key = chargeDedupKey(charge);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    next[idx] = withNedarimHok({ ...next[idx], hist: [...(next[idx].hist || []), chargeToHist(charge)] }, charge);
    added++;
  }
  return { supporters: next, added };
}

/** כרטיס-תומך חדש מרשומת-תורם נדרים (מזהה דטרמיניסטי לאידמפוטנטיות). */
function supFromDonor(d: SyncDonor): Supporter {
  const phone = (d.phone || d.phone2 || d.phone3 || '').trim();
  const extraPhones = [d.phone2, d.phone3].map((p) => (p || '').trim()).filter((p) => p && p !== phone);
  const notes = [d.notes, extraPhones.length ? 'טל׳ נוספים: ' + extraPhones.join(', ') : '']
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' · ');
  return {
    id: 'sup-ned-' + d.toremId,
    name: d.name.trim(),
    phone,
    email: (d.email || '').trim(),
    address: (d.address || '').trim(),
    city: '',
    idNum: normId(d.zeout) ? String(d.zeout).replace(/\D/g, '') : '',
    extId: d.toremId,
    cat: '',
    forWho: '',
    notes,
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
  };
}

/** כרטיס-תומך חדש מעסקה (כשאין תורם/כרטיס תואם) — אפס-אובדן-חיוב.
 *  עסקה **חסרת-שם וחסרת-מזהה** מנותבת לכרטיס-אוסף יחיד ('sup-ned-unassigned')
 *  במקום כרטיס-לכל-עסקה (מונע ריבוי-כרטיסי-'תורם נדרים' ב-CRM). כולם אנונימיים
 *  ⇒ איגום בטוח (לא ממזג אנשים מזוהים). */
function supFromCharge(c: SyncCharge, seq: number): Supporter {
  const anon = !c.toremId && !nameSortKey(c.name || '');
  const id = c.toremId
    ? 'sup-ned-' + c.toremId
    : anon
      ? 'sup-ned-unassigned'
      : 'sup-ned-txn-' + (c.txnId || String(seq));
  return {
    id,
    name: (c.name || (anon ? 'תרומות נדרים ללא שיוך' : 'תורם נדרים')).trim(),
    phone: (c.phone || '').trim(),
    email: (c.email || '').trim(),
    address: '',
    city: '',
    idNum: normId(c.zeout) ? String(c.zeout).replace(/\D/g, '') : '',
    ...(c.toremId ? { extId: c.toremId } : {}),
    cat: (c.category || '').trim(),
    forWho: '',
    notes: '',
    count: 0,
    ils: 0,
    usd: 0,
    first: '',
    last: '',
    nextDate: '',
    donations: [],
  };
}

/**
 * מייצר תוכנית-סנכרון. טהור — לא משנה קלט (מחזיר מערך-תומכים חדש).
 * @param existing תומכים קיימים במאור
 * @param donors רשימת-התורמים מנדרים
 * @param charges העסקאות מנדרים (incomingPayments)
 * @param opts attachOnly=true (החיבור-החי): עסקה שאין-לה כרטיס-תואם **לא** יוצרת
 *   כרטיס (נשארת ל-🔄 הידני עם תצוגה-מקדימה) — מונע ריבוי כרטיסים-אוטומטיים.
 */
export function planNedarimSync(
  existing: Supporter[],
  donors: SyncDonor[],
  charges: SyncCharge[],
  opts: { attachOnly?: boolean } = {},
): SyncPlan {
  const out: Supporter[] = existing.map((s) => ({ ...s, hist: s.hist ? [...s.hist] : undefined }));
  const keyIndex = new Map<string, number>(); // key → index ב-out
  // אינדקס-שם (שם מנורמל → idx) — לקישור-עסקה-לפי-שם: היסטוריית-נדרים מגיעה בלי
  // ToremId/ת"ז/טלפון (רק ClientName), לכן זו הדרך היחידה לחבר עסקה לכרטיס-תורם.
  // ערך -1 = שם עמום (יותר מכרטיס אחד) ⇒ לא מתאימים לפיו (בטיחות מפני מיזוג-שווא).
  const nameIndex = new Map<string, number>();
  // מפתח-שם חסין-סדר (משפחה-קודם≡פרטי-קודם) + מנוקה-תארים — הליבה של זיהוי-הכפילות.
  const nkey = (s?: string) => nameSortKey(s || '');
  const registerName = (idx: number) => {
    const nk = nkey(out[idx].name);
    if (!nk) return;
    const prev = nameIndex.get(nk);
    if (prev == null) nameIndex.set(nk, idx);
    else if (prev !== idx) nameIndex.set(nk, -1); // שם משותף ל-2 כרטיסים ⇒ עמום
  };
  const register = (idx: number) => {
    for (const k of keysOf(out[idx])) if (!keyIndex.has(k)) keyIndex.set(k, idx);
    registerName(idx);
  };
  out.forEach((_, i) => register(i));
  const findIdx = (keys: string[]): number => {
    for (const k of keys) {
      const i = keyIndex.get(k);
      if (i != null) return i;
    }
    return -1;
  };
  /** קישור-לפי-שם (fallback לעסקאות בלי מפתח-חזק) — עמום/ריק ⇒ -1. */
  const findByName = (name?: string): number => {
    const i = nameIndex.get(nkey(name));
    return i != null && i >= 0 ? i : -1;
  };

  const summary: SyncSummary = {
    existing: existing.length,
    donorsIn: donors.length,
    chargesIn: charges.length,
    newSupporters: 0,
    updatedSupporters: 0,
    chargesAdded: 0,
    chargesDup: 0,
    chargesNoTxn: 0,
    chargesSkipped: 0,
    chargesNonPositive: 0,
    refundsApplied: 0,
    recurring: 0,
    ilsAdded: 0,
    usdAdded: 0,
  };
  const newNames: string[] = [];
  const updatedNames: string[] = [];

  // ── שלב 1: תורמים → כרטיסים (התאמה/העשרה/יצירה) ──
  for (const d of donors) {
    if (!d.toremId && !d.name) continue;
    let idx = findIdx(keysOf({ extId: d.toremId, zeout: d.zeout, phone: d.phone, phone2: d.phone2, phone3: d.phone3, email: d.email, name: d.name }));
    // קישור-לפי-שם: בנדרים הת"ז לרוב "000000000" (ריקה) ולחלק אין טלפון-תואם ⇒
    // בלי זה תורם-קיים "לא-נמצא" ונוצר ככפול. שם עמום (2 כרטיסים) ⇒ -1 (יצירה).
    if (idx < 0) idx = findByName(d.name);
    if (idx >= 0) {
      // העשרה — מילוי-שדות-ריקים בלבד + קביעת extId (מפתח-שיוך עתידי)
      const sp = out[idx];
      let changed = false;
      const fill = (k: 'phone' | 'email' | 'address' | 'idNum' | 'extId', v: string) => {
        if (v && !(sp[k] || '').trim()) { (sp as unknown as Record<string, string>)[k] = v; changed = true; }
      };
      fill('extId', d.toremId);
      fill('phone', (d.phone || d.phone2 || d.phone3 || '').trim());
      fill('email', (d.email || '').trim());
      fill('address', (d.address || '').trim());
      fill('idNum', normId(d.zeout) ? String(d.zeout).replace(/\D/g, '') : '');
      if (changed) {
        register(idx); // מפתחות-חדשים (טלפון/מייל/ext) ⇒ עסקאות עתידיות יתאימו
        summary.updatedSupporters++;
        if (updatedNames.length < 40) updatedNames.push(sp.name);
      }
    } else {
      const sp = supFromDonor(d);
      out.push(sp);
      register(out.length - 1);
      summary.newSupporters++;
      if (newNames.length < 40) newNames.push(sp.name);
    }
  }

  // ── שלב 2: עסקאות → hist[] של הכרטיס התואם (דדופ txn/ref; יצירה אם אין) ──
  const seenKeys = new Map<number, Set<string>>(); // idx → מפתחות-דדופ שכבר ב-hist
  const keySetFor = (idx: number): Set<string> => {
    let s = seenKeys.get(idx);
    if (!s) {
      s = new Set((out[idx].hist || []).map(histDedupKey).filter(Boolean));
      seenKeys.set(idx, s);
    }
    return s;
  };
  const handledChargeIds: string[] = [];
  let chargeSeq = 0;
  for (const c of charges) {
    chargeSeq++;
    // פאזה-מודעת-כסף: ביטול (Amount 0) — אין-כסף, מסמנים טופל בלבד (לא ל-hist).
    if (c.amount === 0) { summary.chargesNonPositive++; if (c.id) handledChargeIds.push(c.id); continue; }
    const refund = c.amount < 0; // זיכוי — יירשם כשורת-hist שלילית (מקזזת את הצבירה)
    let idx = findIdx(keysOf({ extId: c.toremId, zeout: c.zeout, phone: c.phone, email: c.email, name: c.name }));
    // קישור-לפי-שם (ClientName) — היסטוריית-נדרים בלי מפתח-חזק. **רק בסנכרון-המלא:**
    // בחיבור-החי (attachOnly) שם-בלבד עלול לזקוף לכרטיס-שגוי (שם-יחיד ≠ עמום) בלי
    // סקירה — כמו במסלול-הידני, שם-בלבד נשאר לשיוך-ידני עם תצוגה-מקדימה.
    if (idx < 0 && !opts.attachOnly) idx = findByName(c.name);
    if (idx < 0) {
      // אין כרטיס-תואם. במצב attachOnly (חיבור-חי) — **לא** יוצרים כרטיס אוטומטי
      // (מונע ריבוי-כרטיסים); העסקה נשארת pending לסנכרון-הידני עם תצוגה-מקדימה.
      if (opts.attachOnly) { summary.chargesSkipped++; continue; }
      // זיכוי בלי כרטיס-תואם — **לא** יוצרים כרטיס-שלילי; נשאר pending לשיוך-ידני.
      if (refund) { summary.chargesSkipped++; continue; }
      const sp = supFromCharge(c, chargeSeq);
      // אם כבר קיים כרטיס באותו מזהה-דטרמיניסטי (עסקה קודמת יצרה) — אתרו אותו
      const same = out.findIndex((s) => s.id === sp.id);
      if (same >= 0) idx = same;
      else {
        out.push(sp);
        idx = out.length - 1;
        register(idx);
        summary.newSupporters++;
        if (newNames.length < 40) newNames.push(sp.name);
      }
    }
    const key = chargeDedupKey(c);
    const seen = keySetFor(idx);
    if (key && seen.has(key)) { summary.chargesDup++; if (c.id) handledChargeIds.push(c.id); continue; }
    if (key) seen.add(key);
    else summary.chargesNoTxn++;
    // זיכוי (refund) = שורת-hist שלילית שמקזזת את הצבירה — **בלי** withNedarimHok
    // (לא ממלא הו"ק מזיכוי) ובלי מונה-recurring. חיוב-רגיל = כרגיל (+ מילוי-הו"ק).
    const nextHist = [...(out[idx].hist || []), chargeToHist(c)];
    out[idx] = refund ? { ...out[idx], hist: nextHist } : withNedarimHok({ ...out[idx], hist: nextHist }, c);
    if (refund) summary.refundsApplied++;
    else {
      if (c.kevaId) summary.recurring++; // נספר **רק** על חיוב-הו"ק שנוסף בפועל (לא על dup/זיכוי)
      summary.chargesAdded++;
    }
    if (c.id) handledChargeIds.push(c.id); // חובר ⇒ אפשר לסמן handled
    // c.amount שלילי בזיכוי ⇒ מקזז את הצבירה מעצם הסכימה (הכרעת "לכולל": נטו).
    if (curOf(c) === '$') summary.usdAdded += c.amount;
    else summary.ilsAdded += c.amount;
  }

  return { supporters: out, summary, newNames, updatedNames, handledChargeIds };
}
