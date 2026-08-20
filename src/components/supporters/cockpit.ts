/**
 * מנוע חלון-העבודה (הקוקפיט) — טהור, ללא store/DOM.
 *
 * שכבת-ההעצמה של מסך התורמים: המערכת מסדרת את היום. כל פונקציה כאן היא נגזרת
 * דטרמיניסטית של `db.supporters` (‏+ היום המוזרק ‏+ שער-הדולר) — אפס שינוי-סכמה,
 * אפס תלות ב-Date.now (בניגוד ל-supScore, שנשען על השעון; כאן הטריות מחושבת מ-
 * supLast מול היום המוזרק, כדי שהבדיקות יהיו יציבות והמנוע ניתן-לשחזור).
 *
 * הכול נשען על `lib.ts` הקיים (hokDue/hokMonthlyTotal/supLast/supIls/supUsd/supCount)
 * — הקוקפיט לא ממציא נתונים, רק מגיש את מה שכבר קיים כתור-פעולה.
 */
import type { Supporter } from '../../types/domain';
import { hokDue, hokMonthlyTotal, orgCalEntries, supCount, supIls, supLast, supUsd } from './lib';

/** סף שקט (ימים) שמעליו תורם-שנתן-בעבר נחשב "בסיכון נטישה". */
export const COCKPIT_SILENT_DAYS = 60;
/** חלון "תודה ממתינה" — תרומה שנכנסה ב-N הימים האחרונים. */
export const COCKPIT_THANK_DAYS = 3;

export type CockpitTaskKind = 'call' | 'thanks' | 'hok';
/** חומרת-המשימה — קובעת צבע-צ׳יפ בממשק (סמנטי, לא צבע-מותג). */
export type CockpitSeverity = 'risk' | 'due' | 'warm';

export interface CockpitTask {
  /** מזהה יציב לתור: kind + supId (מאפשר סימון "בוצע" בלי כפילויות). */
  id: string;
  kind: CockpitTaskKind;
  supId: string;
  name: string;
  phone: string;
  email: string;
  /** הסיבה — למה המשימה כאן היום (מוצג תחת השם). */
  reason: string;
  severity: CockpitSeverity;
  /** מפתח-מיון בתוך הקבוצה (גבוה = דחוף יותר). */
  sort: number;
}

const MS_DAY = 86_400_000;

/** ימים בין תאריך-ISO ליום (חיובי = בעבר). Infinity לתאריך ריק/לא-תקין. */
export function daysSince(iso: string, todayIso: string): number {
  if (!iso) return Infinity;
  const t = new Date(iso + 'T12:00:00').getTime();
  const now = new Date(todayIso + 'T12:00:00').getTime();
  if (Number.isNaN(t) || Number.isNaN(now)) return Infinity;
  return Math.floor((now - t) / MS_DAY);
}

/** האם היה תורם-בפועל (נתן לפחות תרומה אחת מתועדת). */
function hasGiven(sp: Supporter): boolean {
  return supCount(sp) > 0 && !!supLast(sp);
}

/** תווית-ערך דטרמיניסטית לפי הסכום המצטבר (בלי supScore/שעון). */
function valueTag(sp: Supporter, rate: number): string {
  const ils = supIls(sp) + supUsd(sp) * rate;
  if (ils >= 5000) return 'תורם/ת מרכזי/ת';
  if (ils >= 1000) return 'תורם/ת מהותי/ת';
  return 'תורם/ת';
}

/**
 * בסיכון-נטישה: נתן בעבר, שקט מעל הסף, ואין לו יעד-קשר עתידי מתוזמן.
 * מי שיש לו יעד שכבר עבר אינו כאן — הוא נכנס כ"שיחה" דרך הענף שלה (בלי כפילות).
 */
export function cockpitAtRisk(
  supporters: readonly Supporter[],
  todayIso: string,
  silentDays = COCKPIT_SILENT_DAYS,
): Supporter[] {
  return supporters
    .filter((sp) => {
      if (!hasGiven(sp)) return false;
      if (sp.nextDate) return false; // יש יעד מתוזמן (עתידי או עבר) ⇒ מטופל דרך השיחות
      return daysSince(supLast(sp), todayIso) >= silentDays;
    })
    .sort((a, b) => daysSince(supLast(b), todayIso) - daysSince(supLast(a), todayIso));
}

