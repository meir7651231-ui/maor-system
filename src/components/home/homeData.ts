/**
 * חישובי מסך הבית — פונקציות טהורות על ה-Db (ללא React).
 * כל הלוגיקה הנגזרת של לוח המחוונים מרוכזת כאן כדי שה-View יישאר תצוגה בלבד.
 */
import {
  HEBREW_RECURRING,
  type Course,
  type CourseSession,
  type Db,
  type EventType,
  type Family,
  type FamilyStatus,
  type OrgEvent,
} from '../../types/domain';
import { allMembers, type MemberWithFamily } from '../../store/useApp';
import { hebParts, hebPartsOfIso, hebAnnualEq } from '../../lib/hebrew';
import { payBal, sessionsOf } from '../courses/lib';
import { CRED_RED_THRESHOLD } from '../families/lib';
import { isoLocal } from '../../lib/date-util';
// תוויות/צבעי סוגי אירועים — מקור-אמת יחיד ב-lib/eventMeta (מיוצא מחדש לתאימות)
import { EV_META, evLabel } from '../../lib/eventMeta';
export { EV_META, evLabel };
import { DEFAULT_CONFIG } from '../../types/config';
import type { ModuleKey, OrgConfig } from '../../types/config';
import { featureOn, termOf } from '../../lib/config';
import { hokDue, supIls, supUsd } from '../supporters/lib';

/** מפת המודולים הפעילים (config.modules) — חסר = פעיל; false = כבוי. */
export type ModulesMap = OrgConfig['modules'];

/** ISO מקומי (מקור-אמת יחיד ב-date-util — ללא הזחת אזור זמן של toISOString). */
export function isoOf(d: Date): string {
  return isoLocal(d);
}

/** תצוגת תאריך DD/MM/YYYY מתוך ISO — ללא new Date (בטוח מאזורי זמן). */
export function fmtD(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;

/** תווית + צבעי סטטוס משפחה (verbatim מהמקור). */
export const ST_META: Record<FamilyStatus, { label: string; bg: string; c: string }> = {
  active: { label: 'פעילה', bg: '#e4f5ea', c: '#12803c' },
  pending: { label: 'ממתינה', bg: '#fdf1d4', c: '#9a6414' },
  inactive: { label: 'לא פעילה', bg: '#eceae2', c: '#8b8474' },
};



/** האם החוג פעיל בתאריך נתון (טווח start–end). */
export function courseActiveOn(c: Course, iso: string): boolean {
  return (!c.start || iso >= c.start) && (!c.end || iso <= c.end);
}

export interface TodaySession {
  course: Course;
  session: CourseSession;
}

/** מפגשי החוגים של היום — לפי יום בשבוע, רק חוגים בטווח פעילות. */
export function todaySessions(db: Db, now: Date): TodaySession[] {
  const iso = isoOf(now);
  const dow = now.getDay();
  const out: TodaySession[] = [];
  for (const c of db.courses) {
    if (!courseActiveOn(c, iso)) continue;
    for (const ss of sessionsOf(c)) if (ss.day === dow) out.push({ course: c, session: ss });
  }
  return out.sort((a, b) => (a.session.time || '').localeCompare(b.session.time || ''));
}


/**
 * אירועי הארגון החלים בתאריך נתון (לא כולל אירועים שסומנו "טופל"):
 * התאמה לועזית ישירה, או חזרה שנתית לפי התאריך העברי (אזכרה/נישואים/הולדת).
 */
export function eventsOnDate(db: Db, d: Date): OrgEvent[] {
  const iso = isoOf(d);
  const hp = hebParts(d);
  const out: OrgEvent[] = [];
  for (const ev of db.events) {
    if (ev.done || !ev.date) continue;
    let hit = ev.date === iso;
    if (!hit && HEBREW_RECURRING.has(ev.type) && iso > ev.date) {
      hit = hebAnnualEq(hebPartsOfIso(ev.date), hp);
    }
    if (hit) out.push(ev);
  }
  return out.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

export interface BirthdayHit {
  member: MemberWithFamily;
  age: number;
}

/**
 * ימי הולדת של בני משפחה בתאריך נתון — חזרה שנתית לפי התאריך העברי,
 * זהה בדיוק ליומן (calLib): נרמול אדר + גיל בשנים עבריות. כך יום ההולדת
 * נדלק באותו יום בבית וביומן, בעקביות עם אזכרות וימי נישואין.
 */
export function birthdaysOn(db: Db, d: Date): BirthdayHit[] {
  const iso = isoOf(d);
  const hp = hebParts(d);
  const out: BirthdayHit[] = [];
  for (const m of allMembers(db)) {
    if (!m.birth || iso <= m.birth) continue;
    const bh = hebPartsOfIso(m.birth);
    if (!hebAnnualEq(bh, hp)) continue;
    out.push({ member: m, age: hp.year - bh.year });
  }
  return out;
}

export interface HomeStats {
  famTotal: number;
  famActive: number;
  famPending: number;
  famInactive: number;
  membersTotal: number;
  childrenTotal: number;
  activeCourses: number;
  /** סה"כ חוגים (בקשת-בעלים 19.8 — כל הוספה נראית מיד בבית, לא רק "פעילים"). */
  coursesTotal: number;
  activeEnrollments: number;
  enrollTotal: number;
  eventsToday: number;
  eventsWeek: number;
  donIls: number;
  donUsd: number;
  supportersTotal: number;
  /** מונה אלמנות — פער 20 (בלגאסי homeStats כולל את הספירה הזו). */
  widows: number;
}

export function homeStats(db: Db, now: Date): HomeStats {
  const todayIso = isoOf(now);
  const members = allMembers(db);
  const weekIds = new Set<string>();
  let eventsToday = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const evs = eventsOnDate(db, d);
    if (i === 0) eventsToday = evs.length;
    for (const ev of evs) weekIds.add(ev.id);
  }
  // הכרעת-בעלים 9.8 (#14 "לכולל"): הצבירה המוצגת = קבלות+היסטוריה דרך supIls/supUsd —
  // אותו מקור-אמת כמו מסך התורמים (הבית הראה עד כה קבלות-בלבד ⇒ מספר שונה מהרשימה).
  let donIls = 0;
  let donUsd = 0;
  for (const sp of db.supporters) {
    donIls += supIls(sp);
    donUsd += supUsd(sp);
  }
  return {
    famTotal: db.families.length,
    famActive: db.families.filter((f) => f.status === 'active').length,
    famPending: db.families.filter((f) => f.status === 'pending').length,
    famInactive: db.families.filter((f) => f.status === 'inactive').length,
    membersTotal: members.length,
    childrenTotal: members.filter((m) => !m.isParent).length,
    activeCourses: db.courses.filter((c) => courseActiveOn(c, todayIso)).length,
    coursesTotal: db.courses.length,
    activeEnrollments: db.enrollments.filter((e) => e.status === 'active').length,
    enrollTotal: db.enrollments.length,
    eventsToday,
    eventsWeek: weekIds.size,
    donIls,
    donUsd,
    supportersTotal: db.supporters.length,
    widows: db.families.filter((f) => (f.maritalStatus || '').includes('אלמן')).length,
  };
}

/** משפחות אחרונות — לפי תאריך יצירה יורד. */
export function recentFamilies(db: Db, n = 5): Family[] {
  return db.families
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, n);
}

