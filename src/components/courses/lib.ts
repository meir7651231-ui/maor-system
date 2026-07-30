/**
 * עזרי מודול הקורסים — ימים, מפגשים, תוויות מסלול ויתרות תשלום.
 * עזרים מקומיים בלבד — אין כאן גישה ל-store או ל-DOM.
 */
import type { CSSProperties } from 'react';
import type { Course, CourseSession, Db, Enrollment, Family, PricingModel, Room } from '../../types/domain';
import { normSearch } from '../../lib/validate';
import type { OrgConfig } from '../../types/config';
import { termOf } from '../../lib/config';
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

/**
 * ולידציית טווח תאריכי החוג — מחזיר הודעת שגיאה או null. תאריך סיום מוקדם
 * מתאריך התחלה גורם ל-courseActiveOn להיות false תמיד, כך שהחוג נעלם בשקט
 * מהיומן/הלוח/מפגשי-היום. נתפס בשמירה במקום להיעלם.
 */
export function courseDateError(start: string, end: string, config?: OrgConfig): string | null {
  if (start && end && end < start) {
    const courseWord = config ? termOf(config, 'entity.course', 'חוג') : 'חוג';
    return 'תאריך הסיום מוקדם מתאריך ההתחלה — ה' + courseWord + ' לא יופיע בלוח. תקנו את התאריכים';
  }
  return null;
}

/** גיל בשנים מלאות מתאריך לידה, או null אם אין תאריך. */
export function ageOf(birth: string): number | null {
  if (!birth) return null;
  // צהריים מקומי — new Date('YYYY-MM-DD') הוא חצות UTC, ובאזור זמן ממערב ל-UTC
  // הוא נופל ליום הקודם מקומית וגורם לגיל לסטות ביום סביב יום ההולדת.
  const d = new Date(birth.slice(0, 10) + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const md = n.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

/** שמות ימי הפעילות 0=ראשון … 5=שישי (אין פעילות בשבת). */
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'] as const;
export const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'] as const;

/** המפגשים בפועל — fallback למפגש יחיד מהשדות הראשיים (כמו sessionsOf במקור). */
export function sessionsOf(c: Course): CourseSession[] {
  return c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }];
}

/**
 * סינון תפקיד-מורה (P3 פריט 15, הכרעה 2): teacherId ⇒ רק החוגים שלה;
 * null (אין תפקיד/אין ענן) ⇒ הכל, כהתנהגות של היום.
 */
export function coursesOfTeacher(courses: Course[], teacherId: string | null): Course[] {
  return teacherId ? courses.filter((c) => c.teacherId === teacherId) : courses;
}

/* ---------- רצועת חדרים LIVE (P2 פער 27, feature courses.roomslive) ---------- */

export interface RoomNow {
  room: Room;
  /** החוג שמתקיים עכשיו בחדר — ריק = פנוי. */
  busyWith?: Course;
}

/**
 * מצב החדרים ברגע נתון — now מוזרק (טוהר): חדר פעיל תפוס כשמפגש של חוג
 * בחדר חל באותו יום-שבוע והשעה בתוך [תחילת המפגש, +משך המשבצת); ברירת
 * המחדל 60 דק׳ (slot של החדר כשמוגדר). חדרים מושבתים לא מוחזרים.
 */
export function roomsNow(db: Db, now: Date): RoomNow[] {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return db.rooms
    .filter((r) => r.active)
    .map((room) => {
      let busyWith: Course | undefined;
      for (const c of db.courses) {
        if (c.roomId !== room.id) continue;
        for (const s of sessionsOf(c)) {
          if (s.day !== day || !s.time) continue;
          const start = toMin(s.time);
          if (mins >= start && mins < start + (room.slot || 60)) {
            busyWith = c;
            break;
          }
        }
        if (busyWith) break;
      }
      return { room, busyWith };
    });
}

/** תווית קבוצה — label או "קבוצה N" לפי המיקום. */
export function groupLabelOf(ss: CourseSession, i: number): string {
  return ss.label || 'קבוצה ' + (i + 1);
}