/**
 * שיחות מומלצות = יעד-קשר שעבר (עדיפות ראשונה) ‏∪ בסיכון-נטישה. כל תורם פעם-אחת.
 */
export function cockpitCalls(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
  silentDays = COCKPIT_SILENT_DAYS,
): CockpitTask[] {
  const tasks: CockpitTask[] = [];
  const seen = new Set<string>();

  // ── יעד-קשר שעבר ──
  for (const sp of supporters) {
    if (!sp.nextDate || sp.nextDate > todayIso) continue;
    const late = daysSince(sp.nextDate, todayIso);
    tasks.push({
      id: 'call:' + sp.id,
      kind: 'call',
      supId: sp.id,
      name: sp.name,
      phone: sp.phone || '',
      email: sp.email || '',
      reason: late <= 0 ? 'יעד-קשר להיום' : 'יעד-קשר עבר לפני ' + late + ' יום',
      severity: 'due',
      sort: 1_000_000 + late, // כל היעדים-שעברו לפני כל השקטים
    });
    seen.add(sp.id);
  }

  // ── בסיכון-נטישה ──
  for (const sp of cockpitAtRisk(supporters, todayIso, silentDays)) {
    if (seen.has(sp.id)) continue;
    const silent = daysSince(supLast(sp), todayIso);
    tasks.push({
      id: 'call:' + sp.id,
      kind: 'call',
      supId: sp.id,
      name: sp.name,
      phone: sp.phone || '',
      email: sp.email || '',
      reason: valueTag(sp, rate) + ' · שקט/ה ' + silent + ' יום',
      severity: 'risk',
      sort: silent,
    });
    seen.add(sp.id);
  }

  return tasks.sort((a, b) => b.sort - a.sort);
}

/** התרומה האחרונה (קבלה או hist) של תורם + תאריכה — למסך-התודות. */
function latestDonation(sp: Supporter): { date: string; amount: number; cur: string } | null {
  let best: { date: string; amount: number; cur: string } | null = null;
  for (const d of sp.donations) {
    if (!d.date) continue;
    if (!best || d.date > best.date) best = { date: d.date, amount: d.amount, cur: d.cur || '₪' };
  }
  for (const h of sp.hist ?? []) {
    if (!h.d) continue;
    if (!best || h.d > best.date) best = { date: h.d, amount: h.a, cur: h.c || '₪' };
  }
  return best;
}

/**
 * תודות ממתינות = תורמים שנכנסה להם תרומה ב-COCKPIT_THANK_DAYS הימים האחרונים.
 * ממוין מהחדש לישן.
 */
export function cockpitThanks(
  supporters: readonly Supporter[],
  todayIso: string,
  windowDays = COCKPIT_THANK_DAYS,
): CockpitTask[] {
  const tasks: CockpitTask[] = [];
  for (const sp of supporters) {
    const last = latestDonation(sp);
    if (!last) continue;
    const ago = daysSince(last.date, todayIso);
    if (ago < 0 || ago > windowDays) continue;
    const money = last.cur === '$' ? '$' + last.amount.toLocaleString('en-US') : '₪' + last.amount.toLocaleString('he-IL');
    tasks.push({
      id: 'thanks:' + sp.id,
      kind: 'thanks',
      supId: sp.id,
      name: sp.name,
      phone: sp.phone || '',
      email: sp.email || '',
      reason: 'תרם/ה ' + money + ' · ' + (ago <= 0 ? 'היום' : 'לפני ' + ago + ' יום'),
      severity: 'warm',
      sort: windowDays - ago, // החדש ביותר ראשון
    });
  }
  return tasks.sort((a, b) => b.sort - a.sort);
}

/**
 * הוראות-קבע שטרם נרשמו החודש — עטיפת hokDue הקיים כתור-פעולה.
 */