export type AttentionNav =
  | { kind: 'course'; id: string }
  | { kind: 'family'; id: string }
  /** חיווט-עומק (19.8): פתיחת כרטיס-תומך ספציפי (openSupporterCard) — לא רק הרשימה. */
  | { kind: 'supporter'; id: string }
  | { kind: 'supporters' }
  | { kind: 'calendar' };

/** חומרת פריט טיפול — קריטי מוצג לפני אזהרה. */
export type AttentionSev = 'crit' | 'warn';

export interface AttentionItem {
  key: string;
  tag: string;
  tagBg: string;
  tagC: string;
  title: string;
  sev: AttentionSev;
  nav: AttentionNav;
}

/** הפרש ימים בין שני תאריכי ISO (חיובי כאשר toIso מאוחר יותר). */
function daysBetween(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86_400_000,
  );
}


/**
 * פאנל "דורש טיפול":
 * אירועים בעדיפות אדומה שלא טופלו · חוגים בחדר כבוי ·
 * שיבוצים שעבר מועד התשלום שלהם · כרטיסיות שכמעט נגמרו ·
 * משפחות הממתינות לאישור · תורמים שעבר יעד הקשר שלהם ·
 * ספח ת"ז חסר · מדד אמינות אדום · חוגים שכמעט מלאים.
 * הפריטים ממוינים כך שהקריטיים מוצגים ראשונים.
 *
 * modules — חוזה המודולים (types/config.ts): פריטים של מודול כבוי מושמטים
 * (חוגים: room/debt/punch/fill · תורמים: supnext) בלי לגעת בנתונים עצמם.
 */