/** אפשרויות שיוך קבוצה — רק כשיש יותר ממפגש אחד. */
export function groupOptionsOf(c: Course): { v: string; t: string }[] {
  const ss = sessionsOf(c);
  if (ss.length <= 1) return [];
  return ss.map((s, i) => {
    const v = groupLabelOf(s, i);
    return { v, t: `${v} · יום ${DAY_NAMES[s.day]} ${s.time || ''}`.trim() };
  });
}

/** שם המסלול (יחיד) — פורט מ-planWord באב-הטיפוס. */
export function planWord(model: PricingModel): string {
  return model === 'punch'
    ? 'כרטיסייה'
    : model === 'half_year'
      ? 'מנוי חצי-שנתי'
      : model === 'year'
        ? 'מנוי שנתי'
        : 'מנוי חודשי';
}

/** סיומת תקופת המחיר — "לחודש" / "לחצי שנה" / "לשנה" (פורט מ-pricePer). */
export function priceSuffix(model: PricingModel): string {
  return model === 'half_year' ? 'לחצי שנה' : model === 'year' ? 'לשנה' : model === 'punch' ? '' : 'לחודש';
}

/** תווית + צבעי מסלול התמחור. */
export function modelMeta(c: Course): { label: string; bg: string; c: string } {
  if (c.model === 'punch') return { label: 'כרטיסייה · ' + c.size + ' ניקובים', bg: '#fdf1d4', c: '#9a6414' };
  if (c.model === 'half_year') return { label: 'מנוי חצי-שנתי', bg: '#e7edf5', c: '#3a5a86' };
  if (c.model === 'year') return { label: 'מנוי שנתי', bg: '#efe7f3', c: '#7c3aed' };
  return { label: 'מנוי חודשי', bg: '#e4f5ea', c: '#12803c' };
}

/** סכום ששולם עד כה על השיבוץ — סכומים לא-מספריים (NaN מקלט פגום) נספרים כ-0. */
export function paidOf(e: Enrollment): number {
  return (e.payments || []).reduce((a, p) => a + (Number.isFinite(p.amount) ? p.amount : 0), 0);
}

/** יתרת חוב — max(0, סה"כ עסקה - שולם). */
export function payBal(e: Enrollment): number {
  return Math.max(0, (e.totalDue || 0) - paidOf(e));
}

/**
 * מספר המשובצים התופסים מקום בקורס — פעילים + מוקפאים. שיבוץ שהסתיים ('ended')
 * פינה את מקומו ולכן אינו נספר לתפוסה; אחרת קורס עם בוגרים רבים היה נראה "מלא"
 * וחוסם רישום חדש בשקר (JoinModal/EnrollModal), וגם התפוסה המוצגת הייתה מנופחת.
 */
export function enrollCount(db: Db, courseId: string): number {
  return db.enrollments.filter((e) => e.courseId === courseId && e.status !== 'ended').length;
}

/** המפגש הקרוב הבא של הקורס (לזכאות השלמה בחיסור — 48 שעות). */
export function nextSessionDate(c: Course): Date | null {
  const n = new Date();
  let best: Date | null = null;
  for (const ss of sessionsOf(c)) {
    const t = (ss.time || '17:00').split(':');
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    let add = (ss.day - d.getDay() + 7) % 7;
    if (add === 0 && d <= n) add = 7;
    d.setDate(d.getDate() + add);
    if (!best || d < best) best = d;
  }
  return best;
}

/** ערכי הבחירה בטופס — verbatim מהמקור; '__other' פותח הקלדה חופשית. */
export const OTHER = '__other';
export const OTHER_LABEL = 'אחר — הקלדה חופשית…';
export const ADD_TEACHER = '__add';
export const CAT_OPTIONS = ['מלאכה', 'אמנות', 'העשרה', 'ספורט', 'מוזיקה', 'רווחה', 'טיפוח', 'קולינרי', 'קהילה'];
export const SEMESTER_OPTIONS = ['שנתי', 'חצי שנתי'];
export const PAY_METHODS = ['מזומן', 'העברה בנקאית', "צ'ק", 'אשראי', 'ביט'];

/** גווני רקע לכרטיסי הקורסים (כמו tints במקור). */
export const TINTS = ['#f6ead1', '#e3eddc', '#dfe8f2', '#f2e0e4', '#e9dff0', '#ece8d9'];