export function cockpitHokTasks(supporters: readonly Supporter[], todayIso: string): CockpitTask[] {
  return hokDue(supporters as Supporter[], todayIso).map((sp) => {
    const hok = sp.hok!;
    const money = hok.cur === '$' ? '$' + hok.amount.toLocaleString('en-US') : '₪' + hok.amount.toLocaleString('he-IL');
    return {
      id: 'hok:' + sp.id,
      kind: 'hok' as const,
      supId: sp.id,
      name: sp.name,
      phone: sp.phone || '',
      email: sp.email || '',
      reason: 'הו״ק ' + money + ' · יום ' + hok.day + ' — טרם נרשם החודש',
      severity: 'due' as const,
      sort: 100 - (hok.day || 0), // מוקדם בחודש = דחוף יותר
    };
  });
}

/** סכום שנגבה בפועל החודש (ש״ח-שקול) — קבלות + hist בחודש-הנוכחי. */
export function cockpitCollectedThisMonth(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): number {
  const month = todayIso.slice(0, 7);
  let sum = 0;
  for (const sp of supporters) {
    for (const d of sp.donations) {
      if (!d.date.startsWith(month)) continue;
      sum += (d.cur || '₪') === '$' ? d.amount * rate : d.amount;
    }
    for (const h of sp.hist ?? []) {
      if (!(h.d || '').startsWith(month)) continue;
      sum += (h.c || '₪') === '$' ? h.a * rate : h.a;
    }
  }
  return Math.round(sum);
}

export interface CockpitKpis {
  total: number;
  collected: number;
  expectedHok: number;
  atRisk: number;
}

/** ארבעת מדדי-הראש של הקוקפיט. */
export function cockpitKpis(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): CockpitKpis {
  return {
    total: supporters.length,
    collected: cockpitCollectedThisMonth(supporters, todayIso, rate),
    expectedHok: hokMonthlyTotal(supporters as Supporter[], rate),
    atRisk: cockpitAtRisk(supporters, todayIso).length,
  };
}

export interface CockpitQueue {
  calls: CockpitTask[];
  thanks: CockpitTask[];
  hok: CockpitTask[];
  /** כל המשימות בסדר-הצגה: שיחות → תודות → הו״ק. */
  tasks: CockpitTask[];
  total: number;
}

/** התור המלא של היום — שלוש הקבוצות + רשימה-מאוחדת + מונה. */
export function cockpitQueue(
  supporters: readonly Supporter[],
  todayIso: string,
  rate = 3.7,
): CockpitQueue {
  const calls = cockpitCalls(supporters, todayIso, rate);
  const thanks = cockpitThanks(supporters, todayIso);
  const hok = cockpitHokTasks(supporters, todayIso);
  const tasks = [...calls, ...thanks, ...hok];
  return { calls, thanks, hok, tasks, total: tasks.length };
}

/** התקדמות-היום מול קבוצת-מזהים-שטופלה (טהור; ה-UI מחזיק את ה-Set). */
export function cockpitProgress(queue: CockpitQueue, doneIds: ReadonlySet<string>): { done: number; total: number } {
  let done = 0;
  for (const t of queue.tasks) if (doneIds.has(t.id)) done++;
  return { done, total: queue.total };
}

export interface CockpitFeedItem {
  id: string;
  date: string;
  who: string;
  what: string;
  spId?: string;
}

/**
 * פעילות-חיה — N האירועים האחרונים מכל התורמים (תרומות/יעדים/מעקב), מהחדש לישן.
 * נגזר מ-orgCalEntries הקיים; קריאה-בלבד.
 */
export function cockpitFeed(supporters: readonly Supporter[], limit = 8): CockpitFeedItem[] {
  return orgCalEntries(supporters as Supporter[])
    .filter((e) => e.date)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit)
    .map((e, i) => {
      const money =
        e.amount > 0
          ? e.cur === '$'
            ? '$' + e.amount.toLocaleString('en-US')
            : '₪' + e.amount.toLocaleString('he-IL')
          : '';
      return {
        id: (e.spId ?? 'x') + ':' + e.date + ':' + i,
        date: e.date,
        who: e.name ?? '',
        what: money ? 'תרם/ה ' + money : e.src || '',
        spId: e.spId,
      };
    });
}