export function attentionItems(
  db: Db,
  now: Date,
  modules: ModulesMap,
  config: OrgConfig = DEFAULT_CONFIG,
): AttentionItem[] {
  const on = (m: ModuleKey) => modules[m] !== false;
  const todayIso = isoOf(now);
  const members = allMembers(db);
  const out: AttentionItem[] = [];

  // אירועים דחופים (עדיפות אדומה, לא טופלו)
  const reds = db.events.filter((e) => e.priority === 'red' && !e.done && e.date);
  reds.sort((a, b) => a.date.localeCompare(b.date));
  for (const ev of reds) {
    const [y, m, d] = ev.date.split('-').map(Number);
    const diff = Math.round(
      (new Date(y, m - 1, d).getTime() -
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
        86_400_000,
    );
    const when =
      diff === 0
        ? 'היום'
        : diff > 0 && diff <= 6
          ? 'יום ' + DAY_NAMES[new Date(y, m - 1, d).getDay()]
          : fmtD(ev.date);
    out.push({
      key: 'urgent:' + ev.id,
      tag: 'דחוף',
      tagBg: '#fdeaea',
      tagC: '#b91c1c',
      title: ev.title + ' — ' + when + (ev.time ? ' ' + ev.time : ''),
      sev: 'crit',
      // חיווט-עומק (19.8): אירוע מקושר-משפחה קופץ ישר לכרטיס; אחרת ללוח
      nav: ev.famId ? { kind: 'family', id: ev.famId } : { kind: 'calendar' },
    });
  }

  // חוגים המשויכים לחדר כבוי (מודול חוגים בלבד)
  for (const c of on('courses') ? db.courses : []) {
    const room = db.rooms.find((r) => r.id === c.roomId);
    if (room && !room.active) {
      out.push({
        key: 'room:' + c.id,
        tag: termOf(config, 'entity.room', 'חדר'),
        tagBg: '#fdeaea',
        tagC: '#b91c1c',
        title: `"${c.name}" משויך ל${termOf(config, 'entity.room', 'חדר')} כבוי (${room.name}) — הפעילו את ה${termOf(config, 'entity.room', 'חדר')} או העבירו את ה${termOf(config, 'entity.course', 'חוג')}`,
        sev: 'crit',
        nav: { kind: 'course', id: c.id },
      });
    }
  }

  // שיבוצים עם יתרת תשלום שעבר מועדה (שיבוצים = נתוני מודול החוגים)
  for (const e of on('courses') ? db.enrollments : []) {
    const bal = payBal(e); // מקור-אמת משותף (הגנת NaN + max(0)) — עקבי עם מסך הקורסים
    if (bal > 0 && e.dueDate && e.dueDate < todayIso) {
      const m = members.find((x) => x.id === e.memberId);
      const c = db.courses.find((x) => x.id === e.courseId);
      out.push({
        key: 'debt:' + e.id,
        tag: 'תשלום',
        tagBg: '#fdeee0',
        tagC: '#b45309',
        title:
          `יתרת ₪${bal} — ${m?.first ?? ''} (${m?.famName ?? ''}) · ${c?.name ?? ''}` +
          ` · עבר המועד ${fmtD(e.dueDate)}`,
        sev: 'warn',
        nav: m ? { kind: 'family', id: m.famId } : { kind: 'calendar' },
      });
    }
  }

  // כרטיסיות שכמעט נוצלו (נותר ניקוב אחד או פחות) — מודול חוגים בלבד
  const low = (on('courses') ? db.enrollments : [])
    .filter(
      (e) => e.plan === 'punch' && e.status === 'active' && e.purchased > 0 && e.used >= e.purchased - 1,
    )
    .map((e) => ({ e, rem: e.purchased - e.used }))
    .sort((a, b) => a.rem - b.rem);
  for (const { e, rem } of low) {
    const m = members.find((x) => x.id === e.memberId);
    const c = db.courses.find((x) => x.id === e.courseId);
    out.push({
      key: 'punch:' + e.id,
      tag: 'יתרה',
      tagBg: '#efe7f3',
      tagC: '#7c3aed',
      title:
        `${m?.first ?? ''} (${m?.famName ?? ''}) — ` +
        (rem <= 0 ? 'הכרטיסייה נגמרה' : 'נשאר ניקוב אחד') +
        ` ב${c?.name ?? ''}`,
      sev: 'warn',
      nav: m ? { kind: 'family', id: m.famId } : { kind: 'calendar' },
    });
  }

  // משפחות הממתינות לאישור — פריט מצטבר אחד עם ותק ההמתנה הארוך ביותר
  const pending = db.families.filter((f) => f.status === 'pending' && f.createdAt);
  if (pending.length) {
    const oldest = pending.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b));
    const wait = Math.max(0, daysBetween(oldest.createdAt, todayIso));
    out.push({
      key: 'pending:families',
      tag: 'אישור',
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title:
        pending.length === 1
          ? `${termOf(config, 'entity.family', 'משפחה')} אחת ממתינה לאישור · ${wait} ימים`
          : `${pending.length} ${termOf(config, 'nav.families', 'משפחות')} ממתינות לאישור · הוותיקה ממתינה ${wait} ימים`,
      sev: 'warn',
      nav: { kind: 'family', id: oldest.id },
    });
  }

  // תורמים שעבר יעד הקשר שלהם — פריט לכל תורם (עד 3), אחר כך צבירה — מודול תורמים בלבד
  const lateSup = (on('supporters') ? db.supporters : [])
    .filter((sp) => sp.nextDate && sp.nextDate < todayIso)
    .map((sp) => ({ sp, late: daysBetween(sp.nextDate, todayIso) }))
    .sort((a, b) => b.late - a.late);
  for (const { sp, late } of lateSup.slice(0, 3)) {
    const crit = late > 7;
    out.push({
      key: 'supnext:' + sp.id,
      tag: termOf(config, 'entity.supporter', 'תורם'),
      tagBg: crit ? '#fdeaea' : '#fdf1d4',
      tagC: crit ? '#b91c1c' : '#9a6414',
      title: `יעד קשר — ${sp.name} · באיחור ${late} ימים`,
      sev: crit ? 'crit' : 'warn',
      // חיווט-עומק (19.8): ישר לכרטיס-התומך — בלי לחפש אותו ברשימה
      nav: { kind: 'supporter', id: sp.id },
    });
  }
  if (lateSup.length > 3) {
    out.push({
      key: 'supnext:more',
      tag: termOf(config, 'entity.supporter', 'תורם'),
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title: `+${lateSup.length - 3} תורמים נוספים עברו יעד קשר`,
      sev: 'warn',
      nav: { kind: 'supporters' },
    });
  }

  // 🔁 הו"ק שטרם נרשמו החודש (ROADMAP-100 ‏#2) — פריט מצטבר אחד, מודול תורמים +
  // דגל supporters.hok; "נרשמה" = תרומת-החודש בקטגוריית הו"ק / בסכום-ההוראה.
  if (on('supporters') && featureOn(config, 'supporters.hok')) {
    const due = hokDue(db.supporters, todayIso);
    if (due.length) {
      out.push({
        key: 'hokdue:' + todayIso.slice(0, 7),
        tag: 'הו"ק',
        tagBg: '#e8f0fb',
        tagC: '#1d4ed8',
        title: `הוראות-קבע של החודש שטרם נרשמו: ${due.length} (${due.slice(0, 3).map((s) => s.name).join(', ')}${due.length > 3 ? '…' : ''})`,
        sev: 'warn',
        nav: { kind: 'supporters' },
      });
    }
  }

  // ספח ת"ז חסר — משפחות פעילות ללא ספח מלא, פריט מצטבר
  const noSefach = db.families.filter((f) => f.status === 'active' && f.fullSefach === false);
  if (noSefach.length) {
    out.push({
      key: 'sefach:families',
      tag: 'מסמך',
      tagBg: '#e7edf5',
      tagC: '#3a5a86',
      title:
        noSefach.length === 1
          ? `${termOf(config, 'entity.family', 'משפחה')} אחת ללא ספח ת"ז מלא`
          : `${noSefach.length} ${termOf(config, 'nav.families', 'משפחות')} ללא ספח ת"ז מלא`,
      sev: 'warn',
      nav: { kind: 'family', id: noSefach[0].id },
    });
  }

  // מדד אמינות אדום — מתחת לסף הסיכון המשותף (יישור ללגאסי: red <500), פריט מצטבר
  const redCred = db.families.filter((f) => (f.cred?.score ?? 700) < CRED_RED_THRESHOLD);
  if (redCred.length) {
    out.push({
      key: 'redcred:families',
      tag: 'סיכון',
      tagBg: '#fdeaea',
      tagC: '#b91c1c',
      title:
        redCred.length === 1
          ? `${termOf(config, 'entity.family', 'משפחה')} אחת במדד אמינות אדום`
          : `${redCred.length} ${termOf(config, 'nav.families', 'משפחות')} במדד אמינות אדום`,
      sev: 'crit',
      nav: { kind: 'family', id: redCred[0].id },
    });
  }

  // חוגים שכמעט מלאים (80% ומעלה מהמקומות) — פריט לכל חוג (עד 3), אחר כך צבירה — מודול חוגים בלבד
  // ספירת תפוסה מראש במעבר יחיד (O(E)) — זהה ל-enrollCount (מחריג 'ended') אך ללא
  // סריקה מלאה לכל חוג, שהפכה את הלולאה ל-O(C×E) בכל כתיבה ל-DB.
  const enrollByCourse = new Map<string, number>();
  for (const e of on('courses') ? db.enrollments : []) {
    if (e.status !== 'ended') enrollByCourse.set(e.courseId, (enrollByCourse.get(e.courseId) ?? 0) + 1);
  }
  const filling = (on('courses') ? db.courses : [])
    .filter((c) => c.maxStudents > 0)
    .map((c) => ({ c, n: enrollByCourse.get(c.id) ?? 0 }))
    .filter(({ c, n }) => n >= c.maxStudents * 0.8)
    .sort((a, b) => b.n / b.c.maxStudents - a.n / a.c.maxStudents);
  for (const { c, n } of filling.slice(0, 3)) {
    const full = n >= c.maxStudents;
    out.push({
      key: 'fill:' + c.id,
      tag: full ? 'מלא' : 'מתמלא',
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title: `${termOf(config, 'entity.course', 'חוג')} ${c.name} — ${n}/${c.maxStudents}` + (full ? ' · מלא!' : ''),
      sev: 'warn',
      nav: { kind: 'course', id: c.id },
    });
  }
  if (filling.length > 3) {
    out.push({
      key: 'fill:more',
      tag: 'מתמלא',
      tagBg: '#fdf1d4',
      tagC: '#9a6414',
      title: `+${filling.length - 3} ${termOf(config, 'nav.courses', 'חוגים')} נוספים כמעט מלאים`,
      sev: 'warn',
      nav: { kind: 'course', id: filling[3].c.id },
    });
  }

  // קריטי קודם — מיון יציב שומר על הסדר הפנימי בכל קבוצה
  return out.sort((a, b) => (a.sev === b.sev ? 0 : a.sev === 'crit' ? -1 : 1));
}