/** תוויות סטטוס שיבוץ. */
export function enrollStatusMeta(e: Enrollment): { label: string; bg: string; c: string } {
  if (e.status === 'paused') return { label: 'מוקפא', bg: '#fdf1d4', c: '#9a6414' };
  if (e.status === 'ended') return { label: 'הסתיים', bg: '#eceae2', c: '#8b8474' };
  return { label: 'פעיל', bg: '#e4f5ea', c: '#12803c' };
}

/** תווית המסלול בשורת תלמיד — כולל הקפאה/סיום, חיסורים ויתרת חוב (כמו planLabel במקור). */
export function planLabelOf(e: Enrollment): string {
  let s = e.plan === 'punch' ? 'כרטיסייה · ' + e.purchased : planWord(e.plan);
  if (e.status === 'paused') s += ' · מוקפא ⏸';
  else if (e.status === 'ended') s += ' · הסתיים';
  if (e.absences.length) s += ' · ' + e.absences.length + ' חיס׳';
  const bal = payBal(e);
  if (bal > 0) s += ' · 💳 ₪' + bal;
  return s;
}

/** צ'יפ קטן בסגנון אחיד. */
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

/* ── סינון שיבוץ חכם (P1.7, feature courses.enroll.smartfilter) — הכרעה 3:
   היכולת הדטרמיניסטית של אשף הלגאסי (התאמת חוג לפי גיל/מגדר/יום) נכנסת דרך
   סינון רך בזרימת השיבוץ + מתג "הצג הכל" + אזהרת התנגשות לו"ז — לא כ-UI אשף. ── */

/** האם החוג מתאים לפי מגדר וגיל — נתון חסר אינו מסנן (סינון רך, לא חוסם). */
/* ---------- טווח כיתות (P2 פער 28, feature courses.gradeimg) ---------- */

