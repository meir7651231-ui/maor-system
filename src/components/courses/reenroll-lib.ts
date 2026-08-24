/**
 * מנוע טהור · רישום-לשנה-הבאה (courses.reenroll)
 * ------------------------------------------------------------------
 * לוגיקה בלבד — בלי store ו-DOM (מוסכמת-הטוהר של הפרויקט). כל הפונקציות
 * דטרמיניסטיות (ה"היום" מוזרק), additive לחלוטין ואינן נוגעות בכספים/בקבלות.
 *
 * "מה היה בעבר" נגזר מהשדות הקיימים של Enrollment (presents/absences/payments/
 * status) — אין נתון חדש. הרישום-לשנה-הבאה בונה טיוטת-שיבוץ/חוג חדשים (טהורים);
 * ה-id וה-upsert נעשים ב-store בלבד.
 */
import type { Course, Db, Enrollment, Member } from '../../types/domain';
import { gemYear, hebPartsOfIso } from '../../lib/hebrew';
import { payBal, paidOf } from './lib';

/** פרסור ISO לצהריים-מקומי — מוסכמת-התאריכים של הפרויקט (בלי היסט UTC). */
function atNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}
function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * תווית שנת-לימודים עברית מתוך תאריך-פתיחה — למשל 2026-09-01 → "תשפ״ז".
 * שנה"ל 1.9→31.8 של השנה הבאה; ה-31.12 שבתוכה תמיד אחרי ראש-השנה העברי,
 * ולכן `hebPartsOfIso("YYYY-12-31").year` מחזיר בדיוק את השנה העברית הרצויה.
 */
export function academicYearLabel(startIso: string): string {
  if (!startIso) return '';
  const d = atNoon(startIso);
  // מתי חלה ה-31.12 שבתוך שנת-הלימודים הזאת:
  // חוג שנפתח 1.9.2026 (September=8) ⇒ 31.12.2026 = תוך-השנה, שיין ל-תשפ״ז.
  // חוג שנפתח 1.3.2026 (March=2) ⇒ שנת-הלימודים ההיא נפתחה 1.9.2025 ⇒ 31.12.2025.
  const yy = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return gemYear(hebPartsOfIso(`${yy}-12-31`).year);
}

/** תווית שנת-הלימודים העברית **הבאה** אחרי תאריך-הפתיחה — למשל 2025-09-01 → "תשפ״ז". */
export function nextAcademicYearLabel(startIso: string): string {
  if (!startIso) return '';
  const d = atNoon(startIso);
  const yy = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  // "השנה הבאה" = הוסף שנה עברית אחת (31.12 של השנה הלועזית הבאה).
  return gemYear(hebPartsOfIso(`${yy + 1}-12-31`).year);
}

/** תאריכי השנה הבאה — הזזת start/end בשנה קדימה (שומר יום/חודש). */
export function nextYearDates(start: string, end: string): { start: string; end: string } {
  const shift = (iso: string) => {
    const d = atNoon(iso);
    d.setFullYear(d.getFullYear() + 1);
    return toIso(d);
  };
  return { start: shift(start), end: shift(end) };
}

export type RenewDecision = 'yes' | 'no' | 'hold' | '';

/** ההחלטה הנוכחית של השיבוץ (חסר = טרם הוחלט). */
export function renewOf(e: Enrollment): RenewDecision {
  return e.renew ?? '';
}

/** האם השיבוץ כבר נרשם לשנה הבאה (יש קישור לשיבוץ-היעד). */
export function isRenewed(e: Enrollment): boolean {
  return !!e.renewedToId;
}

export interface EnrollSummary {
  /** מספר הנוכחויות שנרשמו (יומן presents). */
  presents: number;
  /** מספר החיסורים. */
  absences: number;
  /** מתוכם "לא הגיע ללא הודעה". */
  noshow: number;
  /** יתרת-תשלום (₪) — 0/שלילי = אין חוב. */
  balance: number;
  /** סה"כ ששולם (₪). */
  paid: number;
  /** תווית-סטטוס אשתקד. */
  statusLabel: string;
  /** תאריך הנוכחות האחרונה (ISO) או '' אם אין. */
  lastPresent: string;
}

const STATUS_LABEL: Record<Enrollment['status'], string> = {
  active: 'פעיל',
  paused: 'מושהה',
  ended: 'הסתיים',
  wait: 'רשימת-המתנה',
};

