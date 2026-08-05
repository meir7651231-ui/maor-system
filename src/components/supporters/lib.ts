/**
 * עזרי מודול התורמים — ציון RFM משוקלל, דרגות זהב/כסף/ארד,
 * פורמט תאריכים וטלפון. עזרים מקומיים בלבד — אין גישה ל-store או ל-DOM.
 */
import type { CSSProperties } from 'react';
import type { Supporter } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { termOf } from '../../lib/config';
import { normSearch, formatIsraeliPhone } from '../../lib/validate';
import { isoToday as isoTodayLocal } from '../../lib/date-util';

/** תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO). */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export function isoToday(): string {
  return isoTodayLocal();
}

/** שווי כולל בש"ח — דולר לפי השער העריך (ברירת-מחדל 3.7, כמו במקור). */
export function supTotalIls(sp: Supporter, rate = 3.7): number {
  return (sp.ils || 0) + (sp.usd || 0) * rate;
}

/**
 * ציון משוקלל 0–1000 בסגנון RFM — ספי הניקוד verbatim מהמקור:
 * R — טריות (ימים מאז התרומה האחרונה), F — תדירות (מספר תרומות), M — סכום מצטבר.
 */
export function supScore(sp: Supporter, rate = 3.7): number {
  const tot = supTotalIls(sp, rate);
  const days = sp.last
    ? Math.floor((Date.now() - new Date(sp.last + 'T12:00:00').getTime()) / 86400000)
    : 9999;
  const R = days <= 30 ? 350 : days <= 90 ? 280 : days <= 180 ? 200 : days <= 365 ? 120 : 40;
  const F = sp.count >= 10 ? 300 : sp.count >= 5 ? 230 : sp.count >= 3 ? 160 : sp.count >= 2 ? 100 : 50;
  const M = tot >= 5000 ? 350 : tot >= 2000 ? 280 : tot >= 1000 ? 210 : tot >= 500 ? 140 : tot >= 100 ? 80 : 40;
  return R + F + M;
}

export interface SupTier {
  label: string;
  bg: string;
  c: string;
  dot: string;
}

/** דרגה לפי הציון — זהה לחלוקה ולצבעים במקור (800/600/400). */
export function supTier(sc: number): SupTier {
  if (sc >= 800) return { label: 'זהב', bg: '#fdf3dd', c: '#9a6414', dot: '#f3c76b' };
  if (sc >= 600) return { label: 'כסף', bg: '#eef1f5', c: '#44546a', dot: '#94a3b8' };
  if (sc >= 400) return { label: 'ארד', bg: '#f6ead1', c: '#9a6414', dot: '#d97706' };
  return { label: 'רדומה', bg: '#eceae2', c: '#8b8474', dot: '#a8a29e' };
}

export const TIER_ORDER = ['זהב', 'כסף', 'ארד', 'רדומה'] as const;

/* ---------- פאנל דרגות מורחב (P3 פריט 12) — טהור, נוסחאות הלגאסי ---------- */

/** היסטוגרמת ציון — 10 סלים של 100 נקודות (legacy supBars:3018-3022). */
export function supScoreBins(supporters: readonly Supporter[], rate = 3.7): number[] {
  const bins = Array(10).fill(0) as number[];
  for (const sp of supporters) bins[Math.min(9, Math.floor(supScore(sp, rate) / 100))]++;
  return bins;
}

/** ממוצע לתרומה — סה"כ ₪-שקול (‎$×3.7‎) חלקי מספר התרומות (legacy supAvgDon:3024); אין תרומות ⇒ null. */
export function supAvgDon(supporters: readonly Supporter[], rate = 3.7): number | null {
  const totIls = supporters.reduce((a, x) => a + supTotalIls(x, rate), 0);
  const totCnt = supporters.reduce((a, x) => a + (x.count || 0), 0);
  return totCnt ? Math.round(totIls / totCnt) : null;
}

/** מונה "תרמו ב-12 החודשים" — last בתוך 365 יום מ-todayIso (legacy sup12m:3025). */
export function sup12m(supporters: readonly Supporter[], todayIso: string): number {
  const d = new Date(todayIso + 'T12:00:00');
  d.setDate(d.getDate() - 365);
  const p2 = (n: number) => String(n).padStart(2, '0');
  const cut = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  let n = 0;
  for (const sp of supporters) if (sp.last && sp.last >= cut) n++;
  return n;
}

