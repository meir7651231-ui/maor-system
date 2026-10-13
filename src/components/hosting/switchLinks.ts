/**
 * 🏡 אירוח ⇄ 🔌 המרכזייה — עזרי-החיבורים הטהורים (BUILD-ORDER-SWITCHBOARD-2026-10-13, חיבורים א׳+ב׳).
 * בלי store/DOM/Date.now. הנתונים מכלים אחרים מגיעים **רק** כפלט של יכולות (טיפוסים מהרישום — ייבוא-טיפוסים בלבד);
 * המודול לא מייבא את פרנסה׳לע.
 *   · stayFriday — האם השהייה לנה בליל-שבת (ואיזה) ⇒ זמני-השבת של אותה שבת.
 *   · groupMinyanim — מניינים לפי בית-כנסת (כתובת) ואז לפי יום ("שישי: מנחה 17:53 · שבת: שחרית 08:30").
 *   · shabbatTimeItems / shabbatFamilyText — הזמנים לכרטיס (תווית + שעה), וההודעה הממולאת "📤 שליחה למשפחה" (זמנים + מניינים + כתובות).
 *   · faultNeed / cleanNeed — מה שואלים את המדריך מתוך קריאת-תחזוקה / משימת-ניקיון.
 *   · sacredGuardLines / hebRangeText (ENGINEBOX-SOCKETS 13.10) — מפלט calendar.dayInfo (הלוח העברי של אורביט): אזהרת
 *     "⚠ הכניסה נופלת בשבת · ה׳ חשוון" בטופס-ההזמנה, וטווח-התאריכים העברי לכרטיס-השהייה ("ה׳–ז׳ חשוון").
 */
import type { HostBooking, HostCleanTask, HostFault } from '../../types/domain';
import type { OutputOf } from '../../lib/switchboard/registry';
import { addDaysIso, isIso } from './transitions';

type Shabbat = OutputOf<'parnasa.shabbat'>;
type DayInfo = OutputOf<'calendar.dayInfo'>;
type Minyan = OutputOf<'parnasa.minyanim'>['minyanim'][number];

const dm = (iso: string): string => (isIso(iso) ? +iso.slice(8, 10) + '/' + +iso.slice(5, 7) : '');

/** יום-השישי הראשון שהשהייה לנה בו (checkIn ≤ שישי < checkOut) — '' כשהשהייה לא כוללת ליל-שבת. */
export function stayFriday(b: Pick<HostBooking, 'checkIn' | 'checkOut'>): string {
  if (!isIso(b.checkIn) || !isIso(b.checkOut)) return '';
  for (let d = b.checkIn, i = 0; d && d < b.checkOut && i < 400; d = addDaysIso(d, 1), i++) {
    if (new Date(d + 'T12:00:00Z').getUTCDay() === 5) return d;
  }
  return '';
}

export interface ShulGroup {
  shul: string;
  place: string;
  /** לפי סדר-הימים: "שישי" → ["מנחה 17:53", "קבלת שבת 17:58"]. */
  days: Array<{ dayName: string; items: string[] }>;
}

/** מניינים לפי בית-כנסת (בסדר ההופעה הראשונה) ואז לפי יום; כל פריט "תפילה שעה". */
export function groupMinyanim(list: readonly Minyan[]): ShulGroup[] {
  const out: ShulGroup[] = [];
  for (const m of list) {
    let g = out.find((x) => x.shul === m.shul && x.place === m.place);
    if (!g) {
      g = { shul: m.shul, place: m.place, days: [] };
      out.push(g);
    }
    let day = g.days.find((x) => x.dayName === m.dayName);
    if (!day) {
      day = { dayName: m.dayName, items: [] };
      g.days.push(day);
    }
    day.items.push(m.prayer + ' ' + m.time);
  }
  return out;
}

/** "שישי: מנחה 17:53, קבלת שבת 17:58 · שבת: שחרית 08:30". */
export function shulDaysText(g: ShulGroup): string {
  return g.days.map((d) => d.dayName + ': ' + d.items.join(', ')).join(' · ');
}

/** זמני השבת לכרטיס — תווית + שעה (השעה מוצגת בספרות, מופרדת מהעברית). */
export function shabbatTimeItems(sh: Shabbat): Array<{ label: string; time: string }> {
  return [
    sh.candle ? { label: 'הדלקת נרות · שישי ' + dm(sh.friIso), time: sh.candle } : null,
    sh.end ? { label: 'צאת השבת', time: sh.end } : null,
    sh.rabbeinuTam ? { label: 'ר״ת', time: sh.rabbeinuTam } : null,
  ].filter((x): x is { label: string; time: string } => x !== null);
}

/**
 * ההודעה למשפחה ("📤 שליחה למשפחה"): ברכה · איפה מחכים להם · זמני השבת · המניינים בקהילה עם הכתובות · האופק · שבת שלום.
 * וואטסאפ פותח אותה ממולאת — המארח רואה, מתקן ושולח (לא נשלח אוטומטית).
 */