/** "מה היה בעבר" — סיכום דטרמיניסטי פר-שיבוץ מהשדות הקיימים. */
export function enrollSummary(e: Enrollment): EnrollSummary {
  const presents = (e.presents ?? []).length;
  const absences = (e.absences ?? []).length;
  const noshow = (e.absences ?? []).filter((a) => a.noshow).length;
  const lastPresent = (e.presents ?? []).slice().sort().slice(-1)[0] ?? '';
  return {
    presents,
    absences,
    noshow,
    balance: payBal(e),
    paid: paidOf(e),
    statusLabel: STATUS_LABEL[e.status] ?? '',
    lastPresent,
  };
}

export interface ReenrollRow {
  e: Enrollment;
  member: Member | null;
  memberName: string;
  familyName: string;
  course: Course | null;
  courseName: string;
  summary: EnrollSummary;
  decision: RenewDecision;
  renewed: boolean;
}

/** איתור בן/בת-משפחה + שם-משפחה לפי memberId (סריקת families.members). */
function findMember(db: Db, memberId: string): { member: Member | null; family: string } {
  for (const f of db.families) {
    const m = f.members.find((x) => x.id === memberId);
    if (m) return { member: m, family: f.name || '' };
  }
  return { member: null, family: '' };
}

export interface ReenrollFilter {
  /** צמצום לחוג יחיד (id) — ריק/undefined = כל החוגים. */
  courseId?: string;
  /** צמצום לפי החלטה — ריק = הכל; 'undecided' = טרם הוחלט. */
  decision?: RenewDecision | 'undecided';
  /** חיפוש טקסט חופשי (שם תלמיד/משפחה/חוג). */
  q?: string;
  /** האם לכלול שיבוצים שכבר נרשמו לשנה הבאה (ברירת-מחדל: כן). */
  includeRenewed?: boolean;
}

/**
 * בניית שורות-הרישום — מצטרף member+course+summary לכל שיבוץ של "השנה הנוכחית".
 * "השנה הנוכחית" = שיבוצים שאינם עצמם תוצר-רישום (renewedToId ריק בצד המקור לא
 * רלוונטי — מסננים לפי החוג/ההחלטה). דטרמיניסטי, ממויין לפי שם-תלמיד.
 */
export function buildReenrollRows(db: Db, filter: ReenrollFilter = {}): ReenrollRow[] {
  const includeRenewed = filter.includeRenewed !== false;
  const q = (filter.q ?? '').trim();
  const rows: ReenrollRow[] = [];
  for (const e of db.enrollments) {
    if (filter.courseId && e.courseId !== filter.courseId) continue;
    const renewed = isRenewed(e);
    if (!includeRenewed && renewed) continue;
    const course = db.courses.find((c) => c.id === e.courseId) ?? null;
    const { member, family } = findMember(db, e.memberId);
    const memberName = member?.first ?? '';
    const courseName = course?.name ?? '';
    const decision = renewOf(e);
    if (filter.decision) {
      if (filter.decision === 'undecided') {
        if (decision !== '') continue;
      } else if (decision !== filter.decision) continue;
    }
    if (q) {
      const hay = `${memberName} ${family} ${courseName}`;
      // כל מילה חייבת להימצא (חיפוש רב-מילתי) — כמו smartFilter במודולים האחרים.
      const words = q.split(/\s+/).filter(Boolean);
      if (!words.every((w) => hay.includes(w))) continue;
    }
    rows.push({
      e,
      member,
      memberName,
      familyName: family,
      course,
      courseName,
      summary: enrollSummary(e),
      decision,
      renewed,
    });
  }
  rows.sort((a, b) => a.memberName.localeCompare(b.memberName, 'he'));
  return rows;
}

export interface ReenrollCounts {
  total: number;
  yes: number;
  no: number;
  hold: number;
  undecided: number;
  renewed: number;
}

/** מוני-התקדמות מעל שורות-הרישום. */
export function reenrollCounts(rows: ReenrollRow[]): ReenrollCounts {
  const c: ReenrollCounts = { total: 0, yes: 0, no: 0, hold: 0, undecided: 0, renewed: 0 };
  for (const r of rows) {
    c.total++;
    if (r.renewed) c.renewed++;
    if (r.decision === 'yes') c.yes++;
    else if (r.decision === 'no') c.no++;
    else if (r.decision === 'hold') c.hold++;
    else c.undecided++;
  }
  return c;
}

/** מי מיועד לרישום המוני — "ממשיך" שעדיין לא נרשם. */
export function renewTargets(rows: ReenrollRow[]): ReenrollRow[] {
  return rows.filter((r) => r.decision === 'yes' && !r.renewed);
}