/** צ'יפ דרגה/סטטוס קטן בסגנון אחיד. */
export function chipStyle(bg: string, c: string): CSSProperties {
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: bg,
    color: c,
    whiteSpace: 'nowrap',
  };
}

/**
 * עיצוב טלפון ישראלי — מאוחד עם formatIsraeliPhone כדי שאותו מספר יעוצב זהה
 * בכל הטפסים (תומכים/משפחות/מורים). קודם היה מימוש נפרד שלא טיפל בקידומת 972
 * ולא הוסיף מקף למספר שכבר מתחיל ב-0 — פער חוצה-מערכת.
 */
export function fixPhone(p: string): string {
  return formatIsraeliPhone(p);
}

/** "₪1,200 + $300" או "—" כשאין כלום. */
export function totalLabel(sp: Supporter): string {
  const ils = sp.ils ? '₪' + sp.ils.toLocaleString('he-IL') : '';
  const usd = sp.usd ? '$' + sp.usd.toLocaleString('he-IL') : '';
  return ils && usd ? ils + ' + ' + usd : ils || usd || '—';
}

/* ── "כל התרומות" — מיזוג קבלות + הקובץ ההיסטורי (feature supporters.hist) ── */

/** שורת תצוגה ברשימת "כל התרומות" — קבלה, רשומת hist או ציון first/last. */
export interface SupDonEvent {
  date: string;
  amount: number;
  cur: '₪' | '$' | '';
  /** מקור השורה: 'קבלה R-N' / 'מהקובץ ההיסטורי' / 'תרומה ראשונה (מהקובץ)'. */
  src: string;
  rid?: string;
}

/**
 * מיזוג התרומות לתצוגה — verbatim מהלגאסי (legacy-main-script.js:1486-1495,
 * supDonEvents): donations עם 'קבלה <rid>' + hist עם 'מהקובץ ההיסטורי';
 * כשאין hist — שורות first/last (סכום 0) כ"תרומה ראשונה/אחרונה (מהקובץ)",
 * רק אם תאריכן לא מופיע כבר. ממוין מהחדש לישן.
 */