/** תאריך ISO מקומי במרחק ימים נתון מ-now. */
function isoAddDays(now: Date, days: number): string {
  return isoOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days));
}

/** שורה בתקציר הבוקר — טקסט + יעד ניווט. */
export interface DigestLine {
  key: string;
  text: string;
  /** שורת "שבוע דחוף" — מודגשת באדום בראש התקציר. */
  urgent?: boolean;
  nav: AttentionNav;
}

/**
 * "תקציר הבוקר" — עד 6 שורות קומפקטיות (פורט מהאב-טיפוס):
 * כרטיסיות שכמעט נגמרו · משפחות ממתינות · מפגשי היום ·
 * תזכורות טלפון פתוחות · אירועים מיוחדים השבוע · ימי הולדת היום.
 * כשיש פריטים קריטיים ב"דורש טיפול" — שורת "שבוע דחוף" נוספת בראש.
 * סימוני "טופל" (attnDone) מוחרגים מספירת הקריטיים.
 *
 * modules — חוזה המודולים: שורות של מודול כבוי מושמטות (חוגים: punch/today),
 * וספירת הקריטיים עוברת דרך attentionItems עם אותה מפה — כך אין אי-התאמה.
 */
export function digestLines(
  db: Db,
  now: Date,
  modules: ModulesMap,
  config: OrgConfig = DEFAULT_CONFIG,
): DigestLine[] {
  const on = (m: ModuleKey) => modules[m] !== false;
  const members = allMembers(db);
  const out: DigestLine[] = [];

  // שבוע דחוף — פריטים קריטיים שטרם סומנו כטופלו
  const done = db.attnDone ?? {};
  const crit = attentionItems(db, now, modules, config).filter((a) => a.sev === 'crit' && !done[a.key]);
  if (crit.length) {
    out.push({
      key: 'urgent',
      urgent: true,
      text:
        crit.length === 1
          ? '⚠ שבוע דחוף — פריט קריטי אחד דורש טיפול'
          : `⚠ שבוע דחוף — ${crit.length} פריטים קריטיים דורשים טיפול`,
      nav: crit[0].nav,
    });
  }

  // כרטיסייה שכמעט נגמרה — כדאי להציע חידוש (מודול חוגים בלבד)
  const low = (on('courses') ? db.enrollments : [])
    .filter(
      (e) => e.plan === 'punch' && e.status === 'active' && e.purchased > 0 && e.used >= e.purchased - 1,
    )
    .map((e) => ({ e, rem: e.purchased - e.used }))
    .sort((a, b) => a.rem - b.rem);
  if (low.length) {
    const { e, rem } = low[0];
    const m = members.find((x) => x.id === e.memberId);
    const c = db.courses.find((x) => x.id === e.courseId);
    const what =
      rem <= 0 ? 'נגמרה הכרטיסייה' : rem === 1 ? 'נשאר ניקוב אחד' : `נשארו ${rem} ניקובים`;
    out.push({
      key: 'punch',
      text:
        `ל${m?.first ?? ''} ${m?.famName ?? ''} ${what} ב${c?.name ?? ''} — כדאי להציע חידוש` +
        (low.length > 1 ? ` (+${low.length - 1} נוספים)` : ''),
      nav: m ? { kind: 'family', id: m.famId } : { kind: 'calendar' },
    });
  }

  // משפחות ממתינות לאישור
  const pend = db.families.filter((f) => f.status === 'pending');
  if (pend.length) {
    out.push({
      key: 'pending',
      text:
        pend.length === 1
          ? `${termOf(config, 'entity.family', 'משפחה')} אחת ממתינה לאישור: ${pend[0].name}`
          : `${pend.length} ${termOf(config, 'nav.families', 'משפחות')} ממתינות לאישור: ${pend.map((f) => f.name).slice(0, 3).join(', ')}`,
      nav: { kind: 'family', id: pend[0].id },
    });
  }

  // מפגשי החוגים של היום (מודול חוגים בלבד)
  const sessions = on('courses') ? todaySessions(db, now) : [];
  if (sessions.length) {
    out.push({
      key: 'today',
      text:
        'היום: ' +
        sessions
          .map((ts) => ts.course.name + (ts.session.time ? ' ב-' + ts.session.time : ''))
          .join(' · '),
      nav: { kind: 'course', id: sessions[0].course.id },
    });
  }

  // תזכורות טלפון פתוחות (עד מחר)
  const calls = db.events.filter(
    (e) => e.type === 'call' && !e.done && !!e.date && e.date <= isoAddDays(now, 1),
  );
  if (calls.length) {
    out.push({
      key: 'calls',
      text:
        'תזכורות טלפון פתוחות: ' +
        calls[0].title +
        (calls.length > 1 ? ` (+${calls.length - 1} נוספות)` : ''),
      nav: { kind: 'calendar' },
    });
  }

  // אירועים מיוחדים השבוע (עד 2)
  const SPECIAL: ReadonlySet<EventType> = new Set([
    'wedding',
    'memorial',
    'anniversary',
    'bday',
  ] as EventType[]);
  const specials: string[] = [];
  for (let i = 0; i < 7 && specials.length < 2; i++) {
    const dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    for (const ev of eventsOnDate(db, dd)) {
      if (SPECIAL.has(ev.type) && specials.length < 2) {
        specials.push(`${evLabel(ev)} ביום ${DAY_NAMES[dd.getDay()]}: ${ev.title}`);
      }
    }
  }
  if (specials.length) {
    out.push({ key: 'specials', text: 'מיוחדים השבוע — ' + specials.join(' · '), nav: { kind: 'calendar' } });
  }

  // ימי הולדת היום
  const bd = birthdaysOn(db, now);
  if (bd.length) {
    out.push({
      key: 'bday',
      text:
        `יום הולדת היום ל${bd[0].member.first} (${termOf(config, 'entity.familyOf', 'משפחת')} ${bd[0].member.famName})` +
        (bd.length > 1 ? ` +${bd.length - 1} נוספים` : ''),
      nav: { kind: 'family', id: bd[0].member.famId },
    });
  }

  if (!out.length) {
    out.push({ key: 'quiet', text: 'הכל מעודכן — אין משימות דחופות הבוקר', nav: { kind: 'calendar' } });
  }
  return out;
}

