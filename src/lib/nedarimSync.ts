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

/** בניית רשומת-hist מעסקה (רק שדות לא-ריקים; d/a/c תמיד). */
export function chargeToHist(charge: SyncCharge): HistEntry {
  const h: HistEntry = {
    d: (charge.d || (charge.at || '').slice(0, 10) || '').trim(),
    a: charge.amount,
    c: curOf(charge),
    clearer: 'נדרים',
  };
  const ref = (charge.reference || '').trim();
  const txn = (charge.txnId || '').trim();
  const rec = (charge.receipt || '').trim();
  const l4 = (charge.last4 || '').trim();
  if (ref) h.ref = ref;
  if (txn) h.txn = txn;
  if (rec) h.receipt = rec;
  if (l4) h.last4 = l4;
  return h;
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
  const txn = (charge.txnId || '').trim();
  const hist = sp.hist || [];
  if (txn && hist.some((h) => (h.txn || '').trim() === txn)) return { supporters, added: false };
  const next = supporters.slice();
  next[idx] = { ...sp, hist: [...hist, chargeToHist(charge)] };
  return { supporters: next, added: true };
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

/** כרטיס-תומך חדש מעסקה (כשאין תורם/כרטיס תואם) — אפס-אובדן-חיוב. */
function supFromCharge(c: SyncCharge, seq: number): Supporter {
  const id = c.toremId ? 'sup-ned-' + c.toremId : 'sup-ned-txn-' + (c.txnId || String(seq));
  return {
    id,
    name: (c.name || 'תורם נדרים').trim(),
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

  // ── שלב 2: עסקאות → hist[] של הכרטיס התואם (דדופ לפי txn; יצירה אם אין) ──
  const seenTxn = new Map<number, Set<string>>(); // idx → txns שכבר ב-hist
  const txnSetFor = (idx: number): Set<string> => {
    let s = seenTxn.get(idx);
    if (!s) {
      s = new Set((out[idx].hist || []).map((h) => (h.txn || '').trim()).filter(Boolean));
      seenTxn.set(idx, s);
    }
    return s;
  };
  const handledChargeIds: string[] = [];
  let chargeSeq = 0;
  for (const c of charges) {
    chargeSeq++;
    if (!(c.amount > 0)) continue; // חיוב-חיובי בלבד (מבוטל/זיכוי = פאזה מודעת-כסף)
    if (c.kevaId) summary.recurring++;
    let idx = findIdx(keysOf({ extId: c.toremId, zeout: c.zeout, phone: c.phone, email: c.email, name: c.name }));
    if (idx < 0) idx = findByName(c.name); // קישור-לפי-שם (ClientName) — היסטוריית-נדרים בלי מפתח-חזק
    if (idx < 0) {
      // אין כרטיס-תואם. במצב attachOnly (חיבור-חי) — **לא** יוצרים כרטיס אוטומטי
      // (מונע ריבוי-כרטיסים); העסקה נשארת pending לסנכרון-הידני עם תצוגה-מקדימה.
      if (opts.attachOnly) { summary.chargesSkipped++; continue; }
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
    const txn = (c.txnId || '').trim();
    const seen = txnSetFor(idx);
    if (txn && seen.has(txn)) { summary.chargesDup++; if (c.id) handledChargeIds.push(c.id); continue; }
    if (txn) seen.add(txn);
    else summary.chargesNoTxn++;
    const sp = out[idx];
    sp.hist = [...(sp.hist || []), chargeToHist(c)];
    summary.chargesAdded++;
    if (c.id) handledChargeIds.push(c.id); // חובר ⇒ אפשר לסמן handled
    if (curOf(c) === '$') summary.usdAdded += c.amount;
    else summary.ilsAdded += c.amount;
  }

  return { supporters: out, summary, newNames, updatedNames, handledChargeIds };
}