export function supDonEvents(sp: Supporter, config?: OrgConfig): SupDonEvent[] {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  const out: SupDonEvent[] = (sp.donations || []).map((d) => ({
    date: d.date,
    amount: d.amount,
    cur: d.cur || '₪',
    src: 'קבלה ' + d.rid,
    rid: d.rid,
  }));
  for (const h of sp.hist || []) out.push({ date: h.d, amount: h.a, cur: h.c || '₪', src: 'מהקובץ ההיסטורי' });
  if (!(sp.hist || []).length) {
    const seen = new Set(out.map((x) => x.date));
    if (sp.first && !seen.has(sp.first)) out.push({ date: sp.first, amount: 0, cur: '', src: T('entity.donation', 'תרומה') + ' ראשונה (מהקובץ)' });
    if (sp.last && sp.last !== sp.first && !seen.has(sp.last)) out.push({ date: sp.last, amount: 0, cur: '', src: T('entity.donation', 'תרומה') + ' אחרונה (מהקובץ)' });
  }
  return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/* ── לוח התרומות (feature supporters.doncal) — שורות הלוח האישי והכלל-ארגוני ──
   ratchet: legacy supCalMine/supCalAll (legacy-main-script.js:2928-2944) —
   הלוח מציג לצד התרומות גם את אירועי מעקב הטיפול (🧿 רישומים, 📞 תשובות,
   🔁 לדבר שוב) ואת 🎯 תאריך היעד בלוח האישי. */

/** רשומת-יום בלוח התרומות — תרומה/קבלה/אירוע מעקב, עם ניווט לתומכת בלוח הכללי. */
export interface SupCalEntry {
  date: string;
  amount: number;
  cur: '₪' | '$' | '';
  src: string;
  name?: string;
  spId?: string;
}

/** שורות הלוח האישי של תומכת — legacy supCalMine (2940-2944). */
export function personalCalEntries(sp: Supporter): SupCalEntry[] {
  const out: SupCalEntry[] = supDonEvents(sp).map((e) => ({ date: e.date, amount: e.amount, cur: e.cur, src: e.src }));
  if (sp.nextDate) out.push({ date: sp.nextDate, amount: 0, cur: '', src: '🎯 תאריך יעד לקשר הבא' });
  for (const l of sp.ayin?.log ?? []) {
    out.push({ date: l.date, amount: 0, cur: '', src: '🧿 ' + l.eyes + (l.name ? ' — ' + l.name : '') });
  }
  for (const an of sp.ayin?.answers ?? []) out.push({ date: an.date, amount: 0, cur: '', src: '📞 תשובה: ' + an.note });
  if (sp.ayin?.nextTalk) out.push({ date: sp.ayin.nextTalk, amount: 0, cur: '', src: '🔁 לדבר שוב' });
  return out.filter((e) => !!e.date);
}

/** שורות הלוח הכלל-ארגוני — כל התומכות (legacy supCalAll, 2928-2937). */
export function orgCalEntries(supporters: Supporter[]): SupCalEntry[] {
  const out: SupCalEntry[] = [];
  for (const sp of supporters) {
    for (const e of supDonEvents(sp)) out.push({ date: e.date, amount: e.amount, cur: e.cur, src: e.src, name: sp.name, spId: sp.id });
    for (const l of sp.ayin?.log ?? []) {
      out.push({ date: l.date, amount: 0, cur: '', src: '🧿 ' + l.eyes + (l.name ? ' — ' + l.name : ''), name: sp.name, spId: sp.id });
    }
    for (const an of sp.ayin?.answers ?? []) out.push({ date: an.date, amount: 0, cur: '', src: '📞 תשובה: ' + an.note, name: sp.name, spId: sp.id });
    if (sp.ayin?.nextTalk) out.push({ date: sp.ayin.nextTalk, amount: 0, cur: '', src: '🔁 לדבר שוב', name: sp.name, spId: sp.id });
  }
  return out.filter((e) => !!e.date);
}

/** שורת סיכום החודש — 'N תרומות החודש · ₪X + $Y' (legacy supCalData monthLine). */
export function donCalMonthLine(entries: SupCalEntry[], inMonth: (iso: string) => boolean, config?: OrgConfig): string {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  let mc = 0;
  let mi = 0;
  let mu = 0;
  for (const e of entries) {
    if (!inMonth(e.date)) continue;
    mc++;
    if (e.cur === '$') mu += e.amount || 0;
    else mi += e.amount || 0;
  }
  if (!mc) return 'אין ' + T('entity.donations', 'תרומות') + ' מתועדות בחודש זה';
  const sums =
    (mi ? '₪' + mi.toLocaleString('he-IL') : '') + (mi && mu ? ' + ' : '') + (mu ? '$' + mu.toLocaleString('he-IL') : '');
  return mc + ' ' + T('entity.donations', 'תרומות') + ' החודש · ' + (sums || 'סכומים מהקובץ ההיסטורי');
}

/* ── ייבוא תומכות מ-CSV — עדכון-או-הוספה לפי שם מנורמל (טהור, נבדק ביחידה) ── */

/** נרמול שם להשוואה — נרמול חיפוש עברי + הסרת רווחים. */
export function normName(s: string): string {
  return normSearch(s).replace(/\s/g, '');
}

/** שורת ייבוא תומכת אחת (העמודות מהתבנית). */
export interface SupporterImportRow {
  name: string;
  phone: string;
  email: string;
  idNum: string;
  address: string;
  cat: string;
  forWho: string;
}

/** תוכנית ייבוא — אילו קיימות יעודכנו ואילו חדשות ייווצרו. */
export interface SupporterImportPlan {
  /** עדכון תומכת קיימת (id) עם ערכי השורה. */
  updates: { id: string; row: SupporterImportRow }[];
  /** תומכות חדשות להוספה (אחרי מיזוג כפילויות בתוך הקובץ עצמו). */
  inserts: SupporterImportRow[];
}

/** מיזוג שדות שאינם ריקים מ-b לתוך a (a גובר כשקיים; b ממלא חוסרים). */
function fillEmpty(a: SupporterImportRow, b: SupporterImportRow): SupporterImportRow {
  const out = { ...a };
  (Object.keys(b) as (keyof SupporterImportRow)[]).forEach((k) => {
    if (!out[k] && b[k]) out[k] = b[k];
  });
  return out;
}

/**
 * תכנון ייבוא — הצלבה לפי שם מנורמל: שם קיים ⇒ עדכון, שם חדש ⇒ הוספה.
 * כפילויות בתוך הקובץ מתמזגות לרשומה אחת (הראשונה גוברת, השאר ממלאות חוסרים).
 * טהור — לא נוגע ב-store; שורות ללא שם מדולגות.
 */
export function planSupporterImport(
  rows: SupporterImportRow[],
  existing: Supporter[],
): SupporterImportPlan {
  const byName = new Map<string, string>();
  for (const sp of existing) byName.set(normName(sp.name), sp.id);
  const updates: SupporterImportPlan['updates'] = [];
  const inserts: SupporterImportRow[] = [];
  const insertIdx = new Map<string, number>();
  for (const r of rows) {
    const nm = r.name.trim();
    if (!nm) continue;
    const key = normName(nm);
    const existId = byName.get(key);
    if (existId) {
      updates.push({ id: existId, row: r });
      continue;
    }
    const idx = insertIdx.get(key);
    if (idx != null) {
      inserts[idx] = fillEmpty(inserts[idx], r);
      continue;
    }
    insertIdx.set(key, inserts.length);
    inserts.push(r);
  }
  return { updates, inserts };
}

/** החלת שורת ייבוא על תומכת קיימת — ערך לא-ריק בשורה דורס, אחרת נשמר הקיים. */
export function mergeSupporterRow(sp: Supporter, row: SupporterImportRow): Supporter {
  return {
    ...sp,
    name: row.name.trim() || sp.name,
    phone: row.phone ? fixPhone(row.phone.trim()) : sp.phone,
    email: row.email.trim() || sp.email,
    idNum: row.idNum.trim() || sp.idNum,
    address: row.address.trim() || sp.address,
    cat: row.cat.trim() || sp.cat,
    forWho: row.forWho.trim() || sp.forWho,
  };
}

/** יצירת תומכת חדשה משורת ייבוא (מונים ותרומות מתחילים מאפס). */
export function newSupporterFromRow(id: string, row: SupporterImportRow): Supporter {
  return {
    id,
    name: row.name.trim(),
    phone: fixPhone(row.phone.trim()),
    email: row.email.trim(),
    idNum: row.idNum.trim(),
    address: row.address.trim(),
    cat: row.cat.trim(),
    forWho: row.forWho.trim(),
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

/* ─────────── 🔁 הוראות-קבע (ROADMAP-100 ‏#2 צד-מערכת, 5.8.2026) ───────────
 * ההגדרה על התומך (Supporter.hok); הרישום-בפועל = תרומה רגילה עם HOK_CAT
 * (קבלה בסדרה הרציפה). "נרשמה החודש" = תרומה בחודש-האזרחי הנוכחי בקטגוריית
 * הו"ק **או** בסכום-ומטבע של ההוראה (תרומה חד-פעמית נוספת לא מכסה). */

export const HOK_CAT = 'הו"ק';

/** האם חיוב-החודש של ההוראה כבר נרשם (חודש אזרחי נוכחי). */
export function hokRecordedThisMonth(sp: Supporter, todayIso: string): boolean {
  if (!sp.hok) return false;
  const month = todayIso.slice(0, 7);
  const hok = sp.hok;
  return sp.donations.some(
    (d) => d.date.startsWith(month) && (d.cat === HOK_CAT || (d.amount === hok.amount && (d.cur || '₪') === hok.cur)),
  );
}

/** התומכים שהו"ק-החודש שלהם טרם נרשמה — ממוינים לפי יום-החיוב. */
export function hokDue(supporters: Supporter[], todayIso: string): Supporter[] {
  return supporters
    .filter((sp) => sp.hok?.active && !hokRecordedThisMonth(sp, todayIso))
    .sort((a, b) => (a.hok?.day ?? 0) - (b.hok?.day ?? 0));
}

/** סה"כ הו"ק חודשי פעיל בש"ח-שקול (ההכנסה-הקבועה) — לפי שער-הדולר העריך. */
export function hokMonthlyTotal(supporters: Supporter[], usdRate: number): number {
  return Math.round(
    supporters.reduce((a, sp) => {
      if (!sp.hok?.active) return a;
      return a + (sp.hok.cur === '$' ? sp.hok.amount * usdRate : sp.hok.amount);
    }, 0),
  );
}

/** תווית אמצעי-ההו"ק לתצוגה. */
export function hokMethodLabel(m: string): string {
  if (m === 'bank') return 'הו"ק בנקאית';
  if (m === 'card') return 'אשראי בסליקה';
  if (m === 'cash') return 'מזומן חודשי';
  return m || 'אחר';
}