/* ── נגזרות חזותיות חדשות (מוקאפים) — כולן מנתונים אמיתיים בלבד ── */

/** מפתח חודש YYYY-MM במרחק delta חודשים מהעוגן. */
function monthKeyOf(anchor: Date, delta: number): string {
  const d = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * סדרה חודשית ל-months החודשים האחרונים (ישן→חדש, האחרון = החודש הנוכחי) —
 * לספארקליין בכרטיסי הנתונים. נקודות ללא תאריך תקין נזרקות; אין המצאת נתונים.
 */
export function monthlySeries(
  points: readonly { date: string; value: number }[],
  now: Date,
  months = 6,
): number[] {
  const idx = new Map<string, number>();
  for (let i = 0; i < months; i++) idx.set(monthKeyOf(now, i - (months - 1)), i);
  const out = Array.from({ length: months }, () => 0);
  for (const p of points) {
    const i = idx.get((p.date || '').slice(0, 7));
    if (i !== undefined) out[i] += p.value;
  }
  return out;
}

/**
 * סכום תרומות השקל בחודש הנוכחי — לצ'יפ המגמה בכרטיס התרומות.
 * הכרעת-בעלים 9.8 (#14 "לכולל"): גם רשומות היסטוריה (hist) של החודש נספרות —
 * עקבי עם supIls; הדוח-השנתי-לתורם (מסמך-מס) נשאר קבלות-בלבד.
 */
export function monthDonationSum(db: Db, now: Date): number {
  const key = monthKeyOf(now, 0);
  let sum = 0;
  for (const sp of db.supporters) {
    for (const dn of sp.donations) if (dn.cur !== '$' && dn.date.startsWith(key)) sum += dn.amount;
    for (const h of sp.hist ?? []) if (h.c !== '$' && (h.d || '').startsWith(key)) sum += h.a;
  }
  return sum;
}

/** סיכום מדד האמינות הקהילתי — ממוצע (כמו בקיר ההשפעה) + ספירה לכל דרגה. */
export interface CredSummary {
  avg: number;
  /** ספירות לפי מפתח דרגה (titan/lion/pale/red) — reuse של tierOf ממודול המשפחות. */
  counts: Record<'titan' | 'lion' | 'pale' | 'red', number>;
  total: number;
}

export function credSummary(db: Db, tierKeyOf: (score: number) => 'titan' | 'lion' | 'pale' | 'red'): CredSummary {
  const counts = { titan: 0, lion: 0, pale: 0, red: 0 };
  let sum = 0;
  for (const f of db.families) {
    const score = f.cred?.score ?? 700;
    sum += score;
    counts[tierKeyOf(score)]++;
  }
  const total = db.families.length;
  return { avg: total > 0 ? Math.round(sum / total) : 0, counts, total };
}

/* ── פער 19 · מדדי חוגים והכנסה (home.coursemetrics) ─────────────────────────
 * נאמן ללגאסי crsG (legacy-main-script.js:2630-2654): תפוסה פר-חוג מול
 * maxStudents (ברירת מחדל 12), ממוצע, הכנסה חודשית משוקללת — רק שיבוצים
 * פעילים: monthly=מחיר · half_year=/6 · year=/12 · punch=0. */

export interface CourseOccupancy {
  course: Course;
  /** מספר השיבוצים (כמו בלגאסי — כל השיבוצים לחוג, לא רק פעילים). */
  n: number;
  max: number;
  /** אחוז תפוסה, קטום ל-100. */
  pct: number;
}

export function courseOccupancies(db: Db): CourseOccupancy[] {
  return db.courses.map((c) => {
    const n = db.enrollments.filter((e) => e.courseId === c.id).length;
    const max = c.maxStudents || 12;
    return { course: c, n, max, pct: Math.min(100, Math.round((n / max) * 100)) };
  });
}

/** ההכנסה החודשית המשוקללת — שיבוצים פעילים בלבד (הנוסחה מהלגאסי, שורה 2640). */
export function weightedMonthlyIncome(db: Db): number {
  let sum = 0;
  for (const e of db.enrollments) {
    if ((e.status || 'active') !== 'active') continue;
    const c = db.courses.find((x) => x.id === e.courseId);
    if (!c) continue;
    const p = c.price || 0;
    sum += c.model === 'monthly' ? p : c.model === 'half_year' ? p / 6 : c.model === 'year' ? p / 12 : 0;
  }
  return sum;
}

export interface CourseMetrics {
  rows: CourseOccupancy[];
  /** ממוצע תפוסה באחוזים (0 כשאין חוגים). */
  avgOcc: number;
  students: number;
  income: number;
  fullCount: number;
  punchCount: number;
  monthlyCount: number;
  /** שלושת המבוקשים — לפי תפוסה יורדת. */
  top: CourseOccupancy[];
}

export function courseMetrics(db: Db): CourseMetrics {
  const rows = courseOccupancies(db);
  const avgOcc = Math.round(rows.reduce((a, r) => a + r.pct, 0) / Math.max(1, rows.length));
  return {
    rows,
    avgOcc,
    students: db.enrollments.length,
    income: weightedMonthlyIncome(db),
    fullCount: rows.filter((r) => r.pct >= 100).length,
    punchCount: rows.filter((r) => r.course.model === 'punch').length,
    monthlyCount: rows.filter((r) => r.course.model === 'monthly').length,
    top: rows.slice().sort((a, b) => b.pct - a.pct).slice(0, 3),
  };
}

/* ── פער 20 · מדדי אמינות מורחבים (home.credmetrics) ─────────────────────────
 * נאמן ללגאסי credV: היסטוגרמת 20 סלים של 50 נק', מגמת-היום (סכום דלתאות
 * מרשומות לוג של היום), ו"דורשות חיזוק" — הציונים הנמוכים ביותר. */

/** היסטוגרמה — 20 סלים של 50 נקודות (0-49, 50-99, …, 950-1000). */
export function credHistogram(db: Db): number[] {
  const bins = Array.from({ length: 20 }, () => 0);
  for (const f of db.families) {
    const score = f.cred?.score ?? 700;
    bins[Math.min(19, Math.floor(score / 50))]++;
  }
  return bins;
}

/** סכום דלתאות הניקוד שנרשמו היום — "מגמת היום" של הלגאסי. */
export function credTodayTrend(db: Db, todayIso: string): number {
  let sum = 0;
  for (const f of db.families) {
    for (const e of f.cred?.log ?? []) if (e.date === todayIso) sum += e.delta;
  }
  return sum;
}

export interface CredRiskFamily {
  family: Family;
  score: number;
}

/** "דורשות חיזוק" — המשפחות עם הציון הנמוך ביותר (לגאסי: risk, 3 ראשונות). */
export function credNeedsBoost(db: Db, n = 3): CredRiskFamily[] {
  return db.families
    .map((f) => ({ family: f, score: f.cred?.score ?? 700 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n);
}

/** תורם עם יעד קשר שהגיע/עבר — לווידג'ט "יעדי קשר". */
export interface DueContact {
  id: string;
  name: string;
  date: string;
  phone: string;
  /** ימי איחור (0 = היעד היום). */
  late: number;
}

/** יעדי קשר שהגיעו או עברו (nextDate ≤ היום), מהדחוף לפחות דחוף. */
export function dueContacts(db: Db, now: Date): DueContact[] {
  const todayIso = isoOf(now);
  return db.supporters
    .filter((sp) => sp.nextDate && sp.nextDate <= todayIso)
    .map((sp) => ({
      id: sp.id,
      name: sp.name,
      date: sp.nextDate,
      phone: sp.phone,
      late: Math.max(0, daysBetween(sp.nextDate, todayIso)),
    }))
    .sort((a, b) => b.late - a.late);
}

/** כרטיסייה שנותרו בה מעט ניקובים — לווידג'ט "מלאי כרטיסיות". */
export interface PunchLowItem {
  key: string;
  member: string;
  famName: string;
  course: string;
  left: number;
  total: number;
  nav: AttentionNav;
}

/** כרטיסיות פעילות עם ≤ maxLeft ניקובים שנותרו, מהנמוך לגבוה. */
export function punchLow(db: Db, maxLeft = 2): PunchLowItem[] {
  const members = allMembers(db);
  return db.enrollments
    .filter(
      (e) =>
        e.plan === 'punch' && e.status === 'active' && e.purchased > 0 && e.purchased - e.used <= maxLeft,
    )
    .map((e) => {
      const m = members.find((x) => x.id === e.memberId);
      return {
        key: e.id,
        member: m?.first ?? '',
        famName: m?.famName ?? '',
        course: db.courses.find((c) => c.id === e.courseId)?.name ?? '',
        left: Math.max(0, e.purchased - e.used),
        total: e.purchased,
        nav: (m ? { kind: 'family', id: m.famId } : { kind: 'calendar' }) as AttentionNav,
      };
    })
    .sort((a, b) => a.left - b.left);
}

/** פריט בקרוסלת האירועים הקרובים. */
export interface CarouselItem {
  key: string;
  icon: string;
  title: string;
  sub: string;
  cta: string;
  nav: AttentionNav;
}

/** אייקונים לקרוסלה — אזכרה 🕯️, יום הולדת 🎂, שאר השמחות 🎉. */
const CAR_ICONS: Partial<Record<EventType, string>> = { memorial: '🕯️', bday: '🎂' };

/**
 * קרוסלת 14 הימים הקרובים — ימי הולדת של בני משפחה (חזרה שנתית כמו
 * birthdaysOn) ואירועים מיוחדים (כולל חזרה עברית דרך eventsOnDate).
 * עד 10 פריטים, בסדר כרונולוגי.
 */
export function carouselItems(
  db: Db,
  now: Date,
  modules: ModulesMap = {},
  config: OrgConfig = DEFAULT_CONFIG,
): CarouselItem[] {
  const on = (m: ModuleKey) => modules[m] !== false;
  const SPECIAL: ReadonlySet<EventType> = new Set([
    'wedding',
    'memorial',
    'anniversary',
    'bday',
    'org',
    'custom',
  ] as EventType[]);
  const out: CarouselItem[] = [];
  for (let i = 0; i < 14 && out.length < 10; i++) {
    const dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const when = i === 0 ? 'היום!' : i === 1 ? 'מחר' : `בעוד ${i} ימים`;
    for (const b of on('families') ? birthdaysOn(db, dd) : []) {
      out.push({
        key: `bd:${b.member.id}:${i}`,
        icon: '🎂',
        title: `יום הולדת — ${b.member.first} (${b.age})`,
        sub: `${termOf(config, 'entity.familyOf', 'משפחת')} ${b.member.famName} · ${when}`,
        cta: 'לכרטיס המשפחה ←',
        nav: { kind: 'family', id: b.member.famId },
      });
    }
    for (const ev of on('calendar') ? eventsOnDate(db, dd) : []) {
      if (!SPECIAL.has(ev.type)) continue;
      out.push({
        key: `ev:${ev.id}:${i}`,
        icon: CAR_ICONS[ev.type] ?? '🎉',
        title: ev.title,
        sub: `${evLabel(ev)} · ${when}` + (ev.time ? ' · ' + ev.time : ''),
        cta: 'ללוח השנה ←',
        nav: { kind: 'calendar' },
      });
    }
  }
  return out.slice(0, 10);
}

/* ---------- מונה "דורש טיפול" של העמודות המבודדות (CONNECT חיבור 3) ---------- */

import { needsCare as tzNeedsCare } from '../tzedaka/lib';
import { needsCare as shopNeedsCare } from '../shop/lib';
import { pendingDeliveriesToday } from '../shop7/lib';
import { featureOn as featOn, moduleOn as modOn } from '../../lib/config';

/**
 * מונה פריטי-הטיפול של הקופות והחנות למסך הבית — **מונה-עם-קפיצה בלבד,
 * אין פירוט פריטים במסך הבית** (חריג-תצוגה מבוקר, הכרעת בעלים). מגודר
 * moduleOn + דגל home.crosscare; מודול/דגל כבויים ⇒ 0 (הצ'יפ לא מוצג).
 */
export function careCounts(db: Db, todayIso: string, config: OrgConfig): { tzedaka: number; shop: number; shop7: number } {
  if (!featOn(config, 'home.crosscare')) return { tzedaka: 0, shop: 0, shop7: 0 };
  return {
    tzedaka: modOn(config, 'tzedaka') ? tzNeedsCare(db, todayIso).length : 0,
    shop: modOn(config, 'shop') ? shopNeedsCare(db, todayIso).length : 0,
    shop7: modOn(config, 'shop7') ? pendingDeliveriesToday(db, todayIso).length : 0,
  };
}