/**
 * טיוטת-שיבוץ טהורה לשנה הבאה — מעתיקה מסלול/קבוצה/תמחור מהמקור, מאפסת היסטוריה
 * (used/purchased/presents/absences/payments) ומסמנת פעיל מהיום. ה-id מוזרק מבחוץ
 * (nextId ב-store). אינה נוגעת ב-receiptSeq/כספים.
 *
 * ⚠️ שינוי-מודל 24.8 (בקשת-בעלים): **החוג לא משוכפל** — targetCourseId ברירת-מחדל
 * = חוג-המקור עצמו. הבידול בין השנים נעשה דרך `year` (תווית עברית תשפ״ז/תשפ״ח),
 * וסינון-פנימי בכרטיס-החוג. `yearLabel` = תווית שנת-הלימודים החדשה (מוזרק מבחוץ).
 * ה**הערה** על התלמיד/ה מועברת קדימה במכוון (בקשה: "הערה על תלמיד בחוג שגם
 * יעבור לשנה הבאה") — אינה מתאפסת יותר.
 */
export function freshNextYearEnrollment(
  src: Enrollment,
  targetCourseId: string,
  newId: string,
  todayIso: string,
  groupOverride?: string,
  yearLabel?: string,
): Enrollment {
  // 💰 יתרה מהשנה הקודמת (בקשת-בעלים 25.8): ה-net **המלא** של-המקור עובר קדימה
  // כ-carryBalance — חיובי=חוב, שלילי=זכות ("גם עם יש יתרת-זכות זה צריך לעבור").
  // הנוסחה זהה ל-payBal אבל בלי max(0) ⇒ שומרת את הסימן. הקבלות/התשלומים של-
  // אשתקד נשארים על-השיבוץ-הישן (רציפות R-/§46) — פה רק ההפרש עובר לשנה החדשה.
  const carry = (src.totalDue || 0) + (src.carryBalance || 0) - paidOf(src);
  return {
    id: newId,
    memberId: src.memberId,
    courseId: targetCourseId,
    plan: src.plan,
    purchased: 0,
    used: 0,
    // ‏groupOverride: מנהל-העבודה בחר קבוצה ברישום. undefined ⇒ אותה קבוצה של אשתקד.
    group: groupOverride ?? src.group,
    absences: [],
    payments: [],
    totalDue: src.totalDue,
    dueDate: '',
    status: 'active',
    // הערת-התלמיד/ה עוברת קדימה (בקשת-בעלים 24.8) — הרישום ממשיך את הסיפור.
    note: src.note || '',
    enrolledAt: todayIso,
    // תווית שנת-הלימודים — לסינון-פנימי בכרטיס-החוג (תשפ״ז/תשפ״ח).
    ...(yearLabel ? { year: yearLabel } : {}),
    // יתרה-מועברת: רק אם קיימת בפועל (חיובי=חוב · שלילי=זכות · 0/חסר = ביט-זהה
    // לשיבוץ ישן, קל למיגרציה).
    ...(carry !== 0 ? { carryBalance: carry } : {}),
    // תמחור משוקלל — נשמר כדי שהמחיר יעבור לשנה הבאה כמו שהיה.
    ...(src.freq !== undefined ? { freq: src.freq } : {}),
    ...(src.freqUnit !== undefined ? { freqUnit: src.freqUnit } : {}),
    ...(src.term !== undefined ? { term: src.term } : {}),
    ...(src.termMonths !== undefined ? { termMonths: src.termMonths } : {}),
    ...(src.tier !== undefined ? { tier: src.tier } : {}),
  };
}

/**
 * טיוטת-חוג טהורה לשנה הבאה — עותק של החוג עם תאריכים מוזזים בשנה, תווית-שנה
 * וקישור-לחוג-הקודם. ה-id מוזרק מבחוץ. שומר את ההיסטוריה (החוג הישן לא נגע).
 */
export function nextYearCourseDraft(src: Course, newId: string): Course {
  const { start, end } = nextYearDates(src.start, src.end);
  return {
    ...src,
    id: newId,
    start,
    end,
    year: academicYearLabel(start),
    prevYearId: src.id,
  };
}

// ---------- היסטוריית-תלמיד (איפה השתתף ומתי — חוצה-חוגים/שנים) ----------