/** סולם הכיתות — גן ואז א׳–י"ב. */
export const GRADE_ORDER = ['גן', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'] as const;

/** אינדקס כיתה בסולם — סובלני לגרשיים ולקידומת "כיתה"; לא מזוהה = ‎-1. */
export function gradeIndex(g: string | undefined): number {
  const clean = (g || '').replace(/["'׳״]/g, '').replace(/^כיתה\s*/, '').trim();
  if (!clean) return -1;
  return GRADE_ORDER.indexOf(clean as (typeof GRADE_ORDER)[number]);
}

/**
 * התאמת כיתה לחוג: אין טווח לחוג או שכיתת הילד/ה לא מזוהה ⇒ מתאים
 * (רך — לא מסתירים על סמך מידע חסר); אחרת נדרש בתוך [gradeMin, gradeMax].
 */
export function gradeFits(c: Course, childGrade: string | undefined): boolean {
  if (!c.gradeMin && !c.gradeMax) return true;
  const gi = gradeIndex(childGrade);
  if (gi < 0) return true;
  const lo = gradeIndex(c.gradeMin);
  const hi = gradeIndex(c.gradeMax);
  if (lo >= 0 && gi < lo) return false;
  if (hi >= 0 && gi > hi) return false;
  return true;
}

export function courseFitsMember(
  c: Course,
  gender: 'm' | 'f' | undefined,
  age: number | null,
  /** כיתת הילד/ה — מועברת רק כש-courses.gradeimg פעיל (פער 28). */
  grade?: string,
): boolean {
  if (c.gender && c.gender !== 'all' && gender && c.gender !== gender) return false;
  if (age != null) {
    if (c.ageMin && age < c.ageMin) return false;
    if (c.ageMax && age > c.ageMax) return false;
  }
  if (!gradeFits(c, grade)) return false;
  return true;
}

/**
 * אזהרת התנגשות לו"ז — מפגשי חוג-היעד מול מפגשי השיבוצים הפעילים של הילד
 * (אותו יום ואותה שעה). מחזירה טקסט אזהרה או null. מייעץ — לא חוסם.
 */
export function scheduleClashText(
  db: Pick<Db, 'courses' | 'enrollments'>,
  memberId: string,
  course: Course,
): string | null {
  const target = sessionsOf(course);
  for (const e of db.enrollments) {
    if (e.memberId !== memberId || e.status === 'ended' || e.courseId === course.id) continue;
    const other = db.courses.find((x) => x.id === e.courseId);
    if (!other) continue;
    for (const s1 of target) {
      for (const s2 of sessionsOf(other)) {
        if (s1.day === s2.day && !!s1.time && s1.time === s2.time) {
          return '⚠ התנגשות לו"ז: כבר משובצ/ת ל"' + other.name + '" — יום ' + DAY_NAMES[s1.day] + ' ' + s1.time;
        }
      }
    }
  }
  return null;
}

/* ── יצירת משפחה מתוך שיבוץ (P1.10, feature courses.enroll.inlinecreate) ──
   ratchet: legacy saveEnrollNew (legacy-main-script.js:1318-1339) — בחירת משפחה
   קיימת או '__new'; שם חדש שכבר קיים (normName) לא יוצר כפילות אלא משתמש
   בקיימת. הצעת '__new' מופיעה רק לשאילתה ≥2 תווים בלי התאמה מדויקת (legacy:2188). */

export const ENROLL_NEW_FAMILY = '__new';

/** נרמול שם להשוואה — כמו normName במקור. */
function normNameLocal(s: string): string {
  return normSearch(s).replace(/\s/g, '');
}

/** האם להציע "＋ משפחה חדשה" עבור השאילתה — ≥2 תווים ואין משפחה בשם זהה. */
export function offerNewFamily(families: Pick<Family, 'name'>[], q: string): boolean {
  const t = q.trim();
  return t.length >= 2 && !families.some((f) => normNameLocal(f.name) === normNameLocal(t));
}

/**
 * פתרון המשפחה לשיבוץ-חדש: id קיים ⇒ הקיימת; '__new' ⇒ דה-דופ לפי normName —
 * שם קיים משתמש בקיימת (create=false), אחרת יש ליצור חדשה (create=true).
 */
export function resolveEnrollFamily<F extends Pick<Family, 'id' | 'name'>>(
  families: F[],
  famSel: string,
  newFamName: string,
): { fam: F | null; create: boolean } {
  const existing = families.find((f) => f.id === famSel);
  if (existing) return { fam: existing, create: false };
  if (famSel === ENROLL_NEW_FAMILY && newFamName.trim()) {
    const dup = families.find((f) => normNameLocal(f.name) === normNameLocal(newFamName));
    if (dup) return { fam: dup, create: false };
    return { fam: null, create: true };
  }
  return { fam: null, create: false };
}

/* ── punchConfirm (P1.3, feature courses.punch.confirm) — אישור כפול לניקוב ──
   ratchet: legacy-main-script.js:330-342 (punch) — לחיצה ראשונה מזיינת
   ("לאשר ניקוב?"), timeout ‏3 שניות מפרק את הזריון; לחיצה שנייה על אותו שיבוץ
   בתוך החלון מבצעת. לחיצה על שיבוץ אחר מזיינת אותו מחדש. דגל כבוי = ביצוע מיידי. */

export const PUNCH_CONFIRM_MS = 3000;

/** זריון אישור-ניקוב — מזהה השיבוץ ורגע הזריון. */
export interface PunchArm {
  id: string;
  armedAt: number;
}

/**
 * צעד אחד במכונת-המצבים של האישור הכפול — טהור.
 * fire=true ⇒ לבצע את הניקוב עכשיו (והזריון מתנקה); אחרת לעדכן את הזריון ל-next.
 */
export function punchConfirmStep(
  confirmOn: boolean,
  armed: PunchArm | null,
  enrollmentId: string,
  now: number,
): { fire: boolean; next: PunchArm | null } {
  if (!confirmOn) return { fire: true, next: null };
  if (armed && armed.id === enrollmentId && now - armed.armedAt <= PUNCH_CONFIRM_MS) {
    return { fire: true, next: null };
  }
  // אין זריון / שיבוץ אחר / החלון פג — מזיינים (מחדש) את השיבוץ הנוכחי
  return { fire: false, next: { id: enrollmentId, armedAt: now } };
}