export function shabbatFamilyText(p: { guest: string; unit: string; biz: string; shabbat: Shabbat; minyanim: readonly Minyan[] }): string {
  const sh = p.shabbat;
  const where = [p.unit.trim(), p.biz.trim() ? '(' + p.biz.trim() + ')' : ''].filter(Boolean).join(' ');
  const lines = [
    'שלום' + (p.guest.trim() ? ' ' + p.guest.trim() : '') + ',',
    'מחכים לכם לשבת' + (where ? ' ב' + where : '') + '.',
    '🕯️ שבת ' + sh.hebDate + (sh.holiday ? ' · ' + sh.holiday : '') + ': ' +
      [sh.candle ? 'הדלקת נרות ביום שישי ' + dm(sh.friIso) + ' בשעה ' + sh.candle : '', sh.end ? 'צאת השבת ' + sh.end + (sh.rabbeinuTam ? ' (ר״ת ' + sh.rabbeinuTam + ')' : '') : '']
        .filter(Boolean)
        .join(' · ') +
      '.',
  ];
  const groups = groupMinyanim(p.minyanim);
  if (groups.length) {
    lines.push('🙏 מניינים בקהילה:');
    for (const g of groups) lines.push('• ' + g.shul + (g.place ? ' (' + g.place + ')' : '') + ' — ' + shulDaysText(g));
  }
  if (sh.loc) lines.push('הזמנים ' + sh.loc + '.');
  lines.push('שבת שלום!');
  return lines.join('\n');
}

/** מה שואלים את המדריך מקריאת-תחזוקה: התיאור + הקטגוריה ("אחר" — לא מוסיפה). */
export function faultNeed(f: Pick<HostFault, 'desc' | 'category'>): string {
  return [f.desc.trim(), f.category && f.category !== 'אחר' ? f.category : ''].filter(Boolean).join(' ');
}

/** מה שואלים את המדריך ממשימת-ניקיון: סוג-המשימה, ותמיד "ניקיון" (גם "החלפת מצעים" — עבודת ניקיון). */
export function cleanNeed(t: Pick<HostCleanTask, 'type'>): string {
  const type = (t.type || '').trim();
  return type.includes('ניקיון') ? type : (type + ' ניקיון').trim();
}

/* ═══════════════ 📅 הלוח העברי (calendar.dayInfo) ═══════════════ */

/** "בשבת" · "בשבת · חנוכה" · "ביום טוב · סוכות" — '' כשהיום פתוח (או פגום). */
function closedWhy(d: DayInfo): string {
  if (!d.valid || !d.closed) return '';
  if (d.isShabbat) return 'בשבת' + (d.holiday ? ' · ' + d.holiday : '');
  return 'ביום טוב · ' + (d.holiday ?? '');
}

/**
 * אזהרת-שבת/יו״ט לטופס-ההזמנה: שורה לכניסה ושורה לעזיבה שנופלות בשבת/יו״ט, עם התאריך העברי —
 * "⚠ הכניסה נופלת בשבת · ה׳ חשוון" · "⚠ העזיבה נופלת ביום טוב · סוכות · ט״ו תשרי". יום פתוח ⇒ אין שורה. אזהרה, לא חסימה.
 */
export function sacredGuardLines(checkIn: DayInfo, checkOut: DayInfo): string[] {
  const out: string[] = [];
  const a = closedWhy(checkIn);
  const b = closedWhy(checkOut);
  if (a) out.push('⚠ הכניסה נופלת ' + a + ' · ' + checkIn.hebDayMonth);
  if (b) out.push('⚠ העזיבה נופלת ' + b + ' · ' + checkOut.hebDayMonth);
  return out;
}

/**
 * טווח-השהייה בלוח העברי, לצד התאריכים הרגילים: אותו חודש ⇒ "ה׳–ז׳ חשוון"; חודשים שונים ⇒ "כ״ט תשרי – ב׳ חשוון";
 * שנים שונות ⇒ עם השנים ("כ״ח אלול תשפ״ו – ב׳ תשרי תשפ״ז"). תאריך פגום ⇒ ''.
 */
export function hebRangeText(checkIn: DayInfo, checkOut: DayInfo): string {
  if (!checkIn.valid || !checkOut.valid) return '';
  if (checkIn.hebYear !== checkOut.hebYear) return checkIn.hebDate + ' – ' + checkOut.hebDate;
  if (checkIn.hebMonth !== checkOut.hebMonth) return checkIn.hebDayMonth + ' – ' + checkOut.hebDayMonth;
  if (checkIn.hebDay === checkOut.hebDay) return checkIn.hebDayMonth;
  return checkIn.hebDay + '–' + checkOut.hebDay + ' ' + checkIn.hebMonth;
}