export interface StudentHistoryEntry {
  enrollment: Enrollment;
  courseId: string;
  courseName: string;
  group: string;
  /** תווית שנת-לימודים (החוג.year אם קיים, אחרת מחושב מתאריך-הפתיחה). */
  yearLabel: string;
  /** תאריך-פתיחת החוג (ISO) — לצורך מיון וכיתוב. */
  start: string;
  end: string;
  summary: EnrollSummary;
  /** האם שיבוץ זה נולד מרישום-לשנה-הבאה (מישהו הצביע אליו ב-renewedToId). */
  fromRenewal: boolean;
  /** האם שיבוץ זה כבר חודש קדימה (יש לו renewedToId). */
  renewedForward: boolean;
}

/**
 * כל ההשתתפויות של תלמיד/ה לאורך הזמן — שיבוץ אחר שיבוץ בכל החוגים והשנים,
 * ממויין מהחדש לישן לפי תאריך-פתיחת-החוג (שובר-שוויון: enrolledAt). דטרמיניסטי,
 * נגזר מהשדות הקיימים בלבד. "איפה השתתף ומתי" — courseName + yearLabel + תאריכים.
 */
export function studentHistory(db: Db, memberId: string): StudentHistoryEntry[] {
  // מזהי-שיבוצים שמישהו התחדש אליהם (יעד-רישום) — לזיהוי fromRenewal.
  const renewTargetIds = new Set(db.enrollments.map((e) => e.renewedToId).filter(Boolean) as string[]);
  const out: StudentHistoryEntry[] = [];
  for (const e of db.enrollments) {
    if (e.memberId !== memberId) continue;
    const course = db.courses.find((c) => c.id === e.courseId) ?? null;
    const start = course?.start ?? '';
    out.push({
      enrollment: e,
      courseId: e.courseId,
      courseName: course?.name ?? '—',
      group: e.group || '',
      yearLabel: course?.year || (start ? academicYearLabel(start) : ''),
      start,
      end: course?.end ?? '',
      summary: enrollSummary(e),
      fromRenewal: renewTargetIds.has(e.id),
      renewedForward: !!e.renewedToId,
    });
  }
  // מהחדש לישן — תאריך-פתיחת-החוג יורד, ואז enrolledAt יורד.
  out.sort((a, b) => (b.start || '').localeCompare(a.start || '') || (b.enrollment.enrolledAt || '').localeCompare(a.enrollment.enrolledAt || ''));
  return out;
}

/** טקסט קריא של ההיסטוריה (שורה להשתתפות) — לתדפיס/העתקה. */
export function studentHistoryText(entries: StudentHistoryEntry[]): string {
  return entries
    .map((h) => {
      const yr = h.yearLabel ? `[${h.yearLabel}] ` : '';
      const grp = h.group ? ` · ${h.group}` : '';
      return `${yr}${h.courseName}${grp} — נוכחות ${h.summary.presents}, חיסורים ${h.summary.absences} · ${h.summary.statusLabel}`;
    })
    .join('\n');
}

// ---------- ייצוא (דרך שער core.export ב-UI) ----------

/** שורות CSV לרשימת-הרישום (כותרת + נתונים). */
export function reenrollCsvRows(rows: ReenrollRow[]): string[][] {
  const head = ['תלמיד/ה', 'משפחה', 'חוג', 'נוכחות', 'חיסורים', 'יתרה ₪', 'סטטוס', 'החלטה', 'נרשם לשנה הבאה', 'הערה'];
  const decWord = (d: RenewDecision) => (d === 'yes' ? 'ממשיך' : d === 'no' ? 'לא ממשיך' : d === 'hold' ? 'בהמתנה' : '');
  const body = rows.map((r) => [
    r.memberName,
    r.familyName,
    r.courseName,
    String(r.summary.presents),
    String(r.summary.absences),
    String(r.summary.balance),
    r.summary.statusLabel,
    decWord(r.decision),
    r.renewed ? 'כן' : '',
    r.e.renewNote ?? '',
  ]);
  return [head, ...body];
}

/** טקסט-תדפיס קריא (שורה לתלמיד/ה). */
export function reenrollListText(rows: ReenrollRow[]): string {
  const decWord = (d: RenewDecision) => (d === 'yes' ? 'ממשיך' : d === 'no' ? 'לא ממשיך' : d === 'hold' ? 'בהמתנה' : 'טרם הוחלט');
  return rows
    .map((r) => `${r.memberName} · ${r.courseName} — נוכחות ${r.summary.presents}, חיסורים ${r.summary.absences} · ${decWord(r.decision)}${r.renewed ? ' ✓נרשם' : ''}`)
    .join('\n');
}
